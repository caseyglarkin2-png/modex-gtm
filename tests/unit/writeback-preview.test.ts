import { describe, expect, it } from 'vitest';
import { buildWritebackPreview } from '@/lib/enrichment/writeback-preview';

describe('writeback preview builder', () => {
  it('computes field-level merge decisions', () => {
    const preview = buildWritebackPreview({
      existing: {
        job_title: {
          value: 'Director of Logistics',
          source: 'hubspot',
          confidence: 0.7,
          updatedAt: new Date('2026-05-01T00:00:00Z'),
        },
      },
      candidate: {
        job_title: {
          value: 'VP Operations',
          source: 'apollo',
          confidence: 0.92,
          updatedAt: new Date('2026-05-02T00:00:00Z'),
        },
        linkedin_url: {
          value: 'https://linkedin.com/in/example',
          source: 'apollo',
          confidence: 0.9,
          updatedAt: new Date('2026-05-02T00:00:00Z'),
        },
      },
      minConfidenceForOverwrite: 0.8,
    });

    expect(preview).toEqual([
      expect.objectContaining({
        field: 'job_title',
        decision: 'accept_candidate',
      }),
      expect.objectContaining({
        field: 'linkedin_url',
        decision: 'accept_candidate',
      }),
    ]);
  });
});
