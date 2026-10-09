/**
 * R41 (GAP OS execution recovery): Work ranks today's work by commercial obligations. A buyer commitment due today
 * first, then actionable replies, meetings within 24 hours, an open deal's due step, follow-ups due, prepared
 * prospecting, proposals to review, research. Inside a tier: the due time, then the newest buyer activity, then the
 * seller's explicit priority, each said on the card. Waiting work is counted, never a card; a snooze returns on its date
 * or when the buyer moves; two due obligations at one account stay two; every open obligation is somewhere.
 */
import { describe, expect, it } from 'vitest';
import { evidenceRank, workDay, type WorkInput } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import type { NextCandidate } from '@/lib/gap/routing/next-up';
import { nyDayAt } from '@/lib/gap/work/dates';

const NOW = new Date('2026-10-06T15:00:00Z'); // Tue Oct 6, 11 am New York
const cand = (lane: NextCandidate['lane'], accountName: string, title: string, sortKey: Array<number | string> = [0]): NextCandidate => ({ lane, accountName, title, detail: `${accountName}: ${title.toLowerCase()}.`, href: `/gap?lane=${lane}`, sortKey });
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), ...over });
let seq = 0;
const commit = (accountName: string, kind: Commitment['kind'], title: string, over: Partial<Commitment> = {}): Commitment => ({
  commitmentId: `seller:${(seq += 1)}`,
  accountName,
  kind,
  title,
  basis: null,
  owner: 'casey@freightroll.com',
  dueAt: NOW.toISOString(),
  person: null,
  dealId: null,
  threadId: null,
  status: 'open',
  snoozeUntil: null,
  dependency: null,
  proof: null,
  reason: null,
  source: { kind: 'seller', id: String(seq) },
  detail: null,
  createdAt: '2026-10-05T14:00:00Z',
  createdBy: 'casey@freightroll.com',
  updatedAt: '2026-10-05T14:00:00Z',
  updatedBy: 'casey@freightroll.com',
  ...over,
});

describe('the tiers (R41)', () => {
  it('a customer-promised deliverable outranks a new article; the order is commitment, reply, meeting, then by evidence: deal step, ready, review, the cold follow-up (A2, 2026-10-09: a follow-up with no reply ever is the lowest executable), research', () => {
    const day = workDay(
      base({
        candidates: [cand('research', 'Article Co', 'Read the new article about Article Co'), cand('ready', 'Ready Co', 'Prepare the first touch'), cand('review', 'Review Co', 'Decide the angle'), cand('follow_up', 'Follow Co', 'Follow up with Mark')],
        replies: [{ accountName: 'Reply Co', contactEmail: 'ann@reply.example.com', subject: 'Re: yards', snippet: 'Happy to talk, what does a pilot look like?', receivedAt: '2026-10-06T13:00:00Z' }],
        inDeals: { status: 'complete', accounts: [{ accountName: 'Deal Co', deals: [{ name: 'Deal Co pilot', stage: 'Proposal' }] }] },
        meetings: [{ accountName: 'Meet Co', at: '2026-10-07T14:00:00Z', what: 'Pilot scoping' }, { accountName: 'Far Co', at: '2026-10-09T14:00:00Z', what: 'Too far out' }],
        commitments: [commit('Promise Co', 'deliverable', 'Send Ann the dock schedule template', { dueAt: nyDayAt('2026-10-06').toISOString(), basis: 'Ann: "send me the dock schedule template by today"' }), commit('Deal Co', 'deal_step', 'Send the pilot success criteria', { dealId: 'd1' })],
      }),
    );
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([
      ['Promise Co', 'commitment'],
      ['Reply Co', 'reply'],
      ['Meet Co', 'meeting'],
      ['Deal Co', 'deal'],
      ['Ready Co', 'ready'],
      ['Review Co', 'review'],
      ['Follow Co', 'follow_up'],
      ['Article Co', 'research'],
    ]);
    // A2: each executable card says which evidence placed it.
    expect(day.cards.find((c) => c.accountName === 'Deal Co')!.rankWhy).toMatch(/Ranked here: open deal, a step due\.$/);
    expect(day.cards.find((c) => c.accountName === 'Follow Co')!.rankWhy).toMatch(/Ranked here: a follow-up on a cold touch, no reply yet\.$/);
    const promise = day.cards[0];
    expect(promise.rankWhy).toBe('A buyer commitment is due: Send Ann the dock schedule template (due today).');
    expect(promise.obligations?.[0]).toMatchObject({ title: 'Send Ann the dock schedule template', canComplete: true, basis: 'Ann: "send me the dock schedule template by today"' });
    expect(promise.lane).toBe('commitments');
    // The deal step is deal work: the hold on cold outreach stands on the same card.
    const deal = day.cards.find((c) => c.accountName === 'Deal Co')!;
    expect(deal.blocker).toMatch(/No cold first touch while the deal is open/);
    expect(deal.obligations?.map((o) => o.title)).toEqual(['Send the pilot success criteria']);
    // The meeting beyond 24 hours is not today's work.
    expect(day.cards.map((c) => c.accountName)).not.toContain('Far Co');
    // Batch item 8: the research card is parked: listed last, never counted in "needs you".
    expect(day.counts).toEqual({ needsYou: 7, parked: 1, obligationsDue: 3, waiting: 0, snoozed: 0, availability: 0 });
  });

  it('inside a tier: the due time, then the newest buyer activity, then the seller\'s explicit priority, each said on the card', () => {
    const day = workDay(
      base({
        candidates: [cand('ready', 'Alpha Co', 'Prepare'), cand('ready', 'Beta Co', 'Prepare'), cand('ready', 'Gamma Co', 'Prepare')],
        commitments: [commit('Late Co', 'deliverable', 'Send the late thing', { dueAt: '2026-10-06T20:00:00Z' }), commit('Early Co', 'deliverable', 'Send the early thing', { dueAt: '2026-10-06T13:00:00Z' })],
        priorities: new Map([['Gamma Co', { reason: 'their CFO asked for it at the conference', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }]]),
      }),
    );
    expect(day.cards.map((c) => c.accountName)).toEqual(['Early Co', 'Late Co', 'Gamma Co', 'Alpha Co', 'Beta Co']);
    // A2: the priority is evidence (level 5) and is said as what ranked the card.
    expect(day.cards[2].rankWhy).toBe('A prepared first touch. Ranked here: a first touch prepared; you prioritized it (their CFO asked for it at the conference).');
    expect(day.cards[2].priority).toMatchObject({ reason: 'their CFO asked for it at the conference' });
    // The newest buyer activity breaks a tie between two replies that arrived at the same due time.
    const replies = workDay(base({ replies: [{ accountName: 'Old Co', contactEmail: 'a@old.example.com', subject: 'Re', snippet: 'Can you call me?', receivedAt: '2026-10-05T13:00:00Z' }, { accountName: 'New Co', contactEmail: 'b@new.example.com', subject: 'Re', snippet: 'Let us talk Thursday.', receivedAt: '2026-10-06T13:00:00Z' }] }));
    expect(replies.cards.map((c) => [c.accountName, c.rankWhy])).toEqual([
      ['Old Co', 'A buyer replied Oct 5.'],
      ['New Co', 'A buyer replied Oct 6.'],
    ]);
  });
});

describe('batch item 8: research and holds never count as "needs you"', () => {
  it('a day with only held and research accounts reads "Nothing needs you": every card parked, each still listed', () => {
    const day = workDay(
      base({
        candidates: [cand('research', 'Article Co', 'Read the new article about Article Co'), cand('research', 'Thin Co', 'Research Thin Co')],
        inDeals: { status: 'complete', accounts: [{ accountName: 'Deal Co', deals: [{ name: 'Deal Co pilot', stage: 'Proposal' }] }] },
        held: new Map([['Unknown Co', 'opportunity_unknown' as const]]),
      }),
    );
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([
      ['Article Co', 'research'],
      ['Thin Co', 'research'],
      ['Unknown Co', 'held'],
      ['Deal Co', 'held'],
    ]);
    expect(day.counts).toEqual({ needsYou: 0, parked: 4, obligationsDue: 0, waiting: 0, snoozed: 0, availability: 0 });
    // A card that needs the seller always lists before every parked card, whatever its own tier rank.
    const mixed = workDay(base({ candidates: [cand('research', 'Article Co', 'Read it')], replies: [{ accountName: 'Optout Co', contactEmail: 'x@optout.example.com', subject: null, snippet: 'stop', receivedAt: '2026-10-06T13:00:00Z' }] }));
    expect(mixed.cards.map((c) => [c.accountName, c.tier])).toEqual([
      ['Optout Co', 'admin'],
      ['Article Co', 'research'],
    ]);
    expect(mixed.counts).toMatchObject({ needsYou: 1, parked: 1 });
  });
});

describe('waiting, snoozed and the count that says "needs you" (R41)', () => {
  it('distant waiting items do not inflate needs you: a deliverable due Friday, a follow-up not yet due and a blocked task are counted under Waiting, never cards (the follow-up line is C28 wording, "Scheduled for", which this test had not followed)', () => {
    const day = workDay(
      base({
        candidates: [cand('ready', 'Ready Co', 'Prepare')],
        commitments: [
          commit('Friday Co', 'deliverable', 'Send the comparison', { dueAt: nyDayAt('2026-10-09').toISOString() }),
          commit('Sent Co', 'follow_up', 'Follow up with Glen', { status: 'waiting', dependency: "Glen's reply", dueAt: nyDayAt('2026-10-12').toISOString(), source: { kind: 'send', id: 'k' } }),
          commit('Legal Co', 'task', 'Send the pilot terms', { status: 'blocked', dependency: 'their legal review' }),
        ],
      }),
    );
    expect(day.cards.map((c) => c.accountName)).toEqual(['Ready Co']);
    expect(day.counts).toEqual({ needsYou: 1, parked: 0, obligationsDue: 0, waiting: 3, snoozed: 0, availability: 0 });
    // Waiting is ordered by the day each item is due (the blocked task was due today).
    expect(day.waiting.map((w) => [w.accountName, w.line])).toEqual([
      ['Legal Co', 'Blocked: their legal review.'],
      ['Friday Co', 'Due Oct 9.'],
      ['Sent Co', "Scheduled for Oct 12; waiting on Glen's reply."],
    ]);
  });

  it('a snoozed item returns only when due or when the buyer moved after it was snoozed (the footer line is C28 wording, "Scheduled for", which this test had not followed)', () => {
    const snoozedReminder = commit('Snooze Co', 'reminder', 'Back to Snooze Co: travel', { status: 'snoozed', snoozeUntil: nyDayAt('2026-10-09').toISOString(), dueAt: nyDayAt('2026-10-09').toISOString(), updatedAt: '2026-10-05T12:00:00Z', source: { kind: 'disposition', id: 'd' } });
    const asleep = workDay(base({ commitments: [snoozedReminder] }));
    expect(asleep.cards).toEqual([]);
    expect(asleep.snoozed).toEqual([{ key: snoozedReminder.commitmentId, accountName: 'Snooze Co', line: 'Back to Snooze Co: travel: Scheduled for Oct 9.', until: snoozedReminder.snoozeUntil }]);
    expect(workDay(base({ now: new Date('2026-10-09T14:00:00Z'), commitments: [snoozedReminder] })).cards.map((c) => [c.accountName, c.obligations?.[0].line])).toEqual([['Snooze Co', 'Back today (snoozed until today).']]);
    const replied = workDay(base({ commitments: [snoozedReminder], replies: [{ accountName: 'Snooze Co', contactEmail: 'pat@snooze.example.com', subject: 'Re', snippet: 'Actually, can we talk now?', receivedAt: '2026-10-06T12:00:00Z' }] }));
    const card = replied.cards.find((c) => c.accountName === 'Snooze Co')!;
    expect(card.stateKind).toBe('replied');
    expect(card.obligations?.[0].line).toBe('Back early: pat@snooze.example.com replied Oct 6.');
    // A reply BEFORE the snooze is not a material change.
    expect(workDay(base({ commitments: [snoozedReminder], replies: [{ accountName: 'Snooze Co', contactEmail: 'pat@snooze.example.com', subject: 'Re', snippet: 'Not now.', receivedAt: '2026-10-04T12:00:00Z' }] })).cards.find((c) => c.accountName === 'Snooze Co')?.obligations).toEqual([]);
  });

  it('two due obligations at one account stay two on its card; every open obligation appears exactly once somewhere (no silently omitted task)', () => {
    const cs = [
      commit('Nfi Co', 'deliverable', 'Send the two-site comparison'),
      commit('Nfi Co', 'prepare_meeting', 'Prepare the Thursday walk-through', { dueAt: '2026-10-06T21:00:00Z' }),
      commit('Nfi Co', 'buyer_promise', 'Their volumes', { status: 'waiting', dependency: 'their delivery', dueAt: nyDayAt('2026-10-08').toISOString() }),
      commit('Quiet Co', 'reminder', 'Back to Quiet Co', { status: 'snoozed', snoozeUntil: nyDayAt('2026-10-20').toISOString(), dueAt: nyDayAt('2026-10-20').toISOString() }),
      commit('Done Co', 'task', 'Already done', { status: 'done', proof: { kind: 'seller', id: null, note: null, at: NOW.toISOString(), by: 'x' } }),
      commit('Skip Co', 'task', 'Not doing it', { status: 'skipped', reason: 'no longer relevant' }),
    ];
    const day = workDay(base({ commitments: cs }));
    const nfi = day.cards.find((c) => c.accountName === 'Nfi Co')!;
    expect(nfi.obligations?.map((o) => o.title)).toEqual(['Send the two-site comparison', 'Prepare the Thursday walk-through']);
    expect(nfi.tier).toBe('commitment');
    const seen = [...day.cards.flatMap((c) => (c.obligations ?? []).map((o) => o.key)), ...day.waiting.map((w) => w.key), ...day.snoozed.map((s) => s.key)];
    const open = cs.filter((c) => c.status !== 'done' && c.status !== 'skipped').map((c) => c.commitmentId);
    expect(seen.sort()).toEqual(open.sort());
    expect(day.counts.obligationsDue + day.counts.waiting + day.counts.snoozed).toBe(open.length);
  });

  it('a buyer obligation is never hidden by the seller\'s snooze of the account; a plain snoozed account leaves (A3: that card\'s own move is its obligation)', () => {
    const outcomes = new Map([
      ['Busy Co', { accountName: 'Busy Co', kind: 'snoozed' as const, reason: 'travel', until: '2026-10-09T12:00:00Z', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }],
      ['Quiet Co', { accountName: 'Quiet Co', kind: 'snoozed' as const, reason: null, until: '2026-10-09T12:00:00Z', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }],
    ]);
    const day = workDay(base({ candidates: [cand('ready', 'Busy Co', 'Prepare'), cand('ready', 'Quiet Co', 'Prepare')], outcomes, commitments: [commit('Busy Co', 'answer_request', "Answer Ann's request")] }));
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([['Busy Co', 'commitment']]);
    expect(day.cards[0].outcome?.line).toMatch(/^Snoozed until Oct 9 \(travel\)/);
    expect(day.snoozed.map((s) => s.accountName)).toEqual(['Quiet Co']);
    // A3: Busy Co's READY card was snoozed away; the card that stands was built from its obligation alone.
    const obligationOnly = workDay(base({ commitments: [commit('Only Co', 'answer_request', "Answer Ann's request")], candidates: [cand('ready', 'Ready Co', 'Prepare')] }));
    expect(obligationOnly.cards.find((c) => c.accountName === 'Only Co')?.ownMoveIsObligation).toBe(true);
    expect(obligationOnly.cards.find((c) => c.accountName === 'Ready Co')?.ownMoveIsObligation).toBeUndefined();
  });
});

/**
 * Seller acceptance A2 (2026-10-09). What production did on October 9: two Southern Glazer's and two Swire items derived
 * from out-of-office auto-replies led the day on a May due date, above a prepared first touch (PepsiCo), an open deal
 * with a prepared angle (Kenco) and a proposal to review (Coca-Cola); START assigned the account with nothing prepared.
 * The names below are fixtures only; list.ts names no account.
 */
describe('A2: after the buyer obligations, the executable work ranks by its evidence', () => {
  const ooo = (accountName: string, name: string, email: string, backDay: string): Commitment =>
    commit(accountName, 'reminder', `Follow up with ${name} when they are back`, {
      status: 'snoozed',
      snoozeUntil: nyDayAt(backDay).toISOString(),
      dueAt: nyDayAt(backDay).toISOString(),
      basis: 'Out of office: "I am out of office, returning on 05/26. For urgent matters contact my colleague."',
      person: { personaId: null, name, email },
      source: { kind: 'reply', id: `ooo:${email}:${backDay}` },
      updatedAt: '2026-05-12T14:00:00Z',
    });
  const fixture = (): WorkInput =>
    base({
      replies: [{ accountName: 'Reply Co', contactEmail: 'ann@reply.example.com', subject: 'Re: yards', snippet: 'Happy to talk, what does a pilot look like?', receivedAt: '2026-10-06T13:00:00Z' }],
      // The Kenco shape: an open deal past its close date, with a prepared follow-up (the plan's "Prepare touch 2").
      inDeals: { status: 'complete', accounts: [{ accountName: 'Kenco Shape Co', deals: [{ id: 'd-k', name: 'Kenco Shape Co yard pilot', stage: 'Proposal', lastActivityAt: '2026-09-01T00:00:00Z', closeDate: '2026-09-30' }] }] },
      commitments: [
        commit('Kenco Shape Co', 'follow_up', 'Follow up with Dave Kiesling', { status: 'waiting', dependency: "Dave's reply", dueAt: nyDayAt('2026-10-05').toISOString(), person: { personaId: 9, name: 'Dave Kiesling', email: 'dave@kenco-shape.example.com' }, source: { kind: 'send', id: 'k-send' }, detail: { decisionId: 'dec-k', stepIndex: 0 } }),
        // The Southern Glazer's shape: only an out-of-office reminder whose return day passed in May.
        ooo("Southern Glazer's Shape Co", 'Diego Fonseca', 'diego@sgws-shape.example.com', '2026-05-26'),
        // A current (future) out-of-office stays snoozed.
        ooo('Swire Shape Co', 'Pat Lee', 'pat@swire-shape.example.com', '2026-10-20'),
      ],
      // The PepsiCo shape: a prepared first touch. The Coca-Cola shape: a proposal to review. A cold follow-up with no reply ever.
      dbState: new Map([['PepsiCo Shape Co', { sendable: true, chosen: { name: 'Karen Darling', title: 'Senior Director' } }]]),
      candidates: [cand('review', 'Coca-Cola Shape Co', 'Decide the angle'), cand('follow_up', 'Cold Shape Co', 'Follow up with Mark')],
    });

  it('a real buyer reply stays first; then the open deal with a prepared angle, the prepared first touch, the proposal to review, the cold follow-up; the availability-only account is parked, not an item; the future out-of-office stays snoozed', () => {
    const day = workDay(fixture());
    expect(day.cards.map((c) => [c.accountName, c.tier]), JSON.stringify(day.cards.map((c) => [c.accountName, c.tier, c.rankWhy]))).toEqual([
      ['Reply Co', 'reply'],
      ['Kenco Shape Co', 'deal'],
      ['PepsiCo Shape Co', 'ready'],
      ['Coca-Cola Shape Co', 'review'],
      ['Cold Shape Co', 'follow_up'],
      ["Southern Glazer's Shape Co", 'research'],
    ]);
    const by = (name: string) => day.cards.find((c) => c.accountName === name)!;
    expect(by('Kenco Shape Co').rankWhy).toMatch(/Ranked here: open deal, close date passed; angle prepared\.$/);
    expect(by('Kenco Shape Co').evidence?.rank).toBeLessThan(by('PepsiCo Shape Co').evidence!.rank);
    expect(by('PepsiCo Shape Co').rankWhy).toMatch(/Ranked here: a first touch prepared\.$/);
    expect(by('Coca-Cola Shape Co').rankWhy).toMatch(/Ranked here: a decision to review\.$/);
    expect(by('Cold Shape Co').rankWhy).toMatch(/Ranked here: a follow-up on a cold touch, no reply yet\.$/);
    // The buyer obligation tiers carry no evidence line: their place is the obligation.
    expect(by('Reply Co').evidence).toBeUndefined();
    // The availability-only account: parked, never "needs you", never an obligation, never a Waiting row.
    const sgws = by("Southern Glazer's Shape Co");
    expect(sgws).toMatchObject({ stateKind: 'research', lane: 'research', state: 'Back since May 26 (out-of-office notice); nothing prepared yet', why: 'No supported angle yet: GAP researches it; it returns when there is one.' });
    expect(sgws.obligations).toEqual([]);
    expect(sgws.availability).toEqual({ who: 'Diego Fonseca', email: 'diego@sgws-shape.example.com', returnedDay: '2026-05-26', line: 'Diego Fonseca returned May 26 (their out-of-office notice); no reply from them since.' });
    expect(day.waiting.map((w) => w.accountName)).toEqual([]);
    expect(day.snoozed.map((s) => [s.accountName, s.line])).toEqual([['Swire Shape Co', 'Follow up with Pat Lee when they are back: Scheduled for Oct 20.']]);
    expect(day.counts).toEqual({ needsYou: 5, parked: 1, obligationsDue: 1, waiting: 0, snoozed: 1, availability: 1 });
  });

  it('a prior reply from them lifts a follow-up above a cold one; the seller\'s priority lifts a card above its peers without it; the tuple is deterministic', () => {
    const day = workDay(
      base({
        candidates: [cand('follow_up', 'Cold Co', 'Follow up with Mark'), cand('follow_up', 'Warm Co', 'Follow up with Jo'), cand('review', 'Decide Co', 'Decide'), cand('review', 'Prio Co', 'Decide')],
        // Warm Co: a human reply at the account (the buyer talked once; it is older than the triage window, so it is history, not the card).
        commitments: [commit('Warm Co', 'reminder', 'Come back to Jo: they said not now', { basis: 'Jo: "not now, try me in October"', person: { personaId: null, name: 'Jo', email: 'jo@warm.example.com' }, source: { kind: 'disposition', id: 'dz' } })],
        priorities: new Map([['Prio Co', { reason: 'their VP asked', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }]]),
      }),
    );
    expect(day.cards.map((c) => c.accountName), JSON.stringify(day.cards.map((c) => [c.accountName, c.rankWhy]))).toEqual(['Warm Co', 'Prio Co', 'Decide Co', 'Cold Co']);
    expect(day.cards[0].rankWhy).toMatch(/Ranked here: they have replied before\.$/);
    expect(day.cards[1].rankWhy).toMatch(/Ranked here: you prioritized it \(their VP asked\); a decision to review\.$/);
    expect(evidenceRank({ stateKind: 'follow_up', tier: 'follow_up' }, []).why).toBe('a follow-up on a cold touch, no reply yet');
    expect(evidenceRank({ stateKind: 'in_deal', tier: 'deal', stalled: ['The close date (Sep 30) has passed and the deal is still open. Confirm the real date.'] }, [])).toEqual({ rank: 251, why: 'deal hygiene only (close date passed, nothing prepared)' });
    expect(evidenceRank({ stateKind: 'in_deal', tier: 'deal', dealNextStep: 'Send the scope' }, []).rank).toBeLessThan(evidenceRank({ stateKind: 'ready', tier: 'ready' }, []).rank);
    expect(evidenceRank({ stateKind: 'replied', tier: 'deal', answerOwed: true }, []).why).toMatch(/^a buyer wrote and an answer is owed/);
  });
});
