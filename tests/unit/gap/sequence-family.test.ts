/**
 * S3-T3: SequenceFamily service. Prisma is a hand-rolled spy object covering
 * exactly the delegates the service uses.
 */
import { describe, expect, it, vi } from 'vitest';

import { archiveFamily, createFamily, getFamily, LIVE_ENROLLMENT_STATUSES } from '@/lib/gap/sequence/family';

function asyncSpy(impl?: (...args: any[]) => Promise<any>) {
  return impl ? vi.fn<(...args: any[]) => Promise<any>>(impl) : vi.fn<(...args: any[]) => Promise<any>>();
}

function makePrisma() {
  return {
    sequenceFamily: {
      findUnique: asyncSpy(async () => null),
      create: asyncSpy(async () => ({ id: 'fam_new' })),
      update: asyncSpy(async () => ({ id: 'fam_1' })),
    },
    sequenceEnrollment: {
      count: asyncSpy(async () => 0),
      groupBy: asyncSpy(async () => []),
    },
  };
}

const NOW = new Date('2026-09-23T15:00:00.000Z');

describe('createFamily', () => {
  it('creates a family and returns its id', async () => {
    const prisma = makePrisma();
    const r = await createFamily(prisma, {
      name: 'Hidden Capacity / site ops',
      engine: 'modex_draft_queue',
      problemFamily: 'hidden_capacity',
      persona: 'site_ops',
      createdBy: 'casey',
    });
    expect(r).toEqual({ ok: true, id: 'fam_new' });
    const data = prisma.sequenceFamily.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      name: 'Hidden Capacity / site ops',
      engine: 'modex_draft_queue',
      problem_family: 'hidden_capacity',
      persona: 'site_ops',
      hubspot_sequence_id: null,
      legacy_sequence_id: null,
      created_by: 'casey',
    });
  });

  it('refuses duplicate_hubspot_sequence before any create', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockImplementation(async (args: any) =>
      args.where.hubspot_sequence_id === '311' ? { id: 'fam_existing' } : null,
    );
    const r = await createFamily(prisma, {
      name: 'Acme Top100',
      engine: 'hubspot_native',
      hubspotSequenceId: '311',
      createdBy: 'sync',
    });
    expect(r).toEqual({ ok: false, reason: 'duplicate_hubspot_sequence' });
    expect(prisma.sequenceFamily.create).not.toHaveBeenCalled();
    expect(prisma.sequenceFamily.findUnique).toHaveBeenCalledTimes(1);
  });

  it('refuses duplicate_legacy_sequence before any create', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockImplementation(async (args: any) =>
      args.where.legacy_sequence_id === 7 ? { id: 'fam_legacy' } : null,
    );
    const r = await createFamily(prisma, {
      name: 'Legacy 7',
      engine: 'modex_draft_queue',
      legacySequenceId: 7,
      createdBy: 'import',
    });
    expect(r).toEqual({ ok: false, reason: 'duplicate_legacy_sequence' });
    expect(prisma.sequenceFamily.create).not.toHaveBeenCalled();
  });

  it('refuses bad_engine and empty_name without touching the database', async () => {
    const prisma = makePrisma();
    expect(await createFamily(prisma, { name: 'x', engine: 'apollo' as any, createdBy: 'c' })).toEqual({
      ok: false,
      reason: 'bad_engine',
    });
    expect(await createFamily(prisma, { name: '   ', engine: 'manual', createdBy: 'c' })).toEqual({
      ok: false,
      reason: 'empty_name',
    });
    expect(prisma.sequenceFamily.findUnique).not.toHaveBeenCalled();
    expect(prisma.sequenceFamily.create).not.toHaveBeenCalled();
  });
});

describe('archiveFamily', () => {
  it('refuses active_enrollments when any live enrollment exists, with zero writes', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockResolvedValue({ id: 'fam_1', archived_at: null });
    prisma.sequenceEnrollment.count.mockResolvedValue(1);
    const r = await archiveFamily(prisma, 'fam_1', 'casey', NOW);
    expect(r).toEqual({ ok: false, reason: 'active_enrollments' });
    expect(prisma.sequenceEnrollment.count.mock.calls[0][0]).toEqual({
      where: { family_id: 'fam_1', status: { in: [...LIVE_ENROLLMENT_STATUSES] } },
    });
    expect(prisma.sequenceFamily.update).not.toHaveBeenCalled();
  });

  it('counts paused and stop_pending as live', () => {
    expect([...LIVE_ENROLLMENT_STATUSES]).toEqual(['active', 'paused', 'stop_pending']);
  });

  it('archives when nothing is live', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockResolvedValue({ id: 'fam_1', archived_at: null });
    const r = await archiveFamily(prisma, 'fam_1', 'casey', NOW);
    expect(r).toEqual({ ok: true, id: 'fam_1', archivedAt: NOW, actor: 'casey' });
    expect(prisma.sequenceFamily.update.mock.calls[0][0]).toMatchObject({
      where: { id: 'fam_1' },
      data: { archived_at: NOW },
    });
  });

  it('refuses family_not_found and already_archived', async () => {
    const prisma = makePrisma();
    expect(await archiveFamily(prisma, 'nope', 'casey', NOW)).toEqual({ ok: false, reason: 'family_not_found' });
    prisma.sequenceFamily.findUnique.mockResolvedValue({ id: 'fam_1', archived_at: NOW });
    expect(await archiveFamily(prisma, 'fam_1', 'casey', NOW)).toEqual({ ok: false, reason: 'already_archived' });
    expect(prisma.sequenceFamily.update).not.toHaveBeenCalled();
  });
});

describe('getFamily', () => {
  it('returns null when absent', async () => {
    const prisma = makePrisma();
    expect(await getFamily(prisma, 'nope')).toBeNull();
  });

  it('returns the family, its versions ascending and enrollment counts by status', async () => {
    const prisma = makePrisma();
    prisma.sequenceFamily.findUnique.mockResolvedValue({
      id: 'fam_1',
      name: 'Acme',
      engine: 'hubspot_native',
      versions: [
        { id: 'v1', version: 1, status: 'frozen' },
        { id: 'v2', version: 2, status: 'draft' },
      ],
    });
    prisma.sequenceEnrollment.groupBy.mockResolvedValue([
      { status: 'active', _count: { _all: 3 } },
      { status: 'stopped', _count: { _all: 2 } },
    ]);
    const view = await getFamily(prisma, 'fam_1');
    expect(view?.family).toEqual({ id: 'fam_1', name: 'Acme', engine: 'hubspot_native' });
    expect(view?.versions.map((v) => v.version)).toEqual([1, 2]);
    expect(view?.enrollmentCounts).toEqual({ active: 3, paused: 0, stop_pending: 0, stopped: 2, completed: 0, total: 5 });
    expect(prisma.sequenceFamily.findUnique.mock.calls[0][0]).toEqual({
      where: { id: 'fam_1' },
      include: { versions: { orderBy: { version: 'asc' } } },
    });
  });
});
