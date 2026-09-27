import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = { value: null as null | { user: { email: string } } };
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
const check = vi.fn();
vi.mock('@/lib/gap/execution/cold-outbound', () => ({ checkColdOutbound: (...a: unknown[]) => check(...a) }));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gap/decisions/[id]/outbound-check/route';

const req = (body: unknown) =>
  new NextRequest('https://modex-gtm.vercel.app/api/gap/decisions/dec-1/outbound-check', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const ctx = { params: Promise.resolve({ id: 'dec-1' }) };

beforeEach(() => {
  check.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('POST /api/gap/decisions/[id]/outbound-check', () => {
  it('no session: 401, the check never runs', async () => {
    session.value = null;
    expect((await POST(req({ channel: 'call' }), ctx)).status).toBe(401);
    expect(check).not.toHaveBeenCalled();
  });

  it('a channel other than call or linkedin is 400', async () => {
    expect((await POST(req({ channel: 'email' }), ctx)).status).toBe(400);
    expect(check).not.toHaveBeenCalled();
  });

  it('CLEAR: 200 with the released link', async () => {
    check.mockResolvedValue({ ok: true, channel: 'call', href: 'tel:5551234567' });
    const r = await POST(req({ channel: 'call' }), ctx);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, channel: 'call', href: 'tel:5551234567' });
    expect(check.mock.calls[0][1]).toMatchObject({ decisionId: 'dec-1', channel: 'call' });
  });

  it.each(['active_opportunity', 'opportunity_unknown'])('%s: 409 with the seller copy and no link', async (reason) => {
    check.mockResolvedValue({ ok: false, reason, message: 'copy' });
    const r = await POST(req({ channel: 'linkedin' }), ctx);
    expect(r.status).toBe(409);
    const body = await r.json();
    expect(body).toMatchObject({ ok: false, reason, message: 'copy' });
    expect(body).not.toHaveProperty('href');
  });

  it('the check itself throwing is UNKNOWN (409), never a link', async () => {
    check.mockRejectedValue(new Error('db down'));
    const r = await POST(req({ channel: 'call' }), ctx);
    expect(r.status).toBe(409);
    expect(await r.json()).toMatchObject({ ok: false, reason: 'opportunity_unknown' });
  });
});
