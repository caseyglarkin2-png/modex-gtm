// @vitest-environment node
/**
 * X06 (GAP OS sales execution engine, 2026-10-08): START and the assignment. START records `work.day_started` once;
 * an assignment is one email per plan item, built from the account's Ask context (the one composition Work, Ask and
 * the page share) and, for a first touch, the action pack's rendered copy with its sources; it is recorded as
 * `work.assignment_sent` with the Gmail thread id, the RFC message id, the item key, the revision and the content
 * hash (what a reply's APPROVE will be bound to, X07/X11). Pinned: the subject carries the item token and the
 * revision in brackets; the prepared email is quoted line by line and no line of the body starts with a command word;
 * the content hash is the pack's for a first touch; an assignment is sent once per (item, revision) and a resend is
 * explicit; the next unassigned item is the first in the plan with no assignment; the mail is an internal message from
 * the GAP identity with Reply-To the GAP mailbox.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { ASSIGNMENT_SENT, DAY_STARTED, ITEM_HELD_FOR_RESEARCH, assignable, buildAssignment, nextAssignableItem, nextUnassignedItem, sendAssignment, startDay } from '@/lib/gap/work/assignment';
import { COMMAND_WORDS } from '@/lib/gap/work/briefing';
import type { DayPlan, PlanItem } from '@/lib/gap/work/plan';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';
import type { AskContext } from '@/lib/gap/ask/grounding';

const NOW = new Date('2026-10-08T13:00:00Z');
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };

const item = (over: Partial<PlanItem> & { key: string; rank: number; accountName: string; token: string }): PlanItem => ({
  kind: 'ready',
  stateKind: 'ready',
  title: 'Ready for a first touch',
  why: 'A prepared first touch',
  href: '/gap/pack/dec-1',
  person: null,
  refs: {},
  ...over,
});

const ITEMS: PlanItem[] = [
  item({ key: 'first_touch:dec-1', rank: 0, accountName: 'PepsiCo', token: 'a'.repeat(32), person: { name: 'Karen Ortiz', title: 'Director, Transportation' }, refs: { decisionId: 'dec-1' } }),
  item({ key: 'commitment:c-1', rank: 1, accountName: 'Kroger', token: 'b'.repeat(32), kind: 'commitment', stateKind: 'in_deal', title: 'Send the dock comparison', why: 'Due today', href: '/gap/accounts/kroger', person: { name: 'Joey Maggard', title: null }, refs: { commitmentId: 'c-1' } }),
];
const PLAN: DayPlan = { day: '2026-10-08', plannedAt: NOW.toISOString(), fresh: true, items: ITEMS, counts: { needsYou: 2, parked: 0, obligationsDue: 1, waiting: 0, snoozed: 0 } };

const ASK: AskContext = {
  accountName: 'PepsiCo',
  state: { state: 'ready', stateLine: 'Ready for a first touch: Karen Ortiz, from the Tulsa expansion.', blocker: null, next: 'Send the first touch to Karen Ortiz.', coldTouchAllowed: true },
  people: [],
  setAside: null,
  story: [{ label: 'What we know', tag: 'verified', lines: [{ text: 'PepsiCo is expanding its Tulsa distribution center by 180,000 square feet (announced Jul 23).', tag: 'fact', basis: 'Tulsa World, Jul 23' }] }],
  opening: { fact: 'The Tulsa expansion adds dock doors and trailer parking', basis: 'Tulsa World, Jul 23', whyTheyCare: 'More doors with the same gate team means longer waits at the gate.', supporting: null, proof: 'Verified at the source' },
  otherStories: [],
  buyerSaid: [{ text: 'We lose trailers on the lot every week.', who: 'Karen Ortiz', at: '2026-09-30' }],
};

const PACK = {
  rendered: { queued: { subject: 'Tulsa: the new doors', body: 'Approve me if you like.\nKaren, the Tulsa expansion adds dock doors.\n\nIs the gate the bottleneck?' }, marked: { subject: 's', body: 'b' }, unrendered: null },
  contentHash: 'hash-pack-1',
  emailReady: true,
  hypothesis: { signals: [{ signal: { title: 'PepsiCo expands Tulsa DC', evidence_url: 'https://tulsaworld.com/pepsico', observed_at: new Date('2026-07-23T10:17:19Z') } }] },
  persona: { email: 'karen@pepsico.com' },
};

function harness() {
  const db = ledgerDb({}, NOW);
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async () => ({ provider: 'gmail', id: 'gm-9', threadId: 'th-9' }));
  const deps = { askContext: vi.fn(async () => ASK), pack: vi.fn(async () => PACK), send };
  return { db, deps };
}

describe('X06: buildAssignment', () => {
  it('a first touch: the subject carries the item token and revision; the body says why now, what we know, the move, the quoted email, its sources and the links; the hash is the pack\'s', async () => {
    const { db, deps } = harness();
    const a = await buildAssignment(db.client(), { plan: PLAN, item: ITEMS[0], revision: 0, baseUrl: 'https://app.example', actionSecret: 'secret', commandsEnabled: true, now: NOW }, deps);
    expect(a.subject).toBe(`GAP 1 of 2, PepsiCo: Ready for a first touch [GAP#${'a'.repeat(32)}.0]`);
    expect(a.contentHash).toBe('hash-pack-1');
    expect(a.prepared).toEqual({ kind: 'email', to: 'karen@pepsico.com', subject: 'Tulsa: the new doors', body: PACK.rendered.queued.body });
    const t = a.text;
    expect(t).toContain('PepsiCo: Karen Ortiz (Director, Transportation).');
    expect(t).toContain('Why now: A prepared first touch. Ready for a first touch: Karen Ortiz, from the Tulsa expansion.');
    expect(t).toContain('What we know:');
    expect(t).toContain('- PepsiCo is expanding its Tulsa distribution center by 180,000 square feet (announced Jul 23). (Tulsa World, Jul 23)');
    expect(t).toContain('Why they care: More doors with the same gate team means longer waits at the gate.');
    expect(t).toContain('They said: "We lose trailers on the lot every week." (Karen Ortiz, 2026-09-30)');
    expect(t).toContain('The move: Send the first touch to Karen Ortiz.');
    expect(t).toContain('The email, to karen@pepsico.com, subject "Tulsa: the new doors":');
    expect(t).toContain('> Approve me if you like.');
    expect(t).toContain('> Karen, the Tulsa expansion adds dock doors.');
    expect(t).toContain('Sources: PepsiCo expands Tulsa DC (Jul 23, 2026) https://tulsaworld.com/pepsico');
    expect(t).toMatch(/Open it in GAP: https:\/\/app\.example\/gap\/item\?t=/);
    expect(t).toContain('To act from here, put one of these on the first line of your reply: APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT, HELP.');
    const words = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
    for (const line of t.split('\n')) expect(line).not.toMatch(words);
    expect(a.html).toContain('Tulsa: the new doors');
    expect(deps.pack).toHaveBeenCalledWith(expect.anything(), { decisionId: 'dec-1' });
  });

  it('an obligation with no pack: the body carries the obligation, the account context and the link; the hash is of the body; no email section', async () => {
    const { db, deps } = harness();
    deps.askContext.mockResolvedValue({ ...ASK, accountName: 'Kroger', state: { ...ASK.state, state: 'in_deal', stateLine: 'In a deal: work it from the deal.', next: 'Send Joey the dock comparison.' }, story: [], opening: null, buyerSaid: [] });
    const a = await buildAssignment(db.client(), { plan: PLAN, item: ITEMS[1], revision: 2, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, deps);
    expect(a.subject).toBe(`GAP 2 of 2, Kroger: Send the dock comparison [GAP#${'b'.repeat(32)}.2]`);
    expect(a.prepared).toEqual({ kind: 'none' });
    expect(a.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(a.text).toContain('Kroger: Joey Maggard.');
    expect(a.text).toContain('Why now: Due today. In a deal: work it from the deal.');
    expect(a.text).not.toContain('The email,');
    expect(a.text).toContain('Open it in GAP: https://app.example/gap/accounts/kroger');
    expect(a.text).not.toMatch(/first line of your reply/);
    expect(deps.pack).not.toHaveBeenCalled();
  });

  it('B7 (C4): the sources the Ask context did not read are named after what we know and before the move; nothing is printed when everything was read', async () => {
    const { db, deps } = harness();
    deps.askContext.mockResolvedValue({ ...ASK, coverageLine: 'Gmail Sent (no GAP sender configured), the vault (not configured)' });
    const a = await buildAssignment(db.client(), { plan: PLAN, item: ITEMS[0], revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, deps);
    const t = a.text.split('\n');
    const at = t.indexOf('Not read this time: Gmail Sent (no GAP sender configured), the vault (not configured)');
    expect(at, 'the coverage line is printed').toBeGreaterThan(0);
    expect(at, 'after what we know').toBeGreaterThan(t.indexOf('What we know:'));
    expect(at, 'before the move').toBeLessThan(t.indexOf('The move: Send the first touch to Karen Ortiz.'));
    deps.askContext.mockResolvedValue({ ...ASK, coverageLine: null });
    const b = await buildAssignment(db.client(), { plan: PLAN, item: ITEMS[0], revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, deps);
    expect(b.text).not.toContain('Not read this time');
  });

  it('addendum: a deal item at an account where a develop_angle task succeeded for a person placed there carries the angle (prepared angle, the block above the move) and is assignable; a first touch with a pack never reads it', async () => {
    const { db, deps } = harness();
    const kenco = item({ key: 'deal:Kenco:2026-10-08', rank: 1, accountName: 'Kenco', token: 'c'.repeat(32), kind: 'deal', stateKind: 'in_deal', title: 'Next step on the deal: Send the pilot scope', why: 'The deal\'s next step', href: '/gap/accounts/kenco?view=brief', person: null });
    const pursued = vi.fn(async () => [{ key: 'person:dave.kiesling@kencogroup.com', taskId: 't-1', writer: { email: 'dave.kiesling@kencogroup.com', name: 'Dave Kiesling' }, kind: 'person' as const, title: 'Dave Kiesling at Kenco', accountName: 'Kenco', accountHint: null, url: null, decision: 'pursue', decidedAt: '2026-10-08T12:00:00.000Z', status: 'ready' as const, error: null, angle: { whyItMatters: 'Kenco runs 40 yards with paper gate logs; the Chattanooga pilot is where the scope lands.', starters: ['Dave, is Chattanooga still the yard you would pilot first?'], roles: ['VP Operations'], accounts: ['Kenco'], peopleNamed: [{ personaId: 7, name: 'Dave Kiesling', title: 'VP Operations' }], proposedAction: 'email', caveat: null, sourceLine: 'his reply, Sep 16' } }]);
    deps.askContext.mockResolvedValue({ ...ASK, accountName: 'Kenco', state: { ...ASK.state, state: 'in_deal', stateLine: 'In a deal.', next: 'Send Dave the pilot scope.' }, story: [], opening: null, buyerSaid: [] });
    const a = await buildAssignment(db.client(), { plan: { ...PLAN, items: [ITEMS[0], kenco] }, item: kenco, revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, { ...deps, pursued });
    expect(a.prepared).toEqual({ kind: 'angle', who: 'Dave Kiesling', whyItMatters: 'Kenco runs 40 yards with paper gate logs; the Chattanooga pilot is where the scope lands.', opener: 'Dave, is Chattanooga still the yard you would pilot first?' });
    const t = a.text.split('\n');
    const angleAt = t.findIndex((l) => l === 'GAP has prepared an angle for Dave Kiesling: Kenco runs 40 yards with paper gate logs; the Chattanooga pilot is where the scope lands.');
    expect(angleAt, 'the angle block is printed').toBeGreaterThan(0);
    expect(t[angleAt + 1]).toBe('Opener: Dave, is Chattanooga still the yard you would pilot first?');
    expect(t.indexOf('The move: Send Dave the pilot scope.'), 'above the move').toBeGreaterThan(angleAt);
    expect(deps.pack).not.toHaveBeenCalled();
    const ok = await assignable(db.client(), { ...PLAN, items: [kenco] }, kenco, { baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, { ...deps, pursued });
    expect(ok.ok, 'an item with a prepared angle is assignable').toBe(true);
    // A first touch with a pack: the pursued read is not made and the email stays the prepared thing.
    const ft = await buildAssignment(db.client(), { plan: PLAN, item: ITEMS[0], revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, { ...deps, pursued });
    expect(ft.prepared.kind).toBe('email');
    expect(pursued).toHaveBeenCalledTimes(2);
    // No ready angle at the account (another account, or in progress): nothing prepared, no block.
    pursued.mockResolvedValue([]);
    const none = await buildAssignment(db.client(), { plan: { ...PLAN, items: [kenco] }, item: kenco, revision: 0, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW }, { ...deps, pursued });
    expect(none.prepared).toEqual({ kind: 'none' });
    expect(none.text).not.toContain('prepared an angle');
  });
});

describe('X06: startDay, sendAssignment, nextUnassignedItem', () => {
  let db: ReturnType<typeof ledgerDb>;
  let deps: ReturnType<typeof harness>['deps'];
  beforeEach(() => {
    const h = harness();
    db = h.db;
    deps = h.deps;
  });

  it('START is recorded once per day', async () => {
    const a = await startDay(db.client(), { day: '2026-10-08', now: NOW, actor: 'casey@freightroll.com', via: 'link' });
    expect(a.started).toBe(true);
    const b = await startDay(db.client(), { day: '2026-10-08', now: new Date('2026-10-08T14:00:00Z'), actor: 'casey@freightroll.com', via: 'email' });
    expect(b.started).toBe(false);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_STARTED)).toHaveLength(1);
  });

  it('an assignment is sent once per (item, revision), from the GAP identity as an internal message, and recorded with its thread, hash and revision; a resend is explicit', async () => {
    const input = { plan: PLAN, item: ITEMS[0], revision: 0, to: 'casey@freightroll.com', sender: SENDER, baseUrl: 'https://app.example', actionSecret: 'secret', commandsEnabled: true, now: NOW, actor: 'gap' };
    const first = await sendAssignment(db.client(), input, deps);
    expect(first).toMatchObject({ sent: true, gmailMessageId: 'gm-9', gmailThreadId: 'th-9', contentHash: 'hash-pack-1' });
    const payload = deps.send.mock.calls[0][0];
    expect(payload).toMatchObject({ to: 'casey@freightroll.com', sender: SENDER, purpose: 'OPERATOR_ALERT', replyTo: 'casey@yardflow.ai' });
    expect(payload.headers).toMatchObject({ 'Auto-Submitted': 'auto-generated', 'X-GAP-Item': `${'a'.repeat(32)}.0` });
    const rows = db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT);
    expect(rows).toHaveLength(1);
    expect(rows[0].subject_type).toBe('work_item');
    expect(rows[0].subject_id).toBe('first_touch:dec-1');
    expect(rows[0].payload).toMatchObject({ day: '2026-10-08', itemToken: 'a'.repeat(32), revision: 0, to: 'casey@freightroll.com', senderIdentity: 'casey@yardflow.ai', gmailMessageId: 'gm-9', gmailThreadId: 'th-9', contentHash: 'hash-pack-1', prepared: { kind: 'email', to: 'karen@pepsico.com' } });

    const again = await sendAssignment(db.client(), input, deps);
    expect(again).toMatchObject({ sent: false, reason: 'already_sent' });
    expect(deps.send).toHaveBeenCalledTimes(1);
    const rev1 = await sendAssignment(db.client(), { ...input, revision: 1 }, deps);
    expect(rev1).toMatchObject({ sent: true });
    const forced = await sendAssignment(db.client(), { ...input, resend: true }, deps);
    expect(forced).toMatchObject({ sent: true });
    expect(deps.send).toHaveBeenCalledTimes(3);
  });

  it('the next unassigned item is the first in the plan with no assignment yet; none when every item went out', async () => {
    expect((await nextUnassignedItem(db.client(), PLAN))?.key).toBe('first_touch:dec-1');
    await sendAssignment(db.client(), { plan: PLAN, item: ITEMS[0], revision: 0, to: 'casey@freightroll.com', sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW, actor: 'gap' }, deps);
    expect((await nextUnassignedItem(db.client(), PLAN))?.key).toBe('commitment:c-1');
    await sendAssignment(db.client(), { plan: PLAN, item: ITEMS[1], revision: 0, to: 'casey@freightroll.com', sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: false, now: NOW, actor: 'gap' }, deps);
    expect(await nextUnassignedItem(db.client(), PLAN)).toBeNull();
  });
});

describe('seller acceptance follow-up: START and NEXT hand the seller only an assignable item; research is held for the agent', () => {
  const SGWS = item({ key: "follow_up:Southern Glazer's:2026-10-08", rank: 0, accountName: "Southern Glazer's", token: 'e'.repeat(32), kind: 'follow_up', stateKind: 'follow_up', title: 'Reminder: Follow up with Diego Fonseca when they are back', why: 'Out of office, May 26', href: '/gap/accounts/southern-glazers', person: { name: 'Diego Fonseca', title: null } });
  const KROGER = ITEMS[1];
  const PEPSI = ITEMS[0];
  const SWIRE = item({ key: 'follow_up:Swire:2026-10-08', rank: 3, accountName: 'Swire', token: 'f'.repeat(32), kind: 'follow_up', stateKind: 'follow_up', title: 'Follow up with Ana', why: 'Nothing prepared yet; GAP researches the operator first.', href: '/gap/accounts/swire', person: null });
  const plan: DayPlan = { ...PLAN, items: [SGWS, { ...KROGER, rank: 1 }, { ...PEPSI, rank: 2 }, SWIRE], revision: 1 };
  const ctxFor = (accountName: string): AskContext | null =>
    accountName.startsWith('Southern') ? { ...ASK, accountName, state: { ...ASK.state, state: 'follow_up', stateLine: 'They were out of office in May.', next: "Research the catalysts at Southern Glazer's before reaching Diego." }, story: [], opening: null, buyerSaid: [] }
    : accountName === 'Kroger' ? { ...ASK, accountName, state: { ...ASK.state, state: 'in_deal', stateLine: 'In a deal.', next: 'Send Joey the dock comparison.' }, story: [], opening: null, buyerSaid: [] }
    : accountName === 'Swire' ? { ...ASK, accountName, state: { ...ASK.state, state: 'follow_up', stateLine: 'Quiet.', next: 'Send Ana a note.' }, story: [], opening: null, buyerSaid: [] }
    : ASK;
  const input = { baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW };

  it('assignable: nothing prepared and a research-shaped move is held (research_move); a why that says nothing is prepared is held (research_why); a seller move with nothing prepared, or a prepared email, is assignable', async () => {
    const db = ledgerDb({}, NOW);
    const deps = { askContext: vi.fn(async (_p: unknown, name: string) => ctxFor(name)), pack: vi.fn(async (_p: unknown, a: { decisionId: string }) => (a.decisionId === 'dec-1' ? PACK : null)), send: vi.fn(async () => ({ provider: 'gmail' as const, id: 'g', threadId: 't' })) };
    const sgws = await assignable(db.client(), plan, SGWS, input, deps);
    expect(sgws.ok, 'research move held').toBe(false);
    expect(sgws).toMatchObject({ reason: 'research_move', detail: "Research the catalysts at Southern Glazer's before reaching Diego." });
    expect(sgws.built.prepared).toEqual({ kind: 'none' });
    expect(await assignable(db.client(), plan, SWIRE, input, deps)).toMatchObject({ ok: false, reason: 'research_why' });
    expect((await assignable(db.client(), plan, KROGER, input, deps)).ok, 'a seller move with nothing prepared is assignable').toBe(true);
    expect((await assignable(db.client(), plan, PEPSI, input, deps)).ok, 'a prepared email is assignable').toBe(true);
  });

  it('the walk: the held items are recorded once (work.command_applied, effect item_held_for_research, subject the item) and walked past; the first assignable item comes back with its built assignment; a settled item (an applied SKIP) is skipped; a progress note settles nothing', async () => {
    const db = ledgerDb({}, NOW);
    const deps = { askContext: vi.fn(async (_p: unknown, name: string) => ctxFor(name)), pack: vi.fn(async (_p: unknown, a: { decisionId: string }) => (a.decisionId === 'dec-1' ? PACK : null)), send: vi.fn(async () => ({ provider: 'gmail' as const, id: 'g', threadId: 't' })) };
    const first = await nextAssignableItem(db.client(), plan, { assign: { input, deps, actor: 'test' } });
    expect(first.item?.key, 'Kroger is the first assignable').toBe('commitment:c-1');
    expect(first.built?.move).toBe('Send Joey the dock comparison.');
    expect(first.held.map((h) => [h.item.accountName, h.line, h.recorded])).toEqual([["Southern Glazer's", 'nothing supported to send yet', true]]);
    const holds = db.store.gapAuditEvent.filter((e) => e.kind === 'work.command_applied' && e.payload.effect === ITEM_HELD_FOR_RESEARCH);
    expect(holds).toHaveLength(1);
    expect(holds[0]).toMatchObject({ subject_type: 'work_item', subject_id: "follow_up:Southern Glazer's:2026-10-08", payload: { reason: 'research_move', day: '2026-10-08', itemToken: 'e'.repeat(32), revision: 1 } });
    // Kroger assigned; the next walk finds the hold already recorded (no second row) and hands PepsiCo.
    await sendAssignment(db.client(), { plan, item: first.item as PlanItem, revision: 0, to: 'casey@freightroll.com', sender: SENDER, ...input, actor: 'gap', built: first.built }, deps);
    const second = await nextAssignableItem(db.client(), plan, { assign: { input, deps, actor: 'test' } });
    expect(second.item?.key).toBe('first_touch:dec-1');
    expect(second.held.map((h) => [h.item.accountName, h.recorded])).toEqual([["Southern Glazer's", false]]);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === 'work.command_applied' && e.payload.effect === ITEM_HELD_FOR_RESEARCH), 'held once').toHaveLength(1);
    // PepsiCo assigned; Swire is held by its why; nothing is left.
    await sendAssignment(db.client(), { plan, item: second.item as PlanItem, revision: 0, to: 'casey@freightroll.com', sender: SENDER, ...input, actor: 'gap', built: second.built }, deps);
    const third = await nextAssignableItem(db.client(), plan, { assign: { input, deps, actor: 'test' } });
    expect(third.item).toBeNull();
    expect(third.held.map((h) => [h.item.accountName, h.recorded])).toEqual([["Southern Glazer's", false], ['Swire', true]]);
    // A settled item: an applied SKIP on an unassigned item keeps it off the walk; a progress note does not settle.
    const db2 = ledgerDb({}, NOW);
    await db2.client().gapAuditEvent.create({ data: { kind: 'work.command_applied', actor: 'x', subject_type: 'work_item', subject_id: 'commitment:c-1', payload: { command: 'skip', effect: 'commitment_skipped' } } });
    await db2.client().gapAuditEvent.create({ data: { kind: 'work.command_applied', actor: 'x', subject_type: 'work_item', subject_id: 'first_touch:dec-1', payload: { command: 'done', effect: 'progress_noted', note: 'drafting it' } } });
    const skipped = await nextAssignableItem(db2.client(), { ...plan, items: [{ ...KROGER, rank: 0 }, { ...PEPSI, rank: 1 }] });
    expect(skipped.item?.key, 'the skipped Kroger is passed; the progress-noted PepsiCo is still open').toBe('first_touch:dec-1');
    expect(await nextUnassignedItem(db2.client(), { ...plan, items: [{ ...KROGER, rank: 0 }] })).toBeNull();
  });
});
