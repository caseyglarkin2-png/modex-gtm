/**
 * Seller-friendly refusals (Monday readiness, 2026-09-27). Pure.
 *
 * A safety refusal must tell Casey the next useful action, not a machine
 * code. Each entry answers WHAT HAPPENED, WHY, and WHAT TO DO NEXT; the raw
 * code stays available under details. Unknown codes return null so callers
 * keep their own wording (never hidden). Voice: no em dashes.
 */
export interface RefusalCopy {
  what: string;
  why: string;
  next: string;
}

const COPY: Record<string, RefusalCopy> = {
  evidence_insufficient: {
    what: 'Not in use yet.',
    why: 'The observation is not backed by a verified, quoted fact about a physical-network change at this account. A keyword hit or a general filing sentence is not enough to contact anyone.',
    next: 'Find verified evidence, choose the fact that supports the thesis, then approve the revised observation.',
  },
  evidence_expired: {
    what: 'Not in use.',
    why: 'The fact behind this thesis is too old to open a conversation with.',
    next: 'Find fresh verified evidence, then approve the revised observation.',
  },
  opener_too_long: {
    what: 'Not in use.',
    why: 'The observation quotes more than one first-touch email can carry, so it would fail at Send.',
    next: 'Find verified evidence and choose ONE fact to open with.',
  },
  no_evidence: {
    what: 'Not in use.',
    why: 'Nothing verifiable is linked to this thesis.',
    next: 'Find verified evidence before deciding.',
  },
  decision_stale: {
    what: 'Nothing was drafted.',
    why: 'This card was recommended before something changed for this person.',
    next: 'Wait for the next routing run (or run routing on /gap), then open the new card.',
  },
  recipient_unsubscribed: {
    what: 'Nothing was drafted or sent.',
    why: 'This person unsubscribed.',
    next: 'Nothing to do. GAP will not contact them again.',
  },
  draft_outstanding: {
    what: 'Nothing new was drafted.',
    why: 'A Gmail draft of this touch already exists.',
    next: 'Send or delete it in Gmail, then press Reconcile.',
  },
  account_motion_active: {
    what: 'Nothing was drafted or sent.',
    why: 'Someone else at this account is already in a cold email motion. One motion at a time keeps the account from being carpet-bombed.',
    next: 'Wait for the unlock date, or work this person by phone or LinkedIn if you judge it right.',
  },
  active_opportunity: {
    what: 'Nothing was drafted or sent.',
    why: 'This account already has an active opportunity (an open HubSpot deal, a meeting or a positive reply).',
    next: 'Work it from the existing deal or conversation, not a cold first touch.',
  },
  opportunity_unknown: {
    what: 'Nothing was drafted or sent.',
    why: "Can't verify whether this account already has an active opportunity.",
    next: 'Check HubSpot before contacting them.',
  },
};

export function refusalCopy(code: string | null | undefined): RefusalCopy | null {
  return code ? (COPY[code] ?? null) : null;
}

/** One line: what happened, why, next. Null for an unknown code. */
export function refusalSentence(code: string | null | undefined): string | null {
  const c = refusalCopy(code);
  return c ? `${c.what} ${c.why} Next: ${c.next}` : null;
}
