#!/usr/bin/env node
/**
 * Patch the 11 industry-anchor demo packs with
 * `account.roiDefaults.averageMarginPerShipment`.
 *
 * WHY THIS IS A SCRIPT (and not hand-edited JSON):
 * `scripts/yard-audit/build-demo-pack.ts` rebuilds a pack purely from audit
 * data + slug-map metadata; it does NOT emit roiDefaults. So every geofence /
 * Street-View regeneration overwrites the pack and drops this GTM-only field.
 * Phase D (commit 0f2b710) authored these values straight into the JSON, and
 * the next pack regen (32dfbaa) silently wiped them. This mirrors the
 * `patch-global-footprints.mjs` pattern: GTM fields are layered onto built
 * packs by an idempotent post-build patch, and `validate-roi-defaults.mjs`
 * gates the build so a drop fails loudly instead of shipping a $1,000 fallback.
 *
 * AFTER REGENERATING ANY ANCHOR PACK, re-run this script.
 *
 * The value is an industry-representative seed for the /roi calculator's
 * "average margin per shipment" ask (the calculator prefills it and the
 * prospect can edit it). The 11 anchors are the curated gallery shelf, kept in
 * sync with src/lib/demo/industry-tags.ts INDUSTRY_ANCHORS and the slug list in
 * scripts/validate-roi-defaults.mjs. Edit a number here and rerun to change it.
 *
 * Run: node scripts/patch-roi-defaults.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const PACK_DIR = path.join(process.cwd(), 'public', 'demo-packs');

// slug → industry-representative average margin per shipment ($).
// Authored in Phase D (D.T4). Keyed to the anchor's industry, not the
// specific company. Order matches src/lib/demo/industry-tags.ts.
const ANCHOR_MARGINS = {
  'coca-cola': 850, // Beverage
  'mondelez-international': 720, // CPG · Food
  'frito-lay': 640, // CPG · Snacks
  'kimberly-clark': 1100, // CPG · Personal Care & Paper
  gxo: 480, // 3PL · Warehousing
  ford: 2200, // OEM · Automotive
  caterpillar: 1400, // Manufacturing · Heavy Equipment
  'georgia-pacific': 920, // Building Materials & Paper
  'the-home-depot': 640, // Retail · Big-Box DC
  'performance-food-group': 580, // Grocer · Distributor
  fedex: 380, // Logistics · Parcel & LTL
};

let updated = 0;
const missing = [];

for (const [slug, margin] of Object.entries(ANCHOR_MARGINS)) {
  const file = path.join(PACK_DIR, `${slug}.json`);
  let pack;
  try {
    pack = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    missing.push(`${slug} (${err.message})`);
    continue;
  }
  if (!pack.account) {
    missing.push(`${slug} (no account object)`);
    continue;
  }
  pack.account.roiDefaults = { averageMarginPerShipment: margin };
  writeFileSync(file, JSON.stringify(pack, null, 2));
  console.log(`  ${slug.padEnd(28)} averageMarginPerShipment=${margin}`);
  updated++;
}

console.log(`\nPatched ${updated}/${Object.keys(ANCHOR_MARGINS).length} anchor packs.`);
if (missing.length > 0) {
  console.error('Could not patch:', missing.join(', '));
  process.exit(1);
}
