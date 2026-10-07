/**
 * R50 (GAP OS execution recovery): intelligence and actions scoped to the right opportunity. Two opportunities under
 * one company never share an unqualified commitment, requirement or next step: each deal shows its own, account-level
 * rows are labeled "account-level", a person on both deals is never transferred to either, a legacy name resolves only
 * when it names exactly one deal; the per-deal brief carries that deal's words and the tagged account-level ones only;
 * an open deal still blocks cold outreach while each deal's own work stays offered (the pursuit state, NEXT, Work).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { readScope, resolveDealRef, scopeFromBody, bidScopeInput, partitionByDeal, ACCOUNT_LEVEL, type DealRef } from '@/lib/gap/deals/scope';
import { buildOpportunities, type OpportunityBid, type OpportunityPerson } from '@/lib/gap/deals/opportunities';
import { buildDealBrief, type BriefBidRow } from '@/lib/gap/deals/deal-brief';
import { bidScope, dealRefs, personIndex } from '@/lib/gap/deals/opportunities';
import { withPhases } from '@/lib/gap/work/commitments';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import { projectPursuitState } from '@/lib/gap/pursuit/state';
import { nextFromPursuit } from '@/lib/gap/pursuit/next';
import { workDay } from '@/lib/gap/work/list';
import { DealOpportunities } from '@/components/gap/deal-opportunities';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const NOW = new Date('2026-10-06T19:00:00Z');
const ACCOUNT = 'Kroger Scratch Co';
const PILOT = { id: '70001', name: 'YardFlow - Kroger', stage: 'Appointment scheduled', nextStep: 'Pilot scope call with Ann', contactIds: ['81'] };
const COLUMBUS = { id: '70002', name: 'Kroger Columbus DC', stage: 'Qualified to buy', nextStep: null, contactIds: ['82'] };
const DEALS = [PILOT, COLUMBUS];
const REFS: DealRef[] = DEALS.map((d) => ({ id: d.id, name: d.name, contactIds: d.contactIds }));
const PEOPLE: OpportunityPerson[] = [
  { personaId: 1, name: 'Ann Scratch', title: 'VP Supply Chain Operations', email: 'ann@kroger.example.com', hubspotContactId: '81' },
  { personaId: 2, name: 'Ben Scratch', title: 'Director, Columbus DC', email: 'ben@kroger.example.com', hubspotContactId: '82' },
  { personaId: 3, name: 'Cal Scratch', title: 'VP Transportation', email: 'cal@kroger.example.com', hubspotContactId: '83' },
];

const commitment = (over: Partial<Commitment> & { commitmentId: string; title: string }): Commitment => ({
  accountName: ACCOUNT,
  kind: 'deal_step',
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: '2026-10-06T13:00:00.000Z',
  person: null,
  dealId: null,
  threadId: null,
  status: 'open',
  snoozeUntil: null,
  dependency: null,
  proof: null,
  reason: null,
  source: { kind: 'seller', id: over.commitmentId },
  detail: null,
  createdAt: '2026-10-05T12:00:00.000Z',
  createdBy: 'casey@freightroll.com',
  updatedAt: '2026-10-05T12:00:00.000Z',
  updatedBy: 'casey@freightroll.com',
  ...over,
});

const COMMITMENTS: Commitment[] = [
  commitment({ commitmentId: 'seller:pilot-plan', title: 'Send the pilot plan', dealId: PILOT.id }),
  commitment({ commitmentId: 'seller:columbus-tour', title: 'Book the Columbus yard walk', dealId: COLUMBUS.id }),
  // Ann's obligation with no deal recorded: she is a contact on the pilot only, so it is the pilot's, said as such.
  commitment({ commitmentId: 'capture:n1:k1', kind: 'deliverable', title: 'Send Ann the dock schedule template', person: { personaId: 1, name: 'Ann Scratch', email: 'ann@kroger.example.com' } }),
  // Nobody and no deal: account-level.
  commitment({ commitmentId: 'seller:intro', kind: 'task', title: 'Ask who runs the Atlanta yards' }),
  // A legacy note (R44) stored the deal's NAME.
  commitment({ commitmentId: 'capture:n2:k1', kind: 'deliverable', title: 'Send the Columbus volumes back', dealId: 'Kroger Columbus DC' }),
  // A closed deal's id: not an open deal here.
  commitment({ commitmentId: 'seller:old', title: 'Chase the 2025 RFP answer', dealId: '69999' }),
  // Done work is history, never an open obligation of either deal.
  commitment({ commitmentId: 'seller:done', title: 'Send the NDA', dealId: PILOT.id, status: 'done', proof: { kind: 'seller', id: null, note: 'sent', at: '2026-10-05T12:00:00.000Z', by: 'casey' } }),
];

const BIDS: OpportunityBid[] = [
  { id: 'b-pilot-req', type: 'constraint', quote: 'Any pilot has to run on our existing gate cameras.', summary: null, contactEmail: 'ann@kroger.example.com', at: '2026-10-02T15:00:00.000Z', metadata: { scope: { dealId: PILOT.id } } },
  { id: 'b-ben-problem', type: 'business_problem', quote: 'Trailers sit two hours at Columbus before a door opens.', summary: null, contactEmail: 'ben@kroger.example.com', at: '2026-10-03T15:00:00.000Z' },
  { id: 'b-cal-state', type: 'current_state', quote: 'Every DC still checks trailers in on paper.', summary: null, contactEmail: 'cal@kroger.example.com', at: '2026-10-04T15:00:00.000Z' },
];

describe('the scope rule (deals/scope.ts)', () => {
  it('recorded wins; else the person\'s single open deal (said "through"); else account-level; never a guess', () => {
    expect(readScope({ dealId: PILOT.id }, REFS)).toMatchObject({ dealId: PILOT.id, basis: 'recorded', label: 'Deal: YardFlow - Kroger' });
    expect(readScope(null, REFS, { contactId: '82', who: 'Ben Scratch' })).toMatchObject({ dealId: COLUMBUS.id, basis: 'contact', label: 'Deal: Kroger Columbus DC (through Ben Scratch)' });
    expect(readScope(null, REFS, { contactId: '83' })).toMatchObject({ dealId: null, basis: 'none', label: ACCOUNT_LEVEL });
    // A person on BOTH deals: their words are never transferred to every opportunity they touch.
    const both = REFS.map((r) => ({ ...r, contactIds: [...r.contactIds, '84'] }));
    expect(readScope(null, both, { contactId: '84', who: 'Dee' })).toMatchObject({ dealId: null, basis: 'none', label: ACCOUNT_LEVEL });
    expect(readScope({ site: 'Columbus DC' }, REFS)).toMatchObject({ dealId: null, basis: 'recorded', site: 'Columbus DC', label: 'Site Columbus DC' });
  });

  it('a legacy deal NAME resolves only when it names exactly one open deal; anything else keeps its own label', () => {
    expect(resolveDealRef('Kroger Columbus DC', REFS)).toEqual({ dealId: COLUMBUS.id, dealName: 'Kroger Columbus DC', unmatched: null });
    expect(resolveDealRef('kroger columbus dc', REFS).dealId).toBe(COLUMBUS.id);
    expect(resolveDealRef('Some other deal', REFS)).toEqual({ dealId: null, dealName: null, unmatched: '"Some other deal"' });
    expect(resolveDealRef('69999', REFS)).toEqual({ dealId: null, dealName: null, unmatched: 'deal 69999' });
    const twins = [...REFS, { id: '70003', name: 'Kroger Columbus DC', contactIds: [] }];
    expect(resolveDealRef('Kroger Columbus DC', twins).dealId).toBeNull();
  });

  it('a body scope and a stored BID scope read back the same; nothing named is null (account-level)', () => {
    expect(scopeFromBody({ dealId: ' 70001 ' })).toEqual({ dealId: '70001', division: null, site: null });
    expect(scopeFromBody({})).toBeNull();
    expect(bidScopeInput({ captureId: 'c', scope: { dealId: '70001' } })).toEqual({ dealId: '70001', division: null, site: null });
    expect(bidScopeInput({ captureId: 'c' })).toBeNull();
    expect(bidScopeInput(null)).toBeNull();
  });
});

describe('two opportunities under one company (R50 acceptance)', () => {
  const view = () =>
    buildOpportunities({ accountName: ACCOUNT, deals: DEALS, people: PEOPLE, commitments: withPhases(COMMITMENTS, NOW), bids: BIDS, captureHref: (d) => `/gap/capture?account=${ACCOUNT}&deal=${d.id}`, hubspotDealHref: (id) => `https://app.hubspot.com/contacts/3819073/record/0-3/${id}` });

  it('each deal holds only its own obligations and words; account-level is its own labeled group; nothing appears twice', () => {
    const v = view();
    const pilot = v.deals.find((d) => d.dealId === PILOT.id)!;
    const columbus = v.deals.find((d) => d.dealId === COLUMBUS.id)!;
    expect(pilot.commitments.map((c) => c.title)).toEqual(['Send Ann the dock schedule template', 'Send the pilot plan']);
    expect(pilot.commitments.find((c) => c.title.startsWith('Send Ann'))?.scope).toMatchObject({ basis: 'contact', label: 'Deal: YardFlow - Kroger (through Ann Scratch)' });
    expect(columbus.commitments.map((c) => c.title)).toEqual(['Book the Columbus yard walk', 'Send the Columbus volumes back']);
    expect(pilot.needs.map((b) => b.id)).toEqual(['b-pilot-req']);
    expect(columbus.needs.map((b) => b.id)).toEqual(['b-ben-problem']);
    expect(v.accountLevel.commitments.map((c) => [c.title, c.scope.label])).toEqual([['Ask who runs the Atlanta yards', ACCOUNT_LEVEL]]);
    expect(v.accountLevel.needs.map((b) => [b.id, b.scope.label])).toEqual([['b-cal-state', ACCOUNT_LEVEL]]);
    expect(v.elsewhere.commitments.map((c) => c.scope.label)).toEqual(['Deal deal 69999, not an open deal here']);
    // No row in two places, and done work is no open obligation anywhere.
    const all = [...v.deals.flatMap((d) => d.commitments), ...v.accountLevel.commitments, ...v.elsewhere.commitments].map((c) => c.commitmentId);
    expect(new Set(all).size).toBe(all.length);
    expect(all).not.toContain('seller:done');
    // Each deal's own contacts and HubSpot's own next step; the other deal's are not its.
    expect(pilot.contacts.map((p) => p.name)).toEqual(['Ann Scratch']);
    expect(columbus.contacts.map((p) => p.name)).toEqual(['Ben Scratch']);
    expect(pilot.nextStep).toBe('Pilot scope call with Ann');
    expect(columbus.nextStep).toBeNull();
    expect(pilot.actions[0]).toEqual({ label: 'Log a conversation on this deal', href: `/gap/capture?account=${ACCOUNT}&deal=${PILOT.id}` });
    expect(v.cold).toMatch(/No cold first touch while a deal is open/);
  });

  it('the per-deal brief holds that deal\'s words and the tagged account-level ones, never the other deal\'s', () => {
    const rows: BriefBidRow[] = BIDS.map((b) => ({ id: b.id, type: b.type, raw_buyer_language: b.quote, normalized_summary: null, contact_email: b.contactEmail, source: 'call', human_confirmed: true, confirmed_by: 'casey', confirmed_at: b.at, supersedes_id: null, captured_at: b.at, metadata: b.metadata }));
    const personOf = personIndex(PEOPLE);
    const scopeOf = (b: BriefBidRow) => bidScope({ metadata: b.metadata, contactEmail: b.contact_email }, dealRefs(DEALS), personOf);
    const people = PEOPLE.map((p) => ({ email: p.email, name: p.name, title: p.title }));
    const brief = (deal: { id: string; name: string } | null) => buildDealBrief({ accountName: ACCOUNT, bids: rows, dispositions: [], evidenceConflicts: [], people, dealContacts: 1, objective: null, meetingObjective: null, deal, scopeOf });
    const pilot = brief({ id: PILOT.id, name: PILOT.name });
    expect(pilot.deal).toEqual({ id: PILOT.id, name: PILOT.name });
    expect(pilot.sections.requirements.map((e) => [e.bidId, e.scope])).toEqual([['b-pilot-req', null]]);
    expect(pilot.sections.current_state.map((e) => [e.bidId, e.scope])).toEqual([['b-cal-state', ACCOUNT_LEVEL]]);
    expect(pilot.sections.problem).toEqual([]);
    const columbus = brief({ id: COLUMBUS.id, name: COLUMBUS.name });
    expect(columbus.sections.problem.map((e) => e.bidId)).toEqual(['b-ben-problem']);
    expect(columbus.sections.requirements).toEqual([]);
    // Without a deal the account-wide brief is unchanged (every confirmed word, no tags).
    const all = brief(null);
    expect([...all.sections.requirements, ...all.sections.problem, ...all.sections.current_state].map((e) => e.scope)).toEqual([undefined, undefined, undefined]);
  });

  it('the view renders each deal with its own rows and the account-level group labeled', () => {
    render(<DealOpportunities view={view()} />);
    const deals = screen.getAllByTestId('deal-opportunity');
    expect(deals).toHaveLength(2);
    expect(within(deals[0]).getAllByTestId('deal-obligation').map((li) => li.getAttribute('data-commitment-id'))).toEqual(['capture:n1:k1', 'seller:pilot-plan']);
    expect(within(deals[1]).getAllByTestId('deal-obligation').map((li) => li.getAttribute('data-commitment-id'))).toEqual(['seller:columbus-tour', 'capture:n2:k1']);
    expect(within(deals[0]).getByTestId('deal-next-step').textContent).toMatch(/HubSpot next step: Pilot scope call with Ann/);
    expect(within(deals[1]).getByTestId('deal-next-step').textContent).toMatch(/HubSpot holds no next step/);
    expect(within(screen.getByTestId('deal-account-level')).getByText(/Account-level \(not tied to one deal\)/)).toBeTruthy();
    expect(screen.getByTestId('deal-elsewhere').textContent).toMatch(/Chase the 2025 RFP answer/);
  });
});

describe('an open deal blocks cold outreach without suppressing deal work', () => {
  it('the pursuit state is in a deal (no cold touch) and NEXT names both deals, each worked on its own', () => {
    const s = projectPursuitState({ accountName: ACCOUNT, now: NOW, motionType: 'IN_DEAL', opportunity: { status: 'ACTIVE', detail: '', deals: DEALS.map((d) => ({ name: d.name, stage: d.stage })) }, restriction: null, familyHold: null, motion: null, choice: null, activePersona: null, replies: [], lastOutbound: null, outstandingDraft: null, followUpDue: null, eligible: [{ key: 'gap:1', personaId: 1, name: 'Ann Scratch', title: 'VP' }] });
    expect(s.state).toBe('in_deal');
    expect(s.stateLine).toBe('In 2 open deals: YardFlow - Kroger; Kroger Columbus DC');
    expect(s.coldTouchAllowed).toBe(false);
    const n = nextFromPursuit(s, { hypothesisId: null, accountSlugHref: (v) => `/gap/accounts/kroger?view=${v}`, replyThreadHref: null, captureHref: '/gap/capture?account=Kroger' });
    expect(n.text).toBe('Work the 2 open deals (YardFlow - Kroger; Kroger Columbus DC) each on its own, never a cold first touch. The deal brief holds each deal\'s obligations and what to learn next.');
    expect(n.control).toEqual({ href: '/gap/accounts/kroger?view=brief', label: 'Open the deal brief' });
  });

  it('Work: a deal step due today ranks as deal work with its deal named, the card offers no cold action and Capture binds to that deal', () => {
    const d = workDay({
      now: NOW,
      candidates: [{ accountName: ACCOUNT, lane: 'ready', title: 'Prepare the first touch', href: '/x', detail: 'cold', sortKey: [0], failsGate: false } as never],
      replies: [],
      motions: [],
      inDeals: { status: 'complete', accounts: [{ accountName: ACCOUNT, deals: DEALS.map((x) => ({ id: x.id, name: x.name, stage: x.stage })) }] },
      held: new Map(),
      commitments: [COMMITMENTS[1]],
    });
    const card = d.cards.find((c) => c.accountName === ACCOUNT)!;
    expect(card.tier).toBe('deal');
    expect(card.stateKind).toBe('in_deal');
    expect(card.next).toEqual({ label: 'Open the deal brief', href: '/gap/accounts/kroger-scratch-co?view=brief' });
    expect(card.blocker).toMatch(/No cold first touch/);
    expect(card.obligations?.map((o) => [o.title, o.scope])).toEqual([['Book the Columbus yard walk', 'Deal: Kroger Columbus DC']]);
    const q = new URL(`http://x${card.capture!.href}`).searchParams;
    expect([q.get('deal'), q.get('dealName')]).toEqual([COLUMBUS.id, 'Kroger Columbus DC']);
  });
});

describe('partition helper', () => {
  it('keeps every row exactly once: a deal it belongs to, account-level, or elsewhere', () => {
    const rows = [{ k: 'a', s: { dealId: '1' } }, { k: 'b', s: null }, { k: 'c', s: { dealId: '9' } }];
    const p = partitionByDeal(rows, (r) => readScope(r.s, [{ id: '1', name: 'One', contactIds: [] }]), ['1']);
    expect([p.byDeal.get('1')!.map((r) => r.k), p.accountLevel.map((r) => r.k), p.elsewhere.map((r) => r.k)]).toEqual([['a'], ['b'], ['c']]);
  });
});
