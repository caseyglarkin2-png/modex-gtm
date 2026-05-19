/**
 * Master Index — one-row-per-account rollup across the whole yard-audit run.
 *
 * Reads every account's Phase-2 site JSONs (or the Kraft baseline) and emits a
 * compact per-account summary CSV — the master-runbook overview tab.
 *
 * Run: npx tsx scripts/yard-audit/build-master-index.ts
 *   Output  output/yard-audits/YardFlow-Master-Index.csv
 */
import { readFileSync, readdirSync, existsSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assignArchetype } from './lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

interface Site {
  classification: Parameters<typeof assignArchetype>[0];
  yardMetrics?: {
    dockDoorCount?: number;
    trailerParkingCapacity?: number;
    railServed?: boolean;
  };
}

function loadSites(dir: string): Site[] {
  const sitesDir = join(dir, 'sites');
  if (existsSync(sitesDir)) {
    return readdirSync(sitesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site);
  }
  const baseline = join(dir, 'baseline.json');
  if (existsSync(baseline)) {
    return (JSON.parse(readFileSync(baseline, 'utf8')).sites ?? []) as Site[];
  }
  return [];
}

const header = [
  'Account', 'Facilities', 'Truck-Gated', 'Guarded', 'Fast-Lane Opps',
  'Rural', 'Rail-Served', 'Total Dock Doors', 'Total Trailer Capacity', 'Top Archetype',
];
const rows: string[] = [header.join(',')];

let totFac = 0, totGate = 0, totGuard = 0, totFast = 0, totRural = 0, totRail = 0, totDock = 0, totCap = 0;

const accounts = readdirSync(AUD)
  .filter((d) => {
    try { return statSync(join(AUD, d)).isDirectory(); } catch { return false; }
  })
  .sort();

for (const acct of accounts) {
  const sites = loadSites(join(AUD, acct));
  if (!sites.length) continue;
  const n = sites.length;
  const gate = sites.filter((s) => s.classification?.truckGate).length;
  const guard = sites.filter((s) => s.classification?.guardShack).length;
  const fast = sites.filter((s) => s.classification?.fastLaneOpportunity).length;
  const rural = sites.filter((s) => s.classification?.urbanRural === 'Rural').length;
  const rail = sites.filter((s) => s.yardMetrics?.railServed).length;
  const dock = sites.reduce((a, s) => a + (s.yardMetrics?.dockDoorCount ?? 0), 0);
  const cap = sites.reduce((a, s) => a + (s.yardMetrics?.trailerParkingCapacity ?? 0), 0);
  const arch: Record<string, number> = {};
  for (const s of sites) {
    const a = assignArchetype(s.classification).archetype;
    arch[a] = (arch[a] ?? 0) + 1;
  }
  const top = Object.entries(arch).sort((a, b) => b[1] - a[1])[0];
  rows.push([acct, n, gate, guard, fast, rural, rail, dock, cap, `${top[0]} (${top[1]})`].join(','));
  totFac += n; totGate += gate; totGuard += guard; totFast += fast;
  totRural += rural; totRail += rail; totDock += dock; totCap += cap;
}

rows.push(['TOTAL', totFac, totGate, totGuard, totFast, totRural, totRail, totDock, totCap, ''].join(','));

const out = rows.join('\r\n') + '\r\n';
writeFileSync(join(AUD, 'YardFlow-Master-Index.csv'), out);
console.log(out);
console.log(`${rows.length - 2} accounts · ${totFac} facilities · index written to output/yard-audits/YardFlow-Master-Index.csv`);
