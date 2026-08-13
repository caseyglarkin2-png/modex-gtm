/**
 * Corpus guard. `npm run geo:validate` only protects the tree when a human
 * remembers to type it, and "a human remembers" is precisely the posture that
 * let 44,090 null coordinates sit in the repo unnoticed. This runs the same
 * rules under `npm run test:unit`.
 *
 * It cannot live in `prebuild`: `.vercelignore` excludes `output/`, so the
 * corpus is absent during a Vercel build and gating the deploy on it would fail
 * every production build. Here, an absent corpus skips and a present one is
 * checked in full.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { validateFeatureCollection } from '../../scripts/yard-audit/geometry';
import { evidenceFailure } from '../../scripts/yard-audit/evidence';

const AUD = join(process.cwd(), 'output', 'yard-audits');
const present = existsSync(AUD);

function geojsonFiles(): string[] {
  const out: string[] = [];
  for (const d of readdirSync(AUD).sort()) {
    const p = join(AUD, d);
    try {
      if (!statSync(p).isDirectory()) continue;
    } catch {
      continue;
    }
    const g = join(p, `${d}.geojson`);
    if (existsSync(g)) out.push(g);
  }
  const all = join(AUD, 'YardFlow-All-Geofences.geojson');
  if (existsSync(all)) out.push(all);
  return out;
}

/**
 * Directory taxonomy. Four directories here are keyed by MICROSITE slug, not
 * audit slug, and hold the completed 2026-06-19 pack-direct verification
 * research. They have no sites/ and every generator skips them, which is
 * exactly why they read as orphan debris until someone traces them. Naming them
 * means a NEW directory that is neither an account nor a known archive fails the
 * build instead of sitting in the tree unclassified. See README.md.
 */
const EVIDENCE_ARCHIVES = new Set([
  'campbell-s',
  'kenco-logistics-services',
  'mondelez-international',
  'universal-logistics-holdings',
]);

describe.skipIf(!present)('yard-audit directory taxonomy', () => {
  it('every directory is an account or a known evidence archive', () => {
    const unclassified: string[] = [];
    for (const d of readdirSync(AUD).sort()) {
      const p = join(AUD, d);
      try {
        if (!statSync(p).isDirectory()) continue;
      } catch {
        continue;
      }
      const isAccount = existsSync(join(p, 'sites'));
      if (!isAccount && !EVIDENCE_ARCHIVES.has(d)) unclassified.push(d);
    }
    expect(
      unclassified,
      'These directories have no sites/ and are not known evidence archives. ' +
        'Classify them in output/yard-audits/README.md, or remove them. Do not ' +
        'leave a directory here that no pipeline can account for.',
    ).toEqual([]);
  });

  it('every named evidence archive still exists and still holds its evidence', () => {
    const missing: string[] = [];
    for (const a of EVIDENCE_ARCHIVES) {
      if (!existsSync(join(AUD, a, 'verification-rejections.md'))) missing.push(a);
    }
    expect(missing).toEqual([]);
  });
});

describe.skipIf(!present)('yard-audit geojson corpus', () => {
  const files = present ? geojsonFiles() : [];

  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('contains no invalid geometry anywhere', () => {
    const broken: string[] = [];
    for (const f of files) {
      const issues = validateFeatureCollection(JSON.parse(readFileSync(f, 'utf8')), f);
      if (issues.length) broken.push(`${f}: ${issues.length} problem(s) — e.g. ${issues[0].problem}`);
    }
    expect(broken).toEqual([]);
  });
});

/**
 * Tyson's evidence state is written down in prose in
 * output/yard-audits/tyson-foods/verification-evidence.md. Prose and code drift.
 * This pins them together: change the records or the rule, and the doc must be
 * updated in the same commit or the build fails.
 */
describe.skipIf(!present)('tyson-foods evidence state matches its evidence document', () => {
  const SITES = join(AUD, 'tyson-foods', 'sites');
  const DOC = join(AUD, 'tyson-foods', 'verification-evidence.md');

  it('the computed counts are the counts the document claims', () => {
    const counts = { ship: 0, confirmed: 0, probable: 0, blocked: 0 };
    for (const f of readdirSync(SITES).filter((x) => x.endsWith('.json')).sort()) {
      const v = JSON.parse(readFileSync(join(SITES, f), 'utf8')).verification;
      if (evidenceFailure('tyson-foods', v)) {
        counts.blocked++;
        continue;
      }
      counts.ship++;
      if (v.verdict === 'confirmed') counts.confirmed++;
      else counts.probable++;
    }

    const doc = readFileSync(DOC, 'utf8');
    const claim = (re: RegExp) => Number(doc.match(re)?.[1] ?? -1);

    expect(
      { ...counts, total: counts.ship + counts.blocked },
      'Tyson counts changed. Update verification-evidence.md in the same commit.',
    ).toEqual({ ship: 7, confirmed: 4, probable: 3, blocked: 10, total: 17 });

    expect(claim(/\*\*(\d+) of 17 pass/), 'header count').toBe(counts.ship);
    expect(claim(/Do NOT ship — (\d+) of 17/), '"do not ship" heading').toBe(counts.blocked);
    expect(claim(/Ship-eligible — (\d+) of 17/), 'ship-eligible heading').toBe(counts.ship);
    expect(claim(/Confirmed \((\d+)\):/), 'confirmed list').toBe(counts.confirmed);
    expect(claim(/Probable \((\d+)\):/), 'probable list').toBe(counts.probable);
    expect(claim(/\*\*(\d+) is the number that may appear/), 'public-surface caveat').toBe(counts.ship);
  });
});
