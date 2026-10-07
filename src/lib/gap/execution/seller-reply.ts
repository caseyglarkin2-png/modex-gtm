/**
 * ANSWER A BUYER'S REPLY (GAP OS execution recovery, R42b, 2026-10-06). Server only.
 *
 * The prepared answer (replies/answer.ts) is read from the buyer's actual message and the account's citable context,
 * then edited by the seller. Three external states stay distinct, each a ledger fact about the ONE inbound message
 * (draft-ledger.ts REPLY_*): the text COPIED (nothing leaves GAP), a Gmail DRAFT saved in the buyer's thread (nothing
 * is sent; `createSellerReplyDraft`, this module: drafts.create only), and a SEND (only through seller-send.ts
 * `sendSellerReply`: preview, then CONFIRM + SEND of exactly the confirmed text to exactly that person).
 *
 * Every draft and send re-reads, at the click (`prepareSellerReply`):
 *   the message      it exists; a person wrote it (an opt-out stops everything, a referral prepares no reply, an
 *                    automatic notice or a bounce has nothing to answer)
 *   the thread       it came through the GAP mailbox (a HubSpot-inbox reply has no Gmail thread: PARTIAL, the
 *                    dependency named) and the GAP sender is configured
 *   current state    no newer message from them (an opt-out after it stops everything; a newer reply is answered
 *                    instead), no recorded do-not-contact on them, the person not marked do not contact
 *   already answered nothing sent from GAP for it, no open draft of it, nothing in the GAP mailbox's Sent to them since
 *                    it arrived (answered in Gmail by hand); an unreadable Sent folder is unknown, never "nothing"
 *   the text         not empty, no "[Fill in: ...]" placeholder left, no em dash
 * The wire (gmail-sender.ts) still runs the restriction, autonomy, suppression and daily-cap gates; In-Reply-To and the
 * thread id keep the answer in their thread. Nothing here records a disposition, a buyer agreement or a commitment.
 */
import { createHash } from 'node:crypto';
import { suppressionRefusalKind } from '@/lib/email/suppression-gate';
import { getGmailSignature, gmailSenderAddress, type GmailSender } from '@/lib/email/gmail-sender';
import { classifyReply } from '../replies/classify';
import { plainTextOf } from '../replies/list';
import { selectConfirmedBids } from '../bid/select';
import { artifactProblems } from '../deals/artifacts';
import { prepareAnswer, unfilledPlaceholders, type PreparedAnswer } from '../replies/answer';
import { DIRECT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT, REPLY_CLAIMED, REPLY_COPIED, REPLY_DRAFTED, REPLY_KINDS, REPLY_RELEASED, REPLY_SENT, REPLY_SUBJECT_TYPE, appendReplyLedger, isDefinitelyNotSent } from './draft-ledger';
import { gmailDraftAdapter, type GmailAdapterDeps } from './gmail-adapter';
import { gapGmailSender } from './gap-sender';
import type { ExecutionIntent } from './contract';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const REPLY_BODY_MAX = 8_000;
/** A claim this young with no outcome is a click in flight: the next click waits for it. */
export const REPLY_CLAIM_IN_FLIGHT_MS = 2 * 60_000;

export type SellerReplyRefusal =
  | 'reply_not_found'
  | 'opted_out'
  | 'referral_prepares_no_reply'
  | 'not_a_reply'
  | 'no_gmail_thread'
  | 'gap_sender_unconfigured'
  | 'newer_message'
  | 'person_do_not_contact'
  | 'already_answered'
  | 'answered_in_gmail'
  | 'mailbox_sent_unreadable'
  | 'draft_outstanding'
  | 'reply_in_progress_or_unknown'
  | 'empty_body'
  | 'body_too_long'
  | 'unfilled_placeholders'
  | 'em_dash'
  | 'copy_problem'
  | 'recipient_suppressed'
  | 'suppression_unreadable'
  | 'gmail_refused';

export type ReplyRefusal = { ok: false; reason: SellerReplyRefusal; detail?: string };

export interface SellerReplyDeps {
  gapSender?: () => GmailSender | null;
  /** The account's materials that exist (default: its microsite and demo pack). */
  materials?: (accountName: string) => Promise<Array<{ kind: string; label: string; href: string }>>;
  signature?: (sender: GmailSender | undefined) => Promise<string | null>;
  /** The GAP mailbox's Sent folder to this recipient in a window (default: listSentTo, sink-aware). */
  mailboxSentTo?: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<Array<{ id: string; internalDate: Date; subject: string }>>;
  gmail?: GmailAdapterDeps;
}

export interface ReplyStates {
  copied: { at: string; by: string; contentHash: string } | null;
  drafted: { at: string; draftId: string; contentHash: string } | null;
  sent: { at: string; gmailSentMessageId: string; gmailThreadId: string | null; contentHash: string; recipient: string } | null;
  /** A started CONFIRM + SEND (or draft) with no outcome on record. */
  openClaim: { at: string; id: string } | null;
}

export interface ReplyContext {
  message: { id: string; threadId: string; rfcMessageId: string | null; from: string; fromName: string | null; subject: string | null; text: string; receivedAt: string; source: string };
  accountName: string | null;
  persona: { id: number; name: string | null; doNotContact: boolean; hubspotContactId: string | null } | null;
  gapSender: GmailSender | null;
  answer: PreparedAnswer;
  states: ReplyStates;
  /** Why nothing can be drafted or sent from GAP right now (current state), else null. */
  blocked: ReplyRefusal | null;
}

const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const iso = (d: Date | string) => new Date(d).toISOString();

async function defaultMaterials(accountName: string): Promise<Array<{ kind: string; label: string; href: string }>> {
  const [{ getAllAccountMicrositeData }, { loadDemoPack }, { normalizeCompanyName }, { accountSlug }] = await Promise.all([import('@/lib/microsites/accounts'), import('@/lib/demo/load-pack'), import('../identity/normalize'), import('../account-intel/href')]);
  const k = normalizeCompanyName(accountName);
  const own = getAllAccountMicrositeData().filter((m) => normalizeCompanyName(m.accountName) === k || (!!m.hubspotName && normalizeCompanyName(m.hubspotName) === k));
  const micro = own.length === 1 ? own[0] : null;
  const slug = micro?.slug ?? accountSlug(accountName);
  const pack = await loadDemoPack(slug).catch(() => null);
  return [...(micro ? [{ kind: 'microsite', label: `an overview page for ${accountName}`, href: `https://yardflow.ai/for/${micro.slug}/` }] : []), ...(pack ? [{ kind: 'demo', label: `a demo for ${accountName}`, href: `https://yardflow.ai/demo/${slug}/` }] : [])];
}

function defaultMailboxSentTo(sender: GmailSender | null): SellerReplyDeps['mailboxSentTo'] | null {
  if (!sender) return null;
  return async (recipient, after, before) => (await import('@/lib/email/gmail-inbox')).listSentTo(sender, recipient, after, before);
}

/** The answer's ledger facts, folded. */
export function foldReplyStates(rows: ReadonlyArray<{ id?: string; kind: string; actor: string; payload: Record<string, unknown> | null; created_at: Date | string }>, now: Date): ReplyStates {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const out: ReplyStates = { copied: null, drafted: null, sent: null, openClaim: null };
  const closed = new Set<string>();
  for (const r of sorted) {
    const p = r.payload ?? {};
    if (r.kind === REPLY_COPIED) out.copied = { at: iso(r.created_at), by: r.actor, contentHash: String(p.contentHash ?? '') };
    else if (r.kind === REPLY_DRAFTED) out.drafted = { at: iso(r.created_at), draftId: String(p.gmailDraftId ?? ''), contentHash: String(p.contentHash ?? '') };
    else if (r.kind === REPLY_SENT) out.sent = { at: String(p.sentAt ?? iso(r.created_at)), gmailSentMessageId: String(p.gmailSentMessageId ?? ''), gmailThreadId: (p.gmailThreadId as string | null) ?? null, contentHash: String(p.contentHash ?? ''), recipient: String(p.recipient ?? '') };
    if ((r.kind === REPLY_DRAFTED || r.kind === REPLY_SENT || r.kind === REPLY_RELEASED) && typeof p.claimId === 'string') closed.add(p.claimId);
  }
  const open = sorted.filter((r) => r.kind === REPLY_CLAIMED && !closed.has(String(r.payload?.claimId ?? ''))).pop();
  if (open) out.openClaim = { at: iso(open.created_at), id: String(open.payload?.claimId ?? '') };
  void now;
  return out;
}

async function loadStates(prisma: PrismaLike, messageId: string, now: Date): Promise<ReplyStates> {
  const rows = await prisma.gapAuditEvent.findMany({ where: { subject_type: REPLY_SUBJECT_TYPE, subject_id: messageId, kind: { in: [...REPLY_KINDS] } }, select: { id: true, kind: true, actor: true, payload: true, created_at: true }, orderBy: { created_at: 'asc' } });
  return foldReplyStates(rows, now);
}

/** Everything the prepared answer and the gates read, from the stores GAP already keeps. Null: no such message. */
export async function loadReplyContext(prisma: PrismaLike, messageId: string, now: Date, deps: SellerReplyDeps = {}): Promise<ReplyContext | null> {
  const row: { id: string; thread_id: string; rfc_message_id: string | null; from_email: string; from_name: string | null; subject: string | null; body_text: string | null; body_html: string | null; snippet: string | null; received_at: Date; source: string | null; thread: { account_name: string | null } | null } | null = await prisma.inboundMessage.findUnique({
    where: { id: messageId },
    select: { id: true, thread_id: true, rfc_message_id: true, from_email: true, from_name: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true, source: true, thread: { select: { account_name: true } } },
  });
  if (!row) return null;
  const from = lower(row.from_email);
  const text = plainTextOf(row).replace(/\s+/g, ' ').trim();
  const persona: { id: number; name: string | null; account_name: string; do_not_contact: boolean; hubspot_contact_id: string | null } | null = await prisma.persona.findFirst({ where: { email: { equals: from, mode: 'insensitive' } }, select: { id: true, name: true, account_name: true, do_not_contact: true, hubspot_contact_id: true } });
  const accountName = row.thread?.account_name ?? persona?.account_name ?? null;
  const gapSender = (deps.gapSender ?? gapGmailSender)();
  const message = { id: row.id, threadId: row.thread_id, rfcMessageId: row.rfc_message_id, from, fromName: row.from_name, subject: row.subject, text, receivedAt: iso(row.received_at), source: row.source ?? 'gmail' };

  // Current state: a newer message from them, a recorded do-not-contact.
  const [newer, dnc, bids, story, touch, states, materials] = await Promise.all([
    prisma.inboundMessage.findMany({ where: { from_email: { equals: from, mode: 'insensitive' }, received_at: { gt: row.received_at } }, select: { snippet: true, body_text: true, body_html: true, subject: true, from_email: true }, take: 20 }),
    prisma.conversationDisposition.findFirst({ where: { contact_email: from, human_confirmed: true, response_class: 'do_not_contact' }, select: { id: true } }),
    accountName ? prisma.buyerInputData.findMany({ where: { account_name: accountName, contact_email: from }, select: { id: true, type: true, raw_buyer_language: true, human_confirmed: true, supersedes_id: true, confirmed_at: true, captured_at: true } }) : [],
    accountName
      ? prisma.prospectingHypothesis.findFirst({ where: { account_name: accountName, status: { in: ['active', 'approved'] }, ...(persona ? { primary_persona_id: persona.id } : {}) }, select: { signals: { where: { role: 'primary' }, select: { signal: { select: { title: true, evidence_url: true, observed_at: true } } } } }, orderBy: { updated_at: 'desc' } }).catch(() => null)
      : null,
    prisma.gapAuditEvent.findFirst({ where: { subject_type: DRAFT_SUBJECT_TYPE, kind: { in: [DIRECT_SENT, MANUAL_SENT] }, payload: { path: ['recipient'], equals: from } }, select: { payload: true, created_at: true }, orderBy: { created_at: 'desc' } }),
    loadStates(prisma, messageId, now),
    accountName ? (deps.materials ?? defaultMaterials)(accountName).catch(() => []) : Promise.resolve([]),
  ]);
  const newerKinds = (newer as Array<{ snippet: string | null; body_text: string | null; body_html: string | null; subject: string | null; from_email: string }>).map((m) => classifyReply({ snippet: plainTextOf(m), subject: m.subject, from: m.from_email }).kind);
  const confirmed = selectConfirmedBids((bids as Array<{ id: string; type: string; raw_buyer_language: string; human_confirmed: boolean; supersedes_id: string | null; confirmed_at: Date | null; captured_at: Date }>).map((b) => ({ ...b, humanConfirmed: b.human_confirmed, supersedesId: b.supersedes_id })));
  const signal = (story as { signals?: Array<{ signal: { title: string | null; evidence_url: string | null; observed_at: Date | null } }> } | null)?.signals?.[0]?.signal ?? null;
  const tp = (touch as { payload: Record<string, unknown> | null; created_at: Date } | null) ?? null;
  const dependency =
    message.source !== 'gmail' ? 'the Gmail thread: this reply came in through HubSpot\'s connected inbox, so GAP cannot answer it in the GAP mailbox thread. Copy the text and answer it where it arrived.'
    : !gapSender ? 'the GAP mailbox sender (GAP_GMAIL_USER_EMAIL and its credential) is not configured here. Copy the text and answer it in Gmail.'
    : null;
  const answer = prepareAnswer({
    messageText: text,
    subject: row.subject,
    from,
    fromName: row.from_name ?? persona?.name ?? null,
    now,
    materials,
    confirmed: confirmed.map((b) => ({ type: b.type, quote: b.raw_buyer_language, at: iso(b.confirmed_at ?? b.captured_at) })),
    story: signal?.title ? { title: signal.title, url: signal.evidence_url, at: signal.observed_at ? iso(signal.observed_at) : null } : null,
    lastTouch: tp?.payload?.subject ? { subject: String(tp.payload.subject), at: String(tp.payload.sentAt ?? iso(tp.created_at)) } : null,
    dependency,
  });
  const c = classifyReply({ snippet: text, subject: row.subject, from });
  const blocked: ReplyRefusal | null =
    c.kind === 'opt_out' || newerKinds.includes('opt_out') || dnc ? { ok: false, reason: 'opted_out', detail: 'They asked not to be contacted: no reply goes back, and nothing else goes to them.' }
    : c.kind !== 'human' ? { ok: false, reason: 'not_a_reply', detail: 'An automatic notice or a bounce: there is nothing to answer.' }
    : c.human === 'referral' ? { ok: false, reason: 'referral_prepares_no_reply', detail: 'A referral prepares no reply: record who they named; you decide how to approach them.' }
    : persona?.do_not_contact ? { ok: false, reason: 'person_do_not_contact', detail: `${persona.name ?? from} is marked do not contact.` }
    : newerKinds.includes('human') ? { ok: false, reason: 'newer_message', detail: 'They wrote again since: answer their newest message.' }
    : null;
  return { message, accountName, persona: persona ? { id: persona.id, name: persona.name, doNotContact: persona.do_not_contact, hubspotContactId: persona.hubspot_contact_id } : null, gapSender, answer, states, blocked };
}

/** The text's own refusals (the same for a draft and a send). */
/** Their message as sentences: the buyer's own words, which the copy guard exempts when the seller quotes them. */
export function buyerSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 3);
}

/**
 * The text that leaves: never empty, bounded, no placeholder left, no em dash, and the deal-artifact guard
 * (deals/artifacts.ts `artifactProblems`): no "throughput", no claim of approval or acceptance the buyer did not make
 * (their own quoted sentences are exempt), and a canon figure only with its required label.
 */
export function bodyRefusal(body: string, buyerWords: readonly string[] = []): ReplyRefusal | null {
  const t = body.trim();
  if (!t) return { ok: false, reason: 'empty_body', detail: 'Write the answer first.' };
  if (t.length > REPLY_BODY_MAX) return { ok: false, reason: 'body_too_long', detail: `Keep it under ${REPLY_BODY_MAX} characters.` };
  const left = unfilledPlaceholders(t);
  if (left.length) return { ok: false, reason: 'unfilled_placeholders', detail: `Fill in or delete: ${left.join(' ')}` };
  if (t.includes('\u2014')) return { ok: false, reason: 'em_dash', detail: 'Replace the em dash with a period or a comma.' };
  const problems = artifactProblems(t, buyerWords).filter((p) => p !== 'an em dash');
  if (problems.length) return { ok: false, reason: 'copy_problem', detail: `Fix before it leaves: ${problems.join('; ')}.` };
  return null;
}

/** What CONFIRM + SEND binds: the sending mailbox, the recipient, the subject and exactly the edited text. */
export const replyContentHash = (sender: string, recipient: string, subject: string, body: string) => createHash('sha256').update(`${sender.toLowerCase()}\n${recipient}\n${subject}\n${body.trim()}`).digest('hex');

export interface PreparedReply {
  messageId: string;
  accountName: string | null;
  recipient: string;
  recipientName: string | null;
  personaId: number | null;
  hubspotContactId: string | null;
  subject: string;
  text: string;
  html: string;
  contentHash: string;
  threadContext: NonNullable<ExecutionIntent['threadContext']>;
  gapSender: GmailSender;
  senderIdentity: string;
  states: ReplyStates;
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function replyHtml(body: string, signatureHtml: string | null): string {
  const paragraphs = body.trim().split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`).join('\n');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">\n${paragraphs}${signatureHtml ? `\n<div class="gmail_signature">${signatureHtml}</div>` : ''}\n</div>`;
}

/** Every click-time gate for a draft or a send of the seller's (edited) answer. Never trusts the page. */
export async function prepareSellerReply(prisma: PrismaLike, input: { messageId: string; body: string; actor: string; now: Date }, deps: SellerReplyDeps = {}): Promise<{ ok: true; prepared: PreparedReply } | ReplyRefusal> {
  const ctx = await loadReplyContext(prisma, input.messageId, input.now, deps);
  if (!ctx) return { ok: false, reason: 'reply_not_found' };
  if (ctx.blocked) return ctx.blocked;
  if (ctx.message.source !== 'gmail') return { ok: false, reason: 'no_gmail_thread', detail: ctx.answer.dependency ?? undefined };
  if (!ctx.gapSender) return { ok: false, reason: 'gap_sender_unconfigured', detail: ctx.answer.dependency ?? undefined };
  if (ctx.states.sent) return { ok: false, reason: 'already_answered', detail: `Answered from GAP on ${ctx.states.sent.at.slice(0, 10)}.` };
  const text = bodyRefusal(input.body, buyerSentences(ctx.message.text));
  if (text) return text;
  // Answered by hand in Gmail since it arrived (Sent holds a message to them that GAP did not send).
  const sentTo = deps.mailboxSentTo ?? defaultMailboxSentTo(ctx.gapSender);
  if (sentTo) {
    // An answer GAP sent already returned above; anything in Sent to them since the reply arrived is by hand.
    const recorded = new Set<string>();
    const after = new Date(ctx.message.receivedAt).getTime();
    let since: Array<{ id: string; internalDate: Date; subject: string }>;
    try {
      since = (await sentTo(ctx.message.from, Math.floor(after / 1000), Math.ceil(input.now.getTime() / 1000) + 86_400)).filter((m) => m.internalDate.getTime() > after && !recorded.has(m.id));
    } catch (e) {
      return { ok: false, reason: 'mailbox_sent_unreadable', detail: `Could not read the GAP mailbox's Sent folder (${e instanceof Error ? e.message : String(e)}). Nothing goes out until it can be read.` };
    }
    if (since.length) return { ok: false, reason: 'answered_in_gmail', detail: `casey@yardflow.ai already wrote to them on ${since[0].internalDate.toISOString().slice(0, 10)} ("${since[0].subject}") after this reply. Record what they said; nothing else goes out from here.` };
  }
  const subject = ctx.answer.subject;
  const body = input.body.trim();
  const signatureHtml = await (deps.signature ?? getGmailSignature)(ctx.gapSender).catch(() => null);
  return {
    ok: true,
    prepared: {
      messageId: ctx.message.id,
      accountName: ctx.accountName,
      recipient: ctx.message.from,
      recipientName: ctx.message.fromName ?? ctx.persona?.name ?? null,
      personaId: ctx.persona?.id ?? null,
      hubspotContactId: ctx.persona?.hubspotContactId ?? null,
      subject,
      text: body,
      html: replyHtml(body, signatureHtml),
      contentHash: replyContentHash(ctx.gapSender.userEmail ?? gmailSenderAddress(), ctx.message.from, subject, body),
      threadContext: { threadId: ctx.message.threadId, subject, ...(ctx.message.rfcMessageId ? { inReplyTo: ctx.message.rfcMessageId, references: [ctx.message.rfcMessageId] } : {}) },
      gapSender: ctx.gapSender,
      senderIdentity: ctx.gapSender.userEmail ?? gmailSenderAddress(),
      states: ctx.states,
    },
  };
}

/** The intent for the adapters: a reply has no thesis, version or step; the thread context is what matters. */
export function replyIntent(p: PreparedReply, engine: 'gmail_draft' | 'gmail_direct', key: string, actor: string, now: Date): ExecutionIntent {
  return { engine, personaId: p.personaId ?? 0, hypothesisId: '', sequenceVersionId: '', stepIndex: 0, compileIds: [], senderIdentity: p.senderIdentity, idempotencyKey: key, threadContext: p.threadContext, actor, actorKind: 'human', mode: 'live', now };
}

/**
 * Claim the answer under a lock on the message (a double click, two tabs, a draft racing a send): a sent answer
 * answers "sent"; a claim in flight or with a lost outcome answers "open". The Gmail call happens after the lock.
 */
export async function claimReply(prisma: PrismaLike, input: { messageId: string; kind: 'draft' | 'send'; actor: string; now: Date }): Promise<{ claimed: true; claimId: string } | { claimed: false; state: 'sent' | 'open' | 'drafted'; states: ReplyStates }> {
  const run = async (tx: PrismaLike) => {
    const states = await loadStates(tx, input.messageId, input.now);
    if (states.sent) return { claimed: false as const, state: 'sent' as const, states };
    if (states.openClaim) return { claimed: false as const, state: 'open' as const, states };
    if (input.kind === 'send' && states.drafted) return { claimed: false as const, state: 'drafted' as const, states };
    const claimId = `${input.kind}:${input.now.toISOString()}:${Math.random().toString(36).slice(2, 8)}`;
    await appendReplyLedger(tx, REPLY_CLAIMED, input.actor, input.messageId, { claimId, kind: input.kind, at: input.now.toISOString() });
    return { claimed: true as const, claimId };
  };
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return run(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_reply:${input.messageId}`}))`;
    return run(tx);
  });
}

/** The seller copied the prepared text: recorded, nothing left GAP. A stopped conversation has nothing to copy. */
export async function recordReplyCopied(prisma: PrismaLike, input: { messageId: string; body: string; actor: string; now: Date }, deps: SellerReplyDeps = {}): Promise<{ ok: true; states: ReplyStates } | ReplyRefusal> {
  const ctx = await loadReplyContext(prisma, input.messageId, input.now, deps);
  if (!ctx) return { ok: false, reason: 'reply_not_found' };
  if (ctx.blocked && ctx.blocked.reason !== 'newer_message') return ctx.blocked;
  if (!input.body.trim()) return { ok: false, reason: 'empty_body' };
  await appendReplyLedger(prisma, REPLY_COPIED, input.actor, input.messageId, { contentHash: replyContentHash(ctx.gapSender?.userEmail ?? '', ctx.message.from, ctx.answer.subject, input.body), accountName: ctx.accountName, at: input.now.toISOString() });
  return { ok: true, states: await loadStates(prisma, input.messageId, input.now) };
}

/**
 * SAVE AS A GMAIL DRAFT in the buyer's thread: drafts.create only (this module reaches no send). The same text drafted
 * twice is one draft; a different text while a draft exists is refused (edit or send it in Gmail).
 */
export async function createSellerReplyDraft(
  prisma: PrismaLike,
  input: { messageId: string; body: string; actor: string; now: Date },
  deps: SellerReplyDeps = {},
): Promise<{ ok: true; alreadyDrafted: boolean; drafted: { gmailDraftId: string; contentHash: string; at: string } } | ReplyRefusal> {
  const prep = await prepareSellerReply(prisma, input, deps);
  if (!prep.ok) return prep;
  const p = prep.prepared;
  if (p.states.drafted) {
    if (p.states.drafted.contentHash === p.contentHash) return { ok: true, alreadyDrafted: true, drafted: { gmailDraftId: p.states.drafted.draftId, contentHash: p.contentHash, at: p.states.drafted.at } };
    return { ok: false, reason: 'draft_outstanding', detail: 'A Gmail draft of this answer already exists: edit or send it in Gmail, or delete it there first.' };
  }
  const claim = await claimReply(prisma, { messageId: p.messageId, kind: 'draft', actor: input.actor, now: input.now });
  if (!claim.claimed) return claim.state === 'sent' ? { ok: false, reason: 'already_answered' } : { ok: false, reason: 'reply_in_progress_or_unknown', detail: 'An earlier click on this answer has no outcome on record. Check Gmail Drafts and Sent before trying again.' };
  const receipt = await gmailDraftAdapter(replyIntent(p, 'gmail_draft', `reply_draft:${p.messageId}:${p.contentHash}`, input.actor, input.now), { to: p.recipient, subject: p.subject, html: p.html, text: p.text, sender: p.gapSender }, deps.gmail ?? {});
  if (receipt.status !== 'drafted' || !receipt.engineId) {
    const why = receipt.refusalReason ?? 'no draft id';
    if (isDefinitelyNotSent(why)) await appendReplyLedger(prisma, REPLY_RELEASED, input.actor, p.messageId, { claimId: claim.claimId, reason: why, at: input.now.toISOString() }).catch(() => undefined);
    const kind = suppressionRefusalKind(why);
    return { ok: false, reason: kind === 'unreadable' ? 'suppression_unreadable' : kind === 'suppressed' ? 'recipient_suppressed' : 'gmail_refused', detail: why };
  }
  await appendReplyLedger(prisma, REPLY_DRAFTED, input.actor, p.messageId, { claimId: claim.claimId, gmailDraftId: receipt.engineId, gmailDraftMessageId: receipt.draftMessageId ?? null, gmailThreadId: receipt.threadId ?? null, contentHash: p.contentHash, recipient: p.recipient, subject: p.subject, bodySnapshot: p.text, accountName: p.accountName, status: 'drafted' });
  return { ok: true, alreadyDrafted: false, drafted: { gmailDraftId: receipt.engineId, contentHash: p.contentHash, at: input.now.toISOString() } };
}
