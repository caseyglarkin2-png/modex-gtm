import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedFetchAccountIdentityReport = vi.fn();
const mockedSyncCanonicalRecords = vi.fn();
const mockedPrisma = {
  systemConfig: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/revops/account-identity-report', () => ({
  fetchAccountIdentityReport: mockedFetchAccountIdentityReport,
}));
vi.mock('@/lib/revops/canonical-sync', () => ({
  syncCanonicalRecords: mockedSyncCanonicalRecords,
}));
vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

const { runCanonicalBackfill } = await import('@/lib/revops/account-identity-backfill');

describe('canonical account backfill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchAccountIdentityReport
      .mockResolvedValueOnce({
        clusters: [
          {
            key: 'Boston Beer Company|The Boston Beer Company',
            accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
          },
        ],
        summary: {
          clusterCount: 1,
          impactedAccountCount: 2,
          mismatchedCanonicalClusterCount: 1,
          missingCanonicalLinkCount: 1,
        },
      })
      .mockResolvedValueOnce({
        clusters: [
          {
            key: 'Boston Beer Company|The Boston Beer Company',
            accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
          },
        ],
        summary: {
          clusterCount: 1,
          impactedAccountCount: 2,
          mismatchedCanonicalClusterCount: 0,
          missingCanonicalLinkCount: 0,
        },
      });
    mockedSyncCanonicalRecords.mockResolvedValue({ accountCount: 2, contactCount: 4 });
    mockedPrisma.systemConfig.upsert.mockResolvedValue({ key: 'runbook:canonical-backfill:last' });
  });

  it('syncs duplicate-cluster account scope and persists a runbook audit', async () => {
    const result = await runCanonicalBackfill();

    expect(mockedSyncCanonicalRecords).toHaveBeenCalledWith({
      accountNames: ['Boston Beer Company', 'The Boston Beer Company'],
      personaIds: undefined,
    });
    expect(result.clusterCount).toBe(1);
    expect(result.mismatchedCanonicalClusterCount).toBe(0);
    expect(result.missingCanonicalLinkCount).toBe(0);
    expect(mockedPrisma.systemConfig.upsert).toHaveBeenCalledWith({
      where: { key: 'runbook:canonical-backfill:last' },
      update: { value: expect.any(String) },
      create: {
        key: 'runbook:canonical-backfill:last',
        value: expect.any(String),
      },
    });
  });

  it('honors an explicit scoped account list', async () => {
    await runCanonicalBackfill({ accountNames: ['Boston Beer Company'] });

    expect(mockedSyncCanonicalRecords).toHaveBeenCalledWith({
      accountNames: ['Boston Beer Company'],
      personaIds: undefined,
    });
  });
});
