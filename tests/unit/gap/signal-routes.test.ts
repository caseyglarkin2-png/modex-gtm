/**
 * Share to GAP routes are session-only: no token, no unauthenticated write
 * (the iPhone Shortcut opens the page; the page's session does the save).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { session, capture, flag } = vi.hoisted(() => ({
  session: { value: null as null | { user: { email: string } } },
  capture: vi.fn(),
  flag: { off: false },
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => (flag.off ? { error: 'not_found' } : null) }));
vi.mock('@/lib/gap/signals/intake', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/signals/intake')>()), captureSignal: capture }));
vi.mock('@/lib/gap/signals/ops', async (orig) => ({ ...(await orig<typeof import('@/lib/gap/signals/ops')>()), loadSignal: vi.fn(async () => ({ id: 'sig-1', status: 'Researching' })) }));

import { POST } from '@/app/api/gap/signal-intake/route';

const req = (body: unknown, headers: Record<string, string> = {}) => new NextRequest('http://localhost/api/gap/signal-intake', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });

describe('POST /api/gap/signal-intake', () => {
  beforeEach(() => {
    session.value = null;
    flag.off = false;
    capture.mockReset();
  });

  it('no session: 401, even with a pounce-style token; nothing captured', async () => {
    const r = await POST(req({ url: 'https://a.com/x' }, { 'x-pounce-token': 'anything' }));
    expect(r.status).toBe(401);
    expect(capture).not.toHaveBeenCalled();
  });

  it('flag off: 404', async () => {
    flag.off = true;
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect((await POST(req({ url: 'https://a.com/x' }))).status).toBe(404);
  });

  it('a link is a casey_share; a note with no link is a conference note; the actor is the session', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    capture.mockResolvedValue({ ok: true, signal: { id: 'sig-1', created: true } });
    expect((await POST(req({ url: 'https://a.com/x', account: 'PepsiCo', note: 'Gatik angle' }))).status).toBe(201);
    expect(capture).toHaveBeenLastCalledWith({}, expect.objectContaining({ url: 'https://a.com/x', accountHint: 'PepsiCo', note: 'Gatik angle', origin: 'casey_share', actor: 'casey@freightroll.com' }));
    await POST(req({ note: 'VP Ops said visibility is site-by-site', account: 'PepsiCo', kind: 'conference' }));
    expect(capture).toHaveBeenLastCalledWith({}, expect.objectContaining({ url: null, origin: 'conference_note' }));
  });

  it('unknown fields (categories, score, evidence) are refused: Casey never fills research metadata and cannot inject it', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect((await POST(req({ url: 'https://a.com/x', score: 99, categories: ['yard_direct'] }))).status).toBe(400);
    expect(capture).not.toHaveBeenCalled();
  });
});
