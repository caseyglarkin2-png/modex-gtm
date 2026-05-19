/**
 * Phase 0.4 — Location Breakdown CSV generator.
 *
 * Emits an account's CSV in Jake's exact 42-column Kraft layout: the two
 * header rows, one row per facility (archetype auto-assigned), then the
 * summary-stats block.
 *
 * Run: npx tsx scripts/yard-audit/generate-csv.ts <account-slug>
 *   Input  output/yard-audits/<slug>/sites/*.json   (Phase 2 output), or
 *          output/yard-audits/<slug>/baseline.json  (Kraft calibration)
 *   Output output/yard-audits/<slug>/<slug>-location-breakdown.csv
 *
 * When sites carry a pre-existing `archetype` (Jake's baseline), the run
 * also prints an archetype-assignment calibration line.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assignArchetype, pct, type Classification } from './lib.ts';

const ROOT = process.cwd();

interface Site {
  name?: string;
  type?: string;
  classification: Classification;
  operational?: Record<string, string | null>;
  mapsUrl?: string;
  archetype?: string; // present in Jake's baseline only
}

interface Schema {
  columnCount: number;
  groupHeaderRow: string[];
  columnHeaderRow: string[];
}

const schema: Schema = JSON.parse(
  readFileSync(join(ROOT, 'scripts/yard-audit/schema.json'), 'utf8'),
);

const yn = (b: boolean | undefined) => (b ? 'YES' : '');
const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const line = (cells: string[]) => cells.map((c) => esc(c ?? '')).join(',');
const blank = () => new Array<string>(schema.columnCount).fill('');

function siteRow(site: Site): string[] {
  const c = site.classification;
  const a = assignArchetype(c);
  const cells = blank();

  cells[0] = site.name ?? '';
  cells[1] = site.type ?? '';
  cells[2] = a.archetype;
  cells[3] = a.archetypeName;

  // operational data — blank unless explicitly supplied
  const op = site.operational ?? {};
  cells[5] = String(op.wms ?? '');
  cells[6] = String(op.tms ?? '');
  cells[7] = String(op.yms ?? '');
  cells[8] = String(op.ebol ?? '');
  cells[9] = String(op.connectivityAvailable ?? '');
  cells[10] = String(op.shipmentVolume ?? '');
  cells[11] = String(op.shiftsPerDay ?? '');
  cells[12] = String(op.guardsPerShift ?? '');
  cells[13] = String(op.dcsPerShift ?? '');

  cells[14] = yn(c.truckGate);
  cells[15] = yn(c.guardShack);
  cells[16] = yn(c.remoteGs);
  cells[17] = yn(c.preGateStaging);
  cells[18] = yn(c.postGateStaging);
  cells[19] = yn(c.drivewayLong);
  cells[20] = yn(c.drivewayShort);
  cells[21] = yn(c.backupSensitive);
  cells[22] = yn(c.entryExitTogether);
  cells[23] = yn(c.entryExitSeparate);
  cells[24] = c.entryLanes != null ? String(c.entryLanes) : '';
  cells[25] = c.exitLanes != null ? String(c.exitLanes) : '';
  cells[26] = yn(c.fastLaneOpportunity);

  const labels: Array<Classification['dockDoors']> = ['0-10', '10-25', '25-50', '50+'];
  labels.forEach((l, i) => { cells[27 + i] = c.dockDoors === l ? 'YES' : ''; });
  labels.forEach((l, i) => { cells[31 + i] = c.dropArea === l ? 'YES' : ''; });

  cells[35] = yn(c.shipRcvSeparate);
  cells[36] = c.urbanRural ?? '';
  cells[37] = yn(c.connectivityIssue);
  cells[38] = yn(c.multipleFacilities);
  cells[39] = yn(c.scale);
  cells[40] = yn(c.dropYard);
  cells[41] = site.mapsUrl ?? '';
  return cells;
}

function summaryRow(label: string, count: number | string, percent = ''): string[] {
  const r = blank();
  r[1] = label;
  r[2] = String(count);
  r[3] = percent;
  return r;
}

function summaryBlock(sites: Site[]): string[][] {
  const total = sites.length;
  const rows: string[][] = [blank(), blank(), blank()];
  const arch = sites.map((s) => assignArchetype(s.classification).archetype);

  for (let i = 1; i <= 10; i++) {
    const n = arch.filter((a) => a === `#${i}`).length;
    rows.push(summaryRow(`#${i}`, n, pct(n, total)));
  }
  rows.push(summaryRow('Total', total, '100%'), blank());

  const fastLane = sites.filter((s) => s.classification.fastLaneOpportunity).length;
  rows.push(summaryRow('Fast Lane Opportunity', fastLane, pct(fastLane, total)), blank());

  const rural = sites.filter((s) => s.classification.urbanRural === 'Rural').length;
  rows.push(summaryRow('Rural / connectivity', rural, pct(rural, total)), blank());

  const guarded = sites.filter((s) => s.classification.guardShack).length;
  rows.push(
    summaryRow('Guarded', guarded, pct(guarded, total)),
    summaryRow('Not-Guarded', total - guarded, pct(total - guarded, total)),
    blank(),
    blank(),
  );

  rows.push(summaryRow('# Shifts', '', ''));
  const shiftKey = (s: Site) => {
    const v = String(s.operational?.shiftsPerDay ?? '').trim();
    return v === '' ? 'NA' : v;
  };
  for (const k of ['1', '2', '3', 'NA']) {
    const n = sites.filter((s) => shiftKey(s) === k).length;
    rows.push(summaryRow(k, n, pct(n, total)));
  }
  rows.push(summaryRow('Total', total, '100%'));
  return rows;
}

/** Build the full CSV text for an account's site list. */
export function generateCsv(sites: Site[]): string {
  const out: string[][] = [schema.groupHeaderRow, schema.columnHeaderRow];
  for (const s of sites) out.push(siteRow(s));
  for (const r of summaryBlock(sites)) out.push(r);
  return out.map(line).join('\r\n') + '\r\n';
}

// --- CLI -------------------------------------------------------------------
function loadSites(slug: string): Site[] {
  const dir = join(ROOT, 'output', 'yard-audits', slug);
  const baseline = join(dir, 'baseline.json');
  if (existsSync(baseline)) {
    return JSON.parse(readFileSync(baseline, 'utf8')).sites as Site[];
  }
  const sitesDir = join(dir, 'sites');
  if (existsSync(sitesDir)) {
    return readdirSync(sitesDir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((f) => JSON.parse(readFileSync(join(sitesDir, f), 'utf8')) as Site);
  }
  throw new Error(`No baseline.json or sites/ directory found in ${dir}`);
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/yard-audit/generate-csv.ts <account-slug>');
    process.exit(1);
  }
  const sites = loadSites(slug);
  const outPath = join(ROOT, 'output', 'yard-audits', slug, `${slug}-location-breakdown.csv`);
  writeFileSync(outPath, generateCsv(sites));
  console.log(`Wrote ${outPath} (${sites.length} sites).`);

  // Archetype-assignment calibration — only when sites carry Jake's labels.
  const labelled = sites.filter((s) => s.archetype);
  if (labelled.length) {
    const misses: string[] = [];
    let match = 0;
    for (const s of labelled) {
      const computed = assignArchetype(s.classification).archetype;
      if (computed === s.archetype) match++;
      else misses.push(`  ${s.name}: given ${s.archetype} -> computed ${computed}`);
    }
    console.log(
      `\nArchetype-assignment calibration: ${match}/${labelled.length} match (${pct(match, labelled.length)}).`,
    );
    if (misses.length) console.log('Mismatches:\n' + misses.join('\n'));
  }
}

main();
