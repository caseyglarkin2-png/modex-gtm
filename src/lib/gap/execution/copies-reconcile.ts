/**
 * COPIED IS NOT SENT (X14, GAP OS sales execution engine, 2026-10-08). Server only; run by the GAP mailbox cron after
 * the unknown-send and follow-up reconciles.
 *
 * The mandate's section 10: a copied email is not a sent email. A copy is recorded as a copy (REPLY_COPIED on a reply,
 * COPY_RELEASED on a cold first touch) and stays what it is: the reply stays owed its answer, the first touch is not
 * a touch. This reconcile asks Sent, the way R43 closes a by-hand follow-up: the first message to that recipient
 * AFTER the copy, not recorded already, is the proof that it went, and is recorded
 *   - for a reply: a REPLY_SENT row (the same row the GAP send writes) with `reconciledFromSent: true` and the Gmail
 *     message id, so Work, the Today panel and the scorecard see the answer
 *   - for a cold copy: a MANUAL_SENT row through the existing manual-send recorder (execution/manual-send.ts: one
 *     Gmail message is one send, human_action stamped), so the person's history, the follow-up sweep and the gates see
 *     the touch
 * Nothing without the proof. Bounded (COPY_RECONCILE_MAX per run) and windowed (COPY_LOOKBACK_DAYS). A Gmail error
 * leaves the copy as it is and is reported, never written.
 */
import type { SentMatch } from './unknown-send-reconcile';
import { COPY_RELEASED, DIRECT_SENT, DRAFT_SENT, DRAFT_SUBJECT_TYPE, MANUAL_SENT, REPLY_COPIED, REPLY_SENT, REPLY_SUBJECT_TYPE, appendReplyLedger } from './draft-ledger';
import { recordManualSend } from './manual-send';
import { loadActionPack } from './action-pack';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const COPY_LOOKBACK_DAYS = 14;
export const COPY_RECONCILE_MAX = 10;
const DAY_MS = 86_400_000;

export interface CopiesReconcileReport {
  replies: { checked: number; reconciled: number; unknown: Array<{ id: string; reason: 'gmail_error' | 'no_recipient'; detail?: string }> };
  copies: { checked: number; reconciled: number; unknown: Array<{ id: string; reason: 'gmail_error' | 'card_unreadable'; detail?: string }> };
}

type ManualRecorder = (prisma: PrismaLike, input: Parameters<typeof recordManualSend>[1]) => Promise<{ ledgerId: string; humanAction: 'recorded' | 'already_acted' | 'not_recorded' }>;

export interface CopiesReconcileDeps {
  listSent: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SentMatch[]>;
  /** The manual-send recorder (tests inject a spy). */
  recordManual?: ManualRecorder;
  max?: number;
}

type Row = { id?: string; kind: string; subject_type: string; subject_id: string; payload: Record<string, unknown> | null; created_at: Date | string };

const addressOf = (to: string) => (to.match(/[^\s<>,;"']+@[^\s<>,;"']+/)?.[0] ?? to).trim().toLowerCase();

async function firstSentAfter(deps: CopiesReconcileDeps, recipient: string, copiedAt: Date, now: Date, recorded: ReadonlySet<string>): Promise<SentMatch | null> {
  const since = copiedAt.getTime() + 60_000;
  const found = (await deps.listSent(recipient, Math.floor(since / 1000), Math.ceil(now.getTime() / 1000) + 60)).filter((m) => m.internalDate.getTime() > since && !recorded.has(m.id) && addressOf(m.to) === recipient.toLowerCase());
  if (!found.length) return null;
  return [...found].sort((a, b) => a.internalDate.getTime() - b.internalDate.getTime())[0];
}

export async function reconcileCopiesFromSent(prisma: PrismaLike, input: { now: Date; actor?: string }, deps: CopiesReconcileDeps): Promise<CopiesReconcileReport> {
  const actor = input.actor ?? 'cron:gap-mailbox';
  const max = deps.max ?? COPY_RECONCILE_MAX;
  const since = new Date(input.now.getTime() - COPY_LOOKBACK_DAYS * DAY_MS);
  const report: CopiesReconcileReport = { replies: { checked: 0, reconciled: 0, unknown: [] }, copies: { checked: 0, reconciled: 0, unknown: [] } };
  const rows: Row[] = await prisma.gapAuditEvent.findMany({
    where: { created_at: { gte: since }, kind: { in: [REPLY_COPIED, REPLY_SENT, COPY_RELEASED, DIRECT_SENT, MANUAL_SENT, DRAFT_SENT] } },
    orderBy: [{ created_at: 'desc' }],
  });

  // Replies: a copy with no sent row for the same inbound message.
  const replySent = new Set(rows.filter((r) => r.kind === REPLY_SENT && r.subject_type === REPLY_SUBJECT_TYPE).map((r) => r.subject_id));
  const replyCopies = rows.filter((r) => r.kind === REPLY_COPIED && r.subject_type === REPLY_SUBJECT_TYPE && !replySent.has(r.subject_id));
  const seenReply = new Set<string>();
  for (const r of replyCopies) {
    if (seenReply.has(r.subject_id) || report.replies.checked >= max) continue;
    seenReply.add(r.subject_id);
    report.replies.checked += 1;
    const inbound = await prisma.inboundMessage.findUnique({ where: { id: r.subject_id } }).catch(() => null);
    const recipient = typeof inbound?.from_email === 'string' ? inbound.from_email.trim().toLowerCase() : null;
    if (!recipient) {
      report.replies.unknown.push({ id: r.subject_id, reason: 'no_recipient' });
      continue;
    }
    let m: SentMatch | null;
    try {
      m = await firstSentAfter(deps, recipient, new Date(r.created_at), input.now, new Set());
    } catch (e) {
      report.replies.unknown.push({ id: r.subject_id, reason: 'gmail_error', detail: e instanceof Error ? e.message : String(e) });
      continue;
    }
    if (!m) continue;
    const p = r.payload ?? {};
    await appendReplyLedger(prisma, REPLY_SENT, actor, r.subject_id, {
      engine: 'gmail_manual',
      channel: 'gmail',
      status: 'sent',
      inboundMessageId: r.subject_id,
      accountName: typeof p.accountName === 'string' ? p.accountName : null,
      personaId: typeof inbound?.persona_id === 'number' ? inbound.persona_id : null,
      recipient,
      subject: m.subject,
      contentHash: typeof p.contentHash === 'string' ? p.contentHash : null,
      gmailSentMessageId: m.id,
      gmailThreadId: m.threadId ?? null,
      sentAt: m.internalDate.toISOString(),
      reconciledFromSent: true,
      copiedAt: new Date(r.created_at).toISOString(),
    });
    report.replies.reconciled += 1;
  }

  // Cold copies: a copy_released with no send of that person + step after it.
  const sends = rows.filter((r) => (r.kind === DIRECT_SENT || r.kind === MANUAL_SENT || r.kind === DRAFT_SENT) && r.subject_type === DRAFT_SUBJECT_TYPE);
  const recordedIds = new Set(sends.map((r) => String(r.payload?.gmailSentMessageId ?? '')).filter(Boolean));
  const sentFor = (recipient: string, stepIndex: number, after: Date) =>
    sends.some((s) => String(s.payload?.recipient ?? '').toLowerCase() === recipient && Number(s.payload?.stepIndex ?? 0) === stepIndex && new Date(String(s.payload?.sentAt ?? s.created_at)).getTime() >= after.getTime() - 60_000);
  const seenCopy = new Set<string>();
  for (const r of rows.filter((x) => x.kind === COPY_RELEASED && x.subject_type === DRAFT_SUBJECT_TYPE)) {
    const p = r.payload ?? {};
    const recipient = String(p.recipient ?? '').trim().toLowerCase();
    const stepIndex = Number(p.stepIndex ?? 0);
    const key = `${r.subject_id}:${stepIndex}:${recipient}`;
    if (!recipient || seenCopy.has(key) || report.copies.checked >= max) continue;
    seenCopy.add(key);
    if (sentFor(recipient, stepIndex, new Date(r.created_at))) continue;
    report.copies.checked += 1;
    let m: SentMatch | null;
    try {
      m = await firstSentAfter(deps, recipient, new Date(r.created_at), input.now, recordedIds);
    } catch (e) {
      report.copies.unknown.push({ id: r.subject_id, reason: 'gmail_error', detail: e instanceof Error ? e.message : String(e) });
      continue;
    }
    if (!m) continue;
    const decision = await prisma.routingDecision.findUnique({ where: { id: r.subject_id }, select: { id: true, hypothesis_id: true, persona_id: true, account_name: true } }).catch(() => null);
    if (!decision?.hypothesis_id || typeof decision.persona_id !== 'number') {
      report.copies.unknown.push({ id: r.subject_id, reason: 'card_unreadable' });
      continue;
    }
    const record: ManualRecorder = deps.recordManual ?? recordManualSend;
    let versionId = '';
    if (!deps.recordManual) {
      const pack = await loadActionPack(prisma, { hypothesisId: decision.hypothesis_id, decisionId: decision.id, stepIndex }).catch(() => null);
      versionId = pack?.version?.id ?? '';
      if (!versionId) {
        report.copies.unknown.push({ id: r.subject_id, reason: 'card_unreadable', detail: 'no copy version' });
        continue;
      }
    }
    await record(prisma, {
      decisionId: decision.id,
      hypothesisId: decision.hypothesis_id,
      personaId: decision.persona_id,
      accountName: decision.account_name,
      sequenceVersionId: versionId,
      stepIndex,
      senderIdentity: process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() ?? '',
      match: { kind: 'match', message: { id: m.id, threadId: m.threadId ?? '', to: m.to, subject: m.subject, sentAt: m.internalDate.toISOString(), text: '', rfcMessageId: null }, matchedOn: ['recipient', 'after_copy', 'copies_reconcile'] },
      actor,
      now: input.now,
      ownerStatement: null,
    });
    report.copies.reconciled += 1;
  }
  return report;
}
