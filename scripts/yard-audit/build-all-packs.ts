#!/usr/bin/env tsx
/**
 * D1.4 — Build demo packs for every account in slug-map.ts.
 *
 * Runs D1.1 → D1.3 (and optionally D1.2 — tiles) in sequence per account,
 * collecting per-account success/failure and printing a summary table.
 *
 * Tile fetching is opt-in via --tiles because Static Maps quota is the
 * one resource we can run out of. The default `npm run build-packs`
 * invocation builds JSON packs only (fast, free); add `--tiles` when
 * you're ready to (re)fetch the satellite imagery.
 *
 * Usage:
 *   npx tsx scripts/yard-audit/build-all-packs.ts            # packs only
 *   npx tsx scripts/yard-audit/build-all-packs.ts --tiles    # packs + tiles
 *   npx tsx scripts/yard-audit/build-all-packs.ts --only=mondelez,unfi
 *   npx tsx scripts/yard-audit/build-all-packs.ts --skip-clawd
 */

import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allEntries } from './slug-map';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface AccountResult {
  auditSlug: string;
  micrositeSlug: string;
  packOk: boolean;
  clawdOk: boolean | null; // null = skipped
  tilesOk: boolean | null; // null = skipped
  notes: string[];
}

function runStep(label: string, script: string, slug: string): { ok: boolean; output: string } {
  const r = spawnSync('npx', ['tsx', join('scripts', 'yard-audit', script), slug], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const output = (r.stdout ?? '') + (r.stderr ?? '');
  if (r.status !== 0) {
    return { ok: false, output: `[${label}] exit ${r.status}\n${output.slice(-400)}` };
  }
  return { ok: true, output };
}

function getCliFlag(name: string): string | true | undefined {
  const argv = process.argv.slice(2);
  for (const a of argv) {
    if (a === `--${name}`) return true;
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return undefined;
}

async function main() {
  const withTiles = !!getCliFlag('tiles');
  const skipClawd = !!getCliFlag('skip-clawd');
  const onlyArg = getCliFlag('only');
  const only: string[] | null = typeof onlyArg === 'string' ? onlyArg.split(',').map((s) => s.trim()) : null;

  const all = allEntries().filter((e) => (only ? only.includes(e.auditSlug) || only.includes(e.micrositeSlug) : true));
  console.log(`▶ building packs for ${all.length} accounts — tiles=${withTiles} clawd=${!skipClawd}`);

  const results: AccountResult[] = [];

  for (const entry of all) {
    const slug = entry.auditSlug;
    console.log(`\n── ${entry.displayName}  [${slug}]`);
    const result: AccountResult = {
      auditSlug: slug,
      micrositeSlug: entry.micrositeSlug,
      packOk: false,
      clawdOk: null,
      tilesOk: null,
      notes: [],
    };

    // 1. Build the JSON pack
    const pack = runStep('pack', 'build-demo-pack.ts', slug);
    result.packOk = pack.ok;
    if (!pack.ok) {
      result.notes.push(pack.output.trim().split('\n').slice(-2).join(' / '));
      results.push(result);
      continue; // tiles + clawd are meaningless without a pack
    }
    // Extract the one-liner stat from the pack build output
    const statLine = pack.output.split('\n').find((l) => /sites · /.test(l));
    if (statLine) console.log(`  ${statLine.trim()}`);

    // 2. Merge clawd research
    if (!skipClawd) {
      const cl = runStep('clawd', 'merge-clawd-research.ts', slug);
      result.clawdOk = cl.ok;
      if (!cl.ok) result.notes.push(cl.output.trim().split('\n').slice(-2).join(' / '));
    }

    // 3. Fetch tiles (slow + costs API quota)
    if (withTiles) {
      const t = runStep('tiles', 'fetch-demo-tiles.ts', slug);
      result.tilesOk = t.ok;
      if (!t.ok) result.notes.push(t.output.trim().split('\n').slice(-2).join(' / '));
    }

    results.push(result);
  }

  // Summary table
  console.log('\n══ summary ══');
  const ok = (b: boolean | null) => (b === null ? '·' : b ? '✓' : '✗');
  console.log('pack clawd tiles  account');
  console.log('---- ----- -----  -------');
  for (const r of results) {
    console.log(`  ${ok(r.packOk)}    ${ok(r.clawdOk)}     ${ok(r.tilesOk)}    ${r.auditSlug}`);
  }
  const failedPacks = results.filter((r) => !r.packOk);
  if (failedPacks.length > 0) {
    console.log(`\n${failedPacks.length} packs failed:`);
    for (const r of failedPacks) console.log(`  ${r.auditSlug}: ${r.notes.join(' | ')}`);
  }
  console.log(`\n${results.filter((r) => r.packOk).length}/${results.length} packs built.`);
  if (failedPacks.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
