import { describe, it, expect, vi, beforeEach } from 'vitest';

const getForPage = vi.fn();
const upsertForPage = vi.fn();
vi.mock('@/lib/for/store', () => ({ getForPage: (...a: unknown[]) => getForPage(...a), upsertForPage: (...a: unknown[]) => upsertForPage(...a) }));

import { POST } from '@/app/api/for/ingest/route';
import { GET } from '@/app/api/for/pack/[slug]/route';

const TOKEN = 'test-token';
beforeEach(() => { process.env.POUNCE_INGEST_TOKEN = TOKEN; getForPage.mockReset(); upsertForPage.mockReset(); });

function req(url: string, init: RequestInit & { token?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.token) headers.set('x-pounce-token', init.token);
  return new Request(url, { ...init, headers });
}

describe('POST /api/for/ingest', () => {
  it('401s without the token', async () => {
    const res = await POST(req('http://x/api/for/ingest/', { method: 'POST', body: '{}' }) as never);
    expect(res.status).toBe(401);
  });
  it('upserts a valid row', async () => {
    upsertForPage.mockResolvedValue(undefined);
    const row = { slug: 'acme', status: 'live', pack: {}, snap: {}, override: {} };
    const res = await POST(req('http://x/api/for/ingest/', { method: 'POST', token: TOKEN, body: JSON.stringify({ row }) }) as never);
    expect(res.status).toBe(200);
    expect(upsertForPage).toHaveBeenCalledWith(expect.objectContaining({ slug: 'acme' }));
  });
  it('400s a row with no slug', async () => {
    const res = await POST(req('http://x/api/for/ingest/', { method: 'POST', token: TOKEN, body: JSON.stringify({ row: { status: 'live' } }) }) as never);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/for/pack/[slug]', () => {
  it('404s an unknown slug', async () => {
    getForPage.mockResolvedValue(null);
    const res = await GET(req('http://x/api/for/pack/nope/', { token: TOKEN }) as never, { params: Promise.resolve({ slug: 'nope' }) });
    expect(res.status).toBe(404);
  });
  it('returns the row', async () => {
    getForPage.mockResolvedValue({ slug: 'acme', status: 'live', pack: {}, snap: {}, override: {}, geo: null, demoPack: null });
    const res = await GET(req('http://x/api/for/pack/acme/', { token: TOKEN }) as never, { params: Promise.resolve({ slug: 'acme' }) });
    expect(res.status).toBe(200);
    expect((await res.json()).row.slug).toBe('acme');
  });
});
