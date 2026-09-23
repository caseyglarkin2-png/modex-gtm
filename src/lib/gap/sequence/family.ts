/**
 * S3-T3: SequenceFamily service (spec section 4.5).
 *
 * A family is the sequence OBJECT: identity and engine only. Shapes live in
 * SequenceVersion (./version.ts); runs live in SequenceEnrollment
 * (./enrollment.ts). external-sync (S2-T4) still creates hubspot_native
 * families inline; it can move onto `createFamily` later without a behavior
 * change because the uniqueness checks here are the same two columns it
 * upserts on.
 *
 * House conventions: `prisma: any` glue, refusal objects `{ ok: false, reason }`
 * with literal reasons, uniqueness checked BEFORE the create so a collision is
 * a named refusal and not a P2002 thrown through the caller.
 *
 * Voice: no em dashes.
 */
import { SEQUENCE_ENGINES, type SequenceEngine } from '@/lib/gap/taxonomy';

/** Enrollment statuses that count as live for archive and already_enrolled checks. */
export const LIVE_ENROLLMENT_STATUSES = ['active', 'paused', 'stop_pending'] as const;

export interface CreateFamilyInput {
  name: string;
  engine: SequenceEngine;
  program?: string | null;
  accountName?: string | null;
  problemFamily?: string | null;
  persona?: string | null;
  hubspotSequenceId?: string | null;
  hubspotPortalId?: string | null;
  legacySequenceId?: number | null;
  createdBy: string;
}

export type CreateFamilyRefusal = 'bad_engine' | 'empty_name' | 'duplicate_hubspot_sequence' | 'duplicate_legacy_sequence';

export type CreateFamilyResult = { ok: true; id: string } | { ok: false; reason: CreateFamilyRefusal };

/**
 * Create one family. The two unique columns are checked first, in this order:
 * `hubspot_sequence_id` then `legacy_sequence_id`. Nothing is written when
 * either collides.
 */
export async function createFamily(prisma: any, input: CreateFamilyInput): Promise<CreateFamilyResult> {
  if (!(SEQUENCE_ENGINES as readonly string[]).includes(input.engine)) return { ok: false, reason: 'bad_engine' };
  const name = (input.name ?? '').trim();
  if (name === '') return { ok: false, reason: 'empty_name' };

  const hubspotSequenceId = input.hubspotSequenceId?.trim() || null;
  if (hubspotSequenceId) {
    const hit = await prisma.sequenceFamily.findUnique({
      where: { hubspot_sequence_id: hubspotSequenceId },
      select: { id: true },
    });
    if (hit) return { ok: false, reason: 'duplicate_hubspot_sequence' };
  }

  const legacySequenceId = typeof input.legacySequenceId === 'number' ? input.legacySequenceId : null;
  if (legacySequenceId !== null) {
    const hit = await prisma.sequenceFamily.findUnique({
      where: { legacy_sequence_id: legacySequenceId },
      select: { id: true },
    });
    if (hit) return { ok: false, reason: 'duplicate_legacy_sequence' };
  }

  const created = await prisma.sequenceFamily.create({
    data: {
      name,
      engine: input.engine,
      program: input.program ?? null,
      account_name: input.accountName ?? null,
      problem_family: input.problemFamily ?? null,
      persona: input.persona ?? null,
      hubspot_sequence_id: hubspotSequenceId,
      hubspot_portal_id: input.hubspotPortalId ?? null,
      legacy_sequence_id: legacySequenceId,
      created_by: input.createdBy,
    },
    select: { id: true },
  });
  return { ok: true, id: created.id };
}

export type ArchiveFamilyRefusal = 'family_not_found' | 'already_archived' | 'active_enrollments';

export type ArchiveFamilyResult =
  | { ok: true; id: string; archivedAt: Date; actor: string }
  | { ok: false; reason: ArchiveFamilyRefusal };

/**
 * Archive a family. Refused while any enrollment is active, paused or
 * stop_pending: archiving is a shelf, not a stop. Stop the runs first
 * (`stopEnrollmentsForVersion` per version, in ./enrollment.ts). The row has
 * no archived_by column; `actor` is returned in the result so the caller can
 * audit it.
 */
export async function archiveFamily(
  prisma: any,
  id: string,
  actor: string,
  now: Date = new Date(),
): Promise<ArchiveFamilyResult> {
  const family = await prisma.sequenceFamily.findUnique({ where: { id }, select: { id: true, archived_at: true } });
  if (!family) return { ok: false, reason: 'family_not_found' };
  if (family.archived_at) return { ok: false, reason: 'already_archived' };

  const live = await prisma.sequenceEnrollment.count({
    where: { family_id: id, status: { in: [...LIVE_ENROLLMENT_STATUSES] } },
  });
  if (live > 0) return { ok: false, reason: 'active_enrollments' };

  await prisma.sequenceFamily.update({
    where: { id },
    data: { archived_at: now },
    select: { id: true },
  });
  return { ok: true, id, archivedAt: now, actor };
}

export interface EnrollmentCounts {
  active: number;
  paused: number;
  stop_pending: number;
  stopped: number;
  completed: number;
  total: number;
}

export interface FamilyView {
  family: Record<string, unknown> & { id: string };
  versions: Array<Record<string, unknown> & { id: string; version: number; status: string }>;
  enrollmentCounts: EnrollmentCounts;
}

/** One family with its versions (ascending) and enrollment counts by status. Null when absent. */
export async function getFamily(prisma: any, id: string): Promise<FamilyView | null> {
  const family = await prisma.sequenceFamily.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'asc' } } },
  });
  if (!family) return null;

  const grouped: Array<{ status: string; _count: { _all: number } }> = await prisma.sequenceEnrollment.groupBy({
    by: ['status'],
    where: { family_id: id },
    _count: { _all: true },
  });
  const counts: EnrollmentCounts = { active: 0, paused: 0, stop_pending: 0, stopped: 0, completed: 0, total: 0 };
  for (const row of grouped) {
    const n = row._count?._all ?? 0;
    if (row.status in counts && row.status !== 'total') counts[row.status as keyof Omit<EnrollmentCounts, 'total'>] = n;
    counts.total += n;
  }

  const { versions, ...rest } = family;
  return { family: rest, versions: versions ?? [], enrollmentCounts: counts };
}
