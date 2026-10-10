/**
 * START AND THE ASSIGNMENT (X06, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * START (`work.day_started`, once per New York day) is the seller beginning the day, from the briefing's link or by
 * reply. An ASSIGNMENT is one email per plan item (work/plan.ts), composed as the ASSIGNMENT PACKET (the Gmail
 * action UI audit, GUI-02, 2026-10-10; work/assignment-packet.ts): the account, the person and the situation; what
 * changed or remains unresolved; who (the contact packet, people/contact-packet.ts); the relationship reconciled across
 * both sides of the mail (work/relationship-state.ts); the evidence with its sources and dates (from the account's Ask
 * context: the one composition Work, Ask and the page share, ask/context.ts); the possible moves; the prepared
 * material (for a first touch, the action pack's rendered copy quoted line by line with its sources); the controls.
 * It is recorded as `work.assignment_sent` (subject `work_item` / the item key) with the Gmail thread id, the RFC
 * message id when Gmail returns one, the item token, the revision and the content hash: what a reply's APPROVE is
 * bound to (X07, X11).
 *
 * Rules (pinned by tests/unit/gap/assignment.test.ts and gui-packet.test.ts):
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
import { loadInDealsSummary, type InDealsSummary } from '../deals/in-deals';
import { gapGmailSender } from '../execution/gap-sender';
import { buildAssignmentPacket, renderPacketHtml, renderPacketText, type AssignmentPacket, type BuildPacketDeps } from './assignment-packet';
import { dealCoverageFrom } from './deal-coverage';
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
  /** IW15: the prepared email is addressed to a different person than the item names; the item is held, never assigned. */
  hold?: { reason: 'recipient_mismatch'; detail: string } | null;
  /** GUI-02: the view model the text and the HTML were rendered from. */
  packet?: AssignmentPacket;
}

export interface AssignmentDeps {
  askContext?: (prisma: PrismaLike, accountName: string, now: Date) => Promise<AskContext | null>;
  pack?: (prisma: PrismaLike, args: { decisionId: string }) => Promise<PackLike | null>;
  send?: (payload: GmailSendPayload) => Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }>;
  /** The pursued items with their angles (work/intel.ts loadPursued by default; tests inject one). */
  pursued?: (prisma: PrismaLike, now: Date) => Promise<PursuedItem[]>;
  /** GUI-02: the packet's readers (the relationship, the contact packet, the imported records); tests inject them. */
  packet?: BuildPacketDeps;
  /** GUI-07: the mailbox a prepared email would go from; `undefined` means the GAP sender's (null when none is configured). */
  senderEmail?: string | null;
}

/** The item kinds a prepared angle is read for: account work, never a first touch with a pack. */
const ANGLE_KINDS = new Set(['deal', 'follow_up', 'review']);

/**
 * B9: the pursued read with the DEAL COVERAGE, the way the day loader and the briefing make it (C5: a person at a
 * family of names is placed at the account only with the coverage; without it Kenco's angle found no account and
 * the assignment said "nothing prepared"). The in-deals summary is cached in SystemConfig: the read the page already makes.
 */
async function defaultPursued(prisma: PrismaLike, now: Date, summary: InDealsSummary | null): Promise<PursuedItem[]> {
  return loadPursued(prisma, now, { coverage: dealCoverageFrom(summary) });
}

/** The slice of the action pack the assignment reads. */
export interface PackLike {
  rendered: { queued: { subject: string; body: string } } | null;
  contentHash: string | null;
  emailReady?: boolean;
  persona?: { email?: string | null; name?: string | null } | null;
  hypothesis?: { signals?: Array<{ signal?: { title?: string | null; evidence_url?: string | null; observed_at?: Date | string | null } | null }> } | null;
}

/** IW15 (2026-10-09): a name normalised for a same-person comparison ("Morrison, Craig" is "Craig Morrison"). */
const nameKey = (s: string | null | undefined): string => (s ?? '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

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

  let prepared: Prepared = { kind: 'none' };
  let pursued: PursuedItem[] = [];
  // The in-deals summary (cached in SystemConfig: the read the page already makes), read ONCE here for the deal
  // coverage of the pursued read and for the packet's deal links and stages; an injected pursued read (the test seam)
  // skips it, and the packet then says the deals were not read.
  const summary = deps.pursued ? null : await loadInDealsSummary(prisma, { now: input.now }).catch(() => null);
  // Seller acceptance follow-up addendum (2026-10-09): a deal, follow-up or review item at an account where a
  // develop_angle task succeeded (a person placed at the account at read time) carries that angle: the Kenco deal
  // item said "nothing prepared" in production although the angle for Dave Kiesling was ready.
  if (ANGLE_KINDS.has(item.kind) && !item.refs.decisionId) {
    pursued = await (deps.pursued ? deps.pursued(prisma, input.now) : defaultPursued(prisma, input.now, summary)).catch(() => [] as PursuedItem[]);
    const p = pursued.find((x) => x.accountName === item.accountName && x.status === 'ready' && x.angle);
    if (p?.angle) {
      // The writer's name, else the first person the angle names, before a bare address.
      const who = p.writer?.name ?? p.angle.peopleNamed[0]?.name ?? p.writer?.email ?? p.title;
      const opener = p.angle.starters[0] ?? null;
      prepared = { kind: 'angle', who, whyItMatters: p.angle.whyItMatters, opener };
    }
  }
  const move = ctx?.state.next || item.title;
  // X09: a proposed revision (never approved here) is shown in place of the pack's copy, with the line that says why.
  const copy = input.copyOverride
    ? { subject: input.copyOverride.subject, body: input.copyOverride.body, to: input.copyOverride.to ?? pack?.persona?.email ?? null }
    : pack?.rendered?.queued
      ? { subject: pack.rendered.queued.subject, body: pack.rendered.queued.body, to: pack.persona?.email ?? null }
      : null;
  let hold: BuiltAssignment['hold'] = null;
  if (copy) {
    const to = copy.to;
    // IW15 (2026-10-09): the PepsiCo card named Tom while the prepared email was to Shawn. The recipient's name is the
    // pack's persona name, else the persona record for the address (one bounded read); when the item names a person
    // and the names disagree, the email is NOT presented as prepared and the item is held: nothing goes out until
    // the account's chosen person and the draft agree. The intelligence and the rest of the assignment stay readable.
    const recipientName = pack?.persona?.name ?? (to && typeof prisma?.persona?.findFirst === 'function' ? ((await prisma.persona.findFirst({ where: { email: { equals: to, mode: 'insensitive' } }, select: { name: true } }).catch(() => null)) as { name: string | null } | null)?.name ?? null : null);
    const itemName = item.person?.name ?? null;
    if (itemName && recipientName && nameKey(itemName) && nameKey(recipientName) && nameKey(itemName) !== nameKey(recipientName)) {
      hold = { reason: 'recipient_mismatch', detail: `GAP's prepared email is addressed to ${recipientName}${to ? ` (${to})` : ''}, but this item names ${itemName}. Held: nothing goes out until the account's chosen person and the draft agree; choose on the account.` };
    } else {
      prepared = { kind: 'email', to, subject: copy.subject, body: copy.body };
    }
  }
  // GUI-02 (2026-10-10): the one view model (the relationship reconciled, the contact packet, the evidence with its
  // sources and dates, the moves, the prepared material, the controls) and its two renderers (work/assignment-packet.ts).
  const senderEmail = deps.senderEmail !== undefined ? deps.senderEmail : gapGmailSender()?.userEmail ?? null;
  const packet = await buildAssignmentPacket(prisma, { item, plan, now: input.now, ctx, pack, pursued, prepared, hold, copy: hold ? null : copy, note: input.note ?? null, baseUrl: input.baseUrl, senderEmail, inDeals: summary }, deps.packet ?? {});
  const links = { open: itemLink(input) };
  const text = renderPacketText(packet, links, { commandsEnabled: input.commandsEnabled });
  const html = renderPacketHtml(packet, links, { commandsEnabled: input.commandsEnabled });
  const contentHash = input.copyOverride?.contentHash ?? pack?.contentHash ?? createHash('sha256').update(text).digest('hex');
  return { subject, text, html, contentHash, prepared, move, hold, packet };
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

export type Assignable = { ok: true; built: BuiltAssignment } | { ok: false; reason: 'research_move' | 'research_why' | 'recipient_mismatch'; detail: string; built: BuiltAssignment };

/**
 * Whether an item can be handed to the seller: it is when something is prepared (an email, or an angle), or when its move is a
 * seller action. Nothing prepared AND a research-shaped move (or a why that says nothing is prepared) is held for the
 * agent. The built assignment is returned either way so the send does not build it twice.
 */
export async function assignable(prisma: PrismaLike, plan: DayPlan, item: PlanItem, input: AssignableInput, deps: AssignmentDeps = {}): Promise<Assignable> {
  const built = await buildAssignment(prisma, { plan, item, revision: 0, ...input }, deps);
  // IW15: a prepared email addressed to someone other than the item's person is held before anything else is judged.
  if (built.hold) return { ok: false, reason: built.hold.reason, detail: built.hold.detail, built };
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
/** IW15: the held line when the prepared email and the item's person disagree. */
const MISMATCH_LINE = 'the prepared email is addressed to a different person than the item names; choose on the account';

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
  // The held items by key with the reason they were held (a research hold, or IW15's recipient mismatch).
  const heldBefore = new Map<string, string>();
  for (const r of applied) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    // A progress note (DONE that said what the seller is doing, not what happened) settles nothing.
    if (SETTLING_COMMANDS.has(String(p.command ?? '')) && p.effect !== 'progress_noted') settled.add(r.subject_id);
    if (p.effect === ITEM_HELD_FOR_RESEARCH) heldBefore.set(r.subject_id, String(p.reason ?? ''));
  }
  const heldLine = (reason: string) => (reason === 'recipient_mismatch' ? MISMATCH_LINE : HELD_LINE);
  const held: HeldItem[] = [];
  for (const item of plan.items) {
    if (sent.has(item.key) || settled.has(item.key)) continue;
    if (heldBefore.has(item.key)) {
      held.push({ item, line: heldLine(heldBefore.get(item.key) ?? ''), recorded: false });
      continue;
    }
    if (!opts.assign) return { item, built: null, held };
    const a = await assignable(prisma, plan, item, opts.assign.input, opts.assign.deps);
    if (a.ok) return { item, built: a.built, held };
    await prisma.gapAuditEvent.create({
      data: { kind: COMMAND_APPLIED, actor: opts.assign.actor, subject_type: ITEM_SUBJECT_TYPE, subject_id: item.key, payload: { effect: ITEM_HELD_FOR_RESEARCH, reason: a.reason, detail: a.detail.slice(0, 500), day: plan.day, itemToken: item.token, revision: plan.revision ?? 0, at: opts.assign.input.now.toISOString() } },
    });
    held.push({ item, line: heldLine(a.reason), recorded: true });
  }
  return { item: null, built: null, held };
}

/** The first plan item with no assignment sent (and no applied SKIP, DEFER or DONE, and not held), or null when every item went out. */
export async function nextUnassignedItem(prisma: PrismaLike, plan: DayPlan): Promise<PlanItem | null> {
  return (await nextAssignableItem(prisma, plan)).item;
}
