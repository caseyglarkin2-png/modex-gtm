/**
 * GAP OS dogfood, Phase 1: read-only production identity coverage audit.
 *
 * Reads Account, CanonicalCompany, CanonicalAccountLink, GapAccountAlias and
 * PounceTrigger. Writes nothing. Classifies each distinct company name seen
 * in recent Pounce signals through the same tiers the real resolver uses
 * (resolveIdentity in src/lib/gap/identity/resolve.ts), so the report is
 * true to what the runtime will actually do, not a hand-rolled guess.
 */
import { PrismaClient } from '@prisma/client';
import { loadIdentityContext } from '../../src/lib/gap/identity/service';
import { resolveIdentity } from '../../src/lib/gap/identity/resolve';

const prisma = new PrismaClient();

async function main() {
  const ctx = await loadIdentityContext(prisma);
  console.log('accounts:', ctx.accountNames.length);
  console.log('accountsByHubspotCompanyId:', ctx.accountsByHubspotCompanyId.size);
  console.log('verifiedDomainToAccounts:', ctx.verifiedDomainToAccounts.size);
  console.log('aliasToAccounts:', ctx.aliasToAccounts.size);

  const triggers = await prisma.pounceTrigger.findMany({
    orderBy: { first_seen_at: 'desc' },
    take: 500,
    select: { id: true, account_name: true, first_seen_at: true, dismissed: true },
  });
  console.log('recent pounce triggers scanned:', triggers.length);

  const byCompany = new Map<string, { count: number; latest: Date }>();
  for (const t of triggers) {
    if (t.dismissed) continue;
    const existing = byCompany.get(t.account_name);
    if (existing) existing.count += 1;
    else byCompany.set(t.account_name, { count: 1, latest: t.first_seen_at });
  }
  console.log('distinct non-dismissed pounce account_names:', byCompany.size);

  const buckets: Record<string, string[]> = {
    RESOLVED_BY_HUBSPOT_ID: [],
    RESOLVED_BY_DOMAIN: [],
    RESOLVED_BY_ALIAS: [],
    RESOLVED_BY_NORMALIZED_NAME: [],
    AMBIGUOUS: [],
    UNRESOLVED: [],
  };
  for (const [name] of byCompany) {
    const result = resolveIdentity(ctx, { rawName: name });
    if (!result.ok) {
      buckets[result.reason === 'ambiguous_identity' ? 'AMBIGUOUS' : 'UNRESOLVED'].push(name);
      continue;
    }
    const key =
      result.via === 'hubspot_company_id'
        ? 'RESOLVED_BY_HUBSPOT_ID'
        : result.via === 'verified_domain'
          ? 'RESOLVED_BY_DOMAIN'
          : result.via === 'alias'
            ? 'RESOLVED_BY_ALIAS'
            : 'RESOLVED_BY_NORMALIZED_NAME';
    buckets[key].push(name);
  }

  console.log('\n--- Pounce cohort coverage ---');
  for (const [k, v] of Object.entries(buckets)) console.log(k, v.length);

  const accountsWithHubspotId = await prisma.account.count({ where: { hubspot_company_id: { not: null } } });
  const accountsTotal = await prisma.account.count();
  console.log('\naccounts with hubspot_company_id:', accountsWithHubspotId, '/', accountsTotal);

  console.log('\nJSON:', JSON.stringify({ buckets, accountsWithHubspotId, accountsTotal, pounceCohortSize: byCompany.size }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
