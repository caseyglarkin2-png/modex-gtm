/**
 * PUBLIC EVIDENCE BOUNDARY.
 *
 * The pipeline is:
 *
 *   output/yard-audits/<slug>/sites/*.json     raw research corpus
 *     -> fovGate() in build-demo-pack.ts       the evidence gate
 *     -> public/demo-packs/<slug>.json         the committed public artifact
 *     -> /demo/<slug>                          what a buyer sees
 *
 * A research record is allowed to exist without being ship-eligible. That is
 * the point of a research corpus. What is NOT allowed is an evidence-failing
 * record quietly becoming a public factual claim.
 *
 * Two facts make that possible today, and both are load-bearing to understand
 * before changing anything:
 *
 *   1. fovGate defaults to `warn`, which KEEPS flagged sites. Only an explicit
 *      FOV_GATE=enforce build drops them.
 *   2. Nothing at runtime filters on `verification`. The only consumer is
 *      site-detail-panel.tsx, which reads `verification.imageryDate` for a
 *      display stamp. The committed pack IS the boundary.
 *
 * So 115 sites across 4 packs currently ship with no verification block at all.
 * This test does NOT delete them — crowley, dannon, kroger and unfi are live
 * prospects, and emptying their demos to satisfy a linter would be a worse
 * outcome than the exposure. It pins the exposure instead:
 *
 *   - a NEW unverified site entering ANY public pack fails the build
 *   - a pack not on this list shipping ANY unverified site fails the build
 *   - a `rejected` site reaching a public pack fails the build unconditionally,
 *     with no allowance, because that is a site we affirmatively determined is
 *     closed, divested or pre-production
 *   - when the exposure shrinks, the test says so and asks for the baseline to
 *     be lowered, so the number can only ratchet down
 *
 * The owner action this is holding open is recorded in
 * output/yard-audits/EVIDENCE-BOUNDARY.md.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { evidenceFailure, type Verification } from '../../scripts/yard-audit/evidence';

const PACKS = join(process.cwd(), 'public', 'demo-packs');
const present = existsSync(PACKS);

/**
 * There is no allowlist any more, and that is the point.
 *
 * This map used to hold crowley 25, dannon 13, kroger 47, unfi 30 — 115
 * buyer-facing facilities shipping with no verification at all. Enforcing zero
 * then would have emptied four live prospect demos, so the exposure was pinned
 * and allowed to ratchet down instead. It reached zero on 2026-08-13 by doing
 * the evidence work: recovering Crowley's destroyed rejections, restoring
 * Kroger's, and verifying Dannon and UNFI from scratch.
 *
 * The invariant is now absolute. If this fails, fix the evidence on the source
 * record and rebuild the pack with FOV_GATE=enforce. Do not reintroduce an
 * exception map.
 */

/**
 * Classification comes from scripts/yard-audit/evidence.ts — the same function
 * fovGate() calls. This test used to re-implement the rule, which meant a change
 * to the gate could leave the test asserting the OLD rule and still passing.
 */
function classify(slug: string, v: Verification | undefined): 'pass' | 'rejected' | 'unverified' | 'weak' {
  const failure = evidenceFailure(slug, v);
  if (!failure) return 'pass';
  if (failure === 'rejected') return 'rejected';
  if (failure === 'no-verification-block' || failure === 'no-verdict') return 'unverified';
  return 'weak';
}

function auditPacks() {
  const rows: Record<string, { total: number; pass: number; rejected: number; unverified: number; weak: number }> = {};
  for (const f of readdirSync(PACKS).filter((x) => x.endsWith('.json')).sort()) {
    const slug = f.replace(/\.json$/, '');
    const pack = JSON.parse(readFileSync(join(PACKS, f), 'utf8')) as {
      network?: { sites?: { verification?: Verification }[] };
    };
    const sites = pack.network?.sites ?? [];
    const row = { total: sites.length, pass: 0, rejected: 0, unverified: 0, weak: 0 };
    for (const s of sites) row[classify(slug, s.verification)]++;
    rows[slug] = row;
  }
  return rows;
}

describe.skipIf(!present)('public demo packs — evidence boundary', () => {
  const rows = present ? auditPacks() : {};

  it('ships ZERO facilities that fail the evidence rule — no exceptions', () => {
    const offenders = Object.entries(rows)
      .filter(([, r]) => r.pass !== r.total)
      .map(([slug, r]) => `${slug}: ${r.total - r.pass} of ${r.total} failing ` +
        `(rejected ${r.rejected}, unverified ${r.unverified}, weak ${r.weak})`);
    expect(offenders, 'a buyer-facing pack contains a facility we cannot stand behind').toEqual([]);
  });

  it('never ships a site we affirmatively rejected', () => {
    const offenders = Object.entries(rows)
      .filter(([, r]) => r.rejected > 0)
      .map(([slug, r]) => `${slug}: ${r.rejected} rejected site(s)`);
    expect(offenders).toEqual([]);
  });

  it('has facilities to check, so a zero result cannot come from an empty read', () => {
    const total = Object.values(rows).reduce((n, r) => n + r.total, 0);
    expect(Object.keys(rows).length).toBeGreaterThan(50);
    expect(total).toBeGreaterThan(900);
  });

  it('no pack claims more facilities than it ships', () => {
    const offenders: string[] = [];
    for (const f of readdirSync(PACKS).filter((x) => x.endsWith('.json'))) {
      const pack = JSON.parse(readFileSync(join(PACKS, f), 'utf8')) as {
        account?: { siteCount?: number };
        network?: { sites?: unknown[] };
      };
      const claimed = pack.account?.siteCount;
      const shipped = pack.network?.sites?.length ?? 0;
      if (typeof claimed === 'number' && claimed !== shipped) {
        offenders.push(`${f}: claims ${claimed}, ships ${shipped}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
