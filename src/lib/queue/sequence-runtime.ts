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
  const created = await prisma.draftQueueItem.create({
    data: {
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

/** Cancel the not-yet-sent remainder of a sequence run (recipient replied/opted out). */
export async function cancelDownstream(prisma: any, sequenceRunId: string): Promise<number> {
  if (!sequenceRunId) return 0;
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
    await cancelDownstream(prisma, item.sequence_run_id);
  }
}
