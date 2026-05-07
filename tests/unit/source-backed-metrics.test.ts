import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  activity: {
    create: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));

const { recordSourceBackedMetric } = await import('@/lib/source-backed/metrics');

describe('source-backed metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.activity.create.mockResolvedValue({ id: 1 });
  });

  it('writes account-scoped metric events as activity rows', async () => {
    await recordSourceBackedMetric({
      metric: 'approval_blocks',
      endpoint: '/api/email/send',
      accountName: 'Acme Foods',
      value: 2,
      details: { status: 'missing' },
    });

    expect(mockedPrisma.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        account_name: 'Acme Foods',
        activity_type: 'Agent Workflow',
        outcome: 'source_backed_metric:approval_blocks',
      }),
    }));
  });

  it('skips writes when no account context is available', async () => {
    await recordSourceBackedMetric({
      metric: 'sidecar_unavailable',
      endpoint: '/api/ai/generate',
      accountName: '',
    });

    expect(mockedPrisma.activity.create).not.toHaveBeenCalled();
  });
});
