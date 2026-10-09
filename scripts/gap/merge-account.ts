/**
 * MERGE ONE ACCOUNT INTO ANOTHER (seller acceptance follow-up, 2026-10-09). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/merge-account.ts --from "Kenco Logistics Services" --into "Kenco"            (prints the plan)
 *   npx tsx scripts/gap/merge-account.ts --from ... --into ... --apply   (needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<db host>)
 *
 * What it does, in one transaction: every row that names the FROM account by `account_name` (personas, signals,
 * activity, routing decisions, research runs, waves, engagement, logs, briefs, notifications, QR assets, generated
 * content) is re-pointed at INTO; the FROM account's canonical link and the open conflicts of both are dropped (the
 * canonical sync rebuilds them for INTO); the FROM account row is deleted; then, outside the transaction, the FROM name
 * is registered as a manual alias of INTO through confirmAlias (with the evidence) so the old name keeps resolving, the
 * canonical records of INTO are re-synced, and one `account.merged` ledger row records the move. The ledger's own
 * history (gap_audit_events whose subject is the FROM name) is never rewritten. No HubSpot write.
 */
import { PrismaClient } from '@prisma/client';

const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null; };
const FROM = arg('--from');
const INTO = arg('--into');
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['canonicalAccountLink', 'canonicalConflict', 'gapAccountAlias', 'account']);

async function main() {
  if (!FROM || !INTO || FROM === INTO) throw new Error('--from and --into (different) are required');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const url = new URL(process.env.DATABASE_URL);
  if (APPLY) {
    if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply needs GAP_RECONCILE_APPLY=yes');
    if (!process.env.GAP_RECONCILE_HOST || url.hostname !== process.env.GAP_RECONCILE_HOST) throw new Error('--apply needs GAP_RECONCILE_HOST equal to the database host');
  }
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const models = prisma as unknown as Record<string, { count?: (a: unknown) => Promise<number>; updateMany?: (a: unknown) => Promise<{ count: number }>; fields?: Record<string, unknown> }>;
  try {
    const from = await prisma.account.findUnique({ where: { name: FROM } });
    const into = await prisma.account.findUnique({ where: { name: INTO }, select: { id: true, name: true } });
    if (!from) throw new Error(`no account named ${FROM}`);
    if (!into) throw new Error(`no account named ${INTO}`);
    const plan: Array<{ model: string; rows: number }> = [];
    for (const m of Object.keys(models)) {
      if (m.startsWith('$') || m.startsWith('_') || SKIP.has(m)) continue;
      const model = models[m];
      if (!model || typeof model.count !== 'function' || typeof model.updateMany !== 'function') continue;
      const fields = Object.keys(model.fields ?? {});
      if (!fields.includes('account_name')) continue;
      const n = await model.count({ where: { account_name: FROM } });
      if (n) plan.push({ model: m, rows: n });
    }
    const links = await prisma.canonicalAccountLink.count({ where: { account_name: FROM } });
    const conflicts = await prisma.canonicalConflict.count({ where: { account_name: { in: [FROM, INTO] } } });
    console.log(`PLAN: merge "${FROM}" (id ${from.id}) into "${INTO}" (id ${into.id})`);
    for (const p of plan) console.log(`  re-point ${p.model}.account_name: ${p.rows} row(s)`);
    console.log(`  drop canonical links of ${FROM}: ${links}; drop open conflicts of both: ${conflicts}; delete the account row ${from.id}; alias "${FROM}" -> "${INTO}"; re-sync canonical records of ${INTO}; one account.merged ledger row`);
    if (!APPLY) { console.log('dry run: nothing written'); return; }
    const moved: Record<string, number> = {};
    await prisma.$transaction(async (tx) => {
      const t = tx as unknown as typeof models;
      for (const p of plan) {
        const r = await t[p.model].updateMany!({ where: { account_name: FROM }, data: { account_name: INTO } });
        moved[p.model] = r.count;
      }
      await tx.canonicalAccountLink.deleteMany({ where: { account_name: FROM } });
      await tx.canonicalConflict.deleteMany({ where: { account_name: { in: [FROM, INTO] } } });
      await tx.account.delete({ where: { id: from.id } });
    }, { maxWait: 10_000, timeout: 60_000 });
    console.log('moved:', JSON.stringify(moved));
    const { confirmAlias } = await import('../../src/lib/gap/people/alias-review');
    const alias = await confirmAlias(prisma, { accountName: INTO, alias: FROM, actor: 'casey:merge-account', now: new Date(), evidence: [`Casey, 2026-10-09: "merge into Kenco". One family (parent brand ${from.parent_brand ?? 'none'}), one open deal, open duplicate_company conflicts since 2026-05-05; the ${FROM} rows were re-pointed at ${INTO} by scripts/gap/merge-account.ts.`] });
    console.log('alias:', JSON.stringify(alias));
    const { syncCanonicalRecords } = await import('../../src/lib/revops/canonical-sync');
    const sync = await syncCanonicalRecords({ accountNames: [INTO] } as never).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
    console.log('canonical sync:', JSON.stringify(sync).slice(0, 400));
    await prisma.gapAuditEvent.create({ data: { kind: 'account.merged', actor: 'casey:merge-account', subject_type: 'account', subject_id: INTO, payload: { from: FROM, fromId: from.id, into: INTO, moved, droppedLinks: links, droppedConflicts: conflicts, alias: alias.ok ? alias.status : alias.reason, at: new Date().toISOString(), authorizedBy: 'Casey, 2026-10-09 ("merge into Kenco")' } } });
    console.log('applied');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
