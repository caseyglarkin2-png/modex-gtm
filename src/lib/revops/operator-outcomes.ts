import { INFOGRAPHIC_LABELS, mapOutcomeToNextInfographic, type JourneyStageIntent } from '@/lib/revops/infographic-journey';

export const OPERATOR_OUTCOME_TAXONOMY = [
  'positive',
  'neutral',
  'negative',
  'wrong-person',
  'bad-timing',
  'closed-won',
  'closed-lost',
] as const;

export type OperatorOutcomeLabel = (typeof OPERATOR_OUTCOME_TAXONOMY)[number];
export type OutcomeQualityIssueType = 'missing' | 'ambiguous' | 'conflicting';

export type OperatorOutcomeRecord = {
  id: string;
  account_name: string;
  campaign_id: number | null;
  generated_content_id: number | null;
  outcome_label: string | null;
  source_kind: string;
  source_id: string;
  notes: string | null;
  created_at: Date;
};

export type OutcomeQualityIssue = {
  issueId: string;
  issueType: OutcomeQualityIssueType;
  accountName: string;
  campaignId: number | null;
  generatedContentId: number | null;
  detail: string;
  sourceId: string;
  createdAt: Date;
};

export type OutcomeTrendPoint = {
  day: string;
  counts: Record<OperatorOutcomeLabel, number>;
  total: number;
};

export type PromptRecommendation = {
  key: string;
  label: string;
  rationale: string;
};

export type OutcomeActionRecommendation = {
  label: string;
  detail: string;
  route: string;
  tone: 'ready' | 'attention' | 'blocked';
};

export type OutcomeAssetRecommendation = {
  label: string;
  detail: string;
  route: string;
  infographicType: string;
  stageIntent: JourneyStageIntent;
  reasonCode: string;
};

export type OutcomeFollowUpRecommendation = {
  latestOutcomeLabel: OperatorOutcomeLabel;
  nextAction: OutcomeActionRecommendation;
  nextAsset: OutcomeAssetRecommendation;
  summary: string;
};

const POSITIVE_SET = new Set<OperatorOutcomeLabel>(['positive', 'closed-won']);
const NEGATIVE_SET = new Set<OperatorOutcomeLabel>(['negative', 'closed-lost']);

export function parseOperatorOutcomeLabel(value: string | null | undefined): OperatorOutcomeLabel | null {
  if (!value) return null;
  return OPERATOR_OUTCOME_TAXONOMY.includes(value as OperatorOutcomeLabel) ? (value as OperatorOutcomeLabel) : null;
}

export function buildOutcomeTrend(
  outcomes: Array<Pick<OperatorOutcomeRecord, 'outcome_label' | 'created_at'>>,
  days = 14,
  now = new Date(),
): OutcomeTrendPoint[] {
  const byDay = new Map<string, OutcomeTrendPoint>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const day = date.toISOString().slice(0, 10);
    byDay.set(day, {
      day,
      counts: {
        positive: 0,
        neutral: 0,
        negative: 0,
        'wrong-person': 0,
        'bad-timing': 0,
        'closed-won': 0,
        'closed-lost': 0,
      },
      total: 0,
    });
  }

  outcomes.forEach((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    if (!label) return;
    const day = outcome.created_at.toISOString().slice(0, 10);
    const point = byDay.get(day);
    if (!point) return;
    point.counts[label] += 1;
    point.total += 1;
  });

  return [...byDay.values()];
}

export function derivePromptRecommendations(outcomes: Array<Pick<OperatorOutcomeRecord, 'outcome_label'>>): PromptRecommendation[] {
  const counts = new Map<OperatorOutcomeLabel, number>();
  OPERATOR_OUTCOME_TAXONOMY.forEach((label) => counts.set(label, 0));
  outcomes.forEach((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  const recommendations: PromptRecommendation[] = [];
  if ((counts.get('wrong-person') ?? 0) >= 2) {
    recommendations.push({
      key: 'persona-targeting-tighten',
      label: 'Tighten Persona Targeting',
      rationale: 'Wrong-person outcomes are elevated; update role filters and title constraints.',
    });
  }
  if ((counts.get('bad-timing') ?? 0) >= 2) {
    recommendations.push({
      key: 'timing-value-framing',
      label: 'Shift Timing + Urgency Framing',
      rationale: 'Bad-timing outcomes are elevated; improve why-now framing and sequencing windows.',
    });
  }
  if ((counts.get('negative') ?? 0) + (counts.get('closed-lost') ?? 0) >= 2) {
    recommendations.push({
      key: 'objection-handling',
      label: 'Strengthen Objection Handling',
      rationale: 'Negative/closed-lost outcomes are elevated; adjust proof blocks and risk-reversal language.',
    });
  }
  if ((counts.get('positive') ?? 0) + (counts.get('closed-won') ?? 0) >= 3) {
    recommendations.push({
      key: 'promote-winning-angles',
      label: 'Promote Winning Angles',
      rationale: 'Positive outcomes are strong; increase ranking weight for these prompt templates and blocks.',
    });
  }

  return recommendations;
}

export function applyOutcomeWeightToPlaybookScore(
  baseScore: number,
  outcomes: Array<Pick<OperatorOutcomeRecord, 'outcome_label'>>,
): number {
  let weighted = baseScore;
  outcomes.forEach((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    if (!label) return;
    if (label === 'closed-won') weighted += 0.2;
    else if (label === 'positive') weighted += 0.1;
    else if (label === 'neutral' || label === 'bad-timing') weighted += 0;
    else if (label === 'wrong-person') weighted -= 0.05;
    else if (label === 'negative') weighted -= 0.1;
    else if (label === 'closed-lost') weighted -= 0.2;
  });
  return Number(weighted.toFixed(4));
}

export function buildOutcomeFollowUpRecommendation(input: {
  outcomeLabel: string | null | undefined;
  stageIntent?: JourneyStageIntent;
  coverageGapCount?: number;
  hasMeetingSignal?: boolean;
  notes?: string | null;
}): OutcomeFollowUpRecommendation | null {
  const latestOutcomeLabel = parseOperatorOutcomeLabel(input.outcomeLabel);
  if (!latestOutcomeLabel) return null;

  const transition = mapOutcomeToNextInfographic({
    stageIntent: input.stageIntent ?? 'cold',
    outcomeLabel: latestOutcomeLabel,
  });
  const nextAssetLabel = INFOGRAPHIC_LABELS[transition.nextType];
  const nextAssetBase = {
    label: `${nextAssetLabel} next`,
    route: '#outreach',
    infographicType: transition.nextType,
    stageIntent: transition.nextStage,
    reasonCode: transition.reasonCode,
  };

  if (latestOutcomeLabel === 'wrong-person') {
    return {
      latestOutcomeLabel,
      nextAction: {
        label: 'Replace the contact before the next send',
        detail: 'The last touch landed with the wrong buyer. Promote a better-fit contact and resend into the correct lane.',
        route: '#committee',
        tone: 'blocked',
      },
      nextAsset: {
        ...nextAssetBase,
        detail: 'Rebuild the asset for the right lane with a lighter diagnostic hook before sending again.',
      },
      summary: 'Wrong-person feedback means the account map needs a better buyer before more outreach.',
    };
  }

  if (latestOutcomeLabel === 'bad-timing') {
    return {
      latestOutcomeLabel,
      nextAction: {
        label: 'Reset the follow-up window',
        detail: 'Keep the contact warm, but tighten the why-now trigger and sequence timing before the next touch.',
        route: '#outreach',
        tone: 'attention',
      },
      nextAsset: {
        ...nextAssetBase,
        detail: 'Queue a lighter follow-up asset with sharper timing and urgency framing.',
      },
      summary: 'Bad-timing feedback points to sequencing and urgency, not necessarily persona fit.',
    };
  }

  if (latestOutcomeLabel === 'negative' || latestOutcomeLabel === 'closed-lost') {
    return {
      latestOutcomeLabel,
      nextAction: {
        label: latestOutcomeLabel === 'closed-lost' ? 'Capture the loss reason and reset the angle' : 'Regenerate around the objection',
        detail: input.notes?.trim()
          ? `Last feedback: ${input.notes.trim()}`
          : 'Use the latest objection signal to rebuild proof, reduce risk, and tighten the message.',
        route: '#outreach',
        tone: 'attention',
      },
      nextAsset: {
        ...nextAssetBase,
        detail: 'Generate the next asset from the objection context so the follow-up changes the message, not just the timing.',
      },
      summary: 'Negative feedback should immediately feed the next asset, not just create a status change.',
    };
  }

  if (latestOutcomeLabel === 'positive' || latestOutcomeLabel === 'closed-won') {
    return {
      latestOutcomeLabel,
      nextAction: {
        label: input.hasMeetingSignal ? 'Advance the post-meeting motion' : 'Convert the warm response into a meeting',
        detail: input.hasMeetingSignal
          ? 'Momentum exists. Move the account into the next commercial milestone while the thread is warm.'
          : 'Positive engagement exists. Book the next live conversation before the thread cools.',
        route: '#history',
        tone: 'ready',
      },
      nextAsset: {
        ...nextAssetBase,
        detail: 'Queue the next stage asset to support ROI, implementation, or proposal follow-up while momentum is positive.',
      },
      summary: 'Positive engagement should advance the deal and the supporting asset sequence together.',
    };
  }

  return {
    latestOutcomeLabel,
    nextAction: {
      label: input.coverageGapCount && input.coverageGapCount > 0 ? 'Expand committee coverage before the next touch' : 'Follow up with stronger proof',
      detail: input.coverageGapCount && input.coverageGapCount > 0
        ? `There ${input.coverageGapCount === 1 ? 'is' : 'are'} ${input.coverageGapCount} buyer-lane gap${input.coverageGapCount === 1 ? '' : 's'} still uncovered on this account.`
        : 'Neutral feedback means the account is still alive, but the next touch needs clearer proof or sharper framing.',
      route: input.coverageGapCount && input.coverageGapCount > 0 ? '#committee' : '#outreach',
      tone: 'attention',
    },
    nextAsset: {
      ...nextAssetBase,
      detail: 'Generate the next asset with more proof and clearer buyer relevance before the follow-up.',
    },
    summary: 'Neutral engagement is a cue to deepen proof or widen committee coverage before the next send.',
  };
}

function hasConflictingLabels(labels: Set<OperatorOutcomeLabel>): boolean {
  const hasPositive = [...labels].some((label) => POSITIVE_SET.has(label));
  const hasNegative = [...labels].some((label) => NEGATIVE_SET.has(label));
  return hasPositive && hasNegative;
}

export function auditOperatorOutcomeQuality(outcomes: OperatorOutcomeRecord[]): OutcomeQualityIssue[] {
  const issues: OutcomeQualityIssue[] = [];

  outcomes.forEach((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    if (!label) {
      issues.push({
        issueId: `missing:${outcome.id}`,
        issueType: 'missing',
        accountName: outcome.account_name,
        campaignId: outcome.campaign_id,
        generatedContentId: outcome.generated_content_id,
        detail: 'Outcome label is missing or invalid.',
        sourceId: `${outcome.source_kind}:${outcome.source_id}`,
        createdAt: outcome.created_at,
      });
      return;
    }
    if ((label === 'neutral' || label === 'bad-timing') && (!outcome.notes || outcome.notes.trim().length < 8)) {
      issues.push({
        issueId: `ambiguous:${outcome.id}`,
        issueType: 'ambiguous',
        accountName: outcome.account_name,
        campaignId: outcome.campaign_id,
        generatedContentId: outcome.generated_content_id,
        detail: 'Outcome label requires additional rationale in notes.',
        sourceId: `${outcome.source_kind}:${outcome.source_id}`,
        createdAt: outcome.created_at,
      });
    }
  });

  const byEntity = new Map<string, Array<{ id: string; label: OperatorOutcomeLabel; createdAt: Date; accountName: string; campaignId: number | null; generatedContentId: number | null; sourceKind: string; sourceId: string }>>();
  outcomes.forEach((outcome) => {
    const label = parseOperatorOutcomeLabel(outcome.outcome_label);
    if (!label) return;
    const entityKey = `${outcome.account_name}:${outcome.generated_content_id ?? 'none'}`;
    const rows = byEntity.get(entityKey) ?? [];
    rows.push({
      id: outcome.id,
      label,
      createdAt: outcome.created_at,
      accountName: outcome.account_name,
      campaignId: outcome.campaign_id,
      generatedContentId: outcome.generated_content_id,
      sourceKind: outcome.source_kind,
      sourceId: outcome.source_id,
    });
    byEntity.set(entityKey, rows);
  });

  byEntity.forEach((rows) => {
    const sorted = [...rows].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
    const recentWindow = sorted.filter((row) => row.createdAt.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000);
    const labels = new Set(recentWindow.map((row) => row.label));
    if (!hasConflictingLabels(labels)) return;
    const latest = recentWindow[0] ?? sorted[0];
    issues.push({
      issueId: `conflicting:${latest.id}`,
      issueType: 'conflicting',
      accountName: latest.accountName,
      campaignId: latest.campaignId,
      generatedContentId: latest.generatedContentId,
      detail: 'Conflicting positive and negative outcomes detected for the same account/content.',
      sourceId: `${latest.sourceKind}:${latest.sourceId}`,
      createdAt: latest.createdAt,
    });
  });

  return issues.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
}
