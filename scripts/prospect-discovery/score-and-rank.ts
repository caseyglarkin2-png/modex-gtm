/**
 * Prospect Scoring & Cross-Reference Pipeline
 *
 * Reads corridor-scan discoveries from the Places API scanner, scores each
 * against YardFlow's ICP criteria, deduplicates against existing audited
 * accounts, clusters into geographic corridors, and outputs a ranked JSON +
 * CSV for HubSpot import.
 *
 * Usage:
 *   npx tsx scripts/prospect-discovery/score-and-rank.ts
 *   npx tsx scripts/prospect-discovery/score-and-rank.ts --input path/to/scan.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────

interface DiscoveredPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  types: string[];
  userRatingsTotal: number | null;
  discoveredVia: string[];
  estimatedRevenue?: string;
  estimatedFacilities?: number;
  vertical?: string;
}

interface ScoreBreakdown {
  verticalMatch: number;
  enterpriseScale: number;
  networkComplexity: number;
  primoProximity: number;
  corridorDensity: number;
  placeTypeBonus: number;
}

interface ScoredProspect {
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  icpScore: number;
  tier: 'A' | 'B' | 'C' | 'D';
  scoreBreakdown: ScoreBreakdown;
  isExistingAccount: boolean;
  existingAccountSlug?: string;
  nearestPrimoSite: { name: string; distanceMiles: number };
  corridor: string;
  discoveredVia: string[];
}

interface Corridor {
  name: string;
  center: { lat: number; lng: number };
  radiusMiles: number;
  totalProspects: number;
  tierACount: number;
  avgIcpScore: number;
  topProspects: string[];
}

interface ScoredOutput {
  generatedAt: string;
  inputFile: string;
  totalDiscoveries: number;
  existingAccountMatches: number;
  netNewProspects: number;
  tierA: number;
  tierB: number;
  tierC: number;
  tierD: number;
  corridors: Corridor[];
  prospects: ScoredProspect[];
}

// ── Existing-account facility record ─────────────────────────────────────

interface ExistingFacility {
  accountSlug: string;
  accountName: string;
  facilityName: string;
  lat: number;
  lng: number;
}

// ── Primo Brands anchor sites (mirrored from primo-proximity-gtm.ts) ─────

interface PrimoSite {
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const PRIMO_SITES: PrimoSite[] = [
  { name: "US PL Ontario Factory", city: "Ontario", state: "CA", lat: 34.0365, lng: -117.5931 },
  { name: "US PL Hot Springs Factory", city: "Hot Springs", state: "AR", lat: 34.6332, lng: -93.0672 },
  { name: "US DC Hot Springs (WHSE)", city: "Hot Springs", state: "AR", lat: 34.5037, lng: -93.0552 },
  { name: "US PL Allentown Factory", city: "Breinigsville", state: "PA", lat: 40.5333, lng: -75.6333 },
  { name: "US PL Cabazon Factory", city: "Cabazon", state: "CA", lat: 33.9164, lng: -116.7873 },
  { name: "US PL Hawkins Factory", city: "Hawkins", state: "TX", lat: 32.5690, lng: -95.2150 },
  { name: "US PL Hollis Factory", city: "Hollis", state: "ME", lat: 43.5950, lng: -70.6450 },
  { name: "US PL Madison Factory", city: "Madison", state: "WI", lat: 43.0558, lng: -89.3268 },
  { name: "US PL Mecosta Factory", city: "Stanwood", state: "MI", lat: 43.5803, lng: -85.2097 },
  { name: "US PL Poland Spring Factory", city: "Poland Spring", state: "ME", lat: 44.0558, lng: -70.3475 },
  { name: "US PL S Houston Factory", city: "Houston", state: "TX", lat: 29.6650, lng: -95.3850 },
  { name: "US PL Zephyrhills Factory", city: "Zephyrhills", state: "FL", lat: 28.2461, lng: -82.1811 },
  { name: "US PL Allentown NPL Factory", city: "Breinigsville", state: "PA", lat: 40.5280, lng: -75.6350 },
  { name: "US PL Dallas 2 Factory", city: "Dallas", state: "TX", lat: 32.6949, lng: -96.9470 },
  { name: "US PL Kingfield Factory", city: "Kingfield", state: "ME", lat: 44.9580, lng: -70.1530 },
  { name: "US PL Denver Factory", city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { name: "US PL Greenwood Indiana", city: "Greenwood", state: "IN", lat: 39.5945, lng: -86.1167 },
  { name: "US PL McBee Factory", city: "McBee", state: "SC", lat: 34.4700, lng: -80.2586 },
  { name: "US PL Sacramento Factory", city: "Sacramento", state: "CA", lat: 38.5158, lng: -121.3809 },
  { name: "US PL Pasadena Factory", city: "Pasadena", state: "TX", lat: 29.5605, lng: -95.1167 },
  { name: "US PL High Springs Factory", city: "High Springs", state: "FL", lat: 29.8283, lng: -82.5967 },
  { name: "US PL Saratoga Spring Factory", city: "Saratoga Springs", state: "NY", lat: 43.0710, lng: -73.7846 },
  { name: "US PL Hot Springs 2 Factory", city: "Hot Springs", state: "AR", lat: 34.6100, lng: -93.0500 },
  { name: "US DC NFI - Breinigsville", city: "Breinigsville", state: "PA", lat: 40.5340, lng: -75.6290 },
];

// ── Known account slugs and display names ────────────────────────────────
// Mirrors scripts/yard-audit/slug-map.ts ENTRIES so we do not need a TS
// import of the app's path-aliased module from a standalone script.

const KNOWN_ACCOUNTS: { slug: string; name: string }[] = [
  { slug: 'ab-inbev', name: 'AB InBev' },
  { slug: 'barnes-noble', name: 'Barnes & Noble' },
  { slug: 'bob-evans-farms', name: 'Bob Evans Farms' },
  { slug: 'boston-beer-company', name: 'The Boston Beer Company' },
  { slug: 'campbells', name: "Campbell's" },
  { slug: 'caterpillar', name: 'Caterpillar' },
  { slug: 'cj-logistics-america', name: 'CJ Logistics America' },
  { slug: 'coca-cola', name: 'The Coca-Cola Company' },
  { slug: 'constellation-brands', name: 'Constellation Brands' },
  { slug: 'cost-plus-world-market', name: 'Cost Plus World Market' },
  { slug: 'crowley', name: 'Crowley' },
  { slug: 'daimler-truck-north-america', name: 'Daimler Truck North America' },
  { slug: 'dannon', name: 'Danone / Dannon' },
  { slug: 'dhl-supply-chain', name: 'DHL Supply Chain' },
  { slug: 'diageo', name: 'Diageo' },
  { slug: 'fedex', name: 'FedEx' },
  { slug: 'ford', name: 'Ford Motor Company' },
  { slug: 'frito-lay', name: 'Frito-Lay' },
  { slug: 'general-mills', name: 'General Mills' },
  { slug: 'georgia-pacific', name: 'Georgia-Pacific' },
  { slug: 'gxo', name: 'GXO Logistics' },
  { slug: 'h-e-b', name: 'H-E-B' },
  { slug: 'honda', name: 'Honda' },
  { slug: 'hormel-foods', name: 'Hormel Foods' },
  { slug: 'hyundai-motor-america', name: 'Hyundai Motor America' },
  { slug: 'jm-smucker', name: 'The J.M. Smucker Company' },
  { slug: 'john-deere', name: 'John Deere' },
  { slug: 'kenco-logistics', name: 'Kenco Logistics Services' },
  { slug: 'keurig-dr-pepper', name: 'Keurig Dr Pepper' },
  { slug: 'kimberly-clark', name: 'Kimberly-Clark' },
  { slug: 'kraft-heinz', name: 'Kraft Heinz' },
  { slug: 'mondelez', name: 'Mondelez International' },
  { slug: 'nestle-usa', name: 'Nestle USA' },
  { slug: 'niagara-bottling', name: 'Niagara Bottling' },
  { slug: 'pactiv-evergreen', name: 'Pactiv Evergreen' },
  { slug: 'performance-food-group', name: 'Performance Food Group' },
  { slug: 'salson-logistics', name: 'SalSon Logistics' },
  { slug: 'sc-johnson', name: 'SC Johnson' },
  { slug: 'the-home-depot', name: 'The Home Depot' },
  { slug: 'toyota', name: 'Toyota Motor North America' },
  { slug: 'unfi', name: 'UNFI' },
  { slug: 'universal-logistics', name: 'Universal Logistics Holdings' },
  { slug: 'westrock-coffee', name: 'Westrock Coffee' },
  { slug: 'amazon', name: 'Amazon' },
  { slug: 'costco', name: 'Costco Wholesale' },
  { slug: 'harris-teeter', name: 'Harris Teeter' },
  { slug: 'kroger', name: 'The Kroger Co.' },
  { slug: 'publix', name: 'Publix Super Markets' },
  { slug: 'sams-club', name: "Sam's Club" },
  { slug: 'seven-eleven', name: '7-Eleven' },
  { slug: 'stop-and-shop', name: 'Stop & Shop' },
  { slug: 'target', name: 'Target' },
  { slug: 'walmart', name: 'Walmart' },
];

// ── Haversine (same implementation as primo-proximity-gtm.ts) ────────────

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

// ── ICP vertical keyword sets ────────────────────────────────────────────

const VERTICAL_RULES: { keywords: string[]; points: number }[] = [
  { keywords: ['food', 'beverage', 'dairy', 'bottling', 'brewery', 'bakery', 'meat', 'poultry', 'snack', 'confection', 'coffee', 'cereal', 'frozen', 'produce', 'grain', 'flour', 'sugar', 'spice', 'sauce', 'canned', 'deli', 'fresh', 'organic', 'nutrition', 'pet food', 'animal feed'], points: 25 },
  { keywords: ['logistics', 'distribution', 'warehouse', 'fulfillment', 'freight', 'supply chain', '3pl', 'cold storage', 'intermodal', 'drayage', 'cross-dock', 'crossdock', 'transload', 'last mile', 'courier', 'parcel'], points: 25 },
  { keywords: ['manufacturing', 'industrial', 'plant', 'factory', 'production', 'assembly', 'fabricat'], points: 20 },
  { keywords: ['retail', 'grocery', 'supermarket', 'wholesale', 'club', 'pharmacy', 'drug store', 'dollar', 'convenience', 'c-store'], points: 20 },
  { keywords: ['automotive', 'motor', 'truck', 'equipment', 'machinery', 'vehicle', 'parts', 'tire'], points: 20 },
  { keywords: ['packaging', 'container', 'bottle', 'can', 'corrugat', 'paper', 'pulp', 'tissue'], points: 15 },
  { keywords: ['chemical', 'paint', 'adhesive', 'cleaning', 'detergent', 'personal care', 'cosmetic'], points: 15 },
  { keywords: ['building', 'construction', 'lumber', 'concrete', 'steel', 'hardware', 'home improvement'], points: 12 },
];

const KNOWN_BRAND_VERTICALS: Record<string, number> = {
  'mclane': 25, 'lineage': 25, 'americold': 25, 'sysco': 25, 'us foods': 25,
  'core-mark': 25, 'dot foods': 25, 'vistar': 25, 'performance food': 25,
  'bimbo': 25, 'flowers foods': 25, 'pepsi': 25, 'coke': 25, 'nestle': 25,
  'tyson': 25, 'jbs': 25, 'cargill': 25, 'adm': 25, 'conagra': 25,
  'xpo': 25, 'ryder': 25, 'penske': 25, 'ceva': 25, 'nfi': 25, 'geodis': 25,
  'dhl': 25, 'fedex': 25, 'ups': 25, 'amazon': 20, 'walmart': 20,
  'kroger': 20, 'costco': 20, 'target': 20, 'publix': 20, 'h-e-b': 20,
  'aldi': 20, 'lidl': 20, 'wakefern': 20, 'shoprite': 20, 'ahold': 20,
  'albertsons': 20, 'safeway': 20,
};

// ── Scoring functions ────────────────────────────────────────────────────

function scoreVertical(place: DiscoveredPlace): number {
  if (place.vertical) {
    const v = place.vertical.toLowerCase();
    for (const rule of VERTICAL_RULES) {
      if (rule.keywords.some(kw => v.includes(kw))) return rule.points;
    }
  }

  const haystack = [
    place.name,
    place.address,
    ...(place.types || []),
  ].join(' ').toLowerCase();

  for (const [brand, points] of Object.entries(KNOWN_BRAND_VERTICALS)) {
    if (haystack.includes(brand)) return points;
  }

  for (const rule of VERTICAL_RULES) {
    if (rule.keywords.some(kw => haystack.includes(kw))) return rule.points;
  }
  return 0;
}

function scoreEnterpriseScale(place: DiscoveredPlace): number {
  const rev = place.estimatedRevenue;
  if (!rev) return 0;
  const revBillions = parseRevenueBillions(rev);
  if (revBillions >= 10) return 25;
  if (revBillions >= 5) return 22;
  if (revBillions >= 1) return 18;
  if (revBillions >= 0.5) return 14;
  if (revBillions >= 0.1) return 10;
  if (revBillions >= 0.05) return 6;
  if (revBillions > 0) return 3;
  return 0;
}

function parseRevenueBillions(rev: string): number {
  const cleaned = rev.replace(/[,$]/g, '').trim();
  const match = cleaned.match(/([\d.]+)\s*(B|M|K|billion|million|thousand)?/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = (match[2] || '').toUpperCase();
  if (unit.startsWith('B')) return num;
  if (unit.startsWith('M')) return num / 1000;
  if (unit.startsWith('K') || unit.startsWith('T')) return num / 1_000_000;
  return num >= 100 ? num / 1000 : num;
}

function scoreNetworkComplexity(place: DiscoveredPlace): number {
  const f = place.estimatedFacilities;
  if (f == null || f <= 0) return 0;
  if (f >= 50) return 25;
  if (f >= 25) return 20;
  if (f >= 10) return 15;
  if (f >= 5) return 10;
  return 5;
}

function findNearestPrimo(lat: number, lng: number): { name: string; distanceMiles: number } {
  let best = { name: PRIMO_SITES[0].name, distanceMiles: Infinity };
  for (const ps of PRIMO_SITES) {
    const d = haversineDistanceMiles(lat, lng, ps.lat, ps.lng);
    if (d < best.distanceMiles) {
      best = { name: ps.name, distanceMiles: Math.round(d * 10) / 10 };
    }
  }
  return best;
}

function scorePrimoProximity(distanceMiles: number): number {
  if (distanceMiles <= 5) return 10;
  if (distanceMiles <= 10) return 8;
  if (distanceMiles <= 25) return 5;
  if (distanceMiles <= 50) return 3;
  return 0;
}

function scoreCorridorDensity(
  idx: number,
  places: DiscoveredPlace[],
): number {
  let neighbors = 0;
  const me = places[idx];
  for (let j = 0; j < places.length; j++) {
    if (j === idx) continue;
    if (haversineDistanceMiles(me.lat, me.lng, places[j].lat, places[j].lng) <= 5) {
      neighbors++;
    }
  }
  if (neighbors >= 10) return 5;
  if (neighbors >= 5) return 3;
  if (neighbors >= 2) return 1;
  return 0;
}

function scorePlaceTypes(place: DiscoveredPlace): number {
  const types = (place.types || []).map(t => t.toLowerCase());
  const hasEstablishment = types.includes('establishment');
  const hasYardType = types.some(t =>
    ['storage', 'moving_company', 'warehouse'].includes(t),
  );
  if (hasEstablishment && hasYardType) return 10;
  if (types.some(t => ['food', 'store'].includes(t))) return 5;
  return 0;
}

function assignTier(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 70) return 'A';
  if (score >= 50) return 'B';
  if (score >= 30) return 'C';
  return 'D';
}

// ── Name normalization for fuzzy dedup ───────────────────────────────────

const STRIP_SUFFIXES = /\b(inc|llc|corp|co|ltd|lp|company|corporation|enterprises|holdings|group|international|north america)\b/gi;

function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(STRIP_SUFFIXES, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Existing-account dedup ───────────────────────────────────────────────

function matchExistingAccount(
  place: DiscoveredPlace,
  existingFacilities: ExistingFacility[],
  normalizedAccountNames: Map<string, string>, // normalized -> slug
): { match: boolean; slug?: string } {
  // 1. Geo proximity check: within 0.3 miles of any known facility
  for (const fac of existingFacilities) {
    const d = haversineDistanceMiles(place.lat, place.lng, fac.lat, fac.lng);
    if (d <= 0.3) {
      return { match: true, slug: fac.accountSlug };
    }
  }

  // 2. Fuzzy name match against known account names
  const placeName = normalizeName(place.name);
  for (const [normalizedAcct, slug] of normalizedAccountNames) {
    if (
      placeName.includes(normalizedAcct) ||
      normalizedAcct.includes(placeName)
    ) {
      // Avoid false positives on very short names (e.g. "ford" matching "Bedford")
      if (normalizedAcct.length >= 4 || placeName === normalizedAcct) {
        return { match: true, slug };
      }
    }
  }

  return { match: false };
}

// ── Corridor clustering (simple single-linkage) ─────────────────────────

function clusterIntoCorrridors(
  prospects: ScoredProspect[],
): Corridor[] {
  const CLUSTER_RADIUS_MILES = 10;
  const assigned = new Array<number>(prospects.length).fill(-1);
  const clusters: number[][] = [];

  for (let i = 0; i < prospects.length; i++) {
    if (assigned[i] >= 0) continue;

    // Start a new cluster
    const clusterIdx = clusters.length;
    const members = [i];
    assigned[i] = clusterIdx;

    // Expand: find all prospects within CLUSTER_RADIUS_MILES of any member
    let frontier = [i];
    while (frontier.length > 0) {
      const nextFrontier: number[] = [];
      for (const mi of frontier) {
        for (let j = 0; j < prospects.length; j++) {
          if (assigned[j] >= 0) continue;
          const d = haversineDistanceMiles(
            prospects[mi].lat, prospects[mi].lng,
            prospects[j].lat, prospects[j].lng,
          );
          if (d <= CLUSTER_RADIUS_MILES) {
            assigned[j] = clusterIdx;
            members.push(j);
            nextFrontier.push(j);
          }
        }
      }
      frontier = nextFrontier;
    }
    clusters.push(members);
  }

  // Build Corridor objects
  const corridors: Corridor[] = clusters.map(memberIdxs => {
    const members = memberIdxs.map(i => prospects[i]);

    // Name by most common city/state extracted from address
    const cityStateCounts = new Map<string, number>();
    for (const m of members) {
      const cs = extractCityState(m.address);
      if (cs) cityStateCounts.set(cs, (cityStateCounts.get(cs) || 0) + 1);
    }
    let corridorName = 'Unknown';
    let maxCount = 0;
    for (const [cs, count] of cityStateCounts) {
      if (count > maxCount) {
        maxCount = count;
        corridorName = cs;
      }
    }

    // Center = centroid
    const cLat = members.reduce((s, m) => s + m.lat, 0) / members.length;
    const cLng = members.reduce((s, m) => s + m.lng, 0) / members.length;

    // Radius = max distance from center to any member
    let radiusMiles = 0;
    for (const m of members) {
      const d = haversineDistanceMiles(cLat, cLng, m.lat, m.lng);
      if (d > radiusMiles) radiusMiles = d;
    }

    const tierAMembers = members.filter(m => m.tier === 'A');
    const avgScore = members.reduce((s, m) => s + m.icpScore, 0) / members.length;

    // Top 5 by score
    const sorted = [...members].sort((a, b) => b.icpScore - a.icpScore);
    const topProspects = sorted.slice(0, 5).map(m => m.name);

    return {
      name: corridorName,
      center: { lat: Math.round(cLat * 10000) / 10000, lng: Math.round(cLng * 10000) / 10000 },
      radiusMiles: Math.round(radiusMiles * 10) / 10,
      totalProspects: members.length,
      tierACount: tierAMembers.length,
      avgIcpScore: Math.round(avgScore * 10) / 10,
      topProspects,
    };
  });

  // Sort corridors by total ICP score descending
  corridors.sort((a, b) => (b.avgIcpScore * b.totalProspects) - (a.avgIcpScore * a.totalProspects));

  // Assign corridor names back to prospects
  for (let i = 0; i < prospects.length; i++) {
    const ci = assigned[i];
    prospects[i].corridor = corridors.find(c => c === corridors[clusters.indexOf(clusters.find(cl => cl.includes(i))!)])?.name || 'Unknown';
  }

  // Simpler assignment: rebuild lookup
  for (let ci = 0; ci < clusters.length; ci++) {
    const corridorName = corridors[ci].name;
    for (const pi of clusters[ci]) {
      prospects[pi].corridor = corridorName;
    }
  }

  return corridors;
}

/** Extract "City, ST" from a Google Places address string. */
function extractCityState(address: string): string | null {
  // Typical format: "123 Main St, Springfield, IL 62701, USA"
  const parts = address.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    const city = parts[parts.length - 3];
    const stateZip = parts[parts.length - 2];
    const stateMatch = stateZip.match(/^([A-Z]{2})\b/);
    if (stateMatch) return `${city}, ${stateMatch[1]}`;
    // Return city + raw state segment
    return `${city}, ${stateZip}`;
  }
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return null;
}

// ── Input resolution ─────────────────────────────────────────────────────

function resolveInputFile(): string {
  // Check --input flag
  const inputFlagIdx = process.argv.indexOf('--input');
  if (inputFlagIdx >= 0 && process.argv[inputFlagIdx + 1]) {
    const explicit = path.resolve(process.argv[inputFlagIdx + 1]);
    if (!fs.existsSync(explicit)) {
      console.error(`Input file not found: ${explicit}`);
      process.exit(1);
    }
    return explicit;
  }

  // Find latest corridor-scan-*.json
  const scanDir = path.resolve(__dirname, '../../output/prospect-discovery');
  if (!fs.existsSync(scanDir)) {
    console.error(`Scan output directory does not exist: ${scanDir}`);
    console.error('Run the places-scanner first, or pass --input <file>.');
    process.exit(1);
  }

  const scanFiles = fs.readdirSync(scanDir)
    .filter(f => f.startsWith('corridor-scan-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (scanFiles.length === 0) {
    console.error('No corridor-scan-*.json files found in output/prospect-discovery/.');
    console.error('Run the places-scanner first, or pass --input <file>.');
    process.exit(1);
  }

  return path.join(scanDir, scanFiles[0]);
}

// ── CSV generation ───────────────────────────────────────────────────────

function escapeCsv(val: string | number | boolean | undefined | null): string {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(prospects: ScoredProspect[]): string {
  const headers = [
    'Name', 'Address', 'Lat', 'Lng', 'PlaceId',
    'ICP Score', 'Tier',
    'Vertical Match', 'Enterprise Scale', 'Network Complexity', 'Primo Proximity', 'Corridor Density', 'Place Type Bonus',
    'Is Existing Account', 'Existing Account Slug',
    'Nearest Primo Site', 'Primo Distance (mi)',
    'Corridor', 'Discovered Via',
  ];

  const rows = prospects.map(p => [
    escapeCsv(p.name),
    escapeCsv(p.address),
    p.lat,
    p.lng,
    escapeCsv(p.placeId),
    p.icpScore,
    p.tier,
    p.scoreBreakdown.verticalMatch,
    p.scoreBreakdown.enterpriseScale,
    p.scoreBreakdown.networkComplexity,
    p.scoreBreakdown.primoProximity,
    p.scoreBreakdown.corridorDensity,
    p.scoreBreakdown.placeTypeBonus,
    p.isExistingAccount,
    escapeCsv(p.existingAccountSlug),
    escapeCsv(p.nearestPrimoSite.name),
    p.nearestPrimoSite.distanceMiles,
    escapeCsv(p.corridor),
    escapeCsv(p.discoveredVia.join('; ')),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const repoRoot = path.resolve(__dirname, '../..');

  // 1. Load existing account facilities from roster.json files
  console.log('Loading existing account facilities...');
  const auditDir = path.join(repoRoot, 'output/yard-audits');
  const existingFacilities: ExistingFacility[] = [];

  for (const acct of KNOWN_ACCOUNTS) {
    const rosterPath = path.join(auditDir, acct.slug, 'roster.json');
    if (!fs.existsSync(rosterPath)) continue;
    try {
      const roster = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
      for (const f of roster.facilities || []) {
        if (f.lat && f.lng) {
          existingFacilities.push({
            accountSlug: acct.slug,
            accountName: roster.account || acct.name,
            facilityName: f.name,
            lat: f.lat,
            lng: f.lng,
          });
        }
      }
    } catch {
      // Skip malformed roster files
    }
  }
  console.log(`  ${existingFacilities.length} existing facilities across ${KNOWN_ACCOUNTS.length} accounts.`);

  // Build normalized name lookup for fuzzy dedup
  const normalizedAccountNames = new Map<string, string>();
  for (const acct of KNOWN_ACCOUNTS) {
    normalizedAccountNames.set(normalizeName(acct.name), acct.slug);
    // Also add the slug as a searchable variant
    normalizedAccountNames.set(acct.slug.replace(/-/g, ' '), acct.slug);
  }

  // 2. Load discovery input
  const inputFile = resolveInputFile();
  console.log(`Loading discoveries from: ${inputFile}`);
  const rawInput = fs.readFileSync(inputFile, 'utf-8');
  let discoveries: DiscoveredPlace[];
  try {
    const parsed = JSON.parse(rawInput);
    // Handle both bare arrays and objects with a .places / .discoveries key
    discoveries = Array.isArray(parsed)
      ? parsed
      : (parsed.places || parsed.discoveries || parsed.results || []);
  } catch (e) {
    console.error('Failed to parse input JSON:', e);
    process.exit(1);
  }

  if (discoveries.length === 0) {
    console.error('No discoveries found in input file.');
    process.exit(1);
  }
  console.log(`  ${discoveries.length} discoveries loaded.`);

  // 3. Score each discovery
  console.log('Scoring discoveries...');
  const scored: ScoredProspect[] = [];

  for (let i = 0; i < discoveries.length; i++) {
    const place = discoveries[i];
    const verticalMatch = scoreVertical(place);
    const enterpriseScale = scoreEnterpriseScale(place);
    const networkComplexity = scoreNetworkComplexity(place);
    const nearest = findNearestPrimo(place.lat, place.lng);
    const primoProximity = scorePrimoProximity(nearest.distanceMiles);
    const corridorDensity = scoreCorridorDensity(i, discoveries);
    const placeTypeBonus = scorePlaceTypes(place);

    const icpScore = verticalMatch + enterpriseScale + networkComplexity + primoProximity + corridorDensity + placeTypeBonus;

    // 4. Dedup against existing accounts
    const existingMatch = matchExistingAccount(place, existingFacilities, normalizedAccountNames);

    scored.push({
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
      icpScore,
      tier: assignTier(icpScore),
      scoreBreakdown: {
        verticalMatch,
        enterpriseScale,
        networkComplexity,
        primoProximity,
        corridorDensity,
        placeTypeBonus,
      },
      isExistingAccount: existingMatch.match,
      existingAccountSlug: existingMatch.slug,
      nearestPrimoSite: nearest,
      corridor: '', // populated during clustering
      discoveredVia: place.discoveredVia || [],
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.icpScore - a.icpScore);

  // 5. Cluster into corridors
  console.log('Clustering into corridors...');
  const corridors = clusterIntoCorrridors(scored);

  // 6. Build output
  const existingCount = scored.filter(p => p.isExistingAccount).length;
  const netNew = scored.filter(p => !p.isExistingAccount);

  const today = new Date().toISOString().slice(0, 10);

  const output: ScoredOutput = {
    generatedAt: new Date().toISOString(),
    inputFile: path.basename(inputFile),
    totalDiscoveries: scored.length,
    existingAccountMatches: existingCount,
    netNewProspects: netNew.length,
    tierA: scored.filter(p => p.tier === 'A').length,
    tierB: scored.filter(p => p.tier === 'B').length,
    tierC: scored.filter(p => p.tier === 'C').length,
    tierD: scored.filter(p => p.tier === 'D').length,
    corridors,
    prospects: scored,
  };

  // Write JSON
  const outDir = path.join(repoRoot, 'output/prospect-discovery');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `scored-prospects-${today}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`\nJSON saved: ${jsonPath}`);

  // Write CSV
  const csvPath = path.join(outDir, `scored-prospects-${today}.csv`);
  fs.writeFileSync(csvPath, buildCsv(scored));
  console.log(`CSV saved:  ${csvPath}`);

  // 7. Console summary
  console.log(`\n${'='.repeat(110)}`);
  console.log('PROSPECT SCORING SUMMARY');
  console.log(`${'='.repeat(110)}`);
  console.log(`Total discoveries: ${scored.length}`);
  console.log(`Existing account matches: ${existingCount}`);
  console.log(`Net-new prospects: ${netNew.length}`);
  console.log(`Tier A (>=70): ${output.tierA}  |  Tier B (50-69): ${output.tierB}  |  Tier C (30-49): ${output.tierC}  |  Tier D (<30): ${output.tierD}`);

  // Top 50 net-new table
  console.log(`\n${'='.repeat(110)}`);
  console.log('TOP 50 NET-NEW PROSPECTS');
  console.log(`${'='.repeat(110)}`);

  const hdr = [
    pad('Rank', 5),
    pad('Name', 35),
    pad('City/State', 22),
    pad('ICP', 5),
    pad('Tier', 5),
    pad('Vert', 5),
    pad('Scale', 5),
    pad('Net', 5),
    pad('Primo', 5),
    pad('Corridor', 20),
  ].join(' | ');
  console.log(hdr);
  console.log('-'.repeat(hdr.length));

  const top50 = netNew.slice(0, 50);
  for (let i = 0; i < top50.length; i++) {
    const p = top50[i];
    const cityState = extractCityState(p.address) || '-';
    console.log([
      pad(String(i + 1), 5),
      pad(p.name.slice(0, 34), 35),
      pad(cityState.slice(0, 21), 22),
      pad(String(p.icpScore), 5),
      pad(p.tier, 5),
      pad(String(p.scoreBreakdown.verticalMatch), 5),
      pad(String(p.scoreBreakdown.enterpriseScale), 5),
      pad(String(p.scoreBreakdown.networkComplexity), 5),
      pad(String(p.nearestPrimoSite.distanceMiles), 5),
      pad(p.corridor.slice(0, 19), 20),
    ].join(' | '));
  }

  // Corridor summary
  console.log(`\n${'='.repeat(90)}`);
  console.log('CORRIDOR SUMMARY');
  console.log(`${'='.repeat(90)}`);

  const cHdr = [
    pad('Corridor', 28),
    pad('Total', 6),
    pad('Tier A', 7),
    pad('Avg Score', 10),
    pad('Top Prospect', 35),
  ].join(' | ');
  console.log(cHdr);
  console.log('-'.repeat(cHdr.length));

  for (const c of corridors) {
    console.log([
      pad(c.name.slice(0, 27), 28),
      pad(String(c.totalProspects), 6),
      pad(String(c.tierACount), 7),
      pad(String(c.avgIcpScore), 10),
      pad((c.topProspects[0] || '-').slice(0, 34), 35),
    ].join(' | '));
  }

  console.log(`\nDone.`);
}

/** Right-pad a string to a fixed width. */
function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
