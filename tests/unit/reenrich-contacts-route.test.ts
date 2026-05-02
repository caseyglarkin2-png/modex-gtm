import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.CRON_SECRET = 'test-cron-secret';

const mockedRunReenrichContactsCron = vi.fn();

vi.mock('@/lib/cron/reenrich-contacts', () => ({
  runReenrichContactsCron: mockedRunReenrichContactsCron,
}));

const { GET } = await import('@/app/api/cron/reenrich-contacts/route');

describe('reenrich contacts route', () => {
  it('rejects missing auth header', async () => {
    const response = await GET(new NextRequest('http://localhost/api/cron/reenrich-contacts'));
    expect(response.status).toBe(401);
  });

  it('returns success payload for authorized requests', async () => {
    mockedRunReenrichContactsCron.mockResolvedValue({
      status: 'ok',
      stats: { considered: 2, stale: 1, matched: 1, noMatch: 0, noLocal: 0, errors: 0 },
    });
    const response = await GET(
      new NextRequest('http://localhost/api/cron/reenrich-contacts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ status: 'ok' });
  });

  it('returns 500 for error result', async () => {
    mockedRunReenrichContactsCron.mockResolvedValue({ status: 'error', error: 'boom' });
    const response = await GET(
      new NextRequest('http://localhost/api/cron/reenrich-contacts', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
    expect(response.status).toBe(500);
  });
});
