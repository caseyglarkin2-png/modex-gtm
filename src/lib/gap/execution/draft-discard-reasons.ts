/**
 * The discard reasons and their seller labels, in a module with no imports: the client panel reads these, and the
 * server module (draft-discard.ts) reaches the Gmail sender and node:crypto, which a client bundle must never pull
 * in (the webpack node:crypto trap, memory reference_webpack_node_crypto_build_fail).
 */
export const DISCARD_REASONS = ['stale_pre_operator_who_draft', 'wrong_person', 'copy_outdated', 'seller_discard'] as const;
export type DiscardReason = (typeof DISCARD_REASONS)[number];

export const DISCARD_REASON_LABEL: Record<DiscardReason, string> = {
  stale_pre_operator_who_draft: 'Stale: drafted before operator-first WHO; a better owner is on record',
  wrong_person: 'Wrong person for this account',
  copy_outdated: 'The copy is outdated',
  seller_discard: 'Discarded by the seller',
};
