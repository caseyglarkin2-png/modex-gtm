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
 *   - knowledge program C3 (2026-10-09): a completion DONE becomes RECORDS. Its facts (work/done-note.ts doneNoteFacts)
 *     are read with the clock: a dated meeting writes ONE prepare_meeting commitment at the account through
 *     work/commitments.ts commitmentsFromSellerNote (waiting, due 8 am New York on the day, the seller's words as the
 *     basis, source `seller_note` with the Gmail message id; idempotent by the day); a sent note is recorded on the
 *     applied row as `claims: [{ kind: 'sent', who, when, channel }]` and the answer says GAP checks Sent for it. Nothing
 *     here sends or marks contact: a self-reported send is still self-reported (the activity view says so). The October
 *     9 Kenco note is the pin: "we have meeting scheduled for 10.14.2026. sent them a quick note today ..."
 *   - knowledge program C4: after an applied SKIP, DEFER or DONE on an assignment, GAP ADVANCES: the next assignable
 *     item of the newest plan revision goes out in the same tick (nextAssignableItem and sendAssignment, as START does),
 *     the applied row records `advancedTo: <key>` (or null with `advanceReason`: none_left, all_held, no_briefing_address,
 *     send_failed, no_plan), and the answer names it ("Next: PepsiCo, a prepared first touch, arriving as its own
 *     email."). A refused or progress-noted DONE never advances.
 *   - the Gmail action UI audit (GUI-09, 2026-10-10): ITEM n (also OPEN n, SEND ME n), on the briefing thread or on
 *     any assignment thread, sends item n of the day's NEWEST plan revision as its own email through sendAssignment,
 *     judged by `assignable` the way START is: a held item answers the hold's line (recorded held once, never sent);
 *     an item already sent answers "Already in your inbox: <subject>" and is not sent again; ITEM with no number, or a
 *     number off the plan, answers the numbered list with each item's standing. The applied row says what the provider
 *     confirmed (`receipt`: provider_confirmed with the Gmail id, or recorded_not_confirmed when Gmail returned none).
 */
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import type { MailboxMessage } from '@/lib/email/gmail-inbox';
import { ASSIGNMENT_SENT, ITEM_HELD_FOR_RESEARCH, ITEM_SUBJECT_TYPE, assignable, loadAssignments, nextAssignableItem, sendAssignment, startDay, type AssignmentDeps, type SendAssignmentResult } from '../work/assignment';
import { BRIEFING_SENT } from '../work/briefing-send';
import { commitmentsFromSellerNote, loadCommitment, transitionCommitment } from '../work/commitments';
import { dayLabel, nyDay, nyDayAt, parseDuePhrase } from '../work/dates';
import { progressLine, readDoneNote, type DoneFact } from '../work/done-note';
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

/**
 * GUI-09: every command with its exact effect, one line each. No line starts with a command word (a quoted help never
 * reads as a command), and the three safety facts are said: APPROVE approves for the send step in the app only, a link
 * never approves or sends, a reply to a GAP message never reaches a buyer.
 */
export const COMMANDS_HELP = [
  'Commands, on the first line of your reply: APPROVE, REVISE: your words, SKIP, DEFER Oct 14, DONE: what happened, NEXT, ITEM 6, HELP.',
  'Reply APPROVE to approve this item\'s email for the send step in the app only; nothing is sent until you press CONFIRM + SEND there.',
  'Reply REVISE: your words and GAP rewrites the email on your words and sends the revision back to you here; nothing goes to the buyer.',
  'Reply SKIP to set this item aside for today; it returns tomorrow.',
  'Reply DEFER Oct 14 to bring this item back on that day.',
  'Reply DONE: what happened to record your words as this item\'s record; GAP sends nothing.',
  'Reply NEXT and the next item on today\'s plan arrives as its own email.',
  'Reply ITEM 6 (or OPEN 6, SEND ME 6) and item 6 of today\'s plan arrives as its own email; ITEM alone lists the items with their numbers.',
  'Reply START on the briefing to start the day; item 1 arrives as its own email.',
  'Reply HELP for this list.',
  'Opening a link in a GAP email never approves or sends anything. A reply to a GAP message reaches GAP only, never a buyer. Anything longer than a sentence is read as a revision request.',
].join('\n');

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
  | { applied: true; command: ParsedCommand['kind']; effect: string; itemKey?: string; until?: string; basis?: 'provider' | 'self_reported'; outcome: ActionOutcome; source: ActionSource | null; next: string; /** C4: the item key sent next in the same tick, or null (the applied row says why). */ advancedTo?: string | null }
  | { applied: false; command: ParsedCommand['kind']; reason: string; currentRevision?: number; outcome: ActionOutcome; source: ActionSource | null; next: string };

const NEXT_PATH: Record<string, string> = {
  assignment_sent: 'The item arrives as its own email; answer it there.',
  nothing_left: 'Open Work in GAP for what is waiting and parked.',
  advanced: 'The next item arrives as its own email; answer it there.',
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
  item_list_sent: 'Reply ITEM and the number, and that item arrives as its own email.',
  already_in_inbox: 'Answer that item in its own email; reply ITEM and another number for a different one.',
  item_held: 'GAP is researching it. Reply ITEM and another number, or NEXT.',
  no_plan: 'Open Work in GAP; no plan is recorded for that day.',
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
  stale_day: 'That briefing is from an earlier day; its plan is not today\'s. Reply START on today\'s briefing, or open Work in GAP.',
};

/** The adversarial audit of October 10: START on Friday's briefing walked Friday's plan on Saturday. A briefing of a past New York day is stale. */
export const isStaleBriefingDay = (day: string, now: Date): boolean => /^\d{4}-\d{2}-\d{2}$/.test(day) && day < nyDay(now);
export const staleDayText = (day: string, now: Date, baseUrl: string): string => `That briefing is from ${monthDayOf(day)}; its plan is not today's (${monthDayOf(nyDay(now))}). Reply START on today's briefing when it arrives, or open Work: ${baseUrl.replace(/\/$/, '')}/gap/`;
const monthDayOf = (day: string) => nyDayAt(day, 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

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
  await recordApplied(prisma, input, subject, { command, effect: 'assignment_sent', itemKey: item.key, sent: r.sent, ...receiptOf(r), held: heldKeys });
  if (heldLines.length) await answer(input, deps, [`Sent item ${item.rank + 1}, ${item.accountName}: ${item.title}, as its own email ${receiptWords(r)}.`, ...heldLines].join('\n'));
  return { applied: true, command, effect: 'assignment_sent', itemKey: item.key, outcome: 'accepted', source: sourceOf(item), next: nextPath('assignment_sent') };
}

/**
 * GUI-10: what the provider confirmed about an assignment send, on the applied row: Gmail's message id when it
 * answered one (`provider_confirmed`), else `recorded_not_confirmed` (GAP recorded the send; Gmail returned no id).
 */
function receiptOf(r: SendAssignmentResult): { receipt: 'provider_confirmed' | 'recorded_not_confirmed' | 'not_sent'; gmailMessageId: string | null } {
  if (!r.sent) return { receipt: 'not_sent', gmailMessageId: null };
  return r.gmailMessageId ? { receipt: 'provider_confirmed', gmailMessageId: r.gmailMessageId } : { receipt: 'recorded_not_confirmed', gmailMessageId: null };
}
/** The same receipt in the seller's words: "(Gmail message gm-7)" or "(recorded, not confirmed by Gmail)". */
function receiptWords(r: SendAssignmentResult): string {
  if (!r.sent) return '(not sent: it was already in your inbox)';
  return r.gmailMessageId ? `(Gmail message ${r.gmailMessageId})` : '(recorded, not confirmed by Gmail)';
}

/** GUI-09: each plan item's standing for the list: in your inbox, held, settled, or not sent yet. */
async function itemStandings(prisma: PrismaLike, plan: DayPlan): Promise<Map<string, { standing: 'in_inbox' | 'held' | 'settled' | 'unsent'; subject: string | null }>> {
  const keys = plan.items.map((i) => i.key);
  const out = new Map<string, { standing: 'in_inbox' | 'held' | 'settled' | 'unsent'; subject: string | null }>();
  for (const k of keys) out.set(k, { standing: 'unsent', subject: null });
  if (!keys.length) return out;
  const applied: Array<{ subject_id: string; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: COMMAND_APPLIED, subject_type: ITEM_SUBJECT_TYPE, subject_id: { in: keys } }, select: { subject_id: true, payload: true } });
  for (const r of applied) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (['skip', 'defer', 'done'].includes(String(p.command ?? '')) && p.effect !== 'progress_noted') out.set(r.subject_id, { standing: 'settled', subject: null });
    else if (p.effect === ITEM_HELD_FOR_RESEARCH && out.get(r.subject_id)?.standing === 'unsent') out.set(r.subject_id, { standing: 'held', subject: null });
  }
  const sent: Array<{ subject_id: string; payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({ where: { kind: ASSIGNMENT_SENT, subject_type: ITEM_SUBJECT_TYPE, subject_id: { in: keys } }, orderBy: [{ created_at: 'asc' }] });
  for (const r of sent) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    if (out.get(r.subject_id)?.standing === 'settled') continue;
    out.set(r.subject_id, { standing: 'in_inbox', subject: typeof p.subject === 'string' ? p.subject : null });
  }
  return out;
}

const STANDING_WORDS = { in_inbox: 'in your inbox', held: 'held for GAP research', settled: 'settled today', unsent: 'not sent yet' } as const;

/**
 * GUI-09: ITEM n. Sends item n of the day's newest plan revision as its own email, judged by `assignable` the way START
 * judges the next item; a held item answers the hold's line; an item already in the inbox answers its subject and is
 * not sent again; no number, or a number off the plan, answers the numbered list with each item's standing.
 */
async function sendItem(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, day: string, subject: { type: string; id: string }, n: number | null): Promise<ApplyResult> {
  const plan = await loadDayPlan(prisma, day);
  if (!plan) return refuse(prisma, input, deps, subject, 'item', 'no_plan', {}, null, `No plan is recorded for ${day}. Open Work in GAP.`);
  const standings = await itemStandings(prisma, plan);
  const list = () => plan.items.map((it) => `${it.rank + 1}. ${it.accountName}: ${it.title} (${STANDING_WORDS[standings.get(it.key)?.standing ?? 'unsent']})`);
  if (n === null || n < 1 || n > plan.items.length) {
    const head = n === null ? `Today's ${plan.items.length === 1 ? 'item' : 'items'}, by number (reply ITEM and the number for one as its own email):` : `There is no item ${n}; today's plan has ${plan.items.length} ${plan.items.length === 1 ? 'item' : 'items'}:`;
    await recordApplied(prisma, input, subject, { command: 'item', effect: 'item_list_sent', requested: n, items: plan.items.length });
    await answer(input, deps, [head, ...list(), ...(plan.items.length ? [] : ['Nothing is on the plan. Open Work in GAP.'])].join('\n'));
    return { applied: true, command: 'item', effect: 'item_list_sent', outcome: 'accepted', source: null, next: nextPath('item_list_sent') };
  }
  const item = plan.items[n - 1];
  const source = sourceOf(item);
  const standing = standings.get(item.key);
  if (standing?.standing === 'in_inbox') {
    await recordApplied(prisma, input, subject, { command: 'item', effect: 'already_in_inbox', itemKey: item.key, requested: n, subject: standing.subject });
    await answer(input, deps, `Already in your inbox: ${standing.subject ?? `item ${n}, ${item.accountName}: ${item.title}`}. Nothing was sent again; answer it there.`);
    return { applied: true, command: 'item', effect: 'already_in_inbox', itemKey: item.key, outcome: 'accepted', source, next: nextPath('already_in_inbox') };
  }
  if (standing?.standing === 'settled') {
    return refuse(prisma, input, deps, subject, 'item', 'item_settled', { itemKey: item.key, requested: n }, source, `Item ${n}, ${item.accountName}: ${item.title}, was settled today (skipped, deferred or done) and is not sent again. Open it in GAP to reopen it.`);
  }
  if (!input.settings.briefingTo) return refuse(prisma, input, deps, subject, 'item', 'no_briefing_address', { itemKey: item.key, requested: n }, source);
  const assignInput = { baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now };
  const a = await assignable(prisma, plan, item, assignInput, deps);
  if (!a.ok) {
    // Held the way the START walk holds it (one row per item; a hold found already is not written again).
    if (standing?.standing !== 'held') {
      await prisma.gapAuditEvent.create({ data: { kind: COMMAND_APPLIED, actor: input.actor, subject_type: ITEM_SUBJECT_TYPE, subject_id: item.key, payload: { effect: ITEM_HELD_FOR_RESEARCH, reason: a.reason, detail: a.detail.slice(0, 500), day: plan.day, itemToken: item.token, revision: plan.revision ?? 0, at: input.now.toISOString() } } });
    }
    const line = a.reason === 'recipient_mismatch' ? 'the prepared email is addressed to a different person than the item names; choose on the account' : 'nothing supported to send yet';
    await recordApplied(prisma, input, subject, { command: 'item', effect: 'item_held', itemKey: item.key, requested: n, reason: a.reason });
    await answer(input, deps, `Held for GAP research: item ${n}, ${item.accountName}: ${item.title} (${line}). It is not sent as an assignment.`);
    return { applied: true, command: 'item', effect: 'item_held', itemKey: item.key, outcome: 'accepted', source, next: nextPath('item_held') };
  }
  const r = await sendAssignment(prisma, { plan, item, revision: 0, to: input.settings.briefingTo, sender: input.sender, baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now, actor: input.actor, built: a.built }, deps);
  if (!r.sent) {
    await recordApplied(prisma, input, subject, { command: 'item', effect: 'already_in_inbox', itemKey: item.key, requested: n, subject: a.built.subject });
    await answer(input, deps, `Already in your inbox: ${a.built.subject}. Nothing was sent again; answer it there.`);
    return { applied: true, command: 'item', effect: 'already_in_inbox', itemKey: item.key, outcome: 'accepted', source, next: nextPath('already_in_inbox') };
  }
  await recordApplied(prisma, input, subject, { command: 'item', effect: 'assignment_sent', itemKey: item.key, requested: n, sent: true, ...receiptOf(r) });
  return { applied: true, command: 'item', effect: 'assignment_sent', itemKey: item.key, outcome: 'accepted', source, next: nextPath('assignment_sent') };
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
      if ((command.kind === 'start' || command.kind === 'next' || command.kind === 'item') && isStaleBriefingDay(target.day, input.now)) {
        return await refuse(prisma, input, deps, subject, command.kind, 'stale_day', { day: target.day, today: nyDay(input.now) }, null, staleDayText(target.day, input.now, input.baseUrl));
      }
      if (command.kind === 'start') {
        await startDay(prisma, { day: target.day, now: input.now, actor: input.m.fromEmail.toLowerCase(), via: 'email' });
        return await sendNext(prisma, input, deps, target.day, subject, 'start');
      }
      if (command.kind === 'next') return await sendNext(prisma, input, deps, target.day, subject, 'next');
      // GUI-09: a direct pick of item n, from the briefing.
      if (command.kind === 'item') return await sendItem(prisma, input, deps, target.day, subject, command.n);
      if (command.kind === 'help' || command.kind === 'unknown') return await help(prisma, input, deps, subject, command.kind);
      return await refuse(prisma, input, deps, subject, command.kind, 'needs_an_assignment');
    } catch (err) {
      return failed(prisma, input, deps, subject, command.kind, err, null);
    }
  }

  // An assignment thread: the item, its latest revision, and the once-only rule.
  const ref = target;
  const subject = { type: ITEM_SUBJECT_TYPE, id: ref.itemKey };
  // GUI-09: a direct pick of item n from any assignment thread is about the DAY, not this item: it is judged on the
  // newest plan revision and recorded on the day, whatever revision this thread carries.
  if (command.kind === 'item') {
    try {
      return await sendItem(prisma, input, deps, ref.day, { type: 'work_day', id: ref.day }, command.n);
    } catch (err) {
      return failed(prisma, input, deps, { type: 'work_day', id: ref.day }, 'item', err, null);
    }
  }
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

/** C4: what the advance after an applied SKIP, DEFER or DONE came to. */
interface Advance {
  key: string | null;
  reason: 'none_left' | 'all_held' | 'no_briefing_address' | 'send_failed' | 'no_plan' | null;
  /** The seller line: "Next: PepsiCo, a prepared first touch, arriving as its own email." or why nothing followed, with the held items. */
  line: string;
  held: string[];
}

const NONE_LEFT_LINE = 'Nothing left on today\'s list has gone unassigned. Open Work in GAP for what is waiting and parked.';

/** The next item in words: what is prepared for it, else its own title. */
function nextItemWords(item: PlanItem, built: { prepared: { kind: string; who?: string | null } } | null): string {
  const prepared = built?.prepared;
  if (prepared?.kind === 'email') return item.kind === 'ready' ? 'a prepared first touch' : 'a prepared email';
  if (prepared?.kind === 'angle') return `an angle prepared for ${prepared.who ?? 'them'}`;
  return item.title;
}

/**
 * C4: send the next assignable item of the day's newest plan revision, the way START and NEXT do (the walk records an
 * item held for research as it is found). Never throws: a failure is `send_failed` with the error in the line.
 */
async function advanceAfter(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, day: string): Promise<Advance> {
  try {
    const plan = await loadDayPlan(prisma, day);
    if (!plan) return { key: null, reason: 'no_plan', line: NONE_LEFT_LINE, held: [] };
    const walk = await nextAssignableItem(prisma, plan, { assign: { input: { baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now }, deps, actor: input.actor } });
    const heldLines = walk.held.map((h) => `Held for GAP research: ${h.item.accountName} (${h.line}).`);
    const held = walk.held.map((h) => h.item.key);
    if (!walk.item) return { key: null, reason: held.length ? 'all_held' : 'none_left', line: [NONE_LEFT_LINE, ...heldLines].join('\n'), held };
    if (!input.settings.briefingTo) return { key: null, reason: 'no_briefing_address', line: 'The next item waits: set the briefing address in Settings.', held };
    const item = walk.item;
    try {
      await sendAssignment(prisma, { plan, item, revision: 0, to: input.settings.briefingTo, sender: input.sender, baseUrl: input.baseUrl, actionSecret: input.actionSecret, commandsEnabled: true, now: input.now, actor: input.actor, built: walk.built }, deps);
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 300);
      return { key: null, reason: 'send_failed', line: `GAP could not send the next item (${item.accountName}: ${message}). Reply NEXT to try again.`, held };
    }
    return { key: item.key, reason: null, line: [`Next: ${item.accountName}, ${nextItemWords(item, walk.built)}, arriving as its own email.`, ...heldLines].join('\n'), held };
  } catch (err) {
    const message = (err instanceof Error ? err.message : String(err)).slice(0, 300);
    return { key: null, reason: 'send_failed', line: `GAP could not pick the next item (${message}). Reply NEXT to try again.`, held: [] };
  }
}

const monthDay = (day: string) => nyDayAt(day, 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const CHANNEL_NOUN = { email: 'note', call: 'call', message: 'message' } as const;

/** C3: "Recorded: a meeting Oct 14 (to prepare), and your note to them today (GAP checks Sent for it)". */
function factsLine(meetings: ReadonlyArray<{ day: string }>, claims: ReadonlyArray<{ who: string | null; when: string; channel: 'email' | 'call' | 'message' }>, now: Date): string | null {
  const parts = [
    ...meetings.map((m) => `a meeting ${monthDay(m.day)} (to prepare)`),
    ...claims.map((c) => `your ${CHANNEL_NOUN[c.channel]} to ${c.who ?? 'them'} ${dayLabel(c.when, now)} (${c.channel === 'email' ? 'GAP checks Sent for it' : 'your word'})`),
  ];
  if (!parts.length) return null;
  const list = parts.length === 1 ? parts[0] : parts.length === 2 ? `${parts[0]}, and ${parts[1]}` : `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  return `Recorded: ${list}.`;
}

async function act(prisma: PrismaLike, input: ApplyInput, deps: ApplyDeps, item: PlanItem, ref: AssignmentRef, command: Extract<ParsedCommand, { kind: 'skip' | 'defer' | 'done' }>, subject: { type: string; id: string }): Promise<ApplyResult> {
  const actor = input.m.fromEmail.toLowerCase();
  const commitmentId = item.refs.commitmentId ?? null;
  const commitment = commitmentId ? await loadCommitment(prisma, commitmentId) : null;
  const source = sourceOf(item);
  // C4: every applied SKIP, DEFER and DONE records what ran, advances to the next item, and answers in one message.
  const finish = async (effect: string, payload: Record<string, unknown>, body: string, extra: Partial<Extract<ApplyResult, { applied: true }>> = {}): Promise<ApplyResult> => {
    const adv = await advanceAfter(prisma, input, deps, ref.day);
    await recordApplied(prisma, input, subject, { command: command.kind, revision: ref.revision, effect, ...payload, advancedTo: adv.key, ...(adv.key ? {} : { advanceReason: adv.reason }), ...(adv.held.length ? { held: adv.held } : {}) });
    await answer(input, deps, `${body} ${adv.line}`);
    return { applied: true, command: command.kind, effect, itemKey: ref.itemKey, outcome: 'accepted', source, next: adv.key ? nextPath('advanced') : nextPath(effect), advancedTo: adv.key, ...extra };
  };

  if (command.kind === 'skip') {
    if (commitment) {
      const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'skipped', reason: command.reason ?? 'Skipped by email', actor, now: input.now });
      if (!t.ok) return refuse(prisma, input, deps, subject, 'skip', `commitment_${t.reason}`, {}, source);
      return finish('commitment_skipped', { commitmentId: commitment.commitmentId, reason: command.reason }, `Skipped: ${item.title} at ${item.accountName}${command.reason ? ` (${command.reason})` : ''}.`);
    }
    const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'skipped', reason: command.reason ?? null, actor, now: input.now });
    if (!o.ok) return refuse(prisma, input, deps, subject, 'skip', `outcome_${o.reason}`, {}, source);
    return finish('account_skipped', { reason: command.reason }, `Skipped for today: ${item.accountName}. It returns tomorrow.`);
  }

  if (command.kind === 'defer') {
    const parsed = parseDuePhrase(command.when ?? 'tomorrow', input.now);
    if (!parsed) return refuse(prisma, input, deps, subject, 'defer', 'when_not_understood', {}, source);
    const until = nyDayAt(parsed.day);
    if (commitment) {
      const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'snoozed', until, actor, now: input.now });
      if (!t.ok) return refuse(prisma, input, deps, subject, 'defer', `commitment_${t.reason}`, {}, source);
      return finish('commitment_snoozed', { commitmentId: commitment.commitmentId, until: parsed.day }, `Deferred to ${parsed.day}: ${item.title} at ${item.accountName}.`, { until: parsed.day });
    }
    const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'snoozed', until: until.toISOString(), reason: command.when ?? null, actor, now: input.now });
    if (!o.ok) return refuse(prisma, input, deps, subject, 'defer', `outcome_${o.reason}`, {}, source);
    return finish('account_snoozed', { until: parsed.day }, `Deferred to ${parsed.day}: ${item.accountName}.`, { until: parsed.day });
  }

  // done: the note is READ before it is recorded (work/done-note.ts). What happened completes; what the seller is doing
  // or will do is progress, recorded as such, and changes no commitment or outcome ("DONE: researching catalysts").
  const reading = readDoneNote(command.note, { now: input.now });
  if (reading.kind === 'empty') return refuse(prisma, input, deps, subject, 'done', 'note_required', {}, source);
  if (reading.kind === 'progress') {
    await recordApplied(prisma, input, subject, { command: 'done', revision: ref.revision, effect: 'progress_noted', note: reading.note, cue: reading.cue, basis: 'self_reported', ...(commitment ? { commitmentId: commitment.commitmentId } : {}) });
    await answer(input, deps, progressLine(reading));
    return { applied: true, command: 'done', effect: 'progress_noted', itemKey: ref.itemKey, outcome: 'accepted', source, next: nextPath('progress_noted'), basis: 'self_reported' };
  }
  const note = reading.note;
  // C3: the facts the note states become records: a meeting to prepare (one per day, through the commitment writer),
  // a sent note as a claim on this row. A failure to write the meeting never fails the DONE (the words are recorded).
  const facts: DoneFact[] = reading.facts ?? [];
  const claims = facts.filter((f): f is Extract<DoneFact, { kind: 'sent' }> => f.kind === 'sent').map((f) => ({ kind: 'sent' as const, who: f.who, when: f.when, channel: f.channel, words: f.words }));
  const person = commitment?.person ?? (item.person ? { personaId: null, name: item.person.name, email: null } : null);
  const meetings = facts.some((f) => f.kind === 'meeting')
    ? (await commitmentsFromSellerNote(prisma, { accountName: item.accountName, facts, note, gmailMessageId: input.m.id, person, dealId: commitment?.dealId ?? null, actor, now: input.now }).catch(() => ({ meetings: [] }))).meetings
    : [];
  const recorded = factsLine(meetings, claims, input.now);
  const factsPayload = { ...(claims.length ? { claims } : {}), ...(meetings.length ? { meetings } : {}) };
  if (commitment) {
    const t = await transitionCommitment(prisma, { commitmentId: commitment.commitmentId, to: 'done', proof: { kind: 'seller', note }, actor, now: input.now });
    if (!t.ok) return refuse(prisma, input, deps, subject, 'done', `commitment_${t.reason}`, {}, source);
    return finish('commitment_done', { commitmentId: commitment.commitmentId, note, basis: 'self_reported', ...factsPayload }, `Done, by your word: ${item.title} at ${item.accountName}. ${recorded ?? `Recorded: "${note}".`}`, { basis: 'self_reported' });
  }
  const o = await recordWorkOutcome(prisma, { accountName: item.accountName, kind: 'logged', reason: note.slice(0, 240), actor, now: input.now });
  if (!o.ok) return refuse(prisma, input, deps, subject, 'done', `outcome_${o.reason}`, {}, source);
  return finish('account_logged', { note, basis: 'self_reported', ...factsPayload }, `Logged, by your word: ${item.accountName}. ${recorded ?? `Recorded: "${note}".`} GAP counts what it can prove separately.`, { basis: 'self_reported' });
}
