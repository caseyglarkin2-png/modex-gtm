// @vitest-environment node
/**
 * Seller acceptance follow-up (2026-10-09): the plan can be REFRESHED after material context or ranking changes, the
 * briefing, Work, START and NEXT stay consistent, and nothing the seller did is lost. What production did on
 * October 9: the 7:05 plan put two Southern Glazer's items and two Swire items (each pair the SAME obligation twice,
 * the commitment and the card's own "Reminder: Follow up with Diego Fonseca when they are back") at ranks 0 to 3;
 * the 7:51 explicit resend replayed that plan unchanged because the first claim of a day wins; START assigned a
 * Southern Glazer's item with nothing prepared and a move that amounted to "research it".
 *
 * Pinned here:
 *   B1  planDay({ refresh: true }) builds the day again and writes a NEW revision only when the change is material
 *       (keys added or removed, or the first five reordered): revision n+1, supersedes the previous row, changes
 *       (added, removed, moved with labels); every kept key keeps its TOKEN; an immaterial change writes nothing and
 *       returns the stored plan `unchanged`; loadDayPlan returns the NEWEST revision; findPlanItemByToken finds a
 *       token in any revision and marks it `retired` when its key is off the newest; the scheduled path (no refresh)
 *       still returns the first claim.
 *   B2  a card's own move that is its obligation said again is not pushed (ownMoveIsObligation, or the same tier and
 *       the same person): one Southern Glazer's item, never two; a deal card with a due commitment keeps both (R41).
 */
import { describe, expect, it } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { DAY_PLANNED, findPlanItemByToken, itemsForDay, loadDayPlan, loadDayPlanRevisions, ownMoveIsObligation, planChanges, planDay, samePerson, type PlanItem } from '@/lib/gap/work/plan';
import type { WorkCard, WorkDay, WorkObligation } from '@/lib/gap/work/list';

const T0 = new Date('2026-10-09T11:05:00Z'); // 7:05 am New York
const T1 = new Date('2026-10-09T11:51:00Z'); // 7:51 am New York

const card = (over: Partial<WorkCard> & { accountName: string; stateKind: WorkCard['stateKind']; tier: NonNullable<WorkCard['tier']> }): WorkCard => ({
  href: `/gap/accounts/${over.accountName.toLowerCase().replace(/[^a-z]+/g, '-')}?from=work&i=0`,
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

const obligation = (over: Partial<WorkObligation> & { key: string; title: string; tier: WorkObligation['tier'] }): WorkObligation => ({
  commitmentId: over.key,
  kind: 'follow_up',
  line: 'Due today',
  dueAt: null,
  dueDay: '2026-10-09',
  person: null,
  basis: null,
  href: null,
  label: null,
  canComplete: true,
  ...over,
});

const day = (cards: WorkCard[]): WorkDay => ({
  cards,
  waiting: [],
  snoozed: [],
  counts: { needsYou: cards.length, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
});

/** The October 9 Southern Glazer's card: the commitment from the out-of-office reply AND the card's own reminder, the same person. */
const SGWS = card({
  accountName: "Southern Glazer's Wine & Spirits",
  stateKind: 'follow_up',
  tier: 'follow_up',
  state: 'Reminder: Follow up with Diego Fonseca when they are back',
  person: { name: 'Diego Fonseca', title: null },
  obligations: [obligation({ key: 'reply:ooo:diego.fonseca@sgws.com:2026-05-26', title: 'Follow up with Diego Fonseca when they are back', tier: 'follow_up', person: { name: 'Diego Fonseca', email: 'diego.fonseca@sgws.com' }, basis: 'Out of office, May 26' })],
});
const SWIRE = card({
  accountName: 'Swire Coca-Cola',
  stateKind: 'follow_up',
  tier: 'follow_up',
  state: 'Reminder: Follow up with Ana Ruiz when they are back',
  person: { name: 'Ana Ruiz', title: null },
  obligations: [obligation({ key: 'reply:ooo:ana.ruiz@swirecc.com:2026-06-02', title: 'Follow up with Ana Ruiz when they are back', tier: 'follow_up', person: { name: 'Ana Ruiz', email: 'ana.ruiz@swirecc.com' } })],
});
const KROGER_DEAL = card({
  accountName: 'Kroger',
  stateKind: 'in_deal',
  tier: 'deal',
  state: 'In a deal',
  move: 'Next step on the deal: Send the pilot scope',
  obligations: [obligation({ key: 'c-kroger-1', title: 'Send the dock comparison', tier: 'commitment', kind: 'deliverable', person: { name: 'Joey', email: 'joey@kroger.com' } })],
});
const PEPSI = card({ accountName: 'PepsiCo', stateKind: 'ready', tier: 'ready', state: 'Ready for a first touch', person: { name: 'Karen', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-42' } });
const DOLE = card({ accountName: 'Dole', stateKind: 'decide', tier: 'review', state: 'Decide' });
const KENCO = card({ accountName: 'Kenco', stateKind: 'follow_up', tier: 'follow_up', state: 'Follow up due', person: { name: 'Dave', title: null } });

describe('B2: a card\'s own move that is its obligation said again is one item, never two', () => {
  it('October 9: Southern Glazer\'s and Swire each yield ONE item (the commitment), not the commitment and the reminder', () => {
    const items = itemsForDay(day([SGWS, SWIRE, PEPSI]), '2026-10-09');
    expect(items.map((i) => i.key), 'one key per account').toEqual(['commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26', 'commitment:reply:ooo:ana.ruiz@swirecc.com:2026-06-02', 'first_touch:dec-42']);
    expect(items.filter((i) => i.accountName.startsWith('Southern')), 'one Southern Glazer\'s item').toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'follow_up', title: 'Follow up with Diego Fonseca when they are back', person: { name: 'Diego Fonseca' }, refs: { commitmentId: 'reply:ooo:diego.fonseca@sgws.com:2026-05-26' } });
  });

  it('the card may say so itself (ownMoveIsObligation, set by the Work builder) even when the people differ', () => {
    const said = { ...SGWS, person: { name: 'Someone Else', title: null }, ownMoveIsObligation: true } as WorkCard;
    expect(ownMoveIsObligation(said)).toBe(true);
    expect(itemsForDay(day([said]), '2026-10-09').map((i) => i.key)).toEqual(['commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26']);
    // Without the flag and with another person on the obligation, the card's move is its own work: both stand.
    const other = { ...SGWS, person: { name: 'Someone Else', title: null } } as WorkCard;
    expect(ownMoveIsObligation(other)).toBe(false);
    expect(itemsForDay(day([other]), '2026-10-09').map((i) => i.key)).toEqual(['commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26', "follow_up:Southern Glazer's Wine & Spirits:2026-10-09"]);
  });

  it('samePerson: by email when both carry one, else by name (case and spaces aside); neither naming anyone is the same', () => {
    expect(samePerson({ name: 'Diego Fonseca' }, { name: ' diego fonseca ', email: 'diego.fonseca@sgws.com' })).toBe(true);
    expect(samePerson({ name: 'Diego Fonseca', email: 'a@x.com' }, { name: 'Diego Fonseca', email: 'b@x.com' })).toBe(false);
    expect(samePerson({ name: 'Diego' }, { name: 'Ana' })).toBe(false);
    expect(samePerson(null, { name: 'Ana', email: null })).toBe(false);
    expect(samePerson(null, null)).toBe(true);
  });

  it('R41 unchanged: a deal card with a due commitment yields the deal item AND the commitment item (the tiers differ)', () => {
    const items = itemsForDay(day([KROGER_DEAL]), '2026-10-09');
    expect(items.map((i) => i.key)).toEqual(['deal:Kroger:2026-10-09', 'commitment:c-kroger-1']);
  });
});

describe('B1: planChanges (pure)', () => {
  const pi = (key: string, rank: number, accountName = key): PlanItem => ({ key, rank, accountName, kind: 'follow_up', stateKind: 'follow_up', title: `t ${key}`, why: 'w', href: '/x', person: null, refs: {}, token: rank.toString(16).padStart(32, '0') });
  it('the same keys in the same order over the first five is not material; a swap below rank five is not material either', () => {
    const a = ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7'].map((k, i) => pi(k, i));
    expect(planChanges(a, a)).toBeNull();
    const tail = [...a.slice(0, 5), a[6], a[5]].map((i, rank) => ({ ...i, rank }));
    expect(planChanges(a, tail)).toBeNull();
  });
  it('an added or removed key, or a reorder within the first five, is material: added, removed, moved (kept items whose place among the kept changed) and the labels', () => {
    const a = ['k1', 'k2', 'k3', 'k4'].map((k, i) => pi(k, i));
    const b = [pi('k2', 0), pi('k1', 1), pi('k4', 2), pi('n1', 3, 'New Co')];
    const c = planChanges(a, b);
    expect(c?.added).toEqual(['n1']);
    expect(c?.removed).toEqual(['k3']);
    expect(c?.moved).toEqual([{ key: 'k2', from: 1, to: 0 }, { key: 'k1', from: 0, to: 1 }]);
    expect(c?.labels).toMatchObject({ n1: 'New Co: t n1', k3: 'k3: t k3', k1: 'k1: t k1', k2: 'k2: t k2' });
    // A removal above an item shifts its rank; that is not a move of it.
    const shifted = planChanges(a, [pi('k2', 0), pi('k3', 1), pi('k4', 2)]);
    expect(shifted?.removed).toEqual(['k1']);
    expect(shifted?.moved).toEqual([]);
  });
});

describe('B1: planDay with refresh', () => {
  it('a material refresh writes revision 1 superseding the first row, keeps the tokens of kept keys, mints a token for a new key, records the changes; loadDayPlan returns the newest', async () => {
    const db = ledgerDb({}, T0);
    const first = await planDay(db.client(), { now: T0, load: async () => day([SGWS, PEPSI, DOLE]) }, 'cron');
    expect(first.revision).toBe(0);
    expect(first.changes).toBeNull();
    expect(first.items.map((i) => i.key)).toEqual(['commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26', 'first_touch:dec-42', 'review:Dole:2026-10-09']);
    const sgwsToken = first.items[0].token;
    const pepsiToken = first.items[1].token;

    // The resend: PepsiCo moved to the top, Dole fell off, Kenco appeared.
    db.setClock(T1);
    const second = await planDay(db.client(), { now: T1, load: async () => day([PEPSI, SGWS, KENCO]), refresh: true }, 'cron');
    expect(second.fresh, 'written by this call').toBe(true);
    expect(second.revision).toBe(1);
    expect(second.supersedes, 'supersedes the first row').toBe(first.id);
    expect(second.items.map((i) => i.key)).toEqual(['first_touch:dec-42', 'commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26', 'follow_up:Kenco:2026-10-09']);
    expect(second.items[0].token, 'PepsiCo keeps its token').toBe(pepsiToken);
    expect(second.items[1].token, "Southern Glazer's keeps its token").toBe(sgwsToken);
    expect(second.items[2].token).toMatch(/^[a-f0-9]{32}$/);
    expect(second.items[2].token).not.toBe(first.items[2].token);
    expect(second.changes).toEqual({
      added: ['follow_up:Kenco:2026-10-09'],
      removed: ['review:Dole:2026-10-09'],
      moved: [{ key: 'first_touch:dec-42', from: 1, to: 0 }, { key: 'commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26', from: 0, to: 1 }],
      labels: { 'follow_up:Kenco:2026-10-09': 'Kenco: Follow up due', 'review:Dole:2026-10-09': 'Dole: Decide', 'first_touch:dec-42': 'PepsiCo: Ready for a first touch', 'commitment:reply:ooo:diego.fonseca@sgws.com:2026-05-26': "Southern Glazer's Wine & Spirits: Follow up with Diego Fonseca when they are back" },
    });
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED);
    expect(rows, 'two revisions stored').toHaveLength(2);
    expect(rows[1].payload).toMatchObject({ revision: 1, supersedes: rows[0].id });

    const newest = await loadDayPlan(db.client(), '2026-10-09');
    expect(newest?.revision, 'loadDayPlan is the newest revision').toBe(1);
    expect(newest?.items.map((i) => i.key)).toEqual(second.items.map((i) => i.key));
    const revisions = await loadDayPlanRevisions(db.client(), '2026-10-09');
    expect(revisions.map((r) => r.revision)).toEqual([1, 0]);

    // The scheduled path (no refresh) returns the newest stored plan without building.
    let loads = 0;
    const scheduled = await planDay(db.client(), { now: new Date('2026-10-09T12:05:00Z'), load: async () => { loads += 1; return day([]); } }, 'cron');
    expect(loads).toBe(0);
    expect(scheduled.revision).toBe(1);
    expect(scheduled.fresh).toBe(false);
  });

  it('an immaterial refresh writes nothing and returns the stored plan unchanged (the 7:51 resend of an unchanged day)', async () => {
    const db = ledgerDb({}, T0);
    const first = await planDay(db.client(), { now: T0, load: async () => day([SGWS, PEPSI]) }, 'cron');
    db.setClock(T1);
    const again = await planDay(db.client(), { now: T1, load: async () => day([SGWS, PEPSI]), refresh: true }, 'cron');
    expect(again.unchanged, 'unchanged').toBe(true);
    expect(again.fresh).toBe(false);
    expect(again.revision).toBe(0);
    expect(again.plannedAt).toBe(first.plannedAt);
    expect(again.items.map((i) => i.token)).toEqual(first.items.map((i) => i.token));
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED), 'one row only').toHaveLength(1);
  });

  it('findPlanItemByToken finds a token in any revision and marks it retired when its key is off the newest revision', async () => {
    const db = ledgerDb({}, T0);
    const first = await planDay(db.client(), { now: T0, load: async () => day([SGWS, DOLE]) }, 'cron');
    const doleToken = first.items[1].token;
    const sgwsToken = first.items[0].token;
    db.setClock(T1);
    await planDay(db.client(), { now: T1, load: async () => day([SGWS, KENCO]), refresh: true }, 'cron');
    const dole = await findPlanItemByToken(db.client(), doleToken, { now: T1 });
    expect(dole?.item.key).toBe('review:Dole:2026-10-09');
    expect(dole?.retired, 'Dole is off the newest revision').toBe(true);
    expect(dole?.plan.revision).toBe(0);
    expect(dole?.newest.revision).toBe(1);
    const sgws = await findPlanItemByToken(db.client(), sgwsToken, { now: T1 });
    expect(sgws?.retired, "Southern Glazer's is still on it").toBe(false);
    expect(sgws?.plan.revision, 'found on the newest revision first').toBe(1);
  });

  it('a refresh raced by another instance: the revision written meanwhile wins and the one built here is dropped', async () => {
    const db = ledgerDb({}, T0);
    const base = db.client();
    await planDay(base, { now: T0, load: async () => day([SGWS, DOLE]) }, 'cron');
    db.setClock(T1);
    const racing = { ...base, $executeRaw: async () => 0, $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({ ...base, $executeRaw: async () => 0 }) };
    const r = await planDay(racing, { now: T1, load: async () => { await planDay(base, { now: T1, load: async () => day([KENCO]), refresh: true }, 'other'); return day([PEPSI]); }, refresh: true }, 'cron');
    expect(r.items.map((i) => i.key)).toEqual(['follow_up:Kenco:2026-10-09']);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED)).toHaveLength(2);
  });
});
