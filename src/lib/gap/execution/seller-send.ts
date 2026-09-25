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
 * Idempotency: one decision + version + step + recipient + content hash is one
 * key. A step already sent answers ALREADY SENT with its time and message id
 * and never calls Gmail. The key is claimed under a Postgres advisory lock
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
import type { HumanConfirmation } from '@/lib/email/autonomy-gate';
import { recordHumanAction } from '../routing/queue';
import type { ExecutionIntent, ExecutionReceipt } from './contract';
import {
  appendLedger,
  DIRECT_CLAIMED,
  DIRECT_RELEASED,
  DIRECT_SENT,
  DRAFT_SUBJECT_TYPE,
  type DirectSentPayload,
} from './draft-ledger';
import { gmailDirectAdapter, type GmailAdapterDeps, type GmailAdapterInput } from './gmail-adapter';
import { prepareSellerEmail, type PreparedSellerEmail, type SellerDraftDeps, type SellerDraftRefusal } from './seller-draft';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type SellerSendRefusal =
  | SellerDraftRefusal
  | 'not_confirmed'
  | 'copy_changed_since_review'
  | 'recipient_changed_since_review'
  | 'send_in_progress_or_unknown'
  | 'send_refused';

export interface SendPreview {
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

async function directRows(prisma: PrismaLike, decisionId: string): Promise<Row[]> {
  return prisma.gapAuditEvent.findMany({
    where: { subject_type: DRAFT_SUBJECT_TYPE, subject_id: decisionId, kind: { in: [DIRECT_CLAIMED, DIRECT_SENT, DIRECT_RELEASED] } },
    select: { kind: true, payload: true, created_at: true },
    orderBy: { created_at: 'asc' },
  });
}

/** The state of one idempotency key from its ledger rows. */
export function keyState(rows: readonly Row[], key: string): 'free' | 'sent' | 'unresolved' {
  const mine = rows.filter((r) => r.payload?.idempotencyKey === key);
  if (mine.some((r) => r.kind === DIRECT_SENT)) return 'sent';
  const claims = mine.filter((r) => r.kind === DIRECT_CLAIMED).length;
  const releases = mine.filter((r) => r.kind === DIRECT_RELEASED).length;
  return claims > releases ? 'unresolved' : 'free';
}

/**
 * Claim `key` for one send, atomically: a transaction-scoped advisory lock on
 * the key serializes concurrent clicks, then the ledger is re-read inside it.
 */
export async function claimSendKey(
  prisma: PrismaLike,
  args: { key: string; decisionId: string; actor: string; now: Date },
): Promise<{ claimed: true } | { claimed: false; state: 'sent' | 'unresolved' }> {
  return prisma.$transaction(
    async (tx: PrismaLike) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${args.key}))`;
      const state = keyState(await directRows(tx, args.decisionId), args.key);
      if (state !== 'free') return { claimed: false as const, state };
      await tx.gapAuditEvent.create({
        data: { kind: DIRECT_CLAIMED, actor: args.actor, subject_type: DRAFT_SUBJECT_TYPE, subject_id: args.decisionId, payload: { idempotencyKey: args.key, claimedAt: args.now.toISOString() } },
      });
      return { claimed: true as const };
    },
    { timeout: 15_000 },
  );
}

/** Refusals that provably happened before anything left the mailbox (the key may be retried). */
const DEFINITELY_NOT_SENT = [
  /^Canonical autonomy refused/,
  /^HUMAN_APPROVED_1TO1 refused/,
  /^Cross-plane suppression refused/,
  /^Daily send ceiling/,
  /^Gmail send failed \(\d+\)/,
  /^delegated Gmail/,
  /^Gmail sender not configured/,
];

function sentStepRow(rows: readonly Row[], stepIndex: number): Row | undefined {
  return rows.find((r) => r.kind === DIRECT_SENT && Number(r.payload?.stepIndex ?? 0) === stepIndex);
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
  if (!prep.ok) return prep;
  if (!('prepared' in prep)) return { ok: false, reason: 'send_refused', detail: 'unexpected prepare result' };
  const p: PreparedSellerEmail = prep.prepared;

  if (!input.confirm) {
    return {
      ok: true,
      preview: {
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

  const key = `gmail_direct:${decisionId}:${p.sequenceVersionId}:${stepIndex}:${p.recipient}:${p.contentHash}`;
  const claim = await (deps.claim ?? claimSendKey)(prisma, { key, decisionId, actor, now });
  if (!claim.claimed) {
    if (claim.state === 'sent') {
      const again = sentStepRow(await directRows(prisma, decisionId), stepIndex);
      const sp = again?.payload as unknown as DirectSentPayload | undefined;
      if (sp) return { ok: true, alreadySent: true, sent: { sentAt: sp.sentAt, gmailSentMessageId: sp.gmailSentMessageId, gmailThreadId: sp.gmailThreadId, recipient: sp.recipient } };
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
    if (receipt.status !== 'sent' && DEFINITELY_NOT_SENT.some((re) => re.test(why))) {
      await appendLedger(prisma, DIRECT_RELEASED, actor, decisionId, { idempotencyKey: key, reason: why, at: now.toISOString() }).catch(() => undefined);
      return { ok: false, reason: 'send_refused', detail: why };
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
    gmailSentMessageId: receipt.engineId,
    gmailThreadId: receipt.threadId ?? null,
    inReplyToGmailMessageId: p.inReplyToGmailMessageId,
    sentAt,
    confirmedBy: actor,
    confirmedAt: now.toISOString(),
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

