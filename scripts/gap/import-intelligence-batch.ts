/**
 * THE LOCAL BATCH IMPORT (intelligence wiring, IW02/IW04, 2026-10-09). DRY RUN by default.
 *
 *   npx tsx scripts/gap/import-intelligence-batch.ts <batch.json> [--producer <id>] [--apply]
 *
 * Takes an import batch (`{ records: IntelligenceRecordInput[] }`, as scripts/gap/export-intelligence-snapshots.ts
 * writes it, or as a producer's own export writes it) and imports it through `importIntelligenceBatch` into the
 * database the environment names. Without `--apply` it validates every record, reports the counts and the first
 * refusals, and writes NOTHING. With `--apply` it requires GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST equal to the
 * DATABASE_URL host (the same guard as scripts/gap/reconcile-october9.ts), then writes the rows and one
 * intelligence.imported ledger row per producer. No fetch, no research, no Slack, no HubSpot, no outbound.
 */
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { importIntelligenceBatch } from '../../src/lib/gap/signals/intelligence-import';
import { validateIntelligenceRecord } from '../../src/lib/gap/signals/intelligence-record';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const file = process.argv[2];
if (!file || file.startsWith('--')) { console.error('usage: import-intelligence-batch.ts <batch.json> [--producer <id>] [--apply]'); process.exit(2); }
const APPLY = process.argv.includes('--apply');
const PRODUCER = arg('--producer');

async function main() {
  const batch = JSON.parse(readFileSync(file, 'utf8')) as { records?: unknown[]; capturedOn?: string; exportedAt?: string };
  const records = Array.isArray(batch.records) ? batch.records : [];
  const checks = records.map((r, index) => ({ index, v: validateIntelligenceRecord(r) }));
  const invalid = checks.filter((c) => !c.v.ok);
  const byProducer = new Map<string, number>();
  for (const c of checks) if (c.v.ok) byProducer.set(c.v.record.producer, (byProducer.get(c.v.record.producer) ?? 0) + 1);
  console.log(`${records.length} records in ${file}${batch.exportedAt ? ` (exported ${batch.exportedAt})` : ''}: ${records.length - invalid.length} valid, ${invalid.length} invalid; by producer: ${[...byProducer.entries()].map(([p, n]) => `${p} ${n}`).join(', ') || 'none'}`);
  for (const c of invalid.slice(0, 10)) console.log(`  invalid #${c.index}: ${(c.v as { reason: string }).reason}`);
  if (!APPLY) { console.log('dry run: nothing written (pass --apply with GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST to import)'); return; }
  if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('refusing to apply: GAP_RECONCILE_APPLY is not "yes"');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!process.env.GAP_RECONCILE_HOST || process.env.GAP_RECONCILE_HOST !== host) throw new Error('refusing to apply: GAP_RECONCILE_HOST does not name the database host');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const r = await importIntelligenceBatch(prisma, { records, actor: 'script:import-intelligence-batch', now: new Date(), producer: PRODUCER });
    console.log(`applied: ${r.accepted} accepted, ${r.duplicates} duplicates, ${r.revised} revised, ${r.invalid} invalid; ledger rows: ${r.runs.map((x) => `${x.producer} (${x.ledgerId ?? 'none'})`).join(', ')}`);
    for (const it of r.items.filter((i) => i.outcome === 'invalid').slice(0, 10)) console.log(`  invalid #${it.index} ${it.producerItemId ?? '?'}: ${it.reason}`);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
