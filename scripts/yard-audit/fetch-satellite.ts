/**
 * Phase 2 support — satellite + Street View imagery fetcher (Google Maps APIs).
 *
 * The plan originally assumed browser screenshots; we fetch via the Static
 * APIs instead — ToS-clean, deterministic, no headless browser.
 *
 * Per site it pulls:
 *   - zoom-17 satellite — overview (whole property, gate, drop yard)
 *   - zoom-18 satellite — detail
 *   - zoom-19 satellite — tight detail (dock doors, entry geometry)
 *   - Street View — a frame aimed from the nearest road at the facility.
 *     Kraft calibration showed gates / guard shacks sit at the satellite
 *     resolution limit; the road-level view is the fix. Skipped with a note
 *     when no Street View pano covers the site.
 *
 * Robustness: each fetch retries with backoff (rides out billing-propagation
 * lag and transient errors); the run is resumable — tiles already on disk are
 * skipped, so a re-run continues where it stopped.
 *
 * Run: npx tsx scripts/yard-audit/fetch-satellite.ts <account-slug>
 *   Reads  output/yard-audits/<slug>/baseline.json   (sites + mapsUrl)
 *   Writes output/yard-audits/<slug>/imagery/*.png  + imagery/manifest.json
 *
 * Key: GOOGLE_MAPS_STATIC_API_KEY in .env.local (Maps Static + Street View
 * Static APIs must both be enabled on the key).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ZOOMS = [17, 18, 19] as const;
const BACKOFF_S = [10, 30, 60, 90, 120]; // retry waits — ~5 min total per tile

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

function loadKey(): string {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) {
    throw new Error('GOOGLE_MAPS_STATIC_API_KEY missing from .env.local');
  }
  return m[1].trim();
}

/** Pull facility coords from a Google Maps URL — place pin (!3d!4d) preferred. */
function parseCoords(url: string): { lat: number; lng: number } | null {
  const pin = url?.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return { lat: +pin[1], lng: +pin[2] };
  const at = url?.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return { lat: +at[1], lng: +at[2] };
  return null;
}

/** Initial compass bearing from A to B, degrees 0-360. */
function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Fetch an image URL with retry/backoff. Throws after the final attempt. */
async function fetchImage(url: string, label: string): Promise<Buffer> {
  let lastErr = '';
  for (let attempt = 0; attempt <= BACKOFF_S.length; attempt++) {
    if (attempt > 0) {
      const w = BACKOFF_S[attempt - 1];
      console.log(`    retry ${attempt}/${BACKOFF_S.length} in ${w}s — ${label}: ${lastErr}`);
      await sleep(w * 1000);
    }
    try {
      const res = await fetch(url);
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.startsWith('image/')) return Buffer.from(await res.arrayBuffer());
      lastErr = `HTTP ${res.status} ${(await res.text()).slice(0, 140)}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`${label}: gave up after ${BACKOFF_S.length + 1} attempts: ${lastErr}`);
}

const satelliteUrl = (lat: number, lng: number, zoom: number, key: string) =>
  `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
  `&zoom=${zoom}&size=640x640&scale=2&maptype=satellite&key=${key}`;

/** Street View aimed at the facility from the nearest road. null if no pano. */
async function fetchStreetView(
  lat: number,
  lng: number,
  key: string,
): Promise<Buffer | null> {
  // radius=400m: the facility coords are the building centroid; Street View
  // panos sit on public roads at the property edge, often well beyond the
  // API's 50m default. 400m reaches the frontage road without snapping to a
  // distant unrelated road.
  const metaUrl =
    `https://maps.googleapis.com/maps/api/streetview/metadata` +
    `?location=${lat},${lng}&radius=400&key=${key}`;
  const meta = (await (await fetch(metaUrl)).json()) as {
    status: string;
    pano_id?: string;
    location?: { lat: number; lng: number };
  };
  if (meta.status !== 'OK' || !meta.location || !meta.pano_id) return null;
  const heading = bearing(meta.location, { lat, lng }).toFixed(1);
  const url =
    `https://maps.googleapis.com/maps/api/streetview?size=640x640` +
    `&pano=${meta.pano_id}&heading=${heading}&fov=90&pitch=5&key=${key}`;
  return fetchImage(url, 'streetview');
}

interface BaselineSite {
  name: string;
  type?: string;
  archetype?: string;
  mapsUrl?: string;
}
interface ManifestSite {
  idx: number;
  name: string;
  type?: string;
  archetype?: string;
  coords: { lat: number; lng: number } | null;
  images: Record<string, string>;
  streetView: 'available' | 'none';
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/yard-audit/fetch-satellite.ts <account-slug>');
    process.exit(1);
  }
  const key = loadKey();
  const dir = join(ROOT, 'output', 'yard-audits', slug);
  const baselinePath = join(dir, 'baseline.json');
  if (!existsSync(baselinePath)) throw new Error(`No baseline.json in ${dir}`);
  const sites: BaselineSite[] = JSON.parse(readFileSync(baselinePath, 'utf8')).sites;

  const imgDir = join(dir, 'imagery');
  mkdirSync(imgDir, { recursive: true });

  const manifest: ManifestSite[] = [];
  let fetched = 0;
  let cached = 0;
  let noSV = 0;
  for (let i = 0; i < sites.length; i++) {
    const s = sites[i];
    const idx = i + 1;
    const siteSlug = `${String(idx).padStart(2, '0')}-${slugify(s.name)}`;
    const coords = parseCoords(s.mapsUrl ?? '');
    if (!coords) {
      console.log(`  SKIP ${s.name} — no coordinates in mapsUrl`);
      manifest.push({ idx, name: s.name, type: s.type, archetype: s.archetype, coords: null, images: {}, streetView: 'none' });
      continue;
    }
    const images: Record<string, string> = {};
    for (const z of ZOOMS) {
      const file = `${siteSlug}-z${z}.png`;
      const path = join(imgDir, file);
      if (existsSync(path)) {
        cached++;
      } else {
        writeFileSync(path, await fetchImage(satelliteUrl(coords.lat, coords.lng, z, key), `z${z}`));
        fetched++;
      }
      images[`z${z}`] = `imagery/${file}`;
    }
    // Street View
    const svFile = `${siteSlug}-streetview.png`;
    const svPath = join(imgDir, svFile);
    let streetView: 'available' | 'none' = 'none';
    if (existsSync(svPath)) {
      cached++;
      streetView = 'available';
      images.streetview = `imagery/${svFile}`;
    } else {
      const sv = await fetchStreetView(coords.lat, coords.lng, key);
      if (sv) {
        writeFileSync(svPath, sv);
        fetched++;
        streetView = 'available';
        images.streetview = `imagery/${svFile}`;
      } else {
        noSV++;
      }
    }
    manifest.push({ idx, name: s.name, type: s.type, archetype: s.archetype, coords, images, streetView });
    console.log(`  ${String(idx).padStart(2, '0')} ${s.name} -> ${coords.lat},${coords.lng}  (SV: ${streetView})`);
  }

  writeFileSync(
    join(imgDir, 'manifest.json'),
    JSON.stringify(
      { account: slug, generatedAt: new Date().toISOString().slice(0, 10), zooms: ZOOMS, sites: manifest },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `\nDone. ${fetched} image(s) fetched, ${cached} already cached, ` +
      `${noSV} site(s) with no Street View. Imagery + manifest in output/yard-audits/${slug}/imagery/.`,
  );
}

main();
