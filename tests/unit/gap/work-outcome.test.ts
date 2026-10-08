/**
 * R14: a Work outcome is recorded, not navigated: skip (until tomorrow), snooze (until a date the seller gave, never
 * past 90 days, never in the past), logged outside GAP (until tomorrow, with the note); the newest row wins; clear
 * ends it; a lapsed one reads as none. Nothing but one audit row is written.
 */
import { describe, expect, it, vi } from 'vitest';
import { loadWorkOutcomes, nextDayBoundary, outcomeLine, recordWorkOutcome, WORK_OUTCOME } from '@/lib/gap/work/outcome';

const NOW = new Date('2026-10-06T19:00:00Z'); // 3 pm New York
function fakePrisma(rows: Array<{ subject_id: string; actor: string; payload: unknown; created_at: Date }> = []) {
  const audit = [...rows];
  return {
    audit,
    account: { findUnique: vi.fn(async ({ where }: { where: { name: string } }) => (['Pepsi Scratch Co', 'Kroger Scratch Co'].includes(where.name) ? { name: where.name } : null)) },
    gapAuditEvent: {
      create: vi.fn(async ({ data }: { data: { kind: string; actor: string; subject_type: string; subject_id: string; payload: unknown } }) => {
        audit.unshift({ subject_id: data.subject_id, actor: data.actor, payload: data.payload, created_at: new Date(NOW.getTime() + audit.length) });
        return { id: `a${audit.length}` };
      }),
      findMany: vi.fn(async ({ where }: { where: { subject_id: { in: string[] } } }) => audit.filter((r) => where.subject_id.in.includes(r.subject_id)).sort((a, b) => b.created_at.getTime() - a.created_at.getTime())),
    },
  };
}

describe('work outcomes', () => {
  it('a skip holds the card until the next New York day; a snooze needs a future date within 90 days; a logged note says what happened', async () => {
    const p = fakePrisma();
    const skip = await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'skipped', actor: 'casey@freightroll.com', now: NOW });
    expect(skip.ok && skip.outcome?.kind).toBe('skipped');
    expect(skip.ok && skip.outcome?.until).toBe(nextDayBoundary(NOW).toISOString());
    expect(new Date(nextDayBoundary(NOW)).toISOString()).toBe('2026-10-07T04:00:00.000Z');
    expect(skip.ok && skip.line).toMatch(/^Skipped for today, you, today\.$/);
    expect(p.gapAuditEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ kind: WORK_OUTCOME, subject_type: 'account', subject_id: 'Pepsi Scratch Co', payload: expect.objectContaining({ kind: 'skipped' }) }) });

    expect(await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'snoozed', actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'until_required' });
    expect(await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: '2026-10-01T00:00:00Z', actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'until_in_past' });
    expect(await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: '2027-06-01T00:00:00Z', actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'until_too_far' });
    expect(await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'snoozed', until: 'soon', actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'invalid_until' });
    expect(await recordWorkOutcome(p as never, { accountName: 'Nobody Co', kind: 'skipped', actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'account_not_found' });
    expect(await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'logged', reason: 'x'.repeat(241), actor: 'x', now: NOW })).toEqual({ ok: false, reason: 'reason_too_long' });

    const snooze = await recordWorkOutcome(p as never, { accountName: 'Kroger Scratch Co', kind: 'snoozed', until: '2026-10-09T12:00:00Z', reason: 'travel', actor: 'casey@freightroll.com', now: NOW });
    expect(snooze.ok && snooze.line).toBe('Snoozed until Oct 9 (travel), you, today.');
    const logged = await recordWorkOutcome(p as never, { accountName: 'Pepsi Scratch Co', kind: 'logged', reason: 'called Tom from the car', actor: 'casey@freightroll.com', now: NOW });
    expect(logged.ok && logged.line).toBe('Logged outside GAP (called Tom from the car), you, today.');
  });

  it('the newest row wins, a lapsed outcome reads as none, clear ends it, and only asked-for accounts are read', async () => {
    const p = fakePrisma([
      { subject_id: 'Pepsi Scratch Co', actor: 'casey@freightroll.com', payload: { kind: 'snoozed', until: '2026-10-09T12:00:00Z', reason: null }, created_at: new Date('2026-10-05T10:00:00Z') },
      { subject_id: 'Pepsi Scratch Co', actor: 'casey@freightroll.com', payload: { kind: 'skipped', until: '2026-10-06T04:00:00Z', reason: null }, created_at: new Date('2026-10-05T12:00:00Z') },
      { subject_id: 'Kroger Scratch Co', actor: 'casey@freightroll.com', payload: { kind: 'snoozed', until: '2026-10-20T12:00:00Z', reason: 'deal review' }, created_at: new Date('2026-10-05T12:00:00Z') },
    ]);
    // Pepsi's newest row is the skip, lapsed by NOW: none (the older snooze is not resurrected).
    let out = await loadWorkOutcomes(p as never, ['Pepsi Scratch Co', 'Kroger Scratch Co'], NOW);
    expect(out.has('Pepsi Scratch Co')).toBe(false);
    expect(out.get('Kroger Scratch Co')).toMatchObject({ kind: 'snoozed', until: '2026-10-20T12:00:00Z', reason: 'deal review' });
    expect(outcomeLine(out.get('Kroger Scratch Co')!, NOW)).toBe('Snoozed until Oct 20 (deal review), you, Oct 5.');
    const cleared = await recordWorkOutcome(p as never, { accountName: 'Kroger Scratch Co', kind: 'clear', actor: 'casey@freightroll.com', now: NOW });
    expect(cleared).toMatchObject({ ok: true, outcome: null, line: null });
    out = await loadWorkOutcomes(p as never, ['Kroger Scratch Co'], NOW);
    expect(out.size).toBe(0);
    expect(await loadWorkOutcomes(p as never, [], NOW)).toEqual(new Map());
  });
});
