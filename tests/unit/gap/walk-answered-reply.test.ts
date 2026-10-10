// @vitest-environment node
/**
 * THE WALK FIX, part 1 (Casey, 2026-10-10: "yes, change the command. optimize!"): a reply WE ANSWERED is not a waiting
 * reply. The adversarial audit of his morning: Casey answered Craig Morrison (Kenco) six minutes after Craig's Sep 24
 * reply, from Gmail, and Kenco came back as "Someone replied" every day after. Pinned here:
 *   - the pursuit state reads our sends (the story's touches: Gmail Sent, HubSpot outgoing, GAP first touches, the
 *     account history) and a human reply a later send of ours followed (to that address, or in its thread) never makes
 *     the account REPLIED; it is carried as `answered` and on `lastInbound.answeredAt`
 *   - an opt-out is never answered: it stays OPTED OUT until it is recorded
 *   - Work never makes a card for an answered reply (not "Someone replied", not "Answer them", not the admin "old reply
 *     to triage"), so the plan has no item for it; the answered facts ride on the summaries and are read past the TTL
 *   - the account story says it once: "they wrote <date>; we answered <date>"
 */
import { afterEach, describe, expect, it } from 'vitest';
import { answerOf, projectPursuitState, type PursuitInput } from '@/lib/gap/pursuit/state';
import { clearPursuitSummaries, rememberPursuitSummary, type PursuitSummary } from '@/lib/gap/pursuit/summary';
import { isAnsweredReply, workDay, type WorkInput } from '@/lib/gap/work/list';
import { splitSummaries } from '@/lib/gap/work/load-day';
import { itemsForDay } from '@/lib/gap/work/plan';
import { mergeTouches } from '@/lib/gap/story/touches';
import { projectStory } from '@/lib/gap/story/story';
import { buildAccountBrief, type AccountInputs } from '@/lib/gap/account-intel/build';

const NOW = new Date('2026-10-10T13:00:00Z');
const CRAIG = 'craig.morrison@kencogroup.com';
const REPLY_AT = '2026-09-24T15:00:00.000Z';
const ANSWER_AT = '2026-09-24T15:06:00.000Z';

const kenco = (over: Partial<PursuitInput> = {}): PursuitInput => ({
  accountName: 'Kenco',
  now: NOW,
  motionType: 'FACT_LED',
  opportunity: { status: 'CLEAR', detail: '', deals: [] },
  restriction: null,
  familyHold: null,
  motion: null,
  choice: null,
  activePersona: null,
  replies: [{ from: CRAIG, name: 'Craig Morrison', at: REPLY_AT, subject: 'Re: Primo and the yards', snippet: 'Poking holes in the Primo record now. Can you send the two-site comparison?', triaged: false, id: 'm-craig', threadId: 't-craig' }],
  lastOutbound: null,
  outstandingDraft: null,
  followUpDue: null,
  eligible: [{ key: 'gap:1', personaId: 1, name: 'Dave Kiesling', title: 'VP Transportation' }],
  ...over,
});

afterEach(() => clearPursuitSummaries());

describe('the pursuit state: a reply we answered is not waiting', () => {
  it('Kenco: Craig wrote Sep 24 and Casey answered six minutes later from Gmail: the account is not REPLIED, the answer is carried', () => {
    const waiting = projectPursuitState(kenco());
    expect(waiting.state).toBe('replied');
    expect(waiting.stateLine).toMatch(/^Someone replied: Craig Morrison/);

    const s = projectPursuitState(kenco({ sends: [{ to: CRAIG, at: ANSWER_AT, source: 'Gmail Sent', threadId: 't-craig' }] }));
    expect(s.state).not.toBe('replied');
    expect(s.stateLine).not.toMatch(/replied/i);
    expect(s.answered).toEqual([{ from: CRAIG, at: REPLY_AT, answeredAt: ANSWER_AT, source: 'Gmail Sent', id: 'm-craig' }]);
    expect(s.lastInbound).toMatchObject({ who: 'Craig Morrison', kind: 'human', id: 'm-craig', answeredAt: ANSWER_AT });
    // In a deal, the answered reply leaves the deal frame standing.
    const deal = projectPursuitState(kenco({ motionType: 'IN_DEAL', opportunity: { status: 'OPEN', detail: '', deals: [{ name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] }, sends: [{ to: CRAIG, at: ANSWER_AT, source: 'HubSpot' }] }));
    expect(deal.state).toBe('in_deal');
  });

  it('a send BEFORE the reply, or to someone else in another thread, answers nothing; a send in their thread does', () => {
    expect(projectPursuitState(kenco({ sends: [{ to: CRAIG, at: '2026-09-20T10:00:00.000Z', source: 'Gmail Sent' }] })).state).toBe('replied');
    expect(projectPursuitState(kenco({ sends: [{ to: 'dave.kiesling@kencogroup.com', at: ANSWER_AT, source: 'Gmail Sent', threadId: 't-other' }] })).state).toBe('replied');
    // Reply-all in Craig's thread whose first matching To was Dave: in their thread, after them, it answers Craig.
    const inThread = projectPursuitState(kenco({ sends: [{ to: 'dave.kiesling@kencogroup.com', at: ANSWER_AT, source: 'Gmail Sent', threadId: 't-craig' }] }));
    expect(inThread.state).not.toBe('replied');
    expect(inThread.answered?.[0]).toMatchObject({ from: CRAIG, answeredAt: ANSWER_AT });
  });

  it('an opt-out is never answered: a later send of ours leaves it OPTED OUT until it is recorded', () => {
    const s = projectPursuitState(kenco({ replies: [{ from: 'timothy.cooper@walmart.com', name: null, at: REPLY_AT, subject: 'Re: Leaving this with you', snippet: 'stop', triaged: false, id: 'm-stop' }], sends: [{ to: 'timothy.cooper@walmart.com', at: ANSWER_AT, source: 'Gmail Sent' }] }));
    expect(s.state).toBe('opted_out');
    expect(s.answered).toEqual([]);
    expect(s.lastInbound?.answeredAt).toBeUndefined();
  });

  it('answerOf: the earliest send after the reply to its address or into its thread; a name alone never matches', () => {
    const sends = [
      { to: CRAIG, at: '2026-10-01T10:00:00.000Z', source: 'Gmail Sent' },
      { to: CRAIG.toUpperCase(), at: ANSWER_AT, source: 'HubSpot' },
      { to: CRAIG, at: '2026-09-01T10:00:00.000Z', source: 'GAP ledger' },
    ];
    expect(answerOf({ from: CRAIG, at: REPLY_AT }, sends)).toEqual(sends[1]);
    expect(answerOf({ from: 'Craig Morrison', at: REPLY_AT }, sends)).toBeNull();
    expect(answerOf({ from: CRAIG, at: REPLY_AT }, [])).toBeNull();
    expect(answerOf({ from: CRAIG, at: 'not a date' }, sends)).toBeNull();
  });

  it('the summary carries the answered replies and, when replied, the reply it is about', () => {
    const answered = rememberPursuitSummary(projectPursuitState(kenco({ sends: [{ to: CRAIG, at: ANSWER_AT, source: 'Gmail Sent' }] })), NOW);
    expect(answered.answered).toEqual([{ from: CRAIG, at: REPLY_AT, answeredAt: ANSWER_AT, id: 'm-craig' }]);
    expect(answered.reply).toBeUndefined();
    const waiting = rememberPursuitSummary(projectPursuitState(kenco()), NOW);
    expect(waiting.answered).toBeUndefined();
    expect(waiting.reply).toEqual({ id: 'm-craig', at: REPLY_AT });
  });
});

const input = (over: Partial<WorkInput> = {}): WorkInput => ({
  now: NOW,
  candidates: [],
  replies: [
    { accountName: 'Kenco', contactEmail: CRAIG, fromName: 'Craig Morrison', subject: 'Re: Primo and the yards', snippet: 'Poking holes in the Primo record now. Can you send the two-site comparison?', receivedAt: REPLY_AT, id: 'm-craig' },
    { accountName: 'Boston Beer', contactEmail: 'phil.savastano@bostonbeer.com', fromName: 'Phil Savastano', subject: 'Re: yards', snippet: 'Can you send the four documents we discussed?', receivedAt: '2026-06-12T14:00:00.000Z', id: 'm-phil' },
    { accountName: 'Walmart Inc.', contactEmail: 'timothy.cooper@walmart.com', subject: null, snippet: 'stop', receivedAt: '2026-10-05T14:00:00.000Z', id: 'm-stop' },
  ],
  motions: [],
  inDeals: { status: 'complete', accounts: [] },
  held: new Map(),
  ...over,
});
const answeredFacts: NonNullable<WorkInput['answered']> = [
  { accountName: 'Kenco', from: CRAIG, at: REPLY_AT, answeredAt: ANSWER_AT, id: 'm-craig' },
  // Boston Beer's June reply, matched by address and minute (no id on the fact).
  { accountName: 'Boston Beer', from: 'Phil.Savastano@bostonbeer.com', at: '2026-06-12T14:00:20.000Z', answeredAt: '2026-06-13T09:00:00.000Z' },
  // An opt-out never arrives here from the pursuit read; even if one did, it stays an opt-out card.
  { accountName: 'Walmart Inc.', from: 'timothy.cooper@walmart.com', at: '2026-10-05T14:00:00.000Z', answeredAt: '2026-10-06T09:00:00.000Z', id: 'm-stop' },
];

describe('Work and the plan: an answered reply is never a card or an item', () => {
  it('without the answered facts, Kenco is "Someone replied" and Boston Beer an old reply to triage (admin); with them, neither is a card and the plan holds no item for them; the opt-out stays', () => {
    const before = workDay(input());
    expect(before.cards.find((c) => c.accountName === 'Kenco')?.stateKind).toBe('replied');
    expect(before.cards.find((c) => c.accountName === 'Boston Beer')).toMatchObject({ stateKind: 'replied', tier: 'admin' });
    expect(itemsForDay(before, '2026-10-10').map((x) => x.key)).toEqual(expect.arrayContaining(['reply:m-craig', 'reply:m-phil', 'reply:m-stop']));

    const after = workDay(input({ answered: answeredFacts }));
    expect(after.cards.find((c) => c.accountName === 'Kenco')).toBeUndefined();
    expect(after.cards.find((c) => c.accountName === 'Boston Beer')).toBeUndefined();
    expect(after.cards.find((c) => c.accountName === 'Walmart Inc.')?.stateKind).toBe('opted_out');
    expect(itemsForDay(after, '2026-10-10').map((x) => x.key)).toEqual(['reply:m-stop']);
  });

  it('a recorded reply still owed an answer ("Answer them") is not owed once a send of ours followed it', () => {
    const owed = { accountName: 'Kenco', contactEmail: CRAIG, fromName: 'Craig Morrison', subject: 'Re: Primo', snippet: 'Can you send the two-site comparison?', receivedAt: REPLY_AT, id: 'm-craig', recorded: true as const };
    expect(workDay(input({ replies: [owed] })).cards[0]).toMatchObject({ accountName: 'Kenco', answerOwed: true });
    expect(workDay(input({ replies: [owed], answered: answeredFacts })).cards).toEqual([]);
  });

  it('isAnsweredReply: by message id, else by account, address and minute; another account never matches', () => {
    expect(isAnsweredReply(answeredFacts, { accountName: 'Kenco', contactEmail: 'someone@else.com', receivedAt: '2026-01-01T00:00:00Z', id: 'm-craig' })).toBe(true);
    expect(isAnsweredReply(answeredFacts, { accountName: 'Kenco', contactEmail: CRAIG, receivedAt: '2026-09-24T15:00:40Z' })).toBe(true);
    expect(isAnsweredReply(answeredFacts, { accountName: 'Kenco', contactEmail: CRAIG, receivedAt: '2026-09-24T15:01:00Z' })).toBe(false);
    expect(isAnsweredReply(answeredFacts, { accountName: 'Gusto', contactEmail: CRAIG, receivedAt: REPLY_AT, id: 'm-craig' })).toBe(false);
    expect(isAnsweredReply(undefined, { accountName: 'Kenco', contactEmail: CRAIG, receivedAt: REPLY_AT })).toBe(false);
  });

  it('the day loader reads the answered facts past the TTL: only fresh summaries speak for the cards, every summary\'s answered replies stand', () => {
    const old: PursuitSummary = { accountName: 'Kenco', state: 'in_deal', stateLine: 'In a deal', person: null, blocker: null, coldTouchAllowed: false, nextText: null, at: '2026-10-08T09:00:00.000Z', answered: [{ from: CRAIG, at: REPLY_AT, answeredAt: ANSWER_AT, id: 'm-craig' }] };
    const fresh: PursuitSummary = { accountName: 'Gusto', state: 'ready', stateLine: 'Ready', person: null, blocker: null, coldTouchAllowed: true, nextText: null, at: '2026-10-10T12:55:00.000Z' };
    const split = splitSummaries(new Map<string, PursuitSummary>([['Kenco', old], ['Gusto', fresh]]), NOW);
    expect([...split.fresh.keys()]).toEqual(['Gusto']);
    expect(split.answered).toEqual([{ accountName: 'Kenco', from: CRAIG, at: REPLY_AT, answeredAt: ANSWER_AT, id: 'm-craig' }]);
  });
});

const inputsWith = (over: Partial<AccountInputs>): AccountInputs =>
  ({
    account: { name: 'Kenco', tier: 'Tier 1', priorityBand: 'A', vertical: '3PL', parentBrand: null, hubspotCompanyId: '55608495412' },
    aliases: [], domains: ['kencogroup.com'], siblings: [], watched: true, watchReasons: [],
    facts: [], signals: [], lastResearch: null, hypotheses: [], bids: [],
    personas: [{ id: 1, name: 'Craig Morrison', title: 'VP Operations', email: CRAIG, doNotContact: false, hasEmail: true, emailStatus: 'valid' }], candidates: [], memberships: [], firstTouches: [], conversation: null,
    opportunity: { status: 'ACTIVE', detail: '', deals: [{ id: '62704698979', name: 'YardFlow - Kenco', stage: 'Presentation scheduled' }] },
    pack: null, microsite: null, facilityFact: null, roi: null,
    ...over,
  }) as unknown as AccountInputs;

function storyRow(sent: NonNullable<AccountInputs['sent']>['messages']) {
  const inputs = inputsWith({ sent: { read: true, detail: null, messages: sent } });
  const state = projectPursuitState(kenco({ sends: sent.map((m) => ({ to: m.to, at: m.at, source: 'Gmail Sent', threadId: m.threadId })) }));
  const touches = mergeTouches({ history: [], firstTouches: [], clawd: { read: 'ok', sends: [] }, replies: [{ from: state.lastInbound!.who, at: state.lastInbound!.at, snippet: state.lastInbound!.snippet, kind: state.replyClass!.kind, label: state.replyClass!.label, address: state.lastInbound!.from ?? null }], people: inputs.personas.map((p) => ({ name: p.name, title: p.title, email: p.email ?? null })), sent: inputs.sent ?? null, now: NOW });
  const story = projectStory({ accountName: 'Kenco', now: NOW, state, brief: buildAccountBrief(inputs, NOW), inputs, whyNow: [], know: [], touches, clawdRead: 'ok', vaultNote: null, excluded: [] });
  return story.rows.find((r) => r.key === 'between_us')!;
}

describe('the story says it once: "they wrote <date>; we answered <date>"', () => {
  it('our answer is our last send: ONE sentence, their words then ours, never "We wrote" beside "replied" for the same exchange', () => {
    const row = storyRow([{ id: 's1', to: CRAIG, subject: 'Re: Primo and the yards', at: ANSWER_AT, excerpt: 'Craig, here it is.', threadId: 't-craig' }]);
    const texts = row.sentences.map((s) => s.text);
    expect(texts[0], texts.join(' | ')).toBe('Craig Morrison, VP Operations wrote Sep 24: "Poking holes in the Primo record now. Can you send the two-site comparison?"; we answered Sep 24: "Primo and the yards". No answer on record. The email it answered is not in GAP\'s ledgers.');
    expect(row.sentences[0]).toMatchObject({ tag: 'Buyer said', basis: 'GAP ledger, Sep 24; Gmail Sent, Sep 24' });
    expect(texts.join(' ')).not.toMatch(/We wrote Craig|replied on/);
    expect(texts.filter((t) => /Sep 24/.test(t))).toHaveLength(1);
  });

  it('a later send of ours after the answer stays its own sentence; the reply sentence names the answer\'s day only', () => {
    const row = storyRow([
      { id: 's2', to: CRAIG, subject: 'Primo, the comparison', at: '2026-10-09T10:00:00.000Z', excerpt: '', threadId: 't-2' },
      { id: 's1', to: CRAIG, subject: 'Re: Primo and the yards', at: ANSWER_AT, excerpt: '', threadId: 't-craig' },
    ]);
    const texts = row.sentences.map((s) => s.text);
    expect(texts[0]).toBe('We wrote Craig Morrison, VP Operations on Oct 9: "Primo, the comparison". No answer owed yet.');
    expect(texts[1]).toBe('Craig Morrison, VP Operations wrote Sep 24: "Poking holes in the Primo record now. Can you send the two-site comparison?"; we answered Sep 24. The email it answered is not in GAP\'s ledgers.');
  });
});
