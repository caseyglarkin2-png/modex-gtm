// @vitest-environment node
/**
 * C31, C32, C33 (GAP OS commercial context and execution audit, 2026-10-08): the briefing's counts, cards and greeting.
 *   C31  the headline names its count basis: "N to execute" is the plan's items (the durable list START and NEXT
 *        walk, in that order; item 1 is named beside the START link) and "M to decide" is the intelligence shown,
 *        counted apart. Zero and mixed states.
 *   C32  each card carries identity, relationship or motion, why surfaced, the last material exchange, the next
 *        prepared action (whole), source and date, and its own deep link; an intelligence item at an account with an
 *        open deal (Kenco) links to the deal brief, never generic Work; a long deal next step is not cut mid-sentence.
 *   C33  the greeting follows the New York hour of the send (21:47 is not "good morning"); a replay of an earlier
 *        plan states when that plan was made.
 */
import { describe, expect, it } from 'vitest';
import { clipAtSentence, greetingFor, itemCardLines, renderBriefing, type BriefingIntel } from '@/lib/gap/work/briefing';
import { cardContext, itemsForDay, obligationContext, type DayPlan, type PlanItem } from '@/lib/gap/work/plan';
import { workDay, type WorkCard, type WorkInput } from '@/lib/gap/work/list';
import type { IntelItem } from '@/lib/gap/work/intel';

const MORNING = new Date('2026-10-08T11:05:00Z'); // 7:05 am New York
const NIGHT = new Date('2026-10-09T01:47:00Z'); // 9:47 pm New York, Oct 8
const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token.slice(0, 4)}`, decide: (key: string, d: string) => `https://x/decide/${encodeURIComponent(key)}/${d}`, account: (name: string) => `https://x/accounts/${name.toLowerCase()}/`, deal: (name: string) => `https://x/accounts/${name.toLowerCase()}/?view=brief` };
const item = (over: Partial<PlanItem> & { key: string; rank: number; accountName: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, token: 'a'.repeat(32), ...over });
const plan = (items: PlanItem[], over: Partial<DayPlan> = {}): DayPlan => ({ day: '2026-10-08', plannedAt: '2026-10-08T11:00:00.000Z', fresh: true, counts: { needsYou: items.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, items, ...over });
const intelItem = (over: Partial<IntelItem> & { kind: IntelItem['kind']; id: string; title: string }): IntelItem => ({ key: `${over.kind}:${over.id}`, source: 'news.example', url: null, publishedAt: null, observedAt: '2026-10-01T00:00:00.000Z', truth: 'historical_observation', line: 'news.example, published Jun 24, 2026. Historical observation.', accountName: null, accountHint: null, relevance: null, categories: [], person: null, decisions: ['pursue', 'skip', 'dismiss', 'more'], rank: 0, ...over });
const intelOf = (signals: IntelItem[], people: IntelItem[] = [], totals = { signals: signals.length, triggers: 0, people: people.length }): BriefingIntel => ({ signals, triggers: [], people, totals, angles: {} });

const THREE = [
  item({ key: 'commitment:c-1', rank: 0, accountName: 'Kenco', kind: 'commitment', stateKind: 'in_deal', title: 'Send Diego the dock schedule template', why: 'Due today', href: '/gap/accounts/kenco', person: { name: 'Diego Fonseca', title: null }, refs: { commitmentId: 'c-1' }, token: 'b'.repeat(32), context: { motion: 'Deal: YardFlow - Kenco', lastExchange: 'Diego: can you send me the dock schedule template by Friday?', nextAction: 'Send it from the deal brief', source: 'the recorded buyer words', date: '2026-10-08T13:00:00.000Z' } }),
  item({ key: 'reply:msg-77', rank: 1, accountName: 'Boston Beer', kind: 'reply', stateKind: 'replied', title: 'Someone replied', why: 'Phil Savastano wrote Oct 8', href: '/gap/accounts/boston-beer#record-reply', person: { name: 'Phil Savastano', title: 'VP Operations' }, token: 'c'.repeat(32) }),
  item({ key: 'first_touch:dec-1', rank: 2, accountName: 'PepsiCo', person: { name: 'Karen Ortiz', title: 'Director, Transportation' }, token: 'd'.repeat(32) }),
];

describe('C31: the headline names its count basis and reconciles with START and the rows', () => {
  it('N to execute is the plan (the START list, in order) and M to decide is the intelligence shown, counted apart; item 1 is named beside START', () => {
    const intel = intelOf([intelItem({ kind: 'signal', id: 's1', title: 'Kenco opens new innovation lab', accountName: 'Kenco' })], [intelItem({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling at Kenco', accountName: 'Kenco' })], { signals: 14, triggers: 3, people: 9 });
    const out = renderBriefing({ plan: plan(THREE), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, MORNING);
    expect(out.subject).toBe('GAP today, Thu Oct 8: 3 to execute, 2 to decide [GAP#tok]');
    // GUI-11 (2026-10-10): the basis says its units (plan items; intelligence items split into records and people; the retained records placed).
    expect(out.text).toContain('3 plan items to execute, in this order (the list START, NEXT and ITEM walk); 2 intelligence items to decide, 1 of them record and 1 person; 16 more retained records are on the Intelligence page, not in this email; 8 more people who wrote in are on Work.');
    // The walk fix (2026-10-10): START walks the replies to answer first, so the pointer names the reply with its number.
    expect(out.text).toContain('Begin with item 2, Boston Beer: Someone replied. https://x/start');
    // The numbering is the plan's own: row 1 is still Kenco; the row the pointer names is Boston Beer.
    const first = /^1\. (\w+):/m.exec(out.text);
    expect(first?.[1]).toBe('Kenco');
    expect(/^2\. ([\w ]+):/m.exec(out.text)?.[1]).toBe('Boston Beer');
    // Intelligence stays first but is never in the execution count.
    expect(out.text.indexOf('Intelligence worth a look (1 of 17)')).toBeLessThan(out.text.indexOf('Begin with item 2'));
    expect(out.text).not.toMatch(/5 to execute/);
  });

  it('zero and mixed states: nothing to execute with intelligence; items with none; nothing at all', () => {
    const intel = intelOf([intelItem({ kind: 'signal', id: 's1', title: 'Kenco opens new innovation lab', accountName: 'Kenco' })]);
    const onlyIntel = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel }, MORNING);
    expect(onlyIntel.subject).toBe('GAP today, Thu Oct 8: nothing to execute, 1 to decide [GAP#tok]');
    expect(onlyIntel.text).toContain('Nothing to execute on the plan; 1 intelligence item to decide, 1 of them record and 0 people.');
    expect(onlyIntel.text).not.toContain('Begin with item');
    const onlyItems = renderBriefing({ plan: plan(THREE), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([]) }, MORNING);
    expect(onlyItems.subject).toBe('GAP today, Thu Oct 8: 3 to execute [GAP#tok]');
    expect(onlyItems.text).toContain('No intelligence is waiting for a decision today.');
    const nothing = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([]) }, MORNING);
    expect(nothing.subject).toBe('GAP today, Thu Oct 8: nothing needs you [GAP#tok]');
    const one = renderBriefing({ plan: plan([THREE[2]]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, MORNING);
    expect(one.subject).toBe('GAP today, Thu Oct 8: 1 to execute [GAP#tok]');
  });
});

describe('C32: each card carries its context and its own deep link', () => {
  it('an item renders identity, relationship, why surfaced, the last exchange, the next action, source and date under its own link', () => {
    const out = renderBriefing({ plan: plan(THREE), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, MORNING);
    const t = out.text;
    expect(t).toContain('1. Kenco: Send Diego the dock schedule template. Diego Fonseca. Due today.');
    expect(t).toContain('   Deal: YardFlow - Kenco.');
    expect(t).toContain('   Last: Diego: can you send me the dock schedule template by Friday?');
    expect(t).toContain('   Next: Send it from the deal brief.');
    expect(t).toContain('   Source: the recorded buyer words, Oct 8.');
    expect(t).toContain('   https://x/item/bbbb');
    expect(itemCardLines(THREE[1])).toEqual([]);
    for (const line of t.split('\n')) expect(line).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/);
  });

  it('Kenco with an open deal links to the deal brief, never generic Work, and the whole next step is said', () => {
    const dave = intelItem({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling, VP Operations at Kenco', accountName: 'Kenco', line: 'Wrote to us Sep 16, 2026 (2 messages).', opportunity: 'open', person: { email: 'dave@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', lastWroteAt: '2026-09-16T00:00:00.000Z', messages: 2, deals: [{ id: '1001', name: 'YardFlow - Kenco', stage: 'Qualified to buy', nextStep: 'Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted. Confirm the Jan start.' }] } });
    const out = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([], [dave]) }, MORNING);
    expect(out.text).toContain('   In a deal at Kenco: YardFlow - Kenco (Qualified to buy). Next step: Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted. Confirm the Jan start. Work it from the deal: https://x/accounts/kenco/?view=brief');
    expect(out.text).not.toContain('Decide it on Work');
    expect(out.text).not.toContain('Work it from the deal: https://x/work');
    expect(out.html).toContain('<a href="https://x/accounts/kenco/?view=brief">Work it from the deal</a>');
    // No deal link signer: the account page, still never generic Work; no open deal: no deal line at all.
    const noDeal = renderBriefing({ plan: plan([]), dayToken: 'tok', links: { ...links, deal: undefined }, commandsEnabled: false, legacyDigest: false, intel: intelOf([], [dave]) }, MORNING);
    expect(noDeal.text).toContain('Work it from the deal: https://x/accounts/kenco/');
    const none = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([], [{ ...dave, opportunity: 'none' }]) }, MORNING);
    expect(none.text).not.toContain('In a deal at Kenco');
  });

  it('a long deal next step is cut at a sentence end or kept whole, never mid-sentence, on the Work card, the plan item and the one-line deals', () => {
    const step = 'Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted. Confirm the January start date with procurement and get the MSA redlines back from legal before the walk.';
    expect(clipAtSentence(step, 160)).toBe('Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted.');
    expect(clipAtSentence('Short step', 160)).toBe('Short step');
    const noEnd = 'a'.repeat(50) + ' ' + 'b'.repeat(50) + ' ' + 'c'.repeat(80);
    expect(clipAtSentence(noEnd, 100)).toBe(noEnd);
    const base: Omit<WorkInput, 'replies'> = { now: MORNING, candidates: [], motions: [], held: new Map(), inDeals: { status: 'complete', accounts: [{ accountName: 'Kenco', deals: [{ id: '1001', name: 'YardFlow - Kenco', stage: 'Qualified to buy', lastActivityAt: '2026-10-07T00:00:00Z', closeDate: '2026-12-30', nextStep: step }] }] }, dbState: new Map(), inMotion: new Map(), mailbox: null, opportunityHolds: new Map(), conversations: new Map() };
    const day = workDay({ ...base, replies: [] });
    const card = day.cards.find((c) => c.accountName === 'Kenco')!;
    expect(card.move).toBe('Next step on the deal: Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted.');
    expect(card.move).not.toMatch(/…/);
    const items = itemsForDay(day, '2026-10-08');
    const deal = items.find((it) => it.accountName === 'Kenco')!;
    expect(deal.context?.nextAction).toBe(`Next step on the deal: ${step.replace(/\.$/, '')}`);
    const hygiene = item({ key: 'deal:Kenco:2026-10-08', rank: 0, accountName: 'Kenco', kind: 'deal', stateKind: 'in_deal', title: 'In a deal', why: `A stalled deal: ${step}`, href: '/gap/accounts/kenco?view=brief' });
    const out = renderBriefing({ plan: plan([hygiene]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, MORNING);
    expect(out.text).toContain('Deals, in one line (1): Kenco (Send the pilot scope to Dave, then book the site walk with the yard supervisor in Chattanooga once the scope is accepted). The deal workspace holds the detail.');
  });

  it('the plan carries the card context: a reply card says who wrote and when, a deal card its HubSpot next step, an obligation its words and due date', () => {
    const reply: WorkCard = { accountName: 'Boston Beer', href: '/gap/accounts/boston-beer', lane: 'replies', stateKind: 'replied', state: 'Someone replied', why: 'Phil wrote', person: { name: 'Phil Savastano', title: 'VP Operations' }, next: { label: 'Answer it', href: '/gap/accounts/boston-beer#reply' }, blocker: null, index: 0, source: 'pursuit', tier: 'reply', reply: { messageId: 'm-77', from: 'phil@bostonbeer.example.com', fromName: 'Phil Savastano', at: '2026-10-08T13:10:00.000Z', subject: 'Re: yards', snippet: 'Send me the dock comparison and I will take a look.', kind: 'human', human: 'reply', label: 'A real reply', copyFamily: null, answerable: true, noAnswerLine: null, notes: [], threadHref: 'https://mail', record: null, named: null, day: null } };
    expect(cardContext(reply)).toEqual({ motion: 'Someone replied', lastExchange: 'Phil Savastano wrote Oct 8, "Re: yards": Send me the dock comparison and I will take a look.', nextAction: 'Answer it', source: 'their email in the GAP mailbox', date: '2026-10-08T13:10:00.000Z' });
    const deal: WorkCard = { accountName: 'Kenco', href: '/gap/accounts/kenco', lane: 'deals', stateKind: 'in_deal', state: 'In a deal', why: 'w', person: null, next: { label: 'Next step: x', href: '/gap/accounts/kenco?view=brief' }, blocker: null, index: 1, source: 'cockpit', tier: 'deal', dealNextStep: 'Send the pilot scope.' };
    expect(cardContext(deal)).toMatchObject({ motion: 'In a deal; HubSpot next step: Send the pilot scope', nextAction: 'Next step on the deal: Send the pilot scope', source: 'HubSpot deals', date: null });
    expect(obligationContext(deal, { key: 'c-1', commitmentId: 'c-1', kind: 'deliverable', tier: 'commitment', title: 'Send the template', line: 'Due today.', dueAt: '2026-10-08T13:00:00.000Z', dueDay: '2026-10-08', person: { name: 'Diego', email: null }, basis: 'Diego: can you send me the template?', href: '/gap/accounts/kenco', label: 'Send it', canComplete: true, scope: 'Deal: YardFlow - Kenco' })).toEqual({ motion: 'Deal: YardFlow - Kenco', lastExchange: 'Diego: can you send me the template?', nextAction: 'Send it', source: 'the recorded buyer words', date: '2026-10-08T13:00:00.000Z' });
  });
});

describe('C33: the greeting follows the hour of the send; a replay says when its plan was made', () => {
  it('21:47 New York is good evening; 7:05 is good morning; 1 pm is good afternoon; 3 am is a neutral hello', () => {
    expect(greetingFor(NIGHT)).toBe('Good evening.');
    expect(greetingFor(MORNING)).toBe('Good morning.');
    expect(greetingFor(new Date('2026-10-08T17:00:00Z'))).toBe('Good afternoon.');
    expect(greetingFor(new Date('2026-10-08T07:00:00Z'))).toBe('Hello.');
    const out = renderBriefing({ plan: plan(THREE), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NIGHT);
    expect(out.text.split('\n')[0]).toBe('Good evening. Here is Thu Oct 8 from GAP, in order.');
    expect(out.text).not.toMatch(/Good morning/);
    expect(out.text).toContain('Sent by GAP at 9:47 PM New York.');
  });

  it('a replay of a plan made earlier states the snapshot time and that changes since are on Work; a fresh plan says nothing; a resend says so', () => {
    const replay = renderBriefing({ plan: plan(THREE, { fresh: false, plannedAt: '2026-10-08T11:02:00.000Z' }), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NIGHT);
    expect(replay.text.split('\n')[1]).toBe('This replays the plan GAP made at 7:02 AM New York on Thu Oct 8, as it stood then; what changed since is on Work, not here.');
    const fresh = renderBriefing({ plan: plan(THREE, { fresh: true, plannedAt: '2026-10-08T11:02:00.000Z' }), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, MORNING);
    expect(fresh.text).not.toMatch(/replays the plan|resend/);
    const justRead = renderBriefing({ plan: plan(THREE, { fresh: false, plannedAt: '2026-10-08T11:04:00.000Z' }), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, MORNING);
    expect(justRead.text).not.toMatch(/replays the plan/);
    // Seller acceptance follow-up (2026-10-09): a resend REFRESHES the plan, so its line is "Unchanged since" or "Refreshed plan", never the uncompared replay wording.
    const resend = renderBriefing({ plan: plan(THREE, { fresh: false, plannedAt: '2026-10-08T11:02:00.000Z', unchanged: true }), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, resend: true }, NIGHT);
    expect(resend.text.split('\n')[1]).toBe('This is a resend. Unchanged since the 7:02 AM plan.');
    for (const line of resend.text.split('\n')) expect(line).not.toMatch(/^(START|APPROVE|REVISE|SKIP|DEFER|DONE|NEXT|HELP)\b/);
    const refreshed = renderBriefing({ plan: plan(THREE, { fresh: true, plannedAt: '2026-10-08T11:51:00.000Z', revision: 1, changes: { added: ['first_touch:dec-1'], removed: ['review:Dole:2026-10-08'], moved: [{ key: 'reply:msg-77', from: 1, to: 0 }, { key: 'commitment:c-1', from: 0, to: 1 }], labels: { 'first_touch:dec-1': 'PepsiCo: Ready for a first touch', 'review:Dole:2026-10-08': 'Dole: Decide', 'reply:msg-77': 'Boston Beer: Someone replied', 'commitment:c-1': 'Kenco: Send Diego the dock schedule template' } } }), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, resend: true }, NIGHT);
    expect(refreshed.text.split('\n')[1]).toBe('This is a resend. Refreshed plan (revision 1, 7:51 AM New York): added PepsiCo: Ready for a first touch; removed Dole: Decide; moved Boston Beer: Someone replied up, Kenco: Send Diego the dock schedule template down.');
    expect(refreshed.text).not.toMatch(/replays the plan/);
  });
});

describe('C57 pass 2 (C32): a person at an account with more than one open deal is not given one of them', () => {
  const dave = (deals: NonNullable<NonNullable<IntelItem['person']>['deals']>): IntelItem => intelItem({ kind: 'person', id: 'dave@kencogroup.com', title: 'Dave Kiesling, VP Operations at Kenco', accountName: 'Kenco', line: 'Wrote to us Sep 16, 2026 (2 messages).', opportunity: 'open', person: { email: 'dave@kencogroup.com', name: 'Dave Kiesling', title: 'VP Operations', lastWroteAt: '2026-09-16T00:00:00.000Z', messages: 2, deals } });
  const TWO = [
    { id: '1001', name: 'YardFlow - Kenco Chattanooga', stage: 'Qualified to buy', nextStep: 'Send the pilot scope to Dave.' },
    { id: '1002', name: 'YardFlow - Kenco Columbus', stage: 'Appointment scheduled', nextStep: 'Book the site walk with Ben.' },
  ];

  it('two open deals and no settled scope: the card says how many and that the person\'s deal is not settled, names neither, and links the deal brief', () => {
    const out = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([], [dave(TWO)]) }, MORNING);
    expect(out.text).toContain("   2 open deals at Kenco; the person's deal is not settled. Work it from the deal brief: https://x/accounts/kenco/?view=brief");
    for (const word of ['Chattanooga', 'Columbus', 'Qualified to buy', 'Appointment scheduled', 'Send the pilot scope', 'Book the site walk']) expect(out.text).not.toContain(word);
    expect(out.html).toContain('<a href="https://x/accounts/kenco/?view=brief">Work it from the deal</a>');
    expect(out.html).not.toContain('Chattanooga');
  });

  it('one open deal: the deal line is unchanged (name, stage, whole next step, deal brief link)', () => {
    const out = renderBriefing({ plan: plan([]), dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false, intel: intelOf([], [dave([TWO[0]])]) }, MORNING);
    expect(out.text).toContain('   In a deal at Kenco: YardFlow - Kenco Chattanooga (Qualified to buy). Next step: Send the pilot scope to Dave. Work it from the deal: https://x/accounts/kenco/?view=brief');
    expect(out.text).not.toContain('not settled');
  });
});
