import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockedPrisma = {
  generationJob: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { POST } = await import('@/app/api/ai/generation-jobs/[id]/retry/route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generation job retry API', () => {
  it('requeues a failed job', async () => {
    mockedPrisma.generationJob.findUnique.mockResolvedValue({
      id: 9,
      status: 'failed',
      retry_count: 2,
    });
    mockedPrisma.generationJob.update.mockResolvedValue({});

    const res = await POST(
      new NextRequest('http://localhost/api/ai/generation-jobs/9/retry', { method: 'POST' }),
      { params: Promise.resolve({ id: '9' }) },
    );
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual({ success: true, id: 9 });
    expect(mockedPrisma.generationJob.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null,
        provider_used: null,
      },
    });
  });

  it('rejects retries for non-failed jobs', async () => {
    mockedPrisma.generationJob.findUnique.mockResolvedValue({
      id: 3,
      status: 'completed',
      retry_count: 0,
    });

    const res = await POST(
      new NextRequest('http://localhost/api/ai/generation-jobs/3/retry', { method: 'POST' }),
      { params: Promise.resolve({ id: '3' }) },
    );

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'Only failed jobs can be retried' });
    expect(mockedPrisma.generationJob.update).not.toHaveBeenCalled();
  });
});
