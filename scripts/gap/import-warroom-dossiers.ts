/**
 * THE WAR-ROOM DOSSIERS INTO GAP (the war-room adapter, 2026-10-09). Local; DRY RUN by default; read only on the war-room.
 *
 *   npx tsx scripts/gap/import-warroom-dossiers.ts [--dir C:\Users\casey\war-room\data\accounts] [--apply]
 *
 * Reads the war-room's dossier files from its git checkout (never a war-room route: the daily brief, refresh, social
 * and launch routes act; this reads files), maps each to one record (signals/warroom-export.ts: the why-now
 * paragraphs and findings as the passage, the sources by name, the file's last git change as the report date, the
 * intent score and views labelled context), and imports them through the shared contract. A changed dossier is a
 * revision; an unchanged one is a duplicate. `--apply` needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST (the
 * reconcile guard). Nothing here posts to Slack, writes HubSpot, drafts or sends.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { importIntelligenceBatch } from '../../src/lib/gap/signals/intelligence-import';
import { WAR_ROOM_PRODUCER, mapWarRoomDossier, type WarRoomDossier } from '../../src/lib/gap/signals/warroom-export';
import type { IntelligenceRecordInput } from '../../src/lib/gap/signals/intelligence-record';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const DIR = arg('--dir') ?? 'C:\\Users\\casey\\war-room\\data\\accounts';
const APPLY = process.argv.includes('--apply');

function gitDate(file: string): { changedOn: string; sha: string | null } {
  try {
    const out = execFileSync('git', ['-C', path.dirname(file), 'log', '-1', '--format=%H %cI', '--', path.basename(file)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const [sha, iso] = out.split(' ');
    if (iso && !Number.isNaN(Date.parse(iso))) return { changedOn: new Date(iso).toISOString().slice(0, 10), sha };
  } catch { /* not a git file */ }
  return { changedOn: new Date().toISOString().slice(0, 10), sha: null };
}

async function main() {
  const files = readdirSync(DIR).filter((n) => n.endsWith('.json') && !n.startsWith('_')).sort();
  const records: IntelligenceRecordInput[] = [];
  let skipped = 0;
  const runId = `war-room:${new Date().toISOString().slice(0, 10)}`;
  for (const name of files) {
    const file = path.join(DIR, name);
    let d: WarRoomDossier;
    try { d = JSON.parse(readFileSync(file, 'utf8')) as WarRoomDossier; } catch { skipped += 1; continue; }
    const { changedOn, sha } = gitDate(file);
    const r = mapWarRoomDossier(d, { changedOn, runId, commitSha: sha });
    if (r) records.push(r); else skipped += 1;
  }
  console.log(`${files.length} dossiers in ${DIR}: ${records.length} records, ${skipped} skipped (no why-now or findings)`);
  for (const r of records.slice(0, 5)) console.log(`  ${r.title} | reported ${r.reportedOn} | ${r.sources?.length ?? 0} sources | ${r.text.slice(0, 90).replace(/\n/g, ' ')}`);
  if (!APPLY) { console.log('dry run: nothing written'); return; }
  if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('refusing to apply: GAP_RECONCILE_APPLY is not "yes"');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!process.env.GAP_RECONCILE_HOST || process.env.GAP_RECONCILE_HOST !== host) throw new Error('refusing to apply: GAP_RECONCILE_HOST does not name the database host');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const r = await importIntelligenceBatch(prisma, { records, actor: 'script:import-warroom-dossiers', now: new Date(), producer: WAR_ROOM_PRODUCER, runId });
    console.log(`applied: ${r.accepted} accepted, ${r.duplicates} duplicates, ${r.revised} revised, ${r.invalid} invalid; ledger ${r.runs.map((x) => x.ledgerId ?? 'none').join(', ')}`);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
