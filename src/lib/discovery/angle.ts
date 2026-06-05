/**
 * Angle generation — turns the richest fact on the page ("2.7 mi from a live
 * YardFlow site") into the opening line of the outreach. The worklist shows it
 * per row; Sprint 4 drops it into drafts. Pure and deterministic.
 */
import type { CuratedRow } from './types';

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

function fmtMi(d: number): string {
  return d < 10 ? d.toFixed(1) : String(Math.round(d));
}

/**
 * One-line angle for a worklist row.
 *  - near a reference: proximity proof ("Primo Brands runs YardFlow 2.7 mi from this DC …")
 *  - otherwise: a fit / corridor angle so the row still has a reason to work.
 */
export function generateAngle(row: CuratedRow): string {
  const noun = facilityNoun(row.name);
  if (row.nearestPrimoDistance <= NEAR_REFERENCE_MI) {
    return `Primo Brands runs YardFlow ${fmtMi(row.nearestPrimoDistance)} mi from this ${noun} — proximity proof in the same lane.`;
  }
  const fit = row.verticalMatch + row.enterpriseScale + row.networkComplexity;
  return `Enterprise ${row.segment === 'shipper' ? '' : `${row.segment} `}target in the ${row.corridor} corridor — strong ICP fit (${fit}/75), no live YardFlow site nearby yet.`;
}
