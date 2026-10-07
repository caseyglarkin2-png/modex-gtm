/**
 * R55 (GAP OS execution recovery): stalled, won, lost and reactivated work. Closure is read from HubSpot
 * (`hs_is_closed`, `hs_is_closed_won`); a closed-won account is a customer and never gets a first-touch campaign (the
 * gate, routing, the approach and the pursuit state all say so); a lost deal parks the account until something material
 * changes; a closed deal's open work is skipped with its reason and preserved; reopening makes ONE current next step
 * without reviving a historical reminder; stalled suggestions come from missed obligations and HubSpot's own dates,
 * never a probability.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { closureOf, materialChangeSince, resolveOpportunity, type ClosedDeal } from '@/lib/gap/opportunity/active-opportunity';
import { makeActiveOpportunityCheck } from '@/lib/gap/enroll/service';
import { hasActiveOpportunity, RULES } from '@/lib/gap/routing/rules';
import { decideApproach } from '@/lib/gap/motion/approach';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { syncDealStates, sweepClosedDeals, resetClosureSweep, DEAL_STATE } from '@/lib/gap/deals/closure';
import { stalledSignals } from '@/lib/gap/deals/stalled';
import { ensureCommitment, loadCommitment, loadCommitments } from '@/lib/gap/work/commitments';
import { workDay } from '@/lib/gap/work/list';
import { fakeHubSpot } from './fixtures/fake-hubspot-opportunity';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-06T19:00:00Z');
const ACTOR = 'casey@freightroll.com';
const WON: ClosedDeal = { id: '7101', name: 'Costco yard network', stage: 'closedwon', won: true, closedAt: '2026-09-15T16:00:00.000Z' };
const LOST: ClosedDeal = { id: '7201', name: 'Sysco pilot', stage: 'closedlost', won: false, closedAt: '2026-09-01T16:00:00.000Z' };

beforeEach(() => resetClosureSweep());

describe('closure is read from HubSpot, never from a stage name (R55)', () => {
  it('the resolver keeps each closed deal with how it ended and when; with none open the account is CLEAR and carries them', async () => {
    const hs = fakeHubSpot({ companyDeals: { c1: ['7101', '7102'] }, deals: [{ id: '7101', closed: 'true', won: 'true', name: 'Costco yard network', stage: 'closedwon', closedate: '2026-09-15T16:00:00Z' }, { id: '7102', closed: 'true', won: 'false', name: 'Old RFP', stage: 'custom-stage-9', closedate: '2025-03-01T16:00:00Z' }] });
    const t = await resolveOpportunity({ accountName: 'Costco Scratch Co', hubspotCompanyId: 'c1', domains: [], contactIds: [] }, hs);
    expect(t).toEqual({ status: 'CLEAR', companyIds: ['c1'], closed: [{ id: '7101', name: 'Costco yard network', stage: 'closedwon', won: true, closedAt: '2026-09-15T16:00:00.000Z' }, { id: '7102', name: 'Old RFP', stage: 'custom-stage-9', won: false, closedAt: '2025-03-01T16:00:00.000Z' }] });
  });

  it('won makes a customer (whatever else was lost); lost parks unless something material came after; an unknown outcome parks too', () => {
    expect(closureOf([LOST, WON], null)).toMatchObject({ kind: 'customer', deal: WON });
    expect(closureOf([WON], null)?.why).toBe('A customer: "Costco yard network" closed won on Sep 15, 2026. No first-touch campaign here; any expansion is your explicit call, worked with the customer, never a cold sequence.');
    expect(closureOf([LOST], null)?.why).toBe('Parked: "Sysco pilot" closed lost on Sep 1, 2026, and nothing material has changed since (a newer verified fact or a buyer reply would). No cold outreach until then.');
    expect(closureOf([LOST], '2026-08-20T00:00:00.000Z')?.kind).toBe('parked');
    expect(closureOf([LOST], '2026-09-20T00:00:00.000Z')).toBeNull();
    expect(closureOf([{ ...LOST, won: null }], null)?.why).toMatch(/closed without an outcome/);
    expect(closureOf([], null)).toBeNull();
  });

  it('a material change is a verified fact or a PERSON\'s reply after the close (an auto-reply or an opt-out is not)', async () => {
    const replies = [{ received_at: new Date('2026-09-10T12:00:00Z'), snippet: 'I am out of the office until Monday.', subject: 'Automatic reply', from_email: 'lee@sysco.example.com' }, { received_at: new Date('2026-09-12T12:00:00Z'), snippet: 'stop', subject: 'Re: pilot', from_email: 'lee@sysco.example.com' }];
    const db = (fact: Date | null, rs = replies) => ({ prospectingSignal: { findFirst: async () => (fact ? { observed_at: fact } : null) }, inboundMessage: { findMany: async () => rs } });
    expect(await materialChangeSince(db(null), 'Sysco Scratch Co', LOST.closedAt)).toBeNull();
    expect(await materialChangeSince(db(new Date('2026-09-20T00:00:00Z')), 'Sysco Scratch Co', LOST.closedAt)).toBe('2026-09-20T00:00:00.000Z');
    expect(await materialChangeSince(db(null, [...replies, { received_at: new Date('2026-09-25T12:00:00Z'), snippet: 'Can we revisit the pilot in Q4?', subject: 'Re: pilot', from_email: 'lee@sysco.example.com' }]), 'Sysco Scratch Co', LOST.closedAt)).toBe('2026-09-25T12:00:00.000Z');
  });
});

describe('a customer or a parked account never gets cold outreach (R55)', () => {
  const prismaFor = (accountName: string) => ({
    account: { findUnique: async () => ({ hubspot_company_id: 'c1' }) },
    canonicalAccountLink: { findMany: async () => [] },
    persona: { findMany: async () => [] },
    conversationDisposition: { findFirst: async () => null },
    prospectingSignal: { findFirst: async () => null },
    inboundMessage: { findMany: async () => [] },
    accountName,
  });

  it('the action-time gate refuses every cold draft, send and enroll at a customer and at a parked account, with the closure in words', async () => {
    const won = makeActiveOpportunityCheck({ reads: fakeHubSpot({ companyDeals: { c1: ['7101'] }, deals: [{ id: '7101', closed: 'true', won: 'true', name: 'Costco yard network', closedate: '2026-09-15T16:00:00Z' }] }), configured: () => true }, { hold: async () => null });
    expect(await won(prismaFor('Costco Scratch Co'), 'Costco Scratch Co', 'val@costco.example.com', NOW)).toEqual({ status: 'ACTIVE', detail: closureOf([WON], null)!.why });
    const lost = makeActiveOpportunityCheck({ reads: fakeHubSpot({ companyDeals: { c1: ['7201'] }, deals: [{ id: '7201', closed: 'true', won: 'false', name: 'Sysco pilot', closedate: '2026-09-01T16:00:00Z' }] }), configured: () => true }, { hold: async () => null });
    expect(await lost(prismaFor('Sysco Scratch Co'), 'Sysco Scratch Co', 'lee@sysco.example.com', NOW)).toMatchObject({ status: 'ACTIVE', detail: expect.stringMatching(/^Parked: "Sysco pilot" closed lost/) });
    // A verified fact after the loss unparks it: the gate then judges it like any account.
    const changed = { ...prismaFor('Sysco Scratch Co'), prospectingSignal: { findFirst: async () => ({ observed_at: new Date('2026-09-20T00:00:00Z') }) } };
    expect(await lost(changed, 'Sysco Scratch Co', 'lee@sysco.example.com', NOW)).toEqual({ status: 'CLEAR' });
  });

  it('routing holds them (R3b) with its own reason; the approach is no cold motion; the pursuit state is held and says why', () => {
    const closure = closureOf([WON], null)!;
    const inputs = { account: { opportunity: { status: 'CLEAR' as const, companyIds: ['c1'], closed: [WON], closure } }, comms: { meetingBooked: false, lastDisposition: null }, now: NOW, freshness: { cooldownDays: 30 } };
    expect(hasActiveOpportunity(inputs)).toBe(true);
    const rule = RULES.find((r) => r.id === 'active_opportunity')!;
    expect(rule.reason!(inputs as never)).toBe('active_opportunity:closed_won_customer');
    const parked = { ...inputs, account: { opportunity: { status: 'CLEAR' as const, companyIds: ['c1'], closed: [LOST], closure: closureOf([LOST], null)! } } };
    expect(rule.reason!(parked as never)).toBe('active_opportunity:closed_lost_parked');
    expect(hasActiveOpportunity({ ...inputs, account: { opportunity: { status: 'CLEAR', companyIds: ['c1'] } } })).toBe(false);
    expect(decideApproach({ deal: 'CLEAR', closure, contradicted: false, conversation: null, touchHold: null, verifiedFact: true, reachable: true, source: null })).toEqual({ kind: 'NO_GOOD_MOTION', why: closure.why });
    const s = projectPursuitState({ accountName: 'Costco Scratch Co', now: NOW, motionType: 'NO_GOOD_MOTION', opportunity: { status: 'CLEAR', detail: '', deals: [], closure }, restriction: null, familyHold: null, motion: null, choice: { personaId: 1, at: '2026-10-01T00:00:00.000Z', by: ACTOR, source: 'motion' }, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [{ key: 'gap:1', personaId: 1, name: 'Val Scratch', title: 'Director of Transportation' }] });
    expect(s).toMatchObject({ state: 'held', stateLine: 'Held: a customer (closed won)', coldTouchAllowed: false, blocker: closure.why, unlock: 'Your explicit decision to work an expansion with the customer.' });
  });
});

describe('closed, lost and reopened deals and GAP\'s own obligations (R55)', () => {
  const ACCOUNT = 'Kroger Scratch Co';
  async function seed() {
    const db = ledgerDb({ accounts: [ACCOUNT] });
    const p = db.client();
    const mk = (id: string, over: Record<string, unknown>) => ensureCommitment(p, { accountName: ACCOUNT, kind: 'deal_step', title: id, source: { kind: 'seller', id }, ...over } as never, { actor: ACTOR, now: NOW });
    await mk('pilot-plan', { title: 'Send the pilot plan', dealId: '7001', dueAt: '2026-10-08T13:00:00.000Z' });
    await mk('nda', { kind: 'deliverable', title: 'Send the NDA', dealId: '7001' });
    await mk('columbus', { title: 'Book the Columbus walk', dealId: '7002' });
    await mk('cold-fu', { kind: 'follow_up', title: 'Follow up with Cal', status: 'waiting', dependency: "Cal's reply" });
    return { db, p };
  }

  it('first sight records the baseline; a deal closing WON skips its open work with the reason, keeps it, stops cold follow-ups, and another read changes nothing', async () => {
    const { db, p } = await seed();
    const first = await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7001', name: 'YardFlow - Kroger' }, { id: '7002', name: 'Kroger Columbus DC' }], closed: [], now: NOW });
    expect(first).toEqual({ closed: [], reopened: [], skipped: 0, created: 0 });
    expect(db.store.gapAuditEvent.filter((r) => r.kind === DEAL_STATE).map((r) => [r.payload.dealId, r.payload.state])).toEqual([['7001', 'open'], ['7002', 'open']]);
    // The pilot deal closes won; Columbus stays open.
    const won = await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7002', name: 'Kroger Columbus DC' }], closed: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'closedwon', won: true, closedAt: '2026-10-05T16:00:00.000Z' }], now: NOW });
    expect(won).toEqual({ closed: ['7001'], reopened: [], skipped: 2, created: 0 });
    const plan = await loadCommitment(p, 'seller:pilot-plan');
    expect(plan).toMatchObject({ status: 'skipped', reason: 'the deal "YardFlow - Kroger" closed won on Oct 5; kept for history' });
    expect((await loadCommitment(p, 'seller:columbus'))?.status).toBe('open');
    // A deal is still open, so the account's cold follow-up is not touched here.
    expect((await loadCommitment(p, 'seller:cold-fu'))?.status).toBe('waiting');
    expect(await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7002', name: 'Kroger Columbus DC' }], closed: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'closedwon', won: true, closedAt: '2026-10-05T16:00:00.000Z' }], now: NOW })).toEqual({ closed: [], reopened: [], skipped: 0, created: 0 });
  });

  it('the last open deal closing LOST parks the account: its work and the cold follow-ups are skipped with the reason', async () => {
    const { p } = await seed();
    await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7001', name: 'YardFlow - Kroger' }, { id: '7002', name: 'Kroger Columbus DC' }], closed: [], now: NOW });
    const r = await syncDealStates(p, { accountName: ACCOUNT, open: [], closed: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'closedlost', won: false, closedAt: '2026-10-05T16:00:00.000Z' }, { id: '7002', name: 'Kroger Columbus DC', stage: 'closedlost', won: false, closedAt: '2026-10-05T16:00:00.000Z' }], now: NOW });
    expect(r).toMatchObject({ closed: ['7001', '7002'], skipped: 4 });
    expect((await loadCommitment(p, 'seller:cold-fu'))?.reason).toBe('parked: the deal closed lost; no cold follow-up until something material changes');
  });

  it('reopening makes ONE current next step and revives no historical reminder; a second read makes no second', async () => {
    const { p } = await seed();
    await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7001', name: 'YardFlow - Kroger' }, { id: '7002', name: 'Kroger Columbus DC' }], closed: [], now: NOW });
    await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7002', name: 'Kroger Columbus DC' }], closed: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'closedlost', won: false, closedAt: '2026-10-05T16:00:00.000Z' }], now: NOW });
    const later = new Date('2026-10-20T15:00:00Z');
    const re = await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7001', name: 'YardFlow - Kroger' }, { id: '7002', name: 'Kroger Columbus DC' }], closed: [], now: later });
    expect(re).toEqual({ closed: [], reopened: ['7001'], skipped: 0, created: 1 });
    const open7001 = (await loadCommitments(p, { accountNames: [ACCOUNT] })).filter((c) => c.dealId === '7001' && c.status !== 'skipped');
    expect(open7001.map((c) => [c.title, c.kind, c.source.kind])).toEqual([['Reopened: decide the next step on "YardFlow - Kroger"', 'deal_step', 'deal']]);
    expect((await loadCommitment(p, 'seller:pilot-plan'))?.status).toBe('skipped');
    expect((await loadCommitment(p, 'seller:nda'))?.status).toBe('skipped');
    expect(await syncDealStates(p, { accountName: ACCOUNT, open: [{ id: '7001', name: 'YardFlow - Kroger' }, { id: '7002', name: 'Kroger Columbus DC' }], closed: [], now: later })).toEqual({ closed: [], reopened: [], skipped: 0, created: 0 });
  });

  it('the Work sweep reads only accounts whose deal-scoped work left the open deals, bounded, and never without the open-deal read', async () => {
    const { p } = await seed();
    const asked: string[] = [];
    const resolve = async (a: string) => {
      asked.push(a);
      return { status: 'ACTIVE', deals: [{ id: '7002', name: 'Kroger Columbus DC' }], closed: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'closedwon', won: true, closedAt: '2026-10-05T16:00:00.000Z' }] };
    };
    expect((await sweepClosedDeals(p, { now: NOW, openDealIds: null, resolve })).accounts).toEqual([]);
    expect((await sweepClosedDeals(p, { now: NOW, openDealIds: new Set(['7001', '7002']), resolve })).accounts).toEqual([]);
    resetClosureSweep();
    const r = await sweepClosedDeals(p, { now: NOW, openDealIds: new Set(['7002']), resolve });
    expect([r.accounts, asked, r.skipped]).toEqual([[ACCOUNT], [ACCOUNT], 2]);
    // Bounded per instance: a second run inside five minutes reads nothing.
    expect((await sweepClosedDeals(p, { now: new Date(NOW.getTime() + 60_000), openDealIds: new Set(['7002']), resolve })).accounts).toEqual([]);
  });
});

describe('stalled deal work, from the record and never a probability (R55)', () => {
  it('overdue obligations, a buyer promise that did not arrive, no recent HubSpot activity and a passed close date', () => {
    const lines = stalledSignals({
      now: NOW,
      deal: { name: 'YardFlow - Kroger', lastActivityAt: '2026-09-01T00:00:00.000Z', closeDate: '2026-09-30T00:00:00.000Z', contact: 'Ann Scratch' },
      commitments: [
        { title: 'Send the pilot plan', kind: 'deal_step', status: 'open', dueAt: '2026-09-28T13:00:00.000Z', person: null },
        { title: 'Their volumes', kind: 'buyer_promise', status: 'waiting', dueAt: '2026-09-29T13:00:00.000Z', person: { name: 'Ann Scratch', email: null } },
        { title: 'Due tomorrow', kind: 'deal_step', status: 'open', dueAt: '2026-10-07T13:00:00.000Z', person: null },
        { title: 'Just missed', kind: 'deal_step', status: 'open', dueAt: '2026-10-05T13:00:00.000Z', person: null },
      ],
    });
    expect(lines).toEqual([
      '"Send the pilot plan" is overdue since Sep 28. Do it, or tell them the new date.',
      'Ann Scratch promised "Their volumes" by Sep 29; nothing has arrived. Chase it or record what changed.',
      'No activity on the deal in HubSpot since Sep 1 (35 days). Agree the next step with Ann Scratch, or close it out.',
      'The close date (Sep 30) has passed and the deal is still open. Confirm the real date with Ann Scratch.',
    ]);
    for (const l of lines) expect(l).not.toMatch(/%|probab|likel|chance/i);
    expect(stalledSignals({ now: NOW, deal: { name: 'x', lastActivityAt: '2026-10-01T00:00:00.000Z', closeDate: null }, commitments: [] })).toEqual([]);
  });

  it('Work: a stalled open deal is deal work with the reason on its card; a healthy one stays held', () => {
    const day = (lastActivityAt: string) => workDay({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [{ accountName: 'Kroger Scratch Co', deals: [{ id: '7001', name: 'YardFlow - Kroger', stage: 'Appointment scheduled', lastActivityAt, closeDate: null }] }] } });
    const stale = day('2026-09-01T00:00:00.000Z').cards[0];
    expect(stale).toMatchObject({ tier: 'deal', stalled: ['No activity on the deal in HubSpot since Sep 1 (35 days). Agree the next step, or close it out.'] });
    expect(stale.rankWhy).toBe('A stalled deal: no activity on the deal in HubSpot since Sep 1 (35 days). Agree the next step, or close it out.');
    expect(stale.next).toEqual({ label: 'Open the deal brief', href: '/gap/accounts/kroger-scratch-co?view=brief' });
    const healthy = day('2026-10-01T00:00:00.000Z').cards[0];
    expect([healthy.tier, healthy.stalled]).toEqual(['held', undefined]);
  });
});
