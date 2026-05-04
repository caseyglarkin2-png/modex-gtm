export const SPRINT11_EVENT_REQUIRED_IDS = [
  'send_id',
  'send_job_id',
  'content_version_id',
  'variant_id',
  'account_id',
  'campaign_id',
  'operator_action_id',
  'deal_id',
] as const;

export type Sprint11EventRequiredId = (typeof SPRINT11_EVENT_REQUIRED_IDS)[number];

export type EventContract = {
  version: 'v1';
  requiredIds: Sprint11EventRequiredId[];
};

export const EVENT_CONTRACT_V1: EventContract = {
  version: 'v1',
  requiredIds: [...SPRINT11_EVENT_REQUIRED_IDS],
};

export type AttributionWindowContract = {
  firstTouchDays: number;
  stageProgressionDays: number;
  closeWindowDays: number;
  dedupeKey: readonly ['deal_id', 'stage_entered_at'];
};

export const DEAL_ATTRIBUTION_CONTRACT_V1: AttributionWindowContract = {
  firstTouchDays: 90,
  stageProgressionDays: 120,
  closeWindowDays: 180,
  dedupeKey: ['deal_id', 'stage_entered_at'],
};

export type CoverageGateThresholds = {
  minCompaniesImportedPct: number;
  minContactsLinkedPct: number;
  minContactsEnrichedPct: number;
  minSendReadyPct: number;
  minAttributablePct: number;
  maxUnresolvedConflictPct: number;
  maxStaleContactPct: number;
};

export const COVERAGE_GATE_THRESHOLDS_V1: CoverageGateThresholds = {
  minCompaniesImportedPct: 0.7,
  minContactsLinkedPct: 0.6,
  minContactsEnrichedPct: 0.55,
  minSendReadyPct: 0.45,
  minAttributablePct: 0.5,
  maxUnresolvedConflictPct: 0.1,
  maxStaleContactPct: 0.2,
};

export type KpiClaimabilityThresholds = {
  minSamplePerSegment: number;
  minAttributionCompletenessPct: number;
  maxNullKeyRatePct: number;
  confidenceFloorPct: number;
};

export const KPI_CLAIMABILITY_THRESHOLDS_V1: KpiClaimabilityThresholds = {
  minSamplePerSegment: 30,
  minAttributionCompletenessPct: 0.8,
  maxNullKeyRatePct: 0.05,
  confidenceFloorPct: 0.8,
};

export type KpiClaimabilityInput = {
  samplePerSegment: number;
  attributionCompletenessPct: number;
  nullKeyRatePct: number;
  confidencePct: number;
};

export type KpiClaimabilityResult = {
  claimable: boolean;
  reasons: string[];
};

export function evaluateKpiClaimability(
  input: KpiClaimabilityInput,
  thresholds: KpiClaimabilityThresholds = KPI_CLAIMABILITY_THRESHOLDS_V1,
): KpiClaimabilityResult {
  const reasons: string[] = [];
  if (input.samplePerSegment < thresholds.minSamplePerSegment) {
    reasons.push('sample_below_threshold');
  }
  if (input.attributionCompletenessPct < thresholds.minAttributionCompletenessPct) {
    reasons.push('attribution_incomplete');
  }
  if (input.nullKeyRatePct > thresholds.maxNullKeyRatePct) {
    reasons.push('null_key_rate_high');
  }
  if (input.confidencePct < thresholds.confidenceFloorPct) {
    reasons.push('confidence_below_floor');
  }
  return { claimable: reasons.length === 0, reasons };
}
