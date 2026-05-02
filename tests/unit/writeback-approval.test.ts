import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WritebackPreviewItem } from '@/lib/enrichment/writeback-preview';

const mockedPrisma = {
  systemConfig: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

describe('writeback approval helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes deterministic checksum', async () => {
    const { computePreviewChecksum } = await import('@/lib/enrichment/writeback-approval');
    const preview: WritebackPreviewItem[] = [
      { field: 'job_title', decision: 'accept_candidate', existingValue: 'Director', candidateValue: 'VP', existingSource: 'hubspot', candidateSource: 'apollo' },
    ];
    expect(computePreviewChecksum(preview)).toBe(computePreviewChecksum(preview));
  });

  it('consumes a valid approval token once', async () => {
    mockedPrisma.systemConfig.findUnique.mockResolvedValue({
      key: 'k',
      value: JSON.stringify({
        token: 'token-1',
        personaId: 7,
        checksum: 'a'.repeat(64),
        expiresAt: '2099-01-01T00:00:00.000Z',
        createdAt: '2026-05-02T00:00:00.000Z',
      }),
    });
    mockedPrisma.systemConfig.delete.mockResolvedValue({});
    const { consumeWritebackApprovalToken } = await import('@/lib/enrichment/writeback-approval');

    const ok = await consumeWritebackApprovalToken({
      token: 'token-1',
      personaId: 7,
      checksum: 'a'.repeat(64),
    });

    expect(ok).toBe(true);
    expect(mockedPrisma.systemConfig.delete).toHaveBeenCalled();
  });
});
