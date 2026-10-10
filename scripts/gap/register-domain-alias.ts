/**
 * REGISTER A MAIL DOMAIN AS AN ACCOUNT'S ALIAS (the people fix, 2026-10-10). DRY RUN BY DEFAULT.
 *
 *   npx tsx scripts/gap/register-domain-alias.ts --domain mdlz.com --account "Mondelez International"           (prints the plan)
 *   npx tsx scripts/gap/register-domain-alias.ts --domain mdlz.com --account "Mondelez International" --apply   (needs GAP_RECONCILE_APPLY=yes and GAP_RECONCILE_HOST=<db host>)
 *
 * Why: an account has ONE canonical link (canonical_account_links.account_name is unique), and Mondelez
 * International's is domain:mondelezinternational.com (the CRM company's domain), while every Mondelez buyer writes
 * from mdlz.com; the 14 messages from mdlz.com (the "Declined: Mondelez / FreightRoll - YNS demo" among them) were
 * placed at no account. A seller-confirmed alias whose text is the bare domain is folded into the identity context's
 * domain tier (src/lib/gap/identity/service.ts domainAliasHost), so the row below places the domain.
 *
 * What --apply writes, through confirmAlias (src/lib/gap/people/alias-review.ts), in that order:
 *   gap_account_aliases  (alias = <domain>, normalized_alias = normalizeCompanyName(<domain>), account_name = <account>,
 *                         source = 'manual', created_by = 'casey:register-domain-alias')
 *   gap_audit_events     (kind = 'account.alias_confirmed', subject_type = 'account', subject_id = <account>, payload with
 *                         the evidence lines and hubspotWritten: false)
 * Idempotent (a second run answers ALREADY_MATCHED and writes nothing). Refused when the domain already places at an
 * account, when the key maps to another account, or when the account does not exist. No HubSpot write, no mail.
 */
import { PrismaClient } from '@prisma/client';
import { domainAliasHost, loadIdentityContext } from '../../src/lib/gap/identity/service';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';

/** The words after a flag up to the next flag, joined by a space (a runner that does not quote "Mondelez International" splits it). */
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const words: string[] = [];
  for (let j = i + 1; j < process.argv.length && !process.argv[j].startsWith('--'); j += 1) words.push(process.argv[j]);
  return words.join(' ').trim() || null;
};
const DOMAIN = domainAliasHost(arg('--domain'));
const ACCOUNT = arg('--account');
const APPLY = process.argv.includes('--apply');
const ACTOR = 'casey:register-domain-alias';

async function main() {
  if (!DOMAIN || !ACCOUNT) throw new Error('--domain <bare host> and --account <GAP account name> are required');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const url = new URL(process.env.DATABASE_URL);
  if (APPLY) {
    if (process.env.GAP_RECONCILE_APPLY !== 'yes') throw new Error('--apply needs GAP_RECONCILE_APPLY=yes');
    if (!process.env.GAP_RECONCILE_HOST || url.hostname !== process.env.GAP_RECONCILE_HOST) throw new Error('--apply needs GAP_RECONCILE_HOST equal to the database host');
  }
  url.searchParams.set('connection_limit', '1');
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const account = await prisma.account.findUnique({ where: { name: ACCOUNT }, select: { name: true, hubspot_company_id: true } });
    if (!account) throw new Error(`no account named ${ACCOUNT}`);
    const link = await prisma.canonicalAccountLink.findUnique({ where: { account_name: ACCOUNT }, select: { canonical_company_id: true, status: true } });
    const normalized = normalizeCompanyName(DOMAIN);
    const existing = await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: normalized }, select: { id: true, alias: true, account_name: true } });
    const ctx = await loadIdentityContext(prisma);
    const today = resolveIdentity(ctx, { domain: DOMAIN });
    const senders = await prisma.inboundMessage.findMany({ where: { from_email: { endsWith: `@${DOMAIN}`, mode: 'insensitive' } }, select: { from_email: true, received_at: true, subject: true }, orderBy: { received_at: 'desc' }, take: 200 });
    console.log(`account: ${account.name} (hubspot_company_id ${account.hubspot_company_id ?? 'null'}); canonical link: ${link ? `${link.canonical_company_id} (${link.status})` : 'none'}`);
    console.log(`${DOMAIN} today: ${today.ok ? `places at ${today.accountName} by ${today.via}` : today.reason === 'ambiguous_identity' ? `ambiguous among ${(today.candidates ?? []).join(', ')}` : 'places at no account'}`);
    console.log(`messages from @${DOMAIN} on record: ${senders.length} from ${new Set(senders.map((s) => s.from_email.toLowerCase())).size} addresses${senders[0] ? `; newest ${senders[0].received_at.toISOString().slice(0, 10)} "${(senders[0].subject ?? '').slice(0, 70)}"` : ''}`);
    console.log(`existing alias at key "${normalized}": ${existing ? `${existing.alias} -> ${existing.account_name}` : 'none'}`);
    if (today.ok && today.accountName === ACCOUNT) { console.log(`nothing to do: ${DOMAIN} already places at ${ACCOUNT}`); return; }
    if (today.ok || (!today.ok && today.reason === 'ambiguous_identity')) throw new Error(`${DOMAIN} already resolves elsewhere (${today.ok ? today.accountName : (today.candidates ?? []).join(', ')}); refusing`);
    if (existing && existing.account_name !== ACCOUNT) throw new Error(`the key "${normalized}" already maps to ${existing.account_name}; refusing`);
    console.log(`PLAN: gap_account_aliases (alias='${DOMAIN}', normalized_alias='${normalized}', account_name='${ACCOUNT}', source='manual', created_by='${ACTOR}') and one gap_audit_events row (kind='account.alias_confirmed', subject_type='account', subject_id='${ACCOUNT}')`);
    if (!APPLY) { console.log('dry run: nothing written'); return; }
    const { confirmAlias } = await import('../../src/lib/gap/people/alias-review');
    const r = await confirmAlias(prisma, { accountName: ACCOUNT, alias: DOMAIN, actor: ACTOR, now: new Date(), evidence: [`${DOMAIN} is the mail domain of ${ACCOUNT}'s buyers (${senders.length} messages on record); the account's one canonical link is ${link?.canonical_company_id ?? 'none'}. Registered by scripts/gap/register-domain-alias.ts on the lead's apply, 2026-10-10.`] });
    console.log('result:', JSON.stringify(r));
    const after = resolveIdentity(await loadIdentityContext(prisma), { domain: DOMAIN });
    console.log(`${DOMAIN} after: ${after.ok ? `places at ${after.accountName} by ${after.via}` : after.reason}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
