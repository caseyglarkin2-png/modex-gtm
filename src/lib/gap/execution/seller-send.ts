/**
 * SEND FROM YARDFLOW (first-principles pass, 2026-09-25).
 *
 * Casey, authenticated, opens the final confirmation for ONE email to ONE
 * person and presses CONFIRM + SEND. This is the only module that may declare
 * the HUMAN_APPROVED_1TO1 send purpose (a test scans the tree); it is reached
 * only from the session-authenticated route
 * /api/gap/decisions/[id]/send, never from a cron, agent token or queue drain.
 *
 * Two calls, both re-running every click-time gate (prepareSellerEmail, the
 * same gates CREATE GMAIL DRAFT runs, plus the active-opportunity re-read):
 *   preview   (no `confirm`)       the final FROM / TO / SUBJECT / BODY and its
 *                                  content hash. Sends nothing.
 *   send      (`confirm` given)    refuses unless the re-rendered copy and
 *                                  recipient are EXACTLY what Casey confirmed
 *                                  (a changed hash or recipient is a refusal,
 *                                  never a silent resend of different copy)
 *
 * Idempotency (red team T2): one PERSON + recipient + step is one key, across
 * every routing card, whatever the copy says. A step already sent on this
 * card answers ALREADY SENT with its time and message id and never calls
 * Gmail; a step sent to this person from any other card, by any engine, is
 * refused. The key is claimed under a Postgres advisory lock on the person
 * BEFORE the Gmail call (draft-ledger.ts DIRECT_*), so a double click, a
 * refresh or a retry that races the first click waits for it and then sees it.
 * If Gmail's answer is lost (crash, network), the claim stays unresolved and
 * the send is refused as outcome unknown: check Gmail Sent, never resend blind.
 *
 * On a sent receipt: the DIRECT_SENT ledger row (engine gmail_direct, Gmail
 * message and thread ids, content hash, sequence/version/step), an EmailLog
 * row (the mailbox daily cap counts it), and human_action = emailed through
 * the existing recordHumanAction contract, because Casey pressed the button.
 */
import { captureSendAttribution } from './send-attribution';
import { suppressionRefusalKind } from '@/lib/email/suppression-gate';
import type { HumanConfirmation } from '@/lib/email/autonomy-gate';
import { recordHumanAction } from '../routing/queue';
import type { ExecutionIntent, ExecutionReceipt } from './contract';
import {
  appendLedger,
  DIRECT_CLAIMED,
  DIRECT_PREVIEWED,
  DIRECT_RELEASED,
  DIRECT_SENT,
  DRAFT_SUBJECT_TYPE,
  isDefinitelyNotSent,
  type CrmLogMethod,
  type DirectSentPayload,
} from './draft-ledger';
import { gmailDirectAdapter, type GmailAdapterDeps, type GmailAdapterInput } from './gmail-adapter';
import { prepareSellerEmail, type PreparedSellerEmail, type SellerDraftDeps, type SellerDraftRefusal } from './seller-draft';
import { claimSendKey, personStepKey } from './person-history';
import { REPLY_RELEASED, REPLY_SENT, appendReplyLedger } from './draft-ledger';
import { claimReply, prepareSellerReply, replyIntent, type ReplyRefusal, type SellerReplyDeps } from './seller-reply';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type SellerSendRefusal =
  | SellerDraftRefusal
  | 'not_confirmed'
  | 'copy_changed_since_review'
  | 'sender_changed_since_review'
  | 'recipient_changed_since_review'
  | 'send_in_progress_or_unknown'
  | 'send_refused';

/**
 * The CRM logging method for a send, from trusted server configuration
 * (GAP_CRM_LOG_METHOD). connected_inbox applies only to a known HubSpot
 * contact ("Log all emails" logs known contacts). No BCC is ever added: the
 * connected inbox logs the send itself, and a second mechanism would
 * duplicate the activity.
 */
export function crmLogMethodFor(hubspotContactId: string | null, env: Record<string, string | undefined> = process.env): CrmLogMethod {
  return env.GAP_CRM_LOG_METHOD?.trim() === 'connected_inbox' && hubspotContactId ? 'connected_inbox' : 'none';
}

export interface SendPreview {
  /** Whether this send is logged to HubSpot ('on') or not ('unavailable': no logging set up). Not a HubSpot read. */
  crmLogging: 'on' | 'unavailable';
  fromName: string;
  from: string;
  toName: string | null;
  to: string;
  subject: string;
  body: string;
  contentHash: string;
  stepIndex: number;
}

export type SellerSendResult =
  | { ok: true; preview: SendPreview }
  | { ok: true; alreadySent: true; sent: { sentAt: string; gmailSentMessageId: string; gmailThreadId: string | null; recipient: string } }
  | { ok: true; alreadySent: false; sent: DirectSentPayload; humanAction: 'recorded' | 'already_recorded' | 'failed'; ledgerError?: string }
  | { ok: false; reason: SellerSendRefusal; detail?: string; failedChecks?: string[]; approvalRequestId?: string; compileId?: string };

export interface SellerSendDeps extends SellerDraftDeps {
  directAdapter?: typeof gmailDirectAdapter;
  gmailTransport?: GmailAdapterDeps;
  /** Test seam for the advisory-locked claim. */
  claim?: typeof claimSendKey;
}

type Row = { kind: string; payload: Record<string, unknown> | null; created_at?: Date };

/** This card's DIRECT_* rows (the ALREADY SENT answer for a replayed click on the same card). */
async function directRows(prisma: PrismaLike, decisionId: string): Promise<Row[]> {
  return prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [DIRECT_CLAIMED, DIRECT_SENT, DIRECT_RELEASED] } },
    select: { kind: true, payload: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
}

export { claimSendKey, personStepState } from './person-history';


function sentStepRow(rows: readonly Row[], stepIndex: number): Row | undefined {
  return rows.find((r) => r.kind === DIRECT_SENT && Number(r.payload?.stepIndex ?? 0) === stepIndex);
}

/** Batch item 7: the refusals a losing duplicate tab can hit before its claim reads the winner (see sendSellerEmail). */
const RACE_SHAPED: ReadonlySet<string> = new Set(['emailed_outside_gap', 'decision_stale', 'first_touch_already_sent', 'step_already_sent', 'account_motion_active']);

/** A claim on this card's touch with no sent or released row yet: a send on the wire. */
function openClaimFor(rows: readonly Row[], stepIndex: number): boolean {
  const closed = new Set(rows.filter((r) => r.kind === DIRECT_SENT || r.kind === DIRECT_RELEASED).map((r) => String(r.payload?.idempotencyKey ?? '')));
  return rows.some((r) => r.kind === DIRECT_CLAIMED && Number(r.payload?.stepIndex ?? 0) === stepIndex && !closed.has(String(r.payload?.idempotencyKey ?? '')));
}

export async function sendSellerEmail(
  prisma: PrismaLike,
  input: {
    decisionId: string;
    /** The authenticated session email. */
    actor: string;
    now: Date;
    stepIndex?: number;
    /** What Casey saw on the final confirmation. Absent = preview only. */
    confirm?: { contentHash: string; recipient: string } | null;
  },
  deps: SellerSendDeps = {},
): Promise<SellerSendResult> {
  const { decisionId, actor, now } = input;
  const stepIndex = Math.max(0, input.stepIndex ?? 0);

  // Already sent by this path: answer from the ledger, never call Gmail again.
  const before = await directRows(prisma, decisionId);
  const done = sentStepRow(before, stepIndex);
  if (done) {
    const p = done.payload as unknown as DirectSentPayload;
    return { ok: true, alreadySent: true, sent: { sentAt: p.sentAt, gmailSentMessageId: p.gmailSentMessageId, gmailThreadId: p.gmailThreadId, recipient: p.recipient } };
  }

  const prep = await prepareSellerEmail(prisma, { decisionId, actor, now, stepIndex, mode: 'send' }, deps);
  if (!prep.ok) {
    // Batch item 7 (duplicate tabs): a losing tab's gates read the winner's message in Sent (or "moved since the card")
    // before its claim says sent. On the confirm path, the ledger answers first: this card's touch already recorded is
    // ALREADY SENT; a claim on it still open is in progress. Never "emailed outside GAP" for GAP's own send.
    if (input.confirm && RACE_SHAPED.has(prep.reason)) {
      const rows = await directRows(prisma, decisionId);
      const won = sentStepRow(rows, stepIndex);
      if (won) {
        const wp = won.payload as unknown as DirectSentPayload;
        return { ok: true, alreadySent: true, sent: { sentAt: wp.sentAt, gmailSentMessageId: wp.gmailSentMessageId, gmailThreadId: wp.gmailThreadId, recipient: wp.recipient } };
      }
      if (openClaimFor(rows, stepIndex)) return { ok: false, reason: 'send_in_progress_or_unknown', detail: 'This email is being sent from another tab right now. GAP will not send it twice.' };
    }
    return prep;
  }
  if (!('prepared' in prep)) return { ok: false, reason: 'send_refused', detail: 'unexpected prepare result' };
  const p: PreparedSellerEmail = prep.prepared;

  if (!input.confirm) {
    // Batch item 7: record what the final check showed, so the confirm binds the sending mailbox too (never a send).
    // C41: the subject and the thread ride on the preview too, so a send whose answer is lost can be attributed from it.
    await appendLedger(prisma, DIRECT_PREVIEWED, actor, decisionId, { contentHash: p.contentHash, recipient: p.recipient, sender: p.senderIdentity, subject: p.subject, gmailThreadId: p.threadContext?.threadId ?? null, stepIndex, at: now.toISOString() }).catch(() => undefined);
    return {
      ok: true,
      preview: {
        crmLogging: crmLogMethodFor(p.hubspotContactId) === 'none' ? 'unavailable' : 'on',
        fromName: p.gapSender?.displayName ?? 'Casey Larkin',
        from: p.senderIdentity,
        toName: p.personaName,
        to: p.recipient,
        subject: p.subject,
        body: p.text,
        contentHash: p.contentHash,
        stepIndex,
      },
    };
  }
  if (input.confirm.contentHash !== p.contentHash) {
    return { ok: false, reason: 'copy_changed_since_review', detail: 'The email changed after you reviewed it. Review the new copy and confirm again.' };
  }
  if (input.confirm.recipient.trim().toLowerCase() !== p.recipient) {
    return { ok: false, reason: 'recipient_changed_since_review', detail: `The recipient is now ${p.recipient}. Review and confirm again.` };
  }
  // Batch item 7: the sending mailbox the seller saw on the final check is bound too (the newest preview of this copy).
  const shown: { payload: Record<string, unknown> | null } | null = await prisma.gapAuditEvent
    .findFirst({ where: { kind: DIRECT_PREVIEWED, subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, payload: { path: ['contentHash'], equals: p.contentHash } }, orderBy: { created_at: 'desc' }, select: { payload: true } })
    .catch(() => null);
  const shownSender = typeof shown?.payload?.sender === 'string' ? shown.payload.sender : null;
  if (shownSender && shownSender.toLowerCase() !== String(p.senderIdentity).toLowerCase()) {
    return { ok: false, reason: 'sender_changed_since_review', detail: `The email would now go from ${p.senderIdentity}, not ${shownSender} as you reviewed. Review and confirm again.` };
  }

  // C42: the cross-plane suppression read at ACTION time, before the claim, when a reader is injected (the wire adapter
  // runs assertSuppressionPermitsSend itself by default, so a suppression set between review and confirm is refused
  // either way; with a reader given here it is refused before anything is claimed). Fail closed: unreadable refuses.
  if (deps.suppression) {
    try {
      await deps.suppression(p.recipient);
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err);
      const kind = suppressionRefusalKind(why);
      return { ok: false, reason: kind === 'suppressed' ? 'recipient_suppressed' : 'suppression_unreadable', detail: why };
    }
  }
  const key = personStepKey(p.personaId, p.recipient, stepIndex);
  const claim = await (deps.claim ?? claimSendKey)(prisma, { key, decisionId, personaId: p.personaId, recipient: p.recipient, stepIndex, actor, now, accountName: p.accountName });
  if (!claim.claimed) {
    if (claim.state === 'account_motion') return { ok: false, reason: 'account_motion_active', detail: claim.detail ?? 'Another first touch at this account started first.' };
    if (claim.state === 'sent') {
      const again = sentStepRow(await directRows(prisma, decisionId), stepIndex);
      const sp = again?.payload as unknown as DirectSentPayload | undefined;
      if (sp) return { ok: true, alreadySent: true, sent: { sentAt: sp.sentAt, gmailSentMessageId: sp.gmailSentMessageId, gmailThreadId: sp.gmailThreadId, recipient: sp.recipient } };
      return { ok: false, reason: stepIndex === 0 ? 'first_touch_already_sent' : 'step_already_sent', detail: `Touch ${stepIndex + 1} was already sent to this person from another card. GAP will not send it twice.` };
    }
    if (claim.state === 'drafted') {
      return { ok: false, reason: 'draft_outstanding', detail: `A Gmail draft of touch ${stepIndex + 1} to this person exists. Send or delete it in Gmail, then reconcile.` };
    }
    return {
      ok: false,
      reason: 'send_in_progress_or_unknown',
      detail: 'This exact email was already started and its outcome is not recorded. Check Gmail Sent in casey@yardflow.ai before trying again. GAP will not send it twice.',
    };
  }

  const confirmation: HumanConfirmation = { actor, recipient: p.recipient, contentHash: p.contentHash, confirmedAt: now };
  const intent: ExecutionIntent = {
    engine: 'gmail_direct',
    personaId: p.personaId,
    hypothesisId: p.hypothesisId,
    sequenceVersionId: p.sequenceVersionId,
    stepIndex,
    compileIds: [p.compileId],
    senderIdentity: p.senderIdentity,
    idempotencyKey: key,
    threadContext: p.threadContext,
    actor,
    actorKind: 'human',
    mode: 'live',
    now,
  };
  const wire: GmailAdapterInput = {
    to: p.recipient,
    subject: p.subject,
    html: p.html,
    text: p.text,
    headers: { ...p.headers },
    purpose: 'HUMAN_APPROVED_1TO1',
    humanConfirmation: confirmation,
    ...(p.gapSender ? { sender: p.gapSender } : {}),
  };
  const receipt: ExecutionReceipt = await (deps.directAdapter ?? gmailDirectAdapter)(intent, wire, deps.gmailTransport ?? {});

  if (receipt.status !== 'sent' || !receipt.engineId) {
    const why = receipt.refusalReason ?? 'no message id';
    if (receipt.status !== 'sent' && isDefinitelyNotSent(why)) {
      await appendLedger(prisma, DIRECT_RELEASED, actor, decisionId, { idempotencyKey: key, reason: why, at: now.toISOString() }).catch(() => undefined);
      // A suppression refusal names itself (unreadable: a safe retry; suppressed: final).
      const kind = suppressionRefusalKind(why);
      return { ok: false, reason: kind === 'unreadable' ? 'suppression_unreadable' : kind === 'suppressed' ? 'recipient_suppressed' : 'send_refused', detail: why };
    }
    // Lost or ambiguous answer: the claim stays unresolved on purpose.
    return { ok: false, reason: 'send_in_progress_or_unknown', detail: `Gmail's answer was not conclusive (${why}). Check Gmail Sent before trying again.` };
  }

  const sentAt = (receipt.sentAt ?? now).toISOString();
  const sent: DirectSentPayload = {
    engine: 'gmail_direct',
    channel: 'gmail',
    status: 'sent',
    idempotencyKey: key,
    routingDecisionId: decisionId,
    hypothesisId: p.hypothesisId,
    personaId: p.personaId,
    accountName: p.accountName,
    recipient: p.recipient,
    senderIdentity: p.senderIdentity,
    subject: p.subject,
    contentHash: p.contentHash,
    bodySnapshot: p.bodySnapshot,
    sequenceVersionId: p.sequenceVersionId,
    stepIndex,
    compileId: p.compileId,
    // prepareSellerEmail refuses anything below a verified outreach fact (T6).
    evidenceTier: 'VERIFIED_FACT',
    gmailSentMessageId: receipt.engineId,
    gmailThreadId: receipt.threadId ?? null,
    inReplyToGmailMessageId: p.inReplyToGmailMessageId,
    sentAt,
    confirmedBy: actor,
    confirmedAt: now.toISOString(),
    crmLogMethod: crmLogMethodFor(p.hubspotContactId),
    crmLogStatus: crmLogMethodFor(p.hubspotContactId) === 'none' ? 'none' : 'expected',
    hubspotContactId: p.hubspotContactId,
    // Phase 2 A2: immutable send-time attribution (never blocks: a failed read is `unrecorded`).
    attribution: await captureSendAttribution(prisma, { hypothesisId: p.hypothesisId, personaId: p.personaId, accountName: p.accountName, stepIndex, sequenceVersionId: p.sequenceVersionId, at: new Date(sentAt) }),
  };
  let ledgerError: string | undefined;
  try {
    await appendLedger(prisma, DIRECT_SENT, actor, decisionId, sent as unknown as Record<string, unknown>);
  } catch (err) {
    // The email left; the claim stays unresolved, so it can never be re-sent.
    ledgerError = err instanceof Error ? err.message : String(err);
  }
  try {
    await prisma.emailLog.create({
      data: { account_name: p.accountName, persona_name: p.personaName, to_email: p.recipient, subject: p.subject, body_html: p.html, status: 'sent', provider_message_id: receipt.engineId, thread_id: receipt.threadId ?? null, metadata: { source: 'gap_direct_send', routingDecisionId: decisionId, idempotencyKey: key }, sent_at: new Date(sentAt) },
    });
  } catch {
    // The daily-cap counter is best effort here; the GAP ledger is the truth.
  }

  let humanAction: 'recorded' | 'already_recorded' | 'failed' = 'failed';
  try {
    const r = await recordHumanAction(prisma, decisionId, 'emailed', actor, {
      now: () => now,
      audit: (pr: PrismaLike, e: { kind: string; actor: string; subjectType: string; subjectId: string; payload: Record<string, unknown> }) =>
        pr.gapAuditEvent.create({
          data: { kind: e.kind, actor: e.actor, subject_type: e.subjectType, subject_id: e.subjectId, payload: { ...e.payload, source: 'confirmed_direct_send', gmailSentMessageId: receipt.engineId } },
        }),
    } as never);
    humanAction = r.ok ? 'recorded' : 'already_recorded';
  } catch {
    humanAction = 'failed';
  }
  return { ok: true, alreadySent: false, sent, humanAction, ...(ledgerError ? { ledgerError } : {}) };
}

// ---------------------------------------------------------------------------------------------------------------------
// R42b (GAP OS execution recovery, 2026-10-06): CONFIRM + SEND of the seller's answer to a buyer's reply, in their
// thread. The same discipline as a first touch: a preview of exactly what leaves (from, to, subject, the text the seller
// edited and its content hash), then a send of exactly that text to exactly that person, claimed under a lock on the
// message first. Every click-time gate is seller-reply.ts `prepareSellerReply` (an opt-out stops everything, a referral
// prepares no reply, a newer message, a do-not-contact, an open draft, an answer already sent from GAP or by hand in
// Gmail, a placeholder left in the text); the wire runs restriction (In-Reply-To marks it a reply), autonomy,
// suppression and the daily cap. A lost answer keeps the claim open: check Sent, never resend blind.
// ---------------------------------------------------------------------------------------------------------------------

export interface ReplySendPreview {
  fromName: string;
  from: string;
  toName: string | null;
  to: string;
  subject: string;
  body: string;
  contentHash: string;
}

export interface ReplySentPayload {
  engine: 'gmail_direct';
  status: 'sent';
  inboundMessageId: string;
  accountName: string | null;
  personaId: number | null;
  recipient: string;
  senderIdentity: string;
  subject: string;
  contentHash: string;
  bodySnapshot: string;
  gmailSentMessageId: string;
  gmailThreadId: string | null;
  inReplyTo: string | null;
  sentAt: string;
  confirmedBy: string;
  confirmedAt: string;
  claimId: string;
}

export type SellerReplySendResult =
  | { ok: true; preview: ReplySendPreview }
  | { ok: true; alreadySent: true; sent: { sentAt: string; gmailSentMessageId: string; recipient: string } }
  | { ok: true; alreadySent: false; sent: ReplySentPayload; ledgerError?: string }
  | ReplyRefusal
  | { ok: false; reason: 'not_confirmed' | 'copy_changed_since_review' | 'recipient_changed_since_review' | 'send_refused'; detail?: string };

export async function sendSellerReply(
  prisma: PrismaLike,
  input: { messageId: string; body: string; actor: string; now: Date; confirm?: { contentHash: string; recipient: string } | null },
  deps: SellerReplyDeps & { directAdapter?: typeof gmailDirectAdapter; gmailTransport?: GmailAdapterDeps } = {},
): Promise<SellerReplySendResult> {
  const { messageId, actor, now } = input;
  const prep = await prepareSellerReply(prisma, { messageId, body: input.body, actor, now }, deps);
  if (!prep.ok) {
    if (prep.reason === 'already_answered') {
      const sent = (await import('./seller-reply')).foldReplyStates(
        await prisma.gapAuditEvent.findMany({ where: { subject_type: 'inbound_message', subject_id: messageId, kind: REPLY_SENT }, select: { id: true, kind: true, actor: true, payload: true, created_at: true } }),
        now,
      ).sent;
      if (sent) return { ok: true, alreadySent: true, sent: { sentAt: sent.at, gmailSentMessageId: sent.gmailSentMessageId, recipient: sent.recipient } };
    }
    return prep;
  }
  const p = prep.prepared;
  if (!input.confirm) {
    if (p.states.drafted) return { ok: false, reason: 'draft_outstanding', detail: 'A Gmail draft of this answer exists: send it or delete it in Gmail, so nothing goes out twice.' };
    return { ok: true, preview: { fromName: p.gapSender.displayName ?? 'Casey Larkin', from: p.senderIdentity, toName: p.recipientName, to: p.recipient, subject: p.subject, body: p.text, contentHash: p.contentHash } };
  }
  if (input.confirm.contentHash !== p.contentHash) return { ok: false, reason: 'copy_changed_since_review', detail: 'The answer changed after you reviewed it. Review it again and confirm.' };
  if (input.confirm.recipient.trim().toLowerCase() !== p.recipient) return { ok: false, reason: 'recipient_changed_since_review', detail: `The recipient is now ${p.recipient}. Review and confirm again.` };

  const claim = await claimReply(prisma, { messageId, kind: 'send', actor, now });
  if (!claim.claimed) {
    if (claim.state === 'sent' && claim.states.sent) return { ok: true, alreadySent: true, sent: { sentAt: claim.states.sent.at, gmailSentMessageId: claim.states.sent.gmailSentMessageId, recipient: claim.states.sent.recipient } };
    if (claim.state === 'drafted') return { ok: false, reason: 'draft_outstanding', detail: 'A Gmail draft of this answer exists: send it or delete it in Gmail, so nothing goes out twice.' };
    return { ok: false, reason: 'reply_in_progress_or_unknown', detail: 'This answer was already started and its outcome is not recorded. Check Gmail Sent in casey@yardflow.ai before trying again. GAP will not send it twice.' };
  }
  const confirmation: HumanConfirmation = { actor, recipient: p.recipient, contentHash: p.contentHash, confirmedAt: now };
  const wire: GmailAdapterInput = { to: p.recipient, subject: p.subject, html: p.html, text: p.text, purpose: 'HUMAN_APPROVED_1TO1', humanConfirmation: confirmation, sender: p.gapSender };
  const receipt: ExecutionReceipt = await (deps.directAdapter ?? gmailDirectAdapter)(replyIntent(p, 'gmail_direct', `reply:${messageId}`, actor, now), wire, deps.gmailTransport ?? {});
  if (receipt.status !== 'sent' || !receipt.engineId) {
    const why = receipt.refusalReason ?? 'no message id';
    if (receipt.status !== 'sent' && isDefinitelyNotSent(why)) {
      await appendReplyLedger(prisma, REPLY_RELEASED, actor, messageId, { claimId: claim.claimId, reason: why, at: now.toISOString() }).catch(() => undefined);
      const kind = suppressionRefusalKind(why);
      return { ok: false, reason: kind === 'unreadable' ? 'suppression_unreadable' : kind === 'suppressed' ? 'recipient_suppressed' : 'send_refused', detail: why };
    }
    return { ok: false, reason: 'reply_in_progress_or_unknown', detail: `Gmail's answer was not conclusive (${why}). Check Gmail Sent before trying again.` };
  }
  const sentAt = (receipt.sentAt ?? now).toISOString();
  const sent: ReplySentPayload = {
    engine: 'gmail_direct',
    status: 'sent',
    inboundMessageId: messageId,
    accountName: p.accountName,
    personaId: p.personaId,
    recipient: p.recipient,
    senderIdentity: p.senderIdentity,
    subject: p.subject,
    contentHash: p.contentHash,
    bodySnapshot: p.text,
    gmailSentMessageId: receipt.engineId,
    gmailThreadId: receipt.threadId ?? null,
    inReplyTo: p.threadContext.inReplyTo ?? null,
    sentAt,
    confirmedBy: actor,
    confirmedAt: now.toISOString(),
    claimId: claim.claimId,
  };
  let ledgerError: string | undefined;
  let sentRowId: string | null = null;
  try {
    sentRowId = await appendReplyLedger(prisma, REPLY_SENT, actor, messageId, sent as unknown as Record<string, unknown>);
  } catch (err) {
    // The answer left; the claim stays open, so it can never be re-sent.
    ledgerError = err instanceof Error ? err.message : String(err);
  }
  // Batch item 8 (finding 3): the sent answer is the record of their reply and completes what it answered (their
  // request, the follow-up waiting on them, a return reminder), its proof the REPLY_SENT row. A referral is never
  // answered here (no reply is prepared for one), so a referral obligation is never closed by a send.
  if (sentRowId && p.accountName) {
    const { commitmentsAnsweredBySend } = await import('../work/commitments');
    await commitmentsAnsweredBySend(prisma, { accountName: p.accountName, email: p.recipient, proofId: sentRowId, at: sentAt, actor, now }).catch(() => 0);
  }
  try {
    await prisma.emailLog.create({ data: { account_name: p.accountName ?? '', persona_name: p.recipientName, to_email: p.recipient, subject: p.subject, body_html: p.html, status: 'sent', provider_message_id: receipt.engineId, thread_id: receipt.threadId ?? null, metadata: { source: 'gap_reply_send', inboundMessageId: messageId }, sent_at: new Date(sentAt) } });
  } catch {
    // The daily-cap counter is best effort here; the GAP ledger is the truth.
  }
  return { ok: true, alreadySent: false, sent, ...(ledgerError ? { ledgerError } : {}) };
}
