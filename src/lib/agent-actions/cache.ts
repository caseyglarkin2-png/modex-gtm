import { prisma } from '@/lib/prisma';
import { normalizeAgentActionFreshness } from '@/lib/agent-actions/freshness';
import type { AgentActionRequest, AgentActionResult } from '@/lib/agent-actions/types';

type CachedAgentActionRecord = {
  savedAt: string;
  result: AgentActionResult;
};

function normalizeKeyPart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function buildAgentActionCacheKey(request: AgentActionRequest) {
  const parts = [
    'agent-action',
    request.action,
    request.target.accountName ? `account:${normalizeKeyPart(request.target.accountName)}` : null,
    request.target.company ? `company:${normalizeKeyPart(request.target.company)}` : null,
    request.target.email ? `email:${normalizeKeyPart(request.target.email)}` : null,
    request.target.personaId ? `persona:${request.target.personaId}` : null,
  ].filter(Boolean);

  return parts.join(':');
}

export async function readCachedAgentAction(cacheKey: string) {
  const row = await prisma.systemConfig.findUnique({ where: { key: cacheKey } });
  if (!row) return null;

  try {
    const parsed = JSON.parse(row.value) as CachedAgentActionRecord;
    if (!parsed?.result || !parsed.savedAt) return null;
    parsed.result.freshness = normalizeAgentActionFreshness(parsed.result.freshness);
    return parsed;
  } catch {
    return null;
  }
}

export async function writeCachedAgentAction(cacheKey: string, result: AgentActionResult) {
  const payload: CachedAgentActionRecord = {
    savedAt: new Date().toISOString(),
    result,
  };

  await prisma.systemConfig.upsert({
    where: { key: cacheKey },
    update: { value: JSON.stringify(payload) },
    create: {
      key: cacheKey,
      value: JSON.stringify(payload),
    },
  });
}

export async function markAgentActionCacheStale(accountName: string) {
  const prefix = `agent-action:content_context:account:${normalizeKeyPart(accountName)}`;
  const rows = await prisma.systemConfig.findMany({
    where: {
      key: {
        startsWith: prefix,
      },
    },
    select: { key: true },
  });

  if (rows.length === 0) return;

  await Promise.all(
    rows.map((row) =>
      prisma.systemConfig.delete({ where: { key: row.key } }).catch(() => undefined),
    ),
  );
}

export function getAgentActionTtlMs(action: AgentActionRequest['action']) {
  switch (action) {
    case 'content_context':
    case 'pipeline_snapshot':
      return 6 * 60 * 60 * 1000;
    case 'committee_refresh':
    case 'prospect_discover':
    case 'draft_outreach':
    case 'sequence_recommendation':
      return 12 * 60 * 60 * 1000;
    case 'contact_dossier':
    case 'contact_enrich':
    case 'company_contacts':
    case 'account_research':
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export function applyFreshness(result: AgentActionResult, source: 'live' | 'cache', stale: boolean): AgentActionResult {
  const freshness = normalizeAgentActionFreshness(result.freshness);
  return {
    ...result,
    freshness: {
      ...freshness,
      source,
      stale: stale || freshness.stale,
      status: stale && freshness.status === 'fresh'
        ? 'stale'
        : stale && freshness.status === 'aging'
          ? 'stale'
          : freshness.status,
    },
  };
}
