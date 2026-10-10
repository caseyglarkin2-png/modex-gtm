/**
 * The people fix of October 10, 2026 (mdlz.com). Production read (read only): "Mondelez International" has one
 * canonical link, domain:mondelezinternational.com (the CRM company's domain), no alias, no GAP contact at mdlz.com and
 * no hubspot_company_id; every Mondelez buyer writes from mdlz.com, so "Declined: Mondelez / FreightRoll - YNS demo"
 * and the other 13 messages from mdlz.com were placed at no account. An account has ONE canonical link (the column is
 * unique), so the second mail domain is said as a seller-confirmed alias whose text is the bare domain; the identity
 * context folds it into the domain tier. Pinned: the alias row places an mdlz.com address at Mondelez International
 * by the domain; without it the address is unplaced (the production state); a name alias never becomes a domain; two
 * accounts on one domain stay ambiguous, never a guess.
 */
import { describe, expect, it, vi } from 'vitest';
import { domainAliasHost, loadIdentityContext } from '@/lib/gap/identity/service';
import { resolveIdentity } from '@/lib/gap/identity/resolve';
import { resolvePersonAccount } from '@/lib/gap/work/person-identity';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function prisma(rows: { accounts: Row[]; companies: Row[]; links: Row[]; aliases: Row[] }) {
  return {
    account: { findMany: vi.fn(async () => rows.accounts) },
    canonicalCompany: { findMany: vi.fn(async (args: Row) => (args?.where?.id?.in ? rows.companies.filter((c) => args.where.id.in.includes(c.id)) : rows.companies.filter((c) => c.domain && c.status === 'resolved'))) },
    canonicalAccountLink: { findMany: vi.fn(async (args: Row) => rows.links.filter((l) => l.status === args?.where?.status)) },
    gapAccountAlias: { findMany: vi.fn(async () => rows.aliases) },
  };
}

const PRODUCTION = {
  accounts: [{ name: 'Mondelez International', hubspot_company_id: null }, { name: 'Kraft Heinz', hubspot_company_id: null }],
  companies: [{ id: 'domain:mondelezinternational.com', company_key: 'domain:mondelezinternational.com', source: 'company_domain', domain: null, status: 'resolved' }],
  links: [{ account_name: 'Mondelez International', canonical_company_id: 'domain:mondelezinternational.com', status: 'resolved' }],
  aliases: [] as Row[],
};
const MDLZ = { alias: 'mdlz.com', normalized_alias: 'mdlz com', account_name: 'Mondelez International' };
const ivanildo = (identity: Awaited<ReturnType<typeof loadIdentityContext>>) => resolvePersonAccount({ email: 'ivanildo.andres@mdlz.com', persona: null, threadAccount: null, identity, hubspotCompanyIds: [] });

describe('a seller-confirmed domain alias places the mail domain', () => {
  it('without the row (production today) an mdlz.com sender is placed at no account; with it, at Mondelez International by the domain', async () => {
    const before = await loadIdentityContext(prisma(PRODUCTION));
    expect(before.verifiedDomainToAccounts.get('mondelezinternational.com')).toEqual(['Mondelez International']);
    expect(ivanildo(before)).toMatchObject({ accountName: null, via: null, domain: 'mdlz.com' });
    const after = await loadIdentityContext(prisma({ ...PRODUCTION, aliases: [MDLZ] }));
    expect(after.verifiedDomainToAccounts.get('mdlz.com')).toEqual(['Mondelez International']);
    expect(ivanildo(after)).toMatchObject({ accountName: 'Mondelez International', via: 'domain', ambiguous: false });
    // The alias stays a name alias too ("mdlz com"), as registerAlias stores it.
    expect(after.aliasToAccounts.get('mdlz com')).toEqual(['Mondelez International']);
  });

  it('a name alias never becomes a domain; two accounts on one domain are ambiguous, with both names', async () => {
    const ctx = await loadIdentityContext(prisma({ ...PRODUCTION, aliases: [{ alias: 'Kraft', normalized_alias: 'kraft', account_name: 'Kraft Heinz' }, { alias: 'Nabisco Inc.', normalized_alias: 'nabisco', account_name: 'Mondelez International' }, { alias: 'mondelezinternational.com', normalized_alias: 'mondelezinternational com', account_name: 'Kraft Heinz' }] }));
    expect([...ctx.verifiedDomainToAccounts.keys()].sort()).toEqual(['mondelezinternational.com']);
    expect(resolveIdentity(ctx, { domain: 'mondelezinternational.com' })).toEqual({ ok: false, reason: 'ambiguous_identity', candidates: ['Mondelez International', 'Kraft Heinz'] });
  });

  it('domainAliasHost reads a bare host only', () => {
    expect(domainAliasHost('mdlz.com')).toBe('mdlz.com');
    expect(domainAliasHost(' @MDLZ.com ')).toBe('mdlz.com');
    expect(domainAliasHost('www.mdlz.com')).toBe('mdlz.com');
    expect(domainAliasHost('mail.mdlz.co.uk')).toBe('mail.mdlz.co.uk');
    for (const v of ['Mondelez International', 'Nabisco Inc.', 'J.B. Hunt', 'mdlz', 'https://mdlz.com/', 'a@mdlz.com', '', null, undefined]) expect(domainAliasHost(v)).toBeNull();
  });
});
