/**
 * S3-T5: the runtime pin wired into scheduleNextStep.
 *
 * Flag OFF: the one read is `prisma.sequence.findUnique({ where: { id } })`,
 * no enrollment or version read, random idempotency key, no version stamp
 * (the row-shape pin lives in tests/unit/queue-sequence-runtime.test.ts).
 * Flag ON with an enrollment: the pinned version's steps are used, the live
 * read is NOT made, the created row carries the version and the
 * deterministic key `${owner}:${to_email}:${run}:${step}`. Flag ON without an
 * enrollment or a stamp: the documented fallback to the live read.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fromLegacyModexSteps } from '@/lib/gap/sequence/steps';
import { STATUS } from '@/lib/queue/types';
import { scheduleNextStep, sequenceStepIdempotencyKey } from '@/lib/queue/sequence-runtime';

const savedGapOs = process.env.GAP_OS_ENABLED;
afterEach(() => {
  if (savedGapOs === undefined) delete process.env.GAP_OS_ENABLED;
  else process.env.GAP_OS_ENABLED = savedGapOs;
});

const TWO_STEP = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'S1', bodyTemplate: 'B1' },
];
const V2 = fromLegacyModexSteps(TWO_STEP);

/** A different shape in the LIVE table, so a test can tell which source was read. */
const LIVE_EDITED = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 9, subjectTemplate: 'LIVE-EDIT', bodyTemplate: 'LIVE-BODY' },
];

function throwingDelegate(name: string) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        throw new Error(`forbidden_access:${name}.${String(prop)}`);
      },
    },
  );
}

function makePrisma() {
  return {
    sequence: { findUnique: vi.fn() },
    sequenceEnrollment: { findUnique: vi.fn().mockResolvedValue(null) },
    sequenceVersion: { findUnique: vi.fn().mockResolvedValue(null) },
    emailLog: { findUnique: vi.fn() },
    draftQueueItem: { create: vi.fn().mockResolvedValue({ id: 201 }), findUnique: vi.fn() },
  };
}

/** Sent Monday 2026-06-01 14:00 UTC; +3 calendar days = Thursday 14:00 UTC, inside the window (no clamp). */
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
    sequence_version_id: null,
    step_index: 0,
    email_log_id: null,
    sent_at: new Date('2026-06-01T14:00:00.000Z'),
    ...overrides,
  };
}

function enrollment(status: string, steps: unknown = V2, versionStatus = 'frozen') {
  return { id: 'run-abc', status, sequence_version_id: 'ver-enr', version: { id: 'ver-enr', status: versionStatus, steps } };
}

describe('scheduleNextStep, flag OFF', () => {
  beforeEach(() => {
    delete process.env.GAP_OS_ENABLED;
  });

  it('reads the live sequence with the exact legacy call; enrollment and version delegates are never touched; random key; no stamp', async () => {
    const prisma = {
      sequence: { findUnique: vi.fn().mockResolvedValue({ id: 9, steps: TWO_STEP }) },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
      emailLog: { findUnique: vi.fn() },
      draftQueueItem: { create: vi.fn().mockResolvedValue({ id: 201 }), findUnique: vi.fn() },
    };

    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1' }));

    expect(out).toBe(201);
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.sequence.findUnique.mock.calls[0]).toEqual([{ where: { id: 9 } }]);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect('sequence_version_id' in data).toBe(false);
    expect(data.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.idempotency_key).not.toContain('run-abc');
    expect(data.subject).toBe('S1');
    expect((data.scheduled_for as Date).toISOString()).toBe('2026-06-04T14:00:00.000Z');
  });

  it('flag spelled "false": still the legacy path', async () => {
    process.env.GAP_OS_ENABLED = 'false';
    const prisma = {
      sequence: { findUnique: vi.fn().mockResolvedValue({ id: 9, steps: TWO_STEP }) },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
      emailLog: { findUnique: vi.fn() },
      draftQueueItem: { create: vi.fn().mockResolvedValue({ id: 201 }), findUnique: vi.fn() },
    };
    await scheduleNextStep(prisma, step0Item());
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleNextStep, flag ON with an enrollment', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    prisma = makePrisma();
    // the live table has been EDITED; the pin must win
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: LIVE_EDITED });
  });

  it('uses the pinned version steps and does NOT call prisma.sequence.findUnique', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(201);
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.subject).toBe('S1');
    expect(data.body).toBe('B1');
    expect((data.scheduled_for as Date).toISOString()).toBe('2026-06-04T14:00:00.000Z');
  });

  it('stamps the resolved version on the created row even when the parent item was never stamped', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    await scheduleNextStep(prisma, step0Item({ sequence_version_id: null }));
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.sequence_version_id).toBe('ver-enr');
  });

  it('the enrollment pin wins over a differing item stamp', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-stale' }));
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.sequence_version_id).toBe('ver-enr');
  });

  it('idempotency_key is the deterministic owner:to_email:run:step', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    await scheduleNextStep(prisma, step0Item());
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.idempotency_key).toBe('casey@freightroll.com:person@example.com:run-abc:1');
    expect(sequenceStepIdempotencyKey('o', 'e', 'r', 2)).toBe('o:e:r:2');
  });

  it('a retry after a crash hits the @unique (P2002) and returns the EXISTING step id, no twin', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    prisma.draftQueueItem.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    prisma.draftQueueItem.findUnique.mockResolvedValue({ id: 777 });

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(777);
    expect(prisma.draftQueueItem.findUnique).toHaveBeenCalledWith({
      where: { idempotency_key: 'casey@freightroll.com:person@example.com:run-abc:1' },
      select: { id: true },
    });
  });

  it('any other create error is rethrown', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    prisma.draftQueueItem.create.mockRejectedValue(new Error('boom'));
    await expect(scheduleNextStep(prisma, step0Item())).rejects.toThrow('boom');
    expect(prisma.draftQueueItem.findUnique).not.toHaveBeenCalled();
  });

  it.each(['paused', 'stopped', 'completed', 'stop_pending'])('a %s enrollment schedules nothing', async (status) => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment(status));
    const out = await scheduleNextStep(prisma, step0Item());
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });

  it('a RETIRED pinned version still schedules (retire blocks new enrollments only)', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', V2, 'retired'));
    const out = await scheduleNextStep(prisma, step0Item());
    expect(out).toBe(201);
  });

  it('a business-day delay is converted from the send time: Friday + 3 business days = Wednesday', async () => {
    const v2 = { ...V2, steps: [V2.steps[0], { ...V2.steps[1], delay: { value: 3, unit: 'business_days' as const } }] };
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', v2));
    // Friday 2026-06-05 14:00 UTC; +3 business days = Wednesday 2026-06-10 14:00 UTC
    await scheduleNextStep(prisma, step0Item({ sent_at: new Date('2026-06-05T14:00:00.000Z') }));
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect((data.scheduled_for as Date).toISOString()).toBe('2026-06-10T14:00:00.000Z');
  });

  it('the bounce gate still applies under the pin', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active'));
    prisma.emailLog.findUnique.mockResolvedValue({ bounce_type: 'hard' });
    const out = await scheduleNextStep(prisma, step0Item({ email_log_id: 555 }));
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });
});

describe('scheduleNextStep, flag ON without an enrollment', () => {
  let prisma: ReturnType<typeof makePrisma>;
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    prisma = makePrisma();
  });

  it('item stamp only: reads that version, not the live table, and carries the stamp forward', async () => {
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver-1', status: 'frozen', steps: V2 });
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: LIVE_EDITED });

    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1' }));

    expect(out).toBe(201);
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.sequence_version_id).toBe('ver-1');
    expect(data.subject).toBe('S1');
    expect(data.idempotency_key).toBe('casey@freightroll.com:person@example.com:run-abc:1');
  });

  it('no enrollment and no stamp: the documented fallback to the live read, deterministic key, no stamp on the row', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: LIVE_EDITED });

    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(201);
    expect(prisma.sequenceEnrollment.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'run-abc' } }));
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.sequence.findUnique.mock.calls[0]).toEqual([{ where: { id: 9 } }]);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect('sequence_version_id' in data).toBe(false);
    expect(data.subject).toBe('LIVE-EDIT');
    expect(data.idempotency_key).toBe('casey@freightroll.com:person@example.com:run-abc:1');
  });

  it('a stamped version that no longer exists schedules nothing and never falls back to the live read', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: LIVE_EDITED });
    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-gone' }));
    expect(out).toBeNull();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('live sequence missing -> null, no create (as today)', async () => {
    prisma.sequence.findUnique.mockResolvedValue(null);
    expect(await scheduleNextStep(prisma, step0Item())).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
  });

  it('not part of a sequence -> null with no reads at all', async () => {
    expect(await scheduleNextStep(prisma, step0Item({ sequence_id: null }))).toBeNull();
    expect(prisma.sequenceEnrollment.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });
});

describe('STATUS import sanity', () => {
  it('created rows are approved', () => {
    expect(STATUS.approved).toBe('approved');
  });
});
