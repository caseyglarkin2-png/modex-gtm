/**
 * X04 (GAP OS sales execution engine, 2026-10-08): the day snapshot. One `work.day_planned` ledger row per New York
 * day holds the ordered items the briefing mails and the assignments work from, each with a stable key and an
 * unguessable token. Pinned: a key is bound to its object where one exists (a reply's message id, a commitment id, a
 * first touch's decision id, a meeting) and carries the DAY otherwise (research, review, deal work, a follow-up), so
 * yesterday's record never hides today's new work on the same account (the review's episode finding); every
 * obligation due today is its own item (two due commitments at one account stay two: R41); parked cards (research,
 * holds, set-asides) are never items, only counted; the first claim of a day wins and a second plan the same day
 * writes nothing (idempotent, so the Work load and the cron agree); a token finds its item within the lookback and a
 * forged or expired one finds nothing.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { DAY_PLANNED, decisionIdsFromCandidates, findPlanItemByToken, itemsForDay, loadDayPlan, planDay, type DayPlan } from '@/lib/gap/work/plan';
import type { WorkCard, WorkDay } from '@/lib/gap/work/list';

const card = (over: Partial<WorkCard> & { accountName: string; stateKind: WorkCard['stateKind']; tier: NonNullable<WorkCard['tier']> }): WorkCard => ({
  href: `/gap/accounts/${over.accountName.toLowerCase()}?from=work&i=0`,
  lane: 'ready',
  state: 'state',
  why: `why ${over.accountName}`,
  person: null,
  next: null,
  blocker: null,
  index: 0,
  source: 'pursuit',
  ...over,
});

const day = (cards: WorkCard[], over: Partial<WorkDay> = {}): WorkDay => ({
  cards,
  waiting: [{ key: 'w1', accountName: 'Kenco', kind: 'follow_up', title: 'Follow up', line: 'Due Oct 12', dueDay: '2026-10-12', commitmentId: 'c-w1' }],
  snoozed: [],
  counts: { needsYou: cards.filter((c) => !['research', 'later', 'held'].includes(c.tier ?? '')).length, parked: cards.filter((c) => ['research', 'later', 'held'].includes(c.tier ?? '')).length, obligationsDue: 1, waiting: 1, snoozed: 0 },
  ...over,
});

const CARDS: WorkCard[] = [
  card({ accountName: 'Boston Beer', stateKind: 'replied', tier: 'reply', state: 'Someone replied', person: { name: 'Phil Savastano', title: 'VP Ops' }, next: { label: 'Prepare the answer', href: '/gap/accounts/boston-beer#record-reply' }, reply: { messageId: 'msg-77', from: 'phil@bostonbeer.com', fromName: 'Phil', at: '2026-10-08T11:00:00Z', subject: 'Re: yards', snippet: 'Send me info', kind: 'human', human: 'reply', label: 'A reply', copyFamily: null, answerable: true, noAnswerLine: null, notes: [] } as unknown as WorkCard['reply'] }),
  card({
    accountName: 'Kroger',
    stateKind: 'in_deal',
    tier: 'commitment',
    state: 'In a deal',
    obligations: [
      { key: 'c-1', commitmentId: 'c-1', kind: 'deliverable', tier: 'commitment', title: 'Send the dock comparison', line: 'Due today', dueAt: null, dueDay: '2026-10-08', person: { name: 'Joey', email: 'joey@kroger.com' }, basis: null, href: null, label: null, canComplete: true, scope: 'Deal: Kroger pilot' },
      { key: 'c-2', commitmentId: 'c-2', kind: 'deal_step', tier: 'deal', title: 'Confirm the pilot site', line: 'Due today', dueAt: null, dueDay: '2026-10-08', person: null, basis: null, href: null, label: null, canComplete: true },
    ],
  }),
  card({ accountName: 'PepsiCo', stateKind: 'ready', tier: 'ready', state: 'Ready for a first touch', person: { name: 'Karen', title: 'Director' }, next: { label: 'Send email', href: '/gap/pack/dec-42' } }),
  card({ accountName: 'Tyson', stateKind: 'meeting', tier: 'meeting', state: 'Meeting today', obligations: [{ key: 'meeting:Tyson:2026-10-08T15:00:00Z', commitmentId: null, kind: 'meeting', tier: 'meeting', title: 'Discovery with Ann', line: 'Meeting today 11:00', dueAt: '2026-10-08T15:00:00Z', dueDay: '2026-10-08', person: null, basis: null, href: null, label: null, canComplete: false }] }),
  card({ accountName: 'Gusto', stateKind: 'research', tier: 'research', state: 'Research' }),
  card({ accountName: 'Mondelez', stateKind: 'in_deal', tier: 'held', state: 'In a deal' }),
];

describe('X04: itemsForDay (pure)', () => {
  const items = itemsForDay(day(CARDS), '2026-10-08');

  it('keys are bound to their object, or carry the day; every obligation due today is its own item; parked cards are not items', () => {
    expect(items.map((i) => i.key)).toEqual([
      'reply:msg-77',
      'commitment:c-1',
      'commitment:c-2',
      'first_touch:dec-42',
      'meeting:Tyson:2026-10-08T15:00:00Z',
    ]);
    expect(items.map((i) => i.rank)).toEqual([0, 1, 2, 3, 4]);
    expect(items.find((i) => i.key === 'first_touch:dec-42')?.refs).toEqual({ decisionId: 'dec-42' });
    expect(items.find((i) => i.key === 'reply:msg-77')?.refs).toEqual({ replyMessageId: 'msg-77' });
    expect(items.find((i) => i.key === 'commitment:c-1')).toMatchObject({ accountName: 'Kroger', kind: 'commitment', title: 'Send the dock comparison', why: 'Due today', refs: { commitmentId: 'c-1' }, person: { name: 'Joey' } });
    expect(items.every((i) => i.accountName !== 'Gusto' && i.accountName !== 'Mondelez')).toBe(true);
  });

  it('a card with no object of its own carries the day in its key, so tomorrow is a new episode', () => {
    const follow = itemsForDay(day([card({ accountName: 'Kenco', stateKind: 'follow_up', tier: 'follow_up', state: 'Follow up due' }), card({ accountName: 'GXO', stateKind: 'in_deal', tier: 'deal', state: 'In a deal', stalled: ['No activity since Sep 8'] }), card({ accountName: 'Dole', stateKind: 'decide', tier: 'review', state: 'Decide' })]), '2026-10-08');
    expect(follow.map((i) => i.key)).toEqual(['follow_up:Kenco:2026-10-08', 'deal:GXO:2026-10-08', 'review:Dole:2026-10-08']);
    expect(itemsForDay(day([card({ accountName: 'Kenco', stateKind: 'follow_up', tier: 'follow_up', state: 'Follow up due' })]), '2026-10-09')[0].key).toBe('follow_up:Kenco:2026-10-09');
  });

  it('X12 finding: a pursuit-sourced ready card whose action is the account page takes its decision from the NEXT UP candidates, so the key and the refs still name the card', () => {
    const candidates = [
      { accountName: 'Fedex', lane: 'ready', href: '/gap/pack/dec-fx?from=work&i=0' },
      { accountName: 'Fedex', lane: 'ready', href: '/gap/pack/dec-fx-second' },
      { accountName: 'Kroger', lane: 'deals', href: '/gap/accounts/kroger' },
      { accountName: null, lane: 'ready', href: '/gap/pack/dec-none' },
    ];
    const ids = decisionIdsFromCandidates(candidates);
    expect([...ids]).toEqual([['Fedex', 'dec-fx']]);
    const ready = card({ accountName: 'Fedex', stateKind: 'ready', tier: 'ready', state: 'Ready for a first touch: Glen', next: { label: 'Prepare the first touch', href: '/gap/accounts/fedex' } });
    expect(itemsForDay(day([ready]), '2026-10-08', { decisionIds: ids })[0]).toMatchObject({ key: 'first_touch:dec-fx', refs: { decisionId: 'dec-fx' }, href: '/gap/accounts/fedex' });
    expect(itemsForDay(day([ready]), '2026-10-08')[0].key).toBe('first_touch:Fedex:2026-10-08');
  });

  it('every item carries an unguessable token, distinct, and the card words the seller sees', () => {
    const tokens = new Set(items.map((i) => i.token));
    expect(tokens.size).toBe(items.length);
    for (const t of tokens) expect(t).toMatch(/^[a-f0-9]{32}$/);
    expect(items[0]).toMatchObject({ accountName: 'Boston Beer', kind: 'reply', title: 'Someone replied', why: 'why Boston Beer', href: '/gap/accounts/boston-beer#record-reply', person: { name: 'Phil Savastano' } });
    expect(items[3].href).toBe('/gap/pack/dec-42');
  });
});

describe('X04: planDay, loadDayPlan, findPlanItemByToken', () => {
  let db: ReturnType<typeof ledgerDb>;
  const NOW = new Date('2026-10-08T14:00:00Z');
  beforeEach(() => {
    db = ledgerDb({}, NOW);
  });

  it('the first claim of a day writes ONE row with the items and the counts; a second plan the same day writes nothing and returns the same plan', async () => {
    const first = await planDay(db.client(), { now: NOW, load: async () => day(CARDS) }, 'test');
    expect(first.day).toBe('2026-10-08');
    expect(first.items).toHaveLength(5);
    expect(first.counts).toMatchObject({ needsYou: 4, parked: 2, waiting: 1 });
    expect(first.fresh).toBe(true);
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED);
    expect(rows).toHaveLength(1);
    expect(rows[0].subject_type).toBe('work_day');
    expect(rows[0].subject_id).toBe('2026-10-08');

    let loads = 0;
    const second = await planDay(db.client(), { now: new Date('2026-10-08T20:00:00Z'), load: async () => { loads += 1; return day([]); } }, 'test');
    expect(loads).toBe(0);
    expect(second.fresh).toBe(false);
    expect(second.items.map((i) => i.key)).toEqual(first.items.map((i) => i.key));
    expect(second.items[0].token).toBe(first.items[0].token);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED)).toHaveLength(1);

    const loaded = (await loadDayPlan(db.client(), '2026-10-08')) as DayPlan;
    expect(loaded.items).toHaveLength(5);
    expect(await loadDayPlan(db.client(), '2026-10-09')).toBeNull();
  });

  it('a new New York day is a new plan', async () => {
    await planDay(db.client(), { now: NOW, load: async () => day(CARDS) }, 'test');
    const next = await planDay(db.client(), { now: new Date('2026-10-09T13:00:00Z'), load: async () => day([CARDS[2]]) }, 'test');
    expect(next.day).toBe('2026-10-09');
    expect(next.items).toHaveLength(1);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED)).toHaveLength(2);
  });

  it('a token finds its item and its day within the lookback; a forged or an old token finds nothing', async () => {
    const plan = await planDay(db.client(), { now: NOW, load: async () => day(CARDS) }, 'test');
    const token = plan.items[3].token;
    const found = await findPlanItemByToken(db.client(), token, { now: new Date('2026-10-10T12:00:00Z') });
    expect(found?.day).toBe('2026-10-08');
    expect(found?.item.key).toBe('first_touch:dec-42');
    expect(await findPlanItemByToken(db.client(), 'f'.repeat(32), { now: NOW })).toBeNull();
    expect(await findPlanItemByToken(db.client(), token, { now: new Date('2026-10-20T12:00:00Z') })).toBeNull();
  });
});

describe('X17: a deal with a next step is a plan item titled with the step', () => {
  it('the item carries the day, the step as its title, the brief as its link; a held deal card is no item', () => {
    const items = itemsForDay(day([
      card({ accountName: 'Kroger', stateKind: 'in_deal', tier: 'deal', state: 'In a deal', move: 'Next step on the deal: Send the pilot scope to Ann by Friday', dealNextStep: 'Send the pilot scope to Ann by Friday', rankWhy: "The deal's next step: Send the pilot scope to Ann by Friday", next: { label: 'Next step: Send the pilot scope to Ann by Friday', href: '/gap/accounts/kroger?view=brief' } }),
      card({ accountName: 'GXO', stateKind: 'in_deal', tier: 'held', state: 'In a deal' }),
    ]), '2026-10-08');
    expect(items.map((i) => i.key)).toEqual(['deal:Kroger:2026-10-08']);
    expect(items[0]).toMatchObject({ kind: 'deal', title: 'Next step on the deal: Send the pilot scope to Ann by Friday', why: "The deal's next step: Send the pilot scope to Ann by Friday", href: '/gap/accounts/kroger?view=brief' });
  });
});
