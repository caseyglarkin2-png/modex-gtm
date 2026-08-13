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
