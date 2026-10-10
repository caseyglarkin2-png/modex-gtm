/**
 * THE DRIVE SYNC BY HAND (the Google Workspace and Gemini extension, 2026-10-10). DRY RUN by default.
 *
 *   npx tsx scripts/gap/sync-drive.ts [--folders "Meet Recordings,Yard Audits"] [--limit 25] [--days 120] [--apply]
 *
 * Reads the agreed Drive folders with the credential the environment names (GAP_DRIVE_REFRESH_TOKEN with
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or GAP_DRIVE_DWD_SA_JSON with GAP_DRIVE_USER_EMAIL), lists what one run
 * would import with each file's parse summary (readable, unreadable with the reason, skipped with the reason), and
 * writes NOTHING. With `--apply` it requires GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST equal to the DATABASE_URL
 * host (the guard of scripts/gap/import-intelligence-batch.ts), then runs the same sync the cron runs (the records,
 * the ledger row, the cursor). Not configured is said with the variable names. No credential is printed.
 */
import { PrismaClient } from '@prisma/client';
import { DRIVE_CREDENTIAL_VARS, createDriveClient, driveConfigFromEnv, driveFoldersFromEnv, driveMaxBytes } from '../../src/lib/gap/signals/drive-client';
import { DRIVE_FILES_PER_RUN, DRIVE_FIRST_RUN_DAYS_DEFAULT, runDriveSync } from '../../src/lib/gap/signals/drive-sync';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const APPLY = process.argv.includes('--apply');
const folders = arg('--folders')?.split(',').map((s) => s.trim()).filter(Boolean) ?? driveFoldersFromEnv();
const limit = Number(arg('--limit') ?? DRIVE_FILES_PER_RUN);
const days = Number(arg('--days') ?? process.env.GAP_DRIVE_FIRST_RUN_DAYS ?? DRIVE_FIRST_RUN_DAYS_DEFAULT);

async function main() {
  const config = driveConfigFromEnv();
  if (!config) { console.log(`not configured: set ${DRIVE_CREDENTIAL_VARS}; nothing read, nothing written`); return; }
  console.log(`credential: ${config.kind === 'delegated' ? `delegation as ${config.userEmail}` : 'refresh token'} (value not shown); folders: ${folders.join(', ')}; limit ${limit}; first run ${days} days`);
  const client = createDriveClient(config);
  if (!APPLY) {
    const r = await runDriveSync(null, { now: new Date(), client, folders, limit, firstRunDays: days, maxBytes: driveMaxBytes(), dryRun: true, state: { folders: {} }, actor: 'script:sync-drive' });
    if (!r.ok) { console.log(`${r.status}: ${'detail' in r ? r.detail : r.error}`); return; }
    console.log(`dry run against Drive (the ledger not read: the cursor is the first-run window): ${r.listed} listed, ${r.readable.length} readable (${r.records} records would be imported), ${r.unreadable.length} unreadable, ${r.skipped.length} skipped${r.foldersMissing.length ? `; folders not found: ${r.foldersMissing.join(', ')}` : ''}${r.more ? '; more than one page' : ''}`);
    for (const f of r.readable) console.log(`  readable   ${f.folder} / ${f.name} (${f.mimeType}, modified ${f.modifiedTime})`);
    for (const f of r.unreadable) console.log(`  unreadable ${f.folder} / ${f.name}: ${f.reason}`);
    for (const f of r.skipped) console.log(`  skipped    ${f.folder} / ${f.name}: ${f.reason}`);
    for (const rec of r.plan ?? []) console.log(`  record     ${rec.producer} ${rec.producerItemId} "${rec.title}" event ${rec.eventDate ?? 'none'} modified ${rec.reportedOn} account hint ${rec.accountHint ?? 'none'} group ${rec.evidenceGroup ?? 'none'} (${rec.text.length} chars)`);
    console.log('dry run: nothing written (pass --apply with GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST to import)');
    return;
  }
  if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('refusing to apply: GAP_RECONCILE_APPLY is not "yes"');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!process.env.GAP_RECONCILE_HOST || process.env.GAP_RECONCILE_HOST !== host) throw new Error('refusing to apply: GAP_RECONCILE_HOST does not name the database host');
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set('connection_limit', '2');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const r = await runDriveSync(prisma, { now: new Date(), client, folders, limit, firstRunDays: days, maxBytes: driveMaxBytes(), actor: 'script:sync-drive' });
    if (!r.ok) { console.log(`${r.status}: ${'detail' in r ? r.detail : r.error} (ledger ${r.ledgerId ?? 'none'})`); return; }
    console.log(`applied: ${r.listed} listed, ${r.readable.length} readable, ${r.imported.accepted} accepted, ${r.imported.duplicates} duplicates, ${r.imported.revised} revised, ${r.imported.invalid} invalid, ${r.unreadable.length} unreadable, ${r.skipped.length} skipped, ${r.removed.length} removed; ledger ${r.ledgerId ?? 'none'}${r.more ? '; more waits for the next run' : ''}`);
    for (const f of r.unreadable) console.log(`  unreadable ${f.folder} / ${f.name}: ${f.reason}`);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
