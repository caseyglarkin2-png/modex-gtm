import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  generatedContent: { findUnique: vi.fn() },
  contentChecklistState: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { PATCH } = await import('@/app/api/revops/content-checklist/route');

describe('content checklist route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.generatedContent.findUnique.mockResolvedValue({
      id: 101,
      campaign: { campaign_type: 'trade_show' },
    });
    mockedPrisma.contentChecklistState.upsert.mockResolvedValue({
      id: 'cls_1',
      generated_content_id: 101,
      completed_item_ids: ['clear_value_prop'],
      campaign_type: 'trade_show',
      updated_at: new Date('2026-05-04T00:00:00Z'),
    });
  });

  it('persists checklist completion state', async () => {
    const req = new NextRequest('http://localhost/api/revops/content-checklist', {
      method: 'PATCH',
      body: JSON.stringify({
        generatedContentId: 101,
        completedItemIds: ['clear_value_prop', 'cta_specific'],
      }),
    });

    const res = await PATCH(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedPrisma.contentChecklistState.upsert).toHaveBeenCalled();
  });
});
