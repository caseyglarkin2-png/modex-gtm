import { describe, expect, it } from 'vitest';
import { decideMerge, type MergeInput } from '@/lib/enrichment/merge-policy';

function base(overrides: Partial<MergeInput> = {}): MergeInput {
  return {
    existingValue: 'Director, Distribution',
    candidateValue: 'VP Operations',
    existingSource: 'hubspot',
    candidateSource: 'apollo',
    existingConfidence: 0.7,
    candidateConfidence: 0.9,
    minConfidenceForOverwrite: 0.8,
    existingUpdatedAt: new Date('2026-04-01T00:00:00Z'),
    candidateUpdatedAt: new Date('2026-04-02T00:00:00Z'),
    ...overrides,
  };
}

describe('enrichment merge policy', () => {
  it('accepts candidate when existing is empty', () => {
    expect(decideMerge(base({ existingValue: null }))).toBe('accept_candidate');
  });

  it('rejects empty candidate values', () => {
    expect(decideMerge(base({ candidateValue: '   ' }))).toBe('reject_candidate');
  });

  it('keeps existing when candidate confidence is below threshold', () => {
    expect(decideMerge(base({ candidateConfidence: 0.6 }))).toBe('keep_existing');
  });

  it('keeps manual existing source even with high-confidence candidate', () => {
    expect(decideMerge(base({ existingSource: 'manual', candidateConfidence: 0.95 }))).toBe('keep_existing');
  });

  it('accepts candidate when confidence is higher', () => {
    expect(decideMerge(base({ existingConfidence: 0.5, candidateConfidence: 0.85 }))).toBe('accept_candidate');
  });

  it('uses recency tie-breaker when confidence is equal', () => {
    expect(
      decideMerge(
        base({
          existingConfidence: 0.9,
          candidateConfidence: 0.9,
          existingUpdatedAt: new Date('2026-04-01T00:00:00Z'),
          candidateUpdatedAt: new Date('2026-04-03T00:00:00Z'),
        }),
      ),
    ).toBe('accept_candidate');
  });
});
