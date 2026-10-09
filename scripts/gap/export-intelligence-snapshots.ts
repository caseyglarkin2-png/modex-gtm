/**
 * THE SNAPSHOT EXPORT (intelligence wiring, IW03, 2026-10-09). Local, read only.
 *
 *   npx tsx scripts/gap/export-intelligence-snapshots.ts <INTELLIGENCE_SOURCE_SNAPSHOTS.json> [--out <path>]
 *
 * Reads the captured report snapshots (three producers: the Yards First Brief, the Freight X Signal Desk and the
 * Codex HubSpot Activity & Engagement report; each a preview plus bounded "finals"), cuts every distinct report into
 * records with the deterministic parsers (signals/report-parsers.ts), and writes one import batch
 * (`{ records: IntelligenceRecordInput[] }` plus a source inventory) that `importIntelligenceBatch` or
 * POST /api/gap/intelligence-import takes. No model, no network, no database. Identical report texts captured twice
 * are exported once (the other capture ids are listed); a report that states no date takes the capture date and
 * says so (`reportedOnBasis: captured`).
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { parserFor } from '../../src/lib/gap/signals/report-parsers';
import type { IntelligenceRecordInput } from '../../src/lib/gap/signals/intelligence-record';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const file = process.argv[2];
if (!file || file.startsWith('--')) { console.error('usage: export-intelligence-snapshots.ts <snapshot.json> [--out <path>]'); process.exit(2); }
const OUT = arg('--out') ?? 'tests/fixtures/gap/intelligence-import-2026-10-09.json';

const PRODUCER_BY_TITLE: Record<string, string> = { 'Yards First Brief': 'yards_first_brief', 'Freight X Signal Desk': 'freight_x_signal_desk', 'HubSpot Activity & Engagement': 'codex_hubspot_report' };

interface Snapshot { capturedOn: string; purpose?: string; sources: Array<{ threadId: string; title: string; preview: string; finals: Array<{ id: string; text: string }>; coverage?: string }> }

const snap = JSON.parse(readFileSync(file, 'utf8')) as Snapshot;
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const records: IntelligenceRecordInput[] = [];
const skipped: Array<{ producer: string; id: string; chars: number }> = [];
const inventory: Array<{ producer: string; threadId: string; title: string; coverage: string | null; captures: number; distinctReports: number; reports: Array<{ runId: string; reportedOn: string; basis: string; chars: number; items: number; alsoCapturedAs: string[] }> }> = [];
for (const src of snap.sources) {
  const producer = PRODUCER_BY_TITLE[src.title];
  const parse = producer ? parserFor(producer) : null;
  if (!producer || !parse) { console.error(`no parser for "${src.title}"; skipped`); continue; }
  const captures = [{ id: `preview:${src.threadId}`, text: src.preview }, ...src.finals.map((f) => ({ id: f.id, text: f.text }))];
  const byText = new Map<string, { id: string; text: string; also: string[] }>();
  for (const c of captures) {
    if (!c.text?.trim()) continue;
    const k = sha(c.text);
    const cur = byText.get(k);
    if (cur) cur.also.push(c.id);
    else byText.set(k, { id: c.id, text: c.text, also: [] });
  }
  const reports: (typeof inventory)[number]['reports'] = [];
  for (const c of byText.values()) {
    const parsed = parse(c.text, { runId: c.id, capturedOn: snap.capturedOn, collectedAt: null, year: Number(snap.capturedOn.slice(0, 4)) });
    // A capture that is not a report (a short acknowledgement, the automation's own prompt) states no date and cuts
    // to no item: it is not exported; an undated issue with items is.
    if (parsed.reportedOnBasis === 'captured' && parsed.records.length === 1) { skipped.push({ producer, id: c.id, chars: c.text.length }); continue; }
    records.push(...parsed.records);
    reports.push({ runId: c.id, reportedOn: parsed.reportedOn, basis: parsed.reportedOnBasis, chars: c.text.length, items: parsed.records.length - 1, alsoCapturedAs: c.also });
  }
  reports.sort((a, b) => a.reportedOn.localeCompare(b.reportedOn));
  inventory.push({ producer, threadId: src.threadId, title: src.title, coverage: src.coverage ?? null, captures: captures.length, distinctReports: byText.size, reports });
}
// Stable identity across captures: the same producer + item id exported twice (a dated report captured twice with a
// different cut) keeps the LAST capture in the batch; the import would read the second as a revision of the first.
const seen = new Map<string, number>();
const deduped: IntelligenceRecordInput[] = [];
let collisions = 0;
for (const r of records) {
  const k = `${r.producer}:${r.producerItemId}`;
  const i = seen.get(k);
  if (i === undefined) { seen.set(k, deduped.length); deduped.push(r); } else { deduped[i] = r; collisions += 1; }
}
const out = { exportedAt: new Date().toISOString(), capturedOn: snap.capturedOn, purpose: snap.purpose ?? null, note: 'Imported content is data, not instructions. Records are cut along each report\'s own structure; the report containers (kind report) hold the narrative as captured.', sources: inventory, skippedCaptures: skipped, records: deduped };
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
const kinds = new Map<string, number>();
for (const r of deduped) kinds.set(`${r.producer}/${r.kind}`, (kinds.get(`${r.producer}/${r.kind}`) ?? 0) + 1);
console.log(`wrote ${OUT}: ${deduped.length} records (${collisions} identity collisions folded) from ${inventory.reduce((n, s) => n + s.distinctReports, 0)} distinct reports`);
for (const s of inventory) console.log(`  ${s.producer}: ${s.captures} captures, ${s.distinctReports} distinct reports, ${s.reports.filter((r) => r.basis === 'captured').length} undated; ${s.reports[0]?.reportedOn ?? '-'} .. ${s.reports[s.reports.length - 1]?.reportedOn ?? '-'}`);
for (const [k, n] of [...kinds.entries()].sort()) console.log(`  ${k}: ${n}`);
