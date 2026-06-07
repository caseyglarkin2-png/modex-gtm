import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/cron-auth', () => ({ isAuthorizedCronRequest: vi.fn(() => true) }));

const prismaMock = {
  emailLog: { findMany: vi.fn(async () => [{ account_name: 'Staples' }]) },
  draftQueueItem: { findMany: vi.fn(async () => []) },
};
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('@/lib/discovery/data', () => ({
  loadLatestScored: () => ({ prospects: [] }),
  buildCuratedRows: () => [
    { name: 'Niagara', cityState: 'Ontario, CA', segment: 'shipper', tier: 'A', nearestPrimoName: 'Ontario', nearestPrimoDistance: 0.3, corridor: 'Ontario, CA', icpScore: 95, excluded: false, isExistingAccount: false },
    { name: 'Staples', cityState: 'Ontario, CA', segment: 'shipper', tier: 'A', nearestPrimoName: 'Ontario', nearestPrimoDistance: 1.8, corridor: 'Ontario, CA', icpScore: 80, excluded: false, isExistingAccount: false },
  ],
}));
vi.mock('@/lib/discovery/enrich', () => ({ enrichRowsWithPipeline: async (r: any) => r }));

const dispatchMock = vi.fn(async () => ({ ok: true, accepted: 1, batchId: 'wf_x' }));
vi.mock('@/lib/discovery/clawd-dispatch', () => ({
  prepareClawdDispatch: (owner: string, rows: any[]) => ({
    ok: true,
    payload: { owner, requestedBy: owner, source: 'discovery-worklist', targets: rows },
  }),
  dispatchDraftBatch: dispatchMock,
}));

describe('dispatch-daily cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTO_DISPATCH_DAILY_ENABLED = 'true';
    prismaMock.emailLog.findMany.mockResolvedValue([{ account_name: 'Staples' }]);
    prismaMock.draftQueueItem.findMany.mockResolvedValue([]);
  });

  it('dispatches the fresh top-N when enabled + authorized', async () => {
    const { GET } = await import('@/app/api/cron/dispatch-daily/route');
    const res = await GET(new Request('http://x/api/cron/dispatch-daily', { headers: { Authorization: 'Bearer s' } }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(dispatchMock).toHaveBeenCalledOnce();
    // Staples already emailed -> only Niagara dispatched
    expect(body.dispatched).toBe(1);
    expect(body.batchId).toBe('wf_x');
  });

  it('no-ops when flag off', async () => {
    process.env.AUTO_DISPATCH_DAILY_ENABLED = 'false';
    const { GET } = await import('@/app/api/cron/dispatch-daily/route');
    const res = await GET(new Request('http://x', { headers: { Authorization: 'Bearer s' } }));
    expect((await res.json()).skipped).toBe(true);
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
