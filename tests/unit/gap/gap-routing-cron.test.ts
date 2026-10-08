/**
 * X02 (GAP OS sales execution engine, 2026-10-08): routing on a schedule. The live Work page on 2026-10-08 led with
 * "recommendations refreshed 3d ago" and told the seller to run routing from a lane: routing had no schedule. This
 * cron runs the same apply-mode routing pass the lane button runs (automatic, reversible, internal preparation under
 * amendment 1: it creates cards only, contacts no one), once per day under the daily claim, over the routable
 * hypothesis scope, before the briefing hour. Pinned: unauthorized is 401; a flag off answers the skip payload and runs
 * nothing; a second call the same day skips; a scope too large or empty skips with its reason and releases nothing;
 * a routing failure releases the claim so a retry can run; the run is never a dry run and the actor names the cron.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  run: vi.fn(),
  scope: vi.fn(),
  claim: vi.fn(),
  release: vi.fn(async () => undefined),
  started: vi.fn(async () => undefined),
  success: vi.fn(async () => undefined),
  skipped: vi.fn(async () => undefined),
  failure: vi.fn(async () => undefined),
}));

vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'route-prisma' } }));
vi.mock('@/lib/cron-idempotency', () => ({ claimDailyRun: h.claim, releaseDailyRun: h.release }));
vi.mock('@/lib/cron-monitor', () => ({ markCronStarted: h.started, markCronSuccess: h.success, markCronSkipped: h.skipped, markCronFailure: h.failure }));
vi.mock('@/lib/gap/routing/run', () => ({
  DEFAULT_MAX_PAIRS: 400,
  createHubSpotSnapshotProvider: vi.fn(() => ({ __tag: 'snapshot' })),
  resolveRoutableHypothesisScope: h.scope,
  runRouting: h.run,
}));
vi.mock('@/lib/gap/routing/interactive', () => ({ hubspotReads: {} }));
vi.mock('@/lib/gap/routing/suppression-read', () => ({ createClawdSuppressionReader: vi.fn(() => ({ __tag: 'suppression' })) }));
vi.mock('@/lib/hubspot/client', () => ({ isHubSpotConfigured: () => true }));

const { GET } = await import('@/app/api/cron/gap-routing/route');

const req = (auth = true) => new Request('http://localhost/api/cron/gap-routing', { headers: auth ? { authorization: 'Bearer test-cron-secret' } : {} });

describe('X02: the routing cron', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-cron-secret';
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    process.env.GAP_ROUTING_CRON_ENABLED = 'true';
    h.run.mockReset();
    h.scope.mockReset();
    h.claim.mockReset();
    h.release.mockClear();
    h.skipped.mockClear();
    h.success.mockClear();
    h.failure.mockClear();
    h.claim.mockResolvedValue({ claimed: true, key: 'cron-run:gap-routing:2026-10-08' });
    h.scope.mockResolvedValue({ accountNames: ['PepsiCo', 'Kroger'], hypothesesCount: 3 });
    h.run.mockResolvedValue({ runId: 'r1', mode: 'shadow', accountsScanned: 2, pairs: 4, decisions: 4, skips: {}, byRule: {}, byAction: {}, failed: [], dryRun: false });
  });

  it('401 without the cron secret', async () => {
    const res = await GET(req(false));
    expect(res.status).toBe(401);
    expect(h.run).not.toHaveBeenCalled();
  });

  it('the flag off answers the skip payload and runs nothing', async () => {
    process.env.GAP_ROUTING_CRON_ENABLED = 'false';
    const res = await GET(req());
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_CRON_ENABLED=false' });
    expect(h.run).not.toHaveBeenCalled();
    expect(h.claim).not.toHaveBeenCalled();
  });

  it('runs the apply-mode pass over the routable scope once per day, as the cron, never a dry run', async () => {
    const res = await GET(req());
    const body = await res.json();
    expect(body.decisions).toBe(4);
    expect(h.claim).toHaveBeenCalledWith('gap-routing', expect.any(Date));
    expect(h.run).toHaveBeenCalledTimes(1);
    const [, opts, deps] = h.run.mock.calls[0];
    expect(opts).toMatchObject({ dryRun: false, actor: 'cron:gap-routing', accountNames: ['PepsiCo', 'Kroger'], maxPairs: 400 });
    expect(deps.suppression).toEqual({ __tag: 'suppression' });
    expect(h.success).toHaveBeenCalledTimes(1);
    expect(h.release).not.toHaveBeenCalled();
  });

  it('a second call the same day skips (already ran) and runs nothing', async () => {
    h.claim.mockResolvedValue({ claimed: false, reason: 'already-ran-today', key: 'k' });
    const res = await GET(req());
    expect(await res.json()).toMatchObject({ skipped: true, reason: 'already-ran-today' });
    expect(h.run).not.toHaveBeenCalled();
    expect(h.skipped).toHaveBeenCalledTimes(1);
  });

  it('an empty or too-large scope skips with its reason and releases the claim for a later run', async () => {
    h.scope.mockResolvedValue({ accountNames: [], hypothesesCount: 0 });
    let res = await GET(req());
    expect(await res.json()).toMatchObject({ skipped: true, reason: 'no_routable_hypotheses' });
    expect(h.run).not.toHaveBeenCalled();
    expect(h.release).toHaveBeenCalledWith('gap-routing', expect.any(Date));

    h.scope.mockResolvedValue({ tooLarge: true, accountCount: 900, cap: 500 });
    res = await GET(req());
    expect(await res.json()).toMatchObject({ skipped: true, reason: 'routable_scope_too_large', accountCount: 900 });
    expect(h.run).not.toHaveBeenCalled();
  });

  it('a routing failure releases the claim (a retry may run), records the failure and answers 500', async () => {
    h.run.mockRejectedValue(new Error('hubspot timeout'));
    const res = await GET(req());
    expect(res.status).toBe(500);
    expect(h.release).toHaveBeenCalledWith('gap-routing', expect.any(Date));
    expect(h.failure).toHaveBeenCalledTimes(1);
  });
});
