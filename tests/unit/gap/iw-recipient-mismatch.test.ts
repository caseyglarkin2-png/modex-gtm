// @vitest-environment node
/**
 * IW15 (intelligence wiring, 2026-10-09): the PepsiCo card named Tom Kamantauskas while the prepared email was to
 * Shawn Miller. Pinned: when the item names a person and the prepared email's recipient is someone else (the pack's
 * persona name, else the persona record for the address), the email is not presented as prepared, the assignment
 * says why, the item is held (never assigned, so no approval can bind to it), and the next item is handed over; the
 * same person written differently ("Morrison, Craig") is no mismatch; with no name on either side nothing changes.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ITEM_HELD_FOR_RESEARCH, assignable, buildAssignment, nextAssignableItem } from '@/lib/gap/work/assignment';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { AskContext } from '@/lib/gap/ask/grounding';

vi.mock('@/lib/gap/work/intel', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/work/intel')>()), loadPursued: vi.fn(async () => []) }));
vi.mock('@/lib/gap/deals/in-deals', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/gap/deals/in-deals')>()), loadInDealsSummary: vi.fn(async () => null) }));

const NOW = new Date('2026-10-09T13:00:00Z');
const item = (over: Partial<PlanItem> & { key: string; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch: Tom Kamantauskas', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: { name: 'Tom Kamantauskas', title: 'VP Transportation' }, refs: { decisionId: 'dec-1' }, rank: 0, ...over } as PlanItem);
const ASK: AskContext = { accountName: 'PepsiCo', state: { state: 'ready', stateLine: 'Ready for a first touch', blocker: null, next: 'Prepare the first touch to Tom Kamantauskas.', coldTouchAllowed: true }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [] } as unknown as AskContext;
const pack = (persona: { email: string; name?: string | null }) => ({ rendered: { queued: { subject: 'Doors versus spots', body: 'Shawn, the doors.' } }, contentHash: 'h1', emailReady: true, hypothesis: null, persona });
const input = { revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };

describe('IW15: a prepared email to a different person than the item names is held', () => {
  it('the pack persona names Shawn, the item names Tom: nothing prepared, the text says why, assignable refuses with recipient_mismatch', async () => {
    const prisma = ledgerDb({}).client();
    const it = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32) });
    const plan: DayPlan = { day: '2026-10-09', plannedAt: NOW.toISOString(), fresh: true, items: [it], counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } } as unknown as DayPlan;
    const deps = { askContext: async () => ASK, pack: async () => pack({ email: 'shawn.miller@pepsico.com', name: 'Shawn Miller' }) };
    const built = await buildAssignment(prisma, { plan, item: it, ...input }, deps);
    expect(built.prepared).toEqual({ kind: 'none' });
    expect(built.hold).toEqual({ reason: 'recipient_mismatch', detail: "GAP's prepared email is addressed to Shawn Miller (shawn.miller@pepsico.com), but this item names Tom Kamantauskas. Held: nothing goes out until the account's chosen person and the draft agree; choose on the account." });
    expect(built.text).toContain('but this item names Tom Kamantauskas');
    expect(built.text).not.toContain('Shawn, the doors.');
    const a = await assignable(prisma, plan, it, input, deps);
    expect(a.ok).toBe(false);
    if (!a.ok) expect(a.reason).toBe('recipient_mismatch');
  });

  it('the walk holds the mismatched item for the agent with its own line, records the reason, and hands over the next item', async () => {
    const prisma = ledgerDb({}).client();
    const bad = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32) });
    const good = item({ key: 'first_touch:dec-2', accountName: 'Kroger', token: 'b'.repeat(32), title: 'Ready for a first touch: Joey Maggard', person: { name: 'Joey Maggard', title: null }, refs: { decisionId: 'dec-2' }, rank: 1 });
    const plan: DayPlan = { day: '2026-10-09', plannedAt: NOW.toISOString(), fresh: true, items: [bad, good], counts: { needsYou: 2, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } } as unknown as DayPlan;
    const deps = { askContext: async () => ASK, pack: async (_p: unknown, a: { decisionId: string }) => (a.decisionId === 'dec-1' ? pack({ email: 'shawn.miller@pepsico.com', name: 'Shawn Miller' }) : pack({ email: 'joey@kroger.com', name: 'Maggard, Joey' })) };
    const next = await nextAssignableItem(prisma, plan, { assign: { input, deps, actor: 'test' } });
    expect(next.item?.key).toBe('first_touch:dec-2');
    expect(next.built?.prepared).toMatchObject({ kind: 'email', to: 'joey@kroger.com' });
    expect(next.held.map((h) => [h.item.key, h.line, h.recorded])).toEqual([['first_touch:dec-1', 'the prepared email is addressed to a different person than the item names; choose on the account', true]]);
    const rows = await prisma.gapAuditEvent.findMany({ where: { subject_id: 'first_touch:dec-1' } });
    expect(rows[0].payload).toMatchObject({ effect: ITEM_HELD_FOR_RESEARCH, reason: 'recipient_mismatch' });
    // A second walk finds it already held, with the same line.
    const again = await nextAssignableItem(prisma, plan, { assign: { input, deps, actor: 'test' } });
    expect(again.held[0]).toMatchObject({ item: { key: 'first_touch:dec-1' }, recorded: false, line: 'the prepared email is addressed to a different person than the item names; choose on the account' });
  });

  it('the recipient name is read from the persona record when the pack carries none; no name on either side is no mismatch', async () => {
    const prisma = ledgerDb({ personas: [{ id: 7, email: 'shawn.miller@pepsico.com', name: 'Shawn Miller', title: null, account_name: 'PepsiCo' }] }).client();
    const it = item({ key: 'first_touch:dec-1', accountName: 'PepsiCo', token: 'a'.repeat(32) });
    const plan: DayPlan = { day: '2026-10-09', plannedAt: NOW.toISOString(), fresh: true, items: [it], counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } } as unknown as DayPlan;
    const held = await buildAssignment(prisma, { plan, item: it, ...input }, { askContext: async () => ASK, pack: async () => pack({ email: 'shawn.miller@pepsico.com' }) });
    expect(held.hold?.reason).toBe('recipient_mismatch');
    const noName = await buildAssignment(prisma, { plan, item: { ...it, person: null }, ...input }, { askContext: async () => ASK, pack: async () => pack({ email: 'shawn.miller@pepsico.com' }) });
    expect(noName.hold).toBeNull();
    expect(noName.prepared).toMatchObject({ kind: 'email', to: 'shawn.miller@pepsico.com' });
  });
});
