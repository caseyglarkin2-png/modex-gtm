import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface SeedCompany {
  name: string;
  domain: string;
  vertical: string;
  why: string;
  estimatedFacilities: number;
  estimatedRevenue: string;
  knownLocations: { name: string; city: string; state: string; lat: number; lng: number }[];
}

interface SeedCorridor {
  name: string;
  anchor: string;
  companies: SeedCompany[];
}

interface SeedFile {
  generatedAt: string;
  source: string;
  corridors: SeedCorridor[];
}

const seedPath = join(ROOT, 'scripts/prospect-discovery/corridor-seeds.json');
const seeds: SeedFile = JSON.parse(readFileSync(seedPath, 'utf8'));

const discoveries: any[] = [];

for (const corridor of seeds.corridors) {
  for (const company of corridor.companies) {
    for (const loc of company.knownLocations) {
      discoveries.push({
        placeId: `seed-${company.domain}-${loc.lat}-${loc.lng}`,
        name: `${company.name} — ${loc.name}`,
        address: `${loc.city}, ${loc.state}`,
        lat: loc.lat,
        lng: loc.lng,
        types: mapVerticalToTypes(company.vertical),
        businessStatus: 'OPERATIONAL',
        rating: null,
        userRatingsTotal: estimateRatings(company.estimatedFacilities, company.estimatedRevenue),
        discoveredVia: [{ anchor: corridor.anchor, keyword: 'corridor-seed', distanceMiles: 0 }],
        nearestPrimoSite: { name: corridor.anchor, distanceMiles: 0 },
        isExistingAccount: false,
      });
    }
  }
}

const today = new Date().toISOString().slice(0, 10);
const output = {
  scanDate: today,
  anchorsScanned: seeds.corridors.length,
  keywordsPerAnchor: 1,
  totalApiCalls: 0,
  totalDiscovered: discoveries.length,
  totalAfterDedup: discoveries.length,
  totalNetNew: discoveries.length,
  discoveries,
};

const outDir = join(ROOT, 'output/prospect-discovery');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `corridor-scan-${today}.json`);
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Converted ${discoveries.length} seed locations → ${outPath}`);

function mapVerticalToTypes(vertical: string): string[] {
  const v = vertical.toLowerCase();
  if (v.includes('food') || v.includes('beverage')) return ['establishment', 'food'];
  if (v.includes('logistics') || v.includes('3pl')) return ['establishment', 'storage', 'moving_company'];
  if (v.includes('manufacturing')) return ['establishment'];
  if (v.includes('retail') || v.includes('grocery')) return ['establishment', 'store'];
  return ['establishment'];
}

function estimateRatings(facilities: number, revenue: string): number {
  const revNum = parseFloat(revenue.replace(/[^0-9.]/g, '')) || 0;
  if (revNum >= 10) return 2000 + facilities * 10;
  if (revNum >= 5) return 1000 + facilities * 10;
  if (revNum >= 1) return 500 + facilities * 5;
  return 200 + facilities * 3;
}
