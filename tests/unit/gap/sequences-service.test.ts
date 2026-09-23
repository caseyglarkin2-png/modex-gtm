/**
 * S3-T11: materializeSequence. Prisma is a hand-rolled spy covering exactly
 * the delegates the service uses. Pins the refusals (each with its literal
 * reason and zero writes), the happy path (legacy step shape, owner, audit)
 * and idempotence (a second call finds the row and writes nothing).
 */
import { describe, expect, it, vi } from 'vitest';

import { SEED_FAMILIES } from '@/lib/gap/sequences/families';
import { materializeSequence, sequenceNameFor, verifyStepCompiles } from '@/lib/gap/sequences/service';
import { toLegacySteps } from '@/lib/gap/sequence/resolve-steps';

const FAM = SEED_FAMILIES[1]; // Hidden Capacity, four steps
const VERSION = { id: 'ver_1', version: 1, status: 'draft', steps: FAM.steps, family: { id: 'fam_1', name: FAM.name } };

function compileRow(id: string, stepIndex: number, verdict: string, createdAt: string, versionId = 'ver_1', hypothesisId: string | null = 'H1') {
  return { id, sequence_version_id: versionId, step_index: stepIndex, verdict, created_at: new Date(createdAt), hypothesis_id: hypothesisId };
}

const FOUR_PASSES = [0, 1, 2, 3].map((i) => compileRow(`cmp_${i}`, i, 'pass', `2026-09-23T10:0${i}:00.000Z`));
const FOUR_IDS = FOUR_PASSES.map((r) => r.id);

function asyncSpy(impl: (...args: any[]) => Promise<any>) {
  return vi.fn<(...args: any[]) => Promise<any>>(impl);
}

function makePrisma(overrides: { version?: any; compiles?: any[]; existing?: any } = {}) {
  const compiles = overrides.compiles ?? FOUR_PASSES;
  return {
    sequenceVersion: { findUnique: asyncSpy(async () => ('version' in overrides ? overrides.version : VERSION)) },
    gapCompile: {
      findMany: asyncSpy(async ({ where }: any) => compiles.filter((r) => where.id.in.includes(r.id))),
    },
    sequence: {
      findFirst: asyncSpy(async () => overrides.existing ?? null),
      create: asyncSpy(async () => ({ id: 42 })),
    },
    gapAuditEvent: { create: asyncSpy(async () => ({ id: 'aud_1' })) },
  };
}

describe('materializeSequence refusals (no write on any of them)', () => {
  it('no_compile_ids', async () => {
    const prisma = makePrisma();
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [] }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'no_compile_ids' });
    expect(prisma.sequenceVersion.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('version_not_found', async () => {
    const prisma = makePrisma({ version: null });
    const r = await materializeSequence(prisma, { versionId: 'nope', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'version_not_found' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('version_retired', async () => {
    const prisma = makePrisma({ version: { ...VERSION, status: 'retired' } });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'version_retired' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('invalid_version_steps:<reason> when the stored steps do not parse', async () => {
    const prisma = makePrisma({ version: { ...VERSION, steps: { schema: 'steps.v2', steps: [] } } });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'invalid_version_steps:invalid_steps:steps' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('compile_not_found:<id> when a named compile row does not exist', async () => {
    const prisma = makePrisma();
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS, 'cmp_missing'] }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'compile_not_found:cmp_missing' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('compile_wrong_version:<id> when a named compile belongs to another version', async () => {
    const other = compileRow('cmp_other', 3, 'pass', '2026-09-23T11:00:00.000Z', 'ver_2');
    const prisma = makePrisma({ compiles: [...FOUR_PASSES.slice(0, 3), other] });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS.slice(0, 3), 'cmp_other'] }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'compile_wrong_version:cmp_other' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('R3-3: compile_wrong_hypothesis:<id> when a named row is bound to another hypothesis, or to none (materialize is live, so a template row never counts)', async () => {
    const other = compileRow('cmp_h2', 2, 'pass', '2026-09-23T11:00:00.000Z', 'ver_1', 'H2');
    const prisma = makePrisma({ compiles: [...FOUR_PASSES.filter((r) => r.step_index !== 2), other] });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS.filter((id) => id !== 'cmp_2'), 'cmp_h2'] }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'compile_wrong_hypothesis:cmp_h2' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();

    const template = compileRow('cmp_t', 2, 'pass', '2026-09-23T11:00:00.000Z', 'ver_1', null);
    const prisma2 = makePrisma({ compiles: [...FOUR_PASSES.filter((r) => r.step_index !== 2), template] });
    const r2 = await materializeSequence(prisma2, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS.filter((id) => id !== 'cmp_2'), 'cmp_t'] }, 'casey');
    expect(r2).toEqual({ ok: false, reason: 'compile_template_only:cmp_t' });
    expect(prisma2.gapCompile.findMany.mock.calls[0][0].select).toMatchObject({ hypothesis_id: true });
  });

  it('step_not_compiled:<i> names the first step with no compile row', async () => {
    const prisma = makePrisma({ compiles: FOUR_PASSES.filter((r) => r.step_index !== 2) });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS.filter((id) => id !== 'cmp_2') }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'step_not_compiled:2' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('step_not_passed:<i> when the NEWEST compile for a step is not a pass, even with an older pass', async () => {
    const newerReject = compileRow('cmp_1b', 1, 'reject', '2026-09-23T12:00:00.000Z');
    const prisma = makePrisma({ compiles: [...FOUR_PASSES, newerReject] });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS, 'cmp_1b'] }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'step_not_passed:1' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
  });

  it('step_not_passed:<i> for a review_required verdict', async () => {
    const prisma = makePrisma({ compiles: [...FOUR_PASSES.slice(0, 3), compileRow('cmp_3', 3, 'review_required', '2026-09-23T10:03:00.000Z')] });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'step_not_passed:3' });
  });
});

describe('materializeSequence happy path', () => {
  it('creates the runtime Sequence row in the legacy step shape and audits sequence.materialized', async () => {
    const prisma = makePrisma();
    const now = new Date('2026-09-23T15:00:00.000Z');
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey@freightroll.com', { now: () => now });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.sequenceId).toBe(42);
    expect(r.existing).toBe(false);
    expect(r.name).toBe('Hidden Capacity v1');

    const data = prisma.sequence.create.mock.calls[0][0].data;
    expect(data.name).toBe('Hidden Capacity v1');
    expect(data.owner).toBe('casey@freightroll.com');
    expect(data.steps).toEqual(toLegacySteps(FAM.steps));
    expect(data.steps.map((s: any) => [s.stepIndex, s.delayDays, s.delayUnit])).toEqual([
      [0, 0, 'business_days'],
      [1, 4, 'business_days'],
      [2, 5, 'business_days'],
      [3, 6, 'business_days'],
    ]);
    expect(data.steps[0].subjectTemplate).toBe(FAM.steps.steps[0].templates?.subjectTemplate);
    expect(data.steps[0].bodyTemplate).toBe(FAM.steps.steps[0].templates?.bodyTemplate);

    const audit = prisma.gapAuditEvent.create.mock.calls[0][0].data;
    expect(audit.kind).toBe('sequence.materialized');
    expect(audit.subject_type).toBe('sequence');
    expect(audit.subject_id).toBe('42');
    expect(audit.actor).toBe('casey@freightroll.com');
    expect(audit.payload).toMatchObject({ sequenceId: 42, versionId: 'ver_1', familyId: 'fam_1', version: 1, compileIds: FOUR_IDS, stepCount: 4, materializedAt: now.toISOString() });
    expect(r.audit).toEqual({ stored: true, reviewQueued: false });
  });

  it('honours an explicit owner', async () => {
    const prisma = makePrisma();
    await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'seed-script', { owner: 'casey@freightroll.com' });
    expect(prisma.sequence.create.mock.calls[0][0].data.owner).toBe('casey@freightroll.com');
  });

  it('is idempotent: a second call finds the row by name, compares its steps, writes nothing, answers existing: true', async () => {
    // The stored steps come back as JSON (key order may differ); equality is by value.
    const stored = JSON.parse(JSON.stringify(toLegacySteps(FAM.steps))).map((s: Record<string, unknown>) => Object.fromEntries(Object.entries(s).reverse()));
    const prisma = makePrisma({ existing: { id: 42, steps: stored } });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: true, sequenceId: 42, name: 'Hidden Capacity v1', existing: true, steps: toLegacySteps(FAM.steps) });
    expect(prisma.sequence.findFirst).toHaveBeenCalledWith({ where: { name: 'Hidden Capacity v1' }, orderBy: { created_at: 'asc' }, select: { id: true, steps: true } });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
    expect(prisma.gapAuditEvent.create).not.toHaveBeenCalled();
  });

  it('S11: a pre-existing Sequence with the same name but different steps is refused sequence_name_collision, never reused', async () => {
    const drifted = toLegacySteps(FAM.steps).map((s, i) => (i === 1 ? { ...s, delayDays: 9 } : s));
    const prisma = makePrisma({ existing: { id: 42, steps: drifted } });
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey');
    expect(r).toEqual({ ok: false, reason: 'sequence_name_collision' });
    expect(prisma.sequence.create).not.toHaveBeenCalled();
    // A row with no steps at all, or a non-array, is a collision too.
    const empty = makePrisma({ existing: { id: 42, steps: null } });
    expect(await materializeSequence(empty, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: FOUR_IDS }, 'casey')).toEqual({ ok: false, reason: 'sequence_name_collision' });
  });

  it('deduplicates repeated compile ids in the input', async () => {
    const prisma = makePrisma();
    const r = await materializeSequence(prisma, { versionId: 'ver_1', hypothesisId: 'H1', compileIds: [...FOUR_IDS, 'cmp_0'] }, 'casey');
    expect(r.ok).toBe(true);
    expect(prisma.gapCompile.findMany.mock.calls[0][0].where.id.in).toEqual(FOUR_IDS);
  });
});

describe('pure helpers', () => {
  it('sequenceNameFor falls back when the family has no name', () => {
    expect(sequenceNameFor('Hidden Capacity', 3)).toBe('Hidden Capacity v3');
    expect(sequenceNameFor(null, 1)).toBe('GAP family v1');
    expect(sequenceNameFor('  ', 2)).toBe('GAP family v2');
  });

  it('verifyStepCompiles reports the first failing step in order', () => {
    expect(verifyStepCompiles(4, FOUR_PASSES)).toBeNull();
    expect(verifyStepCompiles(4, FOUR_PASSES.slice(1))).toBe('step_not_compiled:0');
    expect(verifyStepCompiles(2, [compileRow('a', 0, 'pass', '2026-01-01'), compileRow('b', 1, 'reject', '2026-01-01')])).toBe('step_not_passed:1');
  });
});
