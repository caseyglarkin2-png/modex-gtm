import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedResolveCanonicalAccountScope = vi.fn();

vi.mock('@/lib/revops/account-identity', () => ({
  normalizeAccountAliasKey: (value: string) => value.trim().toLowerCase(),
  resolveCanonicalAccountScope: mockedResolveCanonicalAccountScope,
}));

const { enforceOneAccountInvariant } = await import('@/lib/revops/one-account-invariant');

describe('one-account invariant', () => {
  const prisma = {
    persona: {
      findMany: vi.fn(),
    },
  } as unknown as Parameters<typeof enforceOneAccountInvariant>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedResolveCanonicalAccountScope.mockResolvedValue({
      accountName: 'Acme Foods',
      accountNames: ['Acme Foods', 'The Acme Foods'],
      normalizedAliases: ['The Acme Foods'],
      canonicalCompanyIds: ['account:acme-foods'],
    });
    prisma.persona.findMany = vi.fn().mockResolvedValue([]);
  });

  it('passes when all recipients resolve to one account scope', async () => {
    const result = await enforceOneAccountInvariant(prisma, {
      accountName: 'Acme Foods',
      recipients: [{ to: 'ops@acme.com', accountName: 'The Acme Foods' }],
      cc: ['vp@acme.com'],
    });

    expect(result.ok).toBe(true);
  });

  it('fails when account hints conflict with canonical scope', async () => {
    const result = await enforceOneAccountInvariant(prisma, {
      accountName: 'Acme Foods',
      recipients: [
        { to: 'ops@acme.com', accountName: 'Acme Foods' },
        { to: 'ops@other.com', accountName: 'Other Co' },
      ],
      cc: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('MIXED_ACCOUNT_PAYLOAD');
    }
  });
});
