/**
 * S3-T11: the approveBatch compile guard. Flag off, the function's prisma
 * call list is byte-identical to today's (pinned as a literal here, plus the
 * untouched tests in tests/unit/queue-actions.test.ts). Flag on, a GAP item
 * (stamped with sequence_version_id) is approved only when its latest
 * GapCompile verdict is pass, by item id first and by (version, step) as the
 * template-level fallback; the rest of the batch is unaffected.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockedAuth = vi.fn();
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
  gapCompile: { findMany: vi.fn() },
  sendApprovalRequest: { findFirst: vi.fn() },
  sequence: { findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn() },
  experiment: { create: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/email/gmail-inbox', () => ({ threadExistsWith: vi.fn() }));
vi.mock('@/lib/queue/send', () => ({ sendQueueItem: mockedSendQueueItem }));
vi.mock('@/lib/queue/send-deps', () => ({ prodSendDeps: vi.fn(() => ({})) }));

const { approveBatch, retryDraft, sendNow } = await import('@/app/discovery/queue-actions');

const REP = 'rep@freightroll.com';
const ACTIVE = { in: ['draft', 'approved'] };

function updateCall(id: number, extra: Record<string, unknown> = {}) {
  return [
    {
      where: { id, owner: REP, status: ACTIVE },
      data: { status: 'approved', approved_at: expect.any(Date), ...extra },
    },
  ];
}

describe('approveBatch with GAP_OS_ENABLED off', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GAP_OS_ENABLED;
    mockedAuth.mockResolvedValue({ user: { email: REP, role: 'rep' } });
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });
  });

  it('plain approve: the call list is exactly today\'s, no guard reads, no refused key', async () => {
    const res = await approveBatch([10, 20]);

    expect(res).toStrictEqual({ ok: true, approved: 2 });
    expect('refused' in res).toBe(false);
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls).toEqual([updateCall(10), updateCall(20)]);
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
  });

  it('scheduled approve: the call list is exactly today\'s (batch_id, scheduled_for), no guard reads', async () => {
    const scheduledFor = new Date('2026-06-04T14:00:00.000Z');
    const res = await approveBatch([1, 2], { scheduledFor, staggerMinutes: 2 });

    expect(res).toStrictEqual({ ok: true, approved: 2 });
    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    expect(calls).toEqual([
      updateCall(1, { scheduled_for: scheduledFor, batch_id: expect.any(String) }),
      updateCall(2, { scheduled_for: new Date(scheduledFor.getTime() + 2 * 60_000), batch_id: expect.any(String) }),
    ]);
    expect(calls[0][0].data.batch_id).toBe(calls[1][0].data.batch_id);
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
  });

  it('R3-11 flag off: sendNow and retryDraft make exactly today\'s calls (one owner-scoped updateMany each, no guard reads)', async () => {
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });
    expect(await sendNow(10)).toEqual({ ok: false, reason: 'not_found_or_forbidden' });
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls).toEqual([
      [{ where: { id: 10, owner: REP, status: ACTIVE }, data: { status: 'approved', approved_at: expect.any(Date) } }],
    ]);
    expect(await retryDraft(11)).toEqual({ ok: false, reason: 'not_retryable' });
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls[1]).toEqual([
      { where: { id: 11, owner: REP, status: 'failed', provider_message_id: null }, data: { status: 'approved', error_message: null } },
    ]);
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.draftQueueItem.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
    expect(mockedSendQueueItem).not.toHaveBeenCalled();
  });

  it('a stamped item with a rejecting compile is still approved when the flag is off (legacy path unchanged)', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 10, sequence_version_id: 'ver_1', step_index: 0 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([{ draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 0, verdict: 'reject' }]);

    const res = await approveBatch([10]);

    expect(res).toStrictEqual({ ok: true, approved: 1 });
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
  });
});

describe('approveBatch with GAP_OS_ENABLED on', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GAP_OS_ENABLED = 'true';
    mockedAuth.mockResolvedValue({ user: { email: REP, role: 'rep' } });
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });
  });
  afterEach(() => {
    delete process.env.GAP_OS_ENABLED;
  });

  it('refuses a stamped item whose latest compile is not a pass, approves the one with a pass, leaves the non-GAP item alone', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([
      { id: 10, sequence_version_id: 'ver_1', step_index: 0 },
      { id: 20, sequence_version_id: 'ver_1', step_index: 1 },
    ]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([
      { draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 0, verdict: 'reject' },
      { draft_queue_item_id: 20, sequence_version_id: 'ver_1', step_index: 1, verdict: 'pass' },
    ]);

    const res = await approveBatch([10, 20, 30]);

    expect(res).toStrictEqual({ ok: true, approved: 2, refused: [{ id: 10, reason: 'compile_not_passed' }] });
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls).toEqual([updateCall(20), updateCall(30)]);

    // The guard reads only stamped items among the batch, then their compiles by item id or version.
    expect(mockedPrisma.draftQueueItem.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10, 20, 30] }, sequence_version_id: { not: null } },
      select: { id: true, sequence_version_id: true, step_index: true },
    });
    expect(mockedPrisma.gapCompile.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ draft_queue_item_id: { in: [10, 20] } }, { sequence_version_id: { in: ['ver_1'] } }],
    });
    expect(mockedPrisma.gapCompile.findMany.mock.calls[0][0].orderBy).toEqual({ created_at: 'desc' });
  });

  it('N3: a review_required latest compile clears through an APPROVED SendApprovalRequest, exactly as the enroll service and the enroll-row gate do; pending refuses', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 10, sequence_version_id: 'ver_1', step_index: 0 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([{ id: 'cmp_rev', draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 0, verdict: 'review_required' }]);
    mockedPrisma.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_1', status: 'approved' });

    expect(await approveBatch([10])).toStrictEqual({ ok: true, approved: 1, refused: [] });
    expect(mockedPrisma.sendApprovalRequest.findFirst).toHaveBeenCalledWith({
      where: { risk_reasons: { has: 'gap_compile:cmp_rev' } },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true },
    });

    mockedPrisma.draftQueueItem.updateMany.mockClear();
    mockedPrisma.sendApprovalRequest.findFirst.mockResolvedValue({ id: 'sar_1', status: 'pending' });
    expect(await approveBatch([10])).toStrictEqual({ ok: true, approved: 0, refused: [{ id: 10, reason: 'compile_not_passed' }] });
    expect(await sendNow(10)).toStrictEqual({ ok: false, reason: 'compile_not_passed' });
    expect(await retryDraft(10)).toStrictEqual({ ok: false, reason: 'compile_not_passed' });
    expect(mockedPrisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });

  it('the LATEST compile decides: an older pass under a newer review_required is refused', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 10, sequence_version_id: 'ver_1', step_index: 0 }]);
    // Ordered newest first, as the query asks.
    mockedPrisma.gapCompile.findMany.mockResolvedValue([
      { draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 0, verdict: 'review_required' },
      { draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 0, verdict: 'pass' },
    ]);

    const res = await approveBatch([10]);

    expect(res).toStrictEqual({ ok: true, approved: 0, refused: [{ id: 10, reason: 'compile_not_passed' }] });
    expect(mockedPrisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });

  it('a template-level pass for (version, step) with no item id approves a stamped item; another item\'s pass does not', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([
      { id: 10, sequence_version_id: 'ver_1', step_index: 2 },
      { id: 11, sequence_version_id: 'ver_1', step_index: 3 },
    ]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([
      { draft_queue_item_id: null, sequence_version_id: 'ver_1', step_index: 2, verdict: 'pass' },
      // A pass compiled for a DIFFERENT item at step 3 proves nothing about item 11.
      { draft_queue_item_id: 99, sequence_version_id: 'ver_1', step_index: 3, verdict: 'pass' },
    ]);

    const res = await approveBatch([10, 11]);

    expect(res).toStrictEqual({ ok: true, approved: 1, refused: [{ id: 11, reason: 'compile_not_passed' }] });
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls).toEqual([updateCall(10)]);
  });

  it('a stamped item with no compile at all is refused', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 10, sequence_version_id: 'ver_1', step_index: 0 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([]);

    const res = await approveBatch([10]);

    expect(res).toStrictEqual({ ok: true, approved: 0, refused: [{ id: 10, reason: 'compile_not_passed' }] });
  });

  it('a batch with no stamped items never queries compiles and reports an empty refused list', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([]);

    const res = await approveBatch([30, 31]);

    expect(res).toStrictEqual({ ok: true, approved: 2, refused: [] });
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.draftQueueItem.updateMany.mock.calls).toEqual([updateCall(30), updateCall(31)]);
  });

  it('R3-11: sendNow refuses a stamped item whose newest compile is a reject with compile_not_passed, before any write or send', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 10, sequence_version_id: 'ver_1', step_index: 1 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([
      { draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 1, verdict: 'reject' },
      { draft_queue_item_id: 10, sequence_version_id: 'ver_1', step_index: 1, verdict: 'pass' },
    ]);

    const res = await sendNow(10);

    expect(res).toStrictEqual({ ok: false, reason: 'compile_not_passed' });
    expect(mockedPrisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(mockedSendQueueItem).not.toHaveBeenCalled();
    expect(mockedPrisma.draftQueueItem.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10] }, sequence_version_id: { not: null } },
      select: { id: true, sequence_version_id: true, step_index: true },
    });
  });

  it('R3-11: retryDraft refuses a stamped item whose newest compile is a reject with compile_not_passed, before the re-approve', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 12, sequence_version_id: 'ver_1', step_index: 2 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([{ draft_queue_item_id: 12, sequence_version_id: 'ver_1', step_index: 2, verdict: 'reject' }]);

    const res = await retryDraft(12);

    expect(res).toStrictEqual({ ok: false, reason: 'compile_not_passed' });
    expect(mockedPrisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });

  it('R3-11: an unstamped item passes both guards untouched (sendNow reaches the approve write; retryDraft reaches the re-approve)', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([]);
    mockedPrisma.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });
    expect(await sendNow(30)).toEqual({ ok: false, reason: 'not_found_or_forbidden' });
    expect(await retryDraft(31)).toEqual({ ok: false, reason: 'not_retryable' });
    expect(mockedPrisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.gapCompile.findMany).not.toHaveBeenCalled();
  });

  it('scheduled approve staggers over the surviving items only', async () => {
    mockedPrisma.draftQueueItem.findMany.mockResolvedValue([{ id: 2, sequence_version_id: 'ver_1', step_index: 0 }]);
    mockedPrisma.gapCompile.findMany.mockResolvedValue([]);
    const scheduledFor = new Date('2026-06-04T14:00:00.000Z');

    const res = await approveBatch([1, 2, 3], { scheduledFor, staggerMinutes: 2 });

    expect(res).toStrictEqual({ ok: true, approved: 2, refused: [{ id: 2, reason: 'compile_not_passed' }] });
    const calls = mockedPrisma.draftQueueItem.updateMany.mock.calls;
    expect(calls.map((c) => c[0].where.id)).toEqual([1, 3]);
    expect((calls[1][0].data.scheduled_for as Date).getTime() - (calls[0][0].data.scheduled_for as Date).getTime()).toBe(2 * 60_000);
  });
});
