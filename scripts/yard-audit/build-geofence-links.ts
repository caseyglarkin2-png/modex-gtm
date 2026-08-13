/**
 * Phase 4 — Geofence link sheets.
 *
 * For each account, emits output/yard-audits/<slug>/<slug>-geofence-links.md —
 * a per-site table with the resolved coords, the perimeter bounding box,
 * siteAreaAcres, a Google Maps satellite link to the geofence centre, and a
 * geojson.io link so the perimeter can be eyeballed in a browser.
 *
 * geojson.io payloads are kept small — only the perimeter polygon (no
 * sub-zones, no metrics) is url-encoded into the link.
 *
 * Sites with a null perimeter (low-confidence, unresolved) are listed with a
 * dash so the gap is visible rather than silently dropped.
 *
 * Run: npx tsx scripts/yard-audit/build-geofence-links.ts            (all)
 *      npx tsx scripts/yard-audit/build-geofence-links.ts <slug> ... (named)
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeZone, validateRing, GeometryError, type Position, type Zone } from './geometry.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

interface Site {
  name?: string;
  type?: string;
  coords?: { lat: number; lng: number };
  geofences?: { perimeter?: Zone };
  yardMetrics?: { siteAreaAcres?: number };
}

/** Bounding box of a normalized ring, in the sheet's S, W, N, E order. */
function bboxOf(ring: Position[]): { south: number; west: number; north: number; east: number } {
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  return {
    south: Math.min(...lats),
    west: Math.min(...lngs),
    north: Math.max(...lats),
    east: Math.max(...lngs),
  };
}

/** Google Maps satellite link centred on a point. */
function mapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@${lat.toFixed(6)},${lng.toFixed(6)},400m/data=!3m1!1e3`;
}

/**
 * geojson.io link carrying the actual traced perimeter (kept small — perimeter
 * only, no sub-zones, no metrics). This used to re-derive a rectangle from the
 * box fields; against ring-shaped source that produced `undefined` corners.
 */
function geojsonIoLink(name: string, ring: Position[]): string {
  const feature = {
    type: 'Feature',
    properties: { name },
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
  return `https://geojson.io/#data=data:application/json,${encodeURIComponent(JSON.stringify(feature))}`;
}

/** Escape a cell for a Markdown table. */
function cell(v: string): string {
  return v.replace(/\|/g, '\\|');
}

function loadSites(dir: string): Site[] {
  const sitesDir = join(dir, 'sites');
  if (!existsSync(sitesDir)) return [];
  return readdirSync(sitesDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site);
}

function accountDisplayName(dir: string, slug: string): string {
  const rosterP = join(dir, 'roster.json');
  if (existsSync(rosterP)) {
    try { return JSON.parse(readFileSync(rosterP, 'utf8')).account || slug; } catch { /* fall through */ }
  }
  return slug;
}

function buildSheet(slug: string, display: string, sites: Site[]): string {
  const lines: string[] = [];
  lines.push(`# ${display} — Geofence Links`, '');
  lines.push(`${sites.length} facilities. Each row links the resolved geofence centre to`);
  lines.push('Google Maps satellite and to geojson.io (perimeter polygon only).', '');
  lines.push('| # | Facility | Type | Centre (lat, lng) | Perimeter bbox (S, W, N, E) | Acres | Maps | geojson.io |');
  lines.push('|---|---|---|---|---|---|---|---|');

  let resolved = 0;
  sites.forEach((s, i) => {
    const name = cell(s.name ?? `Site ${i + 1}`);
    const type = cell(s.type ?? '');
    const where = `${slug}/site-${i + 1}#perimeter`;
    const ring = normalizeZone(s.geofences?.perimeter, where);
    // normalizeZone proves the shape parses; it does not range-check. Without
    // this the link sheet would happily print a bbox and a Maps link for a
    // coordinate the geojson exporter refuses to write.
    if (ring) {
      const issues = validateRing(ring, where);
      if (issues.length) {
        throw new GeometryError(issues.map((x) => `${x.path}: ${x.problem}`).join('; '), where);
      }
    }
    if (!ring) {
      lines.push(`| ${i + 1} | ${name} | ${type} | — | — (perimeter unresolved) | — | — | — |`);
      return;
    }
    resolved++;
    const b = bboxOf(ring);
    const centre = { lat: (b.south + b.north) / 2, lng: (b.west + b.east) / 2 };
    const coordStr = `${centre.lat.toFixed(6)}, ${centre.lng.toFixed(6)}`;
    const bbox = `${b.south}, ${b.west}, ${b.north}, ${b.east}`;
    const acres = s.yardMetrics?.siteAreaAcres != null ? String(s.yardMetrics.siteAreaAcres) : '—';
    const maps = `[satellite](${mapsLink(centre.lat, centre.lng)})`;
    const gio = `[view](${geojsonIoLink(s.name ?? `Site ${i + 1}`, ring)})`;
    lines.push(`| ${i + 1} | ${name} | ${type} | ${coordStr} | ${bbox} | ${acres} | ${maps} | ${gio} |`);
  });

  lines.push('', `${resolved} of ${sites.length} perimeters resolved.`, '');
  return lines.join('\n');
}

function listAccounts(): string[] {
  return readdirSync(AUD)
    .filter((d) => {
      try { return statSync(join(AUD, d)).isDirectory(); } catch { return false; }
    })
    .sort();
}

function main(): void {
  const requested = process.argv.slice(2);
  const accounts = requested.length ? requested : listAccounts();
  let written = 0;

  for (const slug of accounts) {
    const dir = join(AUD, slug);
    if (!existsSync(dir)) {
      console.warn(`  skip ${slug} — no such account folder`);
      continue;
    }
    const sites = loadSites(dir);
    if (sites.length === 0) continue; // baseline-only accounts carry no geofences
    const display = accountDisplayName(dir, slug);
    writeFileSync(join(dir, `${slug}-geofence-links.md`), buildSheet(slug, display, sites));
    written++;
    console.log(`  ${slug}: ${sites.length} sites`);
  }

  console.log(`\n${written} geofence-link sheets written.`);
}

try {
  main();
} catch (err) {
  if (err instanceof GeometryError) {
    console.error('\n✗ source geometry is malformed — refusing to emit link sheets.');
    console.error(`  ${err.message}`);
    process.exit(1);
  }
  throw err;
}
