/**
 * US Industrial Corridor Heatmap
 *
 * Analyzes all existing facility locations from yard-audit rosters to identify
 * the densest industrial corridors in the US — the best hunting grounds for
 * new YardFlow prospects.
 *
 * Usage:
 *   npx tsx scripts/prospect-discovery/corridor-heatmap.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENCE_SITES } from '../../src/lib/discovery/reference-sites';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Types ────────────────────────────────────────────────────────────────

interface RosterFacility {
  idx: number;
  name: string;
  city: string;
  state: string;
  type: string;
  lat: number;
  lng: number;
}

interface RosterFile {
  account: string;
  facilityCount: number;
  facilities: RosterFacility[];
}

interface FacilityRecord {
  account: string;
  slug: string;
  archetype: string;
  facilityName: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

interface GridCell {
  latBucket: number; // floor(lat / GRID_SIZE) * GRID_SIZE
  lngBucket: number;
  facilities: FacilityRecord[];
}

interface Corridor {
  id: number;
  name: string;
  cells: GridCell[];
  facilityCount: number;
  accounts: string[];
  verticals: string[];
  nearestPrimoMiles: number;
  nearestPrimoName: string;
  centerLat: number;
  centerLng: number;
  priority: number; // 1-5 stars
  scanPriority: number; // numeric rank for places-scanner ordering
}

interface CorridorHeatmapOutput {
  generatedAt: string;
  gridSizeDegrees: number;
  totalFacilitiesLoaded: number;
  totalRosters: number;
  corridorCount: number;
  corridors: Corridor[];
}

// ── Constants ────────────────────────────────────────────────────────────

const GRID_SIZE = 0.5; // ~35 miles per cell
const MIN_FACILITIES_PER_CELL = 3;

// Archetype mapping from slug-map.ts (auditSlug -> archetype)
const ARCHETYPE_MAP: Record<string, string> = {
  'ab-inbev': 'beverage',
  'barnes-noble': 'retailer',
  'bob-evans-farms': 'cpg',
  'boston-beer-company': 'beverage',
  'campbells': 'cpg',
  'caterpillar': 'manufacturer',
  'cj-logistics-america': '3pl',
  'coca-cola': 'beverage',
  'constellation-brands': 'beverage',
  'cost-plus-world-market': 'retailer',
  'costco': 'retailer',
  'crowley': 'logistics-carrier',
  'daimler-truck-north-america': 'oem-automotive',
  'dannon': 'cpg',
  'dhl-supply-chain': '3pl',
  'diageo': 'beverage',
  'fedex': 'logistics-carrier',
  'ford': 'oem-automotive',
  'frito-lay': 'cpg',
  'general-mills': 'cpg',
  'georgia-pacific': 'manufacturer',
  'gxo': '3pl',
  'h-e-b': 'grocer-distributor',
  'honda': 'oem-automotive',
  'hormel-foods': 'cpg',
  'hyundai-motor-america': 'oem-automotive',
  'jm-smucker': 'cpg',
  'john-deere': 'manufacturer',
  'kenco-logistics': '3pl',
  'keurig-dr-pepper': 'beverage',
  'kimberly-clark': 'cpg',
  'mondelez': 'cpg',
  'nestle-usa': 'cpg',
  'niagara-bottling': 'beverage',
  'pactiv-evergreen': 'manufacturer',
  'performance-food-group': 'grocer-distributor',
  'salson-logistics': '3pl',
  'sc-johnson': 'cpg',
  'the-home-depot': 'retailer',
  'toyota': 'oem-automotive',
  'unfi': 'grocer-distributor',
  'universal-logistics': '3pl',
  'walmart': 'retailer',
  'westrock-coffee': 'cpg',
};

// Single source of truth (S5-T3/T4): derive the anchor set from the canonical
// 27 reference sites instead of a hand-maintained subset, so the heatmap's
// proximity reflects every live YardFlow site (incl. Canada). Name is rendered
// "City ST" to match this script's label style.
const PRIMO_SITES: { name: string; lat: number; lng: number }[] = REFERENCE_SITES.map((s) => ({
  name: `${s.city} ${s.state}`,
  lat: s.lat,
  lng: s.lng,
}));

const MAJOR_METROS: { name: string; lat: number; lng: number }[] = [
  { name: 'Allentown PA', lat: 40.6084, lng: -75.4902 },
  { name: 'Dallas-Fort Worth TX', lat: 32.7767, lng: -96.7970 },
  { name: 'Houston TX', lat: 29.7604, lng: -95.3698 },
  { name: 'Indianapolis IN', lat: 39.7684, lng: -86.1581 },
  { name: 'Chicago IL', lat: 41.8781, lng: -87.6298 },
  { name: 'Atlanta GA', lat: 33.7490, lng: -84.3880 },
  { name: 'Los Angeles CA', lat: 34.0522, lng: -118.2437 },
  { name: 'Inland Empire CA', lat: 34.0633, lng: -117.6509 },
  { name: 'Phoenix AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Denver CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Minneapolis MN', lat: 44.9778, lng: -93.2650 },
  { name: 'Kansas City MO', lat: 39.0997, lng: -94.5786 },
  { name: 'Columbus OH', lat: 39.9612, lng: -82.9988 },
  { name: 'Memphis TN', lat: 35.1495, lng: -90.0490 },
  { name: 'Nashville TN', lat: 36.1627, lng: -86.7816 },
  { name: 'Charlotte NC', lat: 35.2271, lng: -80.8431 },
  { name: 'Raleigh NC', lat: 35.7796, lng: -78.6382 },
  { name: 'Jacksonville FL', lat: 30.3322, lng: -81.6557 },
  { name: 'Tampa FL', lat: 27.9506, lng: -82.4572 },
  { name: 'Orlando FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Milwaukee WI', lat: 43.0389, lng: -87.9065 },
  { name: 'Detroit MI', lat: 42.3314, lng: -83.0458 },
  { name: 'Grand Rapids MI', lat: 42.9634, lng: -85.6681 },
  { name: 'Portland ME', lat: 43.6591, lng: -70.2568 },
  { name: 'Sacramento CA', lat: 38.5816, lng: -121.4944 },
  { name: 'San Antonio TX', lat: 29.4241, lng: -98.4936 },
  { name: 'Salt Lake City UT', lat: 40.7608, lng: -111.8910 },
  { name: 'Harrisburg PA', lat: 40.2732, lng: -76.8867 },
  { name: 'Newark NJ', lat: 40.7357, lng: -74.1724 },
  { name: 'St. Louis MO', lat: 38.6270, lng: -90.1994 },
  { name: 'Cincinnati OH', lat: 39.1031, lng: -84.5120 },
  { name: 'Louisville KY', lat: 38.2527, lng: -85.7585 },
  { name: 'Pittsburgh PA', lat: 40.4406, lng: -79.9959 },
  { name: 'San Francisco Bay CA', lat: 37.7749, lng: -122.4194 },
  { name: 'Portland OR', lat: 45.5051, lng: -122.6750 },
  { name: 'Seattle WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Norfolk VA', lat: 36.8508, lng: -76.2859 },
  { name: 'Richmond VA', lat: 37.5407, lng: -77.4360 },
  { name: 'Lehigh Valley PA', lat: 40.6259, lng: -75.3705 },
  { name: 'Central PA', lat: 40.2732, lng: -76.8867 },
  { name: 'Mobile AL', lat: 30.6954, lng: -88.0399 },
  { name: 'Savannah GA', lat: 32.0809, lng: -81.0912 },
  { name: 'Greenville SC', lat: 34.8526, lng: -82.3940 },
  { name: 'Birmingham AL', lat: 33.5186, lng: -86.8104 },
];

// ── Utilities ────────────────────────────────────────────────────────────

function haversineDistanceMiles(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function cellKey(latBucket: number, lngBucket: number): string {
  return `${latBucket.toFixed(1)}:${lngBucket.toFixed(1)}`;
}

// ── Step 1: Load all facilities ──────────────────────────────────────────

function loadAllFacilities(): FacilityRecord[] {
  const auditDir = join(ROOT, 'output', 'yard-audits');
  if (!existsSync(auditDir)) {
    throw new Error(`Audit directory not found: ${auditDir}`);
  }

  const facilities: FacilityRecord[] = [];
  const slugs = readdirSync(auditDir).filter((f) => {
    const full = join(auditDir, f);
    return statSync(full).isDirectory() && existsSync(join(full, 'roster.json'));
  });

  for (const slug of slugs) {
    try {
      const raw = readFileSync(join(auditDir, slug, 'roster.json'), 'utf8');
      const roster: RosterFile = JSON.parse(raw);
      const archetype = ARCHETYPE_MAP[slug] ?? 'unknown';

      for (const f of roster.facilities) {
        if (f.lat && f.lng) {
          facilities.push({
            account: roster.account,
            slug,
            archetype,
            facilityName: f.name,
            city: f.city ?? '',
            state: f.state ?? '',
            lat: f.lat,
            lng: f.lng,
          });
        }
      }
    } catch {
      process.stderr.write(`Warning: failed to load roster for ${slug}\n`);
    }
  }

  return facilities;
}

// ── Step 2: Grid-based clustering ────────────────────────────────────────

function bucketize(val: number): number {
  return Math.floor(val / GRID_SIZE) * GRID_SIZE;
}

function buildGrid(facilities: FacilityRecord[]): Map<string, GridCell> {
  const grid = new Map<string, GridCell>();

  for (const f of facilities) {
    const latB = bucketize(f.lat);
    const lngB = bucketize(f.lng);
    const key = cellKey(latB, lngB);

    let cell = grid.get(key);
    if (!cell) {
      cell = { latBucket: latB, lngBucket: lngB, facilities: [] };
      grid.set(key, cell);
    }
    cell.facilities.push(f);
  }

  return grid;
}

/**
 * Merge adjacent grid cells that each have >= MIN_FACILITIES_PER_CELL
 * into corridor clusters using flood-fill (BFS).
 */
function mergeIntoCorriders(grid: Map<string, GridCell>): GridCell[][] {
  // Filter to cells with enough facilities
  const qualifiedKeys = new Set<string>();
  for (const [key, cell] of grid) {
    if (cell.facilities.length >= MIN_FACILITIES_PER_CELL) {
      qualifiedKeys.add(key);
    }
  }

  const visited = new Set<string>();
  const clusters: GridCell[][] = [];

  for (const key of qualifiedKeys) {
    if (visited.has(key)) continue;

    // BFS flood-fill to find connected cluster
    const cluster: GridCell[] = [];
    const queue = [key];
    visited.add(key);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const cell = grid.get(current)!;
      cluster.push(cell);

      // Check 8-connected neighbors (including diagonals)
      for (const dLat of [-GRID_SIZE, 0, GRID_SIZE]) {
        for (const dLng of [-GRID_SIZE, 0, GRID_SIZE]) {
          if (dLat === 0 && dLng === 0) continue;
          const neighborKey = cellKey(
            cell.latBucket + dLat,
            cell.lngBucket + dLng,
          );
          if (qualifiedKeys.has(neighborKey) && !visited.has(neighborKey)) {
            visited.add(neighborKey);
            queue.push(neighborKey);
          }
        }
      }
    }

    clusters.push(cluster);
  }

  // Also include isolated qualified cells as single-cell corridors
  // (they're already captured above since we start BFS from every qualified cell)
  return clusters;
}

// ── Step 3: Name and score corridors ─────────────────────────────────────

function findNearestMetro(lat: number, lng: number): string {
  let bestName = MAJOR_METROS[0].name;
  let bestDist = Infinity;

  for (const metro of MAJOR_METROS) {
    const d = haversineDistanceMiles(lat, lng, metro.lat, metro.lng);
    if (d < bestDist) {
      bestDist = d;
      bestName = metro.name;
    }
  }

  return bestName;
}

function findNearestPrimo(lat: number, lng: number): { name: string; distanceMiles: number } {
  let best = { name: PRIMO_SITES[0].name, distanceMiles: Infinity };

  for (const site of PRIMO_SITES) {
    const d = haversineDistanceMiles(lat, lng, site.lat, site.lng);
    if (d < best.distanceMiles) {
      best = { name: site.name, distanceMiles: round1(d) };
    }
  }

  return best;
}

function buildCorridors(clusters: GridCell[][]): Corridor[] {
  const corridors: Corridor[] = [];
  let nextId = 1;

  for (const cluster of clusters) {
    // Gather all facilities in this corridor
    const allFacilities = cluster.flatMap((c) => c.facilities);

    // Compute center (average lat/lng)
    const centerLat = allFacilities.reduce((s, f) => s + f.lat, 0) / allFacilities.length;
    const centerLng = allFacilities.reduce((s, f) => s + f.lng, 0) / allFacilities.length;

    // Name by nearest metro
    const name = findNearestMetro(centerLat, centerLng);

    // Unique accounts
    const accounts = [...new Set(allFacilities.map((f) => f.account))].sort();

    // Unique verticals (archetypes)
    const verticals = [...new Set(allFacilities.map((f) => f.archetype))].sort();

    // Nearest Primo site
    const primo = findNearestPrimo(centerLat, centerLng);

    corridors.push({
      id: nextId++,
      name,
      cells: cluster,
      facilityCount: allFacilities.length,
      accounts,
      verticals,
      nearestPrimoMiles: primo.distanceMiles,
      nearestPrimoName: primo.name,
      centerLat: round1(centerLat),
      centerLng: round1(centerLng),
      priority: 0, // computed below
      scanPriority: 0,
    });
  }

  return corridors;
}

// ── Step 4: Rank and assign priority ─────────────────────────────────────

function computeScore(corridor: Corridor): number {
  // Weighted scoring: density + diversity + Primo proximity
  const facilityScore = Math.min(corridor.facilityCount / 5, 10); // max 10 pts
  const accountScore = Math.min(corridor.accounts.length / 2, 10); // max 10 pts
  const verticalScore = Math.min(corridor.verticals.length * 2, 10); // max 10 pts

  // Primo proximity: closer = higher score
  // 0 miles = 10 pts, 50+ miles = 0 pts
  const primoScore = Math.max(0, 10 - corridor.nearestPrimoMiles / 5);

  return facilityScore + accountScore + verticalScore + primoScore;
}

function assignPriorities(corridors: Corridor[]): void {
  // Sort by composite score descending
  for (const c of corridors) {
    (c as any)._score = computeScore(c);
  }

  corridors.sort((a, b) => (b as any)._score - (a as any)._score);

  // Assign star ratings based on score quantiles
  for (let i = 0; i < corridors.length; i++) {
    const score = (corridors[i] as any)._score as number;
    if (score >= 30) corridors[i].priority = 5;
    else if (score >= 22) corridors[i].priority = 4;
    else if (score >= 15) corridors[i].priority = 3;
    else if (score >= 10) corridors[i].priority = 2;
    else corridors[i].priority = 1;

    corridors[i].scanPriority = i + 1;

    // Clean up temp field
    delete (corridors[i] as any)._score;
  }
}

// ── Step 5: Console output ───────────────────────────────────────────────

function printTable(corridors: Corridor[]): void {
  console.log('\n=== US Industrial Corridor Heatmap ===\n');

  // Header
  const header =
    'Rank | Corridor                     | Facilities | Accounts | Verticals | Primo (mi) | Priority';
  const separator =
    '-----+------------------------------+------------+----------+-----------+------------+---------';

  console.log(header);
  console.log(separator);

  for (let i = 0; i < corridors.length; i++) {
    const c = corridors[i];
    const stars = '★'.repeat(c.priority) + '☆'.repeat(5 - c.priority);
    const rank = String(i + 1).padStart(4);
    const name = c.name.padEnd(28);
    const fac = String(c.facilityCount).padStart(10);
    const acc = String(c.accounts.length).padStart(8);
    const vert = String(c.verticals.length).padStart(9);
    const primo = c.nearestPrimoMiles.toFixed(1).padStart(10);

    console.log(`${rank} | ${name} | ${fac} | ${acc} | ${vert} | ${primo} | ${stars}`);
  }

  console.log(separator);
  console.log(
    `\nTotal: ${corridors.length} corridors covering ` +
    `${corridors.reduce((s, c) => s + c.facilityCount, 0)} facilities\n`,
  );

  // Top corridors detail
  const top5 = corridors.slice(0, 5);
  console.log('--- Top 5 Corridor Details ---\n');
  for (const c of top5) {
    console.log(`  ${c.name} (scan priority #${c.scanPriority})`);
    console.log(`    Center: ${c.centerLat}, ${c.centerLng}`);
    console.log(`    Facilities: ${c.facilityCount} across ${c.accounts.length} accounts`);
    console.log(`    Verticals: ${c.verticals.join(', ')}`);
    console.log(`    Nearest Primo: ${c.nearestPrimoName} (${c.nearestPrimoMiles} mi)`);
    console.log(`    Accounts: ${c.accounts.slice(0, 8).join(', ')}${c.accounts.length > 8 ? ` (+${c.accounts.length - 8} more)` : ''}`);
    console.log();
  }
}

// ── Step 6: JSON output ──────────────────────────────────────────────────

function writeOutput(corridors: Corridor[], totalFacilities: number, totalRosters: number): void {
  const outDir = join(ROOT, 'output', 'prospect-discovery');
  mkdirSync(outDir, { recursive: true });

  // Strip the `cells` array from the output to keep it manageable —
  // consumers only need the summary data.
  const outputCorridors = corridors.map((c) => ({
    id: c.id,
    name: c.name,
    facilityCount: c.facilityCount,
    accounts: c.accounts,
    accountCount: c.accounts.length,
    verticals: c.verticals,
    verticalCount: c.verticals.length,
    nearestPrimoMiles: c.nearestPrimoMiles,
    nearestPrimoName: c.nearestPrimoName,
    centerLat: c.centerLat,
    centerLng: c.centerLng,
    priority: c.priority,
    scanPriority: c.scanPriority,
    cellCount: c.cells.length,
  }));

  const output: CorridorHeatmapOutput = {
    generatedAt: new Date().toISOString().slice(0, 10),
    gridSizeDegrees: GRID_SIZE,
    totalFacilitiesLoaded: totalFacilities,
    totalRosters: totalRosters,
    corridorCount: corridors.length,
    corridors: outputCorridors as any,
  };

  const outPath = join(outDir, 'corridor-heatmap.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`JSON output: ${outPath}`);
}

// ── Main ─────────────────────────────────────────────────────────────────

function main(): void {
  const t0 = Date.now();

  process.stderr.write('\n=== Building US Industrial Corridor Heatmap ===\n\n');

  // Step 1: Load facilities
  process.stderr.write('Step 1: Loading facility coordinates from roster.json files...\n');
  const facilities = loadAllFacilities();
  const rosterCount = new Set(facilities.map((f) => f.slug)).size;
  process.stderr.write(
    `  Loaded ${facilities.length} facilities from ${rosterCount} roster files.\n\n`,
  );

  if (facilities.length === 0) {
    process.stderr.write('Error: no facilities found. Nothing to cluster.\n');
    process.exit(1);
  }

  // Step 2: Grid clustering
  process.stderr.write(`Step 2: Building ${GRID_SIZE}-degree grid and clustering...\n`);
  const grid = buildGrid(facilities);
  process.stderr.write(`  ${grid.size} total grid cells occupied.\n`);

  const qualifiedCells = [...grid.values()].filter(
    (c) => c.facilities.length >= MIN_FACILITIES_PER_CELL,
  );
  process.stderr.write(
    `  ${qualifiedCells.length} cells with >= ${MIN_FACILITIES_PER_CELL} facilities.\n`,
  );

  const clusters = mergeIntoCorriders(grid);
  process.stderr.write(`  Merged into ${clusters.length} corridor clusters.\n\n`);

  // Step 3: Name and enrich corridors
  process.stderr.write('Step 3: Naming corridors and computing metrics...\n');
  const corridors = buildCorridors(clusters);

  // Step 4: Rank
  process.stderr.write('Step 4: Ranking corridors by density, diversity, and Primo proximity...\n');
  assignPriorities(corridors);
  process.stderr.write('\n');

  // Step 5: Console output
  printTable(corridors);

  // Step 6: JSON output
  writeOutput(corridors, facilities.length, rosterCount);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nCompleted in ${elapsed}s.`);
}

main();
