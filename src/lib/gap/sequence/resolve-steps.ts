/**
 * S3-T5: the runtime step pin (spec section 5.3, "In-flight modex runs").
 *
 * `sequence-runtime.ts` decides the next step of a run from the sequence's
 * steps. Today it reads them LIVE from `sequences.steps`, so an edit to the
 * sequence changes what an in-flight run sends. Under GAP_OS_ENABLED the
 * steps come from the immutable SequenceVersion the run is pinned to, in
 * this order:
 *
 *   1. `enrollment_version`: the SequenceEnrollment whose id is the run id
 *      (`sequence_run_id`), through its pinned version;
 *   2. `item_stamp`: the item's own `sequence_version_id` (an item created by
 *      the runtime before the enrollment row existed, or a legacy-imported
 *      item whose run spans two sequences and so has no enrollment);
 *   3. `legacy_live`: today's `prisma.sequence.findUnique`, unchanged.
 *
 * With the flag OFF the first two sources are never consulted: the only
 * Prisma call is the legacy live read, exactly as the runtime makes it today
 * (a structural test hands in a prisma whose enrollment and version
 * delegates throw).
 *
 * A RETIRED version still resolves. Retiring blocks new enrollments only
 * (spec 4.5, `retireVersion` in ./version.ts); a run already pinned to it
 * keeps reading the shape it enrolled under. Stopping those runs is the
 * separate operator call `stopEnrollmentsForVersion`.
 *
 * The enrollment's status is returned alongside the steps so the runtime can
 * schedule nothing for a paused, stopped or completed run (spec 5.3) without
 * a second read. This module never decides that; it only reports.
 *
 * `toLegacySteps` converts steps.v2 back to the shape `nextStepSchedule`
 * consumes ({stepIndex, delayDays, subjectTemplate?, bodyTemplate?}), plus a
 * `delayUnit` the legacy shape never had, so the runtime can route
 * business-day delays through `business-days.ts` before scheduling. A
 * calendar-day version round-trips `fromLegacyModexSteps` exactly on the
 * fields the runtime reads.
 *
 * Voice: no em dashes.
 */
import type { SequenceStep as LegacyStep } from '@/lib/queue/sequence';
import { parseSteps, type DelayUnit, type StepsV2 } from '@/lib/gap/sequence/steps';

export type StepSource = 'enrollment_version' | 'item_stamp' | 'legacy_live';

/** The legacy runtime shape plus the delay unit steps.v2 carries. */
export interface ResolvedStep extends LegacyStep {
  delayUnit: DelayUnit;
}

export interface ResolveStepsItem {
  sequence_id: number | null | undefined;
  sequence_run_id: string | null | undefined;
  sequence_version_id: string | null | undefined;
  step_index: number | null | undefined;
}

export interface ResolveStepsOptions {
  gapEnabled: boolean;
}

export interface ResolvedSteps {
  source: StepSource;
  /** Empty when nothing resolved; `reason` says why. */
  steps: ResolvedStep[];
  versionId?: string;
  /** Status of the pinned version (draft | frozen | retired) when a version resolved. */
  versionStatus?: string;
  /** Status of the enrollment when source is `enrollment_version`. */
  enrollmentStatus?: string;
  /** `sequence_not_found`, `version_not_found`, `invalid_version_steps:<why>`, or absent. */
  reason?: string;
}

/**
 * Not found reasons are spelled so the runtime can return null early on any
 * `reason` and behave exactly as `if (!seq) return null` does today.
 */
export const SEQUENCE_NOT_FOUND = 'sequence_not_found';
export const VERSION_NOT_FOUND = 'version_not_found';

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

/** steps.v2 -> the legacy runtime shape. Null templates are omitted, as the legacy rows omit them. */
export function toLegacySteps(v2: StepsV2): ResolvedStep[] {
  return v2.steps.map((s) => {
    const out: ResolvedStep = {
      stepIndex: s.index,
      delayDays: s.delay.value,
      delayUnit: s.delay.unit,
    };
    const subject = s.templates?.subjectTemplate;
    const body = s.templates?.bodyTemplate;
    if (typeof subject === 'string') out.subjectTemplate = subject;
    if (typeof body === 'string') out.bodyTemplate = body;
    return out;
  });
}

/** The raw `sequences.steps` Json as the runtime already casts it, tagged calendar_days. */
export function fromLiveSteps(raw: unknown): ResolvedStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => ({ ...(s as LegacyStep), delayUnit: 'calendar_days' as const }));
}

function fromVersionSteps(versionId: string, rawSteps: unknown, source: StepSource, versionStatus?: string, enrollmentStatus?: string): ResolvedSteps {
  const parsed = parseSteps(rawSteps);
  if (!parsed.ok) {
    return {
      source,
      steps: [],
      versionId,
      versionStatus,
      ...(enrollmentStatus !== undefined ? { enrollmentStatus } : {}),
      reason: `invalid_version_steps:${parsed.reason}`,
    };
  }
  return {
    source,
    steps: toLegacySteps(parsed.steps),
    versionId,
    versionStatus,
    ...(enrollmentStatus !== undefined ? { enrollmentStatus } : {}),
  };
}

// ---------------------------------------------------------------------------
// Glue
// ---------------------------------------------------------------------------

/**
 * Resolve the steps an item's run should follow. Under the flag: enrollment
 * (id = run id) -> item stamp -> live read. Flag off: live read only, and
 * `prisma.sequenceEnrollment` / `prisma.sequenceVersion` are never touched.
 */
export async function resolveSteps(prisma: any, item: ResolveStepsItem, opts: ResolveStepsOptions): Promise<ResolvedSteps> {
  if (opts.gapEnabled) {
    if (item.sequence_run_id) {
      const enrollment = await prisma.sequenceEnrollment.findUnique({
        where: { id: item.sequence_run_id },
        select: {
          id: true,
          status: true,
          sequence_version_id: true,
          version: { select: { id: true, status: true, steps: true } },
        },
      });
      if (enrollment?.version) {
        return fromVersionSteps(enrollment.version.id, enrollment.version.steps, 'enrollment_version', enrollment.version.status, enrollment.status);
      }
    }
    if (item.sequence_version_id) {
      const version = await prisma.sequenceVersion.findUnique({
        where: { id: item.sequence_version_id },
        select: { id: true, status: true, steps: true },
      });
      if (version) return fromVersionSteps(version.id, version.steps, 'item_stamp', version.status);
      return { source: 'item_stamp', steps: [], versionId: item.sequence_version_id, reason: VERSION_NOT_FOUND };
    }
  }
  if (item.sequence_id == null) return { source: 'legacy_live', steps: [], reason: SEQUENCE_NOT_FOUND };
  const seq = await prisma.sequence.findUnique({ where: { id: item.sequence_id } });
  if (!seq) return { source: 'legacy_live', steps: [], reason: SEQUENCE_NOT_FOUND };
  return { source: 'legacy_live', steps: fromLiveSteps(seq.steps) };
}
