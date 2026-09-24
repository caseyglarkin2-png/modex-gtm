/**
 * S3-T3: SequenceVersion service. Hand-rolled prisma spies; the freeze test
 * passes a bare tx object because the function runs on the transaction client.
 */
import { describe, expect, it, vi } from 'vitest';

import { fromLaneScaffold, stepsHash } from '@/lib/gap/sequence/steps';
import {
  assertVersionEditable,
  createVersion,
  freezeVersionForEnrollment,
  GAP_VERSION_FROZEN,
  pickVersionAt,
  retireVersion,
  SequenceVersionFrozenError,
  updateVersionSteps,
} from '@/lib/gap/sequence/version';

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function makePrisma() {
  return {
    sequenceFamily: { findUnique: asyncSpy(async () => ({ id: 'fam_1', archived_at: null })) },
    sequenceVersion: {
      findUnique: asyncSpy(async () => null),
      findMany: asyncSpy(async () => []),
      create: asyncSpy(async () => ({ id: 'ver_new' })),
      update: asyncSpy(async () => ({ id: 'ver_1' })),
      updateMany: asyncSpy(async () => ({ count: 1 })),
    },
  };
}

const NOW = new Date('2026-09-23T15:00:00.000Z');
const STEPS_A = fromLaneScaffold([0, 3, 4, 5], { '1': 't1', '2': 't2', '3': 't3', '4': 't4' });
const STEPS_B = fromLaneScaffold([0, 2, 4, 5], { '1': 't1', '2': 't2', '3': 't3', '4': 't4' });

describe('assertVersionEditable', () => {
  it('passes a draft and throws GAP_VERSION_FROZEN for frozen and retired', () => {
    expect(() => assertVersionEditable({ id: 'v', status: 'draft' })).not.toThrow();
    for (const status of ['frozen', 'retired']) {
      let caught: unknown = null;
      try {
        assertVersionEditable({ id: 'v9', status });
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(SequenceVersionFrozenError);
      expect((caught as Error).name).toBe(GAP_VERSION_FROZEN);
      expect((caught as Error).message).toContain('sequence_versions.v9');
      expect((caught as Error).message).toContain(status);
    }
  });
});

describe('createVersion', () => {
  it('inserts max+1 as a draft with the steps hash', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findMany.mockResolvedValue([
      { id: 'v1', version: 1, steps_hash: 'h1' },
      { id: 'v3', version: 3, steps_hash: 'h3' },
    ]);
    const r = await createVersion(prisma, 'fam_1', STEPS_A, { createdBy: 'casey', changeNote: 'first', fromVersionId: 'v3' });
    expect(r).toEqual({ ok: true, id: 'ver_new', version: 4, stepsHash: stepsHash(STEPS_A) });
    const data = prisma.sequenceVersion.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      family_id: 'fam_1',
      version: 4,
      status: 'draft',
      steps_hash: stepsHash(STEPS_A),
      change_note: 'first',
      created_by: 'casey',
      provenance: { from_version_id: 'v3' },
    });
    expect(data.steps).toEqual(STEPS_A);
  });

  it('refuses identical_to_version:<n> naming the twin and writes nothing', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findMany.mockResolvedValue([
      { id: 'v1', version: 1, steps_hash: stepsHash(STEPS_B) },
      { id: 'v2', version: 2, steps_hash: stepsHash(STEPS_A) },
    ]);
    const r = await createVersion(prisma, 'fam_1', STEPS_A, { createdBy: 'casey' });
    expect(r).toEqual({ ok: false, reason: 'identical_to_version:2' });
    expect(prisma.sequenceVersion.create).not.toHaveBeenCalled();
  });

  it('accepts a bare step array and hashes it the same as the envelope', async () => {
    const prisma = makePrisma();
    const r = await createVersion(prisma, 'fam_1', STEPS_A.steps, { createdBy: 'casey' });
    expect(r).toMatchObject({ ok: true, version: 1, stepsHash: stepsHash(STEPS_A) });
  });

  it('refuses with the parse reason before reading the database', async () => {
    const prisma = makePrisma();
    const bad = { ...STEPS_A, steps: [{ ...STEPS_A.steps[0], productProofAllowed: true }, ...STEPS_A.steps.slice(1)] };
    expect(await createVersion(prisma, 'fam_1', bad, { createdBy: 'casey' })).toEqual({ ok: false, reason: 'first_touch_proof' });
    expect(await createVersion(prisma, 'fam_1', { schema: 'steps.v2', steps: [] }, { createdBy: 'casey' })).toEqual({
      ok: false,
      reason: 'invalid_steps:steps',
    });
    expect(prisma.sequenceFamily.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequenceVersion.create).not.toHaveBeenCalled();
  });

  it('refuses family_not_found, family_archived and from_version_not_found', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockResolvedValueOnce(null);
    expect(await createVersion(prisma, 'nope', STEPS_A, { createdBy: 'c' })).toEqual({ ok: false, reason: 'family_not_found' });
    prisma.sequenceFamily.findUnique.mockResolvedValueOnce({ id: 'fam_1', archived_at: NOW });
    expect(await createVersion(prisma, 'fam_1', STEPS_A, { createdBy: 'c' })).toEqual({ ok: false, reason: 'family_archived' });
    expect(await createVersion(prisma, 'fam_1', STEPS_A, { createdBy: 'c', fromVersionId: 'ghost' })).toEqual({
      ok: false,
      reason: 'from_version_not_found',
    });
    expect(prisma.sequenceVersion.create).not.toHaveBeenCalled();
  });
});

describe('updateVersionSteps', () => {
  it('refuses version_frozen with zero writes for a frozen version', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'frozen', steps_hash: 'h', provenance: null });
    const r = await updateVersionSteps(prisma, 'v1', STEPS_B, 'casey', NOW);
    expect(r).toEqual({ ok: false, reason: 'version_frozen' });
    expect(prisma.sequenceVersion.update).not.toHaveBeenCalled();
    expect(prisma.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });

  it('refuses version_frozen for retired too', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'retired', steps_hash: 'h', provenance: null });
    expect(await updateVersionSteps(prisma, 'v1', STEPS_B, 'casey', NOW)).toEqual({ ok: false, reason: 'version_frozen' });
    expect(prisma.sequenceVersion.update).not.toHaveBeenCalled();
  });

  it('re-parses and re-hashes a draft, recording the actor in provenance', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({
      id: 'v1',
      status: 'draft',
      steps_hash: stepsHash(STEPS_A),
      provenance: { source: 'manifest' },
    });
    const r = await updateVersionSteps(prisma, 'v1', STEPS_B, 'casey', NOW);
    expect(r).toEqual({ ok: true, id: 'v1', stepsHash: stepsHash(STEPS_B), changed: true });
    expect(prisma.sequenceVersion.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'v1' },
      data: {
        steps: STEPS_B,
        steps_hash: stepsHash(STEPS_B),
        provenance: { source: 'manifest', edited_by: 'casey', edited_at: NOW.toISOString() },
      },
    });
  });

  it('treats an unchanged hash as a no-op with no write', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'draft', steps_hash: stepsHash(STEPS_A), provenance: null });
    expect(await updateVersionSteps(prisma, 'v1', STEPS_A, 'casey', NOW)).toEqual({
      ok: true,
      id: 'v1',
      stepsHash: stepsHash(STEPS_A),
      changed: false,
    });
    expect(prisma.sequenceVersion.update).not.toHaveBeenCalled();
  });

  it('refuses a draft edit whose steps do not parse, without writing', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'draft', steps_hash: 'h', provenance: null });
    expect(await updateVersionSteps(prisma, 'v1', 'garbage', 'casey', NOW)).toEqual({ ok: false, reason: 'invalid_steps:root' });
    expect(prisma.sequenceVersion.update).not.toHaveBeenCalled();
  });
});

describe('retireVersion', () => {
  it('refuses not_frozen for a draft, with zero writes', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'draft' });
    expect(await retireVersion(prisma, 'v1', 'casey', NOW)).toEqual({ ok: false, reason: 'not_frozen' });
    expect(prisma.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });

  it('refuses not_frozen for an already retired version', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'retired' });
    expect(await retireVersion(prisma, 'v1', 'casey', NOW)).toEqual({ ok: false, reason: 'not_frozen' });
  });

  it('moves frozen -> retired with an optimistic status guard and no enrollment writes', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'frozen' });
    expect(await retireVersion(prisma, 'v1', 'casey', NOW)).toEqual({ ok: true, id: 'v1', retiredAt: NOW, actor: 'casey' });
    expect(prisma.sequenceVersion.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'v1', status: 'frozen' },
      data: { status: 'retired', retired_at: NOW },
    });
    expect((prisma as Record<string, unknown>).sequenceEnrollment).toBeUndefined();
  });

  it('reports stale_status when the row moved between read and write', async () => {
    const prisma = makePrisma();
    prisma.sequenceVersion.findUnique.mockResolvedValue({ id: 'v1', status: 'frozen' });
    prisma.sequenceVersion.updateMany.mockResolvedValue({ count: 0 });
    expect(await retireVersion(prisma, 'v1', 'casey', NOW)).toEqual({ ok: false, reason: 'stale_status' });
  });
});

describe('freezeVersionForEnrollment', () => {
  function makeTx(status: string) {
    return {
      sequenceVersion: {
        findUnique: asyncSpy(async () => ({ id: 'v1', status })),
        updateMany: asyncSpy(async () => ({ count: 1 })),
      },
    };
  }

  it('sets status, frozen_at and frozen_by_enrollment_id from draft', async () => {
    const tx = makeTx('draft');
    expect(await freezeVersionForEnrollment(tx, 'v1', 'enr_1', NOW)).toEqual({ frozen: true, versionId: 'v1' });
    expect(tx.sequenceVersion.updateMany.mock.calls[0][0]).toEqual({
      where: { id: 'v1', status: 'draft' },
      data: { status: 'frozen', frozen_at: NOW, frozen_by_enrollment_id: 'enr_1' },
    });
  });

  it('no-ops from frozen', async () => {
    const tx = makeTx('frozen');
    expect(await freezeVersionForEnrollment(tx, 'v1', 'enr_2', NOW)).toEqual({ frozen: false, versionId: 'v1', status: 'frozen' });
    expect(tx.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });

  it('throws version_retired from retired and version_not_found when missing', async () => {
    await expect(freezeVersionForEnrollment(makeTx('retired'), 'v1', 'enr_3', NOW)).rejects.toThrow('version_retired');
    const missing = { sequenceVersion: { findUnique: asyncSpy(async () => null), updateMany: asyncSpy() } };
    await expect(freezeVersionForEnrollment(missing, 'v1', 'enr_3', NOW)).rejects.toThrow('version_not_found');
    expect(missing.sequenceVersion.updateMany).not.toHaveBeenCalled();
  });

  it('treats a lost race (trigger froze it first) as a no-op, not a failure', async () => {
    const tx = makeTx('draft');
    tx.sequenceVersion.updateMany.mockResolvedValue({ count: 0 });
    expect(await freezeVersionForEnrollment(tx, 'v1', 'enr_1', NOW)).toEqual({ frozen: false, versionId: 'v1', status: 'frozen' });
  });
});

describe('pickVersionAt', () => {
  const v1 = { id: 'v1', version: 1, provenance: { journal_ts: '2026-09-12T10:00:00.000Z' }, created_at: new Date('2026-09-23T00:00:00Z') };
  const v2 = { id: 'v2', version: 2, provenance: { journal_ts: '2026-09-15T09:00:00.000Z' }, created_at: new Date('2026-09-23T00:00:00Z') };
  const v3 = { id: 'v3', version: 3, provenance: null, created_at: new Date('2026-09-20T00:00:00Z') };

  it('picks the newest journal_ts at or before the moment', () => {
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-14T00:00:00Z'))?.id).toBe('v1');
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-16T00:00:00Z'))?.id).toBe('v2');
  });

  it('an equal timestamp picks that version', () => {
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-15T09:00:00.000Z'))?.id).toBe('v2');
  });

  it('one millisecond before the boundary picks the prior version', () => {
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-15T08:59:59.999Z'))?.id).toBe('v1');
  });

  it('falls back to created_at without journal_ts and returns null before every version', () => {
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-21T00:00:00Z'))?.id).toBe('v3');
    expect(pickVersionAt([v1, v2, v3], new Date('2026-09-01T00:00:00Z'))).toBeNull();
    expect(pickVersionAt([], new Date())).toBeNull();
  });

  it('breaks a timestamp tie by the higher version number', () => {
    const a = { id: 'a', version: 1, provenance: { journal_ts: '2026-09-15T09:00:00.000Z' }, created_at: new Date() };
    const b = { id: 'b', version: 2, provenance: { journal_ts: '2026-09-15T09:00:00.000Z' }, created_at: new Date() };
    expect(pickVersionAt([b, a], new Date('2026-09-16T00:00:00Z'))?.id).toBe('b');
  });
});
