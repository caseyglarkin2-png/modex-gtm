/**
 * Why HubSpot could not say whether an account is in a deal, in the seller's words (R60: NEXT read "HubSpot could not
 * be read just now (identity_unresolved)"). Client safe, no imports. A reason this module does not know, or a sentence
 * already in words, is never shown as a code.
 */

const WORDS: Record<string, string> = {
  hubspot_unconfigured: 'HubSpot is not connected here',
  hubspot_error: 'HubSpot answered with an error',
  timeout: 'HubSpot did not answer in time',
  identity_unresolved: 'GAP cannot tell which HubSpot company this account is',
  identity_ambiguous: 'more than one HubSpot company could be this account',
  malformed_response: 'HubSpot sent an answer GAP cannot read',
};

/** The reason in words: a known code, a sentence kept as it is, or the plain fallback (never a raw code). */
export function unknownReasonWords(reason: string | null | undefined): string {
  const r = (reason ?? '').trim();
  if (WORDS[r]) return WORDS[r];
  if (!r || /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(r) || /^[a-z]+$/.test(r)) return 'HubSpot could not be read just now';
  return r;
}

/**
 * R63-A S13: an account with no HubSpot company linked is not an outage ("HubSpot could not be checked" read like one on
 * Unlinked's page): the hold says what is missing and the one step that lifts it. null for every other reason (HubSpot
 * not answering keeps its own words).
 */
export function identityHold(reason: string | null | undefined): { state: string; why: string } | null {
  const r = (reason ?? '').trim();
  if (r === 'identity_unresolved') return { state: 'no HubSpot company linked', why: 'No HubSpot company is linked to this account. Link it in HubSpot; until then no cold touch.' };
  if (r === 'identity_ambiguous') return { state: 'more than one HubSpot company', why: 'More than one HubSpot company could be this account. Link the right one in HubSpot; until then no cold touch.' };
  return null;
}

/** What makes the account workable again: the company linked for an identity problem, else HubSpot answering. */
export function unknownUnlock(reason: string | null | undefined): string {
  return reason === 'identity_unresolved' || reason === 'identity_ambiguous' ? 'Link the account to its one HubSpot company.' : 'HubSpot answers again.';
}
