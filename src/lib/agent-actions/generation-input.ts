import type { AgentActionResult } from '@/lib/agent-actions/types';
import { buildCoverageGaps, buildRecommendedAngle, buildTopSignals } from '@/lib/agent-actions/account-command-center';

export type GenerationInputContract = {
  account_brief: string;
  signals: string[];
  angle: string;
  recommended_contacts: string[];
  committee_gaps: string[];
  proof_context: string[];
  cta_mode: string;
  provenance: {
    provider: AgentActionResult['provider'];
    status: AgentActionResult['status'];
  };
  freshness: AgentActionResult['freshness'];
  changed_since_last_refresh: string | null;
};

function safeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function summarizeList(values: string[], max = 4) {
  return values.filter(Boolean).slice(0, max);
}

function extractRecommendedContacts(result: AgentActionResult | null): string[] {
  if (!result) return [];
  const buckets = [
    result.data.salesContacts,
    result.data.companyContacts,
    (result.data.salesAgent as Record<string, unknown> | undefined)?.decisionMakers,
  ];

  const contacts = buckets.flatMap((bucket) => {
    if (!Array.isArray(bucket)) return [];
    return bucket.map((entry) => {
      const record = entry as Record<string, unknown>;
      return safeString(record.name) || safeString(record.full_name) || safeString(record.email);
    });
  });

  return Array.from(new Set(contacts.filter(Boolean))).slice(0, 5);
}

function extractProofContext(result: AgentActionResult | null): string[] {
  if (!result) return [];
  const cardBodies = result.cards
    .filter((card) => ['Research Summary', 'Pipeline', 'Drafting Signals', 'Account Analysis'].includes(card.title))
    .map((card) => safeString(card.body));

  return summarizeList(Array.from(new Set(cardBodies)), 4);
}

export function buildGenerationInputContract(
  result: AgentActionResult | null,
  ctaMode: string,
): GenerationInputContract | null {
  if (!result) return null;

  return {
    account_brief: result.summary,
    signals: buildTopSignals(result),
    angle: buildRecommendedAngle(result, result.summary),
    recommended_contacts: extractRecommendedContacts(result),
    committee_gaps: buildCoverageGaps(result),
    proof_context: extractProofContext(result),
    cta_mode: ctaMode,
    provenance: {
      provider: result.provider,
      status: result.status,
    },
    freshness: result.freshness,
    changed_since_last_refresh: null,
  };
}
