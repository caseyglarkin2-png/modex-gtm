#!/usr/bin/env node
// Docs-freshness linter. Answers one question per doc: "is this older than the
// code it describes?"
//
// Why this exists: on 2026-08-06 an audit found 25 stale docs across four repos,
// including a pointer to a plan file that did not exist, three docs asserting a
// git remote that does exist, and a plan whose example code would silently
// disable the outbound ramp cap. The repos take ~300 commits a week; docs do not
// keep up on good intentions. This makes the drift visible on demand instead of
// five months later.
//
// Method: for each doc, take its last commit date, extract the repo paths it
// references, take the newest commit date among those paths, and flag the doc
// when the code has moved on without it. Also flags docs carrying neither a
// STATUS header nor a "Last verified" line, because an undated claim is an
// untrusted claim.
//
// Usage:
//   node scripts/docs-freshness.mjs                 report, always exits 0
//   node scripts/docs-freshness.mjs --strict        exits 1 if anything is STALE
//   node scripts/docs-freshness.mjs --days 30       change the drift threshold
//   node scripts/docs-freshness.mjs --json          machine-readable

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const JSON_OUT = args.includes('--json');
const DRIFT_DAYS = Number(args[args.indexOf('--days') + 1]) || 14;

const sh = (cmd) => {
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
};

const lastCommit = (path) => {
  const iso = sh(`git log -1 --format=%cI -- "${path}"`);
  return iso ? new Date(iso) : null;
};

// Docs worth checking: prose that makes claims about the system. GENERATED
// TREES ARE EXCLUDED — modex-gtm carries 1,299 markdown files under
// output/yard-audits/ that are audit deliverables, not documentation. Linting
// them wastes time and stamping them would be nonsense: they are outputs, and
// an output does not go stale, it gets regenerated.
const IGNORED = [
  'node_modules/', 'output/', 'artifacts/', '.next/', 'dist/', 'build/',
  'coverage/', 'vendor/', '.venv/', 'site-packages/', 'CHANGELOG',
  '.claude/worktrees/',
];
const docs = sh('git ls-files "*.md"')
  .split('\n')
  .filter(Boolean)
  .filter((f) => !IGNORED.some((p) => f.includes(p)));

// A doc "references" a path when it names one that exists in the repo. Matches
// backticked paths and bare src/... or scripts/... mentions.
const PATH_RE = /`?\b((?:src|scripts|app|lib|docs)\/[A-Za-z0-9_\-./[\]]+\.(?:ts|tsx|mjs|js|py|json|md))`?/g;

const results = [];

for (const doc of docs) {
  const docDate = lastCommit(doc);
  if (!docDate) continue;

  const body = readFileSync(doc, 'utf8');

  const statusMatch = body.match(/STATUS:\s*\*{0,2}\s*(ACTIVE|SHIPPED|SUPERSEDED|HISTORICAL|DELIVERED)/i);
  const hasStatus = Boolean(statusMatch);
  const hasVerified = /last verified:?\s*\d{4}-\d{2}-\d{2}/i.test(body)
    || /verified\s+\d{4}-\d{2}-\d{2}/i.test(body);

  // A doc deliberately frozen as HISTORICAL/SHIPPED/SUPERSEDED/DELIVERED is not
  // stale — it is a closed record, and the code moving on is expected. Only
  // ACTIVE and unmarked docs can drift, because only those still claim to
  // describe the present. This is what makes the linter converge: marking a doc
  // honestly retires it from the list.
  const frozen = hasStatus && !/ACTIVE/i.test(statusMatch[1]);

  // Newest referenced code file wins: that is what the doc is describing.
  const refs = [...new Set([...body.matchAll(PATH_RE)].map((m) => m[1]))]
    .filter((p) => !p.endsWith('.md'))
    .filter((p) => existsSync(p));

  let newestRef = null;
  let newestRefPath = null;
  for (const ref of refs.slice(0, 40)) {
    const d = lastCommit(ref);
    if (d && (!newestRef || d > newestRef)) { newestRef = d; newestRefPath = ref; }
  }

  const driftDays = newestRef ? Math.floor((newestRef - docDate) / 86_400_000) : 0;

  let verdict = 'OK';
  let why = '';
  if (!frozen && newestRef && driftDays > DRIFT_DAYS) {
    verdict = 'STALE';
    why = `code moved ${driftDays}d after the doc (newest: ${newestRefPath})`;
  } else if (!hasStatus && !hasVerified && refs.length > 0) {
    verdict = 'UNDATED';
    why = `references ${refs.length} code path(s) but carries no STATUS: or "Last verified" line`;
  }

  if (verdict !== 'OK') {
    results.push({ doc, verdict, why, docDate: docDate.toISOString().slice(0, 10), driftDays, refs: refs.length });
  }
}

results.sort((a, b) => b.driftDays - a.driftDays);

if (JSON_OUT) {
  console.log(JSON.stringify({ checked: docs.length, flagged: results.length, driftDays: DRIFT_DAYS, results }, null, 2));
} else {
  const stale = results.filter((r) => r.verdict === 'STALE');
  const undated = results.filter((r) => r.verdict === 'UNDATED');
  console.log(`\ndocs-freshness: checked ${docs.length} markdown files, flagged ${results.length}\n`);
  if (stale.length) {
    console.log(`STALE — the code moved on without the doc (>${DRIFT_DAYS}d):`);
    for (const r of stale) console.log(`  ${r.doc}\n      last touched ${r.docDate} · ${r.why}`);
    console.log('');
  }
  if (undated.length) {
    console.log('UNDATED — makes code claims with no STATUS: or "Last verified" line:');
    for (const r of undated) console.log(`  ${r.doc} (${r.refs} refs)`);
    console.log('');
  }
  if (!results.length) console.log('Everything current.\n');
  console.log('Fix by adding one of: "STATUS: SHIPPED <date>", "STATUS: SUPERSEDED BY <doc>",');
  console.log('"STATUS: HISTORICAL", or "Last verified: YYYY-MM-DD" — and correcting what changed.\n');
}

process.exit(STRICT && results.some((r) => r.verdict === 'STALE') ? 1 : 0);
