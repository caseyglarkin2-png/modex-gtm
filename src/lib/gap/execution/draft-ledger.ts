/**
 * The Gmail draft ledger (final pass, 2026-09-25).
 *
 * Decision: NO NEW TABLE. `GapAuditEvent` is already the append-only GAP
 * ledger (UPDATE and DELETE raise GAP_APPEND_ONLY), indexed by
 * (subject_type, subject_id) and (kind, created_at), with a JSON payload. A
 * draft's whole life is three kinds of fact about one routing decision, each
 * written once and never changed:
 *
 *   execution.gmail_drafted            the draft exists (status drafted)
 *   execution.gmail_draft_sent         Casey sent it (a NEW message id)
 *   execution.gmail_draft_discarded    the draft is gone and nothing was sent
 *
 * All three are `subject_type 'routing_decision'`, `subject_id <decision id>`,
 * so "every draft for this card and what became of it" is one indexed read.
 * Fate rows name the draft they close by `gmailDraftId`; the draft id is
 * never reused as the sent message id (owner addendum 2026-09-24: drafting
 * and sending are distinct execution states).
 *
 * Creating a draft is NOT sending, NOT `human_action = emailed`, and does not
 * touch `routing_decisions` at all. Only Casey's own "I did this" records a
 * human action.
 */

import type { SendAttributionField } from './send-attribution';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DRAFTED = 'execution.gmail_drafted' as const;
export const DRAFT_REFUSED = 'execution.gmail_draft_refused' as const;
export const DRAFT_SENT = 'execution.gmail_draft_sent' as const;
export const DRAFT_DISCARDED = 'execution.gmail_draft_discarded' as const;
/**
 * The draft was seen GONE from Drafts with no SENT message yet (red team
 * Release B review). Not a fate: a Gmail undo window or a send still in
 * flight looks exactly like this, so the draft stays OUTSTANDING and is only
 * discarded once it has stayed gone past DRAFT_VANISH_GRACE_MS.
 */
export const DRAFT_VANISHED = 'execution.gmail_draft_vanished' as const;
export const DRAFT_SUBJECT_TYPE = 'routing_decision';
/**
 * A send Casey made BY HAND from Gmail (he copied the action pack's rendered
 * copy), reconciled to the real Gmail sent message. Not a GAP draft: there is
 * no draft id, and none is ever fabricated. engine 'manual', channel gmail.
 */
export const MANUAL_SENT = 'execution.gmail_manual_sent' as const;

export interface ManualSentPayload {
  engine: 'manual';
  channel: 'gmail';
  status: 'sent';
  routingDecisionId: string;
  hypothesisId: string;
  personaId: number;
  accountName: string;
  recipient: string;
  senderIdentity: string;
  subject: string;
  sequenceVersionId: string;
  stepIndex: number;
  gmailSentMessageId: string;
  gmailThreadId: string;
  rfcMessageId: string | null;
  /** Red team T10 (review S8): sha256 of the matched sent subject + text: the copy version of a manual send. Absent on older rows. */
  contentHash?: string;
  /** Red team T10: the T6 evidence tier at send time (the gate refuses anything but VERIFIED_FACT). Absent on older rows. */
  evidenceTier?: string;
  sentAt: string;
  matchedOn: string[];
  recordedAt: string;
  /** Phase 2 A2: immutable send-time attribution. Absent on older rows (read as unrecorded). */
  attribution?: SendAttributionField;
}

/**
 * SEND FROM YARDFLOW (first-principles pass, 2026-09-25): Casey confirmed one
 * email and GAP sent it through gmailDirectAdapter. The external call is
 * bracketed so a crash never reads as "nothing happened" or falsely "sent":
 *   CLAIMED   written under an advisory lock BEFORE the Gmail call; while it
 *             stands unresolved no second send of that key is attempted
 *   SENT      the Gmail message and thread ids, after Gmail answered
 *   RELEASED  Gmail provably did not send (a gate refused before the wire,
 *             or Gmail answered an error); the key may be tried again
 * A claim with neither SENT nor RELEASED is UNKNOWN: GAP refuses to send it
 * again and tells Casey to check Gmail Sent. It never guesses.
 */
export const DIRECT_CLAIMED = 'execution.gmail_direct_claimed' as const;
export const DIRECT_SENT = 'execution.gmail_direct_sent' as const;
export const DIRECT_RELEASED = 'execution.gmail_direct_released' as const;
export const DIRECT_REFUSED = 'execution.gmail_direct_refused' as const;
/** Governed copy (2026-10-01): COPY EMAIL was refused by the same gates as draft and send. */
export const COPY_REFUSED = 'execution.copy_refused' as const;
/** Governed copy: the email text was released to Casey after every gate cleared. Never a draft, never a send. */
export const COPY_RELEASED = 'execution.copy_released' as const;
/**
 * CREATE GMAIL DRAFT claims its person + step the same way a direct send does
 * (red team Release B review): written under the person lock BEFORE the Gmail
 * draft call, closed by the DRAFTED row carrying the same `claimKey`, or by
 * DIRECT_RELEASED when Gmail provably created nothing. A claim left open (the
 * draft was created but the answer or the ledger write was lost) keeps the
 * person + step blocked: an orphan draft is never invisible.
 */
export const DRAFT_CLAIMED = 'execution.gmail_draft_claimed' as const;

/** Refusals that provably happened before anything reached Gmail, so a claim may be released. */
export const DEFINITELY_NOT_SENT: readonly RegExp[] = [
  // The harness transport sink (email/transport-sink.ts) refuses before any network call: nothing could have left.
  /transport sink refused/i,
  /^Canonical autonomy refused/,
  /^HUMAN_APPROVED_1TO1 refused/,
  /^Cross-plane suppression refused/,
  /^Daily send ceiling/,
  // Only a 4xx is a definitive "Gmail did not act" (red team T4). A 5xx, a
  // timeout or a dropped connection may have acted: the claim stays open.
  /^Gmail send failed \(4\d\d\)/,
  /^Gmail draft create failed \(4\d\d\)/,
  /^Gmail token unavailable/,

  /^delegated Gmail/,
  /^Gmail sender not configured/,
];

export function isDefinitelyNotSent(reason: string): boolean {
  return DEFINITELY_NOT_SENT.some((re) => re.test(reason));
}

/**
 * R42b: the prepared ANSWER to a buyer's reply has its own facts, each written once, never changed, about ONE inbound
 * message (`subject_type 'inbound_message'`, `subject_id <the message id>`), so "what became of this answer" is one
 * indexed read. Copying the text, saving a Gmail draft and sending are three distinct states, never collapsed:
 *
 *   execution.reply_copied     the seller copied the prepared text (nothing left GAP)
 *   execution.reply_drafted    a Gmail draft of the answer exists in the thread (NOT sent)
 *   execution.reply_claimed    CONFIRM + SEND started (a lost answer leaves it open: check Sent, never resend)
 *   execution.reply_sent       the answer left the GAP mailbox in the buyer's thread (the Gmail message id)
 *   execution.reply_released   the send provably created nothing (the claim is released)
 */
export const REPLY_SUBJECT_TYPE = 'inbound_message';
export const REPLY_COPIED = 'execution.reply_copied' as const;
export const REPLY_DRAFTED = 'execution.reply_drafted' as const;
export const REPLY_CLAIMED = 'execution.reply_claimed' as const;
export const REPLY_SENT = 'execution.reply_sent' as const;
export const REPLY_RELEASED = 'execution.reply_released' as const;
export const REPLY_KINDS = [REPLY_COPIED, REPLY_DRAFTED, REPLY_CLAIMED, REPLY_SENT, REPLY_RELEASED] as const;
export type ReplyLedgerKind = (typeof REPLY_KINDS)[number];

/** Append one answer fact. THROWS on failure (a receipt that silently did not land is a lie). */
export async function appendReplyLedger(prisma: PrismaLike, kind: ReplyLedgerKind, actor: string, messageId: string, payload: Record<string, unknown>): Promise<string> {
  const row = await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: REPLY_SUBJECT_TYPE, subject_id: messageId, payload: JSON.parse(JSON.stringify(payload)) }, select: { id: true } });
  return row.id;
}

/**
 * Serialize every execution write for one human: advisory locks on the
 * lowercased address AND the persona id, always taken in the same order.
 * Person identity is persona OR address (person-history.ts), so two persona
 * rows sharing one mailbox, or one persona's two addresses, meet on a lock.
 */
export async function lockPerson(tx: PrismaLike, personaId: number | null, recipient: string): Promise<void> {
  const keys = [`gap_send_addr:${recipient.trim().toLowerCase()}`, ...(personaId !== null ? [`gap_send_persona:${personaId}`] : [])].sort();
  for (const k of keys) await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${k}))`;
}

/**
 * Final review P1 (reliability lens): serialize FIRST TOUCHES at one account, so
 * two people there cannot both pass the one-motion check at the same moment.
 * Taken after lockPerson, always in that order.
 */
export async function lockAccount(tx: PrismaLike, accountName: string): Promise<void> {
  const k = `gap_send_account:${accountName.trim().toLowerCase()}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${k}))`;
}

export interface DirectSentPayload {
  engine: 'gmail_direct';
  channel: 'gmail';
  status: 'sent';
  idempotencyKey: string;
  routingDecisionId: string;
  hypothesisId: string;
  personaId: number;
  accountName: string;
  recipient: string;
  senderIdentity: string;
  subject: string;
  contentHash: string;
  bodySnapshot: string;
  sequenceVersionId: string;
  stepIndex: number;
  compileId: string;
  /** Red team T10: the T6 evidence tier at send time (the gate refuses anything but VERIFIED_FACT). Absent on older rows. */
  evidenceTier?: string;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
  inReplyToGmailMessageId: string | null;
  sentAt: string;
  confirmedBy: string;
  confirmedAt: string;
  /** How HubSpot records this send. Exactly one method, never two. */
  crmLogMethod: CrmLogMethod;
  /** 'expected' = the proven mechanism applies but this activity was not read back; 'none' = not logged. */
  crmLogStatus: 'expected' | 'none';
  hubspotContactId: string | null;
  /** Phase 2 A2: immutable send-time attribution. Absent on older rows (read as unrecorded). */
  attribution?: SendAttributionField;
}

/**
 * connected_inbox: casey@yardflow.ai is a connected HubSpot inbox and the
 * portal logs all email with known contacts; a Gmail API send was proven to
 * log exactly one EMAIL activity (2026-09-25, docs/gap/crm-logging-2026-09-25.md).
 * hubspot_bcc is reserved for the documented fallback and is not in use.
 */
export type CrmLogMethod = 'connected_inbox' | 'hubspot_bcc' | 'none';

export interface DraftedPayload {
  engine: 'gmail_draft';
  status: 'drafted';
  routingDecisionId: string;
  hypothesisId: string;
  personaId: number;
  accountName: string;
  recipient: string;
  senderIdentity: string;
  subject: string;
  /** sha256 of the queued subject + body (action-pack.ts contentHashOf). */
  contentHash: string;
  /** The exact body placed in the draft (before the unsubscribe footer). */
  bodySnapshot: string;
  sequenceVersionId: string;
  /** Which step of the pinned version this draft is (absent on pre-sequence rows = 0). */
  stepIndex?: number;
  /** Red team T10: the T6 evidence tier at send time (the gate refuses anything but VERIFIED_FACT). Absent on older rows. */
  evidenceTier?: string;
  /** Follow-ups only: the Gmail message this draft replies to (reconciled truth), else null. */
  inReplyToGmailMessageId?: string | null;
  compileId: string;
  /** The DRAFT_CLAIMED key this draft closes (absent on drafts made before claims). */
  claimKey?: string;
  gmailDraftId: string;
  gmailDraftMessageId: string | null;
  gmailThreadId: string | null;
  createdAt: string;
  /** Phase 2 A2: attribution at draft time; the DRAFT_SENT fate carries its own, taken when the send is proven. */
  attribution?: SendAttributionField;
}

export interface DraftSentPayload {
  engine: 'gmail_direct';
  status: 'sent';
  routingDecisionId: string;
  /** The draft this send consumed (ExecutionReceipt.supersedesEngineId). */
  gmailDraftId: string;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
  sentAt: string;
  reconciledAt: string;
  /** Phase 2 A2: immutable send-time attribution, captured when the draft's send was proven. Absent on older rows. */
  attribution?: SendAttributionField;
}

export interface DraftDiscardedPayload {
  status: 'discarded';
  routingDecisionId: string;
  gmailDraftId: string;
  reconciledAt: string;
}

export type DraftFate = 'drafted' | 'sent' | 'discarded';

export interface DraftRecord {
  eventId: string;
  drafted: DraftedPayload;
  fate: DraftFate;
  sent: DraftSentPayload | null;
  discarded: DraftDiscardedPayload | null;
}

type Row = { id: string; kind: string; payload: unknown; created_at: Date };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Every draft GAP created for one routing decision, newest first, each with its fate. */
export async function listDraftRecords(prisma: PrismaLike, decisionId: string): Promise<DraftRecord[]> {
  const rows: Row[] = await prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [DRAFTED, DRAFT_SENT, DRAFT_DISCARDED] } },
    orderBy: { created_at: 'desc' },
    select: { id: true, kind: true, payload: true, created_at: true },
  });
  const sentBy = new Map<string, DraftSentPayload>();
  const discardedBy = new Map<string, DraftDiscardedPayload>();
  for (const r of rows) {
    if (!isObj(r.payload) || typeof r.payload.gmailDraftId !== 'string') continue;
    if (r.kind === DRAFT_SENT) sentBy.set(r.payload.gmailDraftId, r.payload as unknown as DraftSentPayload);
    if (r.kind === DRAFT_DISCARDED) discardedBy.set(r.payload.gmailDraftId, r.payload as unknown as DraftDiscardedPayload);
  }
  return rows
    .filter((r) => r.kind === DRAFTED && isObj(r.payload) && typeof r.payload.gmailDraftId === 'string')
    .map((r) => {
      const drafted = r.payload as unknown as DraftedPayload;
      const sent = sentBy.get(drafted.gmailDraftId) ?? null;
      const discarded = discardedBy.get(drafted.gmailDraftId) ?? null;
      return { eventId: r.id, drafted, fate: sent ? 'sent' : discarded ? 'discarded' : 'drafted', sent, discarded };
    });
}

/** Append one ledger row. THROWS on failure: a receipt that silently did not land is a lie. */
export async function appendLedger(
  prisma: PrismaLike,
  kind:
    | typeof DRAFTED
    | typeof DRAFT_REFUSED
    | typeof DRAFT_SENT
    | typeof DRAFT_DISCARDED
    | typeof DRAFT_VANISHED
    | typeof MANUAL_SENT
    | typeof DIRECT_CLAIMED
    | typeof DIRECT_SENT
    | typeof DIRECT_RELEASED
    | typeof DIRECT_REFUSED
    | typeof COPY_REFUSED
    | typeof COPY_RELEASED
    | typeof DRAFT_CLAIMED,
  actor: string,
  decisionId: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const row = await prisma.gapAuditEvent.create({
    data: { kind, actor, subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, payload },
    select: { id: true },
  });
  return row.id;
}
