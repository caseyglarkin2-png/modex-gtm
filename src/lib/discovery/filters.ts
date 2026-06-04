import type { ProspectRow } from './types';

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
