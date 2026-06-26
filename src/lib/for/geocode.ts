export interface RosterFacility { name: string; city?: string; state?: string; type?: string; lat?: number; lng?: number; }

const isCoord = (f: RosterFacility) => Number.isFinite(f.lat) && Number.isFinite(f.lng);

async function geocodeOne(f: RosterFacility, key: string): Promise<RosterFacility | null> {
  const address = [f.name, f.city, f.state].filter(Boolean).join(', ');
  if (!address) return null;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`);
    if (!res.ok) return null;
    const data: any = await res.json();
    const loc = data?.status === 'OK' ? data?.results?.[0]?.geometry?.location : null;
    if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return null;
    return { ...f, lat: loc.lat, lng: loc.lng };
  } catch { return null; }
}

/** Geocode facilities lacking coords; keep ones that already have them; drop unresolvable. Caps at 25, fail-soft. */
export async function geocodeFacilities(facilities: RosterFacility[]): Promise<RosterFacility[]> {
  const capped = (facilities || []).slice(0, 25);
  const key = (process.env.GOOGLE_MAPS_STATIC_API_KEY || '').trim();
  const out: RosterFacility[] = [];
  for (const f of capped) {
    if (isCoord(f)) { out.push(f); continue; }
    if (!key) continue;                 // can't geocode without a key -> drop coordless
    const g = await geocodeOne(f, key);
    if (g) out.push(g);
  }
  return out;
}
