/**
 * GET /api/gap/replies and POST /api/gap/replies/[id]/suggest (GAP
 * Prospecting OS, Sprint 4, S4-T3). Services are module mocks; this pins
 * the gates (the suggest route also needs GAP_REPLY_CLASSIFICATION_ENABLED
 * and answers the typed 404 skip when it is off), auth, the query parsing,
 * and that the production AI client is what the route injects.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockedAuth, mockedList, mockedSuggest, mockedGenerate } = vi.hoisted(() => ({
  mockedAuth: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedList: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedSuggest: vi.fn<(...args: any[]) => Promise<any>>(),
  mockedGenerate: vi.fn<(...args: any[]) => Promise<any>>(),
}));

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: { __tag: 'fake-prisma' } }));
vi.mock('@/lib/ai/client', () => ({ generateText: mockedGenerate }));
vi.mock('@/lib/gap/replies/list', () => ({ listReplies: mockedList }));
vi.mock('@/lib/gap/replies/suggest', () => ({ suggestReply: mockedSuggest }));

const { GET } = await import('@/app/api/gap/replies/route');
const { POST: SUGGEST } = await import('@/app/api/gap/replies/[id]/suggest/route');

const BASE = 'http://localhost/api/gap/replies';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET'] as const;
const PAGE = { items: [{ id: 'm5', snippet: 'hi' }], nextCursor: 'm5' };

function get(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { method: 'GET', headers });
}

function suggest(id: string, opts: { url?: string; headers?: Record<string, string> } = {}) {
  const req = new NextRequest(opts.url ?? `${BASE}/${encodeURIComponent(id)}/suggest`, { method: 'POST', headers: opts.headers ?? {} });
  return SUGGEST(req, { params: Promise.resolve({ id: encodeURIComponent(id) }) });
}

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_REPLY_CLASSIFICATION_ENABLED = 'true';
  process.env.CRON_SECRET = 'cron-secret-value';
  delete process.env.QUEUE_AGENT_SECRET;
  mockedAuth.mockReset();
  mockedAuth.mockResolvedValue(SESSION);
  mockedList.mockReset();
  mockedList.mockResolvedValue(PAGE);
  mockedSuggest.mockReset();
  mockedSuggest.mockResolvedValue({ ok: true, suggestion: { id: 'D_ai', responseClass: 'timing', bids: [], why: 'Q1' } });
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe('GET /api/gap/replies', () => {
  it('404 skip payload when GAP_OS_ENABLED is off, before auth', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await GET(get(BASE));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
  });

  it('401 without a session or header token; `?secret=` never counts', async () => {
    mockedAuth.mockResolvedValue(null);
    expect((await GET(get(`${BASE}?secret=cron-secret-value`))).status).toBe(401);
    expect(mockedList).not.toHaveBeenCalled();
  });

  it('defaults to undispositioned, passes state, cursor and limit through, returns the page', async () => {
    let res = await GET(get(BASE));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PAGE);
    expect(mockedList.mock.calls[0]).toEqual([{ __tag: 'fake-prisma' }, { state: 'undispositioned', cursor: null, limit: undefined }]);

    res = await GET(get(`${BASE}?state=all&cursor=m5&limit=10`));
    expect(mockedList.mock.calls[1][1]).toEqual({ state: 'all', cursor: 'm5', limit: 10 });
  });

  it('a header token reads too; a bad state is 400 invalid_query', async () => {
    mockedAuth.mockResolvedValue(null);
    expect((await GET(get(BASE, { 'x-cron-secret': 'cron-secret-value' }))).status).toBe(200);
    mockedAuth.mockResolvedValue(SESSION);
    const res = await GET(get(`${BASE}?state=pending`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'state' });
  });
});

describe('POST /api/gap/replies/[id]/suggest', () => {
  it('404 skip naming GAP_REPLY_CLASSIFICATION_ENABLED when only that flag is off, before auth', async () => {
    process.env.GAP_REPLY_CLASSIFICATION_ENABLED = 'false';
    const res = await suggest('m5');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_REPLY_CLASSIFICATION_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
    expect(mockedSuggest).not.toHaveBeenCalled();
  });

  it('404 skip naming GAP_OS_ENABLED when the master switch is off', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const res = await suggest('m5');
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
  });

  it('401 without auth; 200 with the suggestion, the production AI client injected, the id decoded', async () => {
    mockedAuth.mockResolvedValue(null);
    expect((await suggest('m5')).status).toBe(401);
    mockedAuth.mockResolvedValue(SESSION);
    const res = await suggest('hs:44');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestion: { id: 'D_ai', responseClass: 'timing', bids: [], why: 'Q1' } });
    expect(mockedSuggest.mock.calls[0]).toEqual([{ __tag: 'fake-prisma' }, mockedGenerate, 'hs:44']);
  });

  it('a rejected model answer is 200 with suggestion null and the reason', async () => {
    mockedSuggest.mockResolvedValue({ ok: true, suggestion: null, rejected: 'quote_not_found:0' });
    const res = await suggest('m5');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ suggestion: null, rejected: 'quote_not_found:0' });
  });

  it('404 not_found for an unknown inbound id, 409 for the other refusals', async () => {
    mockedSuggest.mockResolvedValue({ ok: false, reason: 'not_found' });
    let res = await suggest('nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not_found' });
    mockedSuggest.mockResolvedValue({ ok: false, reason: 'already_dispositioned' });
    res = await suggest('m5');
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'already_dispositioned' });
  });
});
