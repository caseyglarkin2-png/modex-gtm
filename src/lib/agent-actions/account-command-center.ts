import { normalizeAgentActionFreshness, type FreshnessState } from '@/lib/agent-actions/freshness';
import type { AgentActionResult } from '@/lib/agent-actions/types';

type RecipientCandidate = {
  id: number;
  name: string;
  email: string;
  title?: string;
  role_in_deal?: string;
  readiness?: {
    score: number;
    tier: 'high' | 'medium' | 'low';
    stale: boolean;
  };
};

export type SuggestedRecipient = RecipientCandidate & {
  lane: 'operator' | 'executive' | 'transformation';
  reason: string;
  score: number;
};

export type SuggestedRecipientSet = {
  key: SuggestedRecipient['lane'];
  label: string;
  description: string;
  recipientIds: number[];
  count: number;
  topNames: string[];
  recommended: boolean;
};

export type CommitteeCoverageBrief = {
  summary: string;
  coveredLanes: Array<SuggestedRecipient['lane']>;
  missingLanes: Array<SuggestedRecipient['lane']>;
  recommendedNextPeople: string[];
};

export type AccountSignal = {
  key: string;
  title: string;
  summary: string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  observedAt: string | null;
  freshness: FreshnessState;
  artifactLabel?: string;
  artifactHref?: string;
};

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toIso(value: unknown) {
  if (typeof value === 'string' || value instanceof Date) {
    const normalized = new Date(value);
    if (!Number.isNaN(normalized.getTime())) {
      return normalized.toISOString();
    }
  }
  return null;
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function freshnessRank(state: FreshnessState) {
  switch (state) {
    case 'fresh':
      return 4;
    case 'aging':
      return 3;
    case 'stale':
      return 2;
    case 'never_refreshed':
    default:
      return 1;
  }
}

function confidenceRank(confidence: AccountSignal['confidence']) {
  switch (confidence) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
    default:
      return 1;
  }
}

function extractRecordNames(result: AgentActionResult | null) {
  if (!result) return new Set<string>();
  const names = new Set<string>();
  const rawLists = [
    result.data.salesContacts,
    result.data.companyContacts,
    (result.data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers,
  ];

  rawLists.forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((entry) => {
        const record = entry as Record<string, unknown>;
        const name = safeString(record.name) || safeString(record.full_name);
        if (name) names.add(normalizeName(name));
      });
      return;
    }

    const record = list as Record<string, unknown> | undefined;
    if (Array.isArray(record?.decision_makers)) {
      (record.decision_makers as Array<Record<string, unknown>>).forEach((entry) => {
        const name = safeString(entry.name) || safeString(entry.full_name);
        if (name) names.add(normalizeName(name));
      });
    }
  });

  return names;
}

function classifyLane(recipient: RecipientCandidate): SuggestedRecipient['lane'] {
  const title = `${recipient.title ?? ''} ${recipient.role_in_deal ?? ''}`.toLowerCase();
  if (/(vp|chief|cfo|president|head of|svP|executive)/i.test(title)) return 'executive';
  if (/(continuous improvement|transformation|excellence|digital|automation|strategy)/i.test(title)) return 'transformation';
  return 'operator';
}

export function buildSuggestedRecipients(
  recipients: RecipientCandidate[],
  result: AgentActionResult | null,
): SuggestedRecipient[] {
  const surfacedNames = extractRecordNames(result);
  return recipients
    .map((recipient) => {
      const lane = classifyLane(recipient);
      const readinessScore = recipient.readiness?.score ?? 0;
      const nameMatch = surfacedNames.has(normalizeName(recipient.name));
      const title = (recipient.title ?? '').toLowerCase();
      const laneBoost = lane === 'operator' ? 10 : lane === 'executive' ? 8 : 7;
      const stalePenalty = recipient.readiness?.stale ? -8 : 0;
      const titleBoost = /(supply chain|logistics|transport|distribution|warehouse|operations|yard|fleet)/i.test(title) ? 12 : 0;
      const score = readinessScore + laneBoost + titleBoost + (nameMatch ? 18 : 0) + stalePenalty;
      const reasonParts = [
        nameMatch ? 'surfaced by live agent research' : '',
        lane === 'operator' ? 'closest to yard and dock execution' : lane === 'executive' ? 'good executive sponsor lane' : 'fits transformation/CI motion',
        recipient.readiness ? `readiness ${recipient.readiness.score}` : '',
      ].filter(Boolean);

      return {
        ...recipient,
        lane,
        score,
        reason: reasonParts.join(' • ') || 'recommended from account context',
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function buildSuggestedRecipientSets(recipients: SuggestedRecipient[]): SuggestedRecipientSet[] {
  const laneConfigs: Array<Pick<SuggestedRecipientSet, 'key' | 'label' | 'description'>> = [
    {
      key: 'operator',
      label: 'Operator Set',
      description: 'Closest to yard, gate, dock, and day-to-day execution pressure.',
    },
    {
      key: 'executive',
      label: 'Executive Set',
      description: 'Best sponsor lane for network urgency, margin, and scale.',
    },
    {
      key: 'transformation',
      label: 'Transformation Set',
      description: 'Strong fit for CI, digital, automation, and standardization motions.',
    },
  ];

  const sets = laneConfigs.map((config) => {
    const laneRecipients = recipients.filter((recipient) => recipient.lane === config.key).slice(0, 4);
    return {
      ...config,
      recipientIds: laneRecipients.map((recipient) => recipient.id),
      count: laneRecipients.length,
      topNames: laneRecipients.map((recipient) => recipient.name),
      recommended: false,
    };
  });

  const recommendedLane = sets.find((set) => set.key === 'operator' && set.count > 0)
    ?? sets.find((set) => set.count > 0)
    ?? null;

  return sets.map((set) => ({
    ...set,
    recommended: recommendedLane?.key === set.key,
  }));
}

export function buildCoverageGaps(result: AgentActionResult | null) {
  const cards = result?.cards ?? [];
  const committee = cards.find((card) => card.title === 'Committee Coverage')?.body ?? '';
  const buyerMap = cards.find((card) => card.title === 'Buyer Map')?.body ?? '';
  const gaps: string[] = [];

  if (!committee || /not been built|unavailable/i.test(committee)) {
    gaps.push('Committee coverage is still thin. Build committee before broadening beyond the first lane.');
  }
  if (!buyerMap || /no sales-agent decision-maker/i.test(buyerMap)) {
    gaps.push('Decision-maker coverage is weak. Keep discovering same-company contacts.');
  }
  if (gaps.length === 0) {
    gaps.push('Coverage is usable for first-touch outreach. Add alternates before scaling the wave.');
  }
  return gaps;
}

export function buildSignalRegistry(result: AgentActionResult | null): AccountSignal[] {
  if (!result) return [];
  const freshness = normalizeAgentActionFreshness(result.freshness);

  const signals: AccountSignal[] = [];
  const researchCard = result.cards.find((card) => card.title === 'Research Summary');
  const pipelineCard = result.cards.find((card) => card.title === 'Pipeline');
  const draftingCard = result.cards.find((card) => card.title === 'Drafting Signals');
  const committeeCard = result.cards.find((card) => card.title === 'Committee Coverage');
  const buyerMapCard = result.cards.find((card) => card.title === 'Buyer Map');
  const latestEmail = (result.data.latestEmail as Record<string, unknown> | undefined) ?? undefined;
  const latestAsset = (result.data.latestAsset as Record<string, unknown> | undefined) ?? undefined;
  const contactFreshness = (result.data.contactFreshness as Record<string, unknown> | undefined) ?? undefined;
  const decisionMakersPayload = (result.data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers as Record<string, unknown> | undefined;
  const decisionMakerCount = Array.isArray(decisionMakersPayload?.decision_makers)
    ? decisionMakersPayload.decision_makers.length
    : 0;
  const pipelinePayload = (result.data.pipeline as Record<string, unknown> | undefined)?.pipeline as Record<string, unknown> | undefined;
  const funnel = (result.data.pipeline as Record<string, unknown> | undefined)?.funnel as Record<string, unknown> | undefined;

  if (researchCard?.body) {
    signals.push({
      key: 'research-summary',
      title: 'Research Summary',
      summary: researchCard.body,
      source: result.provider,
      confidence: result.status === 'ok' ? 'high' : 'medium',
      observedAt: freshness.dimensions.summary.updatedAt ?? freshness.fetchedAt,
      freshness: freshness.dimensions.summary.status,
    });
  }

  if (committeeCard?.body) {
    signals.push({
      key: 'committee-coverage',
      title: 'Committee Coverage',
      summary: committeeCard.body,
      source: 'committee',
      confidence: /not been built|unavailable/i.test(committeeCard.body) ? 'low' : 'medium',
      observedAt: freshness.fetchedAt,
      freshness: freshness.dimensions.signals.status,
    });
  }

  if (buyerMapCard?.body) {
    signals.push({
      key: 'buyer-map',
      title: 'Buyer Map',
      summary: buyerMapCard.body,
      source: 'sales_agent',
      confidence: decisionMakerCount > 0 ? 'high' : 'low',
      observedAt: freshness.fetchedAt,
      freshness: freshness.dimensions.signals.status,
    });
  }

  if (pipelineCard?.body) {
    const stageSummary = funnel && typeof funnel === 'object'
      ? Object.entries(funnel)
        .slice(0, 2)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(' • ')
      : '';
    signals.push({
      key: 'pipeline',
      title: 'Pipeline',
      summary: stageSummary ? `${pipelineCard.body} ${stageSummary}` : pipelineCard.body,
      source: 'pipeline',
      confidence: pipelinePayload ? 'medium' : 'low',
      observedAt: freshness.fetchedAt,
      freshness: freshness.dimensions.signals.status,
    });
  }

  if (latestEmail?.subject) {
    signals.push({
      key: 'latest-email',
      title: 'Latest Send',
      summary: `Latest outbound: ${safeString(latestEmail.subject)}${safeNumber(latestEmail.reply_count) ? ` • replies ${String(latestEmail.reply_count)}` : ''}`,
      source: 'email_log',
      confidence: 'high',
      observedAt: toIso(latestEmail.sent_at),
      freshness: freshness.dimensions.signals.status,
    });
  }

  if (latestAsset?.content_type) {
    signals.push({
      key: 'latest-asset',
      title: 'Latest Asset',
      summary: `Latest generated asset: ${safeString(latestAsset.content_type).replaceAll('_', ' ')}`,
      source: 'generated_content',
      confidence: 'medium',
      observedAt: toIso(latestAsset.created_at),
      freshness: freshness.dimensions.generated_content.status,
    });
  }

  if (contactFreshness?.mappedContactCount || draftingCard?.body) {
    signals.push({
      key: 'contact-coverage',
      title: 'Contact Coverage',
      summary: `${String(contactFreshness?.mappedContactCount ?? 0)} mapped contacts${safeNumber(contactFreshness?.liveContactCount) ? ` • ${String(contactFreshness?.liveContactCount)} live external contacts` : ''}`,
      source: 'contacts',
      confidence: safeNumber(contactFreshness?.mappedContactCount) ? 'medium' : 'low',
      observedAt: toIso(contactFreshness?.latestEnrichedAt),
      freshness: freshness.dimensions.contacts.status,
    });
  }

  if (draftingCard?.body) {
    signals.push({
      key: 'drafting-signals',
      title: 'Drafting Signals',
      summary: draftingCard.body,
      source: 'drafting',
      confidence: /available/i.test(draftingCard.body) ? 'medium' : 'low',
      observedAt: toIso(latestAsset?.created_at) ?? freshness.fetchedAt,
      freshness: freshness.dimensions.generated_content.status,
    });
  }

  return signals
    .filter((signal) => Boolean(signal.summary))
    .sort((left, right) => {
      const leftFreshness = freshnessRank(left.freshness);
      const rightFreshness = freshnessRank(right.freshness);
      if (rightFreshness !== leftFreshness) return rightFreshness - leftFreshness;

      const leftObserved = left.observedAt ? new Date(left.observedAt).getTime() : 0;
      const rightObserved = right.observedAt ? new Date(right.observedAt).getTime() : 0;
      if (rightObserved !== leftObserved) return rightObserved - leftObserved;

      const leftConfidence = confidenceRank(left.confidence);
      const rightConfidence = confidenceRank(right.confidence);
      if (rightConfidence !== leftConfidence) return rightConfidence - leftConfidence;

      return left.title.localeCompare(right.title);
    });
}

export function buildTopSignals(result: AgentActionResult | null) {
  return buildSignalRegistry(result)
    .slice(0, 3)
    .map((signal) => signal.summary);
}

export function buildRecommendedAngle(result: AgentActionResult | null, fallback: string) {
  const analysis = result?.cards.find((card) => card.title === 'Research Summary')?.body;
  return analysis || fallback || 'Lead with yard variance, throughput pressure, and standardized gate-to-dock execution.';
}

/**
 * Source citations to render alongside the recommended angle on the account
 * command center. Picks the freshest claims for the account scope, capped at
 * `maxCitations` (default 2). Returns an empty array when no evidence has been
 * captured for the account yet — caller should render no citation chips.
 *
 * Additive sibling to `buildRecommendedAngle` — does not change that function's
 * existing string contract.
 */
export function buildRecommendedAngleCitations(
  evidenceSummary: { latestClaims: Array<{ id: string; claim: string; sourceUrl: string; freshness: 'fresh' | 'aging' | 'stale'; observedAt: string }> } | null,
  options: { maxCitations?: number } = {},
): Array<{ url: string; label: string }> {
  if (!evidenceSummary) return [];
  const max = options.maxCitations ?? 2;
  const ranked = [...evidenceSummary.latestClaims].sort((a, b) => {
    const freshnessOrder = { fresh: 0, aging: 1, stale: 2 } as const;
    const aFresh = freshnessOrder[a.freshness] ?? 3;
    const bFresh = freshnessOrder[b.freshness] ?? 3;
    if (aFresh !== bFresh) return aFresh - bFresh;
    return new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime();
  });
  return ranked.slice(0, max).map((claim) => ({
    url: claim.sourceUrl,
    label: claim.claim.length > 64 ? `${claim.claim.slice(0, 61)}...` : claim.claim,
  }));
}

export function buildCommitteeCoverageBrief(
  result: AgentActionResult | null,
  recipients: SuggestedRecipient[],
): CommitteeCoverageBrief {
  const committeeSummary = result?.cards.find((card) => card.title === 'Committee Coverage')?.body
    ?? 'Committee has not been built yet or is unavailable.';
  const buyerMapSummary = result?.cards.find((card) => card.title === 'Buyer Map')?.body ?? '';
  const coveredLanes = Array.from(new Set(recipients.map((recipient) => recipient.lane)));
  const allLanes: Array<SuggestedRecipient['lane']> = ['operator', 'executive', 'transformation'];
  const missingLanes = allLanes.filter((lane) => !coveredLanes.includes(lane));
  const recommendedNextPeople = buyerMapSummary
    .split(/,|•|\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => !/build committee|no sales-agent|not available/i.test(entry))
    .slice(0, 3);

  return {
    summary: committeeSummary,
    coveredLanes,
    missingLanes,
    recommendedNextPeople,
  };
}
