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

/**
 * The undo of `never` (2026-10-10, Casey: "Add undo for 'never'"): the words of the reversal control and of the
 * standing mark it reverses. Client-safe for the panel; the decide page and decide.ts read the same words.
 */
export const RELIST_WORDS = 'List this sender again';
export const relistDomainWords = (domain: string) => `List anyone at ${domain} again`;
/** "Oct 10, 2026" for an instant, in the seller's day. */
export const sinceDay = (iso: string | Date): string => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
/** "Not a prospect since Oct 10, 2026": the standing mark, said where its undo is offered. */
export const notProspectSince = (iso: string | Date): string => `Not a prospect since ${sinceDay(iso)}`;
