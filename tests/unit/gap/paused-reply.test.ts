/**
 * PAUSED REPLY (Casey, 2026-10-10, verbatim): "Correct paused-reply presentation. A reply paused by the send gate must
 * show its actual condition and reason, consistently across Gmail, the account page and the work queue. Preserve the
 * buyer's message and distinguish a received reply from a paused proposed action. Don't leave 'Someone replied' as the
 * only explanation or imply anything was sent."
 *
 * Pinned over ONE fixture (Dana Trans at NFI Industries wrote on Oct 9; the send gate holds the proposed first touch to
 * Sam Ortiz until her reply is recorded): the pursuit state is the one source (work/truth-text.ts says it), and the
 * account page's NOW, the Work card, the briefing's item line and the assignment packet's first line say the same two
 * sentences, the reply received (her words) and the action paused (the gate's reason, nothing sent), apart.
 */
import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
import { AccountNowView } from '@/components/gap/account-now';
import type { NowView } from '@/lib/gap/context/now';
import { projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { clearPursuitSummaries, rememberPursuitSummary } from '@/lib/gap/pursuit/summary';
import { workDay, type WorkInput } from '@/lib/gap/work/list';
import { itemsForDay, type DayPlan } from '@/lib/gap/work/plan';
import { itemLine } from '@/lib/gap/work/briefing';
import { buildAssignment } from '@/lib/gap/work/assignment';
import { compactContext } from '@/lib/gap/ask/grounding';
import { pausedReplySentences, pausedStateLine } from '@/lib/gap/work/truth-text';
import type { RelationshipState } from '@/lib/gap/work/relationship-state';
import { ledgerDb } from './fixtures/ledger-db';

const NOW = new Date('2026-10-10T13:00:00Z');
const ACCOUNT = 'NFI Industries';
const DANA = 'dana.trans@nfi.example';
const WORDS = 'Send me the two-site comparison and we can talk Thursday.';
const AT = '2026-10-09T14:00:00.000Z';
const HOLD = { from: DANA, receivedAt: AT, snippet: WORDS, id: 'm-dana' };
const motion = { state: 'paused_reply', primary: null, next: { personaId: 7, name: 'Sam Ortiz', title: 'VP Transportation', unlock: `after ${DANA}'s reply is triaged in Replies` }, headline: `Paused: ${DANA} at ${ACCOUNT} wrote in on 2026-10-09. Triage it in Replies before anyone there gets a cold email.`, pausedBy: HOLD };
const RECEIVED = `A reply from Dana Trans on Oct 9 was received ("${WORDS}").`;
const PAUSED = 'The proposed first touch to Sam Ortiz is paused by the send gate: the reply is not recorded yet; nothing was sent.';
const LINE = 'Reply on record: Dana Trans, Oct 9. First touch to Sam Ortiz paused, nothing sent';

const pursuitInput = (over: Partial<PursuitInput> = {}): PursuitInput => ({
  accountName: ACCOUNT, now: NOW, motionType: 'FACT_LED', opportunity: { status: 'CLEAR', detail: '', deals: [] }, restriction: null, familyHold: null,
  motion, choice: null, activePersona: null,
  replies: [{ from: DANA, name: 'Dana Trans', at: AT, subject: 'Re: yards', snippet: WORDS, triaged: false, id: 'm-dana', threadId: 't-dana' }],
  lastOutbound: null, outstandingDraft: null, followUpDue: null,
  eligible: [{ key: 'gap:7', personaId: 7, name: 'Sam Ortiz', title: 'VP Transportation' }],
  ...over,
});
const workInput = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NOW,
  candidates: [],
  replies: [{ accountName: ACCOUNT, contactEmail: DANA, subject: 'Re: yards', snippet: WORDS, receivedAt: AT, id: 'm-dana', threadId: 't-dana', fromName: 'Dana Trans' }],
  motions: [{ accountName: ACCOUNT, state: 'paused_reply', primary: null, next: { name: 'Sam Ortiz', title: 'VP Transportation', unlock: motion.next.unlock }, pausedBy: HOLD }],
  inDeals: { status: 'complete', accounts: [] },
  held: new Map(),
  ...over,
});
const v: NowView = {
  name: ACCOUNT, stateLine: '3PL · Direct buyer · Someone replied · Owner: Casey', lastTouch: 'No touch on record.', lastReply: null, unit: null,
  next: { text: 'Read the reply.', source: 'motion' }, who: null, betterFit: null, whoUnknown: null, alternate: null,
  whyNow: [], gap: [], currentState: 'Current state: not confirmed by the buyer.', know: [], think: null, impact: 'Impact: unknown.', ask: null, relationship: null, private: null, wedge: null, asset: null, listen: ACCOUNT,
};
const reads = { inbox: { read: true, count: 1, detail: null }, sent: { read: true, count: 0, detail: null }, drafts: { read: false, count: 0, detail: 'Gmail drafts not read' }, engagements: { read: true, count: 0, detail: null }, commitments: { read: true, count: 0 }, deals: { read: true, detail: null }, conversations: { read: true, count: 0 } };
const relationship = async (): Promise<RelationshipState> => ({
  person: { email: DANA, name: 'Dana Trans' }, purpose: 'buyer_conversation', purposeWord: 'buyer', lastInbound: { at: AT, subject: 'Re: yards', purpose: 'buyer_conversation', excerpt: WORDS, threadId: 't-dana' }, lastOutbound: null, laterResponse: null,
  answerOwed: { owed: true, basis: 'they wrote Oct 9, 2026; nothing sent since', known: true }, quiet: { quiet: false, days: 1, basis: 'they wrote Oct 9, 2026' }, request: null, requestState: 'none', referral: null, correspondents: [], hubspotCompanyId: null,
  outboundRead: { read: true, basis: 'our Sent was read' }, reads, meetings: [], nextMeetingAt: null, deals: [], promises: [], drafts: [], optOut: null,
  links: { thread: null, threadKind: null, hubspotContact: null, hubspotCompany: null }, searched: 'the synced inbox; read Oct 10, 2026, 9:00 AM New York',
} as unknown as RelationshipState);

describe('one source: the pursuit state under the send gate\'s reply hold', () => {
  it('says the reply received (her words) and the first touch paused (the reason, nothing sent) as two sentences, never "Someone replied" alone', () => {
    const s = projectPursuitState(pursuitInput());
    expect(s.paused).toBeTruthy();
    expect(pausedReplySentences(s.paused!)).toEqual([RECEIVED, PAUSED]);
    expect(s.stateLine).toBe(LINE);
    expect(pausedStateLine(s.paused!)).toBe(LINE);
    expect(s.blocker).toBe(`${RECEIVED} ${PAUSED}`);
    expect(`${s.stateLine} ${s.blocker}`).not.toMatch(/Someone replied|was sent to|we sent/);
  });
});

describe('the three surfaces say the same condition', () => {
  it('the account page (NOW): the state line, then the reply received and the action paused on two lines; the inbound line is not said again', () => {
    const state = projectPursuitState(pursuitInput());
    render(createElement(AccountNowView, { v, nextHref: null, nextLabel: null, nextText: "Read Dana Trans's reply of Oct 9 and record what they said.", links: [], pursuit: { state, stack: null, hypothesisId: null, excluded: [] } }));
    expect(screen.getByTestId('now-state').textContent).toBe(`3PL · Direct buyer · ${LINE} · Owner: Casey`);
    expect(screen.getByTestId('now-paused-reply').textContent).toBe(RECEIVED);
    expect(screen.getByTestId('now-paused-action').textContent).toBe(PAUSED);
    expect(screen.queryByTestId('now-last-inbound')).toBeNull();
    expect(screen.getByTestId('account-now').textContent).not.toMatch(/Someone replied/);
  });

  it('the Work card: the same line, why and blocker, with the message panel kept; the workspace summary says the same over a card with no panel', () => {
    clearPursuitSummaries();
    const state = projectPursuitState(pursuitInput());
    const summaries = new Map([[ACCOUNT, rememberPursuitSummary(state, NOW, "Read Dana Trans's reply of Oct 9 and record what they said.")]]);
    for (const day of [workDay(workInput()), workDay(workInput({ summaries })), workDay(workInput({ replies: [], candidates: [{ lane: 'ready', accountName: ACCOUNT, title: 'Contact Sam Ortiz', detail: 'Ready.', href: '/gap/pack/d-1', sortKey: [1] }], summaries }))]) {
      const card = day.cards.find((c) => c.accountName === ACCOUNT)!;
      expect(card.stateKind).toBe('replied');
      expect([card.state, card.why, card.blocker]).toEqual([LINE, RECEIVED, PAUSED]);
      expect(card.paused?.reply.words).toBe(WORDS);
    }
    expect(workDay(workInput()).cards[0].reply?.snippet).toBe(WORDS);
  });

  it('Gmail: the briefing item line and the assignment packet\'s first line say the line, then the reply received and the action paused; the buyer\'s words stay', async () => {
    clearPursuitSummaries();
    const state = projectPursuitState(pursuitInput());
    const day = workDay(workInput({ summaries: new Map([[ACCOUNT, rememberPursuitSummary(state, NOW, "Read Dana Trans's reply of Oct 9 and record what they said.")]]) }));
    const items = itemsForDay(day, '2026-10-10');
    const item = items.find((x) => x.accountName === ACCOUNT)!;
    expect(item.title).toBe(LINE);
    expect(item.context?.lastExchange).toContain(WORDS);
    expect(itemLine(item, 1)).toBe(`1. ${ACCOUNT}: ${LINE}. Dana Trans. A buyer replied Oct 9.`);
    const plan: DayPlan = { day: '2026-10-10', plannedAt: NOW.toISOString(), fresh: true, items, counts: day.counts };
    const ctx = compactContext({ accountName: ACCOUNT, state, nextText: "Read Dana Trans's reply of Oct 9 and record what they said.", story: null, anchor: null, stack: null });
    expect(ctx.state.paused).toBe(`${RECEIVED} ${PAUSED}`);
    const a = await buildAssignment(ledgerDb({ accounts: [ACCOUNT] }, NOW).client(), { plan, item, revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW }, { askContext: async () => ctx, pursued: async () => [], packet: { relationship, contact: { hubspotContact: null } }, senderEmail: null });
    const first = a.text.split('\n')[0];
    expect(first).toBe(`${ACCOUNT}: Dana Trans. Why now: A buyer replied Oct 9. ${RECEIVED} ${PAUSED} As of Oct 10, 2026, 9:00 AM New York.`);
    expect(a.subject).toContain(`${ACCOUNT}: ${LINE}`);
    expect(a.text).not.toMatch(/Someone replied/);
  });
});
