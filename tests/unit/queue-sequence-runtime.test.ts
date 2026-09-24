import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STATUS } from '@/lib/queue/types';
import {
  scheduleNextStep,
  cancelDownstream,
  onSendOutcome,
} from '@/lib/queue/sequence-runtime';

/** This file pins the FLAG-OFF (legacy) behavior. GAP_OS_ENABLED is read at
 *  call time, so an ambient value in the shell would silently flip every
 *  assertion below; force it off for the whole file and restore afterwards. */
const savedGapOs = process.env.GAP_OS_ENABLED;
beforeEach(() => {
  delete process.env.GAP_OS_ENABLED;
});
afterEach(() => {
  if (savedGapOs === undefined) delete process.env.GAP_OS_ENABLED;
  else process.env.GAP_OS_ENABLED = savedGapOs;
});

/** Minimal prisma mock covering the surfaces the runtime touches. */
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

/** A step-0 item that just sent. Sent on a Monday 14:00 UTC (10:00 ET) so that
 *  sent_at + 3 days lands on a Thursday 14:00 UTC, inside the business window —
 *  clampToWindow is a no-op and the scheduled_for is exactly predictable. */
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
    sent_at: new Date('2026-06-01T14:00:00.000Z'), // Monday 10:00 ET
    ...overrides,
  };
}

describe('scheduleNextStep', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('step 0 just sent in a 2-step sequence -> creates ONE next item at step 1', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });
    prisma.draftQueueItem.create.mockResolvedValue({ id: 201 });

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(201);
    expect(prisma.draftQueueItem.create).toHaveBeenCalledTimes(1);

    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.step_index).toBe(1);
    expect(data.parent_item_id).toBe(100);
    expect(data.sequence_run_id).toBe('run-abc');
    expect(data.sequence_id).toBe(9);
    expect(data.status).toBe(STATUS.approved);
    expect(data.to_email).toBe('person@example.com');
    // step templates win over the parent item's subject/body
    expect(data.subject).toBe('S1');
    expect(data.body).toBe('B1');
    // sent_at (Mon 14:00 UTC) + 3 days = Thu 14:00 UTC, in-window -> no clamp
    expect((data.scheduled_for as Date).toISOString()).toBe('2026-06-04T14:00:00.000Z');
    expect(typeof data.idempotency_key).toBe('string');
  });

  it('last step just sent -> returns null, no create', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });

    const out = await scheduleNextStep(prisma, step0Item({ step_index: 1 }));

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('not part of a sequence (no sequence_id) -> null, no lookup/create', async () => {
    const out = await scheduleNextStep(prisma, step0Item({ sequence_id: null }));
    expect(out).toBeNull();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('bounce gate: the sent step bounced (EmailLog bounce_type hard) -> null, no create', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });
    prisma.emailLog.findUnique.mockResolvedValue({ bounce_type: 'hard' });

    const out = await scheduleNextStep(prisma, step0Item({ email_log_id: 555 }));

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.emailLog.findUnique).toHaveBeenCalledWith({
      where: { id: 555 },
      select: { bounce_type: true },
    });
  });

  /**
   * B5 (Opus adversarial review, 2026-09-24, LIVE NOW). Before this fix,
   * flag-off scheduling created the next step verbatim from `Sequence.steps`
   * and approved it directly (no compile), even for a run GAP had pinned to
   * an immutable version. Turning the flag off mid-run to roll back therefore
   * made outbound LESS safe: a version-pinned item's next step still got
   * created and approved raw. Mutate the guard away and this goes RED.
   */
  it('B5: flag off + a version-pinned item schedules NOTHING, not a raw approved step', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });

    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1' }));

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  /**
   * B5, second half: even without a version pin on the item, a legacy
   * `Sequence.steps` row can itself carry unrendered GAP templates (written
   * by materializeSequence). Flag off must never approve a step whose copy
   * still has a literal {{token}} in it.
   */
  it('B5: flag off + an unrendered {{token}} in the step copy schedules NOTHING', async () => {
    prisma.sequence.findUnique.mockResolvedValue({
      id: 9,
      steps: [
        { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
        { stepIndex: 1, delayDays: 3, subjectTemplate: 'Following up, {{first_name}}', bodyTemplate: '{{observation}}' },
      ],
    });

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('B5 control: flag off, no version pin, no unrendered token, still schedules normally', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });
    prisma.draftQueueItem.create.mockResolvedValue({ id: 201 });

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(201);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect('sequence_version_id' in data).toBe(false);
    expect(data.status).toBe(STATUS.approved);
  });
});

describe('cancelDownstream', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('deletes not-yet-sent items of the run and returns the count', async () => {
    prisma.draftQueueItem.deleteMany.mockResolvedValue({ count: 2 });

    const n = await cancelDownstream(prisma, 'run-abc');

    expect(n).toBe(2);
    expect(prisma.draftQueueItem.deleteMany).toHaveBeenCalledWith({
      where: {
        sequence_run_id: 'run-abc',
        status: { notIn: [STATUS.sent, STATUS.sending] },
      },
    });
  });

  it('empty run id -> 0, no deleteMany', async () => {
    const n = await cancelDownstream(prisma, '');
    expect(n).toBe(0);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('flag off: deleteMany with the exact legacy where clause, updateMany NEVER called (byte-identical pin)', async () => {
    prisma.draftQueueItem.deleteMany.mockResolvedValue({ count: 3 });

    // the reason argument is accepted but must not change the legacy call
    const n = await cancelDownstream(prisma, 'run-abc', 'replied');

    expect(n).toBe(3);
    expect(prisma.draftQueueItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.deleteMany.mock.calls[0]).toEqual([
      {
        where: {
          sequence_run_id: 'run-abc',
          status: { notIn: [STATUS.sent, STATUS.sending] },
        },
      },
    ]);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });

  it('flag spelled "false": still the legacy deleteMany path', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    prisma.draftQueueItem.deleteMany.mockResolvedValue({ count: 1 });

    await cancelDownstream(prisma, 'run-abc');

    expect(prisma.draftQueueItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
  });
});

describe('onSendOutcome', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    prisma = makePrisma();
  });

  it('sent -> schedules the next step (create attempted)', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });
    prisma.draftQueueItem.create.mockResolvedValue({ id: 201 });

    await onSendOutcome(prisma, step0Item(), { status: STATUS.sent });

    expect(prisma.draftQueueItem.create).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });

  it('skipped + in_thread + has run id -> cancels the run', async () => {
    prisma.draftQueueItem.deleteMany.mockResolvedValue({ count: 1 });

    await onSendOutcome(prisma, step0Item(), {
      status: STATUS.skipped,
      skippedReason: 'in_thread',
    });

    expect(prisma.draftQueueItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('skipped with no sequence_run_id -> no-op', async () => {
    await onSendOutcome(prisma, step0Item({ sequence_run_id: null }), {
      status: STATUS.skipped,
      skippedReason: 'in_thread',
    });

    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('skipped with an unrelated reason -> no cancel', async () => {
    await onSendOutcome(prisma, step0Item(), {
      status: STATUS.skipped,
      skippedReason: 'rate_limited',
    });

    expect(prisma.draftQueueItem.deleteMany).not.toHaveBeenCalled();
  });
});
