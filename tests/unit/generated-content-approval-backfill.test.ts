import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backfillGeneratedContentApprovals } from '@/lib/revops/generated-content-approval-backfill';

describe('generated content approval backfill', () => {
  const prisma = {
    generatedContent: {
      findMany: vi.fn(),
    },
    messageEvolutionRegistry: {
      create: vi.fn(),
    },
  } as unknown as Parameters<typeof backfillGeneratedContentApprovals>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.generatedContent.findMany as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 100,
        account_name: 'Acme Foods',
        campaign_id: 7,
        content_type: 'one_pager',
        created_at: new Date('2026-05-01T00:00:00.000Z'),
      },
      {
        id: 101,
        account_name: 'Acme Foods',
        campaign_id: 7,
        content_type: 'email',
        created_at: new Date('2026-05-02T00:00:00.000Z'),
      },
    ]);
    (prisma.messageEvolutionRegistry.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'mer_1' });
  });

  it('reports candidate ids without writing rows in dry-run mode', async () => {
    const result = await backfillGeneratedContentApprovals(prisma, { dryRun: true, limit: 10 });

    expect(result).toMatchObject({
      scanned: 2,
      created: 0,
      skipped: 2,
      dryRun: true,
      sampleGeneratedContentIds: [100, 101],
    });
    expect(prisma.messageEvolutionRegistry.create).not.toHaveBeenCalled();
  });

  it('creates approved review rows when dry-run is disabled', async () => {
    const result = await backfillGeneratedContentApprovals(prisma, {
      dryRun: false,
      limit: 10,
      actor: 'Casey',
    });

    expect(result).toMatchObject({
      scanned: 2,
      created: 2,
      skipped: 0,
      dryRun: false,
    });
    expect(prisma.messageEvolutionRegistry.create).toHaveBeenCalledTimes(2);
    expect(prisma.messageEvolutionRegistry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        account_name: 'Acme Foods',
        generated_content_id: 100,
        status: 'approved',
        owner: 'Casey',
        reviewed_by: 'Casey',
      }),
    }));
  });
});
