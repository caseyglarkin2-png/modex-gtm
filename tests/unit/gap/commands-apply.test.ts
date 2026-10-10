// @vitest-environment node
/**
 * X07b (GAP OS sales execution engine, 2026-10-08): an authenticated email command's EFFECT. Every effect routes to
 * the owner of the state it changes (a commitment through work/commitments.ts, an account outcome through
 * work/outcome.ts, an assignment through work/assignment.ts); the plan records only `work.command_applied` or
 * `work.command_refused`, and GAP answers in the same thread. Pinned: SKIP, DEFER and DONE act on the item once (a
 * second identical command is refused `already_applied`: the review's replay finding); a token for an older revision
 * is refused `stale_revision`; DEFER needs a date GAP understands and DONE needs words (the seller's note is the
 * proof); NEXT sends the next unassigned item and says so when none is left; START on the briefing thread starts the
 * day and sends the first item; HELP answers once per item per hour; APPROVE and REVISE are refused
 * `not_yet_available` until their tickets land (X09, X11) and the seller is told.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { ASSIGNMENT_SENT, DAY_STARTED, sendAssignment } from '@/lib/gap/work/assignment';
import { ensureCommitment, loadCommitment } from '@/lib/gap/work/commitments';
import { BRIEFING_SENT } from '@/lib/gap/work/briefing-send';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { DAY_PLANNED, planDay, type DayPlan } from '@/lib/gap/work/plan';
import { ITEM_HELD_FOR_RESEARCH } from '@/lib/gap/work/assignment';
import type { AskContext } from '@/lib/gap/ask/grounding';
import type { WorkDay } from '@/lib/gap/work/list';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import type { GmailSendPayload } from '@/lib/email/gmail-sender';

const NOW = new Date('2026-10-08T14:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const AUTH_OK = 'mx.google.com; spf=pass smtp.mailfrom=casey@freightroll.com; dmarc=pass (p=NONE) header.from=freightroll.com';

function day(commitmentId: string): WorkDay {
  return {
    cards: [
      { accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen Ortiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 0, source: 'pursuit', tier: 'ready' },
      { accountName: 'Kroger', href: '/gap/accounts/kroger', lane: 'deals', stateKind: 'in_deal', state: 'In a deal', why: 'A buyer commitment is due', person: null, next: null, blocker: null, index: 1, source: 'pursuit', tier: 'commitment', obligations: [{ key: commitmentId, commitmentId, kind: 'deliverable', tier: 'commitment', title: 'Send the dock comparison', line: 'Due today', dueAt: null, dueDay: '2026-10-08', person: { name: 'Joey', email: 'joey@kroger.com' }, basis: null, href: null, label: null, canComplete: true }] },
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 2, parked: 0, obligationsDue: 1, waiting: 0, snoozed: 0 },
  };
}

function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  return {
    id: `cmd-${Math.random().toString(16).slice(2, 8)}`,
    threadId: 'th-item-0',
    rfcMessageId: '<cmd@mail>',
    fromEmail: SELLER,
    fromName: 'Casey',
    subject: 'Re: GAP 1 of 2',
    snippet: '',
    bodyText: 'SKIP',
    rawText: 'SKIP',
    bodyHtml: '',
    deliveryStatus: null,
    labelIds: ['INBOX'],
    receivedAt: NOW,
    headers: { 'Authentication-Results': AUTH_OK },
    ...over,
  };
}

async function world() {
  const db = ledgerDb({ accounts: ['PepsiCo', 'Kroger'] }, NOW);
  const c = db.client();
  const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:1' } }, { actor: SELLER, now: NOW });
  const commitmentId = made.ok ? made.commitment.commitmentId : '';
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day(commitmentId) }, 'test');
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: `gm-${n}`, threadId: p.threadId ?? `th-item-${n - 1}` };
  });
  const deps = { send, askContext: vi.fn(async () => null), pack: vi.fn(async () => null) };
  // Item 0 (PepsiCo) assigned in thread th-item-0; item 1 (Kroger's obligation) in th-item-1.
  await sendAssignment(c, { plan, item: plan.items[0], revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, deps);
  await sendAssignment(c, { plan, item: plan.items[1], revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, deps);
  await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 2 } } });
  send.mockClear();
  const ctx = await loadCommandContext(c, SETTINGS, NOW);
  const run = (m: MailboxMessage, over: Partial<Parameters<typeof applyCommand>[1]> = {}) =>
    applyCommand(db.client(), { m, ctx, now: m.receivedAt, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox', ...over }, deps);
  return { db, c, plan, commitmentId, deps, send, ctx, run };
}

describe('X07b: loadCommandContext', () => {
  it('binds the recorded assignment and briefing threads to their items and day', async () => {
    const w = await world();
    expect(w.ctx.senders).toEqual([SELLER]);
    expect(w.ctx.assignmentsByThread.get('th-item-0')).toMatchObject({ itemKey: w.plan.items[0].key, revision: 0, day: '2026-10-08' });
    expect(w.ctx.assignmentsByThread.get('th-item-1')).toMatchObject({ itemKey: w.plan.items[1].key });
    expect(w.ctx.briefingsByThread.get('th-brief')).toEqual({ day: '2026-10-08', dayToken: 'daytok' });
  });
});

describe('X07b: applyCommand', () => {
  let w: Awaited<ReturnType<typeof world>>;
  beforeEach(async () => {
    w = await world();
  });

  it('SKIP on an obligation skips the commitment through its owner, records applied once, answers in the thread; a second SKIP is refused already_applied', async () => {
    const r = await w.run(msg({ threadId: 'th-item-1', bodyText: 'SKIP, not this week' }));
    expect(r).toMatchObject({ applied: true, command: 'skip', effect: 'commitment_skipped' });
    expect((await loadCommitment(w.c, w.commitmentId))?.status).toBe('skipped');
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED)).toHaveLength(1);
    const reply = w.send.mock.calls[0][0];
    expect(reply).toMatchObject({ to: SELLER, threadId: 'th-item-1', purpose: 'OPERATOR_ALERT', sender: SENDER });
    expect(reply.headers).toMatchObject({ 'In-Reply-To': '<cmd@mail>', 'Auto-Submitted': 'auto-replied' });
    expect(reply.text).toMatch(/Skipped/);
    const again = await w.run(msg({ threadId: 'th-item-1', bodyText: 'SKIP' }));
    expect(again).toMatchObject({ applied: false, reason: 'already_applied' });
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED)).toHaveLength(1);
    expect(w.send).toHaveBeenCalledTimes(2);
    expect(w.send.mock.calls[1][0].text).toMatch(/already/i);
  });

  it('SKIP on an account item records the account outcome (until tomorrow); DEFER with a date snoozes it; DEFER with no date GAP understands is refused and asked for one', async () => {
    expect(await w.run(msg({ threadId: 'th-item-0', bodyText: 'skip' }))).toMatchObject({ applied: true, effect: 'account_skipped' });
    const outcomes = await loadWorkOutcomes(w.c, ['PepsiCo'], NOW);
    expect(outcomes.get('PepsiCo')?.kind).toBe('skipped');
    const w2 = await world();
    const d = await w2.run(msg({ threadId: 'th-item-0', bodyText: 'DEFER until Oct 14' }));
    expect(d).toMatchObject({ applied: true, effect: 'account_snoozed', until: '2026-10-14' });
    expect((await loadWorkOutcomes(w2.c, ['PepsiCo'], NOW)).get('PepsiCo')?.kind).toBe('snoozed');
    const w3 = await world();
    expect(await w3.run(msg({ threadId: 'th-item-0', bodyText: 'DEFER whenever' }))).toMatchObject({ applied: false, reason: 'when_not_understood' });
    expect(w3.send.mock.calls[0][0].text).toMatch(/date/i);
    expect((await loadWorkOutcomes(w3.c, ['PepsiCo'], NOW)).get('PepsiCo')).toBeUndefined();
  });

  it('DONE needs words; with them an obligation is done with the note as the proof and an account item is recorded done (self-reported; the walk fix, never a one-day log)', async () => {
    expect(await w.run(msg({ threadId: 'th-item-1', bodyText: 'DONE' }))).toMatchObject({ applied: false, reason: 'note_required' });
    const r = await w.run(msg({ threadId: 'th-item-1', bodyText: 'DONE: sent Joey the comparison, he will review Friday' }));
    expect(r).toMatchObject({ applied: true, effect: 'commitment_done' });
    const c = await loadCommitment(w.c, w.commitmentId);
    expect(c?.status).toBe('done');
    expect(c?.proof).toMatchObject({ kind: 'seller', note: 'sent Joey the comparison, he will review Friday' });
    const a = await w.run(msg({ threadId: 'th-item-0', bodyText: 'Done: called Karen instead, she asked for the deck' }));
    expect(a).toMatchObject({ applied: true, effect: 'account_done', basis: 'self_reported' });
    expect((await loadWorkOutcomes(w.c, ['PepsiCo'], NOW)).get('PepsiCo')?.kind).toBe('done');
  });

  it('a command on an older revision is refused stale_revision and the seller is told to answer the latest', async () => {
    await sendAssignment(w.c, { plan: w.plan, item: w.plan.items[0], revision: 1, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, w.deps);
    w.send.mockClear();
    const ctx = await loadCommandContext(w.c, SETTINGS, NOW);
    const r = await w.run(msg({ threadId: 'th-item-0', bodyText: 'SKIP' }), { ctx: { ...ctx, assignmentsByThread: new Map([['th-item-0', { itemKey: w.plan.items[0].key, itemToken: w.plan.items[0].token, revision: 0, contentHash: 'h', day: '2026-10-08' }]]) } });
    expect(r).toMatchObject({ applied: false, reason: 'stale_revision', currentRevision: 1 });
    expect(w.send.mock.calls[0][0].text).toMatch(/latest/i);
  });

  it('NEXT sends the next unassigned item as its own email, and says so when nothing is left; START on the briefing thread starts the day and sends the first unassigned', async () => {
    const w2 = await world();
    // Both items were assigned in world(); NEXT finds nothing.
    const none = await w2.run(msg({ threadId: 'th-item-0', bodyText: 'NEXT' }));
    expect(none).toMatchObject({ applied: true, effect: 'nothing_left' });
    expect(w2.send.mock.calls[0][0].text).toMatch(/Nothing left/);
    // A fresh day with no assignments: START from the briefing sends item 0, NEXT sends item 1.
    const db = ledgerDb({ accounts: ['PepsiCo', 'Kroger'] }, NOW);
    const c = db.client();
    const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:2' } }, { actor: SELLER, now: NOW });
    const plan = await planDay(c, { now: NOW, load: async () => day(made.ok ? made.commitment.commitmentId : '') }, 'test');
    await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 2 } } });
    const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async () => ({ provider: 'gmail', id: 'g', threadId: 'th-new' }));
    const deps = { send, askContext: vi.fn(async () => null), pack: vi.fn(async () => null) };
    const ctx = await loadCommandContext(c, SETTINGS, NOW);
    const start = await applyCommand(db.client(), { m: msg({ threadId: 'th-brief', bodyText: 'START' }), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    expect(start).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: plan.items[0].key });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === DAY_STARTED)).toHaveLength(1);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT)).toHaveLength(1);
    expect(send.mock.calls[0][0].subject).toMatch(/^GAP 1 of 2, PepsiCo/);
    const next = await applyCommand(db.client(), { m: msg({ threadId: 'th-brief', bodyText: 'NEXT' }), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    expect(next).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: plan.items[1].key });
    expect(send.mock.calls[1][0].subject).toMatch(/^GAP 2 of 2, Kroger/);
  });

  it('X12 finding: an APPROVE the effect refuses (the revision not cleared) is recorded refused, and a later APPROVE on a cleared revision proceeds; a successful APPROVE is consumed once', async () => {
    let turn = 0;
    const onApprove = vi.fn(async () => (turn++ === 0 ? { ok: false, text: 'needs a look in GAP', effect: 'revision_not_cleared' } : { ok: true, text: 'drafted', effect: 'gmail_drafted', extra: { gmailDraftId: 'r-1' } }));
    const deps2 = { ...w.deps, onApprove };
    const refused = await applyCommand(w.db.client(), { m: msg({ threadId: 'th-item-0', bodyText: 'APPROVE' }), ctx: w.ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps2);
    expect(refused).toMatchObject({ applied: false, reason: 'revision_not_cleared' });
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED && e.payload.reason === 'revision_not_cleared')).toHaveLength(1);
    const ok = await applyCommand(w.db.client(), { m: msg({ threadId: 'th-item-0', bodyText: 'APPROVE' }), ctx: w.ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps2);
    expect(ok).toMatchObject({ applied: true, effect: 'gmail_drafted' });
    const again = await applyCommand(w.db.client(), { m: msg({ threadId: 'th-item-0', bodyText: 'APPROVE' }), ctx: w.ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps2);
    expect(again).toMatchObject({ applied: false, reason: 'already_applied' });
    expect(onApprove).toHaveBeenCalledTimes(2);
  });

  it('HELP answers with the commands once per item per hour; an unknown line draws the same help; APPROVE and REVISE are refused not_yet_available and the seller is told', async () => {
    expect(await w.run(msg({ threadId: 'th-item-0', bodyText: 'HELP' }))).toMatchObject({ applied: true, effect: 'help_sent' });
    expect(w.send.mock.calls[0][0].text).toMatch(/APPROVE, REVISE/);
    expect(await w.run(msg({ threadId: 'th-item-0', bodyText: 'ok', receivedAt: new Date('2026-10-08T14:10:00Z') }))).toMatchObject({ applied: false, reason: 'help_rate_limited' });
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(await w.run(msg({ threadId: 'th-item-0', bodyText: 'ok', receivedAt: new Date('2026-10-08T15:30:00Z') }))).toMatchObject({ applied: true, effect: 'help_sent' });
    expect(await w.run(msg({ threadId: 'th-item-1', bodyText: 'APPROVE' }))).toMatchObject({ applied: false, reason: 'not_yet_available' });
    expect(await w.run(msg({ threadId: 'th-item-1', bodyText: 'REVISE: make it about the gate' }))).toMatchObject({ applied: false, reason: 'not_yet_available' });
    expect(w.send.mock.calls.at(-1)?.[0].text).toMatch(/not available yet/i);
  });
});

/** Seller acceptance follow-up (2026-10-09): what production did on October 9, and what it does now. */
describe('seller acceptance follow-up: START holds research, a refreshed plan retires approvals, DONE reads its note', () => {
  const OCT9_NOTE = 'DONE: researching catalysts\n\n--\nCasey Larkin · Founding AE, YardFlow by FreightRoll\ncasey@freightroll.com';

  it('B4: START walks past an item with nothing prepared and a research-shaped move, holds it for GAP (recorded once, subject the item) and hands the first assignable item; the answer names the held item in one line', async () => {
    const db = ledgerDb({ accounts: ["Southern Glazer's", 'PepsiCo', 'Kroger'] }, NOW);
    const c = db.client();
    const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:3' } }, { actor: SELLER, now: NOW });
    const base = day(made.ok ? made.commitment.commitmentId : '');
    const sgws = { accountName: "Southern Glazer's", href: '/gap/accounts/southern-glazers', lane: 'follow_up', stateKind: 'follow_up', state: 'Reminder: Follow up with Diego Fonseca when they are back', why: 'Out of office, May 26', person: { name: 'Diego Fonseca', title: null }, next: null, blocker: null, index: 0, source: 'pursuit', tier: 'follow_up' } as WorkDay['cards'][number];
    const plan = await planDay(c, { now: NOW, load: async () => ({ ...base, cards: [sgws, ...base.cards] }) }, 'test');
    expect(plan.items.map((i) => i.accountName)).toEqual(["Southern Glazer's", 'PepsiCo', 'Kroger']);
    await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 3 } } });
    const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async () => ({ provider: 'gmail', id: 'g', threadId: 'th-new' }));
    const askContext = vi.fn(async (_p: unknown, accountName: string): Promise<AskContext | null> => (accountName.startsWith('Southern') ? { accountName, state: { state: 'follow_up', stateLine: 'They were out of office in May.', blocker: null, next: 'Research the catalysts before reaching Diego.', coldTouchAllowed: false }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [] } : null));
    const deps = { send, askContext, pack: vi.fn(async () => null) };
    const ctx = await loadCommandContext(c, SETTINGS, NOW);
    const start = await applyCommand(db.client(), { m: msg({ threadId: 'th-brief', bodyText: 'START' }), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    expect(start).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: plan.items[1].key });
    expect(send.mock.calls[0][0].subject, 'the assignment is PepsiCo, item 2').toMatch(/^GAP 2 of 3, PepsiCo/);
    expect(send.mock.calls[1][0].threadId, 'the answer goes to the briefing thread').toBe('th-brief');
    expect(send.mock.calls[1][0].text).toContain("Held for GAP research: Southern Glazer's (nothing supported to send yet).");
    const holds = db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === ITEM_HELD_FOR_RESEARCH);
    expect(holds).toHaveLength(1);
    expect(holds[0]).toMatchObject({ subject_type: 'work_item', subject_id: plan.items[0].key, payload: { reason: 'research_move' } });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT).map((e) => e.subject_id), "no assignment for Southern Glazer's").toEqual([plan.items[1].key]);
    const applied = db.store.gapAuditEvent.find((e) => e.kind === COMMAND_APPLIED && e.payload.effect === 'assignment_sent');
    expect(applied?.payload.held).toEqual([plan.items[0].key]);
    // NEXT: the hold is not recorded again; Kroger goes out; the held line is still said.
    const next = await applyCommand(db.client(), { m: msg({ threadId: 'th-brief', bodyText: 'NEXT' }), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    expect(next).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: plan.items[2].key });
    expect(db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === ITEM_HELD_FOR_RESEARCH), 'held once').toHaveLength(1);
    expect(send.mock.calls[3][0].text).toContain("Held for GAP research: Southern Glazer's");
  });

  it('B5: after a refresh retires an item, APPROVE and REVISE on it are refused item_retired with the time of the refresh; SKIP still acts on the object; an item kept by the refresh keeps its token and its APPROVE', async () => {
    const w = await world();
    // The day changed: PepsiCo is no longer on it (a first touch went out by hand), Kroger's obligation stays.
    w.db.setClock(new Date('2026-10-08T15:00:00Z'));
    const refreshed = await planDay(w.c, { now: new Date('2026-10-08T15:00:00Z'), load: async () => ({ ...day(w.commitmentId), cards: day(w.commitmentId).cards.slice(1) }), refresh: true }, 'test');
    expect(refreshed.revision).toBe(1);
    expect(refreshed.items.map((i) => i.key)).toEqual([w.plan.items[1].key]);
    expect(refreshed.items[0].token, 'the kept item keeps its token').toBe(w.plan.items[1].token);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === DAY_PLANNED)).toHaveLength(2);
    const onApprove = vi.fn(async () => ({ ok: true, text: 'drafted', effect: 'gmail_drafted' }));
    const onRevise = vi.fn(async () => ({ ok: true, text: 'queued', effect: 'revision_queued' }));
    const deps = { ...w.deps, onApprove, onRevise };
    const run = (threadId: string, bodyText: string) => applyCommand(w.db.client(), { m: msg({ threadId, bodyText }), ctx: w.ctx, now: new Date('2026-10-08T15:10:00Z'), settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' }, deps);
    const approve = await run('th-item-0', 'APPROVE');
    expect(approve).toMatchObject({ applied: false, reason: 'item_retired', outcome: 'refused', source: { accountName: 'PepsiCo' } });
    expect(onApprove, 'the approval never executes').not.toHaveBeenCalled();
    expect(w.send.mock.calls[0][0].text).toBe('The plan was refreshed at 11:00 AM and this item is no longer on it. Reply NEXT for the current one.');
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED && e.payload.reason === 'item_retired')).toHaveLength(1);
    const revise = await run('th-item-0', 'REVISE: shorter');
    expect(revise).toMatchObject({ applied: false, reason: 'item_retired' });
    expect(onRevise).not.toHaveBeenCalled();
    // SKIP acts on the account outcome although the item is off the plan.
    const skip = await run('th-item-0', 'SKIP');
    expect(skip).toMatchObject({ applied: true, effect: 'account_skipped' });
    expect((await loadWorkOutcomes(w.c, ['PepsiCo'], NOW)).get('PepsiCo')?.kind).toBe('skipped');
    // The kept item: APPROVE reaches the effect (the token is on the newest revision).
    const kept = await run('th-item-1', 'APPROVE');
    expect(kept).toMatchObject({ applied: true, effect: 'gmail_drafted' });
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('B6: the October 9 note ("DONE: researching catalysts" with the signature) is progress: recorded progress_noted, the commitment stays open, the seller is told; a later DONE that says what happened still completes it', async () => {
    const w = await world();
    const r = await w.run(msg({ threadId: 'th-item-1', bodyText: OCT9_NOTE }));
    expect(r).toMatchObject({ applied: true, command: 'done', effect: 'progress_noted', basis: 'self_reported', itemKey: w.plan.items[1].key });
    expect((await loadCommitment(w.c, w.commitmentId))?.status, 'the commitment is not done').not.toBe('done');
    const noted = w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === 'progress_noted');
    expect(noted).toHaveLength(1);
    expect(noted[0].payload).toMatchObject({ command: 'done', note: 'researching catalysts', cue: 'researching', basis: 'self_reported', commitmentId: w.commitmentId });
    expect(w.send.mock.calls[0][0].text).toBe('Recorded as in progress, not done: "researching catalysts". The item stays open. When it has happened, reply DONE: what happened; to set it aside, SKIP or DEFER.');
    // The real DONE later: not refused already_applied, the commitment is done with the words as the proof.
    const done = await w.run(msg({ threadId: 'th-item-1', bodyText: 'DONE: called Joey, he wants the comparison Friday' }));
    expect(done).toMatchObject({ applied: true, effect: 'commitment_done' });
    const c = await loadCommitment(w.c, w.commitmentId);
    expect(c?.status).toBe('done');
    expect(c?.proof).toMatchObject({ kind: 'seller', note: 'called Joey, he wants the comparison Friday' });
    // An account item: "will call tomorrow" is progress and logs no outcome; "called Karen" logs one.
    const w2 = await world();
    expect(await w2.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: will call Karen tomorrow' }))).toMatchObject({ applied: true, effect: 'progress_noted' });
    expect((await loadWorkOutcomes(w2.c, ['PepsiCo'], NOW)).get('PepsiCo')).toBeUndefined();
    expect(await w2.run(msg({ threadId: 'th-item-0', bodyText: 'DONE: called Karen, she asked for the deck' }))).toMatchObject({ applied: true, effect: 'account_done' });
    expect((await loadWorkOutcomes(w2.c, ['PepsiCo'], NOW)).get('PepsiCo')?.kind).toBe('done');
  });
});
