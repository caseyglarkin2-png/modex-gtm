/**
 * GAP suppression provenance taxonomy (final pass, 2026-09-25).
 *
 * ROUTING asks "should Casey consider contacting this person?". SENDING asks
 * "may this exact message be transmitted right now?". Before this module the
 * router answered the first question with the second question's boolean: any
 * positive leg on the cross-plane contract became a permanent, blocked
 * `do_not_contact` card. The production audit (docs/gap/suppression-audit-
 * 2026-09-25.md) showed why that is wrong: 386 personas carry
 * `do_not_contact = true`, none has an unsubscribe row, and 99 of them exist
 * only because of a March 2026 Resend-era bounce wave whose bounce type was
 * never recorded. One of them (General Mills, Ryan Underwood) answered a
 * later Gmail with an out-of-office auto-reply from the same mailbox.
 *
 * This module classifies WHY a person is suppressed, from evidence the router
 * already holds (the contract legs that fired, the local column, the local
 * email status, the unsubscribe table). It is a ROUTING input only. The send
 * gate (`assertSuppressionPermitsSend`, src/lib/email/suppression-gate.ts) is
 * untouched and still refuses on ANY positive leg, fail closed, so nothing
 * here can turn routing permission into send permission.
 *
 * The four classes (SendGrid's own semantics are the model: a block is not a
 * permanent suppression; bounce, invalid, spam report and unsubscribe are):
 *
 *   hard_compliance       the recipient or a human said stop: unsubscribe,
 *                         HubSpot opt-out, spam report / SendGrid permanent
 *                         list, verbal do-not-contact, or an unrecognized leg
 *                         (fail closed: a leg we cannot name is treated as the
 *                         strongest kind). Routing: SYSTEM BLOCK.
 *   hard_invalid_address  the ADDRESS is proven bad (hard bounce recorded as
 *                         such, a human marked it invalid). Routing: email is
 *                         unusable; phone and LinkedIn may still be used.
 *   soft_deliverability   a provider/sender event, not the recipient: the
 *                         local column set by the historical `bounced` status
 *                         (the only writer of that value was the March 2026
 *                         Resend-era wave, bounce type never captured).
 *                         Routing: NOT a permanent DNC; the card stays
 *                         actionable on phone/LinkedIn with a visible warning
 *                         that email stays blocked at send until corrected.
 *   unknown_provenance    a boolean exists and its reason cannot be proven
 *                         (the local column with no status evidence, clawd's
 *                         do_not_send whose reason the contract does not
 *                         return, a domain block). Routing: review required;
 *                         never silently a permanent DNC, never outreach.
 *
 * Plus two non-suppression states: `clear`, and `service_unreadable` (the
 * authority could not be read; an operational warning, never a DNC write).
 *
 * Precedence when several legs fire: hard_compliance > hard_invalid_address >
 * unknown_provenance > soft_deliverability. The most severe class wins, so a
 * soft local bounce can never mask an opt-out on another plane.
 */

export type SuppressionClass =
  | 'clear'
  | 'hard_compliance'
  | 'hard_invalid_address'
  | 'soft_deliverability'
  | 'unknown_provenance'
  | 'service_unreadable';

export type LegVerdict = 'clear' | 'hit' | 'unknown';

export interface SuppressionEvidence {
  verdict: 'clear' | 'suppressed' | 'unknown';
  legs: Record<string, LegVerdict>;
  persona: {
    doNotContact: boolean;
    emailStatus: string | null;
  };
}

export interface SuppressionClassification {
  class: SuppressionClass;
  /** Every leg that said "do not contact", including the local column. */
  hits: string[];
  /** One entry per hit: the leg and the class it was read as. */
  reasons: Array<{ leg: string; class: Exclude<SuppressionClass, 'clear' | 'service_unreadable'> }>;
  /** True whenever the send-time wire gate will refuse email to this person today. */
  emailBlockedAtSend: boolean;
}

/** The local column's leg name, the same spelling clawd's modex leg uses. */
export const MODEX_LEG = 'modex_do_not_contact';

/** Legs whose hit is the recipient's (or a human's) own decision. */
const HARD_COMPLIANCE_LEGS = new Set([
  'unsubscribed',
  'hubspot_optout',
  'hs_email_optout',
  'hubspot',
  'verbal_do_not_call',
  'verbal',
  'sendgrid_suppression',
  'sendgrid',
]);

/** Legs whose hit carries no reason on the wire. */
const UNKNOWN_REASON_LEGS = new Set(['clawd_do_not_send', 'clawd', 'clawd_contract', 'suppressed']);

/** Local email statuses that prove the ADDRESS failed. */
export const HARD_INVALID_STATUSES = new Set(['hard_bounce', 'hard_bounced', 'invalid']);

/** Local email statuses written by a provider event, not proven to be the address. */
export const SOFT_HISTORICAL_STATUSES = new Set(['bounced']);

const SEVERITY: Record<Exclude<SuppressionClass, 'clear' | 'service_unreadable'>, number> = {
  hard_compliance: 4,
  hard_invalid_address: 3,
  unknown_provenance: 2,
  soft_deliverability: 1,
};

function modexClass(emailStatus: string | null): 'hard_invalid_address' | 'soft_deliverability' | 'unknown_provenance' {
  const s = (emailStatus ?? '').trim().toLowerCase();
  if (HARD_INVALID_STATUSES.has(s)) return 'hard_invalid_address';
  if (SOFT_HISTORICAL_STATUSES.has(s)) return 'soft_deliverability';
  return 'unknown_provenance';
}

function legClass(leg: string, emailStatus: string | null): Exclude<SuppressionClass, 'clear' | 'service_unreadable'> {
  if (leg === MODEX_LEG || leg === 'modex') return modexClass(emailStatus);
  if (UNKNOWN_REASON_LEGS.has(leg)) return 'unknown_provenance';
  if (HARD_COMPLIANCE_LEGS.has(leg)) return 'hard_compliance';
  // Fail closed: an authority we cannot name is read as the strongest kind.
  return 'hard_compliance';
}

/** Pure. Same evidence, same answer. */
export function classifySuppression(e: SuppressionEvidence): SuppressionClassification {
  const hits = Object.entries(e.legs)
    .filter(([, v]) => v === 'hit')
    .map(([k]) => k);
  if (e.persona.doNotContact && !hits.includes(MODEX_LEG) && !hits.includes('modex')) hits.push(MODEX_LEG);

  const reasons = hits.map((leg) => ({ leg, class: legClass(leg, e.persona.emailStatus) }));
  const emailBlockedAtSend = hits.length > 0 || e.verdict !== 'clear';

  if (reasons.length === 0) {
    return { class: e.verdict === 'unknown' ? 'service_unreadable' : 'clear', hits, reasons, emailBlockedAtSend };
  }
  // A verdict of `suppressed` whose legs name nothing still refuses; read as unknown provenance.
  let worst = reasons[0].class;
  for (const r of reasons) if (SEVERITY[r.class] > SEVERITY[worst]) worst = r.class;
  return { class: worst, hits, reasons, emailBlockedAtSend };
}

/** Plain-English, seller-facing line for each class. Voice: no em dashes. */
export const SUPPRESSION_CLASS_COPY: Record<SuppressionClass, { title: string; body: string }> = {
  clear: { title: 'Clear', body: 'No suppression on any plane.' },
  hard_compliance: {
    title: 'Do not contact',
    body: 'The recipient or a person on our side said stop (unsubscribe, opt-out, spam report or verbal request). GAP will not recommend outreach.',
  },
  hard_invalid_address: {
    title: 'Email address is invalid',
    body: 'This address hard bounced or was marked invalid. Email is off; phone and LinkedIn are still allowed. Find a current address to email again.',
  },
  soft_deliverability: {
    title: 'Historical bounce, not a do-not-contact',
    body: 'This person was flagged by an old provider bounce (the March 2026 Resend-era wave), not by their own request or a proven bad address. Phone and LinkedIn are fine. Email stays blocked at send until the flag is reviewed and corrected.',
  },
  unknown_provenance: {
    title: 'Suppression needs review',
    body: 'A do-not-contact flag exists but its origin cannot be proven. GAP will not recommend outreach until someone reviews where it came from.',
  },
  service_unreadable: {
    title: 'Suppression status unknown',
    body: 'GAP could not read the suppression service. Nothing outbound is allowed until it can be verified. No do-not-contact was recorded because of this.',
  },
};
