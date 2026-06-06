import { describe, expect, it } from 'vitest';

import {
  nextStepSchedule,
  replyPauseDecision,
  type SequenceStep,
} from '@/lib/queue/sequence';

const DAY_MS = 86_400_000;

describe('nextStepSchedule', () => {
  const steps: SequenceStep[] = [
    { stepIndex: 0, delayDays: 0 },
    { stepIndex: 1, delayDays: 3 },
    { stepIndex: 2, delayDays: 5 },
  ];
  const sentAt = new Date('2026-06-05T12:00:00.000Z');

  it('schedules the next step at sentAt + nextStep.delayDays (exact ms)', () => {
    const result = nextStepSchedule(steps, 0, sentAt);
    expect(result).not.toBeNull();
    expect(result!.step.stepIndex).toBe(1);
    expect(result!.scheduledFor.getTime()).toBe(sentAt.getTime() + 3 * DAY_MS);
  });

  it('returns null when the current step is the last step', () => {
    expect(nextStepSchedule(steps, 2, sentAt)).toBeNull();
  });

  it('returns null when the prior step bounced', () => {
    expect(nextStepSchedule(steps, 0, sentAt, { priorBounced: true })).toBeNull();
  });

  it('finds the next step by stepIndex even when array order differs', () => {
    const outOfOrder: SequenceStep[] = [
      { stepIndex: 0, delayDays: 0 },
      { stepIndex: 2, delayDays: 5 },
      { stepIndex: 1, delayDays: 3 },
    ];
    const result = nextStepSchedule(outOfOrder, 0, sentAt);
    expect(result).not.toBeNull();
    expect(result!.step.stepIndex).toBe(1);
    expect(result!.step.delayDays).toBe(3);
    expect(result!.scheduledFor.getTime()).toBe(sentAt.getTime() + 3 * DAY_MS);
  });
});

describe('replyPauseDecision', () => {
  const queuedAt = new Date('2026-06-05T12:00:00.000Z');

  it('pauses when an inbound reply arrived after queuing', () => {
    const inboundSince = new Date(queuedAt.getTime() + 1000);
    expect(replyPauseDecision({ inboundSince, queuedAt })).toEqual({ pause: true });
  });

  it('does not pause when the inbound reply predates queuing', () => {
    const inboundSince = new Date(queuedAt.getTime() - 1000);
    expect(replyPauseDecision({ inboundSince, queuedAt })).toEqual({ pause: false });
  });

  it('does not pause when there is no inbound reply', () => {
    expect(replyPauseDecision({ inboundSince: null, queuedAt })).toEqual({ pause: false });
  });

  it('does not pause when the inbound reply is exactly at queue time (strictly greater)', () => {
    const inboundSince = new Date(queuedAt.getTime());
    expect(replyPauseDecision({ inboundSince, queuedAt })).toEqual({ pause: false });
  });
});
