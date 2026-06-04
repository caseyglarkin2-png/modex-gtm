import fs from 'node:fs';
import path from 'node:path';
import type { ScoredOutput, ScoredProspect, ProspectRow } from './types';

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'prospect-discovery');
const SAMPLE_FILE = path.join(OUTPUT_DIR, 'SAMPLE-scored-prospects.json');

export function loadLatestScored(): ScoredOutput | null {
  if (!fs.existsSync(OUTPUT_DIR)) return null;

  const files = fs.readdirSync(OUTPUT_DIR)
    .filter((f) => /^scored-prospects-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse();

  const target = files.length > 0
    ? path.join(OUTPUT_DIR, files[0])
    : fs.existsSync(SAMPLE_FILE)
      ? SAMPLE_FILE
      : null;

  if (!target) return null;
  const raw = fs.readFileSync(target, 'utf-8');
  return JSON.parse(raw) as ScoredOutput;
}

export function extractCityState(address: string): string {
  const match = /,\s*([^,]+,\s*[A-Z]{2})\b/.exec(address);
  return match ? match[1].trim() : address;
}

export function toProspectRow(p: ScoredProspect): ProspectRow {
  return {
    name: p.name,
    address: p.address,
    cityState: extractCityState(p.address),
    lat: p.lat,
    lng: p.lng,
    placeId: p.placeId,
    icpScore: p.icpScore,
    tier: p.tier,
    verticalMatch: p.scoreBreakdown.verticalMatch,
    enterpriseScale: p.scoreBreakdown.enterpriseScale,
    networkComplexity: p.scoreBreakdown.networkComplexity,
    primoProximity: p.scoreBreakdown.primoProximity,
    corridorDensity: p.scoreBreakdown.corridorDensity,
    placeTypeBonus: p.scoreBreakdown.placeTypeBonus,
    isExistingAccount: p.isExistingAccount,
    existingAccountSlug: p.existingAccountSlug,
    nearestPrimoName: p.nearestPrimoSite.name,
    nearestPrimoDistance: p.nearestPrimoSite.distanceMiles,
    corridor: p.corridor,
    discoveredVia: p.discoveredVia,
    excluded: p.excluded ?? false,
    excludeReason: p.excludeReason,
  };
}

export interface DiscoverySummary {
  totalNetNew: number;
  tierACount: number;
  corridorCount: number;
  avgScore: number;
  generatedAt: string;
}

export function getDiscoverySummary(output: ScoredOutput): DiscoverySummary {
  const netNew = output.prospects.filter((p) => !p.isExistingAccount && !p.excluded);
  const avg = netNew.length > 0
    ? Math.round(netNew.reduce((sum, p) => sum + p.icpScore, 0) / netNew.length)
    : 0;
  return {
    totalNetNew: output.netNewProspects,
    tierACount: output.tierA,
    corridorCount: output.corridors.length,
    avgScore: avg,
    generatedAt: output.generatedAt,
  };
}

export { filterProspects, formatDiscoveredVia, type ProspectFilters } from './filters';
