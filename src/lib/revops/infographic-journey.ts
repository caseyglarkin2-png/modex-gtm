import { z } from 'zod';

export const INFOGRAPHIC_TYPES = [
  'cold_hook',
  'diagnostic_gap',
  'value_path',
  'implementation_plan',
  'proof_snapshot',
  'executive_roi',
] as const;

export const JOURNEY_STAGE_INTENTS = [
  'cold',
  'engaged',
  'discovery',
  'evaluation',
  'proposal',
  'customer',
] as const;

export const INFOGRAPHIC_TYPE_BY_STAGE = {
  cold: 'cold_hook',
  engaged: 'diagnostic_gap',
  discovery: 'value_path',
  evaluation: 'implementation_plan',
  proposal: 'proof_snapshot',
  customer: 'executive_roi',
} as const satisfies Record<JourneyStageIntent, InfographicType>;

export const INFOGRAPHIC_LABELS: Record<InfographicType, string> = {
  cold_hook: 'Cold Hook',
  diagnostic_gap: 'Diagnostic Gap',
  value_path: 'Value Path',
  implementation_plan: 'Implementation Plan',
  proof_snapshot: 'Proof Snapshot',
  executive_roi: 'Executive ROI',
};

export const STAGE_LABELS: Record<JourneyStageIntent, string> = {
  cold: 'Cold',
  engaged: 'Engaged',
  discovery: 'Discovery',
  evaluation: 'Evaluation',
  proposal: 'Proposal',
  customer: 'Customer',
};

export const BUNDLE_PRESET_PATHS = {
  cold_to_meeting: ['cold', 'engaged', 'discovery'],
  meeting_to_proposal: ['discovery', 'evaluation', 'proposal'],
  proposal_to_close: ['evaluation', 'proposal', 'customer'],
} as const;

export const INFOGRAPHIC_EVENT_NAMES = [
  'bundle_created',
  'bundle_published',
  'bundle_sent',
  'bundle_engaged',
  'journey_transition',
] as const;

export type InfographicType = (typeof INFOGRAPHIC_TYPES)[number];
export type JourneyStageIntent = (typeof JOURNEY_STAGE_INTENTS)[number];
export type BundlePresetPathId = keyof typeof BUNDLE_PRESET_PATHS;
export type InfographicEventName = (typeof INFOGRAPHIC_EVENT_NAMES)[number];

const InfographicTypeSchema = z.enum(INFOGRAPHIC_TYPES);
const JourneyStageIntentSchema = z.enum(JOURNEY_STAGE_INTENTS);

export const InfographicInstrumentationSchema = z.object({
  infographic_type: InfographicTypeSchema,
  stage_intent: JourneyStageIntentSchema,
  bundle_id: z.string().min(1).max(128).optional().nullable(),
  sequence_position: z.number().int().min(1).max(50).optional().nullable(),
});

export type InfographicInstrumentation = z.infer<typeof InfographicInstrumentationSchema>;

export type ParsedInfographicMetadata = {
  infographicType: InfographicType;
  stageIntent: JourneyStageIntent;
  bundleId: string | null;
  sequencePosition: number | null;
};

const DEFAULT_METADATA: ParsedInfographicMetadata = {
  infographicType: 'cold_hook',
  stageIntent: 'cold',
  bundleId: null,
  sequencePosition: null,
};

function toObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function parseInfographicMetadata(metadata: unknown): ParsedInfographicMetadata {
  const root = toObject(metadata);
  const infographic = toObject(root.infographic);

  const candidateType = infographic.infographic_type ?? infographic.type;
  const candidateStage = infographic.stage_intent ?? infographic.stage;
  const candidateBundleId = infographic.bundle_id;
  const candidateSequence = infographic.sequence_position;

  const parsedType = InfographicTypeSchema.safeParse(candidateType);
  const parsedStage = JourneyStageIntentSchema.safeParse(candidateStage);
  const parsedSequence = typeof candidateSequence === 'number' && Number.isInteger(candidateSequence) && candidateSequence > 0
    ? candidateSequence
    : null;
  const parsedBundleId = typeof candidateBundleId === 'string' && candidateBundleId.trim().length > 0
    ? candidateBundleId.trim()
    : null;

  return {
    infographicType: parsedType.success ? parsedType.data : DEFAULT_METADATA.infographicType,
    stageIntent: parsedStage.success ? parsedStage.data : DEFAULT_METADATA.stageIntent,
    bundleId: parsedBundleId,
    sequencePosition: parsedSequence,
  };
}

export function buildInfographicMetadata(input: Partial<InfographicInstrumentation> = {}): ParsedInfographicMetadata {
  const parsed = InfographicInstrumentationSchema.safeParse({
    infographic_type: input.infographic_type ?? DEFAULT_METADATA.infographicType,
    stage_intent: input.stage_intent ?? DEFAULT_METADATA.stageIntent,
    bundle_id: input.bundle_id ?? null,
    sequence_position: input.sequence_position ?? null,
  });
  if (!parsed.success) return DEFAULT_METADATA;
  return {
    infographicType: parsed.data.infographic_type,
    stageIntent: parsed.data.stage_intent,
    bundleId: parsed.data.bundle_id ?? null,
    sequencePosition: parsed.data.sequence_position ?? null,
  };
}

export function buildInfographicEvent(
  eventName: InfographicEventName,
  input: Partial<InfographicInstrumentation> & {
    accountName: string;
    campaignId?: number | null;
    reasonCode?: string | null;
    signalId?: string | null;
    dealId?: string | null;
  },
) {
  const instrumentation = buildInfographicMetadata(input);
  return {
    eventName,
    accountName: input.accountName,
    campaignId: input.campaignId ?? null,
    reasonCode: input.reasonCode ?? null,
    signalId: input.signalId ?? null,
    dealId: input.dealId ?? null,
    ...instrumentation,
    createdAtIso: new Date().toISOString(),
  };
}

export function recommendInfographicType(input: {
  stageIntent: JourneyStageIntent;
  recentOutcomes?: string[];
  previousType?: InfographicType | null;
}): { recommended: InfographicType; alternates: InfographicType[]; rationale: string } {
  const base = INFOGRAPHIC_TYPE_BY_STAGE[input.stageIntent];
  const outcomes = new Set((input.recentOutcomes ?? []).map((value) => value.toLowerCase()));

  if (outcomes.has('wrong-person')) {
    return {
      recommended: 'diagnostic_gap',
      alternates: ['cold_hook', 'value_path'],
      rationale: 'Recent wrong-person feedback; lead with diagnostic signal before ROI claims.',
    };
  }

  if (outcomes.has('positive') || outcomes.has('closed-won')) {
    const alternates = Array.from(new Set<InfographicType>(['proof_snapshot', base]));
    return {
      recommended: input.stageIntent === 'proposal' ? 'executive_roi' : base,
      alternates,
      rationale: 'Positive trajectory; bias toward proof and ROI acceleration.',
    };
  }

  if (input.previousType && input.previousType === base) {
    const alternates = INFOGRAPHIC_TYPES.filter((value) => value !== base).slice(0, 2);
    return {
      recommended: base,
      alternates,
      rationale: 'Maintaining stage-default type with alternates to prevent message fatigue.',
    };
  }

  return {
    recommended: base,
    alternates: INFOGRAPHIC_TYPES.filter((value) => value !== base).slice(0, 2),
    rationale: 'Stage-aligned default from infographic taxonomy.',
  };
}

const QUALITY_HINTS: Record<InfographicType, string[]> = {
  cold_hook: ['headline', 'pain', 'hook'],
  diagnostic_gap: ['current state', 'gap', 'impact'],
  value_path: ['before', 'after', 'value path'],
  implementation_plan: ['phase', 'owner', 'timeline'],
  proof_snapshot: ['proof', 'customer', 'result'],
  executive_roi: ['roi', 'cost', 'payback'],
};

export function evaluateInfographicTemplateQuality(type: InfographicType, content: string) {
  const normalized = content.toLowerCase();
  const hints = QUALITY_HINTS[type];
  const matched = hints.filter((hint) => normalized.includes(hint));
  const coverage = hints.length > 0 ? matched.length / hints.length : 0;
  const score = Math.max(0, Math.min(100, Math.round(50 + coverage * 50)));
  const missing = hints.filter((hint) => !matched.includes(hint));
  return {
    score,
    matched,
    missing,
    ready: score >= 70,
  };
}

export function buildBundleStageSequence(path: BundlePresetPathId | 'custom', customStages?: JourneyStageIntent[]): JourneyStageIntent[] {
  if (path !== 'custom') return [...BUNDLE_PRESET_PATHS[path]] as JourneyStageIntent[];
  const deduped = Array.from(new Set((customStages ?? []).filter((stage) => JOURNEY_STAGE_INTENTS.includes(stage))));
  return (deduped.length > 0 ? deduped : ['cold', 'engaged', 'discovery']) as JourneyStageIntent[];
}

export function mapStageSequenceToAssets(stages: JourneyStageIntent[]) {
  return stages.map((stage, index) => ({
    stageIntent: stage,
    infographicType: INFOGRAPHIC_TYPE_BY_STAGE[stage],
    sequencePosition: index + 1,
  }));
}

export type JourneyTransitionReason =
  | 'engagement_positive'
  | 'engagement_negative'
  | 'operator_override'
  | 'proposal_requested'
  | 'customer_confirmed'
  | 'stalled';

export function transitionJourneyState(input: {
  fromStage: JourneyStageIntent;
  outcomeLabel?: string | null;
  reasonCode?: JourneyTransitionReason;
}) {
  const outcome = (input.outcomeLabel ?? '').toLowerCase();
  const reasonCode = input.reasonCode ?? null;
  let toStage: JourneyStageIntent = input.fromStage;
  let reason: JourneyTransitionReason = reasonCode ?? 'stalled';

  if (reasonCode === 'operator_override') {
    toStage = input.fromStage;
  } else if (outcome === 'positive' || outcome === 'closed-won' || reasonCode === 'engagement_positive') {
    toStage = input.fromStage === 'customer' ? 'customer' : JOURNEY_STAGE_INTENTS[Math.min(JOURNEY_STAGE_INTENTS.indexOf(input.fromStage) + 1, JOURNEY_STAGE_INTENTS.length - 1)];
    reason = 'engagement_positive';
  } else if (outcome === 'negative' || outcome === 'closed-lost' || reasonCode === 'engagement_negative') {
    const index = JOURNEY_STAGE_INTENTS.indexOf(input.fromStage);
    toStage = JOURNEY_STAGE_INTENTS[Math.max(0, index - 1)];
    reason = 'engagement_negative';
  } else if (reasonCode === 'proposal_requested') {
    toStage = 'proposal';
    reason = 'proposal_requested';
  } else if (reasonCode === 'customer_confirmed') {
    toStage = 'customer';
    reason = 'customer_confirmed';
  }

  return {
    fromStage: input.fromStage,
    toStage,
    reasonCode: reason,
  };
}

export function mapOutcomeToNextInfographic(input: {
  stageIntent: JourneyStageIntent;
  outcomeLabel?: string | null;
}) {
  const transition = transitionJourneyState({
    fromStage: input.stageIntent,
    outcomeLabel: input.outcomeLabel ?? null,
  });
  return {
    nextStage: transition.toStage,
    nextType: INFOGRAPHIC_TYPE_BY_STAGE[transition.toStage],
    reasonCode: transition.reasonCode,
  };
}

export type InfographicPerformanceRow = {
  infographicType: InfographicType;
  stageIntent: JourneyStageIntent;
  sequencePosition: number;
  sends: number;
  engagements: number;
  meetings: number;
  deals: number;
  dealValue: number;
  holdoutSends?: number;
  holdoutEngagements?: number;
};

export function summarizeInfographicPerformance(rows: InfographicPerformanceRow[]) {
  const grouped = new Map<string, InfographicPerformanceRow>();
  rows.forEach((row) => {
    const key = `${row.infographicType}:${row.stageIntent}:${row.sequencePosition}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...row });
      return;
    }
    existing.sends += row.sends;
    existing.engagements += row.engagements;
    existing.meetings += row.meetings;
    existing.deals += row.deals;
    existing.dealValue += row.dealValue;
    existing.holdoutSends = (existing.holdoutSends ?? 0) + (row.holdoutSends ?? 0);
    existing.holdoutEngagements = (existing.holdoutEngagements ?? 0) + (row.holdoutEngagements ?? 0);
  });

  return [...grouped.values()]
    .map((row) => ({
      ...row,
      engagementRate: row.sends > 0 ? row.engagements / row.sends : 0,
      meetingRate: row.sends > 0 ? row.meetings / row.sends : 0,
      confidence: row.sends >= 30 ? 'high' : row.sends >= 10 ? 'medium' : 'low',
    }))
    .sort((left, right) => right.engagementRate - left.engagementRate || right.dealValue - left.dealValue);
}

export function evaluatePromotionCandidate(input: {
  row: ReturnType<typeof summarizeInfographicPerformance>[number];
  holdoutDeltaMin?: number;
  minSends?: number;
  reviewWindowsStable?: number;
}) {
  const minSends = input.minSends ?? 25;
  const holdoutDeltaMin = input.holdoutDeltaMin ?? 0.02;
  const holdoutSends = input.row.holdoutSends ?? 0;
  const holdoutEngagements = input.row.holdoutEngagements ?? 0;
  const holdoutRate = holdoutSends > 0 ? holdoutEngagements / holdoutSends : 0;
  const delta = input.row.engagementRate - holdoutRate;
  const stableWindows = input.reviewWindowsStable ?? 0;

  if (input.row.sends < minSends) {
    return { status: 'insufficient_sample' as const, reason: 'Insufficient send volume for promotion.' };
  }
  if (holdoutSends < 10) {
    return { status: 'holdout_missing' as const, reason: 'Holdout/control sample missing.' };
  }
  if (delta < holdoutDeltaMin) {
    return { status: 'below_holdout' as const, reason: 'Performance delta vs holdout below threshold.' };
  }
  if (stableWindows < 2) {
    return { status: 'stability_pending' as const, reason: 'Requires holdout stability across two review windows.' };
  }
  return { status: 'candidate' as const, reason: 'Meets sample, holdout delta, and stability gate.' };
}

export function detectInfographicDrift(input: {
  currentRate: number;
  baselineRate: number;
  tolerancePct?: number;
}) {
  const tolerancePct = input.tolerancePct ?? 0.15;
  if (input.baselineRate <= 0) return { drifting: false, deltaPct: 0 };
  const deltaPct = (input.baselineRate - input.currentRate) / input.baselineRate;
  return {
    drifting: deltaPct > tolerancePct,
    deltaPct,
  };
}
