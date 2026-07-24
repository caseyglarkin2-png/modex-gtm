import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

/* ── cron-auth: header + query-param acceptance ─────────────────────── */
import { isAuthorizedCronRequest } from '@/lib/cron-auth';

function req(opts: { headers?: Record<string, string>; url?: string } = {}) {
  return new Request(opts.url ?? 'http://localhost/api/cron/dispatch-daily', {
    headers: opts.headers ?? {},
  });
}

describe('isAuthorizedCronRequest', () => {
  const OLD = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = 'shh';
  });
  afterAll(() => {
    process.env.CRON_SECRET = OLD;
  });

  it('accepts Authorization: Bearer', () => {
    expect(isAuthorizedCronRequest(req({ headers: { authorization: 'Bearer shh' } }))).toBe(true);
  });

  it('accepts the x-cron-secret header (kept out of the URL/logs)', () => {
    expect(isAuthorizedCronRequest(req({ headers: { 'x-cron-secret': 'shh' } }))).toBe(true);
  });

  it('still accepts the legacy ?secret= query param (back-compat)', () => {
    expect(isAuthorizedCronRequest(req({ url: 'http://localhost/api/cron/dispatch-daily?secret=shh' }))).toBe(true);
  });

  it('rejects a wrong secret in any position', () => {
    expect(isAuthorizedCronRequest(req({ headers: { 'x-cron-secret': 'nope' } }))).toBe(false);
    expect(isAuthorizedCronRequest(req({ headers: { authorization: 'Bearer nope' } }))).toBe(false);
    expect(isAuthorizedCronRequest(req({ url: 'http://localhost/api/cron/dispatch-daily?secret=nope' }))).toBe(false);
  });

  it('rejects everything when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCronRequest(req({ headers: { authorization: 'Bearer shh' } }))).toBe(false);
  });
});

/* ── cron-idempotency: one claim per UTC day, releasable on failure ──── */
const created = new Set<string>();
const mockCreate = vi.fn(async ({ data }: { data: { key: string } }) => {
  if (created.has(data.key)) {
    const e = new Error('unique') as Error & { code?: string };
    e.code = 'P2002';
    throw e;
  }
  created.add(data.key);
  return { key: data.key };
});
const mockDelete = vi.fn(async ({ where }: { where: { key: string } }) => {
  created.delete(where.key);
  return { key: where.key };
});

vi.mock('@/lib/prisma', () => ({
  prisma: { systemConfig: { create: (a: unknown) => mockCreate(a as never), delete: (a: unknown) => mockDelete(a as never) } },
}));

const { claimDailyRun, releaseDailyRun, utcDayKey } = await import('@/lib/cron-idempotency');

describe('claimDailyRun', () => {
  beforeEach(() => {
    created.clear();
    mockCreate.mockClear();
    mockDelete.mockClear();
  });

  it('claims once and no-ops a same-day double-fire', async () => {
    const first = await claimDailyRun('dispatch-daily');
    const second = await claimDailyRun('dispatch-daily');
    expect(first.claimed).toBe(true);
    expect(second.claimed).toBe(false);
    expect(second.reason).toBe('already-ran-today');
  });

  it('release lets a later run re-claim (retry after a failed dispatch)', async () => {
    const first = await claimDailyRun('warm-dispatch');
    expect(first.claimed).toBe(true);
    await releaseDailyRun('warm-dispatch');
    const retry = await claimDailyRun('warm-dispatch');
    expect(retry.claimed).toBe(true);
  });

  it('fails closed (claimed=false) on an unexpected claim error', async () => {
    mockCreate.mockImplementationOnce(async () => {
      throw new Error('db down');
    });
    const res = await claimDailyRun('dispatch-daily');
    expect(res.claimed).toBe(false);
    expect(res.reason).toBe('idempotency-claim-error');
  });

  it('keys by UTC day', () => {
    expect(utcDayKey(new Date('2026-07-24T23:59:00Z'))).toBe('2026-07-24');
  });
});