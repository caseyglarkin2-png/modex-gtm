/**
 * IS FIRST-TOUCH COPY INSTALLED FOR THIS THESIS? (batch item 6, R34, 2026-10-07). Server only.
 *
 * The production dead end: before the approach families were seeded, a job-led thesis approved, routed READY, and
 * Send answered "no version" (and stayed offered). `copyFamilySupports` was a code constant, never a check of the
 * seeded rows. This module asks the rows: the SAME resolver the action pack renders from (execution/action-pack.ts
 * `resolvePackVersion`, no engine filter), so "installed" here means the pack can render. Read by the approval path
 * (hypothesis/service.ts: approve and activate refuse `copy_not_installed`), the pursuit read (a thesis without copy
 * is not usable; the state line names the family) and Work (an email card without copy is a missing prerequisite,
 * never READY). The family is named: the seeded event-led family for the thesis's problem, or its approach family.
 */
import { resolvePackVersion } from './action-pack';
import { approachOfHypothesis, copyFamilySupports, COPY_UNSUPPORTED_DETAIL } from '../research/approach-policy';
import { approachFamilyFor, SEED_FAMILIES } from '../sequences/families';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface CopyThesis {
  id?: string;
  problem_family: string;
  metadata?: unknown;
  sequence_version_id?: string | null;
  sequence_family_id?: string | null;
}

export interface CopyAvailability {
  installed: boolean;
  /** The copy family the thesis needs, in seller words ("Hidden Capacity", "Job and Procurement-led"). */
  familyName: string;
  /** Why it cannot render, in seller words; null when installed. */
  detail: string | null;
}

export const COPY_THESIS_SELECT = { id: true, problem_family: true, metadata: true, sequence_version_id: true, sequence_family_id: true } as const;

/** The family a thesis's first touch renders from, named. */
export function copyFamilyName(h: CopyThesis): string {
  const approach = approachOfHypothesis(h);
  if (approach !== 'event_led') return approachFamilyFor(approach)?.name ?? `${approach.replace(/_/g, ' ')} copy`;
  return SEED_FAMILIES.find((f) => f.problemFamily === h.problem_family)?.name ?? `${h.problem_family.replace(/_/g, ' ')} (no copy family written)`;
}

export async function copyAvailabilityFor(prisma: PrismaLike, h: CopyThesis): Promise<CopyAvailability> {
  const approach = approachOfHypothesis(h);
  const familyName = copyFamilyName(h);
  if (!copyFamilySupports(approach)) return { installed: false, familyName, detail: COPY_UNSUPPORTED_DETAIL(approach) };
  const v = await resolvePackVersion(prisma, { sequence_version_id: h.sequence_version_id ?? null, sequence_family_id: h.sequence_family_id ?? null, problem_family: h.problem_family, metadata: h.metadata }, 'build_required');
  if (v) return { installed: true, familyName, detail: null };
  return { installed: false, familyName, detail: `No first-touch copy is installed for ${familyName}: seed that copy family before this thesis can open an email. Nothing goes out.` };
}

/** Copy availability for many theses, one resolver call per distinct shape. Unread ids are absent (never "installed"). */
export async function copyAvailabilityMap(prisma: PrismaLike, hypothesisIds: readonly string[]): Promise<Map<string, CopyAvailability>> {
  const out = new Map<string, CopyAvailability>();
  const ids = [...new Set(hypothesisIds)];
  if (!ids.length) return out;
  const rows: CopyThesis[] = await prisma.prospectingHypothesis.findMany({ where: { id: { in: ids } }, select: COPY_THESIS_SELECT });
  const cache = new Map<string, CopyAvailability>();
  for (const h of rows) {
    const key = JSON.stringify([approachOfHypothesis(h), h.problem_family, h.sequence_version_id ?? null, h.sequence_family_id ?? null]);
    let c = cache.get(key);
    if (!c) {
      c = await copyAvailabilityFor(prisma, h);
      cache.set(key, c);
    }
    out.set(h.id!, c);
  }
  return out;
}
