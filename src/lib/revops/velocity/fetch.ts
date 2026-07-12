// src/lib/revops/velocity/fetch.ts
//
// Fetch `dealstage` change-history for a BOUNDED, recent set of deals and hand it
// to the pure aggregator. The search API does not return property history, so this
// mirrors the two-step pattern already used in hubspot/deals.ts findOpenDealForObject:
//   1. search deals (bounded: modified within lookbackDays, capped at maxDeals)
//   2. batchApi.read those ids with propertiesWithHistory: ['dealstage']
//
// Every network step is fail-soft: on error we return whatever partial data we have
// plus a warning, and NEVER throw. That keeps a read-only velocity surface from ever
// 500-ing the caller over a transient HubSpot hiccup.

import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import type { DealStageHistory, StageHistoryEntry, VelocityFetchOptions } from './types';

const DEFAULT_LOOKBACK_DAYS = 180;
const DEFAULT_MAX_DEALS = 300;
const DEFAULT_PIPELINE_ID = 'default';
const SEARCH_PAGE_SIZE = 100;
const READ_CHUNK_SIZE = 100;

interface ResolvedOptions {
  lookbackDays: number;
  maxDeals: number;
  pipelineId: string | null;
}

/** Clamp caller options into safe ranges. Pure — exported for tests. */
export function resolveVelocityOptions(opts: VelocityFetchOptions = {}): ResolvedOptions {
  const lookbackDays =
    opts.lookbackDays && opts.lookbackDays > 0 ? Math.min(3650, Math.floor(opts.lookbackDays)) : DEFAULT_LOOKBACK_DAYS;
  const maxDeals =
    opts.maxDeals && opts.maxDeals > 0 ? Math.min(1000, Math.floor(opts.maxDeals)) : DEFAULT_MAX_DEALS;
  const pipelineId = opts.pipelineId === undefined ? DEFAULT_PIPELINE_ID : opts.pipelineId;
  return { lookbackDays, maxDeals, pipelineId };
}

/** Search recent deal ids within the bounded window. Returns ids + a truncation flag. */
async function searchRecentDealIds(
  opts: ResolvedOptions,
): Promise<{ ids: string[]; truncated: boolean }> {
  const client = getHubSpotClient();
  const sinceMs = Date.now() - opts.lookbackDays * 86_400_000;
  const filters: { propertyName: string; operator: FilterOperatorEnum; value: string }[] = [
    { propertyName: 'hs_lastmodifieddate', operator: FilterOperatorEnum.Gte, value: String(sinceMs) },
  ];
  if (opts.pipelineId) {
    filters.push({ propertyName: 'pipeline', operator: FilterOperatorEnum.Eq, value: opts.pipelineId });
  }

  const ids: string[] = [];
  let after: string | undefined = undefined;
  let truncated = false;

  do {
    const page = await withHubSpotRetry(
      () =>
        client.crm.deals.searchApi.doSearch({
          filterGroups: [{ filters }],
          properties: ['dealstage'],
          limit: SEARCH_PAGE_SIZE,
          after: after ?? '0',
          sorts: [],
        }),
      'velocity:searchRecentDeals',
    );
    for (const r of page.results ?? []) ids.push((r as { id: string }).id);
    if (ids.length >= opts.maxDeals) {
      truncated = true;
      break;
    }
    after = page.paging?.next?.after;
  } while (after);

  return { ids: ids.slice(0, opts.maxDeals), truncated };
}

/** Batch-read `dealstage` history for the given deal ids (chunks of 100). */
async function readStageHistories(ids: string[]): Promise<DealStageHistory[]> {
  const client = getHubSpotClient();
  const out: DealStageHistory[] = [];

  for (let i = 0; i < ids.length; i += READ_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + READ_CHUNK_SIZE);
    const batch = await withHubSpotRetry(
      () =>
        client.crm.deals.batchApi.read({
          inputs: chunk.map((id) => ({ id })),
          properties: ['dealname'],
          propertiesWithHistory: ['dealstage'],
        }),
      `velocity:readHistory(${chunk.length})`,
    );
    for (const raw of batch.results) {
      const r = raw as {
        id: string;
        properties: Record<string, string | null>;
        propertiesWithHistory?: { [key: string]: { value: string; timestamp: Date }[] };
      };
      const rawHistory = r.propertiesWithHistory?.dealstage ?? [];
      const history: StageHistoryEntry[] = [];
      for (const h of rawHistory) {
        const ts = h.timestamp instanceof Date ? h.timestamp.getTime() : new Date(h.timestamp).getTime();
        if (!h.value || !Number.isFinite(ts)) continue;
        history.push({ stage: h.value, timestampMs: ts });
      }
      out.push({ id: r.id, dealname: r.properties?.dealname ?? '', history });
    }
  }
  return out;
}

/**
 * Fetch bounded deal-stage histories for the velocity aggregator. Returns the
 * histories plus a warnings list (never throws). When HubSpot is unconfigured it
 * returns an empty set with a warning so callers degrade gracefully.
 */
export async function fetchDealStageHistories(
  opts: VelocityFetchOptions = {},
): Promise<{ deals: DealStageHistory[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (!isHubSpotConfigured()) {
    return { deals: [], warnings: ['HubSpot not configured — no deal-stage history available'] };
  }

  const resolved = resolveVelocityOptions(opts);

  let ids: string[] = [];
  try {
    const search = await searchRecentDealIds(resolved);
    ids = search.ids;
    if (search.truncated) {
      warnings.push(
        `deal set truncated at ${resolved.maxDeals} (last ${resolved.lookbackDays}d) — velocity reflects the most recent slice only`,
      );
    }
  } catch (err) {
    warnings.push(`deal search failed: ${err instanceof Error ? err.message : String(err)}`);
    return { deals: [], warnings };
  }

  if (ids.length === 0) return { deals: [], warnings };

  // Read history chunk-by-chunk; a failed chunk is isolated so partial data survives.
  const deals: DealStageHistory[] = [];
  for (let i = 0; i < ids.length; i += READ_CHUNK_SIZE) {
    const chunk = ids.slice(i, i + READ_CHUNK_SIZE);
    try {
      const part = await readStageHistories(chunk);
      deals.push(...part);
    } catch (err) {
      warnings.push(
        `history read failed for ${chunk.length} deals (offset ${i}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { deals, warnings };
}
