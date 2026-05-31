#!/usr/bin/env node
/**
 * L.T1 — Orphan-guard: the "never forgotten" guarantee.
 *
 * Every audited account in public/demo-packs must be a complete, surfaced
 * microsite. Fails the build (exits non-zero) if any account is orphaned.
 *
 * For ALL audited accounts:
 *   - pack parses
 *   - account.dossierIntro is present and non-empty
 *   - account.surprisingFindings has exactly 3 items
 *   - (presence in the gallery's "all audited" directory is automatic:
 *     loadAllAccountSummaries auto-discovers every .json here)
 *
 * For the 11 industry ANCHORS additionally:
 *   - listed in public/gallery-thumbs/manifest.json
 *   - the <slug>.png exists on disk
 *
 * (Note: the plan's first draft required a thumb for every account, but
 * thumbs are anchor-only by design — the ~32 non-anchor microsites render
 * a placeholder. The guard reflects that reality.)
 *
 * Run: node scripts/validate-microsite-coverage.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const PACK_DIR = path.join(process.cwd(), 'public', 'demo-packs');
const THUMB_DIR = path.join(process.cwd(), 'public', 'gallery-thumbs');

// Kept in sync with src/lib/demo/industry-tags.ts INDUSTRY_ANCHORS.
const ANCHOR_SLUGS = new Set([
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
]);

const failures = [];

let manifestSlugs = new Set();
try {
  const manifest = JSON.parse(readFileSync(path.join(THUMB_DIR, 'manifest.json'), 'utf8'));
  manifestSlugs = new Set(manifest.map((m) => m.slug));
} catch {
  failures.push('gallery-thumbs/manifest.json missing or unreadable');
}

let slugs = [];
try {
  slugs = readdirSync(PACK_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
} catch (err) {
  console.error(`validate-microsite-coverage: cannot read ${PACK_DIR}: ${err.message}`);
  process.exit(1);
}

for (const slug of slugs) {
  let pack;
  try {
    pack = JSON.parse(readFileSync(path.join(PACK_DIR, `${slug}.json`), 'utf8'));
  } catch (err) {
    failures.push(`${slug}: cannot parse pack (${err.message})`);
    continue;
  }
  const a = pack.account ?? {};
  if (!a.dossierIntro || !String(a.dossierIntro).trim()) {
    failures.push(`${slug}: missing account.dossierIntro`);
  }
  const findings = Array.isArray(a.surprisingFindings) ? a.surprisingFindings : [];
  if (findings.length !== 3) {
    failures.push(`${slug}: expected exactly 3 surprisingFindings, got ${findings.length}`);
  }
  if (ANCHOR_SLUGS.has(slug)) {
    if (!manifestSlugs.has(slug)) failures.push(`${slug}: anchor missing from gallery-thumbs manifest`);
    if (!existsSync(path.join(THUMB_DIR, `${slug}.png`))) {
      failures.push(`${slug}: anchor thumb PNG missing on disk`);
    }
  }
}

if (failures.length > 0) {
  console.error('validate-microsite-coverage: FAIL — orphaned audited accounts:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(
  `validate-microsite-coverage: OK (${slugs.length} audited microsites complete; ${ANCHOR_SLUGS.size} anchors with thumbs)`,
);
