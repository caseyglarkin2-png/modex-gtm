/**
 * The truth label words the intelligence panel renders. Client-safe on purpose: `work/intel.ts` is a server
 * module (it reaches Gmail, DNS and node:crypto through its readers), so the one value a client component
 * needs from it lives here and intel.ts re-exports it.
 */
export type TruthLabel = 'historical_observation' | 'verified_fact' | 'unverified_status' | 'contradicted';
export const TRUTH_TEXT: Record<TruthLabel, string> = {
  historical_observation: 'Historical observation',
  verified_fact: 'Verified fact',
  unverified_status: 'Unverified present-day status',
  contradicted: 'Contradicted or superseded',
};
