import { describe, expect, it } from 'vitest';
import { buildPlaybookTags, computePlaybookConfidence, computePlaybookScore } from '@/lib/revops/playbook-library';

describe('playbook library scoring', () => {
  it('builds normalized tags', () => {
    expect(buildPlaybookTags({
      industry: 'Manufacturing',
      persona: 'VP Ops',
      stage: 'Evaluation',
      motion: 'Outbound',
    })).toEqual(['manufacturing', 'vp ops', 'evaluation', 'outbound']);
  });

  it('computes confidence and score', () => {
    expect(computePlaybookConfidence(0)).toBe(0);
    expect(computePlaybookConfidence(80)).toBe(1);
    const score = computePlaybookScore({
      usageCount: 20,
      replyRate: 0.12,
      meetingRate: 0.06,
      sampleSize: 40,
      outcomeWeight: 1.2,
    });
    expect(score).toBeGreaterThan(0);
  });
});
