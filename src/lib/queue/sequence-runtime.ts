/**
 * Sequence runtime: the DB-touching glue between a finished send and the next
 * decision in a sequence run. Pure step math lives in `./sequence`; this module
 * reads/writes DraftQueueItem rows. It is invoked by the send CALLERS after
 * `sendQueueItem` returns — never inside `sendQueueItem` itself, so that send
 * seam stays free of follow-up side effects.
 */
import { randomUUID } from 'node:crypto';
import { STATUS } from './types';
import { nextStepSchedule, type SequenceStep } from './sequence';
import { clampToWindow, DEFAULT_WINDOW } from './schedule';
import { isGapOsEnabled } from '../gap/flags';

/** After a SENT step, create the next step's DraftQueueItem (if any). Bypasses
 *  dedup on purpose — a sequence intentionally re-contacts the same recipient.
 *  Returns the new item id or null. */
export async function scheduleNextStep(prisma: any, item: any): Promise<number | null> {
  if (!item.sequence_id || item.step_index == null) return null;
  const seq = await prisma.sequence.findUnique({ where: { id: item.sequence_id } });
  if (!seq) return null;
  const steps = seq.steps as SequenceStep[];
  // bounce gate: if the step we just sent bounced, do not follow up
  let priorBounced = false;
  if (item.email_log_id) {
    const log = await prisma.emailLog.findUnique({
      where: { id: item.email_log_id },
      select: { bounce_type: true },
    });
    priorBounced = !!log?.bounce_type;
  }
  const next = nextStepSchedule(steps, item.step_index, item.sent_at ?? new Date(), {
    priorBounced,
  });
  if (!next) return null;
  // GAP OS: carry the immutable version pin forward so every step of a run is
  // attributed to the same SequenceVersion (spec 5.3). Flag off, or a legacy
  // item without a pin: the created row is exactly what it was before.
  const versionPin =
    isGapOsEnabled() && item.sequence_version_id
      ? { sequence_version_id: item.sequence_version_id }
      : {};
  const created = await prisma.draftQueueItem.create({
    data: {
      ...versionPin,
      to_email: item.to_email,
      account_name: item.account_name,
      persona_name: item.persona_name,
      persona_id: item.persona_id,
      owner: item.owner,
      created_by: item.owner,
      subject: next.step.subjectTemplate || item.subject,
      body: next.step.bodyTemplate || item.body,
      image_url: item.image_url,
      status: STATUS.approved,
      approved_at: new Date(),
      scheduled_for: clampToWindow(next.scheduledFor, DEFAULT_WINDOW),
      sequence_id: item.sequence_id,
      sequence_run_id: item.sequence_run_id,
      step_index: next.step.stepIndex,
      parent_item_id: item.id,
      idempotency_key: randomUUID(),
    },
    select: { id: true },
  });
  return created.id;
}

/** The statuses a stop may touch: unsent AND unclaimed. A `sending` row has
 *  been claimed by a worker; it is left alone and stays under the reply-pause
 *  guard and the wire gates in send-deps, exactly as before. */
const STOPPABLE_STATUSES = [STATUS.draft, STATUS.approved];

/** GAP OS (S2-T2): stop one sequence run by marking its unsent items skipped
 *  with `sequence_stopped:<reason>`. Returns the number of rows marked.
 *  Empty run id: 0, no DB call. */
export async function stopRun(prisma: any, sequenceRunId: string, reason: string): Promise<number> {
  if (!sequenceRunId) return 0;
  const r = await prisma.draftQueueItem.updateMany({
    where: {
      sequence_run_id: sequenceRunId,
      status: { in: STOPPABLE_STATUSES },
    },
    data: { status: STATUS.skipped, skipped_reason: `sequence_stopped:${reason}` },
  });
  return r.count;
}

/** GAP OS (S2-T2): stop EVERY sequence run addressed to one recipient (a
 *  do_not_contact disposition, an unsubscribe). Same predicate as stopRun on
 *  the normalized address; only rows that belong to a run (non-null
 *  sequence_run_id) are touched, so one-off drafts are never swept up.
 *  Blank address: 0, no DB call. */
export async function stopRunsForRecipient(
  prisma: any,
  toEmail: string,
  reason: string,
): Promise<number> {
  const email = (toEmail ?? '').trim().toLowerCase();
  if (!email) return 0;
  const r = await prisma.draftQueueItem.updateMany({
    where: {
      to_email: email,
      sequence_run_id: { not: null },
      status: { in: STOPPABLE_STATUSES },
    },
    data: { status: STATUS.skipped, skipped_reason: `sequence_stopped:${reason}` },
  });
  return r.count;
}

/** Cancel the not-yet-sent remainder of a sequence run (recipient replied/opted out).
 *
 *  Flag OFF (GAP_OS_ENABLED unset): today's behavior, byte for byte. The unsent
 *  rows are deleted with the same where clause as before.
 *
 *  Flag ON: stop, do not delete (delegates to stopRun). Why: the deleted rows
 *  were the only evidence that a run had been stopped, and why. Once they were
 *  gone, nothing in the Draft Queue could say "this run ended because the
 *  recipient replied" versus "this run never had a step 2". Marking them
 *  `skipped` with `sequence_stopped:<reason>` keeps that evidence in the row
 *  itself. It is safe on the same two axes delete was: `skipped` is already a
 *  terminal status for the partial unique index `draft_queue_active_recipient`
 *  (WHERE status NOT IN sent, skipped, failed), so the recipient unlocks the
 *  same instant it did under delete; and the outbox already renders
 *  `skipped_reason` on skipped rows, so the reason is visible with no UI change. */
export async function cancelDownstream(
  prisma: any,
  sequenceRunId: string,
  reason?: string,
): Promise<number> {
  if (!sequenceRunId) return 0;
  if (isGapOsEnabled()) {
    return stopRun(prisma, sequenceRunId, reason ?? 'unknown');
  }
  const r = await prisma.draftQueueItem.deleteMany({
    where: {
      sequence_run_id: sequenceRunId,
      status: { notIn: [STATUS.sent, STATUS.sending] },
    },
  });
  return r.count;
}

/** Caller hook: run after sendQueueItem returns, given the loaded item + outcome. */
export async function onSendOutcome(
  prisma: any,
  item: any,
  outcome: { status: string; skippedReason?: string },
): Promise<void> {
  if (outcome.status === STATUS.sent) {
    await scheduleNextStep(prisma, item);
    return;
  }
  if (
    outcome.status === STATUS.skipped &&
    item.sequence_run_id &&
    ['in_thread', 'unsubscribed', 'replied'].includes(outcome.skippedReason ?? '')
  ) {
    await cancelDownstream(prisma, item.sequence_run_id, outcome.skippedReason);
  }
}
