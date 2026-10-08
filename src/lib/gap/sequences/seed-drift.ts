/**
 * Release C review B2 (red team T7): the honest single-touch seed copy in
 * families.ts only reaches a buyer once the LIVE seed versions are rewritten
 * (scripts/gap/rewrite-seed-versions.ts). Until then a seed-program version
 * still carries the old four-step fixture copy (other companies' sites cited
 * as this buyer's). This is the send-side guard: a version in the seed
 * program whose steps differ from the current seed for its family is
 * outdated copy, and nothing is drafted, sent or enrolled from it.
 *
 * R34: an approach-family version (APPROACH_PROGRAM: job / procurement-led,
 * fit-led) is judged the same way against its approach family's current
 * copy, so a stored approach version that drifted from the code never sends.
 *
 * Versions outside the seed and approach programs are never judged here;
 * their copy is the operator's and the compiler judges it.
 */
import { APPROACH_FAMILIES, SEED_FAMILIES, SEED_PROGRAM } from '@/lib/gap/sequences/families';
import { stepsHash } from '@/lib/gap/sequence/steps';

export interface SeedDriftVersion {
  steps: unknown;
  family?: { name: string | null; program?: string | null } | null;
}

/** True when the version belongs to the seed program (or an approach program) and its steps are not the current seed's. */
export function seedCopyOutdated(version: SeedDriftVersion): boolean {
  const program = version.family?.program ?? null;
  if (program === SEED_PROGRAM) {
    const seed = SEED_FAMILIES.find((f) => f.name === version.family?.name);
    // A seed-program family the code no longer seeds has no honest copy to match.
    if (!seed) return true;
    return stepsHash(version.steps) !== stepsHash(seed.steps);
  }
  const approach = APPROACH_FAMILIES.find((f) => f.program === program);
  if (!approach) return false;
  return version.family?.name !== approach.name || stepsHash(version.steps) !== stepsHash(approach.steps);
}
