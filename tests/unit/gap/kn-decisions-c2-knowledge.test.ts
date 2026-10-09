// @vitest-environment node
/**
 * Knowledge program C2 (2026-10-09): what the vault holds on an account is RANKING EVIDENCE. A conversation held within
 * thirty days is relationship history (the same level as a prior reply); the account note's next action due within
 * seven days, or past, is deal context; both are named in rankWhy; the card carries the summary so the assignment can
 * print the next action. An undated next action, or a conversation older than the window, is context on the card and
 * never evidence. Without a clock, evidenceRank reads no knowledge. Every work-rank pin stands (knowledge absent is
 * exactly the day before this).
 */
import { describe, expect, it } from 'vitest';
import { evidenceRank, knowledgeEvidence, workDay, type AccountKnowledge, type WorkInput } from '@/lib/gap/work/list';
import type { Commitment } from '@/lib/gap/work/commitment-model';
import type { NextCandidate } from '@/lib/gap/routing/next-up';

const NOW = new Date('2026-10-09T15:00:00Z'); // Fri Oct 9, 11 am New York
const cand = (lane: NextCandidate['lane'], accountName: string, title: string, sortKey: Array<number | string> = [0]): NextCandidate => ({ lane, accountName, title, detail: `${accountName}: ${title.toLowerCase()}.`, href: `/gap?lane=${lane}`, sortKey });
const base = (over: Partial<WorkInput> = {}): WorkInput => ({ now: NOW, candidates: [], replies: [], motions: [], inDeals: { status: 'complete', accounts: [] }, held: new Map(), ...over });
const kn = (over: Partial<AccountKnowledge> = {}): AccountKnowledge => ({ lastConversationAt: null, conversations: 0, nextAction: null, nextActionDue: null, lastTouched: null, ...over });
const KENCO: AccountKnowledge = kn({ lastConversationAt: '2026-09-16T18:00:00Z', conversations: 2, nextAction: 'Regroup with Craig the week of Oct 12', nextActionDue: '2026-10-15', lastTouched: '2026-10-09T12:00:00Z' });
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
const three = () => [cand('follow_up', 'Kenco', 'Follow up with Dave'), cand('follow_up', 'Cold Co', 'Follow up with Mark'), cand('ready', 'Ready Co', 'Prepare the first touch')];

describe('C2: the vault as ranking evidence', () => {
  it('without knowledge the day is what it was: the prepared first touch, then the two cold follow-ups by name', () => {
    const day = workDay(base({ candidates: three() }));
    expect(day.cards.map((c) => c.accountName)).toEqual(['Ready Co', 'Cold Co', 'Kenco']);
    expect(day.cards.every((c) => c.knowledge === undefined), 'no card carries knowledge').toBe(true);
    expect(day.cards.find((c) => c.accountName === 'Kenco')!.rankWhy).toMatch(/Ranked here: a follow-up on a cold touch, no reply yet\.$/);
  });

  it('a conversation within thirty days is relationship history: Kenco leaves the cold follow-ups, ranks after the prepared first touch, and says so', () => {
    const day = workDay(base({ candidates: three(), knowledge: new Map([['Kenco', kn({ lastConversationAt: '2026-09-16T18:00:00Z', conversations: 1 })]]) }));
    expect(day.cards.map((c) => c.accountName), 'a prior conversation outranks a cold follow-up but not a prepared touch').toEqual(['Ready Co', 'Kenco', 'Cold Co']);
    const kenco = day.cards[1];
    expect(kenco.rankWhy).toMatch(/Ranked here: a conversation Sep 16 \(the vault\)\.$/);
    expect(kenco.evidence?.why).toBe('a conversation Sep 16 (the vault)');
    expect(kenco.knowledge, 'the card carries the summary').toEqual(kn({ lastConversationAt: '2026-09-16T18:00:00Z', conversations: 1 }));
  });

  it('a next action due within seven days is deal context: Kenco leads the prepared first touch, with the action and its due day in rankWhy', () => {
    const day = workDay(base({ candidates: three(), knowledge: new Map([['Kenco', KENCO]]) }));
    expect(day.cards.map((c) => c.accountName)).toEqual(['Kenco', 'Ready Co', 'Cold Co']);
    expect(day.cards[0].rankWhy).toBe("A follow-up is due. Ranked here: the vault's next action: Regroup with Craig the week of Oct 12, due Oct 15; a conversation Sep 16 (the vault).");
    expect(day.cards[0].knowledge).toEqual(KENCO);
    // Past due reads the same way, with the day it was due.
    const past = workDay(base({ candidates: three(), knowledge: new Map([['Kenco', kn({ nextAction: 'Send the Nashville numbers', nextActionDue: '2026-10-01' })]]) }));
    expect(past.cards[0].accountName).toBe('Kenco');
    expect(past.cards[0].evidence?.why, 'deal context from the vault; the cold follow-up is still said').toBe("the vault's next action: Send the Nashville numbers, due Oct 1; a follow-up on a cold touch, no reply yet");
  });

  it('beyond the windows the vault is context on the card, never evidence: a next action due in eleven days is said with its day, a conversation forty days old is not', () => {
    const later = kn({ lastConversationAt: '2026-08-30T18:00:00Z', conversations: 1, nextAction: 'Regroup with Craig after peak.', nextActionDue: '2026-10-20' });
    const day = workDay(base({ candidates: three(), knowledge: new Map([['Kenco', later]]) }));
    expect(day.cards.map((c) => c.accountName), 'the order is the no-knowledge order').toEqual(['Ready Co', 'Cold Co', 'Kenco']);
    const kenco = day.cards[2];
    expect(kenco.evidence?.why, 'no evidence from the vault').toBe('a follow-up on a cold touch, no reply yet');
    expect(kenco.rankWhy).toBe("A follow-up is due; the vault's next action: Regroup with Craig after peak, due Oct 20. Ranked here: a follow-up on a cold touch, no reply yet.");
    expect(kenco.knowledge).toEqual(later);
    // An undated next action is said without a day.
    const undated = workDay(base({ candidates: three(), knowledge: new Map([['Kenco', kn({ nextAction: 'Regroup with Craig' })]]) }));
    expect(undated.cards.find((c) => c.accountName === 'Kenco')!.rankWhy).toBe("A follow-up is due; the vault's next action: Regroup with Craig. Ranked here: a follow-up on a cold touch, no reply yet.");
  });

  it('a buyer-obligation card (not an evidence tier) still carries the knowledge and says the next action, and a card with a reply says both the reply and the conversation', () => {
    const day = workDay(base({ commitments: [commit('Kenco', 'deliverable', 'Send Dave the comparison')], knowledge: new Map([['Kenco', KENCO]]) }));
    expect(day.cards[0]).toMatchObject({ accountName: 'Kenco', tier: 'commitment', knowledge: KENCO });
    expect(day.cards[0].rankWhy).toBe("A buyer commitment is due: Send Dave the comparison (due today); the vault's next action: Regroup with Craig the week of Oct 12, due Oct 15; a conversation Sep 16 (the vault).");
    expect(day.cards[0].evidence, 'the obligation tiers rank by the obligation, not by evidence').toBeUndefined();
    const replied = evidenceRank({ reply: { at: '2026-10-01T12:00:00Z' } as never, stateKind: 'follow_up', tier: 'follow_up', knowledge: kn({ lastConversationAt: '2026-09-16T18:00:00Z', conversations: 1 }) }, [], { now: NOW });
    expect(replied.why).toBe('they have replied before; a conversation Sep 16 (the vault)');
  });

  it('evidenceRank reads no knowledge without a clock, and knowledgeEvidence is the one reading', () => {
    const card = { stateKind: 'follow_up' as const, tier: 'follow_up' as const, knowledge: KENCO };
    expect(evidenceRank(card, []).why, 'no clock: the vault is not read').toBe('a follow-up on a cold touch, no reply yet');
    expect(evidenceRank(card, [], { now: NOW }).why).toBe("the vault's next action: Regroup with Craig the week of Oct 12, due Oct 15; a conversation Sep 16 (the vault)");
    expect(knowledgeEvidence(KENCO, NOW)).toEqual({ conversation: 'a conversation Sep 16 (the vault)', nextAction: "the vault's next action: Regroup with Craig the week of Oct 12, due Oct 15" });
    // The edges: thirty days is in, thirty-one is out; seven days ahead is in, eight is out; a future conversation is not held.
    expect(knowledgeEvidence(kn({ lastConversationAt: '2026-09-09T15:00:00Z' }), NOW).conversation).toBe('a conversation Sep 9 (the vault)');
    expect(knowledgeEvidence(kn({ lastConversationAt: '2026-09-08T14:00:00Z' }), NOW).conversation).toBeNull();
    expect(knowledgeEvidence(kn({ lastConversationAt: '2026-10-14T18:00:00Z' }), NOW).conversation).toBeNull();
    expect(knowledgeEvidence(kn({ nextAction: 'x', nextActionDue: '2026-10-16' }), NOW).nextAction).toBe("the vault's next action: x, due Oct 16");
    expect(knowledgeEvidence(kn({ nextAction: 'x', nextActionDue: '2026-10-17' }), NOW).nextAction).toBeNull();
    expect(knowledgeEvidence(kn({ nextAction: null, nextActionDue: '2026-10-10' }), NOW).nextAction, 'a due day with no action is nothing').toBeNull();
    expect(knowledgeEvidence(kn({ nextAction: 'x', nextActionDue: 'next week' }), NOW).nextAction, 'a due that is not a day is nothing').toBeNull();
  });
});
