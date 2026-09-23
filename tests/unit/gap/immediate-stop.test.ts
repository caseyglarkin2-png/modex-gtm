/**
 * S2-T2 stop-not-delete, FLAG ON.
 *
 * Under GAP_OS_ENABLED a stopped sequence run marks its unsent items skipped
 * with `sequence_stopped:<reason>` instead of deleting them. The flag-off
 * (legacy deleteMany) behavior is pinned in tests/unit/queue-sequence-runtime.test.ts;
 * this file only covers the flag-on branch and the two new helpers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATUS } from '@/lib/queue/types';
import {
  cancelDownstream,
  onSendOutcome,
  scheduleNextStep,
  stopRun,
  stopRunsForRecipient,
} from '@/lib/queue/sequence-runtime';

const savedGapOs = process.env.GAP_OS_ENABLED;
beforeEach(() => {
  process.env.GAP_OS_ENABLED = 'true';
});
afterEach(() => {
  if (savedGapOs === undefined) delete process.env.GAP_OS_ENABLED;
  else process.env.GAP_OS_ENABLED = savedGapOs;
});

function makePrisma() {
  return {
    sequence: { findUnique: vi.fn() },
    emailLog: { findUnique: vi.fn() },
    draftQueueItem: { create: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  };
}

const TWO_STEP = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'S1', bodyTemplate: 'B1' },
];

function step0Item(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    to_email: 'person@example.com',
    account_name: 'Acme Logistics',
    persona_name: 'Ops Lead',
    persona_id: 7,
    owner: 'casey@freightroll.com',
    subject: 'orig subj',
    body: 'orig body',
    image_url: 'https://img/x.png',
    sequence_id: 9,
    sequence_run_id: 'run-abc',
    step_index: 0,
    email_log_id: null,
    sent_at: new Date('2026-06-01T14:00:00.000Z'),
    ...overrides,
  };
}

/** The only statuses a stop may touch: unsent and unclaimed. `sending` rows
 *  are claimed by a worker and stay under the reply-pause + wire gates.
 *  R2-7: `failed` is unsent too; the legacy delete removed it, and left alone
 *  a `retryDraft` would re-approve it and revive the stopped run. */
const STOPPABLE = [STATUS.draft, STATUS.approved, STATUS.failed];

/** A stateful updateMany so a test can see WHICH rows a stop touches. */
function inMemoryUpdateMany(rows: Array<Record<string, unknown>>) {
  return async ({ where, data }: { where: { sequence_run_id?: string; to_email?: string; status: { in: string[] } }; data: Record<string, unknown> }) => {
    let count = 0;
    for (const row of rows) {
      const runMatch = where.sequence_run_id === undefined || row.sequence_run_id === where.sequence_run_id;
      const emailMatch = where.to_email === undefined || row.to_email === where.to_email;
      if (runMatch && emailMatch && where.status.in.includes(row.status as string)) {
        Object.assign(row, data);
        count += 1;
      }
    }
    return { count };
  };
}

describe('stopRun (flag on)', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('marks draft + approved rows of the run skipped with sequence_stopped:<reason>; never deletes', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 2 });

    const n = await stopRun(prisma, 'run-abc', 'replied');

    expect(n).toBe(2);
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.updateMany.mock.calls[0]).toEqual([
      {
        where: { sequence_run_id: 'run-abc', status: { in: STOPPABLE } },
        data: { status: STATUS.skipped, skipped_reason: 'sequence_stopped:replied' },
      },
    ]);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('the where clause excludes sending, sent and skipped (claimed or terminal rows are untouched) and includes failed (R2-7)', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 0 });

    await stopRun(prisma, 'run-abc', 'unsubscribed');

    const where = prisma.draftQueueItem.updateMany.mock.calls[0][0].where;
    expect(where.status.in).not.toContain(STATUS.sending);
    expect(where.status.in).not.toContain(STATUS.sent);
    expect(where.status.in).not.toContain(STATUS.skipped);
    expect(where.status.in).toContain(STATUS.failed);
    expect(where.status).not.toHaveProperty('notIn');
  });

  it('R2-7: a failed row of the run is marked skipped with the reason, so retryDraft cannot revive the stopped run', async () => {
    const rows = [
      { id: 1, sequence_run_id: 'run-abc', status: STATUS.sent },
      { id: 2, sequence_run_id: 'run-abc', status: STATUS.failed, skipped_reason: null },
      { id: 3, sequence_run_id: 'run-abc', status: STATUS.approved, skipped_reason: null },
      { id: 4, sequence_run_id: 'run-abc', status: STATUS.sending },
      { id: 5, sequence_run_id: 'run-other', status: STATUS.failed, skipped_reason: null },
    ];
    prisma.draftQueueItem.updateMany.mockImplementation(inMemoryUpdateMany(rows));

    const n = await stopRun(prisma, 'run-abc', 'replied');

    expect(n).toBe(2);
    expect(rows[1]).toEqual({ id: 2, sequence_run_id: 'run-abc', status: STATUS.skipped, skipped_reason: 'sequence_stopped:replied' });
    expect(rows[2].status).toBe(STATUS.skipped);
    expect(rows[0].status).toBe(STATUS.sent);
    expect(rows[3].status).toBe(STATUS.sending);
    expect(rows[4].status).toBe(STATUS.failed);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('empty run id -> 0 with no DB call at all', async () => {
    const n = await stopRun(prisma, '', 'replied');
    expect(n).toBe(0);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });
});

describe('stopRunsForRecipient (flag on)', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('trims + lowercases the address and requires a non-null sequence_run_id', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 4 });

    const n = await stopRunsForRecipient(prisma, ' Ops@Example.com ', 'do_not_contact');

    expect(n).toBe(4);
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.updateMany.mock.calls[0]).toEqual([
      {
        where: {
          to_email: 'ops@example.com',
          sequence_run_id: { not: null },
          status: { in: STOPPABLE },
        },
        data: { status: STATUS.skipped, skipped_reason: 'sequence_stopped:do_not_contact' },
      },
    ]);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('blank address -> 0 with no DB call', async () => {
    const n = await stopRunsForRecipient(prisma, '   ', 'replied');
    expect(n).toBe(0);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });
});

describe('cancelDownstream (flag on) delegates to stopRun', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('with a reason: updateMany carrying that reason, deleteMany NEVER called', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 2 });

    const n = await cancelDownstream(prisma, 'run-abc', 'in_thread');

    expect(n).toBe(2);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.updateMany.mock.calls[0][0]).toEqual({
      where: { sequence_run_id: 'run-abc', status: { in: STOPPABLE } },
      data: { status: STATUS.skipped, skipped_reason: 'sequence_stopped:in_thread' },
    });
  });

  it('without a reason: the reason is recorded as unknown, never blank', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    await cancelDownstream(prisma, 'run-abc');

    expect(prisma.draftQueueItem.updateMany.mock.calls[0][0].data.skipped_reason).toBe(
      'sequence_stopped:unknown',
    );
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('empty run id -> 0, no DB call', async () => {
    const n = await cancelDownstream(prisma, '', 'replied');
    expect(n).toBe(0);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });
});

describe('onSendOutcome (flag on)', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('skipped + replied -> the run stops with sequence_stopped:replied', async () => {
    prisma.draftQueueItem.updateMany.mockResolvedValue({ count: 1 });

    await onSendOutcome(prisma, step0Item(), { status: STATUS.skipped, skippedReason: 'replied' });

    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledTimes(1);
    const call = prisma.draftQueueItem.updateMany.mock.calls[0][0];
    expect(call.where.sequence_run_id).toBe('run-abc');
    expect(call.data).toEqual({ status: STATUS.skipped, skipped_reason: 'sequence_stopped:replied' });
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('skipped with an unrelated reason -> nothing stopped, nothing deleted', async () => {
    await onSendOutcome(prisma, step0Item(), { status: STATUS.skipped, skippedReason: 'rate_limited' });
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });
});

describe('scheduleNextStep (flag on) carries the version pin forward', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });
    prisma.draftQueueItem.create.mockResolvedValue({ id: 201 });
  });

  it('item has sequence_version_id -> the next step is created with the same id', async () => {
    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1' }));

    expect(out).toBe(201);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.sequence_version_id).toBe('ver-1');
    // everything else the legacy path writes is still there
    expect(data.step_index).toBe(1);
    expect(data.parent_item_id).toBe(100);
    expect(data.sequence_run_id).toBe('run-abc');
    expect(data.status).toBe(STATUS.approved);
  });

  it('item without a version (legacy run) -> no sequence_version_id key on the created row', async () => {
    await scheduleNextStep(prisma, step0Item());

    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect('sequence_version_id' in data).toBe(false);
  });
});
