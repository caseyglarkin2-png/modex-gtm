import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  sendJob: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  sendJobRecipient: {
    updateMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/email/send-jobs/[id]/retry-failed/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('send-job retry-failed route', () => {
  it('returns 400 for invalid id', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/email/send-jobs/invalid/retry-failed', { method: 'POST' }),
      { params: Promise.resolve({ id: 'bad' }) },
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing job', async () => {
    mockedPrisma.sendJob.findUnique.mockResolvedValue(null);
    const res = await POST(
      new NextRequest('http://localhost/api/email/send-jobs/7/retry-failed', { method: 'POST' }),
      { params: Promise.resolve({ id: '7' }) },
    );
    expect(res.status).toBe(404);
  });

  it('resets failed recipients and marks job pending', async () => {
    mockedPrisma.sendJob.findUnique.mockResolvedValue({ id: 7 });
    mockedPrisma.sendJobRecipient.updateMany.mockResolvedValue({ count: 3 });
    mockedPrisma.sendJob.update.mockResolvedValue({});

    const res = await POST(
      new NextRequest('http://localhost/api/email/send-jobs/7/retry-failed', { method: 'POST' }),
      { params: Promise.resolve({ id: '7' }) },
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual({ success: true, resetRecipients: 3 });
    expect(mockedPrisma.sendJobRecipient.updateMany).toHaveBeenCalledWith({
      where: {
        send_job_id: 7,
        status: { in: ['failed', 'skipped'] },
      },
      data: {
        status: 'pending',
        error_message: null,
        attempted_at: null,
      },
    });
    expect(mockedPrisma.sendJob.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        status: 'pending',
        started_at: null,
        completed_at: null,
        error_message: null,
      },
    });
  });
});
