// scripts/intel/tam-geo/score.ts
const R_MI = 3958.7613;
const toRad = (d: number) => (d * Math.PI) / 180;
export function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(s)));
}
const PROX_DECAY_MI = 30;
const proximityComponent = (mi: number) => Math.exp(-Math.max(0, mi) / PROX_DECAY_MI);
const densityComponent = (n: number) => Math.min(1, n / 5);

export interface Site { lat: number; lng: number; name?: string }
export interface RefSite { lat: number; lng: number; name?: string }
export interface AccountScore {
  nearest_distance_mi: number; proximity_score: number; corridor_density: number;
  composite_score: number; nearest_primo_site: string | null; facilities: number;
}
// allFacilities = every TAM facility (for corridor density); fit = stamped 0-100 (or null).
export function scoreAccount(
  roster: { facilities: Site[] }, refSites: RefSite[], fit: number | null, allFacilities: Site[],
): AccountScore {
  const facs = (roster.facilities ?? []).filter((f) => typeof f.lat === 'number' && typeof f.lng === 'number');
  let best = Infinity, bestRef: RefSite | null = null;
  for (const f of facs) for (const s of refSites) {
    const d = haversineMi(f.lat, f.lng, s.lat, s.lng);
    if (d < best) { best = d; bestRef = s; }
  }
  const dist = Number.isFinite(best) ? best : null;
  // density: max neighbors-within-5mi across this account's facilities (excluding self)
  let density = 0;
  for (const f of facs) {
    let n = 0;
    for (const o of allFacilities) if (o !== f && haversineMi(f.lat, f.lng, o.lat, o.lng) <= 5) n += 1;
    if (n > density) density = n;
  }
  const proxC = dist == null ? 0 : proximityComponent(dist);
  const fit01 = (fit ?? 0) / 100;
  const composite = Math.round((0.55 * proxC + 0.3 * fit01 + 0.15 * densityComponent(density)) * 100 * 100) / 100;
  return {
    nearest_distance_mi: dist == null ? -1 : Math.round(dist * 10) / 10,
    proximity_score: Math.round(proxC * 100),
    corridor_density: density,
    composite_score: composite,
    nearest_primo_site: bestRef?.name ?? null,
    facilities: facs.length,
  };
}
