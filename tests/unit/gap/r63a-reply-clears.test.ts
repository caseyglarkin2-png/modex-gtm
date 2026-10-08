/**
 * R63-A S1: after Nfi's reply was recorded, its card stayed about three minutes past a Refresh and read "A buyer replied
 * Dec 31.". A fresh read no longer lists the recorded reply, so the old check (the reply recorded AND still in the
 * remembered list) never saw it, and the remembered "replied" summary relabelled the account's READY card, whose sort
 * key 0 became the date. The page's composition now drops a "replied" summary when the complete list has no reply
 * waiting there, and a reply's day is the message's received date or none.
 */
import { describe, expect, it } from 'vitest';
import { withoutRecordedReplies } from '@/lib/gap/work/recorded-replies';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import type { PursuitSummary } from '@/lib/gap/pursuit/summary';

const NOW = new Date('2026-10-07T22:00:00Z');
const NFI = 'Nfi Scratch Co r63';
const replied: PursuitSummary = { accountName: NFI, state: 'replied', stateLine: 'Someone replied: Person1 Scratch, Oct 7', person: { name: 'Person1 Scratch', title: null }, blocker: null, coldTouchAllowed: false, nextText: 'Read the reply.', actionable: null, at: '2026-10-07T21:50:00.000Z' };
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: NOW, candidates: [], replies: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [] }, dbState: new Map([[NFI, { sendable: true, chosen: { name: 'Person1 Scratch', title: null } }]]), ...over });

describe('R63-A S1: a recorded reply\'s card clears on the next Refresh, with a real date', () => {
  it('the fresh, complete read (the recorded reply gone from it) drops the remembered "replied"; an incomplete read keeps it', () => {
    const summaries = new Map([[NFI, replied]]);
    expect(withoutRecordedReplies([], summaries, new Set(), { complete: true }).summaries?.has(NFI)).toBe(false);
    expect(withoutRecordedReplies([], summaries, new Set(), { complete: false }).summaries?.has(NFI)).toBe(true);
    // A reply still waiting keeps it.
    const waiting = [{ id: 'm9', accountName: NFI }];
    expect(withoutRecordedReplies(waiting, summaries, new Set(), { complete: true }).summaries?.has(NFI)).toBe(true);
    // Composed as the page does: the card is no longer a reply.
    const live = withoutRecordedReplies([], summaries, new Set(), { complete: true });
    const card = workDay(base({ summaries: live.summaries })).cards.find((c) => c.accountName === NFI)!;
    expect(card.stateKind).not.toBe('replied');
  });

  it('a card relabelled "replied" without its message claims no day; a real reply card says its received day', () => {
    const relabelled = workDay(base({ summaries: new Map([[NFI, replied]]) })).cards.find((c) => c.accountName === NFI)!;
    expect(relabelled.rankWhy ?? '').not.toMatch(/Dec 31|1969/);
    const real = workDay(base({ dbState: new Map(), replies: [{ accountName: NFI, contactEmail: 'person1@nfi-scratch-co-r63.example.com', fromName: 'Person1 Scratch', subject: 'Re: trailer turns', snippet: 'Can you send the case study by Friday?', receivedAt: '2026-10-07T19:49:00.000Z', id: 'm1' }] })).cards.find((c) => c.accountName === NFI)!;
    expect(real.rankWhy).toMatch(/Oct 7/);
    expect(real.rankWhy).not.toMatch(/Dec 31/);
  });
});
