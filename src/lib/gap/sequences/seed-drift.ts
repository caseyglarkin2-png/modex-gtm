/**
 * Release C review B2 (red team T7): the honest single-touch seed copy in
 * families.ts only reaches a buyer once the LIVE seed versions are rewritten
 * (scripts/gap/rewrite-seed-versions.ts). Until then a seed-program version
 * still carries the old four-step fixture copy (other companies' sites cited
 * as this buyer's). This is the send-side guard: a version in the seed
 * program whose steps differ from the current seed for its family is
 * outdated copy, and nothing is drafted, sent or enrolled from it.
 *
 * Versions outside the seed program are never judged here; their copy is
 * the operator's and the compiler judges it.
 */
import { SEED_FAMILIES, SEED_PROGRAM } from '@/lib/gap/sequences/families';
import { stepsHash } from '@/lib/gap/sequence/steps';

export interface SeedDriftVersion {
  steps: unknown;
  family?: { name: string | null; program?: string | null } | null;
}

/** True when the version belongs to the seed program and its steps are not the current seed's. */
export function seedCopyOutdated(version: SeedDriftVersion): boolean {
  if (version.family?.program !== SEED_PROGRAM) return false;
  const seed = SEED_FAMILIES.find((f) => f.name === version.family?.name);
  // A seed-program family the code no longer seeds has no honest copy to match.
  if (!seed) return true;
  return stepsHash(version.steps) !== stepsHash(seed.steps);
}
