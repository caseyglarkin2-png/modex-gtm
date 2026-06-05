/**
 * Server-side enrichment that attaches live HubSpot pipeline state to the
 * existing-account rows of the worklist. Isolated from data.ts so the HubSpot
 * dependency stays out of the rest of the data layer. Degrades to a no-op when
 * HubSpot is unavailable.
 */
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import { loadPipelineForAccounts, pipelineKey } from './pipeline';
import type { CuratedRow } from './types';

function slugToAccountName(slug: string): string {
  return (
    getAccountMicrositeData(slug)?.accountName ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Attach `pipeline` to existing-account rows; returns the rows unchanged when no deals resolve. */
export async function enrichRowsWithPipeline(rows: CuratedRow[]): Promise<CuratedRow[]> {
  const slugName = new Map<string, string>();
  for (const r of rows) {
    if (r.isExistingAccount && r.existingAccountSlug && !slugName.has(r.existingAccountSlug)) {
      slugName.set(r.existingAccountSlug, slugToAccountName(r.existingAccountSlug));
    }
  }
  if (slugName.size === 0) return rows;

  const pipeline = await loadPipelineForAccounts([...slugName.values()]);
  if (pipeline.size === 0) return rows;

  return rows.map((r) => {
    if (!r.isExistingAccount || !r.existingAccountSlug) return r;
    const name = slugName.get(r.existingAccountSlug);
    const state = name ? pipeline.get(pipelineKey(name)) : undefined;
    return state ? { ...r, pipeline: state } : r;
  });
}
