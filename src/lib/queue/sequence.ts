/**
 * Pure sequence logic for the Draft Queue.
 *
 * A `Sequence` is an ordered set of steps; a one-time send is a length-1
 * sequence. These helpers contain no DB access — they decide, given a step
 * that just sent (or a queued send), what should happen next.
 */

const DAY_MS = 86_400_000;

export interface SequenceStep {
  stepIndex: number;
  delayDays: number;
  subjectTemplate?: string;
  bodyTemplate?: string;
}

/**
 * The next step to schedule after `currentIndex` just sent at `sentAt`, or
 * null if the sequence is done, the prior step bounced, or there is no next
 * step.
 *
 * The next step is the one whose `stepIndex === currentIndex + 1`; we search
 * by `stepIndex` rather than assuming array order. When found, it is scheduled
 * at `sentAt + step.delayDays` days.
 */
export function nextStepSchedule(
  steps: SequenceStep[],
  currentIndex: number,
  sentAt: Date,
  opts?: { priorBounced?: boolean },
): { step: SequenceStep; scheduledFor: Date } | null {
  if (opts?.priorBounced) {
    return null;
  }

  const step = steps.find((candidate) => candidate.stepIndex === currentIndex + 1);
  if (!step) {
    return null;
  }

  const scheduledFor = new Date(sentAt.getTime() + step.delayDays * DAY_MS);
  return { step, scheduledFor };
}

/**
 * Should a scheduled send be paused because the recipient replied since we
 * queued it? Pause only when an inbound reply strictly post-dates the queue
 * time.
 */
export function replyPauseDecision(args: {
  inboundSince: Date | null;
  queuedAt: Date;
}): { pause: boolean } {
  const { inboundSince, queuedAt } = args;
  const pause = inboundSince !== null && inboundSince.getTime() > queuedAt.getTime();
  return { pause };
}
