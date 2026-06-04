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
  excluded: boolean;
  excludeReason?: string;
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

// Known-brand enrichment. Places API results carry no revenue or facility
// count, so a discovered "Sysco Dallas DC" would otherwise score 0 on the two
// dimensions that matter most. This map lets a name match inherit the parent
// company's vertical points (v, 0-25), approximate revenue ($B), and US
// facility footprint. Numbers are deliberately banded, not precise — the
// scorers only read them through threshold bands. Tokens are lowercase
// substrings chosen to be distinctive enough to avoid false matches.
interface BrandProfile { v: number; revB: number; fac: number; }

const KNOWN_BRANDS: Record<string, BrandProfile> = {
  // ── 3PL / logistics / distribution ──
  'xpo': { v: 25, revB: 8, fac: 100 },
  'ryder': { v: 25, revB: 12, fac: 300 },
  'penske': { v: 25, revB: 13, fac: 300 },
  'ceva': { v: 25, revB: 18, fac: 150 },
  'nfi': { v: 25, revB: 3, fac: 70 },
  'geodis': { v: 25, revB: 14, fac: 100 },
  'dhl': { v: 25, revB: 30, fac: 200 },
  'fedex': { v: 25, revB: 90, fac: 700 },
  'united parcel': { v: 25, revB: 90, fac: 1000 },
  'schneider': { v: 25, revB: 6, fac: 50 },
  'j.b. hunt': { v: 25, revB: 13, fac: 50 },
  'jb hunt': { v: 25, revB: 13, fac: 50 },
  'knight-swift': { v: 25, revB: 7, fac: 100 },
  'swift transportation': { v: 25, revB: 7, fac: 100 },
  'old dominion': { v: 25, revB: 6, fac: 250 },
  'estes': { v: 25, revB: 5, fac: 270 },
  'saia': { v: 25, revB: 3, fac: 190 },
  'arcbest': { v: 25, revB: 4, fac: 240 },
  'abf freight': { v: 25, revB: 4, fac: 240 },
  'saddle creek': { v: 25, revB: 1, fac: 50 },
  'americold': { v: 25, revB: 3, fac: 250 },
  'lineage': { v: 25, revB: 5, fac: 400 },
  'expeditors': { v: 25, revB: 10, fac: 350 },
  'c.h. robinson': { v: 25, revB: 17, fac: 40 },
  'ch robinson': { v: 25, revB: 17, fac: 40 },
  'uline': { v: 25, revB: 9, fac: 13 },
  'dsv': { v: 25, revB: 25, fac: 100 },
  'kuehne': { v: 25, revB: 35, fac: 100 },
  'kenco': { v: 25, revB: 1, fac: 30 },
  'gxo': { v: 25, revB: 10, fac: 150 },
  'wesco': { v: 25, revB: 22, fac: 200 },
  'grainger': { v: 25, revB: 17, fac: 50 },
  'fastenal': { v: 25, revB: 7, fac: 100 },
  'ferguson': { v: 25, revB: 30, fac: 200 },
  // ── Foodservice distribution ──
  'sysco': { v: 25, revB: 78, fac: 330 },
  'us foods': { v: 25, revB: 38, fac: 70 },
  'performance food': { v: 25, revB: 60, fac: 150 },
  'mclane': { v: 25, revB: 50, fac: 80 },
  'core-mark': { v: 25, revB: 17, fac: 30 },
  'gordon food': { v: 25, revB: 20, fac: 30 },
  'dot foods': { v: 25, revB: 9, fac: 12 },
  'ben e keith': { v: 25, revB: 5, fac: 10 },
  'shamrock foods': { v: 25, revB: 8, fac: 10 },
  'cheney brothers': { v: 25, revB: 4, fac: 6 },
  // ── Food & beverage manufacturers ──
  'pepsi': { v: 25, revB: 91, fac: 300 },
  'frito-lay': { v: 25, revB: 23, fac: 60 },
  'coca-cola': { v: 25, revB: 45, fac: 100 },
  'coca cola': { v: 25, revB: 45, fac: 100 },
  'nestle': { v: 25, revB: 30, fac: 80 },
  'tyson': { v: 25, revB: 53, fac: 240 },
  'jbs': { v: 25, revB: 70, fac: 100 },
  'cargill': { v: 25, revB: 177, fac: 150 },
  'archer daniels': { v: 25, revB: 94, fac: 270 },
  'conagra': { v: 25, revB: 12, fac: 40 },
  'kraft heinz': { v: 25, revB: 26, fac: 40 },
  'general mills': { v: 25, revB: 20, fac: 50 },
  'kellanova': { v: 25, revB: 13, fac: 35 },
  'kellogg': { v: 25, revB: 13, fac: 35 },
  'mondelez': { v: 25, revB: 36, fac: 60 },
  'mars wrigley': { v: 25, revB: 47, fac: 100 },
  'mars petcare': { v: 25, revB: 20, fac: 40 },
  'hershey': { v: 25, revB: 11, fac: 20 },
  'smucker': { v: 25, revB: 8, fac: 20 },
  'campbell': { v: 25, revB: 10, fac: 30 },
  'hormel': { v: 25, revB: 12, fac: 50 },
  'bimbo': { v: 25, revB: 20, fac: 60 },
  'flowers food': { v: 25, revB: 5, fac: 45 },
  'danone': { v: 25, revB: 6, fac: 15 },
  'dannon': { v: 25, revB: 6, fac: 15 },
  'saputo': { v: 25, revB: 12, fac: 60 },
  "land o'lakes": { v: 25, revB: 16, fac: 30 },
  'schreiber': { v: 25, revB: 7, fac: 20 },
  'leprino': { v: 25, revB: 5, fac: 10 },
  'dean foods': { v: 25, revB: 20, fac: 50 },
  'dairy farmers': { v: 25, revB: 20, fac: 50 },
  'molson coors': { v: 25, revB: 11, fac: 20 },
  'anheuser': { v: 25, revB: 15, fac: 20 },
  'ab inbev': { v: 25, revB: 15, fac: 20 },
  'constellation brands': { v: 25, revB: 10, fac: 15 },
  'keurig': { v: 25, revB: 15, fac: 40 },
  'ocean spray': { v: 25, revB: 2, fac: 12 },
  'ferrero': { v: 25, revB: 18, fac: 30 },
  'post consumer': { v: 25, revB: 7, fac: 30 },
  'mccormick': { v: 25, revB: 6, fac: 20 },
  'smithfield': { v: 25, revB: 15, fac: 50 },
  'perdue': { v: 25, revB: 8, fac: 30 },
  'pilgrim': { v: 25, revB: 17, fac: 40 },
  'niagara bottling': { v: 25, revB: 3, fac: 30 },
  'red bull': { v: 25, revB: 12, fac: 10 },
  'utz': { v: 25, revB: 1.4, fac: 15 },
  'purina': { v: 25, revB: 18, fac: 30 },
  'blue buffalo': { v: 25, revB: 2, fac: 5 },
  // ── Retail / grocery / e-commerce ──
  'walmart': { v: 20, revB: 600, fac: 210 },
  'amazon': { v: 20, revB: 575, fac: 400 },
  'costco': { v: 20, revB: 250, fac: 30 },
  'kroger': { v: 20, revB: 150, fac: 40 },
  'albertsons': { v: 20, revB: 80, fac: 40 },
  'ahold': { v: 20, revB: 90, fac: 50 },
  'food lion': { v: 20, revB: 90, fac: 50 },
  'hannaford': { v: 20, revB: 90, fac: 50 },
  'stop & shop': { v: 20, revB: 90, fac: 50 },
  'stop and shop': { v: 20, revB: 90, fac: 50 },
  'giant eagle': { v: 20, revB: 10, fac: 10 },
  'giant food': { v: 20, revB: 90, fac: 50 },
  'publix': { v: 20, revB: 55, fac: 12 },
  'h-e-b': { v: 20, revB: 40, fac: 15 },
  'meijer': { v: 20, revB: 20, fac: 15 },
  'wakefern': { v: 20, revB: 19, fac: 15 },
  'shoprite': { v: 20, revB: 19, fac: 15 },
  'harris teeter': { v: 20, revB: 150, fac: 40 },
  'target': { v: 20, revB: 107, fac: 50 },
  'dollar general': { v: 20, revB: 38, fac: 25 },
  'dollar tree': { v: 20, revB: 30, fac: 25 },
  'family dollar': { v: 20, revB: 30, fac: 25 },
  'aldi': { v: 20, revB: 30, fac: 25 },
  'lidl': { v: 20, revB: 10, fac: 15 },
  'wegmans': { v: 20, revB: 12, fac: 5 },
  '7-eleven': { v: 20, revB: 18, fac: 20 },
  'seven-eleven': { v: 20, revB: 18, fac: 20 },
  'ross stores': { v: 20, revB: 20, fac: 10 },
  'ross dress': { v: 20, revB: 20, fac: 10 },
  'tj maxx': { v: 20, revB: 54, fac: 20 },
  'marshalls': { v: 20, revB: 54, fac: 20 },
  'home depot': { v: 20, revB: 157, fac: 130 },
  "lowe's": { v: 20, revB: 97, fac: 100 },
  'tractor supply': { v: 20, revB: 14, fac: 10 },
  'chewy': { v: 20, revB: 11, fac: 20 },
  'wayfair': { v: 20, revB: 12, fac: 20 },
  'best buy': { v: 20, revB: 47, fac: 40 },
  'williams-sonoma': { v: 20, revB: 8, fac: 10 },
  'ikea': { v: 20, revB: 50, fac: 60 },
  'cvs': { v: 20, revB: 360, fac: 25 },
  'walgreens': { v: 20, revB: 130, fac: 20 },
  // ── Pharma / healthcare distribution ──
  'mckesson': { v: 25, revB: 309, fac: 30 },
  'cardinal health': { v: 25, revB: 205, fac: 50 },
  'cencora': { v: 25, revB: 260, fac: 30 },
  'amerisourcebergen': { v: 25, revB: 260, fac: 30 },
  'medline': { v: 25, revB: 23, fac: 50 },
  'owens & minor': { v: 25, revB: 10, fac: 40 },
  'henry schein': { v: 25, revB: 12, fac: 30 },
  'thermo fisher': { v: 20, revB: 45, fac: 100 },
  'becton': { v: 20, revB: 20, fac: 40 },
  'abbott': { v: 20, revB: 40, fac: 90 },
  'baxter': { v: 20, revB: 15, fac: 50 },
  'perrigo': { v: 20, revB: 4, fac: 20 },
  // ── Manufacturing / industrial / CPG ──
  'procter & gamble': { v: 20, revB: 82, fac: 30 },
  'procter and gamble': { v: 20, revB: 82, fac: 30 },
  'kimberly-clark': { v: 20, revB: 20, fac: 30 },
  'kimberly clark': { v: 20, revB: 20, fac: 30 },
  'sc johnson': { v: 20, revB: 12, fac: 20 },
  'colgate': { v: 20, revB: 20, fac: 25 },
  'clorox': { v: 20, revB: 7, fac: 20 },
  'church & dwight': { v: 20, revB: 6, fac: 15 },
  'unilever': { v: 20, revB: 60, fac: 40 },
  'reckitt': { v: 20, revB: 16, fac: 20 },
  '3m': { v: 20, revB: 35, fac: 80 },
  'honeywell': { v: 20, revB: 37, fac: 100 },
  'caterpillar': { v: 20, revB: 67, fac: 100 },
  'john deere': { v: 20, revB: 61, fac: 60 },
  'cummins': { v: 20, revB: 34, fac: 60 },
  'paccar': { v: 20, revB: 35, fac: 30 },
  'kenworth': { v: 20, revB: 35, fac: 20 },
  'peterbilt': { v: 20, revB: 35, fac: 20 },
  'daimler truck': { v: 20, revB: 60, fac: 40 },
  'navistar': { v: 20, revB: 11, fac: 20 },
  'bridgestone': { v: 20, revB: 8, fac: 50 },
  'goodyear': { v: 20, revB: 20, fac: 50 },
  'michelin': { v: 20, revB: 30, fac: 40 },
  'ppg': { v: 20, revB: 18, fac: 150 },
  'sherwin-williams': { v: 20, revB: 23, fac: 100 },
  'sherwin williams': { v: 20, revB: 23, fac: 100 },
  'georgia-pacific': { v: 20, revB: 30, fac: 150 },
  'georgia pacific': { v: 20, revB: 30, fac: 150 },
  'weyerhaeuser': { v: 20, revB: 10, fac: 30 },
  'international paper': { v: 15, revB: 19, fac: 350 },
  'westrock': { v: 15, revB: 20, fac: 300 },
  'smurfit': { v: 15, revB: 20, fac: 300 },
  'packaging corp': { v: 15, revB: 8, fac: 100 },
  'sonoco': { v: 15, revB: 7, fac: 300 },
  'ball corp': { v: 15, revB: 14, fac: 60 },
  'ball metal': { v: 15, revB: 14, fac: 60 },
  'crown holdings': { v: 15, revB: 12, fac: 200 },
  'sealed air': { v: 15, revB: 5, fac: 100 },
  'berry global': { v: 15, revB: 13, fac: 290 },
  'amcor': { v: 15, revB: 14, fac: 200 },
  'pactiv': { v: 15, revB: 6, fac: 60 },
  'graphic packaging': { v: 15, revB: 9, fac: 70 },
  'owens-illinois': { v: 15, revB: 7, fac: 70 },
  'newell': { v: 20, revB: 8, fac: 50 },
  'stanley black': { v: 20, revB: 15, fac: 50 },
  'whirlpool': { v: 20, revB: 19, fac: 30 },
  'lennox': { v: 20, revB: 5, fac: 50 },
  'carrier': { v: 20, revB: 22, fac: 60 },
  'trane': { v: 20, revB: 18, fac: 40 },
  'illinois tool': { v: 20, revB: 16, fac: 80 },
  'emerson electric': { v: 20, revB: 17, fac: 80 },
  'parker hannifin': { v: 20, revB: 19, fac: 100 },
  'eaton': { v: 20, revB: 23, fac: 100 },
  'nucor': { v: 20, revB: 35, fac: 300 },
  'steel dynamics': { v: 20, revB: 18, fac: 50 },
  'u.s. steel': { v: 20, revB: 18, fac: 30 },
  'cleveland-cliffs': { v: 20, revB: 22, fac: 30 },
  'reliance steel': { v: 20, revB: 14, fac: 300 },
  'oshkosh': { v: 20, revB: 9, fac: 20 },
  'allison transmission': { v: 20, revB: 3, fac: 10 },
  'textron': { v: 20, revB: 14, fac: 30 },
  'generac': { v: 20, revB: 4, fac: 20 },
  'kohler': { v: 20, revB: 9, fac: 50 },
  'masco': { v: 20, revB: 8, fac: 40 },
  'mohawk': { v: 20, revB: 11, fac: 50 },
  'owens corning': { v: 15, revB: 10, fac: 50 },
  // ── Chemicals / energy ──
  'dow chemical': { v: 15, revB: 45, fac: 100 },
  'dupont': { v: 15, revB: 12, fac: 50 },
  'lyondellbasell': { v: 15, revB: 40, fac: 50 },
  'celanese': { v: 15, revB: 11, fac: 50 },
  'eastman chemical': { v: 15, revB: 9, fac: 40 },
  'huntsman': { v: 15, revB: 6, fac: 40 },
  'ecolab': { v: 15, revB: 15, fac: 100 },
  'chemours': { v: 15, revB: 6, fac: 30 },
  'westlake': { v: 15, revB: 12, fac: 40 },
  'linde': { v: 15, revB: 33, fac: 200 },
  'air products': { v: 15, revB: 12, fac: 100 },
  'basf': { v: 15, revB: 80, fac: 100 },
  'halliburton': { v: 20, revB: 23, fac: 50 },
  'schlumberger': { v: 20, revB: 33, fac: 50 },
  'baker hughes': { v: 20, revB: 25, fac: 50 },
  // ── Building materials ──
  'martin marietta': { v: 12, revB: 6, fac: 100 },
  'vulcan materials': { v: 12, revB: 8, fac: 100 },
  'cemex': { v: 12, revB: 17, fac: 100 },
  'holcim': { v: 12, revB: 30, fac: 100 },
  // ── Apparel / consumer ──
  'nike': { v: 20, revB: 51, fac: 10 },
  'vf corp': { v: 20, revB: 11, fac: 20 },
  'hanesbrands': { v: 20, revB: 6, fac: 20 },
  'under armour': { v: 20, revB: 6, fac: 10 },
  'columbia sportswear': { v: 20, revB: 3, fac: 5 },
  // ── Auto parts / tech ──
  'genuine parts': { v: 20, revB: 23, fac: 60 },
  'napa auto': { v: 20, revB: 23, fac: 60 },
  'autozone': { v: 20, revB: 18, fac: 15 },
  "o'reilly auto": { v: 20, revB: 16, fac: 30 },
  'advance auto': { v: 20, revB: 11, fac: 40 },
  'lkq': { v: 20, revB: 14, fac: 60 },
  'rolls-royce': { v: 20, revB: 20, fac: 20 },
  'arrow electronics': { v: 20, revB: 30, fac: 40 },
  'texas instruments': { v: 15, revB: 18, fac: 15 },
  'globalfoundries': { v: 15, revB: 7, fac: 10 },
  'micron': { v: 15, revB: 25, fac: 15 },
};

/** First known-brand profile whose token appears in the place's name/address. */
function matchKnownBrand(place: DiscoveredPlace): BrandProfile | null {
  const hay = `${place.name} ${place.address}`.toLowerCase();
  for (const token in KNOWN_BRANDS) {
    if (hay.includes(token)) return KNOWN_BRANDS[token];
  }
  return null;
}

// ── Scoring functions ────────────────────────────────────────────────────

function scoreVertical(place: DiscoveredPlace): number {
  if (place.vertical) {
    const v = place.vertical.toLowerCase();
    for (const rule of VERTICAL_RULES) {
      if (rule.keywords.some(kw => v.includes(kw))) return rule.points;
    }
  }

  const brand = matchKnownBrand(place);
  if (brand) return brand.v;

  const haystack = [
    place.name,
    place.address,
    ...(place.types || []),
  ].join(' ').toLowerCase();

  for (const rule of VERTICAL_RULES) {
    if (rule.keywords.some(kw => haystack.includes(kw))) return rule.points;
  }
  return 0;
}

function scoreEnterpriseScale(place: DiscoveredPlace): number {
  // Prefer seed revenue; fall back to the matched brand's revenue band.
  let revBillions = place.estimatedRevenue ? parseRevenueBillions(place.estimatedRevenue) : 0;
  if (revBillions <= 0) {
    const brand = matchKnownBrand(place);
    if (brand) revBillions = brand.revB;
  }
  if (revBillions >= 10) return 25;
  if (revBillions >= 5) return 22;
  if (revBillions >= 1) return 18;
  if (revBillions >= 0.5) return 14;
  if (revBillions >= 0.1) return 10;
  if (revBillions >= 0.05) return 6;
  if (revBillions > 0) return 3;

  // Last-resort proxy for un-enriched places: Google review volume is a weak
  // but non-zero signal of facility throughput. Capped low so it never rivals
  // a real revenue match.
  const ratings = place.userRatingsTotal ?? 0;
  if (ratings >= 2000) return 10;
  if (ratings >= 1000) return 6;
  if (ratings >= 500) return 3;
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
  // Prefer seed facility count; fall back to the matched brand's footprint.
  let f = place.estimatedFacilities ?? 0;
  if (f <= 0) {
    const brand = matchKnownBrand(place);
    if (brand) f = brand.fac;
  }
  if (f <= 0) return 0;
  if (f >= 50) return 25;
  if (f >= 25) return 20;
  if (f >= 10) return 15;
  if (f >= 5) return 10;
  return 5;
}

// Text-search keywords like "truck terminal" and "freight terminal" drag in a
// lot of non-prospects: truck stops, travel plazas, airports, restaurants,
// retail outlets. These are not yard-management buyers. We flag them so they
// drop out of the tiers instead of polluting the ranked list. A brand match
// always wins — a real "Pilot" logistics DC won't be killed by the travel-stop
// rule because brand-matched places are checked first by the caller.
const NOISE_KEYWORDS: string[] = [
  'truck stop', 'truckstop', 'travel center', 'travel centre', 'travel plaza', 'rest area',
  'truck parking', 'truck wash', 'car wash', 'parking area', 'service plaza',
  'airport', 'botanical', 'gardens', 'museum', 'premium outlet', 'outlet mall',
  'restaurant', 'cafe', 'winery', 'cellars', 'vineyard', 'brewery taproom',
  'circle k', "love's travel", 'pilot travel', 'flying j', 'ta travel',
  'ta petro', 'ambest', 'petro-pass', 'travelcenters', 'gas station',
  'food pantry', 'food bank', 'church', 'general store', 'mini-mart',
  'mini mart', 'convenience store', 'travel stop', 'truck plaza', 'rv storage',
  'self storage', 'self-storage', 'boat & rv', 'country corner', 'country store',
];

// If the NAME itself reads as a logistics facility, it is a prospect regardless
// of any incidental noise word (e.g. "Darden Restaurants — Orlando Distribution"
// is a DC, not a restaurant). Checked against the name only, not the address, so
// a place in "Plant City" isn't rescued by the word "plant".
const FACILITY_POSITIVE: string[] = [
  'distribution', 'warehouse', 'fulfillment', 'fulfilment', 'logistics', 'cold storage',
  'manufacturing', 'manufactur', 'cross dock', 'crossdock', 'cross-dock', 'supply chain',
  'processing plant', 'processing', 'production', 'bottling', 'cannery', 'creamery',
  'distributor', 'freight', 'terminal', 'sortation', 'depot', 'wholesale', 'foodservice',
  'food service', 'provisions', 'packaging', 'dairy', 'refinery', 'bulk mail',
  'network distribution', 'import', 'export', '3pl', 'distribution center', 'service center',
];

// Retail / storefront / consumer place types that are NOT yard targets even when
// the name matches a known enterprise brand (e.g. "FedEx OnSite", "The UPS Store",
// "Staples" retail). These OVERRIDE the brand-match shortcut below — that shortcut
// was landing FedEx/UPS/Staples retail dropoff points at Tier A. FACILITY_POSITIVE
// still wins (a real "Staples Fulfillment Center" survives).
const RETAIL_STOREFRONT_NOISE: string[] = [
  'the ups store', 'ups store', 'fedex office', 'fedex ship center', 'fedex onsite',
  'fedex print', 'pak mail', 'postal annex', 'mailbox', 'notary', 'pack and ship',
  'pack & ship', 'self storage', 'self-storage', 'public storage', 'extra space',
  'cubesmart', 'life storage', 'u-haul', 'uhaul', 'storage units', 'post office',
  'postal service', 'usps', 'gas station', 'fuel station', 'fuel rack', 'fuel stop',
  'guaranteed scale', 'speedway', '7-eleven', '7 eleven', 'circle k', 'quiktrip',
  'royal farms', 'cumberland farms', 'wawa', 'sheetz', 'maverik', 'getgo', 'kwik fill',
  'kum & go', 'sunoco', 'valero', 'citgo', 'conoco', 'phillips 66', 'mobil', 'texaco',
  'walmart deli', ' deli', 'car wash', 'dealership', 'hotel', 'motel', 'restaurant',
  'diner', 'credit union', 'church', 'school', 'university', 'college', ' gym',
  'fitness', 'ymca', 'library', 'golf', 'casino', 'apartment', 'hospital', 'clinic',
  'supercenter', 'neighborhood market',
];

function detectNoise(place: DiscoveredPlace): string | null {
  const name = place.name.toLowerCase();
  // A real logistics facility is always a prospect.
  if (FACILITY_POSITIVE.some(kw => name.includes(kw))) return null;
  // Retail/storefront/consumer places are noise even for known brands
  // (FedEx OnSite, UPS Store, gas stations, self-storage, etc.).
  for (const kw of RETAIL_STOREFRONT_NOISE) {
    if (name.includes(kw)) return `retail/storefront: ${kw.trim()}`;
  }
  // Otherwise, never exclude a recognized enterprise brand.
  if (matchKnownBrand(place)) return null;
  const hay = `${place.name} ${place.address}`.toLowerCase();
  for (const kw of NOISE_KEYWORDS) {
    if (hay.includes(kw)) return kw;
  }
  return null;
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

  // Assign corridor names back to prospects BEFORE sorting — at this point
  // corridors[] is still index-aligned with clusters[]. (Sorting first is what
  // previously scrambled the names, e.g. labeling an Allentown prospect "Houston".)
  for (let ci = 0; ci < clusters.length; ci++) {
    const corridorName = corridors[ci].name;
    for (const pi of clusters[ci]) {
      prospects[pi].corridor = corridorName;
    }
  }

  // Sort corridors by total ICP weight for presentation. Safe now that prospect
  // assignment is done.
  corridors.sort((a, b) => (b.avgIcpScore * b.totalProspects) - (a.avgIcpScore * a.totalProspects));

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
    'Excluded', 'Exclude Reason',
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
    p.excluded,
    escapeCsv(p.excludeReason),
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
  const weededOut: { name: string; address: string; reason: string }[] = [];

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

    // 5. Drop obvious non-prospects ENTIRELY (truck stops, airports, restaurants,
    // and retail/storefront/consumer places like FedEx OnSite, The UPS Store, gas
    // stations, self-storage). They are written to a weeded-out audit file, not the
    // working list — so they never clutter the Hub or corridor views. Real
    // logistics facilities are protected by FACILITY_POSITIVE inside detectNoise.
    const noiseReason = detectNoise(place);
    if (noiseReason !== null) {
      weededOut.push({ name: place.name, address: place.address, reason: noiseReason });
      continue;
    }

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
      excluded: false,
      excludeReason: undefined,
    });
  }

  // Sort by score descending
  scored.sort((a, b) => b.icpScore - a.icpScore);

  // 5. Cluster into corridors
  console.log('Clustering into corridors...');
  const corridors = clusterIntoCorrridors(scored);

  // 6. Build output
  const existingCount = scored.filter(p => p.isExistingAccount).length;
  const excludedCount = weededOut.length;
  // Net-new = not already in CRM and not flagged as noise.
  const netNew = scored.filter(p => !p.isExistingAccount && !p.excluded);

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

  // Audit: the non-target places we dropped (retail/storefront/consumer/noise).
  const weededPath = path.join(outDir, `weeded-out-${today}.json`);
  fs.writeFileSync(weededPath, JSON.stringify(weededOut, null, 2));
  console.log(`Weeded-out audit saved: ${weededPath} (${weededOut.length} dropped)`);

  // 7. Console summary
  console.log(`\n${'='.repeat(110)}`);
  console.log('PROSPECT SCORING SUMMARY');
  console.log(`${'='.repeat(110)}`);
  console.log(`Total discoveries: ${scored.length}`);
  console.log(`Existing account matches: ${existingCount}`);
  console.log(`Weeded out (retail/storefront/truck stops/etc.): ${excludedCount}`);
  console.log(`Net-new qualified prospects: ${netNew.length}`);
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
