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
    why: 'The fact behind this thesis ended, closed, is undated or was superseded: it cannot open a conversation. (Age alone never blocks a fact: a historical one is cited with its date.)',
    next: 'Find another verified fact, then approve the revised observation.',
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
  fact_contradicted: {
    what: 'Nothing was drafted or sent.',
    why: 'Another verified fact about the same site says the opposite, so this fact cannot be quoted to a buyer.',
    next: 'Open Research, ignore the side you do not believe, then try again.',
  },
  named_in_referral: {
    what: 'Nothing was drafted or sent.',
    why: 'A buyer named this person in a referral. A referral is not consent and not a relationship, so they get no cold email until you choose how to approach them.',
    next: 'Decide the approach (an introduction, a mention of who named them, or not at all), then mark the referral done or skipped on Work.',
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
  suppression_unreadable: {
    what: 'Nothing was drafted.',
    why: 'The suppression check did not answer in time, so GAP could not confirm this person may be contacted. It never guesses.',
    next: 'Retry. Nothing was created in Gmail, so a retry cannot double up.',
  },
  recipient_suppressed: {
    what: 'Nothing was drafted or sent.',
    why: 'A suppression authority (an unsubscribe, a do-not-contact decision or an opt-out) says not to contact this person.',
    next: 'Nothing to do. GAP will not contact them.',
  },
  thesis_needs_review: {
    what: 'Nothing was drafted, sent or released.',
    why: 'This thesis needs review before anyone is contacted on it: a better current fact exists, it was revised, its fact is no longer live, or the buyer contradicted it.',
    next: 'Open the account, revise the thesis on the current best fact (or reject it), and approve the revision.',
  },
  thesis_currentness_unknown: {
    what: 'Nothing was drafted, sent or released.',
    why: 'GAP could not check whether this thesis is still current.',
    next: 'Retry in a moment.',
  },
  // Owner resolution (2026-10-05): the raw machine words a seller must never be left with.
  no_persona: {
    what: 'Approved. GAP needs a person to test this with before it can route.',
    why: 'This is an account-level hypothesis: the fact is about the company, and nobody has been chosen to test it with yet.',
    next: 'Choose the owner below (Needs an owner), or find the operator.',
  },
  persona_left_account: {
    what: 'Nothing was routed, drafted or sent.',
    why: 'Current-employer evidence says this person is no longer at this account (a historical contact).',
    next: 'Choose the current operator instead (owner resolution), or correct the record if you know otherwise.',
  },
  persona_employment_conflict: {
    what: 'Nothing was routed, drafted or sent.',
    why: 'Sources disagree about where this person works now, so GAP will not rely on them at this account.',
    next: 'Verify the current role (one click), or choose another owner.',
  },
  // WHO truth maintenance (2026-10-05): the ROLE changed while the employer did not; sources disagree about the role.
  persona_role_changed: {
    what: 'Nothing was routed, drafted or sent.',
    why: 'This person is still at the company, but the stored role GAP relied on has changed and the current remit is not established.',
    next: 'Verify the current role (one click), record the correct title if you know it, or choose another owner.',
  },
  persona_role_conflict: {
    what: 'Nothing was routed, drafted or sent.',
    why: 'Sources disagree about the current role of this person, so GAP will not rank them on the stored title.',
    next: 'Verify the current role (one click), or choose another owner.',
  },
  persona_not_at_account: {
    what: 'Nothing was attached.',
    why: 'That person is a GAP contact at another account, not this one.',
    next: 'Choose someone at this account, or add the right person from HubSpot.',
  },
  hypothesis_in_use: {
    what: 'Nothing was changed.',
    why: 'The hypothesis is already in use with its person; an active motion is not retargeted casually.',
    next: 'Work it from the ready card, or close and revise the thesis.',
  },
  // ADD TO GAP (the account-scoped HubSpot import): every refusal in seller words.
  account_not_linked: {
    what: 'Nothing was added.',
    why: 'This account resolves to no HubSpot company, so GAP cannot assert the contact belongs here.',
    next: 'Link the account to its HubSpot company first, then add the person.',
  },
  contact_not_associated: {
    what: 'Nothing was added.',
    why: 'In HubSpot this contact is not associated with the company this account is linked to, so adding them here would be a guess.',
    next: 'Open the contact in HubSpot and confirm the company before adding them.',
  },
  contact_not_found: {
    what: 'Nothing was added.',
    why: 'HubSpot has no contact with that id any more.',
    next: 'Refresh the page; if the person is still named, find them in HubSpot by email.',
  },
  blocked_domain: {
    what: 'Nothing was added.',
    why: 'That email domain is one GAP never contacts.',
    next: 'Choose another owner.',
  },
  contact_opted_out: {
    what: 'Nothing was added.',
    why: 'This person opted out of email in HubSpot, so GAP will not add them as a contact to act on.',
    next: 'Choose another owner, or reach them by phone outside GAP.',
  },
  persona_at_other_account: {
    what: 'Nothing was moved or duplicated.',
    why: 'This person is already a GAP contact at another account with history there, or at an unrelated company.',
    next: 'Work them from that account, or ask for a deliberate move.',
  },
  hubspot_unreadable: {
    what: 'Nothing was added.',
    why: 'HubSpot could not be read just now.',
    next: 'Retry in a moment.',
  },
  opportunity_unknown: {
    what: 'Nothing was drafted or sent.',
    why: "Can't verify whether this account already has an active opportunity.",
    next: 'Check HubSpot before contacting them.',
  },
  // The owner action (USE / ADD + USE / attach): every step's refusal in seller words (review S7). A code with a
  // suffix ("candidate_not_eligible:left_company", "not_approved:draft") reads through its prefix; where the detail
  // is the reason itself (the exclusion's own sentence), it stands in for the why.
  candidate_not_eligible: {
    what: 'Nothing was attached or routed.',
    why: 'This person is not eligible as the owner any more (the record changed since the list was read).',
    next: 'Reload the owners, choose another person, or correct the record if you know otherwise.',
  },
  no_candidate: {
    what: 'Nothing happened.',
    why: 'No person was chosen.',
    next: 'Choose a person (a GAP contact or a HubSpot contact) and press the button again.',
  },
  not_found: {
    what: 'Nothing happened.',
    why: 'This hypothesis no longer exists.',
    next: 'Reload the page.',
  },
  hypothesis_closed: {
    what: 'Nothing was attached or routed.',
    why: 'This hypothesis is closed (rejected, expired or resolved), so nothing routes from it.',
    next: 'Revise it on a current fact, or open a new one.',
  },
  not_approved: {
    what: 'The person is attached; nothing was activated.',
    why: 'The hypothesis is not approved yet, and only an approved hypothesis goes into routing.',
    next: 'Approve it, then use it in routing.',
  },
  already_active: {
    what: 'Nothing changed.',
    why: 'The hypothesis is already in use.',
    next: 'Work it from the ready card.',
  },
  stale_status: {
    what: 'Nothing was attached.',
    why: 'The hypothesis changed while the list was open.',
    next: 'Reload and choose again.',
  },
  same_person: {
    what: 'Nothing changed.',
    why: 'That person is already the owner of this hypothesis.',
    next: 'Use it in routing, or choose someone else.',
  },
  persona_do_not_contact: {
    what: 'Nothing was attached, drafted or sent.',
    why: 'This person is marked do not contact in GAP.',
    next: 'Choose another owner; if the flag is a legacy one, review it deliberately (the suppression correction path), never here.',
  },
  routing_failed: {
    what: 'The person is attached and the hypothesis is in use, but the targeted routing did not run.',
    why: 'Routing answered with an error; nothing was sent.',
    next: 'Run routing from the cockpit, or retry in a moment.',
  },
  no_people: {
    what: 'Nothing was routed.',
    why: 'There was nobody to route.',
    next: 'Choose an owner first.',
  },
  // The outstanding-draft discard: only the draft the ledger proves, reconciled, never inferred.
  decision_not_found: {
    what: 'Nothing was discarded.',
    why: 'GAP has no decision by that id any more.',
    next: 'Reload the page.',
  },
  draft_not_found: {
    what: 'Nothing was discarded.',
    why: 'The ledger holds no GAP-created draft for this decision.',
    next: 'If a draft exists in Gmail, it was not created by GAP: handle it in Gmail.',
  },
  draft_mismatch: {
    what: 'Nothing was discarded.',
    why: 'The draft on the ledger is not the one on screen.',
    next: 'Reload the page; if it persists, note it in /gap/feedback.',
  },
  recipient_mismatch: {
    what: 'Nothing was discarded.',
    why: 'The recipient on screen is not the one the ledger recorded for this draft.',
    next: 'Reload the page; if it persists, note it in /gap/feedback.',
  },
  sender_mailbox_mismatch: {
    what: 'Nothing was discarded.',
    why: 'The GAP mailbox configured here is not the mailbox that holds this draft.',
    next: 'Open it in Gmail and discard it there.',
  },
  gap_sender_unconfigured: {
    what: 'Nothing was discarded.',
    why: 'The GAP mailbox is not configured in this environment.',
    next: 'Open it in Gmail and discard it there.',
  },
  gmail_unreadable: {
    what: 'Nothing was discarded.',
    why: 'Gmail could not be read just now.',
    next: 'Retry in a moment.',
  },
  reconcile_failed: {
    what: 'The draft is gone from Gmail, but the ledger could not be reconciled.',
    why: 'The reconcile step answered with an error.',
    next: 'Retry in a moment; the account motion stays held until the ledger agrees.',
  },
  invalid_reason: {
    what: 'Nothing was discarded.',
    why: 'The reason is not one of the four GAP records.',
    next: 'Pick a reason from the list.',
  },
  // Employment corrections and verification.
  invalid_url: {
    what: 'Nothing was recorded.',
    why: 'The source must be a web address (a profile or an announcement).',
    next: 'Paste the URL and save again.',
  },
  missing_company: {
    what: 'Nothing was recorded.',
    why: 'THIS PERSON LEFT needs the new company.',
    next: 'Name where they went (or leave the title blank if unknown) and save again.',
  },
  human_correction_stands: {
    what: 'Nothing was recorded.',
    why: 'Your own correction already stands; an automated verification never overrides it.',
    next: 'Use CURRENT ROLE IS WRONG to change it.',
  },
  persona_not_found: {
    what: 'Nothing was recorded.',
    why: 'GAP has no contact by that id any more.',
    next: 'Reload the page.',
  },
  account_not_found: {
    what: 'Nothing was added.',
    why: 'GAP has no account by that name.',
    next: 'Open the account page again.',
  },
};

/** Codes whose detail IS the reason (the exclusion's own sentence): the detail stands in for the why. */
const DETAIL_IS_WHY = new Set(['candidate_not_eligible']);

export function refusalCopy(code: string | null | undefined): RefusalCopy | null {
  if (!code) return null;
  const exact = COPY[code];
  if (exact) return exact;
  // A suffixed code ("candidate_not_eligible:left_company", "not_approved:draft") reads through its prefix.
  const prefix = code.split(':')[0];
  return COPY[prefix] ?? null;
}

/** One line: what happened, why, next. Null for an unknown code. The detail replaces the why where it is the reason. */
export function refusalSentence(code: string | null | undefined, detail?: string | null): string | null {
  const c = refusalCopy(code);
  if (!c) return null;
  const prefix = String(code ?? '').split(':')[0];
  const why = DETAIL_IS_WHY.has(prefix) && detail?.trim() ? detail.trim() : c.why;
  return `${c.what} ${why} Next: ${c.next}`;
}
