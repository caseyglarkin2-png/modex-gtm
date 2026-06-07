/**
 * Selects which prospect markers to render on the corridor map when the worklist
 * exceeds the SVG marker budget (Sprint 6.2).
 *
 * Leaflet renders one SVG node per marker, so an unbounded set (~8.7k sites)
 * tanks pan/zoom. The old behavior took a plain top-N-by-rank slice, which could
 * bury sellable Tier A sites below the cut when the map was widened to all sites.
 * This keeps EVERY Tier A marker, then fills the remaining budget with the next
 * highest-ranked rows — preserving the incoming worklist order — so a sellable
 * account is never hidden on the map.
 */
export function selectMapMarkers<T extends { tier: 'A' | 'B' | 'C' | 'D' }>(
  prospects: T[],
  max: number,
): T[] {
  if (prospects.length <= max) return prospects;

  const tierACount = prospects.reduce((n, p) => (p.tier === 'A' ? n + 1 : n), 0);
  let nonABudget = Math.max(0, max - tierACount);

  const out: T[] = [];
  for (const p of prospects) {
    if (p.tier === 'A') {
      out.push(p);
    } else if (nonABudget > 0) {
      out.push(p);
      nonABudget -= 1;
    }
  }
  return out;
}
