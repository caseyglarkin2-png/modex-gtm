#!/usr/bin/env node
/**
 * Restore the Phase B narrative fields — account.dossierIntro and
 * account.surprisingFindings — that a pack regeneration (commit 32dfbaa)
 * wiped from every demo pack.
 *
 * These were hand-authored into the JSON (Phase B, d811c1a + follow-ups) with
 * no patch script, so build-demo-pack.ts dropped them on the next rebuild.
 * They are pure authored content (no computable default), so the canonical
 * source is the last git revision of each pack that still carried them. This
 * script walks each pack's history newest→oldest, finds the most recent
 * revision with a 3-item surprisingFindings array, and copies dossierIntro +
 * surprisingFindings forward into the current working-tree pack.
 *
 * Going forward, build-demo-pack.ts preserves these fields on rebuild (see its
 * merge-forward block), so this one-time restore should not be needed again —
 * but it stays as a recovery tool if a pack is ever rebuilt from a state where
 * they were already lost.
 *
 * Run: node scripts/restore-pack-narrative.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PACK_DIR = path.join('public', 'demo-packs');

function gitShow(rev, file) {
  try {
    return execFileSync('git', ['show', `${rev}:${file}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function revsTouching(file) {
  try {
    return execFileSync('git', ['log', '--format=%H', '--', file], { encoding: 'utf8' })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const files = readdirSync(PACK_DIR).filter((f) => f.endsWith('.json'));
let restored = 0;
const failures = [];

for (const file of files) {
  const slug = file.replace(/\.json$/, '');
  const rel = `${PACK_DIR}/${file}`.replace(/\\/g, '/');
  const pack = JSON.parse(readFileSync(rel, 'utf8'));

  const hasIntro = typeof pack.account?.dossierIntro === 'string' && pack.account.dossierIntro.length > 0;
  const hasFindings = Array.isArray(pack.account?.surprisingFindings) && pack.account.surprisingFindings.length === 3;
  if (hasIntro && hasFindings) continue; // already good

  let found = null;
  for (const rev of revsTouching(rel)) {
    const text = gitShow(rev, rel);
    if (!text) continue;
    let old;
    try {
      old = JSON.parse(text);
    } catch {
      continue;
    }
    const intro = old.account?.dossierIntro;
    const findings = old.account?.surprisingFindings;
    if (typeof intro === 'string' && intro.length > 0 && Array.isArray(findings) && findings.length === 3) {
      found = { intro, findings };
      break;
    }
  }

  if (!found) {
    failures.push(slug);
    continue;
  }

  pack.account.dossierIntro = found.intro;
  pack.account.surprisingFindings = found.findings;
  writeFileSync(rel, JSON.stringify(pack, null, 2));
  console.log(`  ${slug.padEnd(30)} intro(${found.intro.length} chars) + ${found.findings.length} findings`);
  restored++;
}

console.log(`\nRestored ${restored} packs.`);
if (failures.length > 0) {
  console.error(`No recoverable narrative found for: ${failures.join(', ')}`);
  process.exit(1);
}
