import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

process.env.QUEUE_AGENT_SECRET = 'test-secret';

const mockedSendQueueItem = vi.fn();

const mockedFindUnique = vi.fn();

vi.mock('@/lib/queue/send', () => ({ sendQueueItem: mockedSendQueueItem }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));
// Non-sequence item -> onSendOutcome's scheduleNextStep is a no-op.
vi.mock('@/lib/prisma', () => ({
  prisma: { draftQueueItem: { findUnique: mockedFindUnique } },
}));

const { POST } = await import('@/app/api/cron/queue/[id]/send/route');

const sendResult = { status: 'sent', providerMessageId: 'm1', threadId: 't1' };

function makeReq(opts: { headers?: Record<string, string> } = {}) {
  return new NextRequest('http://localhost/api/cron/queue/5/send', {
    method: 'POST',
    headers: { ...(opts.headers ?? {}) },
  });
}

describe('POST /api/cron/queue/:id/send (Clawd send one)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSendQueueItem.mockResolvedValue(sendResult);
    mockedFindUnique.mockResolvedValue({ id: 5, sequence_id: null });
  });

  it('rejects with 401 when no Authorization header is present (sendQueueItem not called)', async () => {
    const res = await POST(makeReq(), { params: Promise.resolve({ id: '5' }) });
    expect(res.status).toBe(401);
    expect(mockedSendQueueItem).not.toHaveBeenCalled();
  });

  it('returns 200 with the send result for a valid bearer call and sends id 5', async () => {
    const res = await POST(makeReq({ headers: { authorization: 'Bearer test-secret' } }), {
      params: Promise.resolve({ id: '5' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual(sendResult);
    expect(mockedSendQueueItem).toHaveBeenCalledTimes(1);
    expect(mockedSendQueueItem.mock.calls[0][0]).toBe(5);
  });
});
