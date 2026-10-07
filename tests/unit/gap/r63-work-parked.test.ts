/**
 * R63-B S12: Sysco's Work card said "Ready for a first touch: Lee Scratch ... Prepare the first touch" while its page
 * said "Parked: ... closed lost on Sep 1, 2026 ... No cold outreach until then." On the first load (no pursuit summary
 * yet) Work built READY from the database alone and never read the closure the page and the gate read. Work now asks
 * the gate's own resolver for the accounts it would offer cold work, and holds a parked account (and a customer) in the
 * closure's words; the gate refuses the same first touch with the same sentence.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { resolveAccountOpportunity } from '@/lib/gap/opportunity/active-opportunity';
import { makeActiveOpportunityCheck } from '@/lib/gap/enroll/service';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import { accountsToCheck, loadOpportunityHolds, OPPORTUNITY_HOLD_MAX, opportunityHoldOf, resetOpportunityHolds } from '@/lib/gap/work/opportunity-holds';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';

const NOW = new Date('2026-10-07T14:00:00Z');
const SYSCO = 'Sysco Scratch Co r63';
const COSTCO = 'Costco Scratch Co r63';
const FEDEX = 'Fedex Scratch Co r63';
const lost = fakeHubSpot({ companyDeals: { c1: ['7201'] }, deals: [{ id: '7201', closed: 'true', won: 'false', name: `${SYSCO} pilot`, closedate: '2026-09-01T16:00:00Z' }] });
const won = fakeHubSpot({ companyDeals: { c1: ['7101'] }, deals: [{ id: '7101', closed: 'true', won: 'true', name: `${COSTCO} yard network`, closedate: '2026-09-15T16:00:00Z' }] });
const none = fakeHubSpot({ companyDeals: { c1: [] } });
const prisma = {
  account: { findUnique: async () => ({ hubspot_company_id: 'c1' }) },
  canonicalAccountLink: { findMany: async () => [] },
  persona: { findMany: async () => [] },
  conversationDisposition: { findFirst: async () => null },
  prospectingSignal: { findFirst: async () => null },
  inboundMessage: { findMany: async () => [] },
};
const truthFor = (name: string) => resolveAccountOpportunity(prisma, name, {}, { reads: name === SYSCO ? lost : name === COSTCO ? won : none, configured: () => true });

type DbState = { sendable: boolean; chosen: { name: string; title: string | null } | null };
const ready = (name: string, person: string): [string, DbState] => [name, { sendable: true, chosen: { name: person, title: 'VP Transportation' } }];
const input = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NOW,
  candidates: [],
  replies: [],
  motions: [],
  held: new Map(),
  inDeals: { status: 'complete', accounts: [] },
  dbState: new Map([ready(SYSCO, 'Lee Scratch'), ready(COSTCO, 'Val Scratch'), ready(FEDEX, 'Glen Scratch')]),
  ...over,
});
const cardOf = (cards: ReturnType<typeof workDay>['cards'], name: string) => cards.find((c) => c.accountName === name);

beforeEach(() => resetOpportunityHolds());

describe('R63-B S12: a parked account never carries a first-touch card on Work', () => {
  it('the first load (no summary): Sysco is held in the closure\'s words, never "Ready for a first touch"; the gate refuses the same touch with the same sentence', async () => {
    // The defect, as it was: the database alone made READY.
    expect(cardOf(workDay(input()).cards, SYSCO)).toMatchObject({ stateKind: 'ready', state: 'Ready for a first touch: Lee Scratch', next: { label: 'Prepare the first touch' } });

    const holds = await loadOpportunityHolds([SYSCO, COSTCO, FEDEX], truthFor);
    const day = workDay(input({ opportunityHolds: holds }));
    const sysco = cardOf(day.cards, SYSCO)!;
    expect(sysco).toMatchObject({ stateKind: 'held', lane: 'deals', state: 'Held: parked after a lost deal', next: null, person: null });
    expect(sysco.why).toBe('Parked: "Sysco Scratch Co r63 pilot" closed lost on Sep 1, 2026, and nothing material has changed since (a newer verified fact or a buyer reply would). No cold outreach until then.');
    expect(JSON.stringify(sysco)).not.toMatch(/first touch|Prepare/);
    // A customer is held the same way; an account nothing holds keeps its READY card.
    expect(cardOf(day.cards, COSTCO)).toMatchObject({ stateKind: 'held', state: 'Held: a customer (closed won)', next: null });
    expect(cardOf(day.cards, FEDEX)).toMatchObject({ stateKind: 'ready', state: 'Ready for a first touch: Glen Scratch' });
    // Held is parked on Work (not "needs you").
    expect(day.counts.needsYou).toBe(1);

    // The gate (every cold draft, send and enroll) refuses Lee's first touch with the card's own sentence.
    const gate = makeActiveOpportunityCheck({ reads: lost, configured: () => true }, { hold: async () => null });
    expect(await gate(prisma, SYSCO, 'lee@sysco-scratch-co-r63.example.com', NOW)).toEqual({ status: 'ACTIVE', detail: sysco.why });
  });

  it('a routing card that holds the account "for an open deal" says the closure instead when no deal is open', async () => {
    const holds = await loadOpportunityHolds([SYSCO], truthFor);
    const day = workDay(input({ dbState: new Map(), held: new Map([[SYSCO, 'active_opportunity' as const]]), opportunityHolds: holds }));
    expect(cardOf(day.cards, SYSCO)).toMatchObject({ stateKind: 'held', state: 'Held: parked after a lost deal' });
    expect(JSON.stringify(cardOf(day.cards, SYSCO))).not.toMatch(/open deal/);
  });

  it('which accounts are read: cold cards in Work order and routing "open deal" holds the summary does not list; never an account in a deal; bounded', () => {
    const base = { held: new Map([['Held Deal Co', 'active_opportunity' as const], ['Unknown Co', 'opportunity_unknown' as const]]), inDeals: { status: 'complete' as const, accounts: [{ accountName: 'Kroger Scratch Co r63' }] } };
    const names = accountsToCheck({
      ...base,
      candidates: [
        { accountName: FEDEX, lane: 'ready' },
        { accountName: 'Follow Co', lane: 'follow_up' },
        { accountName: 'Gate Fails Co', lane: 'ready', failsGate: true },
        { accountName: 'Review Co', lane: 'review' },
        { accountName: 'Kroger Scratch Co r63', lane: 'ready' },
      ],
      dbState: new Map([ready(SYSCO, 'Lee Scratch'), ready(FEDEX, 'Glen Scratch'), ['No Thesis Co', { sendable: false, chosen: { name: 'X', title: null } }]]),
    });
    expect(names).toEqual([FEDEX, 'Follow Co', SYSCO, 'Held Deal Co']);
    const many = new Map(Array.from({ length: 12 }, (_, n) => ready(`Co ${n}`, 'P')));
    expect(accountsToCheck({ candidates: [], dbState: many, held: new Map(), inDeals: { status: 'unavailable', accounts: [] } })).toHaveLength(OPPORTUNITY_HOLD_MAX);
  });

  it('an open deal and HubSpot not answering hold too (UNKNOWN never permits outbound); each answer is remembered, a failure for less', async () => {
    expect(opportunityHoldOf({ status: 'UNKNOWN', reason: 'timeout' })).toEqual({ kind: 'unknown', why: 'HubSpot could not be checked: HubSpot did not answer in time. No cold touch until it can.' });
    expect(opportunityHoldOf({ status: 'ACTIVE', companyIds: ['c1'], deals: [{ id: '9', name: 'Pilot', stage: 'qualified', pipeline: null, companyIds: ['c1'], contactIds: [] }] })).toMatchObject({ kind: 'open_deal', why: expect.stringMatching(/open HubSpot deal, "Pilot"/) });
    expect(opportunityHoldOf({ status: 'CLEAR', companyIds: ['c1'] })).toBeNull();
    let calls = 0;
    const counted = async (name: string) => {
      calls += 1;
      return truthFor(name);
    };
    await loadOpportunityHolds([SYSCO], counted, 0);
    await loadOpportunityHolds([SYSCO], counted, 60_000);
    expect(calls).toBe(1);
    await loadOpportunityHolds([SYSCO], counted, 6 * 60_000);
    expect(calls).toBe(2);
  });
});
