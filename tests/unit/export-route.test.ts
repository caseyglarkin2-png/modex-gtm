import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockedDb = {
  dbGetAccounts: vi.fn(),
  dbGetMeetings: vi.fn(),
  dbGetActivities: vi.fn(),
  dbGetMicrositeEngagements: vi.fn(),
  dbGetOutreachWaves: vi.fn(),
};

const mockedAttribution = {
  deriveAttributionView: vi.fn(),
  getContentAttributionRows: vi.fn(),
  summarizeContentAttribution: vi.fn(),
};

vi.mock('@/lib/db', () => mockedDb);
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/microsites/analytics', () => ({
  buildMicrositeSessionSignals: vi.fn().mockReturnValue({
    proposalViewed: false,
    roiViewed: false,
    exportClicked: false,
  }),
}));
vi.mock('@/lib/microsites/proposal', () => ({
  renderMicrositeProposalHtml: vi.fn(),
  resolveMicrositeProposalBrief: vi.fn(),
}));
vi.mock('@/lib/analytics/content-attribution', () => mockedAttribution);

const { GET } = await import('@/app/api/export/route');

describe('export route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports content attribution csv', async () => {
    mockedAttribution.deriveAttributionView.mockReturnValue('provider');
    mockedAttribution.getContentAttributionRows.mockResolvedValue([{ contentVersionId: 1 }]);
    mockedAttribution.summarizeContentAttribution.mockReturnValue([
      {
        view: 'provider',
        bucket: 'ai_gateway',
        sends: 22,
        replies: 5,
        meetings: 2,
        pipelineMovements: 3,
        replyRatePct: 22.73,
        meetingRatePct: 9.09,
        estimatedDealValue: 120000,
        confidence: 'medium',
      },
    ]);

    const req = new NextRequest('http://localhost/api/export?type=content-attribution&view=provider');
    const res = await GET(req);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    expect(res.headers.get('content-disposition')).toContain('industry-event-content-attribution-provider.csv');
    expect(text).toContain('Bucket');
    expect(text).toContain('ai_gateway');
    expect(text).toContain('22');
  });

  it('returns helpful invalid type message including content-attribution', async () => {
    const req = new NextRequest('http://localhost/api/export?type=bad');
    const res = await GET(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toContain('content-attribution');
  });
});
