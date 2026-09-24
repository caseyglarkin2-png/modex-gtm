import { describe, expect, it, vi } from 'vitest';
import { loadIdentityContext, registerAlias, resolveAccountName } from '@/lib/gap/identity/service';

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
    expect(result).toEqual({ created: true, id: 'alias_1' });
    expect(prisma.gapAccountAlias.create.mock.calls[0][0].data).toMatchObject({
      alias: 'Niagara Bottling, Llc',
      normalized_alias: 'niagara bottling',
      account_name: 'Niagara Bottling',
      source: 'hypothesize_cron',
      created_by: 'cron:gap-hypothesize',
    });
  });

  it('is idempotent: a second registration under the same normalized key returns the existing row and creates nothing', async () => {
    const prisma = makePrisma() as unknown as Prisma;
    prisma.gapAccountAlias.findUnique = asyncSpy(async () => ({ id: 'alias_existing' }));
    const result = await registerAlias(prisma, {
      alias: 'Niagara Bottling LLC',
      accountName: 'Niagara Bottling',
      source: 'hypothesize_cron',
      createdBy: 'cron:gap-hypothesize',
    });
    expect(result).toEqual({ created: false, id: 'alias_existing' });
    expect(prisma.gapAccountAlias.create).not.toHaveBeenCalled();
  });
});
