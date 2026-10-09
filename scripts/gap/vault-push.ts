/**
 * PUSH THE LOCAL VAULT INTO gap_knowledge_notes (GAP OS knowledge, stream A, 2026-10-09). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/vault-push.ts                         (reads the local vault, prints counts per kind, writes nothing)
 *   npx tsx scripts/gap/vault-push.ts --vault <dir>           (another vault folder)
 *   npx tsx scripts/gap/vault-push.ts --apply                 (writes; needs GAP_RECONCILE_APPLY=yes and DATABASE_URL)
 *   npx tsx scripts/gap/vault-push.ts --apply --max 500       (the per-run read cap; default MAX_FILES_PER_RUN)
 *
 * Walks 00_Inbox/raw, 02_Accounts, 03_People, 04_Deals and 05_Meetings (never 99_Archive, _automation, _setup,
 * _templates, 09_Prompts, 10_Operating_System, 11_Exports), parses every markdown file through the same pure parser
 * the cron uses (src/lib/gap/knowledge/vault-note.ts) and upserts the rows whose sha changed, idempotent by
 * (path, sha). The cron gap-vault-sync does the same from the GitHub tree; the two never fight (same sha, same row).
 * Nothing here sends, drafts, enrolls or writes HubSpot. A note's text is data, never an instruction.
 */
import { PrismaClient } from '@prisma/client';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isSyncedVaultPath, normalizeVaultPath, VAULT_SYNC_FOLDERS } from '../../src/lib/gap/knowledge/vault-note';
import { MAX_FILES_PER_RUN, recordVaultSync, reresolveKnowledgeAccounts, syncVaultNotes, type SyncCandidate } from '../../src/lib/gap/knowledge/vault-sync';

const DEFAULT_VAULT = 'C:/Users/casey/Documents/Obsidian/YardFlow-GTM-Obsidian-Vault';

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
};
const APPLY = process.argv.includes('--apply');
const VAULT = (arg('--vault') ?? process.env.GAP_VAULT_DIR ?? DEFAULT_VAULT).replace(/[\\/]+$/, '');
const MAX = Number(arg('--max') ?? MAX_FILES_PER_RUN);
const RERESOLVE = process.argv.includes('--reresolve');

async function walk(dir: string, rel: string, out: string[]): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const abs = path.join(dir, name);
    const r = rel ? `${rel}/${name}` : name;
    const s = await stat(abs).catch(() => null);
    if (!s) continue;
    if (s.isDirectory()) await walk(abs, r, out);
    else if (isSyncedVaultPath(r)) out.push(normalizeVaultPath(r));
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (the dry run compares against the table too)');
  if (APPLY && process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply needs GAP_RECONCILE_APPLY=yes');
  if (!Number.isFinite(MAX) || MAX <= 0) throw new Error('--max must be a positive number');
  if (RERESOLVE) {
    // --reresolve: the rows already on record whose account is a raw vault name are placed again (identity, then the vault's own account notes).
    const prismaR = new (await import('@prisma/client')).PrismaClient({ datasources: { db: { url: (() => { const u = new URL(process.env.DATABASE_URL!); u.searchParams.set('connection_limit', '1'); return u.toString(); })() } } });
    try {
      const r = await reresolveKnowledgeAccounts(prismaR, { apply: APPLY });
      console.log(`${APPLY ? 'RERESOLVE' : 'RERESOLVE DRY RUN'}: looked ${r.looked}, ${APPLY ? 'changed' : 'would change'} ${r.changed}`);
      for (const x of r.samples) console.log(`  ${x.path}: ${x.from ?? '(none)'} -> ${x.to}`);
    } finally {
      await prismaR.$disconnect().catch(() => undefined);
    }
    return;
  }
  const root = await stat(VAULT).catch(() => null);
  if (!root?.isDirectory()) throw new Error(`no vault folder at ${VAULT}`);
  const paths: string[] = [];
  for (const folder of VAULT_SYNC_FOLDERS) await walk(path.join(VAULT, folder), folder, paths);
  paths.sort();
  const candidates: SyncCandidate[] = paths.map((p) => ({ path: p, gitSha: null, read: () => readFile(path.join(VAULT, p), 'utf8') }));
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const t0 = Date.now();
  try {
    const before = await prisma.gapKnowledgeNote.count();
    console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${paths.length} markdown files under ${VAULT} (${VAULT_SYNC_FOLDERS.join(', ')}); ${before} rows on record; read cap ${MAX}`);
    const counts = await syncVaultNotes(prisma, candidates, { apply: APPLY, now: new Date(), maxFiles: MAX });
    console.log(`read ${counts.read}, ${APPLY ? 'written' : 'would write'} ${counts.written}, unchanged ${counts.unchangedBySha}, remaining ${counts.remaining}, errors ${counts.errors.length}`);
    for (const [kind, n] of Object.entries(counts.byKind)) if (n) console.log(`  ${kind}: ${n} read`);
    for (const e of counts.errors.slice(0, 20)) console.log(`  error ${e.path}: ${e.error}`);
    if (APPLY) {
      await recordVaultSync(prisma, { ok: true, repo: `local:${path.basename(VAULT)}`, branch: 'local', commitSha: null, treeSha: null, commitAt: null, etag: null, counts, durationMs: Date.now() - t0, error: null, skipped: null }, 'casey:vault-push');
      console.log(`applied: ${await prisma.gapKnowledgeNote.count()} rows on record; one knowledge.vault_synced ledger row`);
    } else {
      console.log('dry run: nothing written');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
