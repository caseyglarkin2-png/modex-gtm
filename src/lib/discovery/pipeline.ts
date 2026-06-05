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

/**
 * Returns a map of pipelineKey(accountName) → PipelineState for the requested
 * accounts. Empty when HubSpot is unavailable or no deals match.
 */
export async function loadPipelineForAccounts(accountNames: string[]): Promise<Map<string, PipelineState>> {
  const result = new Map<string, PipelineState>();
  if (!isHubSpotConfigured() || !HUBSPOT_SYNC_ENABLED || accountNames.length === 0) return result;

  const wanted = new Set(accountNames.map(pipelineKey));
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

    for (const d of deals) {
      const props = d.properties ?? {};
      const key = pipelineKey(accountFromDealName(props.dealname ?? ''));
      if (!wanted.has(key) || result.has(key)) continue;
      const ownerId = props.hubspot_owner_id ? String(props.hubspot_owner_id) : null;
      const ownerName = ownerId ? owners.get(ownerId) ?? null : null;
      result.set(key, mapDealToPipelineState(props, ownerName, now));
    }
  } catch {
    // graceful degradation — return whatever resolved
  }
  return result;
}
