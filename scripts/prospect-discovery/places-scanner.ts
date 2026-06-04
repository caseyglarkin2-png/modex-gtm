import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── Types ────────────────────────────────────────────────────────────────

interface AnchorPoint {
  name: string;
  lat: number;
  lng: number;
}

interface DiscoveredPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  businessStatus: string;
  rating?: number;
  userRatingsTotal?: number;
  discoveredVia: { anchor: string; keyword: string; distanceMiles: number }[];
  nearestPrimoSite: { name: string; distanceMiles: number };
  nearestExistingFacility?: { account: string; name: string; distanceMiles: number };
  isExistingAccount: boolean;
  existingAccountSlug?: string;
}

interface CorridorScanResult {
  scanDate: string;
  anchorsScanned: number;
  keywordsPerAnchor: number;
  totalApiCalls: number;
  totalDiscovered: number;
  totalAfterDedup: number;
  totalNetNew: number;
  discoveries: DiscoveredPlace[];
}

interface ExistingFacility {
  account: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

interface PlacesTextSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  types: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PlacesTextSearchResponse {
  results: PlacesTextSearchResult[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

// Places API (New) response types
interface PlacesNewPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
}

interface PlacesNewResponse {
  places?: PlacesNewPlace[];
  nextPageToken?: string;
  error?: { message: string; status: string; code: number };
}

// ── Anchor points (24 Primo Brands sites) ────────────────────────────────

const PRIMO_ANCHORS: AnchorPoint[] = [
  { name: "Ontario CA", lat: 34.0365, lng: -117.5931 },
  { name: "Hot Springs AR", lat: 34.6332, lng: -93.0672 },
  { name: "Hot Springs DC AR", lat: 34.5037, lng: -93.0552 },
  { name: "Breinigsville PA", lat: 40.5333, lng: -75.6333 },
  { name: "Cabazon CA", lat: 33.9164, lng: -116.7873 },
  { name: "Hawkins TX", lat: 32.5690, lng: -95.2150 },
  { name: "Hollis ME", lat: 43.5950, lng: -70.6450 },
  { name: "Madison WI", lat: 43.0558, lng: -89.3268 },
  { name: "Stanwood MI", lat: 43.5803, lng: -85.2097 },
  { name: "Poland Spring ME", lat: 44.0558, lng: -70.3475 },
  { name: "Houston TX", lat: 29.6650, lng: -95.3850 },
  { name: "Zephyrhills FL", lat: 28.2461, lng: -82.1811 },
  { name: "Breinigsville NPL PA", lat: 40.5280, lng: -75.6350 },
  { name: "Dallas TX", lat: 32.6949, lng: -96.9470 },
  { name: "Kingfield ME", lat: 44.9580, lng: -70.1530 },
  { name: "Denver CO", lat: 39.7392, lng: -104.9903 },
  { name: "Greenwood IN", lat: 39.5945, lng: -86.1167 },
  { name: "McBee SC", lat: 34.4700, lng: -80.2586 },
  { name: "Sacramento CA", lat: 38.5158, lng: -121.3809 },
  { name: "Pasadena TX", lat: 29.5605, lng: -95.1167 },
  { name: "High Springs FL", lat: 29.8283, lng: -82.5967 },
  { name: "Saratoga Springs NY", lat: 43.0710, lng: -73.7846 },
  { name: "Hot Springs 2 AR", lat: 34.6100, lng: -93.0500 },
  { name: "NFI Breinigsville PA", lat: 40.5340, lng: -75.6290 },
];

const SEARCH_KEYWORDS = [
  "distribution center",
  "warehouse",
  "manufacturing plant",
  "logistics",
  "fulfillment center",
  "cold storage",
  "cross dock",
  "freight terminal",
  "bottling plant",
  "food manufacturing",
  "packaging plant",
  "truck terminal",
];

const DEFAULT_RADIUS_METERS = 40234; // 25 miles
const EXISTING_FACILITY_MATCH_MILES = 0.5;
const INTER_CALL_DELAY_MS = 200;
const PAGINATION_DELAY_MS = 2000;
const MAX_RETRIES = 3;

// ── Utilities ────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function haversineDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function loadApiKey(): string {
  if (process.env.GOOGLE_MAPS_STATIC_API_KEY) return process.env.GOOGLE_MAPS_STATIC_API_KEY;
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) {
    throw new Error('Set GOOGLE_MAPS_STATIC_API_KEY env var or create .env.local at repo root');
  }
  const env = readFileSync(envPath, 'utf8');
  const m = env.match(/^GOOGLE_MAPS_STATIC_API_KEY=(.+)$/m);
  if (!m || !m[1].trim()) throw new Error('GOOGLE_MAPS_STATIC_API_KEY missing from .env.local');
  return m[1].trim();
}

function loadExistingFacilities(): ExistingFacility[] {
  const auditDir = join(ROOT, 'output', 'yard-audits');
  if (!existsSync(auditDir)) return [];

  const facilities: ExistingFacility[] = [];
  const slugs = readdirSync(auditDir).filter((f) => {
    const full = join(auditDir, f);
    return statSync(full).isDirectory() && existsSync(join(full, 'roster.json'));
  });

  for (const slug of slugs) {
    try {
      const roster = JSON.parse(readFileSync(join(auditDir, slug, 'roster.json'), 'utf8'));
      for (const f of roster.facilities) {
        if (f.lat && f.lng) {
          facilities.push({
            account: roster.account,
            slug,
            name: f.name,
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

function findNearestPrimoSite(lat: number, lng: number): { name: string; distanceMiles: number } {
  let best = { name: PRIMO_ANCHORS[0].name, distanceMiles: Infinity };
  for (const anchor of PRIMO_ANCHORS) {
    const d = haversineDistanceMiles(lat, lng, anchor.lat, anchor.lng);
    if (d < best.distanceMiles) best = { name: anchor.name, distanceMiles: round2(d) };
  }
  return best;
}

function findNearestExistingFacility(
  lat: number,
  lng: number,
  existingFacilities: ExistingFacility[],
): { account: string; slug: string; name: string; distanceMiles: number } | null {
  let best: { account: string; slug: string; name: string; distanceMiles: number } | null = null;
  for (const f of existingFacilities) {
    const d = haversineDistanceMiles(lat, lng, f.lat, f.lng);
    if (!best || d < best.distanceMiles) {
      best = { account: f.account, slug: f.slug, name: f.name, distanceMiles: round2(d) };
    }
  }
  return best;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function parseArgs(): { anchor?: string; radius: number; dryRun: boolean } {
  const args = process.argv.slice(2);
  let anchor: string | undefined;
  let radius = DEFAULT_RADIUS_METERS;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--anchor' && args[i + 1]) {
      anchor = args[++i];
    } else if (args[i] === '--radius' && args[i + 1]) {
      radius = parseInt(args[++i], 10);
      if (isNaN(radius) || radius <= 0) {
        process.stderr.write('Error: --radius must be a positive integer (meters)\n');
        process.exit(1);
      }
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: npx tsx scripts/prospect-discovery/places-scanner.ts [options]

Options:
  --anchor "Name"   Scan a single anchor (e.g. "Breinigsville PA")
  --radius <m>      Search radius in meters (default: ${DEFAULT_RADIUS_METERS} = 25mi)
  --dry-run         Show scan plan without making API calls
  --help            Show this help`);
      process.exit(0);
    }
  }

  return { anchor, radius, dryRun };
}

// ── Google Places API (New) ──────────────────────────────────────────────

function convertNewToLegacy(place: PlacesNewPlace): PlacesTextSearchResult {
  return {
    place_id: place.id,
    name: place.displayName?.text ?? '',
    formatted_address: place.formattedAddress ?? '',
    geometry: {
      location: {
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
      },
    },
    types: place.types ?? [],
    business_status: place.businessStatus,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
  };
}

async function fetchNewApiWithRetry(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<PlacesNewResponse> {
  let lastErr = '';
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(1000 * 2 ** attempt);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.businessStatus,places.rating,places.userRatingCount,nextPageToken',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = (await res.text()).slice(0, 300);
        if (res.status === 429) {
          lastErr = 'RATE_LIMITED — backing off';
          await sleep(5000 * (attempt + 1));
          continue;
        }
        lastErr = `HTTP ${res.status}: ${text}`;
        continue;
      }
      const data = (await res.json()) as PlacesNewResponse;
      if (data.error) {
        lastErr = `${data.error.status}: ${data.error.message}`;
        continue;
      }
      return data;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(`Places API failed after ${MAX_RETRIES} attempts: ${lastErr}`);
}

async function searchPlaces(
  apiKey: string,
  query: string,
  lat: number,
  lng: number,
  radius: number,
): Promise<{ results: PlacesTextSearchResult[]; apiCalls: number }> {
  const allResults: PlacesTextSearchResult[] = [];
  let apiCalls = 0;

  const requestBody: Record<string, unknown> = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radius,
      },
    },
    maxResultCount: 20,
  };

  const firstPage = await fetchNewApiWithRetry(apiKey, requestBody);
  apiCalls++;
  if (firstPage.places) {
    allResults.push(...firstPage.places.map(convertNewToLegacy));
  }

  let nextToken = firstPage.nextPageToken;
  while (nextToken) {
    await sleep(PAGINATION_DELAY_MS);
    const pageBody = { ...requestBody, pageToken: nextToken };
    const page = await fetchNewApiWithRetry(apiKey, pageBody);
    apiCalls++;
    if (page.places) {
      allResults.push(...page.places.map(convertNewToLegacy));
    }
    nextToken = page.nextPageToken;
  }

  return { results: allResults, apiCalls };
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs();

  let anchors = PRIMO_ANCHORS;
  if (opts.anchor) {
    const match = PRIMO_ANCHORS.find(
      (a) => a.name.toLowerCase() === opts.anchor!.toLowerCase(),
    );
    if (!match) {
      process.stderr.write(
        `Error: anchor "${opts.anchor}" not found. Available anchors:\n` +
        PRIMO_ANCHORS.map((a) => `  ${a.name}`).join('\n') + '\n',
      );
      process.exit(1);
    }
    anchors = [match];
  }

  const radiusMiles = round2(opts.radius / 1609.344);

  process.stderr.write('\n=== Google Places Corridor Scanner ===\n');
  process.stderr.write(`Anchors: ${anchors.length}\n`);
  process.stderr.write(`Keywords: ${SEARCH_KEYWORDS.length}\n`);
  process.stderr.write(`Radius: ${opts.radius}m (${radiusMiles}mi)\n`);
  process.stderr.write(`Planned API calls: ${anchors.length * SEARCH_KEYWORDS.length} (+ pagination)\n\n`);

  if (opts.dryRun) {
    process.stderr.write('Scan plan:\n');
    for (const anchor of anchors) {
      process.stderr.write(`\n  ${anchor.name} (${anchor.lat}, ${anchor.lng}):\n`);
      for (const kw of SEARCH_KEYWORDS) {
        process.stderr.write(`    - "${kw}" within ${radiusMiles}mi\n`);
      }
    }
    process.stderr.write('\n--dry-run: no API calls made.\n');
    return;
  }

  const apiKey = loadApiKey();

  process.stderr.write('Loading existing account facilities for cross-reference...\n');
  const existingFacilities = loadExistingFacilities();
  process.stderr.write(`Loaded ${formatNumber(existingFacilities.length)} facilities across existing accounts.\n\n`);

  // placeId -> accumulated DiscoveredPlace (pre-enrichment)
  const discoveryMap = new Map<string, {
    result: PlacesTextSearchResult;
    discoveredVia: { anchor: string; keyword: string; distanceMiles: number }[];
  }>();

  let totalApiCalls = 0;
  let totalRawResults = 0;

  for (let ai = 0; ai < anchors.length; ai++) {
    const anchor = anchors[ai];
    for (let ki = 0; ki < SEARCH_KEYWORDS.length; ki++) {
      const keyword = SEARCH_KEYWORDS[ki];
      process.stderr.write(
        `Scanning anchor ${ai + 1}/${anchors.length}: ${anchor.name}` +
        ` | keyword ${ki + 1}/${SEARCH_KEYWORDS.length}: ${keyword}` +
        ` | ${formatNumber(discoveryMap.size)} unique discoveries so far\n`,
      );

      try {
        const { results, apiCalls } = await searchPlaces(
          apiKey,
          keyword,
          anchor.lat,
          anchor.lng,
          opts.radius,
        );
        totalApiCalls += apiCalls;
        totalRawResults += results.length;

        for (const r of results) {
          const distToAnchor = round2(
            haversineDistanceMiles(r.geometry.location.lat, r.geometry.location.lng, anchor.lat, anchor.lng),
          );
          const via = { anchor: anchor.name, keyword, distanceMiles: distToAnchor };

          const existing = discoveryMap.get(r.place_id);
          if (existing) {
            existing.discoveredVia.push(via);
          } else {
            discoveryMap.set(r.place_id, { result: r, discoveredVia: [via] });
          }
        }
      } catch (err) {
        process.stderr.write(
          `  ERROR scanning "${keyword}" at ${anchor.name}: ${err instanceof Error ? err.message : err}\n`,
        );
      }

      await sleep(INTER_CALL_DELAY_MS);
    }
  }

  process.stderr.write(`\nDeduplicating and enriching ${formatNumber(discoveryMap.size)} unique places...\n`);

  const discoveries: DiscoveredPlace[] = [];

  for (const [placeId, entry] of discoveryMap) {
    const { result, discoveredVia } = entry;
    const lat = result.geometry.location.lat;
    const lng = result.geometry.location.lng;

    const nearestPrimo = findNearestPrimoSite(lat, lng);
    const nearestExisting = findNearestExistingFacility(lat, lng, existingFacilities);

    const isExisting = nearestExisting !== null && nearestExisting.distanceMiles <= EXISTING_FACILITY_MATCH_MILES;

    const place: DiscoveredPlace = {
      placeId,
      name: result.name,
      address: result.formatted_address,
      lat,
      lng,
      types: result.types,
      businessStatus: result.business_status ?? 'UNKNOWN',
      rating: result.rating,
      userRatingsTotal: result.user_ratings_total,
      discoveredVia,
      nearestPrimoSite: nearestPrimo,
      isExistingAccount: isExisting,
    };

    if (nearestExisting) {
      place.nearestExistingFacility = {
        account: nearestExisting.account,
        name: nearestExisting.name,
        distanceMiles: nearestExisting.distanceMiles,
      };
      if (isExisting) {
        place.existingAccountSlug = nearestExisting.slug;
      }
    }

    discoveries.push(place);
  }

  discoveries.sort((a, b) => (b.userRatingsTotal ?? 0) - (a.userRatingsTotal ?? 0));

  const netNew = discoveries.filter((d) => !d.isExistingAccount);

  const scanDate = new Date().toISOString().slice(0, 10);
  const output: CorridorScanResult = {
    scanDate,
    anchorsScanned: anchors.length,
    keywordsPerAnchor: SEARCH_KEYWORDS.length,
    totalApiCalls,
    totalDiscovered: totalRawResults,
    totalAfterDedup: discoveries.length,
    totalNetNew: netNew.length,
    discoveries,
  };

  const outDir = join(ROOT, 'output', 'prospect-discovery');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `corridor-scan-${scanDate}.json`);
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  // ── Console summary ──────────────────────────────────────────────────

  const existingCount = discoveries.length - netNew.length;

  console.log('\n=== Corridor Scan Complete ===');
  console.log(`Anchors scanned: ${anchors.length}`);
  console.log(`Keywords per anchor: ${SEARCH_KEYWORDS.length}`);
  console.log(`Total API calls: ${formatNumber(totalApiCalls)} (incl. pagination)`);
  console.log(`Raw discoveries: ${formatNumber(totalRawResults)}`);
  console.log(`After dedup (by Place ID): ${formatNumber(discoveries.length)}`);
  console.log(`Already in pipeline: ${formatNumber(existingCount)}`);
  console.log(`NET NEW prospects: ${formatNumber(netNew.length)}`);
  console.log(`\nOutput: ${outPath}`);

  const top20 = netNew
    .filter((d) => d.userRatingsTotal != null && d.userRatingsTotal > 0)
    .slice(0, 20);

  if (top20.length > 0) {
    console.log(`\nTop ${top20.length} by user_ratings_total (scale proxy):`);
    top20.forEach((d, i) => {
      const city = d.address.split(',').slice(-3, -1).join(',').trim() || d.address;
      console.log(
        `${String(i + 1).padStart(2)}. ${d.name} — ${city}` +
        ` — ${formatNumber(d.userRatingsTotal!)} ratings` +
        ` — ${d.nearestPrimoSite.distanceMiles}mi from Primo ${d.nearestPrimoSite.name}`,
      );
    });
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
