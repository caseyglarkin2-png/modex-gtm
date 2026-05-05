import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  account: {
    findMany: vi.fn(),
  },
  canonicalAccountLink: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const {
  findNormalizedAccountAliases,
  normalizeAccountAliasKey,
  resolveCanonicalAccountScope,
} = await import('@/lib/revops/account-identity');

describe('account identity helpers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('normalizes leading articles into the same alias key', () => {
    expect(normalizeAccountAliasKey('Boston Beer Company')).toBe('boston beer company');
    expect(normalizeAccountAliasKey('The Boston Beer Company')).toBe('boston beer company');
  });

  it('finds normalized aliases for duplicate local account names', () => {
    expect(findNormalizedAccountAliases('Boston Beer Company', [
      'Boston Beer Company',
      'The Boston Beer Company',
      'Blue Rail',
    ])).toEqual([
      'Boston Beer Company',
      'The Boston Beer Company',
    ]);
  });

  it('returns the exact account when there are no alias matches or canonical links', async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { name: 'Boston Beer Company' },
      { name: 'Blue Rail' },
    ]);
    mockedPrisma.canonicalAccountLink.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const scope = await resolveCanonicalAccountScope('Boston Beer Company');

    expect(scope.accountNames).toEqual(['Boston Beer Company']);
    expect(scope.normalizedAliases).toEqual([]);
    expect(scope.canonicalCompanyIds).toEqual([]);
  });

  it('resolves account scope across normalized aliases and canonical links', async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { name: 'Blue Rail' },
      { name: 'Boston Beer Company' },
      { name: 'The Boston Beer Company' },
      { name: 'Boston Beer Canada' },
    ]);
    mockedPrisma.canonicalAccountLink.findMany
      .mockResolvedValueOnce([
        { account_name: 'Boston Beer Company', canonical_company_id: 'account:boston beer company' },
        { account_name: 'The Boston Beer Company', canonical_company_id: 'domain:bostonbeer.com' },
      ])
      .mockResolvedValueOnce([
        { account_name: 'Boston Beer Company' },
        { account_name: 'The Boston Beer Company' },
      ]);

    const scope = await resolveCanonicalAccountScope('Boston Beer Company');

    expect(scope.accountNames).toEqual([
      'Boston Beer Company',
      'The Boston Beer Company',
    ]);
    expect(scope.normalizedAliases).toEqual(['The Boston Beer Company']);
    expect(scope.canonicalCompanyIds).toEqual([
      'account:boston beer company',
      'domain:bostonbeer.com',
    ]);
  });

  it('expands from a linked canonical company even when the alias text differs', async () => {
    mockedPrisma.account.findMany.mockResolvedValue([
      { name: 'Boston Beer Company' },
      { name: 'BBC Logistics' },
    ]);
    mockedPrisma.canonicalAccountLink.findMany
      .mockResolvedValueOnce([
        { account_name: 'Boston Beer Company', canonical_company_id: 'domain:bostonbeer.com' },
      ])
      .mockResolvedValueOnce([
        { account_name: 'Boston Beer Company' },
        { account_name: 'BBC Logistics' },
      ]);

    const scope = await resolveCanonicalAccountScope('Boston Beer Company');

    expect(scope.accountNames).toEqual([
      'BBC Logistics',
      'Boston Beer Company',
    ]);
    expect(scope.normalizedAliases).toEqual([]);
    expect(scope.canonicalCompanyIds).toEqual(['domain:bostonbeer.com']);
  });
});
