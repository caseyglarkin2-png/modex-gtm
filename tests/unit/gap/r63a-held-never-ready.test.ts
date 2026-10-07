/**
 * R63-A B2: held accounts flipped to cold first touches on today's Work. Costco (closed won) showed "Ready for a first
 * touch: Val Scratch" at 18:05 after a restart, and Sysco (closed lost) "Ready for a first touch: Lee Scratch" at
 * 18:09 with Refresh changing nothing, while both pages said Held; only a visit fixed the card. Work's read applies the
 * gate's own hold (77261d91, R63-B S12): proven here against a remembered summary that says READY, after a restart (the
 * per-instance memory empty), on every fresh read, and past eight accounts.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { closureOf, type OpportunityTruth } from '@/lib/gap/opportunity/active-opportunity';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import type { PursuitSummary } from '@/lib/gap/pursuit/summary';
import { accountsToCheck, loadOpportunityHolds, OPPORTUNITY_HOLD_CONCURRENCY, OPPORTUNITY_HOLD_MAX, resetOpportunityHolds } from '@/lib/gap/work/opportunity-holds';

const NOW = new Date('2026-10-07T22:05:00Z');
const COSTCO = 'Costco Scratch Co r63';
const SYSCO = 'Sysco Scratch Co r63';
const WON = { id: '7101', name: `${COSTCO} yard network`, stage: 'closedwon', won: true, closedAt: '2026-09-15T16:00:00.000Z' };
const LOST = { id: '7201', name: `${SYSCO} pilot`, stage: 'closedlost', won: false, closedAt: '2026-09-01T16:00:00.000Z' };
const truth = (name: string): OpportunityTruth => {
  const closed = name === COSTCO ? [WON] : name === SYSCO ? [LOST] : [];
  return { status: 'CLEAR', companyIds: ['c1'], closed, closure: closureOf(closed, null) };
};
const readySummary = (accountName: string, person: string): PursuitSummary => ({ accountName, state: 'ready', stateLine: `Ready for a first touch: ${person}`, person: { name: person, title: null }, blocker: null, coldTouchAllowed: true, nextText: `Prepare the first touch to ${person}.`, actionable: null, at: '2026-10-07T21:50:00.000Z' });
const base = (holds: WorkInput['opportunityHolds'], summaries?: WorkInput['summaries']): WorkInput => ({
  now: NOW,
  candidates: [],
  replies: [],
  motions: [],
  held: new Map(),
  inDeals: { status: 'complete', accounts: [] },
  dbState: new Map([[COSTCO, { sendable: true, chosen: { name: 'Val Scratch', title: null } }], [SYSCO, { sendable: true, chosen: { name: 'Lee Scratch', title: null } }]]),
  opportunityHolds: holds,
  summaries,
});
const states = (i: WorkInput) => Object.fromEntries(workDay(i).cards.map((c) => [c.accountName, c.state]));

beforeEach(() => resetOpportunityHolds());

describe('R63-A B2: a customer or a lost-deal account never shows Ready for a first touch on Work', () => {
  it('a remembered summary that says READY never overrides the closed deal', async () => {
    const holds = await loadOpportunityHolds(accountsToCheck({ candidates: [], dbState: base(undefined).dbState!, held: new Map(), inDeals: { status: 'complete', accounts: [] } }), async (n) => truth(n));
    const summaries = new Map([[COSTCO, readySummary(COSTCO, 'Val Scratch')], [SYSCO, readySummary(SYSCO, 'Lee Scratch')]]);
    expect(states(base(holds, summaries))).toEqual({ [COSTCO]: 'Held: a customer (closed won)', [SYSCO]: 'Held: parked after a lost deal' });
  });

  it('after a restart (nothing remembered) and on every fresh read, the hold is read again, never READY', async () => {
    let reads = 0;
    const resolve = async (n: string) => {
      reads += 1;
      return truth(n);
    };
    const names = [COSTCO, SYSCO];
    expect(states(base(await loadOpportunityHolds(names, resolve, NOW.getTime())))).toEqual({ [COSTCO]: 'Held: a customer (closed won)', [SYSCO]: 'Held: parked after a lost deal' });
    resetOpportunityHolds(); // a restart: this instance remembers nothing
    expect(states(base(await loadOpportunityHolds(names, resolve, NOW.getTime())))).toEqual({ [COSTCO]: 'Held: a customer (closed won)', [SYSCO]: 'Held: parked after a lost deal' });
    expect(reads).toBe(4);
  });

  it('past eight accounts (twenty a read), at most five HubSpot reads at once', async () => {
    const many = new Map(Array.from({ length: 25 }, (_, k) => [`Co ${String(k).padStart(2, '0')}`, { sendable: true, chosen: { name: 'P', title: null } }] as const));
    const names = accountsToCheck({ candidates: [], dbState: many, held: new Map(), inDeals: { status: 'complete', accounts: [] } });
    expect(names).toHaveLength(OPPORTUNITY_HOLD_MAX);
    expect(OPPORTUNITY_HOLD_MAX).toBeGreaterThanOrEqual(20);
    let inFlight = 0;
    let peak = 0;
    await loadOpportunityHolds(names, async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight -= 1;
      return { status: 'CLEAR', companyIds: ['c1'] };
    });
    expect(peak).toBeLessThanOrEqual(OPPORTUNITY_HOLD_CONCURRENCY);
    expect(peak).toBeGreaterThan(1);
  });
});
