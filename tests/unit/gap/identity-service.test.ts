import { describe, expect, it, vi } from 'vitest';
import { hostOfCompany, loadIdentityContext, registerAlias, resolveAccountName } from '@/lib/gap/identity/service';

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function makePrisma() {
  return {
    account: {
      findMany: asyncSpy(async () => []),
    },
    canonicalCompany: {
      findMany: asyncSpy(async () => []),
    },
    canonicalAccountLink: {
      findMany: asyncSpy(async () => []),
    },
    gapAccountAlias: {
      findMany: asyncSpy(async () => []),
      findUnique: asyncSpy(async () => null),
      create: asyncSpy(async (args: any) => ({ id: 'alias_new', ...args.data })),
    },
  };
}

type Prisma = ReturnType<typeof makePrisma>;

describe('loadIdentityContext', () => {
  it('builds the hubspot company id map from accounts that have one', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.account.findMany = asyncSpy(async () => [
      { name: 'Niagara Bottling', hubspot_company_id: 'hs_1' },
      { name: 'No HubSpot Yet', hubspot_company_id: null },
    ]);
    const ctx = await loadIdentityContext(prisma);
    expect(ctx.accountsByHubspotCompanyId.get('hs_1')).toBe('Niagara Bottling');
    expect(ctx.accountNames).toEqual(['Niagara Bottling', 'No HubSpot Yet']);
  });

  it('builds the verified domain map by joining resolved canonical companies to resolved account links', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.account.findMany = asyncSpy(async () => [{ name: 'Niagara Bottling', hubspot_company_id: null }]);
    prisma.canonicalCompany.findMany = asyncSpy(async () => [{ id: 'cc_1', domain: 'niagarawater.com' }]);
    prisma.canonicalAccountLink.findMany = asyncSpy(async () => [
      { account_name: 'Niagara Bottling', canonical_company_id: 'cc_1' },
    ]);
    const ctx = await loadIdentityContext(prisma);
    expect(ctx.verifiedDomainToAccounts.get('niagarawater.com')).toEqual(['Niagara Bottling']);
    // Only resolved companies/links are read: the query itself is scoped to status: 'resolved'.
    expect(prisma.canonicalCompany.findMany.mock.calls[0][0].where.status).toBe('resolved');
    expect(prisma.canonicalAccountLink.findMany.mock.calls[0][0].where.status).toBe('resolved');
  });

  it('C5 fix (the production shape): a canonical company keyed by domain with DOMAIN NULL gives its host from the key; two conflicted links on it make the conflicted map, a resolved link on such a company makes the verified map; the first reads stay scoped to resolved', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.account.findMany = asyncSpy(async () => [{ name: 'Kenco', hubspot_company_id: null }, { name: 'Kenco Logistics Services', hubspot_company_id: null }, { name: 'Primo', hubspot_company_id: null }]);
    // The first company read (status resolved, domain not null) returns nothing for Kenco: its company carries domain null.
    prisma.canonicalCompany.findMany = asyncSpy(async (args: any) => (args?.where?.id?.in
      ? [{ id: 'domain:kencogroup.com', company_key: 'domain:kencogroup.com', source: 'company_domain', domain: null, status: 'conflict' }, { id: 'domain:primowater.com', company_key: 'domain:primowater.com', source: 'company_domain', domain: null, status: 'resolved' }].filter((c) => args.where.id.in.includes(c.id))
      : []));
    prisma.canonicalAccountLink.findMany = asyncSpy(async (args: any) => (args?.where?.status === 'conflict'
      ? [{ account_name: 'Kenco', canonical_company_id: 'domain:kencogroup.com' }, { account_name: 'Kenco Logistics Services', canonical_company_id: 'domain:kencogroup.com' }]
      : [{ account_name: 'Primo', canonical_company_id: 'domain:primowater.com' }]));
    const ctx = await loadIdentityContext(prisma);
    expect(ctx.conflictedDomainToAccounts?.get('kencogroup.com')).toEqual(['Kenco', 'Kenco Logistics Services']);
    expect(ctx.verifiedDomainToAccounts.get('primowater.com')).toEqual(['Primo']);
    expect(ctx.verifiedDomainToAccounts.get('kencogroup.com')).toBeUndefined();
    expect(prisma.canonicalCompany.findMany.mock.calls[0][0].where.status).toBe('resolved');
    expect(prisma.canonicalCompany.findMany.mock.calls[1][0].where).toEqual({ id: { in: ['domain:primowater.com', 'domain:kencogroup.com'] } });
    expect(hostOfCompany({ id: 'cc_1', domain: 'WWW.Niagara.com' })).toBe('niagara.com');
    expect(hostOfCompany({ id: 'domain:Kencogroup.com', domain: null })).toBe('kencogroup.com');
    expect(hostOfCompany({ id: 'hubspot:1', company_key: 'hubspot:1', domain: null })).toBeNull();
  });

  it('builds the alias map from gap_account_aliases, grouping by normalized_alias', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.gapAccountAlias.findMany = asyncSpy(async () => [
      { normalized_alias: 'niagara bottling', account_name: 'Niagara Bottling' },
    ]);
    const ctx = await loadIdentityContext(prisma);
    expect(ctx.aliasToAccounts.get('niagara bottling')).toEqual(['Niagara Bottling']);
  });
});

describe('resolveAccountName', () => {
  it('loads context itself when none is given, and resolves through it', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.account.findMany = asyncSpy(async () => [{ name: 'Niagara Bottling', hubspot_company_id: null }]);
    const result = await resolveAccountName(prisma, { rawName: 'Niagara Bottling, Llc' });
    expect(result).toEqual({ ok: true, accountName: 'Niagara Bottling', via: 'normalized', confidence: 70 });
  });

  it('reuses a context passed in, without querying prisma again', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    const ctx = {
      accountsByHubspotCompanyId: new Map(),
      verifiedDomainToAccounts: new Map(),
      aliasToAccounts: new Map(),
      accountNames: ['Acme'],
    };
    const result = await resolveAccountName(prisma, { rawName: 'Acme' }, ctx);
    expect(result).toEqual({ ok: true, accountName: 'Acme', via: 'normalized', confidence: 100 });
    expect(prisma.account.findMany).not.toHaveBeenCalled();
  });
});

describe('registerAlias', () => {
  it('normalizes the alias and creates a new row when none exists yet', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.gapAccountAlias.create = asyncSpy(async (args: any) => ({ id: 'alias_1', ...args.data }));
    const result = await registerAlias(prisma, {
      alias: 'Niagara Bottling, Llc',
      accountName: 'Niagara Bottling',
      source: 'hypothesize_cron',
      createdBy: 'cron:gap-hypothesize',
    });
    expect(result).toEqual({ status: 'CREATED', created: true, id: 'alias_1' });
    expect(prisma.gapAccountAlias.create.mock.calls[0][0].data).toMatchObject({
      alias: 'Niagara Bottling, Llc',
      normalized_alias: 'niagara bottling',
      account_name: 'Niagara Bottling',
      source: 'hypothesize_cron',
      created_by: 'cron:gap-hypothesize',
    });
  });

  it('is idempotent: a second registration under the same normalized key for the same account returns ALREADY_MATCHED and creates nothing', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.gapAccountAlias.findUnique = asyncSpy(async () => ({ id: 'alias_existing', account_name: 'Niagara Bottling' }));
    const result = await registerAlias(prisma, {
      alias: 'Niagara Bottling LLC',
      accountName: 'Niagara Bottling',
      source: 'hypothesize_cron',
      createdBy: 'cron:gap-hypothesize',
    });
    expect(result).toEqual({ status: 'ALREADY_MATCHED', created: false, id: 'alias_existing' });
    expect(prisma.gapAccountAlias.create).not.toHaveBeenCalled();
  });

  it('reports a CONFLICT (never overwrites) when the same normalized alias already maps to a different account', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.gapAccountAlias.findUnique = asyncSpy(async () => ({ id: 'alias_existing', account_name: 'Niagara Bottling Inc' }));
    const result = await registerAlias(prisma, {
      alias: 'Niagara Bottling LLC',
      accountName: 'Niagara Bottling Co',
      source: 'hypothesize_cron',
      createdBy: 'cron:gap-hypothesize',
    });
    expect(result).toEqual({
      status: 'CONFLICT',
      created: false,
      id: 'alias_existing',
      normalizedAlias: 'niagara bottling',
      existingAccountName: 'Niagara Bottling Inc',
      requestedAccountName: 'Niagara Bottling Co',
    });
    expect(prisma.gapAccountAlias.create).not.toHaveBeenCalled();
  });
});
