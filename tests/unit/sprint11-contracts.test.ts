import { describe, expect, it } from 'vitest';
import {
  COVERAGE_GATE_THRESHOLDS_V1,
  DEAL_ATTRIBUTION_CONTRACT_V1,
  EVENT_CONTRACT_V1,
  KPI_CLAIMABILITY_THRESHOLDS_V1,
  evaluateKpiClaimability,
} from '@/lib/revops/sprint11-contracts';

describe('sprint 11 contracts', () => {
  it('defines required event ids contract', () => {
    expect(EVENT_CONTRACT_V1.version).toBe('v1');
    expect(EVENT_CONTRACT_V1.requiredIds).toEqual([
      'send_id',
      'send_job_id',
      'content_version_id',
      'variant_id',
      'account_id',
      'campaign_id',
      'operator_action_id',
      'deal_id',
    ]);
  });

  it('defines attribution windows and dedupe key', () => {
    expect(DEAL_ATTRIBUTION_CONTRACT_V1.firstTouchDays).toBeGreaterThan(0);
    expect(DEAL_ATTRIBUTION_CONTRACT_V1.stageProgressionDays).toBeGreaterThan(0);
    expect(DEAL_ATTRIBUTION_CONTRACT_V1.closeWindowDays).toBeGreaterThan(0);
    expect(DEAL_ATTRIBUTION_CONTRACT_V1.dedupeKey).toEqual(['deal_id', 'stage_entered_at']);
  });

  it('evaluates claimability thresholds deterministically', () => {
    const pass = evaluateKpiClaimability({
      samplePerSegment: KPI_CLAIMABILITY_THRESHOLDS_V1.minSamplePerSegment,
      attributionCompletenessPct: KPI_CLAIMABILITY_THRESHOLDS_V1.minAttributionCompletenessPct,
      nullKeyRatePct: KPI_CLAIMABILITY_THRESHOLDS_V1.maxNullKeyRatePct,
      confidencePct: KPI_CLAIMABILITY_THRESHOLDS_V1.confidenceFloorPct,
    });
    expect(pass.claimable).toBe(true);
    expect(pass.reasons).toEqual([]);

    const fail = evaluateKpiClaimability({
      samplePerSegment: 10,
      attributionCompletenessPct: 0.2,
      nullKeyRatePct: 0.2,
      confidencePct: 0.4,
    });
    expect(fail.claimable).toBe(false);
    expect(fail.reasons).toContain('sample_below_threshold');
    expect(fail.reasons).toContain('attribution_incomplete');
    expect(fail.reasons).toContain('null_key_rate_high');
    expect(fail.reasons).toContain('confidence_below_floor');
  });

  it('coverage thresholds are bounded for fail-close evaluation', () => {
    expect(COVERAGE_GATE_THRESHOLDS_V1.minCompaniesImportedPct).toBeGreaterThan(0);
    expect(COVERAGE_GATE_THRESHOLDS_V1.maxUnresolvedConflictPct).toBeLessThan(1);
    expect(COVERAGE_GATE_THRESHOLDS_V1.maxStaleContactPct).toBeLessThan(1);
  });
});
