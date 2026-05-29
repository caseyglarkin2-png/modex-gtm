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
 * Violations (fail-the-build):
 *   - em dash (—) or en dash (–) — Casey's voice rule
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

const BANNED_FILLERS = [
  /\bjust\b/i,
  /\bsimply\b/i,
  /\bin order to\b/i,
  /\bbest in class\b/i,
  /\bleading\b/i,
  /\bindustry[\s-]standard\b/i,
  /\bworld[\s-]class\b/i,
  /\bcutting[\s-]edge\b/i,
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
    // Only check em-dash on coverageNote (not filler — coverageNote
    // sometimes legitimately uses "leading" in industry context).
    if (/[—–]/.test(coverageNote)) violations.push(`${slug}.coverageNote: contains em or en dash`);
  }
}

console.log(`Scanned ${total} packs.`);
if (violations.length === 0) {
  console.log('VOICE CI PASSED.');
  process.exit(0);
}
console.error('VOICE CI FAILED:');
for (const v of violations) console.error(`  ${v}`);
process.exit(1);
