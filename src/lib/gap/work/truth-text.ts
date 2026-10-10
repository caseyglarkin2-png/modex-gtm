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

/**
 * The people fix (2026-10-10): the words for a sender's `never` (not a prospect), on the briefing's links and the
 * panel's button alike. Client-safe for the same reason as TRUTH_TEXT; intel.ts re-exports them.
 */
export const NEVER_WORDS = 'Not a prospect: never list this sender again';
export const neverDomainWords = (domain: string) => `Not a prospect: never list anyone at ${domain}`;
