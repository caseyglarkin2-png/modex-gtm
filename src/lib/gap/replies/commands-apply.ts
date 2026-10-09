/**
 * EMAIL COMMANDS, applied (X07b, GAP OS sales execution engine, 2026-10-08). Server only; called by the GAP mailbox
 * cron through `MailboxDeps.onCommand` after the `mailbox.command` verdict row is written (gap-mailbox.ts).
 *
 * Every effect goes to the OWNER of the state it changes: an obligation through work/commitments.ts (skipped, snoozed,
 * done with the seller's note as the proof), an account item through work/outcome.ts (skipped until tomorrow, snoozed
 * to a date, logged outside GAP: self-reported and labelled), an assignment through work/assignment.ts. The plan
 * itself records only `work.command_applied` (what ran, on which revision, from which Gmail message) or
 * `work.command_refused` (why not). GAP answers every command in the same thread, as an internal message.
 *
 * Rules (pinned by tests/unit/gap/commands-apply.test.ts):
 *   - SKIP, DEFER and DONE act on an item ONCE: a second identical command is refused `already_applied` (replay)
 *   - a command bound to an older revision than the item's latest assignment is refused `stale_revision`
 *   - DEFER needs a date GAP understands (work/dates.ts parseDuePhrase; `DEFER` alone means tomorrow); DONE needs words
 *   - NEXT sends the next unassigned item; START (the briefing thread) starts the day and sends the first unassigned
 *   - HELP, and an unknown line, answer with the commands once per item per hour (HELP_INTERVAL_MS)
 *   - APPROVE and REVISE run through `deps.onApprove` / `deps.onRevise` when wired (X11, X09); absent, they are
 *     refused `not_yet_available` and the seller is told
 *   - nothing here sends to a buyer, drafts, enrolls or writes HubSpot
 *   - seller acceptance follow-up (2026-10-09): START and NEXT walk the NEWEST revision of the plan and hand the
 *     seller only an assignable item (work/assignment.ts nextAssignableItem); an item held for GAP research is named
 *     in the answer, one line each. APPROVE and REVISE bound to an item whose key is off the newest revision are
 *     refused `item_retired` (the plan was refreshed; reply NEXT); SKIP, DEFER and DONE still act (they act on the
 *     object). DONE's note is READ first (work/done-note.ts): a note that says what the seller is doing or will do is
 *     recorded `progress_noted` and changes no commitment or outcome, and it never counts as an applied DONE
 */
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { ASSIGNMENT_SENT, ITEM_SUBJECT_TYPE, loadAssignments, nextAssignableItem, sendAssignment, startDay, type AssignmentDeps } from '../work/assignment';
import { BRIEFING_SENT } from '../work/briefing-send';
import { loadCommitment, transitionCommitment } from '../work/commitments';
import { nyDayAt, parseDuePhrase } from '../work/dates';
import { progressLine, readDoneNote } from '../work/done-note';
import { recordWorkOutcome } from '../work/outcome';
import { loadDayPlan, loadDayPlanRevisions, type DayPlan, type PlanItem } from '../work/plan';
import type { SellerSettings } from '../work/settings';
import { authenticateCommand, commandTextOf, matchCommandTarget, parseCommand, type AssignmentRef, type BriefingRef, type CommandContext, type ParsedCommand } from './commands';
import type { MailboxVerdict } from './gap-mailbox';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const COMMAND_APPLIED = 'work.command_applied' as const;
export const COMMAND_REFUSED = 'work.command_refused' as const;
/** The assignment and briefing threads a command may answer are read this far back. */
export const COMMAND_LOOKBACK_DAYS = 14;
export const HELP_INTERVAL_MS = 60 * 60_000;
const DAY_MS = 86_400_000;

export const COMMANDS_HELP = 'Commands, on the first line of your reply: APPROVE, REVISE: your words, SKIP, DEFER Oct 14, DONE: what happened, NEXT, HELP. APPROVE creates the Gmail draft; REVISE has GAP rewrite and come back; SKIP sets it aside for today; DEFER brings it back on that day; DONE records what happened as your word; NEXT sends the next item. Anything longer than a sentence is read as a revision request.';

/** The command senders and every recorded assignment and briefing thread of the lookback, keyed for the verdict. */
export async function loadCommandContext(prisma: PrismaLike, settings: SellerSettings, now: Date): Promise<CommandContext> {
  const since = new Date(now.getTime() - COMMAND_LOOKBACK_DAYS * DAY_MS);
  const assignmentsByThread = new Map<string, AssignmentRef>();
  const assignmentsByMessageId = new Map<string, AssignmentRef>();
  const briefingsByThread = new Map<string, BriefingRef>();
  const rows: Array<{ kind: string; subject_id: string; payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({
    where: { kind: { in: [ASSIGNMENT_SENT, BRIEFING_SENT] }, created_at: { gte: since } },
    orderBy: [{ created_at: 'asc' }],
  });
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === ASSIGNMENT_SENT) {
      const ref: AssignmentRef = { itemKey: r.subject_id, itemToken: String(p.itemToken ?? ''), revision: Number(p.revision ?? 0), contentHash: String(p.contentHash ?? ''), day: String(p.day ?? '') };
      if (typeof p.gmailThreadId === 'string' && p.gmailThreadId) assignmentsByThread.set(p.gmailThreadId, ref);
      if (typeof p.rfcMessageId === 'string' && p.rfcMessageId) assignmentsByMessageId.set(p.rfcMessageId, ref);
    } else if (typeof p.gmailThreadId === 'string' && p.gmailThreadId) {
      briefingsByThread.set(p.gmailThreadId, { day: r.subject_id, dayToken: String(p.dayToken ?? '') });
    }
  }
  return { senders: settings.commandSenders, assignmentsByThread, assignmentsByMessageId, briefingsByThread };
}

export interface ApplyInput {
  m: MailboxMessage;
  ctx: CommandContext;
  now: Date;
  settings: SellerSettings;
  sender: GmailSender;
  baseUrl: string;
  actionSecret: string | null;
  actor: string;
}

export interface ApplyDeps extends AssignmentDeps {
  send: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
  /** X11: APPROVE on an assignment (the Gmail draft). Absent: refused not_yet_available. */
  onApprove?: (prisma: PrismaLike, input: ApplyInput & { item: PlanItem; ref: AssignmentRef }) => Promise<EffectOutcome>;
  /** X09: REVISE on an assignment (the agent task). Absent: refused not_yet_available. */
  onRevise?: (prisma: PrismaLike, input: ApplyInput & { item: PlanItem; ref: AssignmentRef; critique: string }) => Promise<EffectOutcome>;
}

/** What an effect handler answers: `ok: false` is a refusal in words (recorded refused, never applied; the seller is told). */
export interface EffectOutcome {
  text: string;
  effect: string;
  ok?: boolean;
  extra?: Record<string, unknown>;
}

/**
 * C44: the state every visible action ends in. `accepted` ran and is recorded; `queued` is handed to an agent (REVISE);
 * `prepared` made a draft and nothing left (APPROVE); `refused` ran nothing, with its reason; `failed` threw partway
 * (the originals stand, nothing is recorded as applied, the same command may be sent again); `unknown` is an effect
 * whose answer GAP could not read (nothing is recorded as applied either).
 */
export type ActionOutcome = 'accepted' | 'refused' | 'queued' | 'prepared' | 'failed' | 'unknown';

/** C44: the source item an action was about, as the answer names it. */
export interface ActionSource {
  key: string;
  accountName: string;
  title: string;
}

export type ApplyResult =
  | { applied: true; command: ParsedCommand['kind']; effect: string; itemKey?: string; until?: string; basis?: 'provider' | 'self_reported'; outcome: ActionOutcome; source: ActionSource | null; next: string }
  | { applied: false; command: ParsedCommand['kind']; reason: string; currentRevision?: number; outcome: ActionOutcome; source: ActionSource | null; next: string };

const NEXT_PATH: Record<string, string> = {
  assignment_sent: 'The item arrives as its own email; answer it there.',
  nothing_left: 'Open Work in GAP for what is waiting and parked.',
  help_sent: 'Reply with one of the commands on the first line.',
  commitment_skipped: 'Reply NEXT for the next item.',
  account_skipped: 'It returns tomorrow. Reply NEXT for the next item.',
  commitment_snoozed: 'It returns on that day. Reply NEXT for the next item.',
  account_snoozed: 'It returns on that day. Reply NEXT for the next item.',
  commitment_done: 'Reply NEXT for the next item.',
  account_logged: 'Reply NEXT for the next item.',
  progress_noted: 'The item stays open. Reply DONE: what happened when it has, or NEXT for the next item.',
  item_retired: 'Reply NEXT for the current item.',
  gmail_drafted: 'Send it from GAP (CONFIRM + SEND) or from Gmail; reply NEXT for the next item.',
  already_drafted: 'Send it from GAP (CONFIRM + SEND) or from Gmail; reply NEXT for the next item.',
  revision_queued: 'The revised email comes back as a new email on this item.',
  already_applied: 'Reply NEXT for the next item.',
  stale_revision: 'Answer the latest email for this item.',
  duplicate_message: 'Nothing to do: this exact message was already handled.',
  handler_failed: 'Nothing changed. Send the same command again, or open the item in GAP.',
  effect_unknown: 'Nothing is recorded as done. Open the item in GAP to see its state.',
  not_a_command: 'Reply with one of the commands on the first line.',
  needs_an_assignment: 'Reply to the email of the item you mean, or reply NEXT here.',
  item_not_found: 'Open Work in GAP.',
  when_not_understood: 'Say the date, for example DEFER Oct 14.',
  note_required: 'Say what happened after DONE:.',
  not_yet_available: 'Open the item in GAP to do it there.',
  help_rate_limited: 'The commands were sent within the hour; see that email.',
  no_briefing_address: 'Set the briefing address in Settings.',
};
const nextPath = (key: string, fallback = 'Open the item in GAP.') => NEXT_PATH[key] ?? fallback;
const outcomeOfEffect = (effect: string): ActionOutcome => (effect === 'gmail_drafted' || effect === 'already_drafted' ? 'prepared' : effect === 'revision_queued' || /queued/.test(effect) ? 'queued' : 'accepted');
const sourceOf = (item: PlanItem | null): ActionSource | null => (item ? { key: item.key, accountName: item.accountName, title: item.title } : null);

const reasonText: Record<string, string> = {
  already_applied: 'That was already done for this item; nothing changed. Reply NEXT for the next one.',
  stale_revision: 'This reply answers an older version of the item. Please answer the latest email for it (the newest subject carries the highest revision).',
  when_not_understood: 'Say the date to come back on, for example DEFER Oct 14, DEFER tomorrow or DEFER next Tuesday.',
  note_required: 'Say what happened, for example DONE: called Joey, he wants the comparison Friday. Your note is the record.',
  not_yet_available: 'That command is not available yet by email. Open the item in GAP to do it there.',
  item_not_found: 'GAP could not find the item this reply is about. Open Work in GAP.',
  needs_an_assignment: 'Reply to the email of the item you mean, or reply NEXT here to get the next one.',
  help_rate_limited: '',
};

async function answer(input: ApplyInput, deps: ApplyDeps, text: string): Promise<{ id: string | null }> {
  const subject = /^re:/i.test(input.m.subject ?? '') ? input.m.subject : `Re: ${input.m.subject ?? 'GAP'}`;
  const headers: Record<string, string> = { 'Auto-Submitted': 'auto-replied' };
  if (input.m.rfcMessageId) {
    headers['In-Reply-To'] = input.m.rfcMessageId;
    headers.References = input.m.rfcMessageId;
  }
  const res = await deps.send({ to: input.m.fromEmail, subject, text, html: `<div style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`, sender: input.sender, purpose: 'OPERATOR_ALERT', replyTo: input.sender.userEmail, threadId: input.m.threadId, headers });
  return { id: res.id };
}

async function recordApplied(prisma: PrismaLike, input: ApplyInput, subject: { type: string; id: string }, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind: COMMAND_APPLIED, actor: input.actor, subject_type: subject.type, subject_id: subject.id, payload: { gmailMessageId: input.m.id, from: input.m.fromEmail.toLowerCase(), at: input.now.toISOString(), ...payload } } });
}
async function recordRefused(prisma: PrismaLike, input: ApplyInput, subject: { type: string; id: string }, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind: COMMAND_REFUSED, actor: input.actor, subject_type: subject.type, subject_id: subject.id, payload: { gmailMessageId: input.m.id, from: input.m.fromEmail.toLowerCase(), at: input.now.toISOString(), ...payload } } });
}

async function refuse(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, subject: { type: string; id: string }, command: ParsedCommand['kind'], reason: string, extra: Record<string, unknown> = {}, source: ActionSource | null = null, text: string | undefined = reasonText[reason]): Promise<ApplyResult> {
  await recordRefused(prisma, input, subject, { command, reason, ...extra });
  if (text) await answer(input, deps, text);
  return { applied: false, command, reason, ...(typeof extra.currentRevision === 'number' ? { currentRevision: extra.currentRevision } : {}), outcome: 'refused', source, next: nextPath(reason) };
}

/** C43: the same provider message (one Gmail id) is applied at most once, whatever the overlap of cron runs. */
async function messageHandled(prisma: PrismaLike, gmailMessageId: string): Promise<boolean> {
  if (!gmailMessageId) return false;
  const rows: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent
    .findMany({ where: { kind: { in: [COMMAND_APPLIED, COMMAND_REFUSED] }, payload: { path: ['gmailMessageId'], equals: gmailMessageId } }, select: { payload: true } })
    .catch(() => []);
  if (rows.some((r) => (r.payload ?? {}).gmailMessageId === gmailMessageId)) return true;
  // The fixture and older Prisma versions: a scan of the command rows.
  const all: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: { in: [COMMAND_APPLIED, COMMAND_REFUSED] } }, select: { payload: true } }).catch(() => []);
  return all.some((r) => (r.payload ?? {}).gmailMessageId === gmailMessageId);
}

/**
 * C44: an effect that throws (an unknown handler, a CRM outage, a transition that broke) is recorded REFUSED with the
 * error, never applied, so the originals stand and the same command may be sent again; the seller is told in words.
 */
async function failed(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, subject: { type: string; id: string }, command: ParsedCommand['kind'], err: unknown, source: ActionSource | null): Promise<ApplyResult> {
  const message = (err instanceof Error ? err.message : String(err)).slice(0, 500);
  await recordRefused(prisma, input, subject, { command, reason: 'handler_failed', error: message }).catch(() => undefined);
  await answer(input, deps, `GAP could not carry out ${command.toUpperCase()}${source ? ` on ${source.accountName}: ${source.title}` : ''} (${message}). Nothing changed. Send the same command again, or open the item in GAP.`).catch(() => undefined);
  return { applied: false, command, reason: 'handler_failed', outcome: 'failed', source, next: nextPath('handler_failed') };
}

/** Whether `command` was applied on the item before. A progress note (DONE read as what the seller is doing) is never an applied DONE. */
async function appliedBefore(prisma: PrismaLike, itemKey: string, command: string): Promise<boolean> {
  const rows: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: COMMAND_APPLIED, subject_type: ITEM_SUBJECT_TYPE, subject_id: itemKey } });
  return rows.some((r) => (r.payload ?? {}).command === command && (r.payload ?? {}).effect !== 'progress_noted');
}

const timeNy = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

/** The item a reply is bound to, found in any revision of its day, and whether its key is off the NEWEST revision. */
async function boundItem(prisma: PrismaLike, ref: AssignmentRef): Promise<{ item: PlanItem; newest: DayPlan; retired: boolean } | null> {
  const revisions = await loadDayPlanRevisions(prisma, ref.day).catch(() => [] as DayPlan[]);
  const newest = revisions[0] ?? null;
  if (!newest) return null;
  for (const p of revisions) {
    const item = p.items.find((i) => i.token === ref.itemToken);
    if (item) return { item, newest, retired: !newest.items.some((i) => i.key === item.key) };
  }
  return null;
}

async function helpRecently(prisma: PrismaLike, subject: { type: string; id: string }, now: Date): Promise<boolean> {
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({ where: { kind: COMMAND_APPLIED, subject_type: subject.type, subject_id: subject.id } });
  return rows.some((r) => (r.payload ?? {}).effect === 'help_sent' && now.getTime() - new Date(String((r.payload ?? {}).at ?? r.created_at)).getTime() < HELP_INTERVAL_MS);
}

async function sendNext(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, day: string, subject: { type: string; id: string }, command: ParsedCommand['kind']): Promise<ApplyResult> {
  // The newest revision of the day; the walk skips what was assigned in any revision, what was settled, and what is
  // held for GAP research (recorded as it is found; the seller is told one line each).
  const plan = await loadDayPlan(prisma, day);
  const walk = plan ? await nextAssignableItem(prisma, plan, { assign: { input: { baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now }, deps, actor: input.actor } }) : { item: null, built: null, held: [] };
  const heldLines = walk.held.map((h) => `Held for GAP research: ${h.item.accountName} (${h.line}).`);
  const heldKeys = walk.held.map((h) => h.item.key);
  const item = walk.item;
  if (!plan || !item) {
    await recordApplied(prisma, input, subject, { command, effect: 'nothing_left', held: heldKeys });
    await answer(input, deps, ['Nothing left on today\'s list has gone unassigned. Open Work in GAP for what is waiting and parked.', ...heldLines].join('\n'));
    return { applied: true, command, effect: 'nothing_left', outcome: 'accepted', source: null, next: nextPath('nothing_left') };
  }
  if (!input.settings.briefingTo) return refuse(prisma, input, deps, subject, command, 'no_briefing_address');
  const r = await sendAssignment(prisma, { plan, item, revision: 0, to: input.settings.briefingTo, sender: input.sender, baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now, actor: input.actor, built: walk.built }, deps);
  await recordApplied(prisma, input, subject, { command, effect: 'assignment_sent', itemKey: item.key, sent: r.sent, held: heldKeys });
  if (heldLines.length) await answer(input, deps, [`Sent item ${item.rank + 1}, ${item.accountName}: ${item.title}, as its own email.`, ...heldLines].join('\n'));
  return { applied: true, command, effect: 'assignment_sent', itemKey: item.key, outcome: 'accepted', source: sourceOf(item), next: nextPath('assignment_sent') };
}

export async function applyCommand(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps): Promise<ApplyResult> {
  const v = input.ctx;
  const verdict = classify(input.m, v);
  if (!verdict) return { applied: false, command: 'unknown', reason: 'not_a_command', outcome: 'refused', source: null, next: nextPath('not_a_command') };
  const { command, auth } = verdict;
  // C43: a forged, forwarded, auto-submitted or unauthenticated message runs nothing and is answered nothing.
  if (!auth.ok) return { applied: false, command: command.kind, reason: auth.reason, outcome: 'refused', source: null, next: 'Reply from your own address, in the thread GAP sent.' };
  const target = auth.target;
  // C43: one provider message is one command. A second pass over the same Gmail id (two cron runs overlapping, a
  // retry after a lost answer) applies nothing and sends nothing.
  if (await messageHandled(prisma, input.m.id)) return { applied: false, command: command.kind, reason: 'duplicate_message', outcome: 'refused', source: null, next: nextPath('duplicate_message') };

  // The briefing thread: START, NEXT and HELP act on the day.
  if (target.kind === 'briefing') {
    const subject = { type: 'work_day', id: target.day };
    try {
      if (command.kind === 'start') {
        await startDay(prisma, { day: target.day, now: input.now, actor: input.m.fromEmail.toLowerCase(), via: 'email' });
        return await sendNext(prisma, input, deps, target.day, subject, 'start');
      }
      if (command.kind === 'next') return await sendNext(prisma, input, deps, target.day, subject, 'next');
      if (command.kind === 'help' || command.kind === 'unknown') return await help(prisma, input, deps, subject, command.kind);
      return await refuse(prisma, input, deps, subject, command.kind, 'needs_an_assignment');
    } catch (err) {
      return failed(prisma, input, deps, subject, command.kind, err, null);
    }
  }

  // An assignment thread: the item, its latest revision, and the once-only rule.
  const ref = target;
  const subject = { type: ITEM_SUBJECT_TYPE, id: ref.itemKey };
  const bound = await boundItem(prisma, ref);
  if (!bound) return refuse(prisma, input, deps, subject, command.kind, 'item_not_found');
  const { item, newest, retired } = bound;
  const source = sourceOf(item);
  const latest = Math.max(0, ...(await loadAssignments(prisma, ref.itemKey).catch(() => [])).map((a) => a.revision));
  if (ref.revision < latest) return refuse(prisma, input, deps, subject, command.kind, 'stale_revision', { currentRevision: latest, revision: ref.revision }, source);
  // An approval or a revision on an item the refreshed plan no longer holds never executes; SKIP, DEFER and DONE act on the object and still do.
  if (retired && (command.kind === 'approve' || command.kind === 'revise')) {
    return refuse(prisma, input, deps, subject, command.kind, 'item_retired', { revision: ref.revision, planRevision: newest.revision ?? 0, refreshedAt: newest.plannedAt }, source, `The plan was refreshed at ${timeNy(newest.plannedAt)} and this item is no longer on it. Reply NEXT for the current one.`);
  }

  try {
    switch (command.kind) {
      case 'help':
      case 'unknown':
        return await help(prisma, input, deps, subject, command.kind, source);
      case 'next':
        return await sendNext(prisma, input, deps, ref.day, subject, 'next');
      case 'skip':
      case 'defer':
      case 'done': {
        if (await appliedBefore(prisma, ref.itemKey, command.kind)) return await refuse(prisma, input, deps, subject, command.kind, 'already_applied', {}, source);
        return await act(prisma, input, deps, item, ref, command, subject);
      }
      case 'approve': {
        if (!deps.onApprove) return await refuse(prisma, input, deps, subject, 'approve', 'not_yet_available', {}, source);
        if (await appliedBefore(prisma, ref.itemKey, 'approve')) return await refuse(prisma, input, deps, subject, 'approve', 'already_applied', {}, source);
        const r = await deps.onApprove(prisma, { ...input, item, ref });
        if (!r || typeof r !== 'object' || typeof r.effect !== 'string') {
          // C44: an effect GAP cannot read is unknown: nothing is recorded as applied, the command is not consumed.
          await recordRefused(prisma, input, subject, { command: 'approve', revision: ref.revision, reason: 'effect_unknown' });
          return { applied: false, command: 'approve', reason: 'effect_unknown', outcome: 'unknown', source, next: nextPath('effect_unknown') };
        }
        if (r.ok === false) {
          // X12 demo finding: a refused approval (the revision not cleared, the mode, a gate) was recorded as applied and
          // blocked the next APPROVE on a later revision. A refusal is recorded refused and never consumes the command.
          await recordRefused(prisma, input, subject, { command: 'approve', revision: ref.revision, reason: r.effect, ...(r.extra ?? {}) });
          await answer(input, deps, r.text);
          return { applied: false, command: 'approve', reason: r.effect, outcome: 'refused', source, next: nextPath(r.effect) };
        }
        await recordApplied(prisma, input, subject, { command: 'approve', revision: ref.revision, effect: r.effect, ...(r.extra ?? {}) });
        await answer(input, deps, r.text);
        return { applied: true, command: 'approve', effect: r.effect, itemKey: ref.itemKey, outcome: outcomeOfEffect(r.effect), source, next: nextPath(r.effect) };
      }
      case 'revise': {
        if (!deps.onRevise) return await refuse(prisma, input, deps, subject, 'revise', 'not_yet_available', {}, source);
        const r = await deps.onRevise(prisma, { ...input, item, ref, critique: command.text });
        if (!r || typeof r !== 'object' || typeof r.effect !== 'string') {
          await recordRefused(prisma, input, subject, { command: 'revise', revision: ref.revision, reason: 'effect_unknown' });
          return { applied: false, command: 'revise', reason: 'effect_unknown', outcome: 'unknown', source, next: nextPath('effect_unknown') };
        }
        if (r.ok === false) {
          await recordRefused(prisma, input, subject, { command: 'revise', revision: ref.revision, reason: r.effect, ...(r.extra ?? {}) });
          await answer(input, deps, r.text);
          return { applied: false, command: 'revise', reason: r.effect, outcome: 'refused', source, next: nextPath(r.effect) };
        }
        await recordApplied(prisma, input, subject, { command: 'revise', revision: ref.revision, effect: r.effect, critique: command.text.slice(0, 2000), ...(r.extra ?? {}) });
        await answer(input, deps, r.text);
        return { applied: true, command: 'revise', effect: r.effect, itemKey: ref.itemKey, outcome: 'queued', source, next: nextPath('revision_queued') };
      }
      case 'start':
        return await refuse(prisma, input, deps, subject, 'start', 'needs_an_assignment', {}, source);
      default:
        return await refuse(prisma, input, deps, subject, 'unknown', 'not_a_command', {}, source);
    }
  } catch (err) {
    return failed(prisma, input, deps, subject, command.kind, err, source);
  }
}

/** Re-judge from the message (the cron hands the verdict it wrote; a direct caller hands the message): the same pure rules. */
function classify(m: MailboxMessage, ctx: CommandContext): Extract<MailboxVerdict, { kind: 'command' }> | null {
  if (!matchCommandTarget(m, ctx)) return null;
  return { kind: 'command', command: parseCommand(commandTextOf(m)), auth: authenticateCommand(m, ctx) };
}

async function help(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, subject: { type: string; id: string }, command: ParsedCommand['kind'], source: ActionSource | null = null): Promise<ApplyResult> {
  if (await helpRecently(prisma, subject, input.now)) {
    await recordRefused(prisma, input, subject, { command, reason: 'help_rate_limited' });
    return { applied: false, command, reason: 'help_rate_limited', outcome: 'refused', source, next: nextPath('help_rate_limited') };
  }
  await recordApplied(prisma, input, subject, { command, effect: 'help_sent' });
  await answer(input, deps, COMMANDS_HELP);
  return { applied: true, command, effect: 'help_sent', outcome: 'accepted', source, next: nextPath('help_sent') };
}

async function act(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, item: PlanItem, ref: AssignmentRef, command: Extract<ParsedCommand, { kind: 'skip' | 'defer' | 'done' }>, subject: { type: string; id: string }): Promise<ApplyResult> {
  const actor = input.m.fromEmail.toLowerCase();
  const commitmentId = item.refs.commitmentId ?? null;
  const commitment = commitmentId ? await loadCommitment(prisma, commitmentId) : null;
  const source = sourceOf(item);
  const ok = (effect: string, extra: Partial<Extract<ApplyResult, { applied: true }>> = {}): ApplyResult => ({ applied: true, command: command.kind, effect, itemKey: ref.itemKey, outcome: 'accepted', source, next: nextPath(effect), ...extra });

  if (command.kind === 'skip') {
    if (commitment) {
      const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'skipped', reason: command.reason ?? 'Skipped by email', actor, now: input.now });
      if (!t.ok) return refuse(prisma, input, deps, subject, 'skip', `commitment_${t.reason}`, {}, source);
      await recordApplied(prisma, input, subject, { command: 'skip', revision: ref.revision, effect: 'commitment_skipped', commitmentId: commitment.commitmentId, reason: command.reason });
      await answer(input, deps, `Skipped: ${item.title} at ${item.accountName}${command.reason ? ` (${command.reason})` : ''}. Reply NEXT for the next item.`);
      return ok('commitment_skipped');
    }
    const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'skipped', reason: command.reason ?? null, actor, now: input.now });
    if (!o.ok) return refuse(prisma, input, deps, subject, 'skip', `outcome_${o.reason}`, {}, source);
    await recordApplied(prisma, input, subject, { command: 'skip', revision: ref.revision, effect: 'account_skipped', reason: command.reason });
    await answer(input, deps, `Skipped for today: ${item.accountName}. It returns tomorrow. Reply NEXT for the next item.`);
    return ok('account_skipped');
  }

  if (command.kind === 'defer') {
    const parsed = parseDuePhrase(command.when ?? 'tomorrow', input.now);
    if (!parsed) return refuse(prisma, input, deps, subject, 'defer', 'when_not_understood', {}, source);
    const until = nyDayAt(parsed.day);
    if (commitment) {
      const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'snoozed', until, actor, now: input.now });
      if (!t.ok) return refuse(prisma, input, deps, subject, 'defer', `commitment_${t.reason}`, {}, source);
      await recordApplied(prisma, input, subject, { command: 'defer', revision: ref.revision, effect: 'commitment_snoozed', commitmentId: commitment.commitmentId, until: parsed.day });
      await answer(input, deps, `Deferred to ${parsed.day}: ${item.title} at ${item.accountName}. Reply NEXT for the next item.`);
      return ok('commitment_snoozed', { until: parsed.day });
    }
    const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'snoozed', until: until.toISOString(), reason: command.when ?? null, actor, now: input.now });
    if (!o.ok) return refuse(prisma, input, deps, subject, 'defer', `outcome_${o.reason}`, {}, source);
    await recordApplied(prisma, input, subject, { command: 'defer', revision: ref.revision, effect: 'account_snoozed', until: parsed.day });
    await answer(input, deps, `Deferred to ${parsed.day}: ${item.accountName}. Reply NEXT for the next item.`);
    return ok('account_snoozed', { until: parsed.day });
  }

  // done: the note is READ before it is recorded (work/done-note.ts). What happened completes; what the seller is doing
  // or will do is progress, recorded as such, and changes no commitment or outcome ("DONE: researching catalysts").
  const reading = readDoneNote(command.note);
  if (reading.kind === 'empty') return refuse(prisma, input, deps, subject, 'done', 'note_required', {}, source);
  if (reading.kind === 'progress') {
    await recordApplied(prisma, input, subject, { command: 'done', revision: ref.revision, effect: 'progress_noted', note: reading.note, cue: reading.cue, basis: 'self_reported', ...(commitment ? { commitmentId: commitment.commitmentId } : {}) });
    await answer(input, deps, progressLine(reading));
    return ok('progress_noted', { basis: 'self_reported' });
  }
  const note = reading.note;
  if (commitment) {
    const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'done', proof: { kind: 'seller', note }, actor, now: input.now });
    if (!t.ok) return refuse(prisma, input, deps, subject, 'done', `commitment_${t.reason}`, {}, source);
    await recordApplied(prisma, input, subject, { command: 'done', revision: ref.revision, effect: 'commitment_done', commitmentId: commitment.commitmentId, note, basis: 'self_reported' });
    await answer(input, deps, `Done, by your word: ${item.title} at ${item.accountName}. Recorded: "${note}". Reply NEXT for the next item.`);
    return ok('commitment_done', { basis: 'self_reported' });
  }
  const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'logged', reason: note.slice(0, 240), actor, now: input.now });
  if (!o.ok) return refuse(prisma, input, deps, subject, 'done', `outcome_${o.reason}`, {}, source);
  await recordApplied(prisma, input, subject, { command: 'done', revision: ref.revision, effect: 'account_logged', note, basis: 'self_reported' });
  await answer(input, deps, `Logged, by your word: ${item.accountName}. Recorded: "${note}". GAP counts what it can prove separately. Reply NEXT for the next item.`);
  return ok('account_logged', { basis: 'self_reported' });
}
