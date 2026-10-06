/**
 * UX-07 (contract 5.6): the seller's own priority at one account is an append-only audit row, newest wins, Undo is a
 * reversal row, "Not now" lapses on its date; it never writes do_not_contact and is stricter, never looser.
 */
import { describe, expect, it } from 'vitest';
import { loadSellerPreferences, NOT_NOW_MAX_DAYS, PERSON_SELLER_PREFERENCE, preferenceLine, setSellerPreference } from '@/lib/gap/people/seller-preference';

const NOW = new Date('2026-10-06T15:00:00Z');
type Row = { subject_id: string; actor: string; payload: Record<string, unknown>; created_at: Date; kind: string; subject_type: string };

function fakePrisma(rows: Row[]) {
  const created: Array<Record<string, unknown>> = [];
  return {
    created,
    persona: { findUnique: async ({ where }: { where: { id: number } }) => (where.id === 7 || where.id === 8 ? { id: where.id, account_name: 'PepsiCo' } : null) },
    gapAuditEvent: {
      findMany: async ({ where }: { where: { kind: string; payload: { path: string[]; equals: string } } }) =>
        rows
          .filter((r) => r.kind === where.kind && r.payload.accountName === where.payload.equals)
          .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
          .map((r) => ({ subject_id: r.subject_id, actor: r.actor, payload: r.payload, created_at: r.created_at })),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created.push(data);
        return { created_at: NOW };
      },
    },
  };
}
const row = (personaId: number, payload: Record<string, unknown>, at: string, actor = 'casey@freightroll.com'): Row => ({ kind: PERSON_SELLER_PREFERENCE, subject_type: 'persona', subject_id: String(personaId), actor, payload: { accountName: 'PepsiCo', source: 'human', ...payload }, created_at: new Date(at) });

describe('loadSellerPreferences', () => {
  it('the newest row per person wins; a clear reads as no preference; a lapsed Not now reads as none', async () => {
    const p = fakePrisma([
      row(7, { kind: 'not_a_fit', reason: 'procurement, not operations' }, '2026-10-01T00:00:00Z'),
      row(7, { kind: 'clear' }, '2026-10-02T00:00:00Z'),
      row(8, { kind: 'not_now', until: '2026-10-03T00:00:00Z', reason: 'on leave' }, '2026-09-20T00:00:00Z'),
      row(9, { kind: 'not_now', until: '2026-11-05T00:00:00Z', reason: null }, '2026-10-05T00:00:00Z'),
    ]);
    const m = await loadSellerPreferences(p, 'PepsiCo', NOW);
    expect(m.has(7)).toBe(false);
    expect(m.has(8)).toBe(false);
    expect(m.get(9)).toMatchObject({ personaId: 9, accountName: 'PepsiCo', kind: 'not_now', until: '2026-11-05T00:00:00Z', reason: null, by: 'casey@freightroll.com' });
    expect(preferenceLine(m.get(9)!)).toBe('Not now until Nov 4, you, Oct 4.');
  });
  it('a later not-a-fit after a clear stands again, with its reason in the line', async () => {
    const p = fakePrisma([row(7, { kind: 'clear' }, '2026-10-02T00:00:00Z'), row(7, { kind: 'not_a_fit', reason: 'buys software, not yards' }, '2026-10-04T12:00:00Z')]);
    const m = await loadSellerPreferences(p, 'PepsiCo', NOW);
    expect(preferenceLine(m.get(7)!)).toBe('Not a fit here (buys software, not yards), you, Oct 4.');
  });
  it('is scoped to the account: a preference at another account never reads here', async () => {
    const p = fakePrisma([{ ...row(7, { kind: 'not_a_fit' }, '2026-10-01T00:00:00Z'), payload: { accountName: 'Kroger', kind: 'not_a_fit' } }]);
    expect((await loadSellerPreferences(p, 'PepsiCo', NOW)).size).toBe(0);
  });
});

describe('setSellerPreference', () => {
  it('appends a row with the account from the persona, never do_not_contact; clear returns no preference', async () => {
    const p = fakePrisma([]);
    const r = await setSellerPreference(p, { personaId: 7, kind: 'not_a_fit', reason: '  procurement  ', actor: 'casey@freightroll.com', now: NOW });
    expect(r).toMatchObject({ ok: true, preference: { personaId: 7, accountName: 'PepsiCo', kind: 'not_a_fit', reason: 'procurement', until: null } });
    expect(p.created[0]).toMatchObject({ kind: PERSON_SELLER_PREFERENCE, subject_type: 'persona', subject_id: '7', payload: { accountName: 'PepsiCo', kind: 'not_a_fit', reason: 'procurement', until: null, source: 'human' } });
    expect(JSON.stringify(p.created[0])).not.toMatch(/do_not_contact/);
    const c = await setSellerPreference(p, { personaId: 7, kind: 'clear', actor: 'casey@freightroll.com', now: NOW });
    expect(c).toEqual({ ok: true, preference: null });
    expect(p.created[1]).toMatchObject({ payload: { kind: 'clear' } });
  });
  it('Not now needs a future date within the cap; the reason is bounded; an unknown person is refused', async () => {
    const p = fakePrisma([]);
    expect(await setSellerPreference(p, { personaId: 7, kind: 'not_now', actor: 'c@x', now: NOW })).toEqual({ ok: false, reason: 'until_required' });
    expect(await setSellerPreference(p, { personaId: 7, kind: 'not_now', until: '2026-10-01T00:00:00Z', actor: 'c@x', now: NOW })).toEqual({ ok: false, reason: 'until_in_past' });
    expect(await setSellerPreference(p, { personaId: 7, kind: 'not_now', until: new Date(NOW.getTime() + (NOT_NOW_MAX_DAYS + 2) * 86_400_000).toISOString(), actor: 'c@x', now: NOW })).toEqual({ ok: false, reason: 'until_too_far' });
    expect(await setSellerPreference(p, { personaId: 7, kind: 'not_a_fit', reason: 'x'.repeat(241), actor: 'c@x', now: NOW })).toEqual({ ok: false, reason: 'reason_too_long' });
    expect(await setSellerPreference(p, { personaId: 99, kind: 'not_a_fit', actor: 'c@x', now: NOW })).toEqual({ ok: false, reason: 'persona_not_found' });
    expect(p.created).toHaveLength(0);
    const ok = await setSellerPreference(p, { personaId: 8, kind: 'not_now', until: '2026-11-05T23:59:59.000Z', reason: 'on leave', actor: 'c@x', now: NOW });
    expect(ok).toMatchObject({ ok: true, preference: { kind: 'not_now', until: '2026-11-05T23:59:59.000Z', reason: 'on leave' } });
  });
});
