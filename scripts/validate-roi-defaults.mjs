#!/usr/bin/env node
/**
 * D.T4 — Validate per-industry ROI defaults.
 *
 * Asserts every industry anchor pack carries a positive
 * account.roiDefaults.averageMarginPerShipment. Non-anchor packs are
 * allowed to omit it (the calculator falls back to 1000). Exits non-zero
 * with a per-slug report on any failure so it can gate the build.
 *
 * Run: node scripts/validate-roi-defaults.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const PACK_DIR = path.join(process.cwd(), 'public', 'demo-packs');

// The 11 industry anchors that surface in the curated gallery shelf and
// must have an authored margin default. Kept in sync with
// src/lib/demo/industry-tags.ts INDUSTRY_ANCHORS slugs.
const ANCHOR_SLUGS = [
  'coca-cola',
  'mondelez-international',
  'frito-lay',
  'kimberly-clark',
  'gxo',
  'ford',
  'caterpillar',
  'georgia-pacific',
  'the-home-depot',
  'performance-food-group',
  'fedex',
];

const failures = [];

for (const slug of ANCHOR_SLUGS) {
  const file = path.join(PACK_DIR, `${slug}.json`);
  let pack;
  try {
    pack = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    failures.push(`${slug}: cannot read/parse pack (${err.message})`);
    continue;
  }
  const margin = pack?.account?.roiDefaults?.averageMarginPerShipment;
  if (typeof margin !== 'number' || !Number.isFinite(margin) || margin <= 0) {
    failures.push(
      `${slug}: account.roiDefaults.averageMarginPerShipment missing or not a positive number (got ${JSON.stringify(margin)})`,
    );
  }
}

// Sanity: warn (do not fail) if a pack file for an anchor is absent.
const present = new Set(
  readdirSync(PACK_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, '')),
);
for (const slug of ANCHOR_SLUGS) {
  if (!present.has(slug)) failures.push(`${slug}: anchor pack file not found`);
}

if (failures.length > 0) {
  console.error('validate-roi-defaults: FAIL');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`validate-roi-defaults: OK (${ANCHOR_SLUGS.length} anchors carry a positive margin default)`);
