import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.QUEUE_AGENT_SECRET = 'agent-secret';
process.env.CRON_SECRET = 'cron-secret';

const draftFindMany = vi.fn();
const logFindMany = vi.fn();
const accountCount = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    draftQueueItem: { findMany: draftFindMany },
    emailLog: { findMany: logFindMany },
    account: { count: accountCount },
  },
}));

const { getCampaignStats } = await import('@/lib/campaigns/stats');

beforeEach(() => {
  vi.clearAllMocks();
  accountCount.mockResolvedValue(0);
});

describe('getCampaignStats aggregation', () => {
  it('computes draft funnel, send engagement, rates, perAccount and booked', async () => {
    draftFindMany.mockResolvedValue([
      { status: 'draft', account_name: 'Acme' },
      { status: 'approved', account_name: 'Acme' },
      { status: 'sent', account_name: 'Acme' },
      { status: 'sent', account_name: 'Globex' },
      { status: 'failed', account_name: 'Globex' },
    ]);
    logFindMany.mockResolvedValue([
      { account_name: 'Acme', status: 'sent', opened_at: new Date(), reply_count: 1 },
      { account_name: 'Acme', status: 'sent', opened_at: new Date(), reply_count: 0 },
      { account_name: 'Acme', status: 'sent', opened_at: null, reply_count: 0 },
      { account_name: 'Globex', status: 'bounced', opened_at: null, reply_count: 0 },
    ]);
    accountCount.mockResolvedValue(1);

    const stats = await getCampaignStats('allentown-tour');

    expect(stats.campaign).toBe('allentown-tour');
    expect(stats.drafts).toEqual({ total: 5, draft: 1, approved: 1, sent: 2, failed: 1 });
    expect(stats.sends).toEqual({ sent: 4, opened: 2, replied: 1, bounced: 1 });
    // 2 opened / 4 sent = 0.5; 1 replied / 4 sent = 0.25
    expect(stats.openRate).toBe(0.5);
    expect(stats.replyRate).toBe(0.25);
    expect(stats.booked).toBe(1);

    // perAccount sorted by sent desc; Acme has 3 sends (2 opened, 1 replied).
    expect(stats.perAccount[0]).toEqual({ account: 'Acme', sent: 3, opened: 2, replied: 1 });
    const globex = stats.perAccount.find((a) => a.account === 'Globex');
    expect(globex).toEqual({ account: 'Globex', sent: 1, opened: 0, replied: 0 });

    expect(typeof stats.updatedAt).toBe('string');
    expect(stats.error).toBeUndefined();
  });

  it('returns a zeroed shape (rates 0) when there are no rows', async () => {
    draftFindMany.mockResolvedValue([]);
    logFindMany.mockResolvedValue([]);
    const stats = await getCampaignStats('empty');
    expect(stats.drafts.total).toBe(0);
    expect(stats.sends.sent).toBe(0);
    expect(stats.openRate).toBe(0);
    expect(stats.replyRate).toBe(0);
    expect(stats.perAccount).toEqual([]);
  });

  it('fail-soft: DB error resolves to zeros with an error note', async () => {
    draftFindMany.mockRejectedValue(new Error('db down'));
    logFindMany.mockResolvedValue([]);
    const stats = await getCampaignStats('boom');
    expect(stats.sends.sent).toBe(0);
    expect(stats.error).toBeTruthy();
  });
});

describe('GET /api/campaigns/:tag/stats route', () => {
  let GET: typeof import('@/app/api/campaigns/[tag]/stats/route').GET;
  beforeEach(async () => {
    draftFindMany.mockResolvedValue([]);
    logFindMany.mockResolvedValue([]);
    ({ GET } = await import('@/app/api/campaigns/[tag]/stats/route'));
  });

  function req(headers: Record<string, string> = {}) {
    return new Request('https://modex-gtm.vercel.app/api/campaigns/allentown-tour/stats', { headers });
  }

  it('401s without a valid credential', async () => {
    const res = await GET(req(), { params: Promise.resolve({ tag: 'allentown-tour' }) });
    expect(res.status).toBe(401);
  });

  it('accepts the queue-agent bearer and returns the stats shape', async () => {
    const res = await GET(req({ authorization: 'Bearer agent-secret' }), {
      params: Promise.resolve({ tag: 'allentown-tour' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.campaign).toBe('allentown-tour');
    expect(body).toHaveProperty('drafts');
    expect(body).toHaveProperty('sends');
    expect(body).toHaveProperty('openRate');
    expect(body).toHaveProperty('replyRate');
    expect(body).toHaveProperty('perAccount');
    expect(body).toHaveProperty('updatedAt');
  });

  it('accepts the cron secret too', async () => {
    const res = await GET(req({ authorization: 'Bearer cron-secret' }), {
      params: Promise.resolve({ tag: 'allentown-tour' }),
    });
    expect(res.status).toBe(200);
  });
});
