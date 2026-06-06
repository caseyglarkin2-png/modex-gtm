import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.QUEUE_AGENT_SECRET = 'test-secret';

const mockedPrisma = {
  draftQueueItem: {
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { GET } = await import('@/app/api/cron/queue/due/route');

const dueRows = [
  {
    id: 1,
    to_email: 'ops@example.com',
    status: 'approved',
    scheduled_for: new Date('2026-01-01T00:00:00.000Z'),
    subject: 'Hello',
    body: 'Body copy',
  },
  {
    id: 2,
    to_email: 'lead@example.com',
    status: 'approved',
    scheduled_for: new Date('2026-01-02T00:00:00.000Z'),
    subject: 'Hi there',
    body: 'More body copy',
  },
];

function makeReq(opts: { headers?: Record<string, string>; url?: string } = {}) {
  return new NextRequest(opts.url ?? 'http://localhost/api/cron/queue/due', {
    method: 'GET',
    headers: { ...(opts.headers ?? {}) },
  });
}

describe('GET /api/cron/queue/due (Clawd due poll)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue(dueRows);
  });

  it('rejects with 401 when no Authorization header is present (findMany not called)', async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
  });

  it('rejects the ?secret= query form with 401 (no bearer)', async () => {
    const res = await GET(makeReq({ url: 'http://localhost/api/cron/queue/due?secret=test-secret' }));
    expect(res.status).toBe(401);
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
  });

  it('returns 200 with shaped items for a valid bearer call', async () => {
    const res = await GET(makeReq({ headers: { authorization: 'Bearer test-secret' } }));
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(mockedPrisma.draftQueueItem.findMany).toHaveBeenCalledTimes(1);
    expect(payload).toEqual({
      items: [
        {
          id: 1,
          to_email: 'ops@example.com',
          scheduled_for: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          to_email: 'lead@example.com',
          scheduled_for: '2026-01-02T00:00:00.000Z',
        },
      ],
    });
    // Only id/to_email/scheduled_for are exposed — no subject/body/status leak.
    for (const item of payload.items) {
      expect(Object.keys(item).sort()).toEqual(['id', 'scheduled_for', 'to_email']);
    }
  });
});
