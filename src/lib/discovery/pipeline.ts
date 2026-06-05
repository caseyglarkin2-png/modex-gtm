/**
 * HubSpot pipeline depth for the worklist (Sprint 5). Reads deal stage, owner,
 * last activity, amount, and next step for the existing accounts that appear in
 * the worklist, in ONE bounded deals search (not per-row). Degrades gracefully:
 * returns an empty map when HubSpot is unconfigured (e.g. local dev — the token
 * lives only in Vercel env), so the page renders fine without it.
 */
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/deals/models/Filter';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '@/lib/hubspot/client';
import { HUBSPOT_SYNC_ENABLED } from '@/lib/feature-flags';
import { mapDealToPipelineState, type PipelineState } from './pipeline-format';

const DEAL_PROPS = [
  'dealname',
  'dealstage',
  'amount',
  'closedate',
  'hubspot_owner_id',
  'notes_last_contacted',
  'hs_lastmodifieddate',
  'hs_next_step',
];

/** Normalized account-name key — de-accented, alphanumeric, for matching. */
export function pipelineKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Extract the account name from a "YardFlow - {account}" deal name. */
function accountFromDealName(dealname: string): string {
  const m = /yardflow\s*-\s*(.+)/i.exec(dealname);
  return (m ? m[1] : dealname).trim();
}

type DealRecord = { properties?: Record<string, string | null> };

async function resolveOwnerNames(
  client: ReturnType<typeof getHubSpotClient>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await withHubSpotRetry(
      () => client.crm.owners.ownersApi.getPage(undefined, undefined, 200),
      'pipeline.owners',
    );
    for (const o of res.results ?? []) {
      const name = [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email || String(o.id);
      map.set(String(o.id), name);
    }
  } catch {
    // owners are best-effort; fall back to null owner
  }
  return map;
}

export interface PipelineDeal {
  /** Normalized account-name key for matching. */
  key: string;
  /** Original account name from the deal (e.g. "GXO Logistics"). */
  accountName: string;
  state: PipelineState;
}

/**
 * Loads every open "YardFlow - {account}" deal with its pipeline state. Empty
 * when HubSpot is unavailable. Matching deals → worklist rows happens in
 * enrich.ts by brand name, so a deal surfaces on any matching site, not just
 * the fixed known-account set.
 */
export async function loadYardflowDeals(): Promise<PipelineDeal[]> {
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED) return [];
  try {
    const client = getHubSpotClient();
    const search = await withHubSpotRetry(
      () =>
        client.crm.deals.searchApi.doSearch({
          filterGroups: [
            { filters: [{ propertyName: 'dealname', operator: FilterOperatorEnum.ContainsToken, value: 'YardFlow' }] },
          ],
          properties: DEAL_PROPS,
          limit: 100,
          after: '0',
          sorts: [],
        }),
      'pipeline.loadDeals',
    );

    const deals = (search.results ?? []) as DealRecord[];
    const owners = await resolveOwnerNames(client);
    const now = Date.now();
    const out: PipelineDeal[] = [];
    const seen = new Set<string>();

    for (const d of deals) {
      const props = d.properties ?? {};
      const accountName = accountFromDealName(props.dealname ?? '');
      const key = pipelineKey(accountName);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const ownerId = props.hubspot_owner_id ? String(props.hubspot_owner_id) : null;
      const ownerName = ownerId ? owners.get(ownerId) ?? null : null;
      out.push({ key, accountName, state: mapDealToPipelineState(props, ownerName, now) });
    }
    return out;
  } catch {
    return [];
  }
}
