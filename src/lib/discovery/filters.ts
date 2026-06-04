import type { ProspectRow, DiscoveredVia } from './types';

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
}

export function filterProspects(rows: ProspectRow[], filters: ProspectFilters): ProspectRow[] {
  let result = rows;
  if (filters.tier) {
    result = result.filter((r) => r.tier === filters.tier);
  }
  if (filters.corridor) {
    result = result.filter((r) => r.corridor === filters.corridor);
  }
  if (filters.minScore != null) {
    result = result.filter((r) => r.icpScore >= filters.minScore!);
  }
  if (filters.q) {
    const lower = filters.q.toLowerCase();
    result = result.filter(
      (r) => r.name.toLowerCase().includes(lower) || r.cityState.toLowerCase().includes(lower),
    );
  }
  return result;
}
