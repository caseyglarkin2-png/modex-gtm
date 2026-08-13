/**
 * Phase 4 — GeoJSON geofence export.
 *
 * For each account, emits output/yard-audits/<slug>/<slug>.geojson — a GeoJSON
 * FeatureCollection. One Polygon Feature per site from geofences.perimeter,
 * plus the sub-zones (truckGate, each dropYards[], each dockAprons[], staging)
 * as additional Polygon Features when present.
 *
 * Zone geometry is normalized by ./geometry.ts, which accepts BOTH the traced
 * `{ ring: [{lat,lng}, ...] }` shape every current site record uses and the
 * legacy `{ south, west, north, east }` box. Reading a ring through the box
 * parser is what produced the all-null export corpus; normalizeZone() is
 * exhaustive, so an unrecognized shape now throws instead of yielding
 * [undefined, undefined] (which JSON.stringify writes as [null, null]).
 *
 * Feature `properties` carry the site name, type, archetype (assignArchetype),
 * key classification flags, and yardMetrics. Sites with a null perimeter
 * (low-confidence, unresolved) are skipped and counted. A combined collection
 * is also written to output/yard-audits/YardFlow-All-Geofences.geojson.
 *
 * Fail-closed: every FeatureCollection is validated before it is written. Any
 * null / non-numeric / out-of-range / unclosed geometry aborts the run with a
 * non-zero exit and NOTHING is written for that account.
 *
 * Run: npx tsx scripts/yard-audit/build-geojson.ts            (all accounts)
 *      npx tsx scripts/yard-audit/build-geojson.ts <slug> ... (named accounts)
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignArchetype, type Classification } from './lib.ts';
import {
  normalizeZone,
  validateFeatureCollection,
  GeometryError,
  type Position,
  type Zone,
} from './geometry.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

interface Geofences {
  perimeter?: Zone;
  truckGate?: Zone;
  dropYards?: Zone[];
  dockAprons?: Zone[];
  staging?: Zone;
}

interface YardMetrics {
  dockDoorCount?: number;
  trailersVisible?: number;
  trailerParkingCapacity?: number;
  truckGateCount?: number;
  buildingCount?: number;
  siteAreaAcres?: number;
  railServed?: boolean;
}

interface Site {
  name?: string;
  type?: string;
  coords?: { lat: number; lng: number };
  geofences?: Geofences;
  yardMetrics?: YardMetrics;
  classification: Classification;
  confidence?: string;
}

interface Feature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: Position[][] };
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/** Compact slice of classification flags useful on a map. */
function classificationFlags(c: Classification): Record<string, unknown> {
  return {
    truckGate: c.truckGate,
    guardShack: c.guardShack,
    remoteGs: c.remoteGs,
    fastLaneOpportunity: c.fastLaneOpportunity,
    backupSensitive: c.backupSensitive,
    dropYard: c.dropYard,
    multipleFacilities: c.multipleFacilities,
    scale: c.scale,
    shipRcvSeparate: c.shipRcvSeparate,
    urbanRural: c.urbanRural,
    dockDoors: c.dockDoors,
    dropArea: c.dropArea,
  };
}

/**
 * Build the perimeter + sub-zone Features for one site. Empty when the site has
 * no traced perimeter (a legitimate "unresolved yard", counted by the caller).
 * Malformed geometry throws — it is never dropped.
 */
export function siteFeatures(account: string, site: Site, siteId = ''): Feature[] {
  const gf = site.geofences;
  if (!gf) return [];
  const where = `${account}/${siteId || site.name || '?'}`;

  const perimeter = normalizeZone(gf.perimeter, `${where}#perimeter`);
  if (!perimeter) return [];

  const a = assignArchetype(site.classification);
  const base = {
    account,
    name: site.name ?? '',
    type: site.type ?? '',
    archetype: a.archetype,
    archetypeName: a.archetypeName,
    confidence: site.confidence ?? '',
  };

  const poly = (zone: string, ring: Position[], extra: Record<string, unknown> = {}): Feature => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: { ...base, zone, ...extra },
  });

  const features: Feature[] = [];

  // Perimeter — carries the full flag set + yardMetrics.
  features.push(
    poly('perimeter', perimeter, {
      ...classificationFlags(site.classification),
      yardMetrics: site.yardMetrics ?? {},
    }),
  );

  const truckGate = normalizeZone(gf.truckGate, `${where}#truckGate`);
  if (truckGate) features.push(poly('truckGate', truckGate));

  for (let i = 0; i < (gf.dropYards ?? []).length; i++) {
    const ring = normalizeZone(gf.dropYards![i], `${where}#dropYards[${i}]`);
    if (ring) features.push(poly('dropYard', ring, { index: i + 1 }));
  }
  for (let i = 0; i < (gf.dockAprons ?? []).length; i++) {
    const ring = normalizeZone(gf.dockAprons![i], `${where}#dockAprons[${i}]`);
    if (ring) features.push(poly('dockApron', ring, { index: i + 1 }));
  }

  const staging = normalizeZone(gf.staging, `${where}#staging`);
  if (staging) features.push(poly('staging', staging));

  return features;
}

function loadSites(dir: string): { id: string; site: Site }[] {
  const sitesDir = join(dir, 'sites');
  if (existsSync(sitesDir)) {
    return readdirSync(sitesDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => ({
        id: f.replace(/\.json$/, ''),
        site: JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site,
      }));
  }
  // Kraft-heinz baseline.json carries no geofences — nothing to map.
  return [];
}

function listAccounts(): string[] {
  return readdirSync(AUD)
    .filter((d) => {
      try { return statSync(join(AUD, d)).isDirectory(); } catch { return false; }
    })
    .sort();
}

/** Validate, then write. Refuses to write anything that fails. */
function writeChecked(path: string, fc: FeatureCollection, label: string): void {
  const issues = validateFeatureCollection(fc, label);
  if (issues.length) {
    console.error(`\n✗ ${label}: ${issues.length} geometry problem(s) — NOT written.`);
    for (const i of issues.slice(0, 20)) console.error(`    ${i.path}: ${i.problem}`);
    if (issues.length > 20) console.error(`    ... and ${issues.length - 20} more`);
    process.exitCode = 1;
    throw new Error(`geometry validation failed for ${label}`);
  }
  writeFileSync(path, JSON.stringify(fc, null, 2) + '\n');
}

function main(): void {
  const requested = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  // Regenerating a subset must not truncate the all-accounts collection.
  const partial = requested.length > 0;
  const accounts = partial ? requested : listAccounts();

  const combined: FeatureCollection = { type: 'FeatureCollection', features: [] };
  let accountsWritten = 0;
  let totalSkipped = 0;

  for (const acct of accounts) {
    const dir = join(AUD, acct);
    if (!existsSync(dir)) {
      console.warn(`  skip ${acct} — no such account folder`);
      continue;
    }
    const sites = loadSites(dir);
    const features: Feature[] = [];
    let skipped = 0;
    for (const { id, site } of sites) {
      const f = siteFeatures(acct, site, id);
      if (f.length === 0) skipped++;
      features.push(...f);
    }
    totalSkipped += skipped;
    if (features.length === 0) {
      // Nothing mappable (e.g. kraft-heinz baseline-only) — don't emit a file.
      continue;
    }
    const fc: FeatureCollection = { type: 'FeatureCollection', features };
    writeChecked(join(dir, `${acct}.geojson`), fc, `${acct}.geojson`);
    combined.features.push(...features);
    accountsWritten++;
    const perimCount = features.filter((f) => f.properties.zone === 'perimeter').length;
    console.log(
      `  ${acct}: ${perimCount} site${perimCount === 1 ? '' : 's'} + ` +
      `${features.length - perimCount} sub-zones` +
      (skipped ? ` (${skipped} skipped — no traced perimeter)` : ''),
    );
  }

  if (partial) {
    console.log(
      `\n${accountsWritten} account geojson file(s) rewritten; ` +
      `YardFlow-All-Geofences.geojson left alone (partial run). ` +
      `Run with no arguments to rebuild it.`,
    );
    return;
  }

  writeChecked(
    join(AUD, 'YardFlow-All-Geofences.geojson'),
    combined,
    'YardFlow-All-Geofences.geojson',
  );
  console.log(
    `\n${accountsWritten} account geojson files + combined ` +
    `YardFlow-All-Geofences.geojson (${combined.features.length} features, ` +
    `${totalSkipped} site(s) skipped for having no traced perimeter).`,
  );
}

try {
  main();
} catch (err) {
  if (err instanceof GeometryError) {
    console.error(`\n✗ source geometry is malformed — refusing to emit a partial corpus.`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }
  if (err instanceof Error && err.message.startsWith('geometry validation failed')) {
    process.exit(1);
  }
  throw err;
}
