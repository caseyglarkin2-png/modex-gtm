/**
 * Phase 4 — GeoJSON geofence export.
 *
 * For each account, emits output/yard-audits/<slug>/<slug>.geojson — a GeoJSON
 * FeatureCollection. One Polygon Feature per site from geofences.perimeter
 * (the {south,west,north,east} box -> a closed 5-point ring), plus the
 * sub-zones (truckGate, each dropYards[], each dockAprons[], staging) as
 * additional Polygon Features when present.
 *
 * Feature `properties` carry the site name, type, archetype (assignArchetype),
 * key classification flags, and yardMetrics. Sites with a null perimeter
 * (low-confidence, unresolved) are skipped. A combined collection is also
 * written to output/yard-audits/YardFlow-All-Geofences.geojson.
 *
 * Run: npx tsx scripts/yard-audit/build-geojson.ts            (all accounts)
 *      npx tsx scripts/yard-audit/build-geojson.ts <slug> ... (named accounts)
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignArchetype, type Classification } from './lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

type Box = { south: number; west: number; north: number; east: number } | null;

interface Geofences {
  perimeter?: Box;
  truckGate?: Box;
  dropYards?: Box[];
  dockAprons?: Box[];
  staging?: Box;
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

type Position = [number, number];

interface Feature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: Position[][] };
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/** GeoJSON box -> a closed 5-point ring, lng/lat order. */
function ringFromBox(b: NonNullable<Box>): Position[] {
  return [
    [b.west, b.south],
    [b.east, b.south],
    [b.east, b.north],
    [b.west, b.north],
    [b.west, b.south],
  ];
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

/** Build the perimeter + sub-zone Features for one site. Empty if no perimeter. */
function siteFeatures(account: string, site: Site): Feature[] {
  const gf = site.geofences;
  if (!gf || !gf.perimeter) return [];

  const a = assignArchetype(site.classification);
  const base = {
    account,
    name: site.name ?? '',
    type: site.type ?? '',
    archetype: a.archetype,
    archetypeName: a.archetypeName,
    confidence: site.confidence ?? '',
  };

  const features: Feature[] = [];

  const poly = (zone: string, box: NonNullable<Box>, extra: Record<string, unknown> = {}): Feature => ({
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ringFromBox(box)] },
    properties: { ...base, zone, ...extra },
  });

  // Perimeter — carries the full flag set + yardMetrics.
  features.push(
    poly('perimeter', gf.perimeter, {
      ...classificationFlags(site.classification),
      yardMetrics: site.yardMetrics ?? {},
    }),
  );

  if (gf.truckGate) features.push(poly('truckGate', gf.truckGate));
  for (let i = 0; i < (gf.dropYards ?? []).length; i++) {
    const box = gf.dropYards![i];
    if (box) features.push(poly('dropYard', box, { index: i + 1 }));
  }
  for (let i = 0; i < (gf.dockAprons ?? []).length; i++) {
    const box = gf.dockAprons![i];
    if (box) features.push(poly('dockApron', box, { index: i + 1 }));
  }
  if (gf.staging) features.push(poly('staging', gf.staging));

  return features;
}

function loadSites(dir: string): Site[] {
  const sitesDir = join(dir, 'sites');
  if (existsSync(sitesDir)) {
    return readdirSync(sitesDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site);
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

function main(): void {
  const requested = process.argv.slice(2);
  const accounts = requested.length ? requested : listAccounts();

  const combined: FeatureCollection = { type: 'FeatureCollection', features: [] };
  let accountsWritten = 0;

  for (const acct of accounts) {
    const dir = join(AUD, acct);
    if (!existsSync(dir)) {
      console.warn(`  skip ${acct} — no such account folder`);
      continue;
    }
    const sites = loadSites(dir);
    const features: Feature[] = [];
    let skipped = 0;
    for (const s of sites) {
      const f = siteFeatures(acct, s);
      if (f.length === 0) skipped++;
      features.push(...f);
    }
    if (features.length === 0) {
      // Nothing mappable (e.g. kraft-heinz baseline-only) — don't emit a file.
      continue;
    }
    const fc: FeatureCollection = { type: 'FeatureCollection', features };
    writeFileSync(join(dir, `${acct}.geojson`), JSON.stringify(fc, null, 2) + '\n');
    combined.features.push(...features);
    accountsWritten++;
    const perimCount = features.filter((f) => f.properties.zone === 'perimeter').length;
    console.log(
      `  ${acct}: ${perimCount} site${perimCount === 1 ? '' : 's'} + ` +
      `${features.length - perimCount} sub-zones` +
      (skipped ? ` (${skipped} skipped — null perimeter)` : ''),
    );
  }

  writeFileSync(
    join(AUD, 'YardFlow-All-Geofences.geojson'),
    JSON.stringify(combined, null, 2) + '\n',
  );
  console.log(
    `\n${accountsWritten} account geojson files + combined ` +
    `YardFlow-All-Geofences.geojson (${combined.features.length} features).`,
  );
}

main();
