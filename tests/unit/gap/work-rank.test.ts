/**
 * R41 (GAP OS execution recovery): Work ranks today's work by commercial obligations. A buyer commitment due today
 * first, then actionable replies, meetings within 24 hours, an open deal's due step, follow-ups due, prepared
 * prospecting, proposals to review, research. Inside a tier: the due time, then the newest buyer activity, then the
 * seller's explicit priority, each said on the card. Waiting work is counted, never a card; a snooze returns on its date
 * or when the buyer moves; two due obligations at one account stay two; every open obligation is somewhere.
 */
import { describe, expect, it } from 'vitest';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
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
  it('a customer-promised deliverable outranks a new article; the order is commitment, reply, meeting, deal step, follow-up, ready, review, research', () => {
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
      ['Follow Co', 'follow_up'],
      ['Ready Co', 'ready'],
      ['Review Co', 'review'],
      ['Article Co', 'research'],
    ]);
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
    expect(day.counts).toEqual({ needsYou: 8, obligationsDue: 3, waiting: 0, snoozed: 0 });
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
    expect(day.cards[2].rankWhy).toBe('A prepared first touch; you prioritized it (their CFO asked for it at the conference).');
    expect(day.cards[2].priority).toMatchObject({ reason: 'their CFO asked for it at the conference' });
    // The newest buyer activity breaks a tie between two replies that arrived at the same due time.
    const replies = workDay(base({ replies: [{ accountName: 'Old Co', contactEmail: 'a@old.example.com', subject: 'Re', snippet: 'Can you call me?', receivedAt: '2026-10-05T13:00:00Z' }, { accountName: 'New Co', contactEmail: 'b@new.example.com', subject: 'Re', snippet: 'Let us talk Thursday.', receivedAt: '2026-10-06T13:00:00Z' }] }));
    expect(replies.cards.map((c) => [c.accountName, c.rankWhy])).toEqual([
      ['Old Co', 'A buyer replied Oct 5.'],
      ['New Co', 'A buyer replied Oct 6.'],
    ]);
  });
});

describe('waiting, snoozed and the count that says "needs you" (R41)', () => {
  it('distant waiting items do not inflate needs you: a deliverable due Friday, a follow-up not yet due and a blocked task are counted under Waiting, never cards', () => {
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
    expect(day.counts).toEqual({ needsYou: 1, obligationsDue: 0, waiting: 3, snoozed: 0 });
    // Waiting is ordered by the day each item is due (the blocked task was due today).
    expect(day.waiting.map((w) => [w.accountName, w.line])).toEqual([
      ['Legal Co', 'Blocked: their legal review.'],
      ['Friday Co', 'Due Oct 9.'],
      ['Sent Co', "Waiting on Glen's reply; follow up Oct 12."],
    ]);
  });

  it('a snoozed item returns only when due or when the buyer moved after it was snoozed', () => {
    const snoozedReminder = commit('Snooze Co', 'reminder', 'Back to Snooze Co: travel', { status: 'snoozed', snoozeUntil: nyDayAt('2026-10-09').toISOString(), dueAt: nyDayAt('2026-10-09').toISOString(), updatedAt: '2026-10-05T12:00:00Z', source: { kind: 'disposition', id: 'd' } });
    const asleep = workDay(base({ commitments: [snoozedReminder] }));
    expect(asleep.cards).toEqual([]);
    expect(asleep.snoozed).toEqual([{ key: snoozedReminder.commitmentId, accountName: 'Snooze Co', line: 'Back to Snooze Co: travel: Snoozed until Oct 9.', until: snoozedReminder.snoozeUntil }]);
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

  it('a buyer obligation is never hidden by the seller\'s snooze of the account; a plain snoozed account leaves', () => {
    const outcomes = new Map([
      ['Busy Co', { accountName: 'Busy Co', kind: 'snoozed' as const, reason: 'travel', until: '2026-10-09T12:00:00Z', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }],
      ['Quiet Co', { accountName: 'Quiet Co', kind: 'snoozed' as const, reason: null, until: '2026-10-09T12:00:00Z', by: 'casey@freightroll.com', at: '2026-10-06T12:00:00Z' }],
    ]);
    const day = workDay(base({ candidates: [cand('ready', 'Busy Co', 'Prepare'), cand('ready', 'Quiet Co', 'Prepare')], outcomes, commitments: [commit('Busy Co', 'answer_request', "Answer Ann's request")] }));
    expect(day.cards.map((c) => [c.accountName, c.tier])).toEqual([['Busy Co', 'commitment']]);
    expect(day.cards[0].outcome?.line).toMatch(/^Snoozed until Oct 9 \(travel\)/);
    expect(day.snoozed.map((s) => s.accountName)).toEqual(['Quiet Co']);
  });
});
