/**
 * Seller copy for a hand-added public fact's verification result (Phase 2 A1).
 * Pure and client-safe (no server imports): the Add Fact form renders it.
 */

export const PUBLIC_FACT_LABEL = 'GAP re-reads the page and checks your sentence word for word. Only a verified sentence can be quoted to a buyer.';

export const MANUAL_FACT_VERIFIED_COPY = 'Verified at the source: this sentence can be quoted to a buyer.';

/** Why a hand-added public fact could not be verified, in plain words. */
export function manualFactRefusalCopy(reason: string): string {
  if (reason === 'no_excerpt') return 'No sentence was given, so there is nothing to verify. Kept as context; not quotable to a buyer.';
  if (reason === 'no_publication_date') return 'No publication date was given. Kept as context; not quotable until it is dated and verified.';
  if (reason === 'not_a_physical_operations_fact') return 'The sentence does not state a physical network change (a DC, plant, yard or dock opening, expansion, closure or automation). Kept as context.';
  if (reason === 'excerpt_not_found_at_source') return 'GAP re-read the page and could not find that sentence word for word. Kept as context; not quotable to a buyer.';
  if (reason === 'page_does_not_name_account') return 'The page does not name this account. Kept as context; not quotable to a buyer.';
  if (reason.startsWith('source_unreadable')) return `GAP could not read the source (${reason.slice('source_unreadable:'.length) || 'unreadable'}). Kept as context; try again or use another source.`;
  return `Not verified (${reason}). Kept as context; not quotable to a buyer.`;
}
