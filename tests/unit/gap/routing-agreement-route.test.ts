/**
 * GET /api/gap/routing/agreement (R-B, owner-confirmed finish requirement,
 * 2026-09-24). loadAgreementReport is a module mock; this pins the gate
 * (404 skip with GAP_OS_ENABLED off), auth (session or agent token, never
 * `?secret=`), and that `?runId=` reaches the loader.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedLoad } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedLoad: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/routing/agreement-query', () => ({ loadAgreementReport: mockedLoad }));

const { GET } = await import('@/app/api/gap/routing/agreement/route');

const BASE = 'http://localhost/api/gap/routing/agreement';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;
const REPORT = { overall: { agreements: 0, disagreements: 0, rate: null, n: 0 }, byRuleId: [], byAction: [], totalDecisions: 0 };

function get(url = BASE, headers: Record<string, string> = {}) {
  return new NextRequest(url, { method: 'GET', headers });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  process.env.CRON_SECRET = 'cron-secret-value';
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedLoad.mockReset();
  mockedLoad.mockResolvedValue(REPORT);
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('GET /api/gap/routing/agreement', () => {
  it('answers the typed skip payload with GAP_OS_ENABLED off, and never calls the loader', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(get());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it('401s with no session and no agent token', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(mockedLoad).not.toHaveBeenCalled();
  });

  it('never accepts ?secret= as an auth path', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(get(`${BASE}?secret=cron-secret-value`));
    expect(res.status).toBe(401);
  });

  it('a session returns the report verbatim', async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(REPORT);
    expect(mockedLoad).toHaveBeenCalledWith(expect.anything(), { runId: null });
  });

  it('an agent bearer token authorizes without a session', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(get(BASE, { authorization: 'Bearer cron-secret-value' }));
    expect(res.status).toBe(200);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  it('?runId= reaches the loader', async () => {
    await GET(get(`${BASE}?runId=run_1`));
    expect(mockedLoad).toHaveBeenCalledWith(expect.anything(), { runId: 'run_1' });
  });
});
