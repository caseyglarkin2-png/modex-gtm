import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = { value: null as null | { user: { email: string } } };
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/gap/flags', () => ({ assertGapEnabled: () => null }));
const load = vi.fn();
vi.mock('@/lib/gap/health/load', () => ({ loadHealthInputs: (...a: unknown[]) => load(...a) }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gap/health/route';

const healthReq = () => new NextRequest('http://localhost/api/gap/health');

beforeEach(() => {
  load.mockReset();
  session.value = { user: { email: 'casey@freightroll.com' } };
});

describe('GET /api/gap/health', () => {
  it('no session: 401, nothing probed', async () => {
    session.value = null;
    expect((await GET(healthReq())).status).toBe(401);
    expect(load).not.toHaveBeenCalled();
  });

  it('returns the evaluated report, uncached', async () => {
    load.mockResolvedValue({
      mailbox: { senderConfigured: true, lastSuccessAt: new Date(), lastFailureAt: null, consecutiveFailures: 0, lastMessage: null },
      hubspot: { configured: false, ok: false, ms: null, error: null },
      suppression: { configured: true, verdict: 'clear', ms: 10, error: null },
      sender: { configured: true, mailbox: 'casey@yardflow.ai' },
      routing: { lastRunAt: new Date() },
    });
    const res = await GET(healthReq());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body).toMatchObject({ overall: 'BLOCKED', headline: 'HubSpot opportunity truth unavailable · cold actions fail closed' });
    expect(body.components).toHaveLength(8);
  });
});
