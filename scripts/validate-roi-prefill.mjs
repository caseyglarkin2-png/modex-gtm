#!/usr/bin/env node
/**
 * ROI-prefill contract gate.
 *
 * The /demo -> /roi hand-off works by writing localStorage['roi-v2-state'] before
 * navigating to yardflow.ai/roi, where the V2 calculator reads it on mount. If the
 * shape the demo writes (src/components/demo/roi-cta-button.tsx) drifts from the
 * shape the Flow-State- calculator reads, the prefill breaks SILENTLY: the prospect
 * just sees the calculator defaults instead of their audited network.
 *
 * This gate freezes that shared shape against scripts/roi-prefill-contract.json (a
 * mirror of the Flow-State- reader, roiCalcTypes.ts RoiAsks + ArchetypeAssumptions
 * + CsvRoiArchetypeId). It fails validate:packs (exits non-zero) on any drift:
 * a renamed/added/dropped ask, archetype id, or assumption key, or a changed
 * storage key. scripts/inspect-roi-state.mjs stays the monthly live-side detector.
 *
 * Run: node scripts/validate-roi-prefill.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTRACT = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'roi-prefill-contract.json'), 'utf8'));
const WRITER = path.join(ROOT, 'src', 'components', 'demo', 'roi-cta-button.tsx');
const src = readFileSync(WRITER, 'utf8');

const failures = [];

/** Pull the body of the first `<label> {  ... }` block by brace matching. */
function blockBody(text, header) {
  const start = text.indexOf(header);
  if (start === -1) return null;
  let depth = 0;
  let open = -1;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') {
      if (depth === 0) open = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return null;
}

/** Field names `name:` at the top level of a TS interface/object body. */
function topLevelKeys(body) {
  if (!body) return [];
  const keys = [];
  let depth = 0;
  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    // Track nesting so we only read keys at depth 0 of this body.
    const before = depth;
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (before !== 0) continue;
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
    if (m) keys.push(m[1]);
  }
  return keys;
}

function compare(label, expected, actual) {
  const exp = [...expected].sort();
  const act = [...new Set(actual)].sort();
  const missing = exp.filter((k) => !act.includes(k));
  const extra = act.filter((k) => !exp.includes(k));
  if (missing.length || extra.length) {
    failures.push(`${label}: missing [${missing.join(', ')}] extra [${extra.join(', ')}]`);
  }
}

// 1. Storage key.
const keyMatch = src.match(/ROI_STATE_KEY\s*=\s*['"]([^'"]+)['"]/);
if (!keyMatch) failures.push('could not find ROI_STATE_KEY in the writer');
else if (keyMatch[1] !== CONTRACT.storageKey) {
  failures.push(`storageKey: writer='${keyMatch[1]}' contract='${CONTRACT.storageKey}'`);
}

// 2. asks keys (from the RoiV2State interface `asks: { ... }` block).
const asksBody = blockBody(src, 'asks: {');
compare('asks', CONTRACT.asks, topLevelKeys(asksBody));

// 3. assumption keys (from the ArchetypeAssumptions interface).
const assumptionBody = blockBody(src, 'interface ArchetypeAssumptions');
compare('assumptionKeys', CONTRACT.assumptionKeys, topLevelKeys(assumptionBody));

// 4. archetype ids (from the RoiV2State `assumptions: { ... }` interface block).
const archetypeBody = blockBody(src, 'assumptions: {');
compare('archetypeIds', CONTRACT.archetypeIds, topLevelKeys(archetypeBody));

if (failures.length) {
  console.error('ROI-prefill contract DRIFT (scripts/roi-prefill-contract.json vs roi-cta-button.tsx):');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('\nThe demo -> /roi prefill would break silently. Re-sync the writer and the');
  console.error('contract with the Flow-State- calculator (roiCalcTypes.ts) together.');
  process.exit(1);
}

console.log('ROI-prefill contract OK: asks + archetypes + assumptions match roi-cta-button.tsx.');