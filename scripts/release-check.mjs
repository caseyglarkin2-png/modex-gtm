#!/usr/bin/env node
/**
 * THE RELEASE GATE. One command answers one question:
 *
 *     is this commit safe to put on a Vercel Preview / Production?
 *
 *     npm run release:check
 *
 * It composes tools this repo already trusts. It does not invent a parallel
 * test universe, and it does not try to be a CI service.
 *
 * ── why this exists ─────────────────────────────────────────────────────────
 * GitHub Actions is not a production gate here and never really was. ci.yml
 * runs on `push: [main]`, and Vercel production also follows main, so CI and
 * production start from the same event — CI cannot prove a commit it is racing.
 * (It is additionally billing-locked at the account level, but that is a
 * symptom, not the architectural problem.) The gate has to live somewhere a
 * human or agent runs it BEFORE the push. That is here.
 *
 * ── the failure taxonomy, which is the whole point ──────────────────────────
 * A red gate that cannot say WHY is a gate people stop running. Every stage
 * declares what a failure of it actually means:
 *
 *   DEPENDENCY  the install is wrong/incomplete. Not the code's fault.
 *               (`for-hero-map` and `for-author-override` fail exactly this
 *               way against a shared/partial node_modules, while both packages
 *               are correctly declared in package.json.)
 *   ENVIRONMENT this machine or tool cannot run the check at all.
 *   PRODUCT     a real defect in shipped behaviour or data.
 *   TEST        a genuine assertion failure, reproducible in isolation.
 *   FLAKE       failed under parallel load, passes isolated. A scheduling
 *               artifact of a thermally-limited machine, not a defect.
 *
 * The unit stage earns that last distinction honestly: anything that fails
 * under load is RE-RUN ISOLATED before it is called a failure.
 *
 * ── what is deliberately NOT here ───────────────────────────────────────────
 * `next build`. It needs ~4GB and Windows symlink privileges this machine does
 * not grant (os error 1314), so including it would make the gate red forever
 * and train everyone to ignore it. The build's PREREQUISITES run here
 * (validate:packs, check-force-dynamic, prisma generate) — the same ones
 * vercel.json runs before `next build` — and the build itself is proven on the
 * Vercel Preview for the exact SHA. That is the honest division of labour.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const CORPUS = join(ROOT, 'output', 'yard-audits');
const hasCorpus = existsSync(CORPUS);
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const skipUnit = process.argv.includes('--no-unit');

const t0 = Date.now();
const results = [];

function sh(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 64 * 1024 * 1024,
    ...opts,
  });
}

function stage(name, kind, fn) {
  if (only.length && !only.includes(name)) return;
  const s = Date.now();
  process.stdout.write(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}\n`);
  let out;
  try {
    out = fn();
  } catch (e) {
    out = { ok: false, kind: 'ENVIRONMENT', detail: `stage threw: ${e.message}` };
  }
  const ms = Date.now() - s;
  results.push({ name, kind: out.ok ? null : out.kind || kind, ...out, ms });
  console.log(`   ${out.ok ? 'PASS' : `FAIL [${out.kind || kind}]`}  ${(ms / 1000).toFixed(1)}s${out.detail ? ` — ${out.detail}` : ''}`);
  if (out.lines) for (const l of out.lines.slice(0, 12)) console.log(`     ${l}`);
}

// ── 1. dependencies ─────────────────────────────────────────────────────────
// Runs FIRST so a broken install is never reported as a product defect.
stage('deps', 'DEPENDENCY', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  const missing = Object.keys(declared).filter((d) => !existsSync(join(ROOT, 'node_modules', ...d.split('/'))));
  if (missing.length) {
    return {
      ok: false,
      kind: 'DEPENDENCY',
      detail: `${missing.length} declared package(s) not installed — run \`npm ci\``,
      lines: missing.slice(0, 10),
    };
  }
  return { ok: true, detail: `${Object.keys(declared).length} declared packages present` };
});

// ── 2. pack validators — the same gate vercel.json runs pre-build ───────────
stage('validate:packs', 'PRODUCT', () => {
  const r = sh('npm', ['run', '--silent', 'validate:packs']);
  return r.status === 0
    ? { ok: true, detail: 'voice CI, roi defaults, microsite coverage, roi prefill' }
    : { ok: false, kind: 'PRODUCT', lines: String(r.stdout + r.stderr).trim().split('\n').slice(-8) };
});

// ── 3. force-dynamic guard — also a vercel.json build prerequisite ──────────
stage('force-dynamic', 'PRODUCT', () => {
  const r = sh('node', ['scripts/check-force-dynamic.js']);
  return r.status === 0
    ? { ok: true }
    : { ok: false, kind: 'PRODUCT', lines: String(r.stdout + r.stderr).trim().split('\n').slice(-6) };
});

// ── 4. typecheck ────────────────────────────────────────────────────────────
stage('typecheck', 'PRODUCT', () => {
  const r = sh('node', ['node_modules/typescript/bin/tsc', '--noEmit']);
  if (r.status === 0) return { ok: true };
  const lines = String(r.stdout + r.stderr).trim().split('\n').filter(Boolean);
  // "Cannot find module 'x'" for a DECLARED package is an install problem.
  const depish = lines.filter((l) => /Cannot find module|Could not find a declaration file/.test(l));
  const kind = depish.length && depish.length === lines.filter((l) => /error TS/.test(l)).length
    ? 'DEPENDENCY'
    : 'PRODUCT';
  return { ok: false, kind, detail: `${lines.filter((l) => /error TS/.test(l)).length} type error(s)`, lines: lines.slice(0, 10) };
});

// ── 5. unit suite, safe concurrency, with isolated flake re-run ─────────────
stage('unit', 'TEST', () => {
  if (skipUnit) return { ok: true, detail: 'skipped (--no-unit)' };

  // JSON reporter, not text. Parsing a colourised human reporter with regexes
  // is how a gate quietly stops being able to name its own failures — the first
  // version of this reported every real failure as "unparseable".
  const jsonOut = join(ROOT, 'node_modules', '.cache', 'release-check-unit.json');
  const run = (args) =>
    sh('node', ['node_modules/vitest/vitest.mjs', 'run', ...args, '--reporter=json', `--outputFile=${jsonOut}`]);

  const failedFilesFrom = () => {
    try {
      const rep = JSON.parse(readFileSync(jsonOut, 'utf8'));
      return [...new Set((rep.testResults || []).filter((t) => t.status === 'failed').map((t) => t.name))];
    } catch {
      return null; // report unreadable — cannot classify
    }
  };

  const r = run(['--maxWorkers=3']);
  const rep0 = (() => { try { return JSON.parse(readFileSync(jsonOut, 'utf8')); } catch { return null; } })();
  if (r.status === 0) {
    return { ok: true, detail: `${rep0 ? rep0.numPassedTests : '?'} tests passed, ${rep0 ? rep0.numTotalTestSuites : '?'} files` };
  }

  const files = failedFilesFrom();
  if (files === null) {
    return { ok: false, kind: 'ENVIRONMENT', detail: 'vitest produced no readable JSON report — the runner itself failed' };
  }
  if (!files.length) {
    return { ok: false, kind: 'ENVIRONMENT', detail: 'vitest exited non-zero with no failed suite — runner/collection error' };
  }

  // Re-run each failing file ALONE. Load is not a defect, and on a thermally
  // limited machine the difference matters: gmail-thread-exists takes 426ms
  // isolated and times out at ~14.7s under parallel load.
  const real = [], flaky = [];
  for (const f of files) {
    const rel = relative(ROOT, f).split(sep).join('/');
    const solo = run([rel]);
    (solo.status === 0 ? flaky : real).push(rel);
  }
  if (real.length) {
    return {
      ok: false,
      kind: 'TEST',
      detail: `${real.length} file(s) fail in isolation${flaky.length ? `; ${flaky.length} load-flake` : ''}`,
      lines: [...real.map((f) => `REAL   ${f}`), ...flaky.map((f) => `FLAKE  ${f}`)],
    };
  }
  return {
    ok: false,
    kind: 'FLAKE',
    detail: `${flaky.length} file(s) passed in isolation - scheduling artifact, not a defect`,
    lines: flaky,
  };
});

// ── 6..8. corpus stages — only when the audit corpus is present ─────────────
// output/ is .vercelignore'd, so a Vercel build legitimately has no corpus.
// Absent corpus SKIPS; it never silently passes a check it did not run.
stage('geometry', 'PRODUCT', () => {
  if (!hasCorpus) return { ok: true, detail: 'skipped — no output/yard-audits in this checkout' };
  const r = sh('node', ['node_modules/tsx/dist/cli.mjs', 'scripts/yard-audit/validate-geojson.ts']);
  const out = String(r.stdout + r.stderr);
  return r.status === 0
    ? { ok: true, detail: (out.match(/(\d[\d,]*) position\(s\) checked/) || [, '?'])[1] + ' positions, 0 invalid' }
    : { ok: false, kind: 'PRODUCT', lines: out.trim().split('\n').slice(-8) };
});

stage('determinism', 'PRODUCT', () => {
  if (!hasCorpus) return { ok: true, detail: 'skipped — no corpus' };
  const before = sh('git', ['status', '--porcelain', 'output/yard-audits']).stdout;
  if (before.trim()) {
    return { ok: false, kind: 'ENVIRONMENT', detail: 'output/yard-audits already dirty — commit or stash first' };
  }
  for (const s of ['build-geojson', 'build-geofence-links', 'build-sales-summary', 'build-master-index']) {
    const r = sh('node', ['node_modules/tsx/dist/cli.mjs', `scripts/yard-audit/${s}.ts`]);
    if (r.status !== 0) {
      return { ok: false, kind: 'PRODUCT', detail: `${s} failed`, lines: String(r.stdout + r.stderr).trim().split('\n').slice(-6) };
    }
  }
  const after = sh('git', ['status', '--porcelain', 'output/yard-audits']).stdout.trim();
  if (after) {
    sh('git', ['checkout', '--', 'output/yard-audits']);
    return { ok: false, kind: 'PRODUCT', detail: 'regeneration is not deterministic', lines: after.split('\n').slice(0, 8) };
  }
  return { ok: true, detail: 'regenerating the corpus changes nothing' };
});

// ── 9. prisma client — the last vercel.json build prerequisite ─────────────
stage('prisma', 'ENVIRONMENT', () => {
  const r = sh('node', ['node_modules/prisma/build/index.js', 'generate']);
  return r.status === 0
    ? { ok: true, detail: 'client generates' }
    : { ok: false, kind: 'ENVIRONMENT', lines: String(r.stdout + r.stderr).trim().split('\n').slice(-6) };
});

// ── verdict ─────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);
const blocking = failed.filter((r) => r.kind !== 'FLAKE');
const secs = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n${'═'.repeat(62)}`);
for (const r of results) {
  console.log(`  ${(r.ok ? 'PASS ' : `FAIL ${r.kind}`).padEnd(17)} ${r.name.padEnd(18)} ${(r.ms / 1000).toFixed(1)}s`);
}
console.log('═'.repeat(62));

if (!blocking.length) {
  const note = failed.length ? `  (${failed.length} non-blocking FLAKE)` : '';
  console.log(`RELEASE CHECK: PASS in ${secs}s${note}`);
  console.log('Safe to push for a Vercel Preview. The Preview proves `next build`.');
  process.exit(0);
}
console.log(`RELEASE CHECK: FAIL in ${secs}s`);
for (const r of blocking) console.log(`  ${r.kind}: ${r.name} — ${r.detail || 'see above'}`);
console.log('\nDEPENDENCY/ENVIRONMENT = fix this machine. PRODUCT/TEST = fix the commit.');
process.exit(1);
