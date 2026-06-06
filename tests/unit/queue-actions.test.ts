import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueueAddInput } from '@/lib/validations';

const mockedAuth = vi.fn();
const mockedThreadExistsWith = vi.fn();
const mockedSendQueueItem = vi.fn();

const mockedPrisma = {
  unsubscribedEmail: { findUnique: vi.fn() },
  emailLog: { findFirst: vi.fn(), findUnique: vi.fn() },
  draftQueueItem: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  sequence: { findUnique: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: mockedThreadExistsWith }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: mockedSendQueueItem }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));

const { addOne, sendNow, approveBatch, runDueNow, retryDraft } = await import(
  '@/app/discovery/queue-actions'
);

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

describe('approveBatch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
  });

  it('without scheduledFor: owner-scoped bulk approve, sums counts, no scheduled_for', async () => {
    mockedPrisma.draftQueueItem.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });

    const res = await approveBatch([10, 20]);

    expect(res).toEqual({ ok: true, approved: 2 });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);

    const call0 = mockedPrisma.draftQueueItem.updateMany.mock.calls[0][0];
    expect(call0.data.status).toBe('approved');
    expect(call0.data.approved_at).toBeInstanceOf(Date);
    // owner predicate present (rep, non-admin)
    expect(call0.where.owner).toBe('rep@freightroll.com');
    expect(call0.where.id).toBe(10);
    // no scheduling fields when scheduledFor is absent
    expect('scheduled_for' in call0.data).toBe(false);
    expect('batch_id' in call0.data).toBe(false);
  });

  it('with scheduledFor + staggerMinutes 2 over 3 ids: shared batch_id, 2-min-apart times', async () => {
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    // Weekday 14:00 UTC = 10:00 ET, inside the window so clampToWindow is a no-op.
    const scheduledFor = new Date('2026-06-04T14:00:00.000Z'); // Thursday

    const res = await approveBatch([1, 2, 3], { scheduledFor, staggerMinutes: 2 });

    expect(res).toEqual({ ok: true, approved: 3 });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(3);

    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    const batchIds = calls.map((c) => c[0].data.batch_id);
    // shared batch_id across all 3
    expect(batchIds[0]).toBeTruthy();
    expect(new Set(batchIds).size).toBe(1);

    const times = calls.map((c) => (c[0].data.scheduled_for as Date).getTime());
    expect(times[0]).toBe(scheduledFor.getTime());
    expect(times[1] - times[0]).toBe(2 * 60 * 1000);
    expect(times[2] - times[1]).toBe(2 * 60 * 1000);

    // owner-scoped, status approved
    expect(calls[0][0].where.owner).toBe('rep@freightroll.com');
    expect(calls[0][0].data.status).toBe('approved');
  });
});

describe('retryDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
  });

  it('retries a failed row that never reached Gmail (provider_message_id null) -> approved', async () => {
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    const res = await retryDraft(55);

    expect(res).toEqual({ ok: true });
    const call = mockedPrisma.draftQueueItem.updateMany.mock.calls[0][0];
    // gated on failed + never-sent, owner-scoped (rep, non-admin)
    expect(call.where.status).toBe('failed');
    expect(call.where.provider_message_id).toBe(null);
    expect(call.where.owner).toBe('rep@freightroll.com');
    expect(call.where.id).toBe(55);
    // re-arms for sending and clears the prior error
    expect(call.data.status).toBe('approved');
    expect(call.data.error_message).toBe(null);
  });

  it('refuses a failed-but-already-sent row (updateMany count 0) -> not_retryable', async () => {
    // The provider_message_id:null predicate excludes the already-sent row, so count is 0.
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });

    const res = await retryDraft(56);

    expect(res).toEqual({ ok: false, reason: 'not_retryable' });
  });
});

describe('runDueNow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('denies a rep and never sends', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });

    const res = await runDueNow();

    expect(res).toEqual({ ok: false, reason: 'forbidden' });
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
    expect(mockedSendQueueItem).not.toHaveBeenCalled();
  });

  it('admin: tallies sent/failed/skipped over due items', async () => {
    mockedAuth.mockResolvedValue({ user: { email: 'admin@freightroll.com', role: 'admin' } });
    const now = new Date();
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([
      { id: 1, status: 'approved', scheduled_for: new Date(now.getTime() - 60_000) },
      { id: 2, status: 'approved', scheduled_for: new Date(now.getTime() - 60_000) },
    ]);
    mockedSendQueueItem
      .mockResolvedValueOnce({ status: 'sent' })
      .mockResolvedValueOnce({ status: 'failed' });
    // Re-fetch after send returns a non-sequence item -> onSendOutcome no-op.
    mockedPrisma.draftQueueItem.findUnique.mockResolvedValue({ id: 1, sequence_id: null });

    const res = await runDueNow();

    expect(res).toEqual({ ok: true, sent: 1, failed: 1, skipped: 0 });
    expect(mockedSendQueueItem).toHaveBeenCalledTimes(2);
  });
});
