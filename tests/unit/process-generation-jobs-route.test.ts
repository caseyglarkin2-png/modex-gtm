import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.CRON_SECRET = 'test-cron-secret';

const mockedPrisma = {
  generationJob: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  generatedContent: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
};

const mockedGenerateTextWithMetadata = vi.fn();
const mockedGetAccountContext = vi.fn();
const mockedMarkCronStarted = vi.fn();
const mockedMarkCronSuccess = vi.fn();
const mockedMarkCronFailure = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/ai/client', () => ({ generateTextWithMetadata: mockedGenerateTextWithMetadata }));
vi.mock('@/lib/db', () => ({ getAccountContext: mockedGetAccountContext }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedMarkCronStarted,
  markCronSuccess: mockedMarkCronSuccess,
  markCronFailure: mockedMarkCronFailure,
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const { GET } = await import('@/app/api/cron/process-generation-jobs/route');

beforeEach(() => {
  vi.clearAllMocks();
  mockedMarkCronStarted.mockResolvedValue(undefined);
  mockedMarkCronSuccess.mockResolvedValue(undefined);
  mockedMarkCronFailure.mockResolvedValue(undefined);
});

describe('process generation jobs cron', () => {
  it('increments version when writing generated content from queue jobs', async () => {
    mockedPrisma.generationJob.findMany.mockResolvedValue([
      {
        id: 101,
        account_name: 'Acme Foods',
        campaign_id: null,
        persona_name: null,
        content_type: 'one_pager',
      },
    ]);
    mockedGetAccountContext.mockResolvedValue({
      account: {
        name: 'Acme Foods',
        parent_brand: null,
        vertical: 'Manufacturing',
        why_now: null,
        primo_angle: null,
        best_intro_path: null,
        priority_score: 91,
        tier: 'Tier 1',
        priority_band: 'A',
      },
      meetingBrief: null,
    });
    mockedGenerateTextWithMetadata.mockResolvedValue({
      provider: 'ai_gateway',
      text: JSON.stringify({
        headline: 'H',
        subheadline: 'S',
        painPoints: [],
        solutionSteps: [],
        outcomes: [],
        proofStats: [],
        customerQuote: 'Q',
        bestFit: 'B',
        publicContext: 'C',
      }),
    });
    mockedPrisma.generatedContent.findFirst.mockResolvedValue({ version: 4 });
    mockedPrisma.generatedContent.create.mockResolvedValue({});
    mockedPrisma.generationJob.update.mockResolvedValue({});

    const res = await GET(new NextRequest('http://localhost/api/cron/process-generation-jobs?secret=test-cron-secret'));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(mockedPrisma.generatedContent.findFirst).toHaveBeenCalledWith({
      where: {
        account_name: 'Acme Foods',
        content_type: 'one_pager',
        campaign_id: null,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    expect(mockedPrisma.generatedContent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        account_name: 'Acme Foods',
        version: 5,
      }),
    });
  });
});
