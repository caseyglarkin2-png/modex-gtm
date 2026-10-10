/**
 * THE TWO PRODUCTION TEST ACCOUNTS (Casey, 2026-10-10: "Resolve the two production test accounts"). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/archive-test-accounts.ts              the inventory and the plan; nothing is written
 *   npx tsx scripts/gap/archive-test-accounts.ts --apply      park both accounts (needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<db host>)
 *   npx tsx scripts/gap/archive-test-accounts.ts --restore    reverse the park from its ledger rows (the same guards)
 *
 * "E2E Boston Beer Company" and "The E2E Boston Beer Company" were created on 2026-05-07T03:18:51Z by the account
 * command center proof seed (src/app/api/proof/account-command-center-seed/route.ts, fixture
 * src/lib/proof/account-command-center-fixture.ts), which deletes and recreates them and every row it seeds on each
 * run (tests/e2e/account-command-center-*.spec.ts call it; nothing else expects the rows in production).
 *
 * The dry run is the read-only inventory: both account rows; every table with an `account_name` naming them (the
 * models scanned from the Prisma datamodel, the list scripts/gap/merge-account.ts re-points, and more); the aliases and
 * parent brands naming them; every email-shaped column at the fixture domain (e2ebostonbeer.com) or the fixture's
 * malformed address; the gap_audit_events whose subject or payload names them; the canonical links and whatever else
 * shares their canonical companies (the real Boston Beer account must not); the HubSpot ids; and the activity verdict.
 *
 * Account has no archive field (no status, no archived_at; nothing in Work reads `pipeline_stage`). There is no
 * EXISTING reversible archive mechanism, so this script does not claim one: `--apply` PARKS the two rows by editing
 * existing columns (pipeline_stage, tier, priority_band, outreach_status) to fixture values and writes one
 * `account.archived` ledger row per account with every field it changed and its previous value and the full row as it
 * stood; `--restore` writes the previous values back (refusing a field that changed since) and one `account.restored`
 * row. Nothing is deleted, no related row is touched, nothing reaches HubSpot. Casey decides whether to run it
 * (docs/gap/E2E_ACCOUNTS_CLEANUP_2026-10-10.md).
 */
import { Prisma, PrismaClient } from '@prisma/client';

export const TEST_ACCOUNTS = ['E2E Boston Beer Company', 'The E2E Boston Beer Company'] as const;
export const FIXTURE_DOMAIN = 'e2ebostonbeer.com';
export const FIXTURE_MALFORMED = 'not-an-email';
/** The park: existing Account columns set to values no selector picks (Tier 1 / band A feed discovery and research). */
export const PARK: Record<string, string> = { pipeline_stage: 'archived_test_fixture', tier: 'Tier 3', priority_band: 'D', outreach_status: 'Archived (test fixture)' };
export const ARCHIVED = 'account.archived' as const;
export const RESTORED = 'account.restored' as const;
const ACTOR = 'casey:archive-test-accounts';
const AUTHORIZED = 'Casey, 2026-10-10: "If they are conclusively test-only and an existing reversible archive mechanism is available, I authorize archiving those two test accounts with a recovery record."';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** The fields to change and their previous values (pure): only a field whose value differs from the park. */
export function parkChanges(account: Row): Record<string, { from: unknown; to: string }> {
  const out: Record<string, { from: unknown; to: string }> = {};
  for (const [k, v] of Object.entries(PARK)) if (account[k] !== v) out[k] = { from: account[k] ?? null, to: v };
  return out;
}

/** The restore plan from the newest archived row (pure): each field back to `from`, refused where the value moved since. */
export function restorePlan(account: Row, changed: Record<string, { from: unknown; to: unknown }>): { data: Record<string, unknown>; refused: string[] } {
  const data: Record<string, unknown> = {};
  const refused: string[] = [];
  for (const [k, c] of Object.entries(changed)) {
    if (account[k] !== c.to) refused.push(`${k} is ${JSON.stringify(account[k])}, not the parked ${JSON.stringify(c.to)}`);
    else data[k] = c.from;
  }
  return { data, refused };
}

const arg = (name: string) => process.argv.includes(name);
const APPLY = arg('--apply');
const RESTORE = arg('--restore');
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const show = (r: Row, max = 360) => {
  const t = JSON.stringify(r, (_k, v) => (typeof v === 'string' && v.length > 120 ? `${v.slice(0, 117)}...` : typeof v === 'bigint' ? String(v) : v));
  return t.length > max ? `${t.slice(0, max - 3)}...` : t;
};

async function inventory(prisma: PrismaClient) {
  const db = prisma as unknown as Record<string, { findMany: (a: unknown) => Promise<Row[]>; count: (a: unknown) => Promise<number> }>;
  const names = [...TEST_ACCOUNTS];
  const models = Prisma.dmmf.datamodel.models;
  console.log('== 1. The account rows');
  const accounts = await prisma.account.findMany({ where: { name: { in: names } } });
  for (const a of accounts) console.log(`  ${show(a as Row, 2000)}`);
  console.log(`  ${accounts.length} of ${names.length} found`);

  console.log('\n== 2. Rows naming them by account_name (every model in the datamodel with the column)');
  const byModel: Record<string, number> = {};
  for (const m of models) {
    if (m.name === 'Account' || !m.fields.some((f) => f.name === 'account_name')) continue;
    const t = db[lower(m.name)];
    if (!t) continue;
    const rows = await t.findMany({ where: { account_name: { in: names } }, take: 50 });
    if (!rows.length) continue;
    byModel[m.name] = rows.length;
    const times = rows.flatMap((r) => [r.created_at, r.updated_at].filter(Boolean).map((d) => new Date(d).toISOString())).sort();
    console.log(`  ${m.name}: ${rows.length}${rows.length === 50 ? '+' : ''}${times.length ? ` (created or updated ${times[0]} .. ${times[times.length - 1]})` : ''}`);
    for (const r of rows) console.log(`    ${show(r)}`);
  }
  if (!Object.keys(byModel).length) console.log('  none');

  console.log('\n== 3. Aliases, parent brands, hints and candidates naming them');
  const like = { contains: 'e2e boston beer', mode: 'insensitive' as const };
  const aliasRows = await prisma.gapAccountAlias.findMany({ where: { OR: [{ alias: like }, { account_name: { in: names } }] } });
  for (const r of aliasRows) console.log(`  gap_account_aliases ${show(r as Row)}`);
  const parents = await prisma.account.findMany({ where: { parent_brand: { in: names } }, select: { id: true, name: true, parent_brand: true } });
  for (const r of parents) console.log(`  accounts.parent_brand ${show(r as Row)}`);
  const hinted = await prisma.gapSignal.findMany({ where: { account_hint: like }, select: { id: true, account_hint: true, title: true, created_at: true }, take: 20 });
  for (const r of hinted) console.log(`  gap_signals.account_hint ${show(r as Row)}`);
  const candidates = await prisma.gapAccountCandidate.findMany({ where: { OR: [{ company: like }, { account_name: { in: names } }, { domain: { contains: FIXTURE_DOMAIN, mode: 'insensitive' } }] }, take: 20 });
  for (const r of candidates) console.log(`  gap_account_candidates ${show(r as Row)}`);
  if (!aliasRows.length && !parents.length && !hinted.length && !candidates.length) console.log('  none');

  console.log(`\n== 4. Email-shaped columns at the fixture domain (${FIXTURE_DOMAIN}) or "${FIXTURE_MALFORMED}"`);
  let emailHits = 0;
  for (const m of models) {
    const t = db[lower(m.name)];
    if (!t) continue;
    for (const f of m.fields.filter((x) => x.kind === 'scalar' && x.type === 'String' && !x.isList && /email/i.test(x.name) && x.name !== 'email_status')) {
      const rows = await t.findMany({ where: { OR: [{ [f.name]: { endsWith: `@${FIXTURE_DOMAIN}`, mode: 'insensitive' } }, { [f.name]: FIXTURE_MALFORMED }] }, take: 20 });
      if (!rows.length) continue;
      emailHits += rows.length;
      console.log(`  ${m.name}.${f.name}: ${rows.length}`);
      for (const r of rows) console.log(`    ${show(r)}`);
    }
  }
  if (!emailHits) console.log('  none');

  console.log('\n== 5. gap_audit_events naming them (subject or payload)');
  const events: Row[] = await prisma.$queryRaw`SELECT id, kind, actor, subject_type, subject_id, created_at, left(payload::text, 200) AS payload FROM gap_audit_events WHERE subject_id IN (${TEST_ACCOUNTS[0]}, ${TEST_ACCOUNTS[1]}) OR subject_id ILIKE ${'%' + FIXTURE_DOMAIN + '%'} OR payload::text ILIKE '%e2e boston beer%' OR payload::text ILIKE ${'%' + FIXTURE_DOMAIN + '%'} ORDER BY created_at ASC LIMIT 100`;
  for (const e of events) console.log(`  ${show(e)}`);
  if (!events.length) console.log('  none');

  console.log('\n== 6. Canonical links, and whatever else shares their canonical companies');
  const links = await prisma.canonicalAccountLink.findMany({ where: { account_name: { in: names } } });
  const companyIds = [...new Set(links.map((l) => l.canonical_company_id).filter(Boolean))] as string[];
  const companies = await prisma.canonicalCompany.findMany({ where: { OR: [{ id: { in: companyIds } }, { primary_account_name: { in: names } }, { domain: { contains: FIXTURE_DOMAIN, mode: 'insensitive' } }] } });
  for (const c of companies) console.log(`  canonical_companies ${show(c as Row)}`);
  const allIds = [...new Set([...companyIds, ...companies.map((c) => c.id)])];
  const sharing = allIds.length ? await prisma.canonicalAccountLink.findMany({ where: { canonical_company_id: { in: allIds }, account_name: { notIn: names } } }) : [];
  for (const s of sharing) console.log(`  SHARED with another account: ${show(s as Row)}`);
  if (!sharing.length) console.log(`  ${links.length} link(s); ${allIds.length} canonical compan${allIds.length === 1 ? 'y' : 'ies'} found; no other account shares them`);
  const real = await prisma.account.findMany({ where: { name: { contains: 'boston beer', mode: 'insensitive' }, NOT: { name: { in: names } } }, select: { id: true, name: true, hubspot_company_id: true, tier: true, created_at: true } });
  for (const r of real) console.log(`  the real account (untouched): ${show(r as Row)}`);

  console.log('\n== 7. HubSpot ids');
  for (const a of accounts) console.log(`  ${a.name}: hubspot_company_id ${a.hubspot_company_id ?? 'none'}`);
  const contacts = await prisma.persona.findMany({ where: { account_name: { in: names } }, select: { id: true, name: true, email: true, hubspot_contact_id: true } });
  for (const p of contacts) console.log(`  persona ${p.id} ${p.name} <${p.email}>: hubspot_contact_id ${p.hubspot_contact_id ?? 'none'}`);
  for (const c of companies) console.log(`  canonical company ${c.id}: hubspot ${show({ hubspot_company_id: (c as Row).hubspot_company_id ?? null })}`);

  console.log('\n== 8. Activity verdict');
  const sends = await prisma.emailLog.findMany({ where: { OR: [{ account_name: { in: names } }, { to_email: { endsWith: `@${FIXTURE_DOMAIN}`, mode: 'insensitive' } }] }, select: { id: true, to_email: true, status: true, sent_at: true, created_at: true, provider_message_id: true, hubspot_engagement_id: true, thread_id: true } });
  console.log(`  email_logs: ${sends.length} ${sends.map((s) => show(s as Row, 240)).join(' | ')}`);
  const inbound = await prisma.inboundMessage.count({ where: { from_email: { endsWith: `@${FIXTURE_DOMAIN}`, mode: 'insensitive' } } });
  console.log(`  inbound messages from the fixture domain: ${inbound}`);
  const enroll = await prisma.sequenceEnrollment.count({ where: { OR: [{ account_name: { in: names } }, { to_email: { endsWith: `@${FIXTURE_DOMAIN}`, mode: 'insensitive' } }] } });
  console.log(`  sequence enrollments: ${enroll}`);
  const disp = await prisma.conversationDisposition.count({ where: { account_name: { in: names } } });
  console.log(`  conversation dispositions: ${disp}`);
  const jobs = await prisma.sendJob.findMany({ where: { recipients: { some: { account_name: { in: names } } } }, take: 5 });
  for (const j of jobs) console.log(`  send job ${show(j as Row, 300)}`);
  const hyps = await prisma.prospectingHypothesis.count({ where: { account_name: { in: names } } });
  const routes = await prisma.routingDecision.count({ where: { account_name: { in: names } } });
  console.log(`  GAP hypotheses: ${hyps}; routing decisions: ${routes}`);
  return { accounts: accounts as Row[], byModel, events, links, sharing, real };
}

async function main() {
  if (APPLY && RESTORE) throw new Error('--apply and --restore are exclusive');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const url = new URL(process.env.DATABASE_URL);
  if (APPLY || RESTORE) {
    if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply/--restore needs GAP_RECONCILE_APPLY=yes');
    if (!process.env.GAP_RECONCILE_HOST || url.hostname !== process.env.GAP_RECONCILE_HOST) throw new Error('--apply/--restore needs GAP_RECONCILE_HOST equal to the database host');
  }
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const inv = await inventory(prisma);
    const now = new Date();
    if (RESTORE) {
      console.log('\n== RESTORE');
      for (const name of TEST_ACCOUNTS) {
        const rows = await prisma.gapAuditEvent.findMany({ where: { kind: { in: [ARCHIVED, RESTORED] }, subject_type: 'account', subject_id: name }, orderBy: { created_at: 'desc' }, take: 1 });
        const head = rows[0];
        if (!head || head.kind !== ARCHIVED) { console.log(`  ${name}: no standing ${ARCHIVED} row; nothing to restore`); continue; }
        const changed = ((head.payload as Row)?.changed ?? {}) as Record<string, { from: unknown; to: unknown }>;
        const account = await prisma.account.findUnique({ where: { name } });
        if (!account) { console.log(`  ${name}: the account row is gone; the full row as archived is in ${head.id}`); continue; }
        const plan = restorePlan(account as Row, changed);
        if (plan.refused.length) { console.log(`  ${name}: refused (${plan.refused.join('; ')}); nothing written`); continue; }
        await prisma.$transaction([
          prisma.account.update({ where: { name }, data: plan.data as Prisma.AccountUpdateInput }),
          prisma.gapAuditEvent.create({ data: { kind: RESTORED, actor: ACTOR, subject_type: 'account', subject_id: name, payload: { restores: head.id, restored: plan.data, at: now.toISOString() } as Prisma.InputJsonValue } }),
        ]);
        console.log(`  ${name}: restored ${JSON.stringify(plan.data)}`);
      }
      return;
    }
    console.log('\n== PLAN (no existing archive mechanism on Account: this is a park of existing columns, reversible from its ledger row)');
    for (const a of inv.accounts) console.log(`  ${a.name} (id ${a.id}): set ${JSON.stringify(parkChanges(a))}; one ${ARCHIVED} row with the changed fields, their previous values and the full row`);
    console.log('  related rows: untouched; HubSpot: untouched; nothing deleted');
    if (inv.sharing.length) console.log('  STOP: a canonical company is shared with another account; do not apply');
    if (!APPLY) { console.log('dry run: nothing written'); return; }
    if (inv.sharing.length) throw new Error('a canonical company is shared with another account; refusing');
    for (const a of inv.accounts) {
      const changed = parkChanges(a);
      if (!Object.keys(changed).length) { console.log(`  ${a.name}: already parked`); continue; }
      const data = Object.fromEntries(Object.entries(changed).map(([k, c]) => [k, c.to]));
      await prisma.$transaction([
        prisma.account.update({ where: { id: a.id }, data: data as Prisma.AccountUpdateInput }),
        prisma.gapAuditEvent.create({ data: { kind: ARCHIVED, actor: ACTOR, subject_type: 'account', subject_id: a.name, payload: { changed, row: JSON.parse(JSON.stringify(a)), linkedRows: inv.byModel, reason: 'Test-only fixture rows from the account command center proof seed (2026-05-07); parked, not deleted.', restore: 'npx tsx scripts/gap/archive-test-accounts.ts --restore', authorizedBy: AUTHORIZED, at: now.toISOString() } as Prisma.InputJsonValue } }),
      ]);
      console.log(`  ${a.name}: parked ${JSON.stringify(data)}`);
    }
    console.log('applied');
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && /archive-test-accounts/.test(process.argv[1])) main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
