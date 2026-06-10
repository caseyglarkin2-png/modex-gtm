#!/usr/bin/env node
/**
 * Batched deep-audit dispatcher — hands back the NEXT N undone sites for a
 * slug so the heavy agent-per-site / probe.ts phase runs in small, resumable
 * chunks instead of fanning out a whole roster at once (which spikes RAM/CPU
 * driving dozens of concurrent satellite + Street-View fetches, and on this
 * machine trips a thermal shutoff).
 *
 * Resume is free: a completed site writes `sites/NN-*.json`, so "done" is
 * simply the set of NN prefixes already present. Re-run after each batch and
 * it walks forward until the roster is exhausted.
 *
 * Usage:
 *   node scripts/yard-audit/audit-batch.mjs <slug> [--size N] [--start IDX] [--json]
 *     <slug>      audit-slug folder under output/yard-audits/ (e.g. seven-eleven)
 *     --size N    sites per batch (default 4; keep small to avoid overload)
 *     --start IDX skip ahead to roster idx >= IDX (rarely needed)
 *     --json      emit the batch as raw JSON (for an orchestrator to consume)
 *
 * The deep-audit agent (scripts/yard-audit/deep-audit-prompt.md) is then
 * dispatched once per listed site, given that site's fields plus the two
 * output paths printed here. Process a batch, re-run this, repeat.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUDITS = join(ROOT, 'output', 'yard-audits');

function parseArgs(argv) {
  const a = { size: 4, start: 0, json: false, slug: null };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--size') a.size = Number(argv[++i]);
    else if (t === '--start') a.start = Number(argv[++i]);
    else if (t === '--json') a.json = true;
    else if (!a.slug) a.slug = t;
  }
  return a;
}

/** Match the historical stem: drop a leading account word, strip parens, slugify. */
function stem(name, account) {
  let s = name;
  if (account && s.toLowerCase().startsWith(account.toLowerCase() + ' ')) {
    s = s.slice(account.length + 1);
  }
  return s
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const pad = (n) => String(n).padStart(2, '0');

function main() {
  const { slug, size, start, json } = parseArgs(process.argv.slice(2));
  if (!slug || Number.isNaN(size) || size < 1) {
    console.error('Usage: audit-batch.mjs <slug> [--size N] [--start IDX] [--json]');
    process.exit(1);
  }

  const dir = join(AUDITS, slug);
  const rosterPath = join(dir, 'roster.json');
  if (!existsSync(rosterPath)) {
    console.error(`No roster at ${rosterPath} — run geocode-roster.ts ${slug} first.`);
    process.exit(1);
  }

  const roster = JSON.parse(readFileSync(rosterPath, 'utf8'));
  const account = typeof roster.account === 'string' ? roster.account : (roster.account?.displayName ?? '');
  const facilities = roster.facilities ?? roster.sites ?? [];

  const sitesDir = join(dir, 'sites');
  const doneIdx = new Set(
    (existsSync(sitesDir) ? readdirSync(sitesDir) : [])
      .map((f) => /^(\d+)-.*\.json$/.exec(f))
      .filter(Boolean)
      .map((m) => Number(m[1])),
  );

  const remaining = facilities
    .filter((f) => !doneIdx.has(f.idx) && f.idx >= start)
    .sort((a, b) => a.idx - b.idx);
  const batch = remaining.slice(0, size);

  if (json) {
    console.log(
      JSON.stringify(
        batch.map((f) => ({
          ...f,
          jsonOut: `output/yard-audits/${slug}/sites/${pad(f.idx)}-${stem(f.name, account)}.json`,
          dossierOut: `output/yard-audits/${slug}/dossiers/${pad(f.idx)}-${stem(f.name, account)}.md`,
        })),
        null,
        2,
      ),
    );
    return;
  }

  const total = facilities.length;
  const done = total - remaining.length;
  console.log(`\n${account || slug} — ${done}/${total} sites audited, ${remaining.length} remaining.`);
  if (!batch.length) {
    console.log('Nothing left in this batch window. Roster complete (or --start past the end).');
    console.log('Next: npx tsx scripts/yard-audit/generate-csv.ts ' + slug + ' && build-demo-pack.ts ' + slug);
    return;
  }

  console.log(`\nNext batch (${batch.length} site${batch.length > 1 ? 's' : ''}). Dispatch one deep-audit agent per site:\n`);
  for (const f of batch) {
    const st = stem(f.name, account);
    const coords = f.lat != null && f.lng != null ? `${f.lat}, ${f.lng}` : '(no coords — agent must resolve)';
    const prec = f.geocode?.precision ? ` [${f.geocode.precision}]` : '';
    console.log(`  idx ${f.idx} — ${f.name}`);
    console.log(`    type:    ${f.type ?? '?'}`);
    console.log(`    address: ${f.address ?? '(none)'} `);
    console.log(`    coords:  ${coords}${prec}`);
    console.log(`    json ->  output/yard-audits/${slug}/sites/${pad(f.idx)}-${st}.json`);
    console.log(`    md   ->  output/yard-audits/${slug}/dossiers/${pad(f.idx)}-${st}.md`);
    console.log('');
  }
  const more = remaining.length - batch.length;
  console.log(more > 0
    ? `After this batch: ${more} site${more > 1 ? 's' : ''} left — re-run this command for the next ${Math.min(size, more)}.`
    : 'This is the final batch — after it, run generate-csv + build-demo-pack.');
}

main();
