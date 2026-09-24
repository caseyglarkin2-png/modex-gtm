/**
 * GET /api/gap/call/[personaId] (GAP Prospecting OS, Sprint 4, S4-T3). The
 * brief builder is a module mock; this pins the gate, auth, the numeric id
 * check, and the 200 / 404 bodies.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedBrief } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedBrief: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/gap/replies/brief', () => ({ callBrief: mockedBrief }));

const { GET } = await import('@/app/api/gap/call/[personaId]/route');

const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;
const BRIEF = { persona: { id: 7 }, account: { name: 'Acme' }, hypothesis: null, lastDispositions: [], openBids: [], suggestedQuestions: [] };

function call(personaId: string, opts: { url?: string; headers?: Record<string, string> } = {}) {
  const req = new NextRequest(opts.url ?? `http://localhost/api/gap/call/${personaId}`, { method: 'GET', headers: opts.headers ?? {} });
  return GET(req, { params: Promise.resolve({ personaId }) });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  process.env.CRON_SECRET = 'cron-secret-value';
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedBrief.mockReset();
  mockedBrief.mockResolvedValue(BRIEF);
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('GET /api/gap/call/[personaId]', () => {
  it('404 skip payload when the flag is off, before auth', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await call('7');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it('401 without a session or header token; `?secret=` never counts', async () => {
    mockedAuth.mockResolvedValue(null);
    expect((await call('7', { url: 'http://localhost/api/gap/call/7?secret=cron-secret-value' })).status).toBe(401);
    expect(mockedBrief).not.toHaveBeenCalled();
  });

  it('200 with the brief for a session or a header token, the id parsed as a number', async () => {
    let res = await call('7');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(BRIEF);
    expect(mockedBrief).toHaveBeenCalledWith({ __tag: 'fake-prisma' }, 7);
    mockedAuth.mockResolvedValue(null);
    res = await call('7', { headers: { 'x-gap-token': 'cron-secret-value' } });
    expect(res.status).toBe(200);
  });

  it('400 invalid_query for a non-numeric id, 404 not_found for an unknown persona', async () => {
    let res = await call('jordan');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'personaId' });
    expect(mockedBrief).not.toHaveBeenCalled();
    mockedBrief.mockResolvedValue(null);
    res = await call('404');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
  });
});
