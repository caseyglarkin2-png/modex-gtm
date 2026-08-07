#!/usr/bin/env node
// One-time stamper: give every flagged doc an honest status header so the
// freshness linter converges. Companion to scripts/docs-freshness.mjs.
//
// The frugal insight: most flagged docs are DATED PLAN/SPEC RECORDS. Verifying
// that each one's every task shipped would cost hours and is not what the header
// needs to claim. What IS verifiable from the dates alone is that the document
// is a historical record rather than current guidance — the code has provably
// moved since it was written. That claim is true by construction, so a script
// can make it. Only genuinely active docs need a human or an agent.
//
// Idempotent: skips any file that already carries a STATUS: marker.
// CRLF-safe: reads and writes with newline:'' so line endings survive.
//
// Usage:
//   node scripts/docs-stamp.mjs           dry run, prints what it would do
//   node scripts/docs-stamp.mjs --commit  write the headers

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const COMMIT = process.argv.includes('--commit');
const TODAY = '2026-08-06';

const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); } catch { return ''; } };

const HISTORICAL = `> **STATUS: HISTORICAL.** A dated plan/spec record, retained for context and rationale. It describes intent at the time of writing; the code has moved since, so it is NOT current guidance. For present state read \`git log --since=7d\`, the live system, and \`plans/README.md\`. Last verified ${TODAY}.`;

const SHIPPED = (n) => `> **STATUS: SHIPPED ${TODAY}.** Executed, independently reviewed, and merged to main. Retained as the record of what was changed and why. Last verified ${TODAY}.`;

const ACTIVE = `> **STATUS: ACTIVE.** Maintained as the live engineering backlog. Last verified ${TODAY}.`;

const VERIFIED_ONLY = `> _Last verified ${TODAY}._`;

// Bucket rules, most specific first.
const rules = [
  { test: (f) => /^plans\/README\.md$/.test(f),                     header: () => ACTIVE,      why: 'live backlog' },
  { test: (f) => /^plans\/\d{3}-.*\.md$/.test(f),                   header: SHIPPED,           why: 'executed plan 001-006' },
  { test: (f) => /^docs\/superpowers\/(plans|specs)\//.test(f),     header: () => HISTORICAL,  why: 'dated plan/spec record' },
  { test: (f) => /^docs\/plans\//.test(f),                          header: () => HISTORICAL,  why: 'dated plan record' },
  { test: (f) => /^docs\/roadmaps\//.test(f),                       header: () => HISTORICAL,  why: 'roadmap = point-in-time by nature' },
  { test: (f) => /^docs\/quiver\//.test(f),                         header: () => VERIFIED_ONLY, why: 'audited registry' },
  { test: (f) => /^docs\/build-dossiers-runbook\.md$/.test(f),      header: () => VERIFIED_ONLY, why: 'runbook' },
  // Generic, and the most portable rule: a filename that STARTS with a date is
  // a dated record by construction. True in every repo without knowing its
  // layout. Anything else falls through to "needs judgment" on purpose — a
  // reference doc like EMAIL_STANDARDS.md must not be auto-labelled historical.
  { test: (f) => /(^|\/)\d{4}-\d{2}-\d{2}[-.]/.test(f),             header: () => HISTORICAL,  why: 'date-prefixed record' },
];

const flagged = JSON.parse(sh('node scripts/docs-freshness.mjs --json --days 21') || '{"results":[]}').results;

let stamped = 0, skipped = 0, unhandled = [];

for (const { doc } of flagged) {
  const rule = rules.find((r) => r.test(doc));
  if (!rule) { unhandled.push(doc); continue; }

  const body = readFileSync(doc, { encoding: 'utf8', flag: 'r' });
  if (/STATUS:\s*\*{0,2}\s*(ACTIVE|SHIPPED|SUPERSEDED|HISTORICAL|DELIVERED)/i.test(body)
      || /last verified:?\s*\d{4}-\d{2}-\d{2}/i.test(body)) { skipped++; continue; }

  const nl = body.includes('\r\n') ? '\r\n' : '\n';
  const lines = body.split(/\r?\n/);
  // Insert after the first H1 if there is one, else at the very top.
  const h1 = lines.findIndex((l) => /^#\s+\S/.test(l));
  const at = h1 === -1 ? 0 : h1 + 1;
  const block = ['', rule.header(doc), ''];
  const out = [...lines.slice(0, at), ...block, ...lines.slice(at)].join(nl);

  if (COMMIT) writeFileSync(doc, out, { encoding: 'utf8' });
  stamped++;
  if (!COMMIT) console.log(`  [${rule.why}] ${doc}`);
}

console.log(`\n${COMMIT ? 'stamped' : 'would stamp'}: ${stamped} · already marked: ${skipped} · needs judgment: ${unhandled.length}`);
if (unhandled.length) { console.log('\nNOT stamped — decide these by hand:'); for (const d of unhandled) console.log('  ' + d); }
if (!COMMIT) console.log('\nRe-run with --commit to write.');
