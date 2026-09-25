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

const { mockedCompile } = vi.hoisted(() => ({ mockedCompile: vi.fn<(...args: any[]) => Promise<any>>() }));
// R3-4: the per-item compile is a module mock so its call shape is asserted, not re-implemented.
vi.mock('@/lib/gap/compiler/compile', () => ({ compile: mockedCompile }));

import { fromLegacyModexSteps } from '@/lib/gap/sequence/steps';
import {
  firstNameOf,
  observationToMarkers,
  renderObservationSlot,
  renderPlaceholders,
  renderStepCopy,
  stripCitationMarkers,
  unrenderedPlaceholder,
} from '@/lib/gap/sequence/render';
import { renderSeedPlaceholders } from '@/lib/gap/sequences/families';
import { STATUS } from '@/lib/queue/types';
import { scheduleNextStep, sequenceStepIdempotencyKey } from '@/lib/queue/sequence-runtime';

const savedGapOs = process.env.GAP_OS_ENABLED;
const COMPILE_PASS = { id: 'cmp_rt', verdict: 'pass', checks: [], critic: { ok: true, verdict: 'pass', score: 100, findings: [] } };
beforeEach(() => {
  mockedCompile.mockReset();
  mockedCompile.mockResolvedValue(COMPILE_PASS);
});
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
    draftQueueItem: {
      create: vi.fn().mockResolvedValue({ id: 201 }),
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    gapAuditEvent: { create: vi.fn().mockResolvedValue({ id: 'aud_1' }) },
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
      gapAuditEvent: throwingDelegate('gapAuditEvent'),
    };

    // No version stamp on the item: this is a genuinely legacy run, so the
    // B5 flag-off refusal never triggers and scheduling proceeds as before.
    const out = await scheduleNextStep(prisma, step0Item());

    expect(out).toBe(201);
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.sequence.findUnique.mock.calls[0]).toEqual([{ where: { id: 9 } }]);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect('sequence_version_id' in data).toBe(false);
    expect(data.idempotency_key).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.idempotency_key).not.toContain('run-abc');
    expect(data.subject).toBe('S1');
    expect((data.scheduled_for as Date).toISOString()).toBe('2026-06-04T14:00:00.000Z');
    // R3-4: flag off is byte-identical: approved on create, no per-item compile.
    expect(data.status).toBe(STATUS.approved);
    expect(data.approved_at).toBeInstanceOf(Date);
    expect(mockedCompile).not.toHaveBeenCalled();
  });

  /**
   * B5 (Opus adversarial review, 2026-09-24, LIVE NOW). A version-stamped
   * item under flag-off used to be scheduled from the live sequence anyway
   * (this test used to assert exactly that). That made the kill switch
   * LESS safe: rolling GAP_OS_ENABLED off mid-run let the next step of a
   * GAP-compiled run through with no compile. Now it schedules nothing, and
   * still never touches the enrollment/version delegates (the pre-check
   * only looks at the item's own stamp).
   */
  it('B5: a version-stamped item under flag off schedules NOTHING, and never touches enrollment/version delegates', async () => {
    const prisma = {
      sequence: { findUnique: vi.fn().mockResolvedValue({ id: 9, steps: TWO_STEP }) },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
      emailLog: { findUnique: vi.fn() },
      draftQueueItem: { create: vi.fn().mockResolvedValue({ id: 201 }), findUnique: vi.fn() },
      gapAuditEvent: { create: vi.fn().mockResolvedValue({ id: 'aud_1' }) },
    };

    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1' }));

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.gapAuditEvent.create.mock.calls[0][0].data).toMatchObject({ kind: 'schedule.skipped' });
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

  it.each(['paused', 'stopped', 'completed', 'stop_pending'])('a %s enrollment schedules nothing and audits schedule.skipped naming the status (N5)', async (status) => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment(status));
    const out = await scheduleNextStep(prisma, step0Item());
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row).toMatchObject({ kind: 'schedule.skipped', actor: 'sequence-runtime', subject_id: '100' });
    expect(row.payload).toMatchObject({ reason: `enrollment_not_active:${status}`, source: 'enrollment_version', versionId: 'ver-enr', runId: 'run-abc' });
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
    // R3-4: no version to compile against, so the legacy run keeps today's approved row and no compile runs.
    expect(data.status).toBe(STATUS.approved);
    expect(mockedCompile).not.toHaveBeenCalled();
  });

  it('a stamped version that no longer exists schedules nothing, never falls back to the live read, and audits schedule.skipped with the reason (N5)', async () => {
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: LIVE_EDITED });
    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-gone' }));
    expect(out).toBeNull();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row).toMatchObject({ kind: 'schedule.skipped', actor: 'sequence-runtime', subject_type: 'draft_queue_item', subject_id: '100' });
    expect(row.payload).toMatchObject({ reason: 'version_not_found', source: 'item_stamp', versionId: 'ver-gone', runId: 'run-abc', stepIndex: 0, toEmail: 'person@example.com' });
  });

  it('N5: a pinned version whose steps do not parse schedules nothing and audits schedule.skipped with invalid_version_steps:<why>', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', { schema: 'steps.v2', steps: [] }));
    const out = await scheduleNextStep(prisma, step0Item());
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row.kind).toBe('schedule.skipped');
    expect(row.payload.reason).toMatch(/^invalid_version_steps:/);
    expect(row.payload).toMatchObject({ source: 'enrollment_version', versionId: 'ver-enr' });
  });

  it('N5: a missing live sequence under the flag (legacy run, nothing pinned) stays a silent null, exactly as today', async () => {
    prisma.sequence.findUnique.mockResolvedValue(null);
    expect(await scheduleNextStep(prisma, step0Item())).toBeNull();
    expect(prisma.gapAuditEvent.create).not.toHaveBeenCalled();
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

// ---------------------------------------------------------------------------
// S3-T12: placeholder rendering under the flag
// ---------------------------------------------------------------------------

const TEMPLATED = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'Re: {{account}} gate clerks', bodyTemplate: 'Hi {{first_name}},\n\n{{account}} posted three gate-clerk roles.\n\nCasey' },
];
const V2_TEMPLATED = fromLegacyModexSteps(TEMPLATED);
const UNRENDERABLE = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'Re: {{account}}', bodyTemplate: 'Hi {{first_name}}, as {{title}} you know.' },
];
const V2_UNRENDERABLE = fromLegacyModexSteps(UNRENDERABLE);

function makePrismaWithAudit() {
  return {
    ...makePrisma(),
    persona: { findUnique: vi.fn().mockResolvedValue({ name: 'Priya Natarajan' }) },
    gapAuditEvent: { create: vi.fn().mockResolvedValue({ id: 'aud_1' }) },
  };
}

describe('render helpers', () => {
  it('renders exactly {{first_name}} and {{account}}, identically to the families seed renderer', () => {
    const text = 'Hi {{first_name}}, {{account}} and {{other}} stay.';
    const values = { firstName: 'Kara', account: 'Acme Logistics' };
    expect(renderPlaceholders(text, values)).toBe('Hi Kara, Acme Logistics and {{other}} stay.');
    expect(renderPlaceholders(text, values)).toBe(renderSeedPlaceholders(text, values));
  });

  it('firstNameOf takes the first word and falls back to "there"', () => {
    expect(firstNameOf('Kara Jones')).toBe('Kara');
    expect(firstNameOf('  ')).toBe('there');
    expect(firstNameOf(null)).toBe('there');
  });

  it('firstNameOf capitalises an all-lowercase stored name ("joey maggard" -> Joey) and keeps deliberate casing (final pass)', () => {
    expect(firstNameOf('joey maggard')).toBe('Joey');
    expect(firstNameOf('DeShawn Price')).toBe('DeShawn');
    expect(firstNameOf('mary-kate olsen')).toBe('Mary-kate');
  });

  it('unrenderedPlaceholder names the first token left, or null', () => {
    expect(unrenderedPlaceholder('Hi Kara')).toBeNull();
    expect(unrenderedPlaceholder('Hi {{first_name}}')).toBe('first_name');
    expect(unrenderedPlaceholder('as {{ title }} you')).toBe('title');
    expect(unrenderedPlaceholder('{{}}')).toBe('empty');
    expect(unrenderedPlaceholder('Hook. {{observation}}')).toBe('observation');
  });

  it('R3-4: observationToMarkers turns [S:id] into [[SRC:id]] and renderObservationSlot fills the slot, leaving it when the observation is empty', () => {
    expect(observationToMarkers('Acme posted three roles [S:sig_1] and opened a DC [S:sig-2].')).toBe('Acme posted three roles [[SRC:sig_1]] and opened a DC [[SRC:sig-2]].');
    expect(renderObservationSlot('Hook. {{observation}}\n\nGuess.', 'Fact [S:a].')).toBe('Hook. Fact [[SRC:a]].\n\nGuess.');
    expect(renderObservationSlot('Hook. {{observation}}', '')).toBe('Hook. {{observation}}');
    expect(renderObservationSlot('Hook. {{observation}}', null)).toBe('Hook. {{observation}}');
  });

  it('R3-4: stripCitationMarkers removes both marker forms and the space a marker leaves before punctuation', () => {
    expect(stripCitationMarkers('Fact [[SRC:a]]. Another [S:b], then [[SRC:c]] end.\n\nNext.')).toBe('Fact. Another, then end.\n\nNext.');
  });

  it('R3-4: renderStepCopy yields the marked copy for the compiler and the stripped copy for the queue, and names an unrendered token', () => {
    const r = renderStepCopy(
      { subject: 'Re: {{account}}', body: 'Hi {{first_name}},\n{{observation}}\n\nMy guess is the lot.\n\nCasey' },
      { firstName: 'Kara', account: 'Acme Logistics', observation: 'Acme posted three gate-clerk roles [S:sig_1].' },
    );
    expect(r.marked.body).toBe('Hi Kara,\nAcme posted three gate-clerk roles [[SRC:sig_1]].\n\nMy guess is the lot.\n\nCasey');
    expect(r.queued.body).toBe('Hi Kara,\nAcme posted three gate-clerk roles.\n\nMy guess is the lot.\n\nCasey');
    expect(r.marked.subject).toBe('Re: Acme Logistics');
    expect(r.unrendered).toBeNull();
    const empty = renderStepCopy({ subject: 'S', body: 'Hi {{first_name}},\n{{observation}}' }, { firstName: 'Kara', account: 'A', observation: null });
    expect(empty.unrendered).toBe('observation');
  });
});

// ---------------------------------------------------------------------------
// R3-4: the observation slot, the marker strip and the per-item compile
// ---------------------------------------------------------------------------

const SLOTTED = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'Re: {{account}}', bodyTemplate: 'Hi {{first_name}},\n{{observation}}\n\nMy guess is the lot is the constraint.\n\nWorth the short version?\n\nCasey' },
];
const V2_SLOTTED = fromLegacyModexSteps(SLOTTED);
const SIG_1 = {
  id: 'sig_1',
  title: 'Three gate-clerk roles posted',
  evidence_url: 'https://example.com/jobs',
  external_ok: true,
  observed_at: new Date('2026-06-01T00:00:00.000Z'),
  freshness_expires_at: new Date('2027-01-01T00:00:00.000Z'),
  source_type: 'public_primary',
  metadata: null,
};

function enrollmentWithHypothesis(status = 'active', steps: unknown = V2_SLOTTED, observation: string | null = 'Acme posted three gate-clerk roles [S:sig_1].') {
  return {
    ...enrollment(status, steps),
    hypothesis_id: 'H1',
    hypothesis: { observation, problem_hypothesis: 'The lot is the constraint.', problem_family: 'hidden_capacity', signals: [{ signal: SIG_1 }] },
  };
}

describe('scheduleNextStep per-item compile (R3-4)', () => {
  let prisma: ReturnType<typeof makePrismaWithAudit>;
  beforeEach(() => {
    process.env.GAP_OS_ENABLED = 'true';
    prisma = makePrismaWithAudit();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollmentWithHypothesis());
    prisma.draftQueueItem.findMany.mockResolvedValue([{ body: 'orig body' }]);
  });

  it('fills the slot from the hypothesis, queues the STRIPPED body as draft, compiles the MARKED body keyed to the item, and approves on pass', async () => {
    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));

    expect(out).toBe(201);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.status).toBe(STATUS.draft);
    expect('approved_at' in data).toBe(false);
    expect(data.body).toBe('Hi Kara,\nAcme posted three gate-clerk roles.\n\nMy guess is the lot is the constraint.\n\nWorth the short version?\n\nCasey');
    expect(data.body).not.toContain('[[');
    expect(data.body).not.toContain('[S:');
    expect(data.subject).toBe('Re: Acme Logistics');

    expect(mockedCompile).toHaveBeenCalledTimes(1);
    const [input, deps] = mockedCompile.mock.calls[0];
    expect(input).toMatchObject({
      hypothesisId: 'H1',
      sequenceVersionId: 'ver-enr',
      draftQueueItemId: 201,
      stepIndex: 1,
      subject: 'Re: Acme Logistics',
      priorBodies: ['orig body'],
      createdBy: 'sequence-runtime',
    });
    expect(input.body).toContain('[[SRC:sig_1]]');
    expect(input.contract).toMatchObject({
      hypothesis: { observation: 'Acme posted three gate-clerk roles [S:sig_1].', problemHypothesis: 'The lot is the constraint.', problemFamily: 'hidden_capacity' },
      evidence: [{ id: 'sig_1', title: 'Three gate-clerk roles posted', url: 'https://example.com/jobs', externalOk: true, fresh: true, superseded: false, firstParty: false }],
      stepCount: 2,
      claimsUsed: [],
    });
    expect(deps.prisma).toBe(prisma);
    expect(typeof deps.critic?.score).toBe('function');
    // The prior bodies come from the run's earlier items, in step order.
    expect(prisma.draftQueueItem.findMany).toHaveBeenCalledWith({
      where: { sequence_run_id: 'run-abc', step_index: { lt: 1 } },
      orderBy: { step_index: 'asc' },
      select: { body: true },
    });
    // The pass promotes the draft; nothing is audited.
    expect(prisma.draftQueueItem.updateMany).toHaveBeenCalledWith({
      where: { id: 201, status: STATUS.draft },
      data: { status: STATUS.approved, approved_at: expect.any(Date) },
    });
    expect(prisma.gapAuditEvent.create).not.toHaveBeenCalled();
  });

  it.each(['reject', 'review_required'])('a %s compile leaves the step draft (skipped_reason untouched) and audits schedule.compile_not_passed', async (verdict) => {
    mockedCompile.mockResolvedValue({
      id: 'cmp_bad',
      verdict,
      checks: [
        { code: 'C01', passed: false, severity: 'reject', detail: 'unresolved' },
        { code: 'C02', passed: true, severity: 'reject', detail: '' },
      ],
      critic: { ok: false, reason: 'critic_skipped:check_reject' },
    });

    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));

    expect(out).toBe(201);
    expect(prisma.draftQueueItem.create.mock.calls[0][0].data.status).toBe(STATUS.draft);
    expect(prisma.draftQueueItem.updateMany).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row).toMatchObject({ kind: 'schedule.compile_not_passed', actor: 'sequence-runtime', subject_type: 'draft_queue_item', subject_id: '201' });
    expect(row.payload).toMatchObject({ itemId: 201, stepIndex: 1, runId: 'run-abc', versionId: 'ver-enr', compileId: 'cmp_bad', verdict, failedChecks: ['C01'] });
  });

  it('a slot with no hypothesis observation schedules NOTHING: audit unrendered_placeholder (observation), no create, no compile', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollmentWithHypothesis('active', V2_SLOTTED, null));
    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(mockedCompile).not.toHaveBeenCalled();
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row.kind).toBe('schedule.unrendered_placeholder');
    expect(row.payload).toMatchObject({ token: 'observation', stepIndex: 1 });
  });

  it('a step whose template carries its own [[SRC:id]] marker is queued stripped and compiled marked, even without a slot', async () => {
    const own = fromLegacyModexSteps([
      SLOTTED[0],
      { stepIndex: 1, delayDays: 3, subjectTemplate: 'S1', bodyTemplate: 'Hi {{first_name}},\nYour careers page lists an analyst [[SRC:ns_ev_2]].\n\nCasey' },
    ]);
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollmentWithHypothesis('active', own));
    await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));
    expect(prisma.draftQueueItem.create.mock.calls[0][0].data.body).toBe('Hi Kara,\nYour careers page lists an analyst.\n\nCasey');
    expect(mockedCompile.mock.calls[0][0].body).toBe('Hi Kara,\nYour careers page lists an analyst [[SRC:ns_ev_2]].\n\nCasey');
  });

  it('opts inject the critic, the claims validator and extra contract fields (merged over the defaults)', async () => {
    const critic = { score: vi.fn(async () => ({ ok: true as const, verdict: 'pass' as const, score: 100, findings: [] })) };
    await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }), { critic, validateClaims: null, contract: { namedPipeline: ['Example Co'], stepCount: 9 } });
    const [input, deps] = mockedCompile.mock.calls[0];
    expect(deps.critic).toBe(critic);
    expect(deps.validateClaims).toBeNull();
    expect(input.contract.namedPipeline).toEqual(['Example Co']);
    expect(input.contract.stepCount).toBe(9);
  });

  it('the item stamp path (no enrollment) also compiles per item, with no hypothesis and no evidence', async () => {
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver-1', status: 'frozen', steps: V2_TEMPLATED });
    const out = await scheduleNextStep(prisma, step0Item({ sequence_version_id: 'ver-1', persona_name: 'Kara Jones' }));
    expect(out).toBe(201);
    expect(prisma.draftQueueItem.create.mock.calls[0][0].data.status).toBe(STATUS.draft);
    const [input] = mockedCompile.mock.calls[0];
    expect(input).toMatchObject({ hypothesisId: null, sequenceVersionId: 'ver-1', draftQueueItemId: 201, stepIndex: 1 });
    expect(input.contract.evidence).toEqual([]);
  });

  it('a retry after a crash (P2002) returns the existing step and does NOT compile it again', async () => {
    prisma.draftQueueItem.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }));
    prisma.draftQueueItem.findUnique.mockResolvedValue({ id: 777 });
    expect(await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }))).toBe(777);
    expect(mockedCompile).not.toHaveBeenCalled();
  });
});

describe('scheduleNextStep placeholder rendering (S3-T12)', () => {
  it('flag ON: renders {{first_name}} from the item persona_name and {{account}} from account_name on the pinned step', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrismaWithAudit();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', V2_TEMPLATED));

    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));

    expect(out).toBe(201);
    const data = prisma.draftQueueItem.create.mock.calls[0][0].data;
    expect(data.subject).toBe('Re: Acme Logistics gate clerks');
    expect(data.body).toBe('Hi Kara,\n\nAcme Logistics posted three gate-clerk roles.\n\nCasey');
    expect(prisma.persona.findUnique).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).not.toHaveBeenCalled();
  });

  it('flag ON: an item without persona_name reads the Persona row by persona_id', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrismaWithAudit();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', V2_TEMPLATED));

    await scheduleNextStep(prisma, step0Item({ persona_name: null, persona_id: 7 }));

    expect(prisma.persona.findUnique).toHaveBeenCalledWith({ where: { id: 7 }, select: { name: true } });
    expect(prisma.draftQueueItem.create.mock.calls[0][0].data.body.startsWith('Hi Priya,')).toBe(true);
  });

  it('flag ON: no name anywhere renders the fallback greeting', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrismaWithAudit();
    prisma.persona.findUnique.mockResolvedValue(null);
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', V2_TEMPLATED));
    await scheduleNextStep(prisma, step0Item({ persona_name: '', persona_id: 7 }));
    expect(prisma.draftQueueItem.create.mock.calls[0][0].data.body.startsWith('Hi there,')).toBe(true);
  });

  /**
   * B5 (Opus adversarial review, 2026-09-24, LIVE NOW). This test used to
   * prove the template was queued byte for byte, braces and all, and
   * approved directly: a legacy `Sequence.steps` row carrying unrendered
   * GAP templates (materializeSequence writes exactly this shape) would be
   * sent to a prospect with a literal "{{account}}" in the subject line.
   * Flag off now refuses to schedule a step whose copy still has a
   * {{token}}, rather than queuing it verbatim.
   */
  it('B5: flag OFF + an unrendered {{token}} schedules NOTHING, not the raw template', async () => {
    delete process.env.GAP_OS_ENABLED;
    const prisma = {
      sequence: { findUnique: vi.fn().mockResolvedValue({ id: 9, steps: TEMPLATED }) },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
      persona: throwingDelegate('persona'),
      gapAuditEvent: { create: vi.fn().mockResolvedValue({ id: 'aud_1' }) },
      emailLog: { findUnique: vi.fn() },
      draftQueueItem: { create: vi.fn().mockResolvedValue({ id: 201 }), findUnique: vi.fn() },
    };
    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));
    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create.mock.calls[0][0].data).toMatchObject({ kind: 'schedule.skipped' });
  });

  it('flag ON: a token the renderer does not know schedules NOTHING and audits schedule.unrendered_placeholder with the token', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    const prisma = makePrismaWithAudit();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(enrollment('active', V2_UNRENDERABLE));

    const out = await scheduleNextStep(prisma, step0Item({ persona_name: 'Kara Jones' }));

    expect(out).toBeNull();
    expect(prisma.draftQueueItem.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).toHaveBeenCalledTimes(1);
    const row = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(row).toMatchObject({
      kind: 'schedule.unrendered_placeholder',
      actor: 'sequence-runtime',
      subject_type: 'draft_queue_item',
      subject_id: '100',
    });
    expect(row.payload).toMatchObject({ token: 'title', stepIndex: 1, runId: 'run-abc', versionId: 'ver-enr', toEmail: 'person@example.com' });
  });
});

describe('STATUS import sanity', () => {
  it('created rows are approved', () => {
    expect(STATUS.approved).toBe('approved');
  });
});
