import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  systemConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

describe('enrichment lock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('acquires lock when none exists', async () => {
    let storedValue: string | undefined;
    mockedPrisma.systemConfig.findUnique
      .mockResolvedValueOnce(null)
      .mockImplementationOnce(async () => ({
        key: 'lock:sync-hubspot',
        value: storedValue,
      }));
    mockedPrisma.systemConfig.upsert.mockImplementation(async (args: { create: { value: string } }) => {
      storedValue = args.create.value;
      return {};
    });

    const { acquireEnrichmentLock } = await import('@/lib/enrichment/lock');
    const lock = await acquireEnrichmentLock('sync-hubspot', 60_000);

    expect(lock.acquired).toBe(true);
    expect(lock.token).toBeTruthy();
  });

  it('does not acquire when unexpired lock exists', async () => {
    mockedPrisma.systemConfig.findUnique.mockResolvedValue({
      key: 'lock:sync-hubspot',
      value: JSON.stringify({ token: 'held', expiresAt: '2099-01-01T00:00:00.000Z' }),
    });

    const { acquireEnrichmentLock } = await import('@/lib/enrichment/lock');
    const lock = await acquireEnrichmentLock('sync-hubspot', 60_000);

    expect(lock).toEqual({ acquired: false, token: null });
    expect(mockedPrisma.systemConfig.upsert).not.toHaveBeenCalled();
  });

  it('releases lock only when token matches', async () => {
    mockedPrisma.systemConfig.findUnique.mockResolvedValue({
      key: 'lock:sync-hubspot',
      value: JSON.stringify({ token: 'token-1', expiresAt: '2099-01-01T00:00:00.000Z' }),
    });
    mockedPrisma.systemConfig.delete.mockResolvedValue({});

    const { releaseEnrichmentLock } = await import('@/lib/enrichment/lock');
    await releaseEnrichmentLock('sync-hubspot', 'token-1');

    expect(mockedPrisma.systemConfig.delete).toHaveBeenCalledWith({
      where: { key: 'lock:sync-hubspot' },
    });
  });
});
