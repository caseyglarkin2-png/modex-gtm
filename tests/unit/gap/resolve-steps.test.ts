/**
 * S3-T5: the runtime step pin. Each of the three sources with its exact
 * `source`, a retired version still resolving, the flag-off structural proof
 * (enrollment and version delegates THROW on any access, so the only call
 * that can succeed is the legacy live read), and the legacy -> v2 -> legacy
 * round trip on the fields the runtime reads.
 */
import { describe, expect, it, vi } from 'vitest';

import { fromLegacyModexSteps } from '@/lib/gap/sequence/steps';
import {
  fromLiveSteps,
  resolveSteps,
  SEQUENCE_NOT_FOUND,
  toLegacySteps,
  VERSION_NOT_FOUND,
} from '@/lib/gap/sequence/resolve-steps';

/** The runtime test fixture, verbatim (tests/unit/queue-sequence-runtime.test.ts). */
const TWO_STEP = [
  { stepIndex: 0, delayDays: 0, subjectTemplate: 'S0', bodyTemplate: 'B0' },
  { stepIndex: 1, delayDays: 3, subjectTemplate: 'S1', bodyTemplate: 'B1' },
];

const V2 = fromLegacyModexSteps(TWO_STEP);

function item(overrides: Record<string, unknown> = {}) {
  return {
    sequence_id: 9,
    sequence_run_id: 'run-abc',
    sequence_version_id: null,
    step_index: 0,
    ...overrides,
  };
}

function makePrisma() {
  return {
    sequence: { findUnique: vi.fn() },
    sequenceEnrollment: { findUnique: vi.fn() },
    sequenceVersion: { findUnique: vi.fn() },
  };
}

/** A delegate whose every property access throws: proves the code never touched it. */
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

/** Strip the one field the legacy shape never had. */
function legacyFields(steps: ReturnType<typeof toLegacySteps>) {
  return steps.map(({ delayUnit: _unit, ...rest }) => rest);
}

describe('resolveSteps: sources under the flag', () => {
  it('enrollment_version: the enrollment (id = run id) wins; no version-by-stamp and no live read', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue({
      id: 'run-abc',
      status: 'active',
      sequence_version_id: 'ver-enr',
      version: { id: 'ver-enr', status: 'frozen', steps: V2 },
    });

    const out = await resolveSteps(prisma, item({ sequence_version_id: 'ver-stamp' }), { gapEnabled: true });

    expect(out.source).toBe('enrollment_version');
    expect(out.versionId).toBe('ver-enr');
    expect(out.versionStatus).toBe('frozen');
    expect(out.enrollmentStatus).toBe('active');
    expect(out.reason).toBeUndefined();
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
    expect(out.steps.every((s) => s.delayUnit === 'calendar_days')).toBe(true);
    expect(prisma.sequenceEnrollment.findUnique).toHaveBeenCalledWith({
      where: { id: 'run-abc' },
      select: {
        id: true,
        status: true,
        sequence_version_id: true,
        version: { select: { id: true, status: true, steps: true } },
      },
    });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });

  it('enrollment_version reports a paused enrollment so the runtime can schedule nothing', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue({
      id: 'run-abc',
      status: 'paused',
      sequence_version_id: 'ver-enr',
      version: { id: 'ver-enr', status: 'frozen', steps: V2 },
    });
    const out = await resolveSteps(prisma, item(), { gapEnabled: true });
    expect(out.source).toBe('enrollment_version');
    expect(out.enrollmentStatus).toBe('paused');
    expect(out.steps).toHaveLength(2);
  });

  it('item_stamp: no enrollment for the run, the item carries a version -> that version; no live read', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver-stamp', status: 'frozen', steps: V2 });

    const out = await resolveSteps(prisma, item({ sequence_version_id: 'ver-stamp' }), { gapEnabled: true });

    expect(out.source).toBe('item_stamp');
    expect(out.versionId).toBe('ver-stamp');
    expect(out.enrollmentStatus).toBeUndefined();
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
    expect(prisma.sequenceVersion.findUnique).toHaveBeenCalledWith({
      where: { id: 'ver-stamp' },
      select: { id: true, status: true, steps: true },
    });
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });

  it('item_stamp: a bare array in SequenceVersion.steps (what external-sync writes) still resolves', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'ver-stamp', status: 'frozen', steps: V2.steps });
    const out = await resolveSteps(prisma, item({ sequence_version_id: 'ver-stamp' }), { gapEnabled: true });
    expect(out.source).toBe('item_stamp');
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
  });

  it('item_stamp: a stamped version that does not exist fails closed (version_not_found), it does NOT fall back to the live read', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequenceVersion.findUnique.mockResolvedValue(null);
    const out = await resolveSteps(prisma, item({ sequence_version_id: 'ver-gone' }), { gapEnabled: true });
    expect(out).toEqual({ source: 'item_stamp', steps: [], versionId: 'ver-gone', reason: VERSION_NOT_FOUND });
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });

  it('legacy_live under the flag: no enrollment, no stamp -> exactly the runtime read, prisma.sequence.findUnique({ where: { id } })', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequence.findUnique.mockResolvedValue({ id: 9, steps: TWO_STEP });

    const out = await resolveSteps(prisma, item(), { gapEnabled: true });

    expect(out.source).toBe('legacy_live');
    expect(out.versionId).toBeUndefined();
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
    expect(out.steps.every((s) => s.delayUnit === 'calendar_days')).toBe(true);
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.sequence.findUnique.mock.calls[0]).toEqual([{ where: { id: 9 } }]);
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
  });

  it('a RETIRED version still resolves: retire blocks new enrollments only', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue({
      id: 'run-abc',
      status: 'active',
      sequence_version_id: 'ver-old',
      version: { id: 'ver-old', status: 'retired', steps: V2 },
    });
    const out = await resolveSteps(prisma, item(), { gapEnabled: true });
    expect(out.source).toBe('enrollment_version');
    expect(out.versionStatus).toBe('retired');
    expect(out.reason).toBeUndefined();
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
  });

  it('a pinned version whose steps do not parse resolves to no steps with the parse reason (never the live read)', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue({
      id: 'run-abc',
      status: 'active',
      sequence_version_id: 'ver-bad',
      version: { id: 'ver-bad', status: 'frozen', steps: { schema: 'steps.v2', steps: [] } },
    });
    const out = await resolveSteps(prisma, item(), { gapEnabled: true });
    expect(out.source).toBe('enrollment_version');
    expect(out.steps).toEqual([]);
    expect(out.reason).toBe('invalid_version_steps:invalid_steps:steps');
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });

  it('live sequence missing -> sequence_not_found with no steps (the runtime returns null on it, as today)', async () => {
    const prisma = makePrisma();
    prisma.sequenceEnrollment.findUnique.mockResolvedValue(null);
    prisma.sequence.findUnique.mockResolvedValue(null);
    const out = await resolveSteps(prisma, item(), { gapEnabled: true });
    expect(out).toEqual({ source: 'legacy_live', steps: [], reason: SEQUENCE_NOT_FOUND });
  });
});

describe('resolveSteps: flag off', () => {
  it('STRUCTURAL: only prisma.sequence.findUnique is called; the enrollment and version delegates throw on any access', async () => {
    const prisma = {
      sequence: { findUnique: vi.fn().mockResolvedValue({ id: 9, steps: TWO_STEP }) },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
    };

    const out = await resolveSteps(
      prisma,
      item({ sequence_run_id: 'run-abc', sequence_version_id: 'ver-stamp' }),
      { gapEnabled: false },
    );

    expect(out.source).toBe('legacy_live');
    expect(legacyFields(out.steps)).toEqual(TWO_STEP);
    expect(prisma.sequence.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.sequence.findUnique.mock.calls[0]).toEqual([{ where: { id: 9 } }]);
  });

  it('flag off with no sequence_id -> sequence_not_found and no call at all', async () => {
    const prisma = {
      sequence: { findUnique: vi.fn() },
      sequenceEnrollment: throwingDelegate('sequenceEnrollment'),
      sequenceVersion: throwingDelegate('sequenceVersion'),
    };
    const out = await resolveSteps(prisma, item({ sequence_id: null }), { gapEnabled: false });
    expect(out).toEqual({ source: 'legacy_live', steps: [], reason: SEQUENCE_NOT_FOUND });
    expect(prisma.sequence.findUnique).not.toHaveBeenCalled();
  });
});

describe('toLegacySteps round trip', () => {
  it('legacy -> fromLegacyModexSteps -> toLegacySteps is deep-equal on the fields the runtime reads', () => {
    const back = toLegacySteps(fromLegacyModexSteps(TWO_STEP));
    expect(legacyFields(back)).toEqual(TWO_STEP);
    expect(back.map((s) => s.delayUnit)).toEqual(['calendar_days', 'calendar_days']);
  });

  it('null templates come back OMITTED (the runtime does `step.subjectTemplate || item.subject`)', () => {
    const v2 = fromLegacyModexSteps([
      { stepIndex: 0, delayDays: 0 },
      { stepIndex: 1, delayDays: 2, subjectTemplate: 'only subject' },
    ]);
    const back = toLegacySteps(v2);
    expect(back[0]).toEqual({ stepIndex: 0, delayDays: 0, delayUnit: 'calendar_days' });
    expect('subjectTemplate' in back[0]).toBe(false);
    expect('bodyTemplate' in back[0]).toBe(false);
    expect(back[1]).toEqual({ stepIndex: 1, delayDays: 2, delayUnit: 'calendar_days', subjectTemplate: 'only subject' });
  });

  it('a business-day version carries delayUnit business_days so the runtime can convert before scheduling', () => {
    const back = toLegacySteps({
      schema: 'steps.v2',
      steps: [
        { ...V2.steps[0] },
        { ...V2.steps[1], delay: { value: 4, unit: 'business_days' } },
      ],
    });
    expect(back[1]).toMatchObject({ stepIndex: 1, delayDays: 4, delayUnit: 'business_days' });
  });

  it('fromLiveSteps tags the raw sequences.steps array calendar_days and refuses a non-array', () => {
    expect(fromLiveSteps(TWO_STEP)).toEqual(TWO_STEP.map((s) => ({ ...s, delayUnit: 'calendar_days' })));
    expect(fromLiveSteps({ not: 'an array' })).toEqual([]);
    expect(fromLiveSteps(null)).toEqual([]);
  });
});
