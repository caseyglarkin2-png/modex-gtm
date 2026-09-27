import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  campaignGenerationContract: {
    upsert: vi.fn(),
  },
};

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: () => authMock() }));
vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/revops/campaign-contract/route');

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { email: 'casey@freightroll.com' } });
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

describe('ops closeout: created_by is the session, never the client', () => {
  const body = { campaignId: 11, objective: 'Increase meetings', personaHypothesis: 'Ops leader has variance pain', offer: 'Benchmark', proof: 'Drop and hook reduction', cta: 'Share current process', metric: 'Meetings booked', createdBy: 'someone-else' };
  it('a body createdBy is ignored', async () => {
    mockedPrisma.campaignGenerationContract.upsert.mockResolvedValue({ id: 'cgc_1', campaign_id: 11, quality_score: 88, is_complete: true, updated_at: new Date() });
    const res = await POST(new NextRequest('http://localhost/api/revops/campaign-contract', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(200);
    const args = mockedPrisma.campaignGenerationContract.upsert.mock.calls[0][0];
    expect(args.create.created_by).toBe('casey@freightroll.com');
    expect(args.update.created_by).toBe('casey@freightroll.com');
  });
  it('no session is 401 and nothing is written', async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(new NextRequest('http://localhost/api/revops/campaign-contract', { method: 'POST', body: JSON.stringify(body) }));
    expect(res.status).toBe(401);
    expect(mockedPrisma.campaignGenerationContract.upsert).not.toHaveBeenCalled();
  });
});
