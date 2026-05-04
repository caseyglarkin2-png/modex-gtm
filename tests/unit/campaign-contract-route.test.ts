import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  campaignGenerationContract: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/revops/campaign-contract/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('campaign contract route', () => {
  it('upserts campaign contract with evaluated quality', async () => {
    mockedPrisma.campaignGenerationContract.upsert.mockResolvedValue({
      id: 'cgc_1',
      campaign_id: 11,
      quality_score: 88,
      is_complete: true,
      updated_at: new Date('2026-05-04T00:00:00.000Z'),
    });
    const res = await POST(new NextRequest('http://localhost/api/revops/campaign-contract', {
      method: 'POST',
      body: JSON.stringify({
        campaignId: 11,
        objective: 'Increase meetings',
        personaHypothesis: 'Ops leader has variance pain',
        offer: 'Benchmark',
        proof: 'Drop and hook reduction',
        cta: 'Share current process',
        metric: 'Meetings booked',
      }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.contract.quality_score).toBe(88);
  });
});
