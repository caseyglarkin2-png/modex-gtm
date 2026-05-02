import { afterEach, describe, expect, it } from 'vitest';
import { getEnrichmentThresholds } from '@/lib/enrichment/config';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('enrichment thresholds config', () => {
  it('uses defaults when env is absent', () => {
    delete process.env.ENRICH_MIN_CONFIDENCE_OVERWRITE;
    delete process.env.ENRICH_STALE_DAYS_PERSON;
    delete process.env.ENRICH_STALE_DAYS_COMPANY;

    expect(getEnrichmentThresholds()).toEqual({
      minConfidenceForOverwrite: 0.8,
      staleDaysPerson: 30,
      staleDaysCompany: 45,
    });
  });

  it('parses numeric env values', () => {
    process.env = {
      ...process.env,
      ENRICH_MIN_CONFIDENCE_OVERWRITE: '0.9',
      ENRICH_STALE_DAYS_PERSON: '14',
      ENRICH_STALE_DAYS_COMPANY: '60',
    };

    expect(getEnrichmentThresholds()).toEqual({
      minConfidenceForOverwrite: 0.9,
      staleDaysPerson: 14,
      staleDaysCompany: 60,
    });
  });
});
