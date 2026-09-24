/**
 * GET /api/gap/learning (GAP Prospecting OS, Sprint 5). `buildLearningReport`
 * is a module mock; this pins the gate (404 skip payload with GAP_OS_ENABLED
 * off), auth (session or agent token, never `?secret=`), and that a report
 * is returned verbatim.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedBuild } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedBuild: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/learning/query', () => ({ buildLearningReport: mockedBuild }));

const { GET } = await import('@/app/api/gap/learning/route');

const BASE = 'http://localhost/api/gap/learning';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;
const REPORT = { funnel: { resolutionRate: { value: null, n: 0, numerator: 0, denominator: 0 } }, counts: { hypotheses: 0, conversations: 0 } };

function get(headers: Record<string, string> = {}) {
  return new NextRequest(BASE, { method: 'GET', headers });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  process.env.CRON_SECRET = 'cron-secret-value';
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedBuild.mockReset();
  mockedBuild.mockResolvedValue(REPORT);
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('GET /api/gap/learning', () => {
  it('answers the typed skip payload with GAP_OS_ENABLED off, and never calls the report builder', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(get());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedBuild).not.toHaveBeenCalled();
  });

  it('401s with no session and no agent token', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(mockedBuild).not.toHaveBeenCalled();
  });

  it('never accepts ?secret= as an auth path', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest(`${BASE}?secret=cron-secret-value`, { method: 'GET' }));
    expect(res.status).toBe(401);
  });

  it('a session returns the report verbatim', async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(REPORT);
  });

  it('an agent bearer token authorizes without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(get({ authorization: 'Bearer cron-secret-value' }));
    expect(res.status).toBe(200);
    expect(mockedBuild).toHaveBeenCalledTimes(1);
  });
});
