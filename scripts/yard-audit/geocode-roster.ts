/**
 * geocode-roster.ts — turn roster street addresses into precise coordinates.
 *
 *   npx tsx scripts/yard-audit/geocode-roster.ts <slug>
 *   npx tsx scripts/yard-audit/geocode-roster.ts --all
 *
 * Discovery agents reliably surface street addresses but only approximate
 * (often city-centroid) lat/lng. The fast-pass run showed bad coordinates are
 * the single biggest time sink — every site got flagged because triage could
 * not find the building from a pin 1-3 km off. This step fixes coordinates up
 * front, deterministically — a script, not an agent.
 *
 * Per facility, best source wins:
 *   1. Geocoding API on the address    — ROOFTOP / RANGE precision.
 *   2. Street View metadata on address — nearest pano (free, ~road-level).
 *   3. Existing roster coord           — left as-is; deep audit self-corrects.
 *
 * roster.json is rewritten in place (original preserved once as roster.raw.json).
 * Each facility gains a `geocode` field: { source, precision, movedMeters }.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const AUDITS = join(ROOT, 'output', 'yard-audits');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadKey(): string {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) throw new Error('GOOGLE_MAPS_STATIC_API_KEY missing from .env.local');
  return m[1].trim();
}

interface Facility {
  idx: number;
  name: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  geocode?: unknown;
  [k: string]: unknown;
}

/** Haversine distance in meters between two coordinates. */
function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLng = (b.lng - a.lng) * toR;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

// REQUEST_DENIED can be transient while an API key / enablement change is
// still propagating, so one denial must NOT disable the API for the whole
// run. Give up only if the API has never once succeeded after many tries.
let apiSuccess = 0;
let apiDenied = 0;
let apiGiveUp = false;

async function viaGeocoding(
  address: string,
  key: string,
): Promise<{ lat: number; lng: number; precision: string } | null> {
  if (apiGiveUp) return null;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(2000 * attempt);
    try {
      const j = (await (await fetch(url)).json()) as any;
      if (j.status === 'OK' && j.results?.[0]) {
        apiSuccess++;
        const loc = j.results[0].geometry.location;
        return { lat: loc.lat, lng: loc.lng, precision: j.results[0].geometry.location_type };
      }
      if (j.status === 'ZERO_RESULTS') return null;
      // REQUEST_DENIED / OVER_QUERY_LIMIT: treat as transient — retry.
      if (j.status === 'REQUEST_DENIED' || j.status === 'OVER_QUERY_LIMIT') continue;
      return null; // INVALID_REQUEST and the like — not retryable
    } catch { /* retry */ }
  }
  apiDenied++;
  if (apiSuccess === 0 && apiDenied >= 8) {
    apiGiveUp = true;
    console.log('  (Geocoding API never responded in 8 facilities — using Street View fallback)');
  }
  return null;
}

async function viaStreetView(
  address: string,
  key: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(address)}&key=${key}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1500 * attempt);
    try {
      const j = (await (await fetch(url)).json()) as any;
      if (j.status === 'OK' && j.location) return { lat: j.location.lat, lng: j.location.lng };
      return null;
    } catch { /* retry */ }
  }
  return null;
}

async function geocodeRoster(slug: string, key: string): Promise<void> {
  const path = join(AUDITS, slug, 'roster.json');
  if (!existsSync(path)) { console.log(`  ${slug}: no roster.json — skip`); return; }
  const roster = JSON.parse(readFileSync(path, 'utf8'));
  const facilities: Facility[] = roster.facilities ?? [];

  const rawPath = join(AUDITS, slug, 'roster.raw.json');
  if (!existsSync(rawPath)) writeFileSync(rawPath, JSON.stringify(roster, null, 2));

  let api = 0, sv = 0, kept = 0;
  for (const f of facilities) {
    const orig =
      typeof f.lat === 'number' && typeof f.lng === 'number' ? { lat: f.lat, lng: f.lng } : null;
    const addr = (f.address ?? '').trim();
    if (!addr) { f.geocode = { source: 'none', precision: 'no-address' }; kept++; continue; }

    let res: { lat: number; lng: number; precision?: string } | null = null;
    let source = 'kept';
    if (!apiGiveUp) {
      const g = await viaGeocoding(addr, key);
      if (g) { res = g; source = 'geocoding-api'; }
      await sleep(120);
    }
    if (!res) {
      const s = await viaStreetView(addr, key);
      if (s) { res = { ...s, precision: 'streetview-pano' }; source = 'streetview'; }
      await sleep(120);
    }
    if (res) {
      f.lat = Number(res.lat.toFixed(6));
      f.lng = Number(res.lng.toFixed(6));
      f.geocode = {
        source,
        precision: res.precision ?? 'unknown',
        movedMeters: orig ? meters(orig, res) : null,
      };
      if (source === 'geocoding-api') api++; else sv++;
    } else {
      f.geocode = { source: 'kept', precision: 'geocode-failed' };
      kept++;
    }
  }
  roster.geocodedAt = new Date().toISOString().slice(0, 10);
  writeFileSync(path, JSON.stringify(roster, null, 2));

  const weak = facilities
    .filter((f) => {
      const p = (f.geocode as any)?.precision;
      return p === 'APPROXIMATE' || p === 'no-address' || p === 'geocode-failed';
    })
    .map((f) => f.idx);
  console.log(
    `  ${slug}: ${facilities.length} facilities — ${api} geocoding-api, ${sv} street-view, ` +
      `${kept} kept${weak.length ? `  | weak coords: idx ${weak.join(',')}` : ''}`,
  );
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) { console.error('Usage: geocode-roster.ts <slug> | --all'); process.exit(1); }
  const key = loadKey();
  const slugs =
    arg === '--all'
      ? readdirSync(AUDITS).filter((d) => existsSync(join(AUDITS, d, 'roster.json'))).sort()
      : [arg];
  for (const slug of slugs) await geocodeRoster(slug, key);
  console.log(`\nGeocoding API: ${apiSuccess} successful calls.`);
  if (apiGiveUp) {
    console.log('NOTE: Geocoding API never responded — used the Street View fallback.');
    console.log('Check that the Geocoding API is enabled and the key permits it.');
  }
}

main();
