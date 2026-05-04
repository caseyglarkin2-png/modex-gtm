export type VariantPerformance = {
  variantId: string;
  variantKey: string;
  sent: number;
  replies: number;
  meetings: number;
};

export type WinnerGateInput = {
  variants: VariantPerformance[];
  primaryMetric: 'reply_rate' | 'meeting_rate' | 'positive_reply_rate';
  minSampleSize: number;
  minConfidenceDeltaPct: number;
  holdoutPresent: boolean;
};

export type WinnerCandidateResult = {
  status: 'insufficient_sample' | 'holdout_missing' | 'no_candidate' | 'candidate';
  candidateVariantKey: string | null;
  reason: string;
};

function metricValue(variant: VariantPerformance, metric: WinnerGateInput['primaryMetric']): number {
  if (variant.sent <= 0) return 0;
  if (metric === 'meeting_rate') return variant.meetings / variant.sent;
  return variant.replies / variant.sent;
}

export function evaluateWinnerCandidate(input: WinnerGateInput): WinnerCandidateResult {
  if (!input.holdoutPresent) {
    return { status: 'holdout_missing', candidateVariantKey: null, reason: 'Control/holdout group required' };
  }
  if (input.variants.some((variant) => variant.sent < input.minSampleSize)) {
    return { status: 'insufficient_sample', candidateVariantKey: null, reason: 'Minimum sample size not met' };
  }

  const scored = input.variants
    .map((variant) => ({
      ...variant,
      metric: metricValue(variant, input.primaryMetric),
    }))
    .sort((left, right) => right.metric - left.metric);

  if (scored.length < 2) {
    return { status: 'no_candidate', candidateVariantKey: null, reason: 'Need at least two variants' };
  }

  const delta = scored[0].metric - scored[1].metric;
  if (delta < input.minConfidenceDeltaPct) {
    return { status: 'no_candidate', candidateVariantKey: null, reason: 'Delta below confidence threshold' };
  }

  return {
    status: 'candidate',
    candidateVariantKey: scored[0].variantKey,
    reason: 'Meets sample, holdout, and confidence delta thresholds',
  };
}
