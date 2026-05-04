import { describe, expect, it } from 'vitest';
import { evaluateWinnerCandidate } from '@/lib/experiments/winner';

describe('experiment winner gate', () => {
  it('blocks winner when holdout is missing', () => {
    const result = evaluateWinnerCandidate({
      variants: [
        { variantId: 'a', variantKey: 'control', sent: 60, replies: 8, meetings: 2 },
        { variantId: 'b', variantKey: 'challenger', sent: 60, replies: 12, meetings: 4 },
      ],
      primaryMetric: 'reply_rate',
      minSampleSize: 50,
      minConfidenceDeltaPct: 0.03,
      holdoutPresent: false,
    });
    expect(result.status).toBe('holdout_missing');
  });

  it('blocks winner when sample size is insufficient', () => {
    const result = evaluateWinnerCandidate({
      variants: [
        { variantId: 'a', variantKey: 'control', sent: 10, replies: 1, meetings: 0 },
        { variantId: 'b', variantKey: 'challenger', sent: 10, replies: 3, meetings: 1 },
      ],
      primaryMetric: 'reply_rate',
      minSampleSize: 20,
      minConfidenceDeltaPct: 0.03,
      holdoutPresent: true,
    });
    expect(result.status).toBe('insufficient_sample');
  });

  it('returns candidate when gate thresholds are met', () => {
    const result = evaluateWinnerCandidate({
      variants: [
        { variantId: 'a', variantKey: 'control', sent: 100, replies: 8, meetings: 1 },
        { variantId: 'b', variantKey: 'challenger', sent: 100, replies: 18, meetings: 3 },
      ],
      primaryMetric: 'reply_rate',
      minSampleSize: 50,
      minConfidenceDeltaPct: 0.03,
      holdoutPresent: true,
    });
    expect(result).toEqual({
      status: 'candidate',
      candidateVariantKey: 'challenger',
      reason: 'Meets sample, holdout, and confidence delta thresholds',
    });
  });
});
