import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAuth = vi.fn();

const mockedPrisma = {
  draftQueueItem: {
    count: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));

const { countActionableQueue } = await import('@/app/discovery/queue-actions');

describe('countActionableQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 0 and does not call count when unauthenticated', async () => {
    mockedAuth.mockResolvedValue({ user: undefined });

    const res = await countActionableQueue();

    expect(res).toBe(0);
    expect(mockedPrisma.draftQueueItem.count).not.toHaveBeenCalled();
  });

  it('rep: owner-scoped count over draft/approved/failed, returns the number', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'rep@x.com', role: 'rep' } });
    mockedPrisma.draftQueueItem.count.mockResolvedValue(7);

    const res = await countActionableQueue();

    expect(res).toBe(7);
    expect(mockedPrisma.draftQueueItem.count).toHaveBeenCalledTimes(1);
    const where = mockedPrisma.draftQueueItem.count.mock.calls[0][0].where;
    expect(where.owner).toBe('rep@x.com');
    expect(where.status.in).toEqual(['draft', 'approved', 'failed']);
  });

  it('admin: count over all owners (no owner key), status filter still present', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'casey@freightroll.com', role: 'admin' } });
    mockedPrisma.draftQueueItem.count.mockResolvedValue(42);

    const res = await countActionableQueue();

    expect(res).toBe(42);
    expect(mockedPrisma.draftQueueItem.count).toHaveBeenCalledTimes(1);
    const where = mockedPrisma.draftQueueItem.count.mock.calls[0][0].where;
    expect('owner' in where).toBe(false);
    expect(where.status.in).toEqual(['draft', 'approved', 'failed']);
  });
});
