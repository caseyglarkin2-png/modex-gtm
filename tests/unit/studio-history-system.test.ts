/**
 * Closeout review (security): the __system__ generated_content rows (a
 * plaintext Google refresh token written on every sign-in, webhook dead
 * letters) were readable by any signed-in user through
 * GET /api/studio/history?account=__system__. The write is gone and the
 * route never serves __system__.
 */
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const findMany = vi.fn(async () => [{ id: 1, content_type: 'google_refresh_token', persona_name: null, created_at: new Date(), content: '1//secret' }]);
vi.mock('@/lib/prisma', () => ({ prisma: { generatedContent: { findMany } } }));

const { GET } = await import('@/app/api/studio/history/route');

describe('studio history never serves system rows', () => {
  it.each(['__system__', ' __system__ ', '__SYSTEM__'])('?account=%s answers an empty history without reading', async (account) => {
    findMany.mockClear();
    const res = await GET(new NextRequest(`https://modex-gtm.vercel.app/api/studio/history?account=${encodeURIComponent(account)}`));
    expect(await res.json()).toEqual({ history: [] });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('a real account still reads its history', async () => {
    findMany.mockClear();
    await GET(new NextRequest('https://modex-gtm.vercel.app/api/studio/history?account=Kroger'));
    expect(findMany).toHaveBeenCalledTimes(1);
  });
});

describe('the Google sign-in no longer writes a plaintext refresh token', () => {
  it('auth.ts writes no __system__ google_refresh_token row (the per-user encrypted store remains)', () => {
    const src = readFileSync('src/lib/auth.ts', 'utf8');
    expect(src).not.toMatch(/google_refresh_token/);
    expect(src).toMatch(/storeRefreshTokenForUser/);
  });
});
