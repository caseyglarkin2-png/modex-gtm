import fs from 'node:fs';
import path from 'node:path';
import type { ScoredOutput, ScoredProspect, ProspectRow, CuratedRow } from './types';
import { curate } from './curate';
// Statically imported so the compiler bundles it into the serverless function.
// This is the ONLY data source guaranteed to exist on Vercel — the dated files
// below are gitignored, and runtime-fs reads of committed files are NOT reliably
// shipped by Turbopack builds (outputFileTracingIncludes is ignored there).
// Cast through unknown: resolveJsonModule infers `tier: string`, wider than the
// ScoredProspect union, so a direct assignment fails.
import sampleScoredRaw from '../../../output/prospect-discovery/SAMPLE-scored-prospects.json';

const sampleScored = sampleScoredRaw as unknown as ScoredOutput;

const OUTPUT_DIR = path.join(process.cwd(), 'output', 'prospect-discovery');

export function loadLatestScored(): ScoredOutput | null {
  // Prefer a freshly-scanned dated file when present (local dev / CI with a real
  // scan). These are gitignored, so they only exist where the pipeline has run.
  try {
    if (fs.existsSync(OUTPUT_DIR)) {
      const files = fs.readdirSync(OUTPUT_DIR)
        .filter((f) => /^scored-prospects-\d{4}-\d{2}-\d{2}\.json$/.test(f))
        .sort()
        .reverse();
      if (files.length > 0) {
        const raw = fs.readFileSync(path.join(OUTPUT_DIR, files[0]), 'utf-8');
        return JSON.parse(raw) as ScoredOutput;
      }
    }
  } catch {
    // fall through to the bundled sample
  }

  // Bundled fallback — always present (Vercel preview/prod, CI).
  return sampleScored;
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

/**
 * Map the raw scored prospects to view rows and curate them into a sellable
 * target set: one row per physical site (grain artifacts folded), each tagged
 * with segment + confidence. This is the canonical row set the hub renders.
 */
export function buildCuratedRows(output: ScoredOutput): CuratedRow[] {
  return curate(output.prospects.map(toProspectRow));
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
