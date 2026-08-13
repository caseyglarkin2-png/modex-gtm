/**
 * Corpus-wide GeoJSON validator. Independent of the generator on purpose: the
 * generator can only vouch for the file it just wrote, this vouches for every
 * file currently on disk, including ones written by an older, broken build.
 *
 * Exits 1 if ANY generated geometry is null, non-numeric, NaN/Infinite, out of
 * range, unclosed, too short, or structurally malformed. Warning-only linting is
 * what let 44,090 null positions sit in the tree unnoticed, so this fails hard.
 *
 * Run: npx tsx scripts/yard-audit/validate-geojson.ts            (whole corpus)
 *      npx tsx scripts/yard-audit/validate-geojson.ts <slug> ... (named accounts)
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateFeatureCollection } from './geometry.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUD = join(ROOT, 'output', 'yard-audits');

function targets(requested: string[]): string[] {
  if (requested.length) {
    return requested.map((s) => join(AUD, s, `${s}.geojson`)).filter((p) => existsSync(p));
  }
  const files: string[] = [];
  for (const d of readdirSync(AUD).sort()) {
    const p = join(AUD, d);
    try {
      if (statSync(p).isDirectory()) {
        const g = join(p, `${d}.geojson`);
        if (existsSync(g)) files.push(g);
      }
    } catch {
      /* unreadable entry — nothing to validate */
    }
  }
  const all = join(AUD, 'YardFlow-All-Geofences.geojson');
  if (existsSync(all)) files.push(all);
  return files;
}

function countPositions(fc: { features?: { geometry?: { coordinates?: unknown } }[] }): number {
  let n = 0;
  const walk = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (c.length && typeof c[0] === 'number') { n++; return; }
    if (c.length === 2 && c.every((x) => x === null || typeof x !== 'object')) { n++; return; }
    for (const el of c) walk(el);
  };
  for (const f of fc.features ?? []) walk(f.geometry?.coordinates);
  return n;
}

function main(): void {
  const files = targets(process.argv.slice(2).filter((a) => !a.startsWith('-')));
  if (files.length === 0) {
    console.error('No geojson files found to validate.');
    process.exit(1);
  }

  let bad = 0;
  let totalIssues = 0;
  let totalPositions = 0;

  for (const file of files) {
    const label = basename(file);
    let fc: unknown;
    try {
      fc = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      console.error(`✗ ${label}: unparseable JSON — ${(e as Error).message}`);
      bad++;
      totalIssues++;
      continue;
    }
    totalPositions += countPositions(fc as { features?: [] });
    const issues = validateFeatureCollection(fc, label);
    if (issues.length) {
      bad++;
      totalIssues += issues.length;
      console.error(`✗ ${label}: ${issues.length} problem(s)`);
      for (const i of issues.slice(0, 5)) console.error(`    ${i.path}: ${i.problem}`);
      if (issues.length > 5) console.error(`    ... and ${issues.length - 5} more`);
    }
  }

  console.log(
    `\n${files.length} file(s), ${totalPositions.toLocaleString()} position(s) checked — ` +
    `${bad} file(s) invalid, ${totalIssues} problem(s).`,
  );
  if (bad) {
    console.error('GeoJSON validation FAILED.');
    process.exit(1);
  }
  console.log('GeoJSON validation PASSED — 0 null, 0 non-numeric, 0 out-of-range, 0 unclosed.');
}

main();
