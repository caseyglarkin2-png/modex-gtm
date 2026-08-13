#!/usr/bin/env node
/**
 * PUBLIC EVIDENCE BOUNDARY — a build gate, not a report.
 *
 * Runs inside `npm run validate:packs`, which vercel.json executes before
 * `next build`. A Preview or Production build FAILS if any committed
 * buyer-facing pack contains a facility we cannot stand behind.
 *
 * This exists because GitHub Actions is not a gate here (push-triggered CI races
 * production, and the account is billing-locked anyway), so the one place a
 * public-evidence regression can be caught automatically is the deploy path
 * itself. It is deliberately tiny: it reads committed JSON and applies one
 * shared rule. No test runner, no network, no corpus dependency — the full unit
 * suite has no business running inside a Vercel build.
 *
 * The invariant is absolute and has no allowlist:
 *
 *     ZERO rejected, weak, unverified or malformed facilities in a public pack.
 *
 * It was "zero except these four accounts" while crowley, dannon, kroger and
 * unfi carried 115 unevidenced facilities. Those are now verified and the
 * exception machinery is gone. If this fails, fix the evidence or rebuild the
 * pack with FOV_GATE=enforce. Do not add an exception.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { evidenceFailure } from './yard-audit/evidence.ts';

const PACKS = join(process.cwd(), 'public', 'demo-packs');

if (!existsSync(PACKS)) {
  console.error('validate-public-evidence: public/demo-packs is missing — refusing to pass a check I could not run.');
  process.exit(1);
}

const files = readdirSync(PACKS).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('validate-public-evidence: no packs found — refusing to pass a check I could not run.');
  process.exit(1);
}

let sites = 0;
let ok = 0;
const offenders = [];

for (const f of files.sort()) {
  const slug = f.replace(/\.json$/, '');
  let pack;
  try {
    pack = JSON.parse(readFileSync(join(PACKS, f), 'utf8'));
  } catch (e) {
    offenders.push({ slug, id: '(whole file)', reason: `unparseable: ${e.message}` });
    continue;
  }

  const packSites = pack?.network?.sites;
  if (!Array.isArray(packSites)) {
    offenders.push({ slug, id: '(whole file)', reason: 'network.sites is not an array' });
    continue;
  }

  // A pack must not claim more facilities than it ships.
  const claimed = pack?.account?.siteCount;
  if (typeof claimed === 'number' && claimed !== packSites.length) {
    offenders.push({ slug, id: '(account.siteCount)', reason: `claims ${claimed} facilities but ships ${packSites.length}` });
  }

  for (const s of packSites) {
    sites++;
    const failure = evidenceFailure(slug, s?.verification);
    if (failure) offenders.push({ slug, id: s?.id ?? '(unnamed site)', reason: failure });
    else ok++;
  }
}

if (offenders.length === 0) {
  console.log(`public evidence boundary OK: ${sites} buyer-facing facilities across ${files.length} packs, all evidenced.`);
  process.exit(0);
}

console.error(`\nPUBLIC EVIDENCE BOUNDARY FAILED — ${offenders.length} problem(s) across ${files.length} packs.`);
console.error(`${ok} of ${sites} buyer-facing facilities are evidenced; the rest must not ship.\n`);
for (const o of offenders.slice(0, 40)) {
  console.error(`  ${o.slug.padEnd(28)} ${String(o.id).padEnd(46)} ${o.reason}`);
}
if (offenders.length > 40) console.error(`  ... and ${offenders.length - 40} more`);
console.error(
  '\nFix the evidence on the SOURCE record and rebuild the pack (FOV_GATE=enforce).' +
  '\nDo not add an exception, and do not hand-edit the pack.\n',
);
process.exit(1);
