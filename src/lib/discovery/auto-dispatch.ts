import type { CuratedRow } from './types';

export interface FreshDeps {
  /** lowercased account names already emailed or queued */
  contactedNames: Set<string>;
}

/**
 * Pick the top `n` fresh accounts for the daily auto-dispatch: drop excluded /
 * existing-account / already-contacted rows, sort by icpScore desc, cap at n.
 * Pure — the caller supplies the contacted set from the DB.
 */
export function selectFreshTopAccounts(
  rows: CuratedRow[],
  n: number,
  deps: FreshDeps,
): CuratedRow[] {
  return rows
    .filter((r) => !r.excluded && !r.isExistingAccount)
    .filter((r) => !deps.contactedNames.has(r.name.trim().toLowerCase()))
    .sort((a, b) => (b.icpScore ?? 0) - (a.icpScore ?? 0))
    .slice(0, Math.max(0, n));
}
