/**
 * Phase 2 support — interactive imagery probe for the tier-2 deep-audit agent.
 *
 * Lets an agent pull any satellite crop or Street View frame on demand, so it
 * can hunt down a facility's gate / entrance the way a human analyst would —
 * zoom into a corner, then look at it from the road from several angles.
 *
 *   npx tsx scripts/yard-audit/probe.ts sat <lat> <lng> <zoom> <outfile>
 *     Satellite crop centered on lat,lng at <zoom> (useful range 18-21).
 *
 *   npx tsx scripts/yard-audit/probe.ts sv <lat> <lng> <heading> <outfile>
 *     Street View from the pano nearest lat,lng (within 400m), camera aimed
 *     at <heading> degrees (0=N, 90=E, 180=S, 270=W). Prints the pano
 *     location + capture date so you know where the shot was taken from.
 *
 * Key: GOOGLE_MAPS_STATIC_API_KEY in .env.local.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root resolved from this script's own location (scripts/yard-audit/),
// so .env.local loads regardless of the cwd the agent invokes probe.ts from.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadKey(): string {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) throw new Error('GOOGLE_MAPS_STATIC_API_KEY missing from .env.local');
  return m[1].trim();
}

/** Fetch an image URL — 3 attempts with short backoff. */
async function fetchImage(url: string): Promise<Buffer> {
  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(2000 * attempt);
    try {
      const res = await fetch(url);
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.startsWith('image/')) return Buffer.from(await res.arrayBuffer());
      lastErr = `HTTP ${res.status} ${(await res.text()).slice(0, 160)}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastErr);
}

async function main(): Promise<void> {
  const [mode, latS, lngS, arg, out] = process.argv.slice(2);
  const lat = Number(latS);
  const lng = Number(lngS);
  if (!['sat', 'sv'].includes(mode) || Number.isNaN(lat) || Number.isNaN(lng) || !arg || !out) {
    console.error(
      'Usage:\n' +
        '  probe.ts sat <lat> <lng> <zoom> <outfile>\n' +
        '  probe.ts sv  <lat> <lng> <heading> <outfile>',
    );
    process.exit(1);
  }
  const key = loadKey();

  if (mode === 'sat') {
    const url =
      `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
      `&zoom=${Number(arg)}&size=640x640&scale=2&maptype=satellite&key=${key}`;
    writeFileSync(out, await fetchImage(url));
    console.log(`Wrote ${out} — satellite z${arg} @ ${lat},${lng}`);
    return;
  }

  // mode === 'sv'
  const metaUrl =
    `https://maps.googleapis.com/maps/api/streetview/metadata` +
    `?location=${lat},${lng}&radius=400&key=${key}`;
  const meta = (await (await fetch(metaUrl)).json()) as {
    status: string;
    pano_id?: string;
    location?: { lat: number; lng: number };
    date?: string;
  };
  if (meta.status !== 'OK' || !meta.pano_id) {
    console.log(`No Street View pano within 400m of ${lat},${lng} (status: ${meta.status})`);
    process.exit(2);
  }
  const url =
    `https://maps.googleapis.com/maps/api/streetview?size=640x640` +
    `&pano=${meta.pano_id}&heading=${Number(arg)}&fov=90&pitch=5&key=${key}`;
  writeFileSync(out, await fetchImage(url));
  console.log(
    `Wrote ${out} — Street View heading ${arg}° from pano @ ` +
      `${meta.location?.lat},${meta.location?.lng} (captured ${meta.date ?? 'n/a'})`,
  );
}

main();
