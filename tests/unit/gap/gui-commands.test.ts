// @vitest-environment node
/**
 * GUI-09 (the Gmail action UI audit, 2026-10-10): direct selection from the inbox. `ITEM n` (also `OPEN n`, `SEND ME n`)
 * on the briefing thread or any assignment thread sends item n of the day's newest plan revision as its own email
 * through sendAssignment, judged by `assignable` the way START judges the next item: a held item answers the hold's
 * line and is never sent; an item already in the inbox answers its subject and is not sent again; ITEM with no number,
 * or a number off the plan, answers the numbered list with each item's standing. The HELP answer and the briefing
 * footer explain every command with its exact effect, one line each, and say the three safety facts. A GET link
 * (/gap/item, /gap/decide, /gap/start) is never a send path.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { parseCommand, parseSelection } from '@/lib/gap/replies/commands';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, COMMANDS_HELP, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { ASSIGNMENT_SENT, ITEM_HELD_FOR_RESEARCH } from '@/lib/gap/work/assignment';
import { executionAllowed } from '@/lib/gap/work/action-token';
import { BRIEFING_SENT } from '@/lib/gap/work/briefing-send';
import { COMMAND_WORDS, renderBriefing } from '@/lib/gap/work/briefing';
import { ensureCommitment } from '@/lib/gap/work/commitments';
import { planDay, type DayPlan, type PlanItem } from '@/lib/gap/work/plan';
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
/** A body line must never read as a command or a selection. */
const COMMAND_LINE = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
const SELECTION_LINE = /^(item\b|(open|send\s+me)\s*#?\s*\d)/i;

function day(commitmentId: string): WorkDay {
  const sgws = { accountName: "Southern Glazer's", href: '/gap/accounts/southern-glazers', lane: 'follow_up', stateKind: 'follow_up', state: 'Reminder: Follow up with Diego Fonseca when they are back', why: 'Out of office, May 26', person: { name: 'Diego Fonseca', title: null }, next: null, blocker: null, index: 0, source: 'pursuit', tier: 'follow_up' } as WorkDay['cards'][number];
  return {
    cards: [
      sgws,
      { accountName: 'PepsiCo', href: '/gap/accounts/pepsico', lane: 'ready', stateKind: 'ready', state: 'Ready for a first touch', why: 'A prepared first touch', person: { name: 'Karen Ortiz', title: null }, next: { label: 'Send email', href: '/gap/pack/dec-1' }, blocker: null, index: 1, source: 'pursuit', tier: 'ready' },
      { accountName: 'Kroger', href: '/gap/accounts/kroger', lane: 'deals', stateKind: 'in_deal', state: 'In a deal', why: 'A buyer commitment is due', person: null, next: null, blocker: null, index: 2, source: 'pursuit', tier: 'commitment', obligations: [{ key: commitmentId, commitmentId, kind: 'deliverable', tier: 'commitment', title: 'Send the dock comparison', line: 'Due today', dueAt: null, dueDay: '2026-10-08', person: { name: 'Joey', email: 'joey@kroger.com' }, basis: null, href: null, label: null, canComplete: true }] },
    ],
    waiting: [],
    snoozed: [],
    counts: { needsYou: 3, parked: 0, obligationsDue: 1, waiting: 0, snoozed: 0 },
  };
}

function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  return {
    id: `cmd-${Math.random().toString(16).slice(2, 10)}`,
    threadId: 'th-brief',
    rfcMessageId: `<${Math.random().toString(16).slice(2, 10)}@mail>`,
    fromEmail: SELLER,
    fromName: 'Casey',
    subject: 'Re: GAP today',
    snippet: '',
    bodyText: 'ITEM 3',
    rawText: 'ITEM 3',
    bodyHtml: '',
    deliveryStatus: null,
    labelIds: ['INBOX'],
    receivedAt: NOW,
    headers: { 'Authentication-Results': AUTH_OK },
    ...over,
  };
}

/** A fresh day of three items (Southern Glazer's research-shaped and held, PepsiCo, Kroger's obligation), the briefing sent, nothing assigned. */
async function freshDay(sendId: string | null = 'g') {
  const db = ledgerDb({ accounts: ["Southern Glazer's", 'PepsiCo', 'Kroger'] }, NOW);
  const c = db.client();
  const made = await ensureCommitment(c, { accountName: 'Kroger', kind: 'deliverable', title: 'Send the dock comparison', source: { kind: 'capture', id: 'cap:9' } }, { actor: SELLER, now: NOW });
  const plan: DayPlan = await planDay(c, { now: NOW, load: async () => day(made.ok ? made.commitment.commitmentId : '') }, 'test');
  await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 3 } } });
  let n = 0;
  const send = vi.fn<(p: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>>(async (p) => {
    n += 1;
    return { provider: 'gmail', id: sendId ? `${sendId}-${n}` : null, threadId: p.threadId ?? `th-sent-${n}` };
  });
  const askContext = vi.fn(async (_p: unknown, accountName: string): Promise<AskContext | null> => (accountName.startsWith('Southern') ? { accountName, state: { state: 'follow_up', stateLine: 'They were out of office in May.', blocker: null, next: 'Research the catalysts before reaching Diego.', coldTouchAllowed: false }, people: [], setAside: null, story: [], opening: null, otherStories: [], buyerSaid: [] } : null));
  const deps = { send, askContext, pack: vi.fn(async () => null) };
  const run = async (over: Partial<MailboxMessage>) => {
    const ctx = await loadCommandContext(db.client(), SETTINGS, NOW);
    return applyCommand(db.client(), { m: msg(over), ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, deps);
  };
  const assignments = () => db.store.gapAuditEvent.filter((e) => e.kind === ASSIGNMENT_SENT).map((e) => e.subject_id);
  const applied = (effect: string) => db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === effect);
  const answers = () => send.mock.calls.map((call) => call[0]).filter((p) => p.threadId);
  return { db, c, plan, send, deps, run, assignments, applied, answers };
}

describe('GUI-09: the selection grammar (pure)', () => {
  it('ITEM n, ITEM #n, OPEN n and SEND ME n select item n; ITEM alone asks for the list; OPEN and SEND ME without a number are not selections', () => {
    expect(parseCommand('ITEM 6')).toEqual({ kind: 'item', n: 6 });
    expect(parseCommand('item #6')).toEqual({ kind: 'item', n: 6 });
    expect(parseCommand('Item 6 please')).toEqual({ kind: 'item', n: 6 });
    expect(parseCommand('OPEN 2')).toEqual({ kind: 'item', n: 2 });
    expect(parseCommand('Send me 3')).toEqual({ kind: 'item', n: 3 });
    expect(parseCommand('send me #3')).toEqual({ kind: 'item', n: 3 });
    expect(parseCommand('ITEM')).toEqual({ kind: 'item', n: null });
    expect(parseCommand('Item, please')).toEqual({ kind: 'item', n: null });
    // A critique that opens with "Open" is a critique; a bare "Open" is unknown; "Send" alone never selects.
    expect(parseCommand('Open to that, but make it shorter and lead with the gate')).toMatchObject({ kind: 'revise' });
    expect(parseCommand('Open')).toEqual({ kind: 'unknown', line: 'Open' });
    expect(parseCommand('SEND 3')).toEqual({ kind: 'unknown', line: 'SEND 3' });
    expect(parseCommand('Items are fine')).toEqual({ kind: 'unknown', line: 'Items are fine' });
    expect(parseSelection('ITEM 12')).toEqual({ kind: 'item', n: 12 });
    expect(parseSelection('Opening the gate')).toBeNull();
    // A selection inside quoted text is never read; the first unquoted line decides.
    expect(parseCommand('> ITEM 6\n\nNEXT')).toEqual({ kind: 'next' });
    expect(parseCommand('\n\n> On Thu, GAP wrote:\n> ITEM 6')).toEqual({ kind: 'unknown', line: '' });
  });
});

describe('GUI-09: ITEM n from the briefing and from an assignment thread', () => {
  it('ITEM 3 sends item 3 as its own email (judged assignable, recorded with the provider receipt); ITEM 3 again answers "Already in your inbox" and sends nothing', async () => {
    const w = await freshDay();
    const r = await w.run({ bodyText: 'ITEM 3' });
    expect(r).toMatchObject({ applied: true, command: 'item', effect: 'assignment_sent', itemKey: w.plan.items[2].key, outcome: 'accepted', source: { accountName: 'Kroger' } });
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.send.mock.calls[0][0].subject).toMatch(/^GAP 3 of 3, Kroger: Send the dock comparison/);
    expect(w.send.mock.calls[0][0].to).toBe(SELLER);
    expect(w.assignments(), 'only item 3 went out; items 1 and 2 were not walked').toEqual([w.plan.items[2].key]);
    const row = w.applied('assignment_sent');
    expect(row).toHaveLength(1);
    expect(row[0]).toMatchObject({ subject_type: 'work_day', subject_id: '2026-10-08', payload: { command: 'item', requested: 3, itemKey: w.plan.items[2].key, receipt: 'provider_confirmed', gmailMessageId: 'g-1' } });
    // Again: nothing sent, the subject named, one applied row says so.
    const again = await w.run({ bodyText: 'ITEM 3' });
    expect(again).toMatchObject({ applied: true, effect: 'already_in_inbox', itemKey: w.plan.items[2].key, next: 'Answer that item in its own email; reply ITEM and another number for a different one.' });
    expect(w.assignments()).toHaveLength(1);
    expect(w.send).toHaveBeenCalledTimes(2);
    expect(w.send.mock.calls[1][0].text).toMatch(/^Already in your inbox: GAP 3 of 3, Kroger: Send the dock comparison \[GAP#[a-f0-9]+\.0\]\. Nothing was sent again; answer it there\.$/);
    expect(w.send.mock.calls[1][0].threadId).toBe('th-brief');
  });

  it('ITEM 1 on a held item answers the hold\'s line and never sends; the hold is recorded once across two asks; the applied row says item_held', async () => {
    const w = await freshDay();
    const r = await w.run({ bodyText: 'OPEN 1' });
    expect(r).toMatchObject({ applied: true, effect: 'item_held', itemKey: w.plan.items[0].key, source: { accountName: "Southern Glazer's" } });
    expect(w.assignments()).toEqual([]);
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.send.mock.calls[0][0].text).toBe("Held for GAP research: item 1, Southern Glazer's: Reminder: Follow up with Diego Fonseca when they are back (nothing supported to send yet). It is not sent as an assignment.");
    const holds = () => w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED && e.payload.effect === ITEM_HELD_FOR_RESEARCH);
    expect(holds()).toHaveLength(1);
    expect(holds()[0]).toMatchObject({ subject_type: 'work_item', subject_id: w.plan.items[0].key, payload: { reason: 'research_move' } });
    await w.run({ bodyText: 'SEND ME 1' });
    expect(holds(), 'held once').toHaveLength(1);
    expect(w.assignments()).toEqual([]);
    expect(w.applied('item_held')).toHaveLength(2);
  });

  it('ITEM with no number lists the items with their numbers and standings; a number off the plan says so and lists them; nothing is sent either way', async () => {
    const w = await freshDay();
    await w.run({ bodyText: 'ITEM 3' });
    await w.run({ bodyText: 'ITEM 1' });
    w.send.mockClear();
    const list = await w.run({ bodyText: 'ITEM' });
    expect(list).toMatchObject({ applied: true, effect: 'item_list_sent', next: 'Reply ITEM and the number, and that item arrives as its own email.' });
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.send.mock.calls[0][0].text).toBe([
      "Today's items, by number (reply ITEM and the number for one as its own email):",
      "1. Southern Glazer's: Reminder: Follow up with Diego Fonseca when they are back (held for GAP research)",
      '2. PepsiCo: Ready for a first touch (not sent yet)',
      '3. Kroger: Send the dock comparison (in your inbox)',
    ].join('\n'));
    const off = await w.run({ bodyText: 'ITEM 9' });
    expect(off).toMatchObject({ applied: true, effect: 'item_list_sent' });
    expect(w.send.mock.calls[1][0].text).toMatch(/^There is no item 9; today's plan has 3 items:\n1\. Southern Glazer's/);
    expect(w.assignments(), 'the list sends no assignment').toEqual([w.plan.items[2].key]);
    expect(w.applied('item_list_sent').map((e) => e.payload.requested)).toEqual([null, 9]);
  });

  it('from an assignment thread, ITEM 2 sends item 2 as its own email (recorded on the day, not on the thread\'s item); a settled item is refused item_settled; the same Gmail message is never applied twice', async () => {
    const w = await freshDay();
    await w.run({ bodyText: 'ITEM 3' });
    const kroger = w.db.store.gapAuditEvent.find((e) => e.kind === ASSIGNMENT_SENT);
    const krogerThread = String(kroger?.payload.gmailThreadId);
    w.send.mockClear();
    const r = await w.run({ threadId: krogerThread, subject: 'Re: GAP 3 of 3, Kroger', bodyText: 'SEND ME 2' });
    expect(r).toMatchObject({ applied: true, effect: 'assignment_sent', itemKey: w.plan.items[1].key, source: { accountName: 'PepsiCo' } });
    expect(w.send.mock.calls[0][0].subject).toMatch(/^GAP 2 of 3, PepsiCo/);
    expect(w.applied('assignment_sent').map((e) => [e.subject_type, e.subject_id])).toEqual([['work_day', '2026-10-08'], ['work_day', '2026-10-08']]);
    // SKIP Kroger by email, then ask for it: settled, not sent again.
    await w.run({ threadId: krogerThread, subject: 'Re: GAP 3 of 3, Kroger', bodyText: 'SKIP' });
    w.send.mockClear();
    const settled = await w.run({ bodyText: 'ITEM 3' });
    expect(settled).toMatchObject({ applied: false, command: 'item', reason: 'item_settled', outcome: 'refused' });
    expect(w.send.mock.calls[0][0].text).toMatch(/^Item 3, Kroger: Send the dock comparison, was settled today/);
    expect(w.db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_REFUSED && e.payload.reason === 'item_settled')).toHaveLength(1);
    // One provider message is one command: a replay of the same Gmail id applies nothing and sends nothing.
    const m = msg({ bodyText: 'ITEM 1' });
    const ctx = await loadCommandContext(w.db.client(), SETTINGS, NOW);
    const input = { ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron' };
    w.send.mockClear();
    expect(await applyCommand(w.db.client(), { m, ...input }, w.deps)).toMatchObject({ applied: true, effect: 'item_held' });
    expect(await applyCommand(w.db.client(), { m, ...input }, w.deps)).toMatchObject({ applied: false, reason: 'duplicate_message' });
    expect(w.send).toHaveBeenCalledTimes(1);
  });
});

describe('GUI-09: every command says its exact effect; no help or footer line reads as a command', () => {
  it('the HELP answer has one line per command and the three safety facts', () => {
    const lines = COMMANDS_HELP.split('\n');
    for (const l of lines) {
      expect(l, l).not.toMatch(COMMAND_LINE);
      expect(l, l).not.toMatch(SELECTION_LINE);
    }
    for (const word of ['APPROVE', 'REVISE', 'SKIP', 'DEFER', 'DONE', 'NEXT', 'ITEM', 'START', 'HELP']) expect(lines.some((l) => l.startsWith(`Reply ${word}`)), word).toBe(true);
    expect(COMMANDS_HELP).toContain('Reply APPROVE to approve this item\'s email for the send step in the app only; nothing is sent until you press CONFIRM + SEND there.');
    expect(COMMANDS_HELP).toContain('Opening a link in a GAP email never approves or sends anything.');
    expect(COMMANDS_HELP).toContain('A reply to a GAP message reaches GAP only, never a buyer.');
    expect(COMMANDS_HELP).toContain('Reply ITEM 6 (or OPEN 6, SEND ME 6) and item 6 of today\'s plan arrives as its own email; ITEM alone lists the items with their numbers.');
    expect(COMMANDS_HELP).toMatch(/APPROVE, REVISE/);
  });

  it('the briefing footer, when commands are on, explains START and ITEM n and each item command with its effect, one line each', () => {
    const it0 = (over: Partial<PlanItem> & { key: string; rank: number; accountName: string; token: string }): PlanItem => ({ kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: null, refs: {}, ...over });
    const plan: DayPlan = { day: '2026-10-08', plannedAt: NOW.toISOString(), fresh: true, items: [it0({ key: 'first_touch:dec-1', rank: 0, accountName: 'PepsiCo', token: 'a'.repeat(32) })], counts: { needsYou: 1, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 } };
    const links = { start: 'https://x/start', work: 'https://x/work', item: (it: PlanItem) => `https://x/item/${it.token}` };
    const out = renderBriefing({ plan, dayToken: 'tok', links, commandsEnabled: true, legacyDigest: false }, NOW);
    expect(out.text).toContain('To work from your inbox, reply with START and item 1 arrives as its own email. Reply ITEM 6 (or OPEN 6, SEND ME 6) and item 6 arrives as its own email; ITEM alone lists the items with their numbers.');
    expect(out.text).toContain('- Reply APPROVE to approve its email for the send step in the app only; nothing is sent until you press CONFIRM + SEND there.');
    expect(out.text).toContain('- Reply REVISE: your words and GAP rewrites the email on your words and sends the revision back to you.');
    expect(out.text).toContain('- Reply SKIP to set it aside for today; DEFER Oct 14 to bring it back that day; DONE: what happened to record your words as the record.');
    expect(out.text).toContain('- Reply NEXT for the next item; HELP for this list.');
    expect(out.text).toContain('Opening a link in this email never approves or sends anything. A reply to a GAP message reaches GAP only, never a buyer.');
    for (const l of out.text.split('\n')) {
      expect(l, l).not.toMatch(COMMAND_LINE);
      expect(l, l).not.toMatch(SELECTION_LINE);
    }
    expect(out.html).toContain('Reply ITEM 6 (or OPEN 6, SEND ME 6)');
    const off = renderBriefing({ plan, dayToken: 'tok', links, commandsEnabled: false, legacyDigest: false }, NOW);
    expect(off.text).not.toMatch(/Reply ITEM/);
  });
});

describe('GUI-09: a GET link is never a send path', () => {
  const page = (dir: string) => readFileSync(path.resolve(__dirname, '../../../src/app/gap', dir, 'page.tsx'), 'utf8');

  it('the gate: an executing op on a bare GET is refused preview_get; `open` has nothing to execute; only a POST or a confirmed GET may run', () => {
    expect(executionAllowed({ op: 'open', method: 'GET' })).toEqual({ ok: false, reason: 'not_executing' });
    expect(executionAllowed({ op: 'open', method: 'POST' })).toEqual({ ok: false, reason: 'not_executing' });
    for (const op of ['start', 'decide'] as const) {
      expect(executionAllowed({ op, method: 'GET' })).toEqual({ ok: false, reason: 'preview_get' });
      expect(executionAllowed({ op, method: 'GET', confirmed: false })).toEqual({ ok: false, reason: 'preview_get' });
      expect(executionAllowed({ op, method: 'HEAD', confirmed: true })).toEqual({ ok: false, reason: 'preview_get' });
      expect(executionAllowed({ op, method: 'GET', confirmed: true })).toEqual({ ok: true });
      expect(executionAllowed({ op, method: 'POST' })).toEqual({ ok: true });
    }
  });

  it('/gap/item only verifies and redirects: it sends nothing, starts nothing, decides nothing and writes no ledger row', () => {
    const src = page('item');
    expect(src).toContain('verifyActionToken');
    expect(src).toContain('redirect(');
    for (const forbidden of ['sendAssignment', 'startDay', 'applyDecision', 'gapAuditEvent', 'sendViaGmail', 'gmailSender', 'onApprove']) expect(src, forbidden).not.toContain(forbidden);
    // An executing op reaching it is handed to its own page, which asks for the click.
    expect(src).toContain("if (v.payload.op === 'start') redirect(`/gap/start?t=");
    expect(src).toContain("if (v.payload.op === 'decide') redirect(`/gap/decide?t=");
  });

  it('/gap/start and /gap/decide execute only past the GET gate: the confirm form comes first, and the send or the decision sits after executionAllowed', () => {
    const start = page('start');
    const gateStart = start.indexOf("executionAllowed({ op: 'start', method: 'GET', confirmed: q.confirmed === '1' })");
    expect(gateStart).toBeGreaterThan(0);
    expect(start.indexOf('data-testid="start-confirm-form"')).toBeGreaterThan(gateStart);
    expect(start.indexOf('await startDay(')).toBeGreaterThan(start.indexOf('data-testid="start-confirm-form"'));
    expect(start.indexOf('await sendAssignment(')).toBeGreaterThan(start.indexOf('data-testid="start-confirm-form"'));
    expect(start).toContain('Nothing goes to a buyer. Nothing happens until you confirm.');
    const decide = page('decide');
    const gateDecide = decide.indexOf("executionAllowed({ op: 'decide', method: 'GET', confirmed: q.confirmed === '1' })");
    expect(gateDecide).toBeGreaterThan(0);
    expect(decide.indexOf('data-testid="decide-confirm-form"')).toBeGreaterThan(gateDecide);
    expect(decide.indexOf('await applyDecision(')).toBeGreaterThan(decide.indexOf('data-testid="decide-confirm-form"'));
    for (const forbidden of ['sendAssignment', 'sendViaGmail', 'onApprove']) expect(decide, forbidden).not.toContain(forbidden);
    expect(decide).toContain('Nothing is applied until you confirm; nothing is sent to anyone either way.');
  });
});
