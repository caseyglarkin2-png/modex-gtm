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

// Idempotency. dfb110d4 added claimDailyRun/releaseDailyRun to the route so a
// nudged or retried cron on the same day cannot re-send a batch. The test was
// last touched by c2555fb9 — the commit that CREATED it — so it never learned
// about the new dependency, hit the real implementation, and the route no-opped
// at the claim before ever reaching dispatch. That is why dispatchMock was
// called 0 times: the guard is correct, the test was blind to it.
type ClaimResultShape = { claimed: boolean; reason?: string; key: string };
const claimMock = vi.fn(
  async (): Promise<ClaimResultShape> => ({ claimed: true, key: 'dispatch-daily:test' }),
);
const releaseMock = vi.fn(async () => {});
vi.mock('@/lib/cron-idempotency', () => ({
  claimDailyRun: (...a: unknown[]) => claimMock(...(a as [])),
  releaseDailyRun: (...a: unknown[]) => releaseMock(...(a as [])),
}));

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
    claimMock.mockResolvedValue({ claimed: true, key: 'dispatch-daily:test' });
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

  // The safety property dfb110d4 shipped and nothing tested: a second run on the
  // same day must NOT hand another batch to Clawd. Without this, the only thing
  // standing between a retried cron and duplicate outbound email is a guard with
  // no test.
  it('does not dispatch twice when the day is already claimed', async () => {
    claimMock.mockResolvedValue({ claimed: false, reason: 'already ran today', key: 'dispatch-daily:test' });
    const { GET } = await import('@/app/api/cron/dispatch-daily/route');
    const res = await GET(new Request('http://x/api/cron/dispatch-daily', { headers: { Authorization: 'Bearer s' } }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(body.dispatched).toBe(0);
    expect(body.reason).toBe('already ran today');
  });

  it('no-ops when flag off', async () => {
    process.env.AUTO_DISPATCH_DAILY_ENABLED = 'false';
    const { GET } = await import('@/app/api/cron/dispatch-daily/route');
    const res = await GET(new Request('http://x', { headers: { Authorization: 'Bearer s' } }));
    expect((await res.json()).skipped).toBe(true);
    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
