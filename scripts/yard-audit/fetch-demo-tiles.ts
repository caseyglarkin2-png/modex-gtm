#!/usr/bin/env tsx
/**
 * D1.2 — Fetch satellite tiles for every site in a demo pack.
 *
 * For each site in the audited pack, pull Google Static Maps satellite
 * tiles at the zooms the demo surfaces actually render. Saves them under
 *   public/demo-packs/tiles/<micrositeSlug>/<siteId>-z<zoom>.jpg
 * plus a per-account sidecar
 *   public/demo-packs/tiles/<micrositeSlug>/_tiles.json
 * the pack builder reads to populate `site.tiles[zoom]`.
 *
 * Usage:
 *   npx tsx scripts/yard-audit/fetch-demo-tiles.ts <auditSlug>
 *   npx tsx scripts/yard-audit/fetch-demo-tiles.ts <auditSlug> --force   # refetch all
 *
 * Caching: existing JPEGs are skipped (cheap re-runs after roster changes).
 * Quota: 2 tiles × N sites per account. At 2 sips of the Maps free tier
 * (~28k/month at default pricing) the whole 867-site corpus is ~1.7k calls.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveByAuditSlug } from './slug-map';
import { readFile } from 'node:fs/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACK_ROOT = join(ROOT, 'public', 'demo-packs');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Zooms the demo actually uses. z17 = network-context view; z18 = site-detail
// view with geofence overlays. Anything higher and the polygons look chunky.
const ZOOMS = [17, 18] as const;
const TILE_W = 640;
const TILE_H = 640;
const TILE_SCALE = 2; // retina tiles — 1280x1280 effective

function loadKey(): string {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) {
    throw new Error('GOOGLE_MAPS_STATIC_API_KEY missing from .env.local');
  }
  return m[1].trim();
}

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

interface PackSite {
  id: string;
  name: string;
  center: { lat: number; lng: number };
}

interface PackShape {
  account: { slug: string };
  network: { sites: PackSite[] };
}

interface SidecarEntry {
  siteId: string;
  zoom: number;
  url: string;
  center: { lat: number; lng: number };
  width: number;
  height: number;
}

async function main() {
  const args = process.argv.slice(2);
  const auditSlug = args.find((a) => !a.startsWith('--'));
  const force = args.includes('--force');
  if (!auditSlug) {
    console.error('usage: npx tsx scripts/yard-audit/fetch-demo-tiles.ts <auditSlug> [--force]');
    process.exit(1);
  }
  const { micrositeSlug, displayName } = resolveByAuditSlug(auditSlug);

  const packPath = join(PACK_ROOT, `${micrositeSlug}.json`);
  if (!existsSync(packPath)) {
    throw new Error(`Pack not found: ${packPath} — run build-demo-pack.ts first`);
  }
  const pack: PackShape = JSON.parse(await readFile(packPath, 'utf8'));

  const key = loadKey();
  const outDir = join(PACK_ROOT, 'tiles', micrositeSlug);
  mkdirSync(outDir, { recursive: true });

  console.log(`▶ tiles for ${displayName} (${pack.network.sites.length} sites × ${ZOOMS.length} zooms)`);

  const sidecar: SidecarEntry[] = [];
  let fetched = 0;
  let cached = 0;
  let failed = 0;

  for (const site of pack.network.sites) {
    for (const zoom of ZOOMS) {
      const fileName = `${site.id}-z${zoom}.jpg`;
      const outPath = join(outDir, fileName);
      const publicUrl = `/demo-packs/tiles/${micrositeSlug}/${fileName}`;
      const entry: SidecarEntry = {
        siteId: site.id,
        zoom,
        url: publicUrl,
        center: site.center,
        width: TILE_W * TILE_SCALE,
        height: TILE_H * TILE_SCALE,
      };
      sidecar.push(entry);

      if (!force && existsSync(outPath)) {
        cached++;
        continue;
      }

      const apiUrl =
        `https://maps.googleapis.com/maps/api/staticmap?center=${site.center.lat},${site.center.lng}` +
        `&zoom=${zoom}&size=${TILE_W}x${TILE_H}&scale=${TILE_SCALE}&maptype=satellite&format=jpg&key=${key}`;
      try {
        const buf = await fetchImage(apiUrl);
        writeFileSync(outPath, buf);
        fetched++;
        // Tiny politeness pause — we're not rate-limit-sensitive but 5/s is plenty.
        await sleep(200);
      } catch (e) {
        failed++;
        console.warn(`  ✗ ${fileName} — ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // Sidecar is grouped by siteId for cheap pack-builder reads.
  const grouped: Record<string, Record<string, Omit<SidecarEntry, 'siteId' | 'zoom'>>> = {};
  for (const e of sidecar) {
    grouped[e.siteId] ??= {};
    grouped[e.siteId]![String(e.zoom)] = { url: e.url, center: e.center, width: e.width, height: e.height };
  }
  const sidecarPath = join(outDir, '_tiles.json');
  writeFileSync(sidecarPath, JSON.stringify(grouped, null, 2));

  console.log(`✓ tiles done — fetched ${fetched}, cached ${cached}, failed ${failed}`);
  console.log(`  sidecar: ${sidecarPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
