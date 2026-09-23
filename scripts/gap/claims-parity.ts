/**
 * GAP Prospecting OS: claims parity between the committed snapshot and the
 * lane's two registry surfaces.
 *
 *   npx tsx scripts/gap/claims-parity.ts --lane C:\Users\casey\yardflow-hubspot\top100
 *
 * Reads the lane's data/claims_registry.json and CLAIMS.md, extracts every
 * CR-/INF-/GAP- id from each, and compares three id sets: the snapshot at
 * src/lib/gap/claims/registry.snapshot.json, the lane JSON, and CLAIMS.md.
 *
 * Exit rule:
 *   ERROR   (exit 1)  the snapshot lacks an id that CLAIMS.md or the lane JSON
 *                     has, or the snapshot has an id CLAIMS.md lacks. The
 *                     snapshot is the compiler's single source, so a gap here
 *                     means copy can be compiled against a stale registry.
 *   WARNING (exit 0)  the lane JSON lacks an id the snapshot and CLAIMS.md
 *                     have (the lane's own drift: CR-034..CR-040 as of
 *                     2026-09-23), the lane JSON has an id CLAIMS.md lacks, or
 *                     a shared row's claim_text differs between the snapshot
 *                     and the lane JSON.
 *
 * Spec: docs/GAP_PROSPECTING_OS.md section 8 (C13) and ticket S3-T1.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadClaims } from '../../src/lib/gap/claims/validate-claims';

export const CLAIM_ID_RE = /\b(?:CR|INF|GAP)-\d{3}\b/g;

export interface ParitySets {
  snapshot: readonly string[];
  laneJson: readonly string[];
  claimsMd: readonly string[];
}

export interface ParityRow {
  id: string;
  inSnapshot: boolean;
  inLaneJson: boolean;
  inClaimsMd: boolean;
  level: 'ERROR' | 'WARNING';
  note: string;
}

export interface ParityResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: ParityRow[];
  counts: { snapshot: number; laneJson: number; claimsMd: number };
}

/** Every distinct registry id in a text, in first-seen order. */
export function extractClaimIds(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(CLAIM_ID_RE)) seen.add(m[0]);
  return [...seen];
}

function sortIds(ids: Iterable<string>): string[] {
  const order = { CR: 0, INF: 1, GAP: 2 } as Record<string, number>;
  return [...ids].sort((a, b) => {
    const [pa, na] = a.split('-');
    const [pb, nb] = b.split('-');
    return (order[pa] ?? 9) - (order[pb] ?? 9) || Number(na) - Number(nb);
  });
}

/**
 * Pure comparison of the three id sets. `textDrift` optionally carries ids
 * whose claim_text differs between snapshot and lane JSON (a WARNING).
 */
export function checkParity(sets: ParitySets, textDrift: readonly string[] = []): ParityResult {
  const snap = new Set(sets.snapshot);
  const lane = new Set(sets.laneJson);
  const md = new Set(sets.claimsMd);
  const all = sortIds(new Set([...snap, ...lane, ...md]));
  const rows: ParityRow[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const id of all) {
    const inSnapshot = snap.has(id);
    const inLaneJson = lane.has(id);
    const inClaimsMd = md.has(id);
    if (inSnapshot && inLaneJson && inClaimsMd) continue;
    let level: ParityRow['level'];
    let note: string;
    if (!inSnapshot) {
      level = 'ERROR';
      note = `snapshot lacks ${id} (present in ${[inLaneJson && 'lane JSON', inClaimsMd && 'CLAIMS.md'].filter(Boolean).join(' and ')})`;
      errors.push(note);
    } else if (!inClaimsMd) {
      level = 'ERROR';
      note = `CLAIMS.md lacks ${id} (present in snapshot${inLaneJson ? ' and lane JSON' : ''})`;
      errors.push(note);
    } else {
      level = 'WARNING';
      note = `lane JSON lacks ${id} (present in snapshot and CLAIMS.md)`;
      warnings.push(note);
    }
    rows.push({ id, inSnapshot, inLaneJson, inClaimsMd, level, note });
  }

  for (const id of sortIds(textDrift)) {
    const note = `claim_text drift on ${id}: snapshot and lane JSON differ`;
    warnings.push(note);
    rows.push({ id, inSnapshot: true, inLaneJson: true, inClaimsMd: md.has(id), level: 'WARNING', note });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    rows,
    counts: { snapshot: snap.size, laneJson: lane.size, claimsMd: md.size },
  };
}

export function formatReport(result: ParityResult): string {
  const lines: string[] = [];
  const c = result.counts;
  lines.push(`ids: snapshot ${c.snapshot}, lane JSON ${c.laneJson}, CLAIMS.md ${c.claimsMd}`);
  if (result.rows.length === 0) {
    lines.push('in parity: every id is present in all three surfaces');
    return lines.join('\n');
  }
  const mark = (v: boolean) => (v ? 'yes' : 'no ');
  lines.push('');
  lines.push('id       snapshot  laneJSON  CLAIMS.md  level    note');
  for (const r of result.rows) {
    lines.push(
      `${r.id.padEnd(8)} ${mark(r.inSnapshot).padEnd(9)} ${mark(r.inLaneJson).padEnd(9)} ${mark(r.inClaimsMd).padEnd(10)} ${r.level.padEnd(8)} ${r.note}`,
    );
  }
  lines.push('');
  lines.push(`WARNINGS (${result.warnings.length}, informational, exit 0):`);
  for (const w of result.warnings) lines.push(`  - ${w}`);
  lines.push(`ERRORS (${result.errors.length}, exit 1):`);
  for (const e of result.errors) lines.push(`  - ${e}`);
  lines.push('');
  lines.push(result.ok ? 'in parity (snapshot covers every id; warnings are the lane\'s own drift)' : 'NOT in parity');
  return lines.join('\n');
}

interface LaneRow {
  claim_id: string;
  claim_text: string;
}

/** Read the lane and compare it with the committed snapshot. */
export function runParity(laneDir: string): ParityResult {
  const jsonPath = join(laneDir, 'data', 'claims_registry.json');
  const mdPath = join(laneDir, 'CLAIMS.md');
  for (const p of [jsonPath, mdPath]) {
    if (!existsSync(p)) throw new Error(`lane file missing: ${p}`);
  }
  const laneRows = JSON.parse(readFileSync(jsonPath, 'utf8')) as LaneRow[];
  if (!Array.isArray(laneRows)) throw new Error('lane JSON is not an array of rows');
  const claimsMd = readFileSync(mdPath, 'utf8');
  const snapshotRows = loadClaims();

  const snapText = new Map(snapshotRows.map((r) => [r.claim_id, r.claim_text]));
  const textDrift = laneRows
    .filter((r) => snapText.has(r.claim_id) && snapText.get(r.claim_id) !== r.claim_text)
    .map((r) => r.claim_id);

  return checkParity(
    {
      snapshot: snapshotRows.map((r) => r.claim_id),
      laneJson: laneRows.map((r) => r.claim_id),
      claimsMd: extractClaimIds(claimsMd),
    },
    textDrift,
  );
}

function parseArgs(argv: string[]): { lane: string } {
  const i = argv.indexOf('--lane');
  const lane = i >= 0 ? argv[i + 1] : process.env.GAP_TOP100_LANE;
  if (!lane) {
    throw new Error('usage: npx tsx scripts/gap/claims-parity.ts --lane <top100 dir>');
  }
  return { lane };
}

function main(): void {
  const { lane } = parseArgs(process.argv.slice(2));
  const result = runParity(lane);
  console.log(formatReport(result));
  process.exit(result.ok ? 0 : 1);
}

const invokedDirectly = /claims-parity\.ts$/.test((process.argv[1] ?? '').replace(/\\/g, '/'));
if (invokedDirectly) {
  try {
    main();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  }
}
