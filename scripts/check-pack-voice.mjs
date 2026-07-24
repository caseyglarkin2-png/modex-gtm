#!/usr/bin/env node
/**
 * B.T10 — Voice CI check.
 *
 * Scans every pack in public/demo-packs/*.json for voice violations
 * in the editorial fields:
 *   - account.dossierIntro
 *   - account.surprisingFindings[]
 *   - account.coverageNote.note
 *
 * ALSO scans the exported narrative/body strings in the per-account
 * microsite source (src/lib/microsites/accounts/*.ts) for the retired
 * "throughput" doctrine, so the pack gate matches src/lib/ai/voice-guardrails.ts
 * (POST_PIVOT_BANNED). The account files carry the /for memo prose (hypothesis,
 * caveat, framingNarrative, heroOverride, etc.) that never becomes a JSON pack,
 * so a banned word there would ship unguarded otherwise.
 *
 * Violations (fail-the-build):
 *   - em dash (—) or en dash (–) — Casey's voice rule
 *   - the word "throughput" (retired pre-pivot metric; say "production capacity" or "volume")
 *   - banned filler ("just", "simply", "in order to",
 *     "best in class", "leading", "industry-standard",
 *     "world-class")
 *   - per-string char-length cap
 *
 * Exits non-zero with a report on any violation. Wire as a prebuild
 * step or a separate `npm run check:voice` script.
 *
 * Usage:
 *   node scripts/check-pack-voice.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const PACK_DIR = path.join(process.cwd(), 'public', 'demo-packs');
const ACCOUNT_DIR = path.join(process.cwd(), 'src', 'lib', 'microsites', 'accounts');

// The hard metric ban, mirrored from src/lib/ai/voice-guardrails.ts POST_PIVOT_BANNED.
// Applied to BOTH the JSON packs and the account narrative source.
const THROUGHPUT = /\bthroughput/i;

const BANNED_FILLERS = [
  /\bjust\b/i,
  /\bsimply\b/i,
  /\bin order to\b/i,
  /\bbest in class\b/i,
  /\bleading\b/i,
  /\bindustry[\s-]standard\b/i,
  /\bworld[\s-]class\b/i,
  /\bcutting[\s-]edge\b/i,
  THROUGHPUT,
];

const CAPS = {
  dossierIntro: 800,
  surprisingFinding: 160,
  coverageNote: 600,
};

function checkString(label, text) {
  const errs = [];
  if (typeof text !== 'string') return errs;
  if (/[—–]/.test(text)) errs.push(`${label}: contains em or en dash`);
  for (const f of BANNED_FILLERS) {
    if (f.test(text)) errs.push(`${label}: contains banned filler matching ${f}`);
  }
  return errs;
}

let total = 0;
let violations = [];
for (const file of fs.readdirSync(PACK_DIR).filter((f) => f.endsWith('.json'))) {
  total++;
  const pack = JSON.parse(fs.readFileSync(path.join(PACK_DIR, file), 'utf8'));
  const slug = pack.account?.slug ?? file.replace(/\.json$/, '');

  const intro = pack.account?.dossierIntro;
  if (intro) {
    if (intro.length > CAPS.dossierIntro) {
      violations.push(`${slug}: dossierIntro too long (${intro.length} > ${CAPS.dossierIntro})`);
    }
    violations.push(...checkString(`${slug}.dossierIntro`, intro));
  }

  const findings = pack.account?.surprisingFindings;
  if (Array.isArray(findings)) {
    findings.forEach((f, i) => {
      if (typeof f === 'string') {
        if (f.length > CAPS.surprisingFinding) {
          violations.push(`${slug}: finding[${i}] too long (${f.length} > ${CAPS.surprisingFinding})`);
        }
        violations.push(...checkString(`${slug}.findings[${i}]`, f));
      }
    });
  }

  const coverageNote = pack.account?.coverageNote?.note;
  if (coverageNote) {
    if (coverageNote.length > CAPS.coverageNote) {
      violations.push(`${slug}: coverageNote.note too long (${coverageNote.length} > ${CAPS.coverageNote})`);
    }
    // Only check em-dash + throughput on coverageNote (not the softer filler —
    // coverageNote sometimes legitimately uses "leading" in industry context).
    if (/[—–]/.test(coverageNote)) violations.push(`${slug}.coverageNote: contains em or en dash`);
    if (THROUGHPUT.test(coverageNote)) violations.push(`${slug}.coverageNote: contains banned word "throughput"`);
  }
}

// Account narrative source scan. These .ts modules hold the /for memo prose that
// never becomes a JSON pack. We only enforce the hard "throughput" ban here (not
// the dash/filler rules, which false-positive on code, date ranges, and comments)
// so the gate matches voice-guardrails.ts without churning unrelated prose.
let accountFiles = 0;
if (fs.existsSync(ACCOUNT_DIR)) {
  for (const file of fs.readdirSync(ACCOUNT_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'schema.ts')) {
    accountFiles++;
    const src = fs.readFileSync(path.join(ACCOUNT_DIR, file), 'utf8');
    if (!THROUGHPUT.test(src)) continue;
    const lines = src.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (THROUGHPUT.test(line)) {
        violations.push(`accounts/${file}:${i + 1}: contains banned word "throughput" (say "production capacity" or "volume")`);
      }
    });
  }
}

console.log(`Scanned ${total} packs + ${accountFiles} account narrative files.`);
if (violations.length === 0) {
  console.log('VOICE CI PASSED.');
  process.exit(0);
}
console.error('VOICE CI FAILED:');
for (const v of violations) console.error(`  ${v}`);
process.exit(1);