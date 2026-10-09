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
 *   - seller acceptance follow-up (2026-10-09): START and NEXT walk the NEWEST revision of the day's plan and skip an
 *     item assigned in any revision (by key), an item with an applied SKIP, DEFER or DONE, and an item that is NOT
 *     ASSIGNABLE: nothing prepared and a research-shaped move ("Research ...", "Find the operator ...", "No grounded
 *     angle ...", "Review the angle ...", or a why that says nothing is prepared or GAP researches). Such an item is
 *     HELD for the agent (`work.command_applied`, effect `item_held_for_research`, subject the item) and never handed
 *     to the seller: October 9 handed him Southern Glazer's with prepared none and a move that amounted to "research it"
 */
import { createHash } from 'node:crypto';
import type { GmailSender, GmailSendPayload } from '@/lib/email/gmail-sender';
import { buildAskContext } from '../ask/context';
import type { AskContext } from '../ask/grounding';
import { loadActionPack } from '../execution/action-pack';
import { signActionToken } from './action-token';
import { COMMAND_WORDS } from './briefing';
import { loadPursued, type PursuedItem } from './intel';
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
/** A prepared ANGLE (a develop_angle task that succeeded for a person at this account): not copy, a grounded opening the seller works from. */
export interface PreparedAngle {
  kind: 'angle';
  /** The writer the angle was developed for (name, else email). */
  who: string;
  whyItMatters: string;
  opener: string | null;
}
export type Prepared = PreparedEmail | PreparedAngle | { kind: 'none' };

export interface BuiltAssignment {
  subject: string;
  text: string;
  html: string;
  contentHash: string;
  prepared: Prepared;
  /** The move in words (the Ask context's next, else the item title): what "The move:" says. */
  move: string;
}

export interface AssignmentDeps {
  askContext?: (prisma: PrismaLike, accountName: string, now: Date) => Promise<AskContext | null>;
  pack?: (prisma: PrismaLike, args: { decisionId: string }) => Promise<PackLike | null>;
  send?: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
  /** The pursued items with their angles (work/intel.ts loadPursued by default; tests inject one). */
  pursued?: (prisma: PrismaLike, now: Date) => Promise<PursuedItem[]>;
}

/** The item kinds a prepared angle is read for: account work, never a first touch with a pack. */
const ANGLE_KINDS = new Set(['deal', 'follow_up', 'review']);

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
  let prepared: Prepared = { kind: 'none' };
  // Seller acceptance follow-up addendum (2026-10-09): a deal, follow-up or review item at an account where a
  // develop_angle task succeeded (a person placed at the account at read time) carries that angle: the Kenco deal
  // item said "nothing prepared" in production although the angle for Dave Kiesling was ready.
  if (ANGLE_KINDS.has(item.kind) && !item.refs.decisionId) {
    const pursued = await (deps.pursued ?? loadPursued)(prisma, input.now).catch(() => [] as PursuedItem[]);
    const p = pursued.find((x) => x.accountName === item.accountName && x.status === 'ready' && x.angle);
    if (p?.angle) {
      const who = p.writer?.name ?? p.writer?.email ?? p.angle.peopleNamed[0]?.name ?? p.title;
      const opener = p.angle.starters[0] ?? null;
      prepared = { kind: 'angle', who, whyItMatters: p.angle.whyItMatters, opener };
      lines.push('', safeLine(`GAP has prepared an angle for ${who}: ${endSentence(p.angle.whyItMatters)}`));
      if (opener) lines.push(safeLine(`Opener: ${opener}`));
    }
  }
  const move = ctx?.state.next || item.title;
  lines.push('', `The move: ${endSentence(move)}`);
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
  return { subject, text, html, contentHash, prepared, move };
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
  /** An assignment already built for this item and revision (the assignability check built it): sent as is, not built again. */
  built?: BuiltAssignment | null;
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
  const built = input.built ?? (await buildAssignment(prisma, input, deps));
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
      // A fresh Gmail message's thread id is its own id; a provider that answers none (the harness sink) is read the same way.
      // C39 / F15: the mailbox this assignment went from is the sender an APPROVE on it is bound to (approve-request.ts).
      payload: { day: input.plan.day, itemToken: input.item.token, revision: input.revision, to: input.to, senderIdentity: input.sender.userEmail, gmailMessageId: res.id, gmailThreadId: res.threadId ?? res.id, contentHash: built.contentHash, subject: built.subject, prepared: built.prepared, resend: !!input.resend },
    },
  });
  return { sent: true, gmailMessageId: res.id, gmailThreadId: res.threadId ?? res.id, contentHash: built.contentHash, subject: built.subject };
}

/** The command ledger's applied row kind (replies/commands-apply.ts owns the commands; the literal is repeated here to keep the import one way). */
const COMMAND_APPLIED = 'work.command_applied' as const;
/** The effect recorded on an item held for the agent instead of handed to the seller. */
export const ITEM_HELD_FOR_RESEARCH = 'item_held_for_research' as const;
/** A move that is research, not a seller action. */
export const RESEARCH_MOVE = /^(research|find the operator|no grounded angle|review the angle)/i;
/** A why that says the item has nothing prepared or that GAP is researching it. */
export const RESEARCH_WHY = /nothing prepared|GAP researches/i;
/** The commands that settle an item for the day: an item with one applied is never offered again. */
const SETTLING_COMMANDS = new Set(['skip', 'defer', 'done']);

export type AssignableInput = Pick<BuildAssignmentInput, 'baseUrl' | 'actionSecret' | 'commandsEnabled' | 'now'>;

export type Assignable = { ok: true; built: BuiltAssignment } | { ok: false; reason: 'research_move' | 'research_why'; detail: string; built: BuiltAssignment };

/**
 * Whether an item can be handed to the seller: it is when something is prepared (an email, or an angle), or when its move is a
 * seller action. Nothing prepared AND a research-shaped move (or a why that says nothing is prepared) is held for the
 * agent. The built assignment is returned either way so the send does not build it twice.
 */
export async function assignable(prisma: PrismaLike, plan: DayPlan, item: PlanItem, input: AssignableInput, deps: AssignmentDeps = {}): Promise<Assignable> {
  const built = await buildAssignment(prisma, { plan, item, revision: 0, ...input }, deps);
  if (built.prepared.kind !== 'none') return { ok: true, built };
  if (RESEARCH_MOVE.test(built.move.trim())) return { ok: false, reason: 'research_move', detail: built.move, built };
  if (RESEARCH_WHY.test(item.why)) return { ok: false, reason: 'research_why', detail: item.why, built };
  return { ok: true, built };
}

export interface HeldItem {
  item: PlanItem;
  /** The seller line in parentheses: "nothing supported to send yet". */
  line: string;
  /** Held by this walk (true) or found already held (false). */
  recorded: boolean;
}

export interface NextAssignable {
  item: PlanItem | null;
  /** The assignment built for `item` by the assignability check (null when the check did not run). */
  built: BuiltAssignment | null;
  /** The items walked past because they are held for the agent, in plan order. */
  held: HeldItem[];
}

const HELD_LINE = 'nothing supported to send yet';

/**
 * The next item START or NEXT hands the seller, walking the plan (its newest revision) in order and skipping: an item
 * assigned in any revision (by key), an item with an applied SKIP, DEFER or DONE, an item already held, and (when
 * `assign` is given) an item that is not assignable, which is recorded held for the agent and walked past.
 */
export async function nextAssignableItem(prisma: PrismaLike, plan: DayPlan, opts: { assign?: { input: AssignableInput; deps?: AssignmentDeps; actor: string } } = {}): Promise<NextAssignable> {
  const keys = plan.items.map((i) => i.key);
  if (!keys.length) return { item: null, built: null, held: [] };
  const rows: Array<{ subject_id: string }> = await prisma.gapAuditEvent.findMany({ where: { kind: ASSIGNMENT_SENT, subject_type: ITEM_SUBJECT_TYPE, subject_id: { in: keys } }, select: { subject_id: true } });
  const sent = new Set(rows.map((r) => r.subject_id));
  const applied: Array<{ subject_id: string; payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: COMMAND_APPLIED, subject_type: ITEM_SUBJECT_TYPE, subject_id: { in: keys } }, select: { subject_id: true, payload: true } });
  const settled = new Set<string>();
  const heldBefore = new Set<string>();
  for (const r of applied) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    // A progress note (DONE that said what the seller is doing, not what happened) settles nothing.
    if (SETTLING_COMMANDS.has(String(p.command ?? '')) && p.effect !== 'progress_noted') settled.add(r.subject_id);
    if (p.effect === ITEM_HELD_FOR_RESEARCH) heldBefore.add(r.subject_id);
  }
  const held: HeldItem[] = [];
  for (const item of plan.items) {
    if (sent.has(item.key) || settled.has(item.key)) continue;
    if (heldBefore.has(item.key)) {
      held.push({ item, line: HELD_LINE, recorded: false });
      continue;
    }
    if (!opts.assign) return { item, built: null, held };
    const a = await assignable(prisma, plan, item, opts.assign.input, opts.assign.deps);
    if (a.ok) return { item, built: a.built, held };
    await prisma.gapAuditEvent.create({
      data: { kind: COMMAND_APPLIED, actor: opts.assign.actor, subject_type: ITEM_SUBJECT_TYPE, subject_id: item.key, payload: { effect: ITEM_HELD_FOR_RESEARCH, reason: a.reason, detail: a.detail.slice(0, 500), day: plan.day, itemToken: item.token, revision: plan.revision ?? 0, at: opts.assign.input.now.toISOString() } },
    });
    held.push({ item, line: HELD_LINE, recorded: true });
  }
  return { item: null, built: null, held };
}

/** The first plan item with no assignment sent (and no applied SKIP, DEFER or DONE, and not held), or null when every item went out. */
export async function nextUnassignedItem(prisma: PrismaLike, plan: DayPlan): Promise<PlanItem | null> {
  return (await nextAssignableItem(prisma, plan)).item;
}
