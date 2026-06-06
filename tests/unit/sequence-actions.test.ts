import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAuth = vi.fn();

const mockedPrisma = {
  draftQueueItem: { updateMany: vi.fn() },
  sequence: { deleteMany: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));

const { unenrollFromSequence, deleteSequence } = await import('@/app/discovery/queue-actions');

describe('unenrollFromSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects when unauthenticated and never touches the DB', async () => {
    mockedAuth.mockResolvedValue({ user: undefined });

    const res = await unenrollFromSequence([1, 2]);

    expect(res).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(mockedPrisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });

  it('clears sequence fields per draft, owner-scoped to draft/approved, summing counts', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    const res = await unenrollFromSequence([1, 2]);

    expect(res).toEqual({ ok: true, unenrolled: 2 });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);

    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    const c0 = calls[0][0];
    const c1 = calls[1][0];

    // owner-scoped per draft id
    expect(c0.where.owner).toBe('rep@freightroll.com');
    expect(c0.where.id).toBe(1);
    expect(c1.where.id).toBe(2);
    // status gate = draft/approved
    expect(c0.where.status).toEqual({ in: ['draft', 'approved'] });

    // nulls out the sequence fields
    expect(c0.data.sequence_id).toBe(null);
    expect(c0.data.sequence_run_id).toBe(null);
    expect(c0.data.step_index).toBe(null);
  });
});

describe('deleteSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns not_found_or_forbidden when nothing was deleted (rep)', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
    mockedPrisma.sequence.deleteMany.mockResolvedValue({ count: 0 });

    const res = await deleteSequence(5);

    expect(res).toEqual({ ok: false, reason: 'not_found_or_forbidden' });
    const where = mockedPrisma.sequence.deleteMany.mock.calls[0][0].where;
    expect(where.id).toBe(5);
    expect(where.owner).toBe('rep@freightroll.com');
  });

  it('returns ok on delete; admin where has NO owner key', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'admin@freightroll.com', role: 'admin' } });
    mockedPrisma.sequence.deleteMany.mockResolvedValue({ count: 1 });

    const res = await deleteSequence(7);

    expect(res).toEqual({ ok: true });
    const where = mockedPrisma.sequence.deleteMany.mock.calls[0][0].where;
    expect(where.id).toBe(7);
    expect('owner' in where).toBe(false);
  });
});
