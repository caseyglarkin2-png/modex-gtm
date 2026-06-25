/**
 * Export the discovery worklist as a ranked Excel + CSV, using the REAL
 * production pipeline (loadLatestScored -> buildCuratedRows -> rankWorklist with
 * the proximity-led composite, proximity 0.55 + fit 0.30 + density 0.15). This
 * is exactly what /discovery renders: curated (grain artifacts + drop-box noise
 * folded), segmented, confidence-scored, ranked by the composite.
 *
 *   npx tsx scripts/intel/export-ranked-list.ts
 *
 * Two sheets: every curated SITE ranked, and the named ACCOUNTS rolled up.
 */
import fs from 'node:fs';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { rankWorklist, DEFAULT_WEIGHTS, fitComponent, proximityComponent } from '@/lib/discovery/scoring';
import { getAccountMicrositeData } from '@/lib/microsites/accounts';
import type { RankedRow } from '@/lib/discovery/scoring';

const ROOT = process.cwd();
const PD = path.join(ROOT, 'output', 'prospect-discovery');
const round = (n: number, dp = 1) => Math.round(n * 10 ** dp) / 10 ** dp;

const output = loadLatestScored();
if (!output) throw new Error('no scored set found (output/prospect-discovery/)');
const ranked = rankWorklist(buildCuratedRows(output), DEFAULT_WEIGHTS);

// ── Sheet 1: ranked sites ────────────────────────────────────────────────────
const siteRows = ranked.map((r: RankedRow, i: number) => ({
  rank: i + 1,
  composite: round(r.worklistScore, 2),
  proximity: Math.round(proximityComponent(r.nearestPrimoDistance) * 100),
  fitPct: round(fitComponent(r) * 100, 1),
  density: r.corridorDensity,
  distanceMi: round(r.nearestPrimoDistance, 1),
  nearestPrimo: r.nearestPrimoName,
  tier: r.tier,
  segment: r.segment,
  confidence: r.confidence,
  name: r.name,
  account: r.micrositeSlug ?? r.existingAccountSlug ?? '',
  cityState: r.cityState,
  vertical: r.verticalMatch,
  enterprise: r.enterpriseScale,
  network: r.networkComplexity,
  corridor: r.corridor,
  address: r.address,
}));

// ── Sheet 2: ranked accounts (rolled up by microsite slug / existing slug) ───
interface AccAgg {
  slug: string;
  sites: number;
  bestComposite: number;
  meanComposite: number;
  minDistance: number;
  tierA: number;
}
const groups = new Map<string, RankedRow[]>();
for (const r of ranked) {
  const slug = r.micrositeSlug ?? r.existingAccountSlug;
  if (!slug) continue; // anonymous net-new sites stay on the sites sheet
  const g = groups.get(slug) ?? [];
  g.push(r);
  groups.set(slug, g);
}
const accRows: AccAgg[] = Array.from(groups.entries())
  .map(([slug, rs]) => {
    const comps = rs.map((r) => r.worklistScore);
    return {
      slug,
      name: getAccountMicrositeData(slug)?.accountName ?? slug,
      sites: rs.length,
      bestComposite: round(Math.max(...comps), 2),
      meanComposite: round(comps.reduce((a, b) => a + b, 0) / comps.length, 2),
      minDistance: round(Math.min(...rs.map((r) => r.nearestPrimoDistance)), 1),
      tierA: rs.filter((r) => r.tier === 'A').length,
    } as AccAgg & { name: string };
  })
  .sort((a, b) => b.bestComposite - a.bestComposite)
  .map((a, i) => ({ rank: i + 1, ...a }));

// ── write ────────────────────────────────────────────────────────────────────
async function main() {
  const wb = new ExcelJS.Workbook();

  const sites = wb.addWorksheet('Ranked Sites');
  sites.columns = [
    { header: 'Rank', key: 'rank', width: 6 },
    { header: 'Composite', key: 'composite', width: 11 },
    { header: 'Proximity', key: 'proximity', width: 10 },
    { header: 'Fit %', key: 'fitPct', width: 8 },
    { header: 'Density', key: 'density', width: 8 },
    { header: 'Distance (mi)', key: 'distanceMi', width: 12 },
    { header: 'Nearest Primo Site', key: 'nearestPrimo', width: 26 },
    { header: 'Tier', key: 'tier', width: 6 },
    { header: 'Segment', key: 'segment', width: 10 },
    { header: 'Confidence', key: 'confidence', width: 11 },
    { header: 'Name', key: 'name', width: 40 },
    { header: 'Account', key: 'account', width: 22 },
    { header: 'City, State', key: 'cityState', width: 20 },
    { header: 'Vertical', key: 'vertical', width: 9 },
    { header: 'Enterprise', key: 'enterprise', width: 10 },
    { header: 'Network', key: 'network', width: 9 },
    { header: 'Corridor', key: 'corridor', width: 18 },
    { header: 'Address', key: 'address', width: 50 },
  ];
  sites.addRows(siteRows);
  sites.getRow(1).font = { bold: true };
  sites.views = [{ state: 'frozen', ySplit: 1 }];
  sites.autoFilter = { from: 'A1', to: 'R1' };

  const accts = wb.addWorksheet('Ranked Accounts');
  accts.columns = [
    { header: 'Rank', key: 'rank', width: 6 },
    { header: 'Account', key: 'name', width: 34 },
    { header: 'Slug', key: 'slug', width: 24 },
    { header: 'Best Composite', key: 'bestComposite', width: 15 },
    { header: 'Mean Composite', key: 'meanComposite', width: 15 },
    { header: 'Sites', key: 'sites', width: 7 },
    { header: 'Tier-A Sites', key: 'tierA', width: 12 },
    { header: 'Min Distance (mi)', key: 'minDistance', width: 16 },
  ];
  accts.addRows(accRows);
  accts.getRow(1).font = { bold: true };
  accts.views = [{ state: 'frozen', ySplit: 1 }];
  accts.autoFilter = { from: 'A1', to: 'H1' };

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `discovery-worklist-ranked-${stamp}`;
  const xlsxPath = path.join(PD, `${base}.xlsx`);
  const csvPath = path.join(PD, `${base}-sites.csv`);
  const dlXlsx = path.join(ROOT, '..', 'Downloads', `${base}.xlsx`);

  await wb.xlsx.writeFile(xlsxPath);
  try {
    await wb.xlsx.writeFile(dlXlsx);
  } catch {
    /* Downloads not writable; output/ copy is canonical */
  }
  await wb.csv.writeFile(csvPath); // writes the first (active) sheet

  console.log(`ranked ${siteRows.length} curated sites, ${accRows.length} named accounts`);
  console.log(`  xlsx: ${path.relative(ROOT, xlsxPath)} (+ Downloads)`);
  console.log(`  csv:  ${path.relative(ROOT, csvPath)}`);
  console.log('top 8 accounts:');
  for (const a of accRows.slice(0, 8) as Array<AccAgg & { rank: number; name: string }>) {
    console.log(`  #${a.rank} ${a.bestComposite} ${a.name} (${a.sites} sites, ${a.minDistance}mi)`);
  }
}

main();
