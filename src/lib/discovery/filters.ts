import type { ProspectRow, DiscoveredVia, ProspectSegment, Confidence } from './types';

/**
 * discoveredVia entries are objects ({ anchor, keyword, distanceMiles }) in real
 * scan output, but may be plain strings in older/seed data — render either.
 * Returns the distinct anchor labels (e.g. "Breinigsville PA, Ontario CA").
 */
export function formatDiscoveredVia(via: Array<DiscoveredVia | string>): string {
  const labels = via.map((v) => (typeof v === 'string' ? v : v.anchor)).filter(Boolean);
  return Array.from(new Set(labels)).join(', ');
}

export interface ProspectFilters {
  tier?: string;
  corridor?: string;
  minScore?: number;
  q?: string;
  /** Restrict to a single demand-side segment (shipper/carrier/3pl/parcel). */
  segment?: ProspectSegment | string;
  /** Drop parcel / last-mile rows from the default slice (unless `segment === 'parcel'`). */
  excludeParcel?: boolean;
  /** Keep only rows at or above this confidence (low < medium < high). */
  minConfidence?: Confidence;
  /** Keep only these ICP tiers (any-of) — used by the daily slice. */
  tiers?: string[];
  /** Keep only rows within this many miles of the nearest reference site. */
  maxDistance?: number;
  /** Keep only rows with no known contacts (an undefined contactCount counts as 0). */
  needsContacts?: boolean;
}

const CONFIDENCE_RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

/**
 * Pure, generic filter. Works on ProspectRow or CuratedRow; the segment /
 * confidence predicates apply only when those fields are present on the row.
 */
export function filterProspects<T extends ProspectRow>(rows: T[], filters: ProspectFilters): T[] {
  let result = rows;
  if (filters.tier) {
    result = result.filter((r) => r.tier === filters.tier);
  }
  if (filters.tiers && filters.tiers.length > 0) {
    const allowed = new Set(filters.tiers);
    result = result.filter((r) => allowed.has(r.tier));
  }
  if (filters.maxDistance != null) {
    result = result.filter((r) => r.nearestPrimoDistance <= filters.maxDistance!);
  }
  if (filters.corridor) {
    result = result.filter((r) => r.corridor === filters.corridor);
  }
  if (filters.minScore != null) {
    result = result.filter((r) => r.icpScore >= filters.minScore!);
  }
  if (filters.segment) {
    result = result.filter((r) => (r as Partial<{ segment: string }>).segment === filters.segment);
  } else if (filters.excludeParcel) {
    result = result.filter((r) => (r as Partial<{ segment: string }>).segment !== 'parcel');
  }
  if (filters.needsContacts) {
    result = result.filter(
      (r) => ((r as Partial<{ contactCount: number }>).contactCount ?? 0) === 0,
    );
  }
  if (filters.minConfidence) {
    const floor = CONFIDENCE_RANK[filters.minConfidence];
    result = result.filter((r) => {
      const c = (r as Partial<{ confidence: Confidence }>).confidence;
      return c == null || CONFIDENCE_RANK[c] >= floor;
    });
  }
  if (filters.q) {
    const lower = filters.q.toLowerCase();
    result = result.filter(
      (r) => r.name.toLowerCase().includes(lower) || r.cityState.toLowerCase().includes(lower),
    );
  }
  return result;
}
