/**
 * Server-side enrichment that attaches live HubSpot deal/pipeline state to the
 * worklist. Matches each row to a "YardFlow - {account}" deal by brand name
 * (reusing the conservative asset matcher), so an open deal surfaces on any
 * matching site — not just the fixed known-account set. No-op when HubSpot is
 * unavailable. Isolated from data.ts so the HubSpot dependency stays contained.
 */
import { loadYardflowDeals } from './pipeline';
import { buildBrandIndex, resolveMicrositeSlug } from './assets';
import type { CuratedRow } from './types';

export async function enrichRowsWithPipeline(rows: CuratedRow[]): Promise<CuratedRow[]> {
  const deals = await loadYardflowDeals();
  if (deals.length === 0) return rows;

  const stateByKey = new Map(deals.map((d) => [d.key, d.state]));
  // The deal "key" doubles as a pseudo-slug; brand index maps row name → key.
  const index = buildBrandIndex(deals.map((d) => ({ slug: d.key, accountName: d.accountName })));
  const valid = new Set(deals.map((d) => d.key));

  return rows.map((r) => {
    const key = resolveMicrositeSlug(r.name, undefined, index, valid);
    const state = key ? stateByKey.get(key) : undefined;
    return state ? { ...r, pipeline: state } : r;
  });
}
