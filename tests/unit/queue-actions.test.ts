import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueueAddInput } from '@/lib/validations';

const mockedAuth = vi.fn();
const mockedThreadExistsWith = vi.fn();
const mockedSendQueueItem = vi.fn();

const mockedPrisma = {
  unsubscribedEmail: { findUnique: vi.fn() },
  emailLog: { findFirst: vi.fn() },
  draftQueueItem: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: mockedThreadExistsWith }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: mockedSendQueueItem }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));

const { addOne, sendNow } = await import('@/app/discovery/queue-actions');

const baseInput: QueueAddInput = {
  toEmail: 'Person@Example.com',
  accountName: 'Acme Logistics',
  subject: 'Quick question on your yard',
  body: 'Hello there',
  source: 'casey',
};

/** Default all dedup lookups to "clean". */
function setClean() {
  mockedPrisma.unsubscribedEmail.findUnique.mockResolvedValue(null);
  mockedPrisma.emailLog.findFirst.mockResolvedValue(null);
  mockedPrisma.draftQueueItem.findFirst.mockResolvedValue(null);
  mockedThreadExistsWith.mockResolvedValue({ exists: false, lastAt: null });
}

describe('addOne dedup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setClean();
  });

  it('blocks already_emailed when EmailLog has a MIXED-CASE prior row (case-insensitive lookup)', async () => {
    mockedPrisma.emailLog.findFirst.mockResolvedValue({ id: 99 });

    const res = await addOne(baseInput, 'casey@freightroll.com');

    expect(res).toEqual({ ok: false, reason: 'already_emailed' });
    // lookup must be case-insensitive against the lowercased recipient
    expect(mockedPrisma.emailLog.findFirst).toHaveBeenCalledWith({
      where: { to_email: { equals: 'person@example.com', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(mockedPrisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('blocks already_queued when an active queue row exists', async () => {
    mockedPrisma.draftQueueItem.findFirst.mockResolvedValue({ id: 42 });

    const res = await addOne(baseInput, 'casey@freightroll.com');

    expect(res).toEqual({ ok: false, reason: 'already_queued' });
    expect(mockedPrisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('returns already_queued when create throws P2002 (atomic race backstop)', async () => {
    mockedPrisma.draftQueueItem.create.mockRejectedValue({ code: 'P2002' });

    const res = await addOne(baseInput, 'casey@freightroll.com');

    expect(res).toEqual({ ok: false, reason: 'already_queued' });
  });

  it('inserts when clean and lowercases the recipient', async () => {
    mockedPrisma.draftQueueItem.create.mockResolvedValue({ id: 7 });

    const res = await addOne(baseInput, 'casey@freightroll.com');

    expect(res).toEqual({ ok: true, id: 7 });
    const createArg = mockedPrisma.draftQueueItem.create.mock.calls[0][0];
    expect(createArg.data.to_email).toBe('person@example.com');
    expect(createArg.data.owner).toBe('casey@freightroll.com');
  });
});

describe('sendNow ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies a rep sending another owner\'s row and never calls send', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });

    const res = await sendNow(123);

    expect(res).toEqual({ ok: false, reason: 'not_found_or_forbidden' });
    expect(mockedSendQueueItem).not.toHaveBeenCalled();

    const whereArg = mockedPrisma.draftQueueItem.updateMany.mock.calls[0][0].where;
    expect(whereArg.owner).toBe('rep@freightroll.com');
    expect(whereArg.id).toBe(123);
  });
});
