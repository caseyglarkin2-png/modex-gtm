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

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
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

export function buildTopSignals(result: AgentActionResult | null) {
  if (!result) return [] as string[];
  return result.cards
    .filter((card) => ['Research Summary', 'Pipeline', 'Drafting Signals'].includes(card.title))
    .map((card) => card.body)
    .filter(Boolean)
    .slice(0, 3);
}

export function buildRecommendedAngle(result: AgentActionResult | null, fallback: string) {
  const analysis = result?.cards.find((card) => card.title === 'Research Summary')?.body;
  return analysis || fallback || 'Lead with yard variance, throughput pressure, and standardized gate-to-dock execution.';
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
