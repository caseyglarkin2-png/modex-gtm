import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  generatedContent: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { PATCH } = await import('@/app/api/ai/generated-content/[id]/publish/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generated content publish API', () => {
  it('publishes one version and unpublishes sibling versions', async () => {
    mockedPrisma.generatedContent.findUnique.mockResolvedValue({
      id: 7,
      account_name: 'Acme Foods',
      content_type: 'one_pager',
      campaign_id: null,
    });
    mockedPrisma.generatedContent.updateMany.mockReturnValue({ kind: 'updateMany' });
    mockedPrisma.generatedContent.update.mockReturnValue({ kind: 'update' });
    mockedPrisma.$transaction.mockResolvedValue([]);

    const res = await PATCH(
      new NextRequest('http://localhost/api/ai/generated-content/7/publish', { method: 'PATCH' }),
      { params: Promise.resolve({ id: '7' }) },
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual({ success: true, id: 7 });
    expect(mockedPrisma.generatedContent.updateMany).toHaveBeenCalledWith({
      where: {
        account_name: 'Acme Foods',
        content_type: 'one_pager',
        campaign_id: null,
        id: { not: 7 },
      },
      data: {
        is_published: false,
        published_at: null,
      },
    });
    expect(mockedPrisma.generatedContent.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        is_published: true,
        published_at: expect.any(Date),
      },
    });
  });
});
