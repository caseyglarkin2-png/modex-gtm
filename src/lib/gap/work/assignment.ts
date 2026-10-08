/**
 * START AND THE ASSIGNMENT (X06, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * START (`work.day_started`, once per New York day) is the seller beginning the day, from the briefing's link or by
 * reply. An ASSIGNMENT is one email per plan item (work/plan.ts): the account and the person, why now, what we know
 * (the account's Ask context: the one composition Work, Ask and the page share, ask/context.ts), the move, and, for a
 * first touch, the action pack's rendered copy quoted line by line with its sources. It is recorded as
 * `work.assignment_sent` (subject `work_item` / the item key) with the Gmail thread id, the RFC message id when Gmail
 * returns one, the item token, the revision and the content hash: what a reply's APPROVE is bound to (X07, X11).
 *
 * Rules (pinned by tests/unit/gap/assignment.test.ts):
 *   - the subject carries `[GAP#<item token>.<revision>]`, which a reply keeps
 *   - the prepared email is QUOTED (`> `) line by line and no line of the body starts with a command word, so a
 *     reply that quotes the assignment never reads as a command
 *   - the content hash is the pack's for a first touch (the same hash the draft and the send bind), else the body's
 *   - one send per (item, revision); a resend is explicit; the next unassigned item is the first with no assignment
 *   - the mail is an internal OPERATOR_ALERT from the GAP identity with Reply-To the GAP mailbox and Auto-Submitted
 */
import { createHash } from 'node:crypto';
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import { buildAskContext } from '../ask/context';
import type { AskContext } from '../ask/grounding';
import { loadActionPack } from '../execution/action-pack';
import { signActionToken } from './action-token';
import { COMMAND_WORDS } from './briefing';
import type { DayPlan, PlanItem } from './plan';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DAY_STARTED = 'work.day_started' as const;
export const ASSIGNMENT_SENT = 'work.assignment_sent' as const;
export const ITEM_SUBJECT_TYPE = 'work_item' as const;

export interface PreparedEmail {
  kind: 'email';
  to: string | null;
  subject: string;
  body: string;
}
export type Prepared = PreparedEmail | { kind: 'none' };

export interface BuiltAssignment {
  subject: string;
  text: string;
  html: string;
  contentHash: string;
  prepared: Prepared;
}

export interface AssignmentDeps {
  askContext?: (prisma: PrismaLike, accountName: string, now: Date) => Promise<AskContext | null>;
  pack?: (prisma: PrismaLike, args: { decisionId: string }) => Promise<PackLike | null>;
  send?: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
}

/** The slice of the action pack the assignment reads. */
export interface PackLike {
  rendered: { queued: { subject: string; body: string } } | null;
  contentHash: string | null;
  emailReady?: boolean;
  persona?: { email?: string | null } | null;
  hypothesis?: { signals?: Array<{ signal?: { title?: string | null; evidence_url?: string | null; observed_at?: Date | string | null } | null }> } | null;
}

export interface BuildAssignmentInput {
  plan: DayPlan;
  item: PlanItem;
  revision: number;
  baseUrl: string;
  actionSecret: string | null;
  commandsEnabled: boolean;
  now: Date;
  /** X09: a PROPOSED copy revision shown in place of the pack's copy (its queued text and hash), never approved here. */
  copyOverride?: { subject: string; body: string; to: string | null; contentHash: string } | null;
  /** X09: one line above the copy saying what this revision answers ("Revised on your words: ..."). */
  note?: string | null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const endSentence = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
const COMMAND_LINE = new RegExp(`^(${COMMAND_WORDS.join('|')})\\b`, 'i');
/** A body line must never start with a command word; one that would is led with a dash. */
const safeLine = (s: string) => (COMMAND_LINE.test(s) ? `- ${s}` : s);
const dateLabel = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }) : null);

export const assignmentTag = (itemToken: string, revision: number) => `[GAP#${itemToken}.${revision}]`;

function itemLink(input: BuildAssignmentInput): string {
  const base = input.baseUrl.replace(/\/$/, '');
  if (!input.actionSecret) return `${base}${input.item.href}`;
  const t = signActionToken({ op: 'open', item: input.item.token, day: input.plan.day }, { secret: input.actionSecret, now: input.now });
  return `${base}/gap/item?t=${encodeURIComponent(t)}`;
}

/** The action pack of a routing card: its hypothesis is read off the card (the pack page's own rule). */
async function packForDecision(prisma: PrismaLike, args: { decisionId: string }): Promise<PackLike | null> {
  const d = await prisma.routingDecision.findUnique({ where: { id: args.decisionId }, select: { hypothesis_id: true } });
  if (!d?.hypothesis_id) return null;
  return loadActionPack(prisma, { hypothesisId: d.hypothesis_id, decisionId: args.decisionId });
}

export async function buildAssignment(prisma: PrismaLike, input: BuildAssignmentInput, deps: AssignmentDeps = {}): Promise<BuiltAssignment> {
  const { item, plan } = input;
  const ctx = await (deps.askContext ?? buildAskContext)(prisma, item.accountName, input.now).catch(() => null);
  const pack = item.refs.decisionId ? await (deps.pack ?? packForDecision)(prisma, { decisionId: item.refs.decisionId }).catch(() => null) : null;

  const n = item.rank + 1;
  const subject = `GAP ${n} of ${plan.items.length}, ${item.accountName}: ${item.title} ${assignmentTag(item.token, input.revision)}`;
  const who = item.person?.name ? (item.person.title ? `${item.person.name} (${item.person.title})` : item.person.name) : null;

  const lines: string[] = [];
  lines.push(`${item.accountName}${who ? `: ${who}` : ''}.`);
  lines.push(`Why now: ${[endSentence(item.why), ctx?.state.stateLine ? endSentence(ctx.state.stateLine) : null].filter(Boolean).join(' ')}`);
  const known = (ctx?.story ?? []).flatMap((s) => s.lines).slice(0, 6);
  if (known.length) {
    lines.push('', 'What we know:');
    for (const l of known) lines.push(safeLine(`- ${endSentence(l.text)}${l.basis ? ` (${l.basis})` : ''}`));
  }
  if (ctx?.opening?.whyTheyCare) lines.push(safeLine(`Why they care: ${endSentence(ctx.opening.whyTheyCare)}`));
  for (const b of (ctx?.buyerSaid ?? []).slice(0, 3)) lines.push(safeLine(`They said: "${b.text}"${b.who || b.at ? ` (${[b.who, b.at].filter(Boolean).join(', ')})` : ''}`));
  lines.push('', `The move: ${endSentence(ctx?.state.next || item.title)}`);

  let prepared: Prepared = { kind: 'none' };
  // X09: a proposed revision (never approved here) is shown in place of the pack's copy, with the line that says why.
  const copy = input.copyOverride
    ? { subject: input.copyOverride.subject, body: input.copyOverride.body, to: input.copyOverride.to ?? pack?.persona?.email ?? null }
    : pack?.rendered?.queued
      ? { subject: pack.rendered.queued.subject, body: pack.rendered.queued.body, to: pack.persona?.email ?? null }
      : null;
  if (input.note) lines.push('', input.note);
  if (copy) {
    const to = copy.to;
    prepared = { kind: 'email', to, subject: copy.subject, body: copy.body };
    lines.push('', `The email${to ? `, to ${to}` : ''}, subject "${copy.subject}":`);
    for (const l of copy.body.split('\n')) lines.push(`> ${l}`);
    const sources = (pack?.hypothesis?.signals ?? []).map((s) => s.signal).filter((s): s is NonNullable<typeof s> => !!s && !!s.title);
    if (sources.length) lines.push(`Sources: ${sources.map((s) => `${s.title}${dateLabel(s.observed_at) ? ` (${dateLabel(s.observed_at)})` : ''}${s.evidence_url ? ` ${s.evidence_url}` : ''}`).join('; ')}`);
  }
  lines.push('', `Open it in GAP: ${itemLink(input)}`);
  if (input.commandsEnabled) {
    lines.push('', 'To act from here, put one of these on the first line of your reply: APPROVE, REVISE: your words, SKIP, DEFER, DONE: what happened, NEXT, HELP.');
  }
  lines.push('', 'This is an internal message from GAP to you; nothing in it went to a buyer.');
  const text = lines.map(safeLine).join('\n');
  const contentHash = input.copyOverride?.contentHash ?? pack?.contentHash ?? createHash('sha256').update(text).digest('hex');
  const html = `<div style="font-family:system-ui,sans-serif;line-height:1.45;white-space:pre-wrap">${esc(text)}</div>`;
  return { subject, text, html, contentHash, prepared };
}

/** START, once per day. `started: false` when the day was already started (the earlier row stands). */
export async function startDay(prisma: PrismaLike, input: { day: string; now: Date; actor: string; via: 'link' | 'email' | 'app' }): Promise<{ started: boolean; at: string }> {
  const existing = await prisma.gapAuditEvent.findFirst({ where: { kind: DAY_STARTED, subject_type: 'work_day', subject_id: input.day }, orderBy: [{ created_at: 'asc' }] });
  if (existing) return { started: false, at: new Date(existing.created_at).toISOString() };
  await prisma.gapAuditEvent.create({ data: { kind: DAY_STARTED, actor: input.actor, subject_type: 'work_day', subject_id: input.day, payload: { via: input.via, at: input.now.toISOString() } } });
  return { started: true, at: input.now.toISOString() };
}

export interface SendAssignmentInput extends BuildAssignmentInput {
  to: string;
  sender: GmailSender;
  actor: string;
  resend?: boolean;
}

export type SendAssignmentResult =
  | { sent: true; gmailMessageId: string | null; gmailThreadId: string | null; contentHash: string; subject: string }
  | { sent: false; reason: 'already_sent' };

export async function loadAssignments(prisma: PrismaLike, itemKey: string): Promise<Array<{ itemToken: string; revision: number; gmailThreadId: string | null; gmailMessageId: string | null; contentHash: string; at: string }>> {
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date | string }> = await prisma.gapAuditEvent.findMany({ where: { kind: ASSIGNMENT_SENT, subject_type: ITEM_SUBJECT_TYPE, subject_id: itemKey }, orderBy: [{ created_at: 'asc' }] });
  return rows.map((r) => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    return { itemToken: String(p.itemToken ?? ''), revision: Number(p.revision ?? 0), gmailThreadId: (p.gmailThreadId as string | null) ?? null, gmailMessageId: (p.gmailMessageId as string | null) ?? null, contentHash: String(p.contentHash ?? ''), at: new Date(r.created_at).toISOString() };
  });
}

export async function sendAssignment(prisma: PrismaLike, input: SendAssignmentInput, deps: AssignmentDeps = {}): Promise<SendAssignmentResult> {
  const prior = await loadAssignments(prisma, input.item.key);
  if (!input.resend && prior.some((p) => p.revision === input.revision)) return { sent: false, reason: 'already_sent' };
  const built = await buildAssignment(prisma, input, deps);
  const send = deps.send ?? (await import('@/lib/email/gmail-sender')).sendViaGmail;
  // A later revision stays in the item's thread (the seller's replies bind by that thread: commands.ts).
  const threadId = input.revision > 0 ? [...prior].reverse().find((p) => p.gmailThreadId)?.gmailThreadId ?? undefined : undefined;
  const res = await send({
    to: input.to,
    ...(threadId ? { threadId } : {}),
    subject: built.subject,
    html: built.html,
    text: built.text,
    sender: input.sender,
    purpose: 'OPERATOR_ALERT',
    replyTo: input.sender.userEmail,
    headers: { 'Auto-Submitted': 'auto-generated', 'X-GAP-Item': `${input.item.token}.${input.revision}` },
  });
  await prisma.gapAuditEvent.create({
    data: {
      kind: ASSIGNMENT_SENT,
      actor: input.actor,
      subject_type: ITEM_SUBJECT_TYPE,
      subject_id: input.item.key,
      payload: { day: input.plan.day, itemToken: input.item.token, revision: input.revision, to: input.to, gmailMessageId: res.id, gmailThreadId: res.threadId, contentHash: built.contentHash, subject: built.subject, prepared: built.prepared, resend: !!input.resend },
    },
  });
  return { sent: true, gmailMessageId: res.id, gmailThreadId: res.threadId, contentHash: built.contentHash, subject: built.subject };
}

/** The first plan item with no assignment sent, or null when every item went out. */
export async function nextUnassignedItem(prisma: PrismaLike, plan: DayPlan): Promise<PlanItem | null> {
  const keys = plan.items.map((i) => i.key);
  if (!keys.length) return null;
  const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { kind: ASSIGNMENT_SENT, subject_type: ITEM_SUBJECT_TYPE, subject_id: { in: keys } }, select: { subject_id: true } });
  const sent = new Set(rows.map((r) => r.subject_id));
  return plan.items.find((i) => !sent.has(i.key)) ?? null;
}
