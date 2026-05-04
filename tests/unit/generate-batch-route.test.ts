import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  campaign: {
    findUnique: vi.fn(),
  },
  generationJob: {
    create: vi.fn(),
  },
};
const mockedGetAccountContext = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/db', () => ({ getAccountContext: mockedGetAccountContext }));

const { POST } = await import('@/app/api/ai/generate-batch/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generate-batch route contract enforcement', () => {
  it('blocks when policy-enabled campaign has incomplete contract', async () => {
    mockedPrisma.campaign.findUnique.mockResolvedValue({
      id: 9,
      key_dates: { require_generation_contract: true },
      generation_contract: { is_complete: false, quality_score: 45 },
    });
    const res = await POST(new NextRequest('http://localhost/api/ai/generate-batch', {
      method: 'POST',
      body: JSON.stringify({
        accountNames: ['Acme'],
        campaignSlug: 'modex-campaign',
      }),
    }));
    expect(res.status).toBe(409);
  });

  it('creates jobs when contract gate passes', async () => {
    mockedPrisma.campaign.findUnique.mockResolvedValue({
      id: 9,
      key_dates: { require_generation_contract: true },
      generation_contract: { is_complete: true, quality_score: 88 },
    });
    mockedGetAccountContext.mockResolvedValue({ account: { name: 'Acme' } });
    mockedPrisma.generationJob.create.mockResolvedValue({ id: 101, account_name: 'Acme' });
    const res = await POST(new NextRequest('http://localhost/api/ai/generate-batch', {
      method: 'POST',
      body: JSON.stringify({
        accountNames: ['Acme'],
        campaignSlug: 'modex-campaign',
      }),
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.createdJobs).toHaveLength(1);
  });
});
