/**
 * Phase 4.1 — calibration scorer.
 *
 * Diffs satellite + Street View classifications (output/yard-audits/<slug>/sites/*.json)
 * against Jake's baseline (output/yard-audits/<slug>/baseline.json).
 *
 * Reports three numbers:
 *   - Archetype match — the product output (#1-#10).
 *   - Archetype-driving fields — the 9 fields Jake classified rigorously to
 *     assign archetypes; the honest accuracy yardstick (target >80%).
 *   - Overall field match — all 21 fields, including Jake's sparsely-filled
 *     non-archetype columns (dropYard etc.); reported for completeness only,
 *     since those columns are not reliable ground truth.
 *
 * Sites are matched by the leading NN index in the filename (01-… ⇒ baseline[0]).
 *
 * Run: npx tsx scripts/yard-audit/diff-calibration.ts <account-slug>
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assignArchetype, pct, type Classification } from './lib.ts';

const ROOT = process.cwd();

const FIELDS = [
  'truckGate', 'guardShack', 'remoteGs', 'preGateStaging', 'postGateStaging',
  'drivewayLong', 'drivewayShort', 'backupSensitive', 'entryExitTogether',
  'entryExitSeparate', 'entryLanes', 'exitLanes', 'fastLaneOpportunity',
  'dockDoors', 'dropArea', 'shipRcvSeparate', 'urbanRural', 'connectivityIssue',
  'multipleFacilities', 'scale', 'dropYard',
] as const;
type Field = (typeof FIELDS)[number];

/**
 * The fields that mathematically drive archetype assignment. Jake assigned
 * #1-#10 from these, so they are rigorous ground truth — the honest yardstick.
 */
const ARCHETYPE_FIELDS: Field[] = [
  'truckGate', 'guardShack', 'remoteGs', 'multipleFacilities', 'backupSensitive',
  'shipRcvSeparate', 'fastLaneOpportunity', 'scale', 'entryExitSeparate',
];

/** Field-level equality. Lane counts allow ±1; missing booleans default to false. */
function matches(field: Field, got: unknown, want: unknown): boolean {
  if (field === 'entryLanes' || field === 'exitLanes') {
    if (got == null && want == null) return true;
    if (got == null || want == null) return false;
    return Math.abs(Number(got) - Number(want)) <= 1;
  }
  const norm = (v: unknown) => (v === undefined || v === null ? false : v);
  return norm(got) === norm(want);
}

interface SiteFile {
  name?: string;
  classification: Classification;
}
interface BaselineSite {
  name: string;
  archetype: string;
  classification: Classification;
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/yard-audit/diff-calibration.ts <account-slug>');
    process.exit(1);
  }
  const dir = join(ROOT, 'output', 'yard-audits', slug);
  const baseline = JSON.parse(readFileSync(join(dir, 'baseline.json'), 'utf8'))
    .sites as BaselineSite[];

  const sitesDir = join(dir, 'sites');
  if (!existsSync(sitesDir)) throw new Error(`No sites/ directory in ${dir}`);
  const files = readdirSync(sitesDir).filter((f) => /^\d+.*\.json$/.test(f)).sort();
  if (!files.length) throw new Error(`No classification files in ${sitesDir}`);

  const fieldHit: Record<string, number> = {};
  const fieldTot: Record<string, number> = {};
  for (const f of FIELDS) { fieldHit[f] = 0; fieldTot[f] = 0; }

  let totalHit = 0;
  let totalCmp = 0;
  let archHit = 0;
  const perSite: Array<{
    idx: number; name: string; hit: number; misses: string[];
    archGot: string; archWant: string;
  }> = [];

  for (const file of files) {
    const idx = parseInt(file, 10);
    const base = baseline[idx - 1];
    if (!base) { console.warn(`  no baseline row for ${file} (idx ${idx})`); continue; }
    const got = (JSON.parse(readFileSync(join(sitesDir, file), 'utf8')) as SiteFile).classification;

    let hit = 0;
    const misses: string[] = [];
    for (const f of FIELDS) {
      fieldTot[f]++;
      totalCmp++;
      if (matches(f, (got as Record<string, unknown>)[f], (base.classification as Record<string, unknown>)[f])) {
        hit++; fieldHit[f]++; totalHit++;
      } else {
        misses.push(
          `${f}: got ${JSON.stringify((got as Record<string, unknown>)[f])}, ` +
          `want ${JSON.stringify((base.classification as Record<string, unknown>)[f])}`,
        );
      }
    }
    const archGot = assignArchetype(got).archetype;
    if (archGot === base.archetype) archHit++;
    perSite.push({ idx, name: base.name, hit, misses, archGot, archWant: base.archetype });
  }

  const n = perSite.length;
  const adHit = ARCHETYPE_FIELDS.reduce((s, f) => s + fieldHit[f], 0);
  const adTot = ARCHETYPE_FIELDS.reduce((s, f) => s + fieldTot[f], 0);
  const byWeakField = [...FIELDS].sort((a, b) => fieldHit[a] / fieldTot[a] - fieldHit[b] / fieldTot[b]);

  const L: string[] = [];
  L.push('# Kraft Calibration Report', '');
  L.push(`Satellite + Street View classification vs Jake's baseline — ${n} sites.`, '');
  L.push(`- **Archetype match: ${archHit}/${n} (${pct(archHit, n)})** — the product output (#1-#10)`);
  L.push(`- **Archetype-driving fields: ${adHit}/${adTot} (${pct(adHit, adTot)})** — honest yardstick, target >80%`);
  L.push(`- Overall field match, all ${FIELDS.length} fields incl. Jake's sparse non-archetype columns: ${totalHit}/${totalCmp} (${pct(totalHit, totalCmp)})`, '');
  L.push('## Per-field accuracy (weakest first)', '', '| Field | Match | Drives archetype |', '|---|---|---|');
  for (const f of byWeakField) {
    L.push(`| ${f} | ${fieldHit[f]}/${fieldTot[f]} (${pct(fieldHit[f], fieldTot[f])}) | ${ARCHETYPE_FIELDS.includes(f) ? 'yes' : ''} |`);
  }
  L.push('', '## Per-site', '', '| # | Site | Fields (/21) | Archetype |', '|---|---|---|---|');
  for (const s of perSite) {
    const arch = s.archGot === s.archWant ? s.archGot : `${s.archGot} ✗ (want ${s.archWant})`;
    L.push(`| ${s.idx} | ${s.name} | ${s.hit}/${FIELDS.length} (${pct(s.hit, FIELDS.length)}) | ${arch} |`);
  }
  L.push('', '## Mismatches by site', '');
  for (const s of perSite.filter((x) => x.misses.length)) {
    L.push(`**${s.idx} ${s.name}** — ${s.misses.length} miss(es):`);
    for (const m of s.misses) L.push(`- ${m}`);
    L.push('');
  }
  writeFileSync(join(dir, 'calibration-report.md'), L.join('\n') + '\n');

  console.log(`\nCalibration — ${slug}`);
  console.log(`  Archetype match:          ${archHit}/${n} (${pct(archHit, n)})`);
  console.log(`  Archetype-driving fields: ${adHit}/${adTot} (${pct(adHit, adTot)})   [target >80%]`);
  console.log(`  Overall (all 21 fields):  ${totalHit}/${totalCmp} (${pct(totalHit, totalCmp)})`);
  console.log(`  Sites scored:             ${n}`);
  console.log('  Weakest fields:');
  for (const f of byWeakField.slice(0, 6)) {
    console.log(`    ${f}: ${fieldHit[f]}/${fieldTot[f]} (${pct(fieldHit[f], fieldTot[f])})${ARCHETYPE_FIELDS.includes(f) ? '  *archetype-driving*' : ''}`);
  }
  console.log(`  Report: output/yard-audits/${slug}/calibration-report.md`);
}

main();
