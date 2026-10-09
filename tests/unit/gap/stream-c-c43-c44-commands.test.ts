// @vitest-environment node
/**
 * C43 and C44 (GAP OS commercial context and execution audit, 2026-10-08): command authenticity, stale links, replay
 * idempotency, and every visible action ending in a recoverable state.
 *   C43  adversarial fixtures across commands.ts, commands-apply.ts and action-token.ts: a forwarded APPROVE, a forged
 *        sender, a message with no trusted authentication header, an auto-response, an APPROVE only inside quoted
 *        text, a reply outside the original thread: none mutates work. The same provider message (one Gmail id)
 *        applies once. An expired day token finds nothing. A link preview (a bare GET) cannot execute a decision.
 *   C44  START, NEXT, REVISE, APPROVE, SKIP, DEFER and DONE each report accepted, refused, queued, prepared, failed or
 *        unknown with the source item and the next path; an unknown handler answer, an invalid revision and a CRM
 *        outage leave the originals standing and consume no retry.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { applyCommand, COMMAND_APPLIED, COMMAND_REFUSED, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { authenticateCommand, parseCommand } from '@/lib/gap/replies/commands';
import { ASSIGNMENT_SENT, sendAssignment } from '@/lib/gap/work/assignment';
import { ensureCommitment, loadCommitment } from '@/lib/gap/work/commitments';
import { BRIEFING_SENT } from '@/lib/gap/work/briefing-send';
import { loadWorkOutcomes } from '@/lib/gap/work/outcome';
import { planDay, type DayPlan } from '@/lib/gap/work/plan';
import { executionAllowed, signActionToken, verifyActionToken } from '@/lib/gap/work/action-token';
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

let seq = 0;
function msg(over: Partial<MailboxMessage> = {}): MailboxMessage {
  seq += 1;
  return { id: `cmd-${seq}`, threadId: 'th-item-1', rfcMessageId: `<cmd-${seq}@mail>`, fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 2 of 2', snippet: '', bodyText: 'SKIP', rawText: 'SKIP', bodyHtml: '', deliveryStatus: null, labelIds: ['INBOX'], receivedAt: NOW, headers: { 'Authentication-Results': AUTH_OK }, ...over };
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
  await sendAssignment(c, { plan, item: plan.items[0], revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, deps);
  await sendAssignment(c, { plan, item: plan.items[1], revision: 0, to: SELLER, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, commandsEnabled: true, now: NOW, actor: 'test' }, deps);
  await c.gapAuditEvent.create({ data: { kind: BRIEFING_SENT, actor: 'test', subject_type: 'work_day', subject_id: '2026-10-08', payload: { to: SELLER, gmailThreadId: 'th-brief', dayToken: 'daytok', items: 2 } } });
  send.mockClear();
  const ctx = await loadCommandContext(c, SETTINGS, NOW);
  const run = (m: MailboxMessage, extra: Record<string, unknown> = {}) => applyCommand(db.client(), { m, ctx, now: m.receivedAt, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, { ...deps, ...extra });
  const commitment = () => loadCommitment(db.client(), commitmentId);
  const commandRows = () => db.store.gapAuditEvent.filter((e) => e.kind === COMMAND_APPLIED || e.kind === COMMAND_REFUSED);
  return { db, c, plan, commitmentId, deps, send, ctx, run, commitment, commandRows };
}

describe('C43: forged, forwarded, auto-response, quoted and out-of-thread commands never mutate work', () => {
  let w: Awaited<ReturnType<typeof world>>;
  beforeEach(async () => {
    w = await world();
  });

  const cases: Array<[string, Partial<MailboxMessage>, string]> = [
    ['a forged sender (an address not configured to command)', { fromEmail: 'attacker@freightroll.com' }, 'sender_not_allowed'],
    ['no trusted authentication header at all', { headers: {} }, 'no_authentication_results'],
    ['DMARC failed', { headers: { 'Authentication-Results': 'mx.google.com; dmarc=fail (p=NONE) header.from=freightroll.com' } }, 'dmarc_not_passed'],
    ['DMARC passed for another domain (a lookalike)', { headers: { 'Authentication-Results': 'mx.google.com; dmarc=pass (p=NONE) header.from=freightroll-mail.com' } }, 'dmarc_not_aligned'],
    ['an auto-response (Auto-Submitted)', { headers: { 'Authentication-Results': AUTH_OK, 'Auto-Submitted': 'auto-replied' } }, 'auto_submitted'],
    ['a vendor autoresponder header', { headers: { 'Authentication-Results': AUTH_OK, 'X-Autoreply': 'yes' } }, 'auto_submitted'],
    ['a bulk precedence', { headers: { 'Authentication-Results': AUTH_OK, Precedence: 'bulk' } }, 'auto_submitted'],
    ['a forward by subject', { subject: 'Fwd: GAP 2 of 2', bodyText: 'APPROVE', rawText: 'APPROVE' }, 'forwarded'],
    ['a forward by marker', { bodyText: '---------- Forwarded message ----------\nAPPROVE', rawText: '---------- Forwarded message ----------\nAPPROVE' }, 'forwarded'],
    ['a reply outside the original thread with no message id named', { threadId: 'th-somewhere-else', headers: { 'Authentication-Results': AUTH_OK } }, 'no_assignment_match'],
  ];
  it.each(cases)('%s: refused by name, nothing applied, nothing answered, the commitment untouched', async (_name, over, reason) => {
    const m = msg({ bodyText: 'SKIP', rawText: 'SKIP', ...over });
    expect(authenticateCommand(m, w.ctx)).toMatchObject({ ok: false, reason });
    const r = await w.run(m);
    // applyCommand judges a message outside every GAP thread as not a command at all (the same nothing-runs result).
    expect(r).toMatchObject({ applied: false, reason: reason === 'no_assignment_match' ? 'not_a_command' : reason, outcome: 'refused' });
    expect(w.commandRows()).toHaveLength(0);
    expect(w.send).not.toHaveBeenCalled();
    expect((await w.commitment())?.status).toBe('open');
  });

  it('an APPROVE that appears only inside quoted text is never read as a command (the first non-quoted line decides)', async () => {
    const quoted = '> APPROVE\n> On Thu GAP wrote: reply APPROVE to draft it.';
    expect(parseCommand(quoted)).toEqual({ kind: 'unknown', line: '' });
    const m = msg({ bodyText: `Thanks, looking.\n${quoted}`, rawText: `Thanks, looking.\n${quoted}` });
    const onApprove = vi.fn(async () => ({ ok: true, text: 'drafted', effect: 'gmail_drafted' }));
    const r = await w.run(m, { onApprove });
    expect(r.command).not.toBe('approve');
    expect(onApprove).not.toHaveBeenCalled();
    expect(w.commandRows().filter((e) => e.kind === COMMAND_APPLIED && e.payload.command === 'approve')).toHaveLength(0);
  });

  it('a duplicate valid command (the same Gmail message seen twice) applies once and answers once; a second message with the same words is the ordinary already_applied', async () => {
    const m = msg({ bodyText: 'SKIP', rawText: 'SKIP' });
    const first = await w.run(m);
    expect(first).toMatchObject({ applied: true, effect: 'commitment_skipped', outcome: 'accepted', source: { accountName: 'Kroger', title: 'Send the dock comparison' } });
    expect(w.send).toHaveBeenCalledTimes(1);
    const again = await w.run(m);
    expect(again).toMatchObject({ applied: false, reason: 'duplicate_message', outcome: 'refused' });
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(w.commandRows().filter((e) => e.kind === COMMAND_APPLIED)).toHaveLength(1);
    expect((await w.commitment())?.status).toBe('skipped');
    const other = await w.run(msg({ bodyText: 'SKIP', rawText: 'SKIP' }));
    expect(other).toMatchObject({ applied: false, reason: 'already_applied', outcome: 'refused', next: 'Reply NEXT for the next item.' });
  });

  it('a stale (older-revision) link is refused with the current revision and the next path; an expired day token finds nothing', async () => {
    await w.c.gapAuditEvent.create({ data: { kind: ASSIGNMENT_SENT, actor: 'test', subject_type: 'work_item', subject_id: w.plan.items[1].key, payload: { day: '2026-10-08', itemToken: w.plan.items[1].token, revision: 1, to: SELLER, gmailThreadId: 'th-item-1-r1', contentHash: 'h1', subject: 'r1', prepared: { kind: 'none' } } } });
    const r = await w.run(msg({ bodyText: 'DONE: sent it', rawText: 'DONE: sent it' }));
    expect(r).toMatchObject({ applied: false, reason: 'stale_revision', currentRevision: 1, outcome: 'refused', source: { accountName: 'Kroger' }, next: 'Answer the latest email for this item.' });
    expect((await w.commitment())?.status).toBe('open');
    const expired = signActionToken({ op: 'decide', item: 'signal:s1|pursue', day: '2026-10-01' }, { secret: 's', now: new Date('2026-10-01T00:00:00Z'), ttlSeconds: 60 });
    expect(verifyActionToken(expired, { secret: 's', now: NOW })).toEqual({ ok: false, reason: 'expired' });
    expect(verifyActionToken(`${expired}x`, { secret: 's', now: new Date('2026-10-01T00:00:30Z') })).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('a link preview (a bare GET) cannot execute a decision, a start, a defer or a review; a POST or a confirmed GET can; open is navigation', () => {
    for (const op of ['decide', 'start', 'defer', 'review'] as const) {
      expect(executionAllowed({ op, method: 'GET' })).toEqual({ ok: false, reason: 'preview_get' });
      expect(executionAllowed({ op, method: 'HEAD' })).toEqual({ ok: false, reason: 'preview_get' });
      expect(executionAllowed({ op, method: 'POST' })).toEqual({ ok: true });
      expect(executionAllowed({ op, method: 'get', confirmed: true })).toEqual({ ok: true });
    }
    expect(executionAllowed({ op: 'open', method: 'GET' })).toEqual({ ok: false, reason: 'not_executing' });
  });
});

describe('C44: every visible action ends in a recoverable state with its source and next path', () => {
  let w: Awaited<ReturnType<typeof world>>;
  beforeEach(async () => {
    w = await world();
  });

  it('START and NEXT are accepted with the item sent next; SKIP, DEFER and DONE are accepted with the source item; APPROVE is prepared; REVISE is queued', async () => {
    const start = await w.run(msg({ threadId: 'th-brief', bodyText: 'START', rawText: 'START' }));
    expect(start).toMatchObject({ applied: true, outcome: 'accepted', effect: 'nothing_left', next: 'Open Work in GAP for what is waiting and parked.' });
    const defer = await w.run(msg({ bodyText: 'DEFER Oct 14', rawText: 'DEFER Oct 14' }));
    expect(defer).toMatchObject({ applied: true, outcome: 'accepted', effect: 'commitment_snoozed', until: '2026-10-14', source: { key: w.plan.items[1].key, accountName: 'Kroger', title: 'Send the dock comparison' }, next: 'It returns on that day. Reply NEXT for the next item.' });
    const done = await w.run(msg({ bodyText: 'DONE: sent the comparison', rawText: 'DONE: sent the comparison' }));
    expect(done).toMatchObject({ applied: true, outcome: 'accepted', effect: 'commitment_done', basis: 'self_reported', source: { accountName: 'Kroger' } });
    const skipAccount = await w.run(msg({ threadId: 'th-item-0', bodyText: 'SKIP travel', rawText: 'SKIP travel' }));
    expect(skipAccount).toMatchObject({ applied: true, outcome: 'accepted', effect: 'account_skipped', source: { accountName: 'PepsiCo', title: 'Ready for a first touch' }, next: 'It returns tomorrow. Reply NEXT for the next item.' });
    const w2 = await world();
    const approve = await w2.run(msg({ threadId: 'th-item-0', bodyText: 'APPROVE', rawText: 'APPROVE' }), { onApprove: vi.fn(async () => ({ ok: true, text: 'Done: a Gmail draft.', effect: 'gmail_drafted', extra: { gmailDraftId: 'r-1' } })) });
    expect(approve).toMatchObject({ applied: true, outcome: 'prepared', effect: 'gmail_drafted', source: { accountName: 'PepsiCo' }, next: 'Send it from GAP (CONFIRM + SEND) or from Gmail; reply NEXT for the next item.' });
    const w3 = await world();
    const revise = await w3.run(msg({ threadId: 'th-item-0', bodyText: 'REVISE: shorter, name the gate', rawText: 'REVISE: shorter, name the gate' }), { onRevise: vi.fn(async () => ({ ok: true, text: 'Queued.', effect: 'revision_queued', extra: { taskId: 'at_1' } })) });
    expect(revise).toMatchObject({ applied: true, outcome: 'queued', effect: 'revision_queued', source: { accountName: 'PepsiCo' }, next: 'The revised email comes back as a new email on this item.' });
  });

  it('an unknown handler answer is unknown: nothing recorded as applied, the command not consumed; a refusal from the handler is refused with its reason', async () => {
    const m = msg({ threadId: 'th-item-0', bodyText: 'APPROVE', rawText: 'APPROVE' });
    const r = await w.run(m, { onApprove: vi.fn(async () => undefined as never) });
    expect(r).toMatchObject({ applied: false, reason: 'effect_unknown', outcome: 'unknown', source: { accountName: 'PepsiCo' }, next: 'Nothing is recorded as done. Open the item in GAP to see its state.' });
    expect(w.commandRows().filter((e) => e.kind === COMMAND_APPLIED)).toHaveLength(0);
    // The retry is not consumed: a later APPROVE (a new message) on the same item proceeds.
    const later = await w.run(msg({ threadId: 'th-item-0', bodyText: 'APPROVE', rawText: 'APPROVE' }), { onApprove: vi.fn(async () => ({ ok: true, text: 'Done.', effect: 'gmail_drafted' })) });
    expect(later).toMatchObject({ applied: true, outcome: 'prepared' });
    const refused = await (await world()).run(msg({ threadId: 'th-item-0', bodyText: 'APPROVE', rawText: 'APPROVE' }), { onApprove: vi.fn(async () => ({ ok: false, text: 'Not current.', effect: 'revision_not_current' })) });
    expect(refused).toMatchObject({ applied: false, reason: 'revision_not_current', outcome: 'refused', source: { accountName: 'PepsiCo' }, next: 'Open the item in GAP.' });
  });

  it('a CRM outage (the transition throws) is failed: the originals stand, nothing is applied, the seller is told, and the same command may be sent again', async () => {
    const broken = w.db.client();
    const realUpdate = broken.gapAuditEvent.create;
    let calls = 0;
    // The commitment ledger write throws once (an outage mid-transition), then recovers.
    broken.gapAuditEvent.create = async (args: { data: Record<string, unknown>; select?: Record<string, unknown> }) => {
      if (args.data.kind === 'account.commitment') {
        calls += 1;
        if (calls === 1) throw new Error('connection reset by peer');
      }
      return realUpdate(args);
    };
    const m = msg({ bodyText: 'DONE: sent it', rawText: 'DONE: sent it' });
    const r = await applyCommand(broken, { m, ctx: w.ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, w.deps);
    expect(r).toMatchObject({ applied: false, reason: 'handler_failed', outcome: 'failed', source: { accountName: 'Kroger', title: 'Send the dock comparison' }, next: 'Nothing changed. Send the same command again, or open the item in GAP.' });
    expect((await w.commitment())?.status).toBe('open');
    expect(w.commandRows().filter((e) => e.kind === COMMAND_APPLIED)).toHaveLength(0);
    expect(w.commandRows().filter((e) => e.kind === COMMAND_REFUSED && e.payload.reason === 'handler_failed' && String(e.payload.error).includes('connection reset'))).toHaveLength(1);
    expect(w.send).toHaveBeenCalledTimes(1);
    expect(String((w.send.mock.calls[0][0] as GmailSendPayload).text)).toContain('Nothing changed. Send the same command again');
    // The retry (a new message, the outage over) is accepted.
    const retry = await applyCommand(broken, { m: msg({ bodyText: 'DONE: sent it', rawText: 'DONE: sent it' }), ctx: w.ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron:gap-mailbox' }, w.deps);
    expect(retry).toMatchObject({ applied: true, outcome: 'accepted', effect: 'commitment_done' });
    expect((await w.commitment())?.status).toBe('done');
    expect((await loadWorkOutcomes(w.db.client(), ['Kroger'], NOW)).size).toBe(0);
  });
});
