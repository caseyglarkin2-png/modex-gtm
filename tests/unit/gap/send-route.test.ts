import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = { value: null as null | { user: { email: string } } };
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
const send = vi.fn(async () => ({ ok: true, alreadySent: false, sent: { gmailSentMessageId: 'm' }, humanAction: 'recorded' }));
vi.mock('@/lib/gap/execution/seller-send', () => ({ sendSellerEmail: (...a: unknown[]) => (send as any)(...a) }));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gap/decisions/[id]/send/route';

const HASH = 'a'.repeat(64);
const req = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('https://modex-gtm.vercel.app/api/gap/decisions/dec-1/send', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });
const ctx = { params: Promise.resolve({ id: 'dec-1' }) };

beforeEach(() => {
  send.mockClear();
  session.value = null;
  process.env.CRON_SECRET = 'cron-secret';
  process.env.QUEUE_AGENT_SECRET = 'agent-secret';
});

describe('POST /api/gap/decisions/[id]/send: only an authenticated person can send', () => {
  it('unauthenticated caller: 401, the send service is never reached', async () => {
    const r = await POST(req({ confirm: { contentHash: HASH, recipient: 'a@b.com' } }), ctx);
    expect(r.status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it.each<Record<string, string>>([
    { authorization: 'Bearer cron-secret' },
    { 'x-cron-secret': 'cron-secret' },
    { 'x-gap-token': 'cron-secret' },
    { authorization: 'Bearer agent-secret' },
  ])('an agent/API/cron token (%j) cannot send: 401', async (headers) => {
    const r = await POST(req({ confirm: { contentHash: HASH, recipient: 'a@b.com' } }, headers), ctx);
    expect(r.status).toBe(401);
    expect(send).not.toHaveBeenCalled();
  });

  it('a signed-in Casey confirmation reaches the service with his session email as actor', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    const r = await POST(req({ confirm: { contentHash: HASH, recipient: 'joey.maggard@kroger.com' } }), ctx);
    expect(r.status).toBe(201);
    expect((send.mock.calls[0] as any[])[1]).toMatchObject({ decisionId: 'dec-1', actor: 'casey@freightroll.com', confirm: { contentHash: HASH, recipient: 'joey.maggard@kroger.com' } });
  });

  it('extra recipients or unknown fields are rejected (exactly one recipient, strict body)', async () => {
    session.value = { user: { email: 'casey@freightroll.com' } };
    expect((await POST(req({ confirm: { contentHash: HASH, recipient: 'a@b.com', cc: ['x@y.com'] } }), ctx)).status).toBe(400);
    expect((await POST(req({ confirm: { contentHash: HASH, recipient: 'a@b.com, c@d.com' } }), ctx)).status).toBe(400);
    expect((await POST(req({ to: 'x@y.com' }), ctx)).status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
