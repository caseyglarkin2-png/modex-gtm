/**
 * GAP Prospecting OS: prisma glue for the identity resolver (Sprint 6A).
 *
 * Loads the snapshot the pure resolver (resolve.ts) needs, then calls it.
 * House convention for DB glue is `prisma: any` (see ../signals/registry.ts).
 *
 * Tier B ("verified normalized domain") reads the existing revops
 * canonical/dedup engine's own tables (CanonicalCompany, CanonicalAccountLink;
 * src/lib/revops/account-identity.ts is that engine's read path) rather than
 * building a second domain index: both `status: 'resolved'`, since an
 * unresolved or conflicted canonical link is exactly the kind of guess this
 * resolver must never treat as verified.
 */

import { normalizeCompanyName } from './normalize';
import { resolveIdentity, type IdentityContext, type IdentityInput, type ResolveIdentityResult } from './resolve';

function pushInto(map: Map<string, string[]>, key: string, accountName: string): void {
  const existing = map.get(key);
  if (existing) {
    if (!existing.includes(accountName)) existing.push(accountName);
  } else {
    map.set(key, [accountName]);
  }
}

/** Build the resolver's context snapshot from the current database state. */
export async function loadIdentityContext(prisma: any): Promise<IdentityContext> {
  const [accounts, canonicalCompanies, canonicalLinks, aliases] = await Promise.all([
    prisma.account.findMany({ select: { name: true, hubspot_company_id: true } }),
    prisma.canonicalCompany.findMany({
      where: { domain: { not: null }, status: 'resolved' },
      select: { id: true, domain: true },
    }),
    prisma.canonicalAccountLink.findMany({
      where: { status: 'resolved' },
      select: { account_name: true, canonical_company_id: true },
    }),
    prisma.gapAccountAlias.findMany({ select: { normalized_alias: true, account_name: true } }),
  ]);

  const accountsByHubspotCompanyId = new Map<string, string>();
  const accountNames: string[] = [];
  for (const a of accounts as Array<{ name: string; hubspot_company_id: string | null }>) {
    accountNames.push(a.name);
    if (a.hubspot_company_id) accountsByHubspotCompanyId.set(a.hubspot_company_id, a.name);
  }

  const domainByCompanyId = new Map<string, string>();
  for (const c of canonicalCompanies as Array<{ id: string; domain: string | null }>) {
    if (c.domain) domainByCompanyId.set(c.id, c.domain.trim().toLowerCase().replace(/^www\./, ''));
  }
  const verifiedDomainToAccounts = new Map<string, string[]>();
  for (const link of canonicalLinks as Array<{ account_name: string; canonical_company_id: string }>) {
    const domain = domainByCompanyId.get(link.canonical_company_id);
    if (domain) pushInto(verifiedDomainToAccounts, domain, link.account_name);
  }

  const aliasToAccounts = new Map<string, string[]>();
  for (const alias of aliases as Array<{ normalized_alias: string; account_name: string }>) {
    pushInto(aliasToAccounts, alias.normalized_alias, alias.account_name);
  }

  return { accountsByHubspotCompanyId, verifiedDomainToAccounts, aliasToAccounts, accountNames };
}

/**
 * Resolve one input to a canonical account name. Loads the context itself
 * when the caller has not already loaded one for a batch (see
 * hypothesis/hypothesize.ts, which loads once per run).
 */
export async function resolveAccountName(
  prisma: any,
  input: IdentityInput,
  context?: IdentityContext,
): Promise<ResolveIdentityResult> {
  const ctx = context ?? (await loadIdentityContext(prisma));
  return resolveIdentity(ctx, input);
}

export interface RegisterAliasInput {
  alias: string;
  accountName: string;
  source: 'hypothesize_cron' | 'manual';
  createdBy: string;
}

export interface RegisterAliasResult {
  created: boolean;
  id: string;
}

/**
 * Register an explicit alias. Idempotent on the normalized key (the DB
 * unique index on normalized_alias is the backstop; this check-then-create
 * is the same accepted race window as registerSignal in ../signals/registry.ts).
 */
export async function registerAlias(prisma: any, input: RegisterAliasInput): Promise<RegisterAliasResult> {
  const normalized_alias = normalizeCompanyName(input.alias);

  const existing = await prisma.gapAccountAlias.findUnique({
    where: { normalized_alias },
    select: { id: true },
  });
  if (existing) return { created: false, id: existing.id };

  const row = await prisma.gapAccountAlias.create({
    data: {
      alias: input.alias.trim(),
      normalized_alias,
      account_name: input.accountName,
      source: input.source,
      created_by: input.createdBy,
    },
  });
  return { created: true, id: row.id };
}
