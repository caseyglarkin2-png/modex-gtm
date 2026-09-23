/**
 * S3-T3: SequenceVersion service (spec sections 4.5 and 5.3).
 *
 * A version is one immutable SHAPE of a family. The lifecycle is
 * draft -> frozen (first non-test enrollment) -> retired (by hand). Only a
 * draft ever changes; "editing" anything else means `createVersion` as draft
 * max+1. The database enforces the same rule with the GAP_VERSION_FROZEN
 * trigger; this module refuses BEFORE reaching the write path so the trigger
 * is the second line, not the first, and unit tests can assert zero writes.
 *
 * `freezeVersionForEnrollment` is the code mirror of the AFTER INSERT trigger
 * on sequence_enrollments. Inside the live enroll transaction the trigger has
 * already frozen the row by the time this runs, so it reads `frozen` and
 * no-ops; against a mocked prisma it performs the freeze, which is what lets
 * the enrollment tests assert the three columns.
 *
 * Retiring never stops enrollments: `stopEnrollmentsForVersion` in
 * ./enrollment.ts is a separate, explicit operator call (spec 5.3).
 *
 * Voice: no em dashes.
 */
import { parseSteps, stepsHash, type StepsV2 } from '@/lib/gap/sequence/steps';

export const VERSION_STATUSES = ['draft', 'frozen', 'retired'] as const;
export type VersionStatus = (typeof VERSION_STATUSES)[number];

/** The DB trigger token, reused as the error name so a catch can match either source. */
export const GAP_VERSION_FROZEN = 'GAP_VERSION_FROZEN';

export class SequenceVersionFrozenError extends Error {
  readonly versionId: string;
  readonly status: string;
  constructor(versionId: string, status: string) {
    super(`${GAP_VERSION_FROZEN}: sequence_versions.${versionId} is ${status}; only draft versions change`);
    this.name = GAP_VERSION_FROZEN;
    this.versionId = versionId;
    this.status = status;
  }
}

export interface VersionLike {
  id: string;
  status: string;
}

/** Throws `SequenceVersionFrozenError` (name GAP_VERSION_FROZEN) unless the version is a draft. */
export function assertVersionEditable(version: VersionLike): void {
  if (version.status !== 'draft') throw new SequenceVersionFrozenError(version.id, version.status);
}

// ---------------------------------------------------------------------------
// createVersion
// ---------------------------------------------------------------------------

export interface CreateVersionOptions {
  createdBy: string;
  changeNote?: string | null;
  provenance?: Record<string, unknown> | null;
  hubspotTemplateIds?: Record<string, string> | null;
  /** The version this one was edited from; recorded in provenance.from_version_id. */
  fromVersionId?: string | null;
}

export type CreateVersionRefusal =
  | 'family_not_found'
  | 'family_archived'
  | 'from_version_not_found'
  | `identical_to_version:${number}`
  | string; // parseSteps reasons: invalid_steps:<path>, first_touch_proof, first_touch_delay

export type CreateVersionResult =
  | { ok: true; id: string; version: number; stepsHash: string }
  | { ok: false; reason: CreateVersionRefusal };

/**
 * Insert version max+1 as a draft with a fresh hash. A no-op edit (same hash
 * as any existing version in the family, whatever its status) is refused with
 * `identical_to_version:<n>` naming the lowest matching version number.
 */
export async function createVersion(
  prisma: any,
  familyId: string,
  steps: unknown,
  opts: CreateVersionOptions,
): Promise<CreateVersionResult> {
  const parsed = parseSteps(steps);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };

  const family = await prisma.sequenceFamily.findUnique({
    where: { id: familyId },
    select: { id: true, archived_at: true },
  });
  if (!family) return { ok: false, reason: 'family_not_found' };
  if (family.archived_at) return { ok: false, reason: 'family_archived' };

  const existing: Array<{ id: string; version: number; steps_hash: string }> = await prisma.sequenceVersion.findMany({
    where: { family_id: familyId },
    select: { id: true, version: true, steps_hash: true },
    orderBy: { version: 'asc' },
  });

  if (opts.fromVersionId && !existing.some((v) => v.id === opts.fromVersionId)) {
    return { ok: false, reason: 'from_version_not_found' };
  }

  const hash = stepsHash(parsed.steps);
  const twin = existing.find((v) => v.steps_hash === hash);
  if (twin) return { ok: false, reason: `identical_to_version:${twin.version}` };

  const max = existing.reduce((m, v) => (v.version > m ? v.version : m), 0);
  const version = max + 1;

  const provenance =
    opts.provenance || opts.fromVersionId
      ? { ...(opts.provenance ?? {}), ...(opts.fromVersionId ? { from_version_id: opts.fromVersionId } : {}) }
      : null;

  const created = await prisma.sequenceVersion.create({
    data: {
      family_id: familyId,
      version,
      steps: parsed.steps,
      steps_hash: hash,
      status: 'draft',
      hubspot_template_ids: opts.hubspotTemplateIds ?? null,
      provenance,
      change_note: opts.changeNote ?? null,
      created_by: opts.createdBy,
    },
    select: { id: true },
  });
  return { ok: true, id: created.id, version, stepsHash: hash };
}

// ---------------------------------------------------------------------------
// updateVersionSteps (drafts only)
// ---------------------------------------------------------------------------

export type UpdateVersionRefusal = 'version_not_found' | 'version_frozen' | string;

export type UpdateVersionResult =
  | { ok: true; id: string; stepsHash: string; changed: boolean }
  | { ok: false; reason: UpdateVersionRefusal };

/**
 * Replace a DRAFT version's steps in place. Anything off draft is refused
 * `version_frozen` before any write (the trigger would refuse it too, but the
 * service never lets it get that far). An unchanged hash is an accepted no-op
 * (`changed: false`, no write). The actor is recorded in provenance.edited_by.
 */
export async function updateVersionSteps(
  prisma: any,
  versionId: string,
  steps: unknown,
  actor: string,
  now: Date = new Date(),
): Promise<UpdateVersionResult> {
  const row = await prisma.sequenceVersion.findUnique({
    where: { id: versionId },
    select: { id: true, status: true, steps_hash: true, provenance: true },
  });
  if (!row) return { ok: false, reason: 'version_not_found' };
  if (row.status !== 'draft') return { ok: false, reason: 'version_frozen' };

  const parsed = parseSteps(steps);
  if (!parsed.ok) return { ok: false, reason: parsed.reason };
  const hash = stepsHash(parsed.steps);
  if (hash === row.steps_hash) return { ok: true, id: versionId, stepsHash: hash, changed: false };

  const provenance = { ...(asRecord(row.provenance) ?? {}), edited_by: actor, edited_at: now.toISOString() };
  await prisma.sequenceVersion.update({
    where: { id: versionId },
    data: { steps: parsed.steps, steps_hash: hash, provenance },
    select: { id: true },
  });
  return { ok: true, id: versionId, stepsHash: hash, changed: true };
}

// ---------------------------------------------------------------------------
// retireVersion (frozen -> retired only)
// ---------------------------------------------------------------------------

export type RetireVersionRefusal = 'version_not_found' | 'not_frozen' | 'stale_status';

/** No retired_by column exists; the actor is echoed so the caller can audit it. */
export type RetireVersionResult =
  | { ok: true; id: string; retiredAt: Date; actor: string }
  | { ok: false; reason: RetireVersionRefusal };

/**
 * frozen -> retired. A draft is deleted, not retired (`not_frozen`); an
 * already retired version is `not_frozen` too. Retiring blocks NEW
 * enrollments only: in-flight runs keep reading their pinned version, and
 * stopping them is `stopEnrollmentsForVersion(prisma, id, 'sequence_retired', actor)`
 * in ./enrollment.ts, called on purpose by the operator.
 */
export async function retireVersion(
  prisma: any,
  versionId: string,
  actor: string,
  now: Date = new Date(),
): Promise<RetireVersionResult> {
  const row = await prisma.sequenceVersion.findUnique({ where: { id: versionId }, select: { id: true, status: true } });
  if (!row) return { ok: false, reason: 'version_not_found' };
  if (row.status !== 'frozen') return { ok: false, reason: 'not_frozen' };

  const r = await prisma.sequenceVersion.updateMany({
    where: { id: versionId, status: 'frozen' },
    data: { status: 'retired', retired_at: now },
  });
  if (r.count !== 1) return { ok: false, reason: 'stale_status' };
  return { ok: true, id: versionId, retiredAt: now, actor };
}

// ---------------------------------------------------------------------------
// freezeVersionForEnrollment (code mirror of the DB trigger)
// ---------------------------------------------------------------------------

export type FreezeOutcome = { frozen: true; versionId: string } | { frozen: false; versionId: string; status: 'frozen' };

/**
 * draft -> frozen with frozen_at and frozen_by_enrollment_id; already frozen
 * is a no-op; retired throws `version_retired` so the enclosing transaction
 * rolls the enrollment back. Missing throws `version_not_found`. Runs on the
 * transaction client the enrollment is being inserted through.
 */
export async function freezeVersionForEnrollment(
  tx: any,
  versionId: string,
  enrollmentId: string,
  now: Date,
): Promise<FreezeOutcome> {
  const row = await tx.sequenceVersion.findUnique({ where: { id: versionId }, select: { id: true, status: true } });
  if (!row) throw new Error('version_not_found');
  if (row.status === 'retired') throw new Error('version_retired');
  if (row.status === 'frozen') return { frozen: false, versionId, status: 'frozen' };

  const r = await tx.sequenceVersion.updateMany({
    where: { id: versionId, status: 'draft' },
    data: { status: 'frozen', frozen_at: now, frozen_by_enrollment_id: enrollmentId },
  });
  // The trigger may have frozen it between the read and the write; that is
  // the same end state, so it is a no-op rather than a failure.
  if (r.count !== 1) return { frozen: false, versionId, status: 'frozen' };
  return { frozen: true, versionId };
}

// ---------------------------------------------------------------------------
// pickVersionAt (journal import)
// ---------------------------------------------------------------------------

export interface VersionAtCandidate {
  id: string;
  version: number;
  provenance?: unknown;
  created_at: Date | string;
}

/** The version's effective timestamp: provenance.journal_ts when present and parseable, else created_at. */
export function versionEffectiveAt(v: VersionAtCandidate): Date | null {
  const prov = asRecord(v.provenance);
  const raw = prov?.journal_ts;
  if (typeof raw === 'string' || raw instanceof Date) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const c = new Date(v.created_at);
  return Number.isNaN(c.getTime()) ? null : c;
}

/**
 * The version whose effective timestamp is the newest at or before `at`
 * (equal timestamps count). Ties on timestamp go to the higher version
 * number. Null when nothing is that old.
 */
export function pickVersionAt<T extends VersionAtCandidate>(versions: readonly T[], at: Date): T | null {
  let best: T | null = null;
  let bestAt = Number.NEGATIVE_INFINITY;
  for (const v of versions) {
    const eff = versionEffectiveAt(v);
    if (!eff) continue;
    const t = eff.getTime();
    if (t > at.getTime()) continue;
    if (t > bestAt || (t === bestAt && best !== null && v.version > best.version)) {
      best = v;
      bestAt = t;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export type { StepsV2 };
