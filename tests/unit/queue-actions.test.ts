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
  sequence: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  experiment: { create: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: mockedThreadExistsWith }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: mockedSendQueueItem }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));

const { addOne, sendNow, approveBatch, runDueNow, retryDraft, createSequence, enrollInSequence } =
  await import('@/app/discovery/queue-actions');

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

  it('with experiment: creates the experiment and stamps experiment_id + assigned variant_key on each item', async () => {
    mockedPrisma.experiment.create.mockResolvedValue({ id: 'exp_1' });
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([
      { id: 10, to_email: 'a@example.com' },
      { id: 20, to_email: 'b@example.com' },
    ]);
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    const variants = [
      { variantKey: 'A', subject: 'Subj A', split: 50, isControl: true },
      { variantKey: 'B', subject: 'Subj B', split: 50 },
    ];
    const res = await approveBatch([10, 20], { experiment: { name: 'Q3 subject test', variants } });

    expect(res).toEqual({ ok: true, approved: 2 });

    // experiment created with the variants mirrored from send-bulk-async
    expect(mockedPrisma.experiment.create).toHaveBeenCalledTimes(1);
    const createArg = mockedPrisma.experiment.create.mock.calls[0][0];
    expect(createArg.data.name).toBe('Q3 subject test');
    expect(createArg.data.status).toBe('active');
    expect(createArg.data.primary_metric).toBe('reply');
    expect(createArg.data.split).toEqual({ A: 50, B: 50 });
    const createdVariants = createArg.data.variants.create;
    expect(createdVariants).toHaveLength(2);
    expect(createdVariants[0]).toMatchObject({
      variant_key: 'A',
      subject: 'Subj A',
      split_percent: 50,
      is_control: true,
    });
    expect(createdVariants[1]).toMatchObject({
      variant_key: 'B',
      subject: 'Subj B',
      split_percent: 50,
      is_control: false,
    });

    // each item's update data carries experiment_id + a variant_key from the assignment
    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    expect(calls).toHaveLength(2);
    for (const c of calls) {
      expect(c[0].data.experiment_id).toBe('exp_1');
      expect(['A', 'B']).toContain(c[0].data.variant_key);
      expect(c[0].data.status).toBe('approved');
    }
    // owner-scoped load for assignment
    const findManyArg = mockedPrisma.draftQueueItem.findMany.mock.calls[0][0];
    expect(findManyArg.where.id).toEqual({ in: [10, 20] });
    expect(findManyArg.where.owner).toBe('rep@freightroll.com');
  });

  it('with experiment AND scheduledFor: keeps stagger/batch while stamping experiment fields', async () => {
    mockedPrisma.experiment.create.mockResolvedValue({ id: 'exp_2' });
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([
      { id: 1, to_email: 'a@example.com' },
      { id: 2, to_email: 'b@example.com' },
    ]);
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    const scheduledFor = new Date('2026-06-04T14:00:00.000Z');
    const res = await approveBatch([1, 2], {
      scheduledFor,
      staggerMinutes: 2,
      experiment: { name: 'sched exp', variants: [{ variantKey: 'A', split: 100 }] },
    });

    expect(res).toEqual({ ok: true, approved: 2 });
    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    // batch + stagger preserved
    const batchIds = calls.map((c) => c[0].data.batch_id);
    expect(new Set(batchIds).size).toBe(1);
    expect(batchIds[0]).toBeTruthy();
    expect((calls[0][0].data.scheduled_for as Date).getTime()).toBe(scheduledFor.getTime());
    // experiment fields present
    expect(calls[0][0].data.experiment_id).toBe('exp_2');
    expect(calls[0][0].data.variant_key).toBe('A');
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

describe('createSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
  });

  it('creates a sequence with name + steps scoped to the caller', async () => {
    mockedPrisma.sequence.create.mockResolvedValue({ id: 17 });
    const steps = [
      { stepIndex: 0, delayDays: 0 },
      { stepIndex: 1, delayDays: 3 },
    ];

    const res = await createSequence('Cold open', steps);

    expect(res).toEqual({ ok: true, id: 17 });
    expect(mockedPrisma.sequence.create).toHaveBeenCalledWith({
      data: { name: 'Cold open', owner: 'rep@freightroll.com', steps },
    });
  });

  it('rejects an empty name as invalid and never writes', async () => {
    const res = await createSequence('  ', [{ stepIndex: 0, delayDays: 0 }]);

    expect(res).toEqual({ ok: false, reason: 'invalid' });
    expect(mockedPrisma.sequence.create).not.toHaveBeenCalled();
  });

  it('rejects an empty steps array as invalid', async () => {
    const res = await createSequence('Has name', []);

    expect(res).toEqual({ ok: false, reason: 'invalid' });
    expect(mockedPrisma.sequence.create).not.toHaveBeenCalled();
  });

  it('rejects when unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await createSequence('Cold open', [{ stepIndex: 0, delayDays: 0 }]);

    expect(res).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(mockedPrisma.sequence.create).not.toHaveBeenCalled();
  });
});

describe('enrollInSequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({ user: { email: 'rep@freightroll.com', role: 'rep' } });
  });

  it('enrolls each draft with its OWN sequence_run_id, owner-scoped, summing counts', async () => {
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    const res = await enrollInSequence([10, 11], 5);

    expect(res).toEqual({ ok: true, enrolled: 2 });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);

    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    const c0 = calls[0][0];
    const c1 = calls[1][0];

    // owner-scoped per draft id
    expect(c0.where.owner).toBe('rep@freightroll.com');
    expect(c0.where.id).toBe(10);
    expect(c1.where.id).toBe(11);

    // stamps sequence as step 0
    expect(c0.data.sequence_id).toBe(5);
    expect(c0.data.step_index).toBe(0);
    expect(c1.data.sequence_id).toBe(5);
    expect(c1.data.step_index).toBe(0);

    // each draft gets a DISTINCT run id
    expect(c0.data.sequence_run_id).toBeTruthy();
    expect(c1.data.sequence_run_id).toBeTruthy();
    expect(c0.data.sequence_run_id).not.toBe(c1.data.sequence_run_id);
  });

  it('excludes another owner\'s draft (updateMany count 0) from the enrolled total', async () => {
    mockedPrisma.draftQueueItem.updateMany
      .mockResolvedValueOnce({ count: 1 }) // own draft
      .mockResolvedValueOnce({ count: 0 }); // another owner's draft -> not enrolled

    const res = await enrollInSequence([10, 99], 5);

    expect(res).toEqual({ ok: true, enrolled: 1 });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);
  });
});
