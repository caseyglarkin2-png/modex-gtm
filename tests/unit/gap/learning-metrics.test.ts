import { describe, it, expect } from 'vitest';
import {
  computeFunnel,
  computeHypothesisFunnel,
  computeConversationFunnel,
  breakdownByHypothesisDimension,
  breakdownByConversationDimension,
  dispositionDistribution,
  computeSignalYield,
  rate,
  isLowSample,
  MIN_RELIABLE_SAMPLE,
  type FunnelHypothesis,
  type FunnelConversation,
} from '@/lib/gap/learning/metrics';

function hyp(id: string, status: string): FunnelHypothesis {
  return { id, status };
}

function conv(partial: Partial<FunnelConversation> & { id: string; hypothesisId: string }): FunnelConversation {
  return {
    responseClass: 'problem_confirmed',
    channel: 'email',
    rootCauseConfirmed: false,
    impactAcknowledged: false,
    impactQuantified: false,
    ...partial,
  };
}

describe('rate', () => {
  it('zero denominator returns null value but keeps n and the zero denominator visible', () => {
    const r = rate(0, 0);
    expect(r).toEqual({ value: null, n: 0, numerator: 0, denominator: 0 });
  });

  it('N=1 computes a real rate, not a suppressed one', () => {
    const r = rate(1, 1);
    expect(r.value).toBe(1);
    expect(r.n).toBe(1);
  });

  it('flags low sample below the threshold without hiding the value', () => {
    const r = rate(1, 1);
    expect(r.value).toBe(1);
    expect(isLowSample(r)).toBe(true);
    expect(MIN_RELIABLE_SAMPLE).toBeGreaterThan(1);
  });

  it('does not flag low sample at or above the threshold', () => {
    const r = rate(3, MIN_RELIABLE_SAMPLE);
    expect(isLowSample(r)).toBe(false);
  });
});

describe('computeHypothesisFunnel', () => {
  it('zero denominator when no hypothesis has a substantive conversation', () => {
    const hypotheses = [hyp('h1', 'active')];
    const conversations = [conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'no_answer' })];
    const funnel = computeHypothesisFunnel(hypotheses, conversations);
    expect(funnel.resolutionRate).toEqual({ value: null, n: 0, numerator: 0, denominator: 0 });
  });

  it('an unresolved interaction (active, no verdict) counts in the denominator but not the numerator', () => {
    const hypotheses = [hyp('h1', 'active')];
    const conversations = [conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'timing' })];
    const funnel = computeHypothesisFunnel(hypotheses, conversations);
    expect(funnel.resolutionRate).toEqual({ value: 0, n: 1, numerator: 0, denominator: 1 });
  });

  it('confirmed, partially_confirmed and rejected hypotheses: resolution rate 3/3, precision splits confirmed and partial', () => {
    const hypotheses = [hyp('h1', 'confirmed'), hyp('h2', 'partially_confirmed'), hyp('h3', 'rejected')];
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_partially_confirmed' }),
      conv({ id: 'c3', hypothesisId: 'h3', responseClass: 'problem_rejected' }),
    ];
    const funnel = computeHypothesisFunnel(hypotheses, conversations);
    expect(funnel.resolutionRate).toEqual({ value: 1, n: 3, numerator: 3, denominator: 3 });
    expect(funnel.precision).toEqual({ value: 2 / 3, n: 3, numerator: 2, denominator: 3 });
    expect(funnel.precisionConfirmed).toEqual({ value: 1 / 3, n: 3, numerator: 1, denominator: 3 });
    expect(funnel.precisionPartial).toEqual({ value: 1 / 3, n: 3, numerator: 1, denominator: 3 });
  });

  it('a hypothesis with zero conversations never enters the denominator (denominator correctness)', () => {
    const hypotheses = [hyp('h1', 'confirmed'), hyp('h2', 'draft')];
    const conversations = [conv({ id: 'c1', hypothesisId: 'h1' })];
    const funnel = computeHypothesisFunnel(hypotheses, conversations);
    // h2 has no conversation at all: it must not appear on either side of the ratio.
    expect(funnel.resolutionRate).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
  });

  it('non-substantive-only conversations (no_answer, voicemail, gatekeeper, out_of_office, bounce, no_signal) never inflate the denominator', () => {
    const hypotheses = [hyp('h1', 'active'), hyp('h2', 'confirmed')];
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'no_answer' }),
      conv({ id: 'c2', hypothesisId: 'h1', responseClass: 'voicemail' }),
      conv({ id: 'c3', hypothesisId: 'h1', responseClass: 'gatekeeper' }),
      conv({ id: 'c4', hypothesisId: 'h1', responseClass: 'bounce' }),
      conv({ id: 'c5', hypothesisId: 'h1', responseClass: 'no_signal' }),
      conv({ id: 'c6', hypothesisId: 'h1', responseClass: 'out_of_office' }),
      conv({ id: 'c7', hypothesisId: 'h2', responseClass: 'problem_confirmed' }),
    ];
    const funnel = computeHypothesisFunnel(hypotheses, conversations);
    // Only h2 has a substantive conversation; h1's six non-substantive touches are excluded entirely.
    expect(funnel.resolutionRate).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
  });
});

describe('computeConversationFunnel', () => {
  it('problem resonance rate: problem-confirming over substantive, non-substantive excluded from both sides', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h1', responseClass: 'problem_rejected' }),
      conv({ id: 'c3', hypothesisId: 'h2', responseClass: 'not_priority' }),
      conv({ id: 'c4', hypothesisId: 'h2', responseClass: 'no_answer' }),
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.problemResonanceRate).toEqual({ value: 1 / 3, n: 3, numerator: 1, denominator: 3 });
  });

  it('a hypothesis with two problem-confirming conversations, both flagged rootCauseConfirmed (the query layer\'s deliberate hypothesis-wide fan-out), still bounds the rate at 1', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', rootCauseConfirmed: true }),
      conv({ id: 'c2', hypothesisId: 'h1', responseClass: 'problem_partially_confirmed', rootCauseConfirmed: true }),
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.rootCauseConfirmationRate).toEqual({ value: 1, n: 2, numerator: 2, denominator: 2 });
  });

  it('root cause confirmed counts only among problem-confirming conversations', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', rootCauseConfirmed: true }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_partially_confirmed', rootCauseConfirmed: false }),
      conv({ id: 'c3', hypothesisId: 'h3', responseClass: 'not_priority', rootCauseConfirmed: true }), // not problem-confirming: excluded
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.rootCauseConfirmationRate).toEqual({ value: 0.5, n: 2, numerator: 1, denominator: 2 });
  });

  it('impact acknowledged vs quantified are distinct rates over the same denominator', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', impactAcknowledged: true, impactQuantified: false }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_confirmed', impactAcknowledged: true, impactQuantified: true }),
      conv({ id: 'c3', hypothesisId: 'h3', responseClass: 'problem_confirmed', impactAcknowledged: false, impactQuantified: false }),
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.impactAcknowledgmentRate).toEqual({ value: 2 / 3, n: 3, numerator: 2, denominator: 3 });
    expect(funnel.impactQuantificationRate).toEqual({ value: 1 / 3, n: 3, numerator: 1, denominator: 3 });
  });

  it('meeting accepted: problem to meeting rate is per hypothesis, not per conversation', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h1', responseClass: 'meeting_accepted' }),
      // h1 has two conversations feeding the same hypothesis: must not double count.
      conv({ id: 'c1b', hypothesisId: 'h1', responseClass: 'meeting_accepted' }),
      conv({ id: 'c3', hypothesisId: 'h2', responseClass: 'problem_confirmed' }), // no meeting: 0 for h2
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.problemToMeetingRate).toEqual({ value: 0.5, n: 2, numerator: 1, denominator: 2 });
  });

  it('meeting held WITH a qualified problem counts toward meeting-to-qualified-problem', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', channel: 'meeting' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'not_priority', channel: 'meeting' }),
    ];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.meetingToQualifiedProblemRate).toEqual({ value: 0.5, n: 2, numerator: 1, denominator: 2 });
  });

  it('meeting held WITHOUT a qualified problem: denominator counts it, numerator does not', () => {
    const conversations = [conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'existing_solution', channel: 'meeting' })];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.meetingToQualifiedProblemRate).toEqual({ value: 0, n: 1, numerator: 0, denominator: 1 });
  });

  it('no meetings held: zero denominator, not a fabricated 0', () => {
    const conversations = [conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', channel: 'email' })];
    const funnel = computeConversationFunnel(conversations);
    expect(funnel.meetingToQualifiedProblemRate).toEqual({ value: null, n: 0, numerator: 0, denominator: 0 });
  });
});

describe('a rejected hypothesis keeps precision honest', () => {
  it('resonance and precision are not trivially 100% when a rejection is mixed in', () => {
    const hypotheses = [hyp('h1', 'confirmed'), hyp('h2', 'rejected')];
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_rejected' }),
    ];
    const funnel = computeFunnel(hypotheses, conversations);
    expect(funnel.precision).toEqual({ value: 0.5, n: 2, numerator: 1, denominator: 2 });
    expect(funnel.problemResonanceRate).toEqual({ value: 0.5, n: 2, numerator: 1, denominator: 2 });
  });
});

describe('breakdownByHypothesisDimension', () => {
  it('mixed problem family and persona: each group only sees its own hypotheses and conversations (sequence-version attribution)', () => {
    const hypotheses: Array<FunnelHypothesis & { problemFamily: string; sequenceVersionId: string }> = [
      { id: 'h1', status: 'confirmed', problemFamily: 'hidden_capacity', sequenceVersionId: 'v1' },
      { id: 'h2', status: 'rejected', problemFamily: 'cost_to_ship', sequenceVersionId: 'v2' },
    ];
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_rejected' }),
    ];

    const byFamily = breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.problemFamily);
    const hiddenCapacity = byFamily.find((row) => row.key === 'hidden_capacity');
    const costToShip = byFamily.find((row) => row.key === 'cost_to_ship');
    expect(hiddenCapacity?.funnel.resolutionRate).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
    expect(costToShip?.funnel.resolutionRate).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
    // No leakage: hidden_capacity's precision must not be diluted by cost_to_ship's rejection.
    expect(hiddenCapacity?.funnel.precision).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
    expect(costToShip?.funnel.precision).toEqual({ value: 0, n: 1, numerator: 0, denominator: 1 });

    const byVersion = breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.sequenceVersionId);
    expect(byVersion.find((row) => row.key === 'v1')?.funnel.precision.numerator).toBe(1);
    expect(byVersion.find((row) => row.key === 'v2')?.funnel.precision.numerator).toBe(0);
  });

  it('a null key excludes the hypothesis from every group rather than an implicit "unknown" bucket', () => {
    const hypotheses: Array<FunnelHypothesis & { family: string | null }> = [
      { id: 'h1', status: 'confirmed', family: 'hidden_capacity' },
      { id: 'h2', status: 'confirmed', family: null },
    ];
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_confirmed' }),
    ];
    const rows = breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.family);
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('hidden_capacity');
  });
});

describe('breakdownByConversationDimension', () => {
  it('groups by channel without touching hypothesis-level rates', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed', channel: 'call' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'not_priority', channel: 'email' }),
    ];
    const rows = breakdownByConversationDimension(conversations, (c) => c.channel);
    const call = rows.find((r) => r.key === 'call');
    const email = rows.find((r) => r.key === 'email');
    expect(call?.funnel.problemResonanceRate).toEqual({ value: 1, n: 1, numerator: 1, denominator: 1 });
    expect(email?.funnel.problemResonanceRate).toEqual({ value: 0, n: 1, numerator: 0, denominator: 1 });
  });
});

describe('dispositionDistribution', () => {
  it('counts every response class present, omitting classes with zero rows', () => {
    const conversations = [
      conv({ id: 'c1', hypothesisId: 'h1', responseClass: 'problem_confirmed' }),
      conv({ id: 'c2', hypothesisId: 'h2', responseClass: 'problem_confirmed' }),
      conv({ id: 'c3', hypothesisId: 'h3', responseClass: 'not_priority' }),
    ];
    expect(dispositionDistribution(conversations)).toEqual([
      { responseClass: 'problem_confirmed', count: 2 },
      { responseClass: 'not_priority', count: 1 },
    ]);
  });
});

describe('computeSignalYield', () => {
  it('joins signal counts to hypothesis counts by type independently, with a zero-hypothesis type visible', () => {
    const rows = computeSignalYield(new Map([['acquisition', 4], ['job_posting', 2]]), ['acquisition']);
    const acquisition = rows.find((r) => r.signalType === 'acquisition');
    const jobPosting = rows.find((r) => r.signalType === 'job_posting');
    expect(acquisition).toEqual({ signalType: 'acquisition', signalCount: 4, hypothesisCount: 1, rate: rate(1, 4) });
    expect(jobPosting).toEqual({ signalType: 'job_posting', signalCount: 2, hypothesisCount: 0, rate: rate(0, 2) });
  });
});
