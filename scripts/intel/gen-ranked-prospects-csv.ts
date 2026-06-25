/**
 * Generate the ranked unique-PROSPECT-COMPANY CSV from the real scoring pipeline
 * (buildCuratedRows -> rankWorklist, proximity-led composite on the 100-pt scale).
 * Rolls the 7,848 curated SITES up to unique companies (best composite wins),
 * ranked. Writes to output/ and Downloads.
 *
 *   npx tsx scripts/intel/gen-ranked-prospects-csv.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS, fitComponent, proximityComponent } from '@/lib/discovery/scoring';
import type { RankedRow } from '@/lib/discovery/scoring';

const ROOT = process.cwd();
const PD = path.join(ROOT, 'output', 'prospect-discovery');
const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;

// Collapse a site name to a company key: drop legal suffixes, facility nouns,
// trailing "- City, ST", directionals, numbers, punctuation.
const FACILITY = /\b(distribution center|distribution|dc|warehouse|whse|fulfillment|fulfilment|plant|facility|facilities|brewery|cidery|mill|terminal|drop box|dropbox|ship center|shipping|logistics center|campus|cold storage|bottling|cannery|factory|complex|annex)\b/g;
const LEGAL = /\b(inc|llc|corp|corporation|co|company|ltd|limited|holdings|group|usa|na|north america|the)\b/g;
function companyKey(name: string): string {
  let s = (name || '').toLowerCase();
  s = s.replace(/\s[-–—].*$/, ''); // trailing " - City, ST"
  s = s.replace(/,.*$/, ''); // trailing ", City ST"
  s = s.replace(/\(.*?\)/g, ' ');
  s = s.replace(FACILITY, ' ');
  s = s.replace(LEGAL, ' ');
  s = s.replace(/[^a-z0-9& ]+/g, ' ').replace(/\b\d+\b/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

const output = loadLatestScored();
if (!output) throw new Error('no scored set');
const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);

interface Agg {
  key: string;
  display: string;
  best: number;
  mean: number;
  sites: number;
  bestTier: string;
  minDist: number;
  nearest: string;
  proximity: number;
  fitPct: number;
  density: number;
  cityState: string;
  segment: string;
  confidence: string;
}
const groups = new Map<string, RankedRow[]>();
for (const r of ranked) {
  const k = companyKey(r.name) || r.name.toLowerCase();
  const g = groups.get(k) ?? [];
  g.push(r);
  groups.set(k, g);
}
const TIER_RANK: Record<string, number> = { A: 3, B: 2, C: 1, D: 0 };
const rows: Agg[] = Array.from(groups.entries())
  .map(([key, rs]) => {
    const best = rs.reduce((a, b) => (b.worklistScore > a.worklistScore ? b : a));
    const comps = rs.map((r) => r.worklistScore);
    // shortest name in the group reads cleanest as the display name
    const display = rs.map((r) => r.name).sort((a, b) => a.length - b.length)[0];
    const bestTier = rs.map((r) => r.tier).sort((a, b) => TIER_RANK[b] - TIER_RANK[a])[0];
    return {
      key,
      display,
      best: round(best.worklistScore, 2),
      mean: round(comps.reduce((a, b) => a + b, 0) / comps.length, 2),
      sites: rs.length,
      bestTier,
      minDist: round(Math.min(...rs.map((r) => r.nearestPrimoDistance)), 1),
      nearest: best.nearestPrimoName,
      proximity: Math.round(proximityComponent(best.nearestPrimoDistance) * 100),
      fitPct: round(fitComponent(best) * 100, 1),
      density: best.corridorDensity,
      cityState: best.cityState,
      segment: best.segment,
      confidence: best.confidence,
    };
  })
  .sort((a, b) => b.best - a.best)
  .map((r, i) => ({ rank: i + 1, ...r }));

async function main() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Ranked Prospects');
  ws.columns = [
    { header: 'Rank', key: 'rank', width: 6 },
    { header: 'Company', key: 'display', width: 40 },
    { header: 'Best Composite', key: 'best', width: 14 },
    { header: 'Mean Composite', key: 'mean', width: 14 },
    { header: 'Tier', key: 'bestTier', width: 6 },
    { header: 'Sites', key: 'sites', width: 7 },
    { header: 'Proximity', key: 'proximity', width: 10 },
    { header: 'Fit %', key: 'fitPct', width: 8 },
    { header: 'Density', key: 'density', width: 8 },
    { header: 'Min Distance (mi)', key: 'minDist', width: 16 },
    { header: 'Nearest Primo Site', key: 'nearest', width: 26 },
    { header: 'City, State', key: 'cityState', width: 20 },
    { header: 'Segment', key: 'segment', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 11 },
  ];
  ws.addRows(rows);
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: 'N1' };

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `ranked-prospects-by-company-${stamp}`;
  const xlsx = path.join(PD, `${base}.xlsx`);
  const csv = path.join(PD, `${base}.csv`);
  const dlCsv = path.join(ROOT, '..', 'Downloads', `${base}.csv`);
  const dlXlsx = path.join(ROOT, '..', 'Downloads', `${base}.xlsx`);
  await wb.xlsx.writeFile(xlsx);
  await wb.csv.writeFile(csv);
  try { await wb.xlsx.writeFile(dlXlsx); await wb.csv.writeFile(dlCsv); } catch { /* downloads */ }

  console.log(`${rows.length} unique companies from ${ranked.length} curated sites`);
  console.log(`  csv:  ${path.relative(ROOT, csv)}  (+ Downloads)`);
  console.log(`  xlsx: ${path.relative(ROOT, xlsx)}  (+ Downloads)`);
  const tiers: Record<string, number> = {};
  for (const r of rows) tiers[r.bestTier] = (tiers[r.bestTier] ?? 0) + 1;
  console.log('  by tier:', JSON.stringify(tiers));
  console.log('  top 10:');
  for (const r of rows.slice(0, 10)) console.log(`   #${r.rank} ${r.best} ${r.display} (${r.sites} sites, ${r.minDist}mi, T${r.bestTier})`);
}
main();
