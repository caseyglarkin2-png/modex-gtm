/**
 * Angle generation — turns the richest fact on the page ("2.7 mi from a live
 * YardFlow site") into the opening line of the outreach. The worklist shows it
 * per row; Sprint 4 drops it into drafts. Pure and deterministic.
 */
import type { CuratedRow } from './types';
import { REFERENCE_SITES } from './reference-sites';

/** Distance (mi) within which proximity is the lead angle rather than fit. */
export const NEAR_REFERENCE_MI = 50;

/** Read a human facility noun from the name for the angle copy. */
export function facilityNoun(name: string): string {
  const n = name.toLowerCase();
  if (/(distribution center|distribution|\bdc\b|fulfillment|sortation)/.test(n)) return 'DC';
  if (/(warehouse|cold storage|storage)/.test(n)) return 'warehouse';
  if (/(manufactur|plant|factory|processing|bottling|cannery|creamery|refinery)/.test(n)) return 'plant';
  if (/(terminal|depot|cross.?dock)/.test(n)) return 'terminal';
  return 'facility';
}

/** Distance formatter shared by the worklist angle and the outreach opener. */
export function formatMiles(d: number): string {
  return d < 10 ? d.toFixed(1) : String(Math.round(d));
}

/**
 * One-line angle for a worklist row (Casey-facing). Plain, no em dashes, no claim
 * we don't back up.
 *  - near a reference: names the specific live site's city when it resolves
 *    ("Primo Brands runs YardFlow at a live site in Breinigsville, PA, 2.7 mi from
 *    this DC.") — a named, checkable site reads far more credibly.
 *  - otherwise: a fit / corridor angle so the row still has a reason to work.
 */
export function generateAngle(row: CuratedRow): string {
  const noun = facilityNoun(row.name);
  if (row.nearestPrimoDistance <= NEAR_REFERENCE_MI) {
    const site = REFERENCE_SITES.find((s) => s.name === row.nearestPrimoName);
    const where = site ? ` in ${site.city}, ${site.state}` : '';
    return `Primo Brands runs YardFlow at a live site${where}, ${formatMiles(row.nearestPrimoDistance)} mi from this ${noun}.`;
  }
  const fit = row.verticalMatch + row.enterpriseScale + row.networkComplexity;
  return `Enterprise ${row.segment === 'shipper' ? '' : `${row.segment} `}target in the ${row.corridor} corridor. Strong ICP fit (${fit}/75), no live YardFlow site nearby yet.`;
}
