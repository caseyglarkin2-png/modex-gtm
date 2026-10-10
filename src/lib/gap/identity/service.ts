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

import { legacyNormalizeCompanyName, normalizeCompanyName } from './normalize';
import { resolveIdentity, type IdentityContext, type IdentityInput, type ResolveIdentityResult } from './resolve';

function pushInto(map: Map<string, string[]>, key: string, accountName: string): void {
  const existing = map.get(key);
  if (existing) {
    if (!existing.includes(accountName)) existing.push(accountName);
  } else {
    map.set(key, [accountName]);
  }
}

/**
 * C5 fix: the host a canonical company stands for: its `domain` when set, else the host its id or company_key carries
 * (`domain:<host>`, the company_domain source); null when neither names one. Pure.
 */
export function hostOfCompany(c: { id?: string | null; domain?: string | null; company_key?: string | null }): string | null {
  const d = c.domain?.trim();
  if (d) return d.toLowerCase().replace(/^www\./, '');
  for (const key of [c.company_key, c.id]) {
    const m = /^domain:(.+)$/i.exec(String(key ?? '').trim());
    if (m && m[1].trim()) return m[1].trim().toLowerCase().replace(/^www\./, '');
  }
  return null;
}

const DOMAIN_HOST = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

/** The host an alias names when its text is a bare domain ("mdlz.com", "@mdlz.com", "www.mdlz.com"), else null. Pure. */
export function domainAliasHost(alias: string | null | undefined): string | null {
  const t = String(alias ?? '').trim().toLowerCase().replace(/^@/, '').replace(/^www\./, '');
  return t && DOMAIN_HOST.test(t) ? t : null;
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
    prisma.gapAccountAlias.findMany({ select: { alias: true, normalized_alias: true, account_name: true } }),
  ]);

  const accountsByHubspotCompanyId = new Map<string, string>();
  const accountNames: string[] = [];
  for (const a of accounts as Array<{ name: string; hubspot_company_id: string | null }>) {
    accountNames.push(a.name);
    if (a.hubspot_company_id) accountsByHubspotCompanyId.set(a.hubspot_company_id, a.name);
  }

  const domainByCompanyId = new Map<string, string>();
  for (const c of canonicalCompanies as Array<{ id: string; domain: string | null }>) {
    const host = hostOfCompany(c);
    if (host) domainByCompanyId.set(c.id, host);
  }
  // C5 fix (2026-10-09, the production shape): a company keyed by domain (id and company_key `domain:<host>`, source
  // company_domain) can carry DOMAIN NULL (Kenco's 'domain:kencogroup.com' does): the host is read from the key. The
  // companies the links point at that the first read left out (a null domain, or a status other than resolved) are read
  // by id, soft, with their keys, for the verified map and the conflicted one alike.
  const conflicted: Array<{ account_name: string; canonical_company_id: string }> = await prisma.canonicalAccountLink
    .findMany({ where: { status: 'conflict' }, select: { account_name: true, canonical_company_id: true } })
    .catch(() => []);
  const missing = [...new Set([...(canonicalLinks as Array<{ canonical_company_id: string }>), ...conflicted].map((l) => l.canonical_company_id).filter((id) => !domainByCompanyId.has(id)))];
  const extra: Array<{ id: string; domain: string | null; company_key?: string | null; source?: string | null }> = missing.length
    ? await prisma.canonicalCompany.findMany({ where: { id: { in: missing } }, select: { id: true, domain: true, company_key: true, source: true } }).catch(() => [])
    : [];
  for (const c of extra) {
    const host = hostOfCompany(c);
    if (host) domainByCompanyId.set(c.id, host);
  }
  const verifiedDomainToAccounts = new Map<string, string[]>();
  for (const link of canonicalLinks as Array<{ account_name: string; canonical_company_id: string }>) {
    const domain = domainByCompanyId.get(link.canonical_company_id);
    if (domain) pushInto(verifiedDomainToAccounts, domain, link.account_name);
  }

  // C5 (2026-10-09): the CONFLICTED links (two accounts on one canonical company, an open duplicate) are read apart, soft,
  // with their companies' hosts, so the resolver can say which accounts claim a domain instead of "no account yet"; they
  // never resolve anything.
  const conflictedDomainToAccounts = new Map<string, string[]>();
  for (const link of conflicted) {
    const domain = domainByCompanyId.get(link.canonical_company_id);
    if (domain) pushInto(conflictedDomainToAccounts, domain, link.account_name);
  }

  const aliasToAccounts = new Map<string, string[]>();
  for (const alias of aliases as Array<{ alias?: string; normalized_alias: string; account_name: string }>) {
    pushInto(aliasToAccounts, alias.normalized_alias, alias.account_name);
    // The people fix (2026-10-10, mdlz.com): an alias registered AS A DOMAIN (a seller-confirmed row, `alias` a bare
    // host) is one more domain of the account for the domain tier. An account has one canonical link (the column is
    // unique), so a second mail domain (Mondelez International: mondelezinternational.com in the CRM, mdlz.com on
    // every buyer's address) can only be said this way. Two accounts on one domain stay ambiguous (never a guess).
    const host = domainAliasHost(alias.alias);
    if (host) pushInto(verifiedDomainToAccounts, host, alias.account_name);
    // A key stored under the old normalization also answers to today's ("nestl usa" and "nestle usa").
    if (alias.alias) {
      const today = normalizeCompanyName(alias.alias);
      if (today !== alias.normalized_alias) pushInto(aliasToAccounts, today, alias.account_name);
    }
  }

  return { accountsByHubspotCompanyId, verifiedDomainToAccounts, aliasToAccounts, accountNames, conflictedDomainToAccounts };
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

export type RegisterAliasResult =
  | { status: 'CREATED'; id: string; created: true }
  | { status: 'ALREADY_MATCHED'; id: string; created: false }
  | {
      status: 'CONFLICT';
      id: string;
      created: false;
      normalizedAlias: string;
      existingAccountName: string;
      requestedAccountName: string;
    };

/**
 * Register an explicit alias. Idempotent on the normalized key (the DB
 * unique index on normalized_alias is the backstop; this check-then-create
 * is the same accepted race window as registerSignal in ../signals/registry.ts).
 *
 * `created` is kept alongside `status` for existing truthy-check callers;
 * new callers should switch on `status` to see CONFLICT, which `created`
 * alone cannot distinguish from ALREADY_MATCHED.
 */
export async function registerAlias(prisma: any, input: RegisterAliasInput): Promise<RegisterAliasResult> {
  const normalized_alias = normalizeCompanyName(input.alias);
  const legacy = legacyNormalizeCompanyName(input.alias);

  // A row stored under the old key (before accents were folded) is the same alias: never a second row.
  const existing =
    (await prisma.gapAccountAlias.findUnique({ where: { normalized_alias }, select: { id: true, account_name: true } })) ??
    (legacy !== normalized_alias ? await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: legacy }, select: { id: true, account_name: true } }) : null) ??
    // An accented alias stored under its old key ("nestl usa") is today's "nestle usa": found from the plain spelling too.
    (prisma.gapAccountAlias.findMany
      ? ((await prisma.gapAccountAlias.findMany({ select: { id: true, alias: true, account_name: true } })) as Array<{ id: string; alias: string; account_name: string }>).find((a) => !!a.alias && normalizeCompanyName(a.alias) === normalized_alias) ?? null
      : null);
  if (existing) {
    if (existing.account_name === input.accountName) {
      return { status: 'ALREADY_MATCHED', id: existing.id, created: false };
    }
    return {
      status: 'CONFLICT',
      id: existing.id,
      created: false,
      normalizedAlias: normalized_alias,
      existingAccountName: existing.account_name,
      requestedAccountName: input.accountName,
    };
  }

  const row = await prisma.gapAccountAlias.create({
    data: {
      alias: input.alias.trim(),
      normalized_alias,
      account_name: input.accountName,
      source: input.source,
      created_by: input.createdBy,
    },
  });
  return { status: 'CREATED', id: row.id, created: true };
}
