/**
 * APPROACH-SPECIFIC EVIDENCE POLICY (GAP OS execution recovery, R30, 2026-10-06; the owner-approved amendment in
 * docs/gap/STABLE_BASELINE.md). Pure.
 *
 * The universal physical-change prerequisite becomes explicit, tested admissibility per approach. The motion kind
 * (motion/approach.ts: IN_DEAL, FOLLOW_UP, INTRO_ONLY, FACT_LED, REFERRAL_LED, RELATIONSHIP_LED) stays the one
 * decision of HOW GAP goes in; this module says what EVIDENCE each way in may rest on, and what it may never say:
 *
 *   event_led                 a physical-network change (the existing first-touch path, unchanged): the gate's
 *                             physical fact, verbatim, dated, the account's own statement
 *   job_procurement_led       a verified job posting with yard / dock / trailer / gate / fleet duties that is not
 *                             known closed, or a procurement notice the account issued: the copy may state only the
 *                             posting's or notice's own text and must ask whether it is still open; never "they lack
 *                             a system", "understaffed", "budget", "the contract is open"
 *   report_led                an attributed third-party report: NOT ENABLED (source access, identity and policy do
 *                             not yet support that phrasing); a request is refused with the reason, never bypassed
 *   fit_led                   no fresh event: a stable operating fact (continuity ongoing_state) and a transparent
 *                             fit question; no invented why-now, no diagnosed pain
 *   warm_intro                a real relationship (met, introduced, referred): no public thesis needed; GAP drafts
 *                             nothing cold
 *   existing_thread_reply     the buyer wrote: answer the thread; no thesis needed
 *   active_deal_follow_up     an open deal with a recorded commitment or next step; no thesis needed
 *
 * Nothing here is a bypass: an approach that needs a thesis still runs the same gate at approval, activation and the
 * wire (evidence-gate.ts reads the approach from the thesis); an approach that needs none still runs suppression,
 * the open-deal read, currentness and the one-to-one proof at the click. Pinned by tests/unit/gap/approach-policy.test.ts.
 */
import type { ClaimAttributes } from './claim-types';

export type EvidenceApproach = 'event_led' | 'job_procurement_led' | 'report_led' | 'fit_led';
export type ContextApproach = 'warm_intro' | 'existing_thread_reply' | 'active_deal_follow_up';
export type Approach = EvidenceApproach | ContextApproach;

export const EVIDENCE_APPROACHES: readonly EvidenceApproach[] = ['event_led', 'job_procurement_led', 'report_led', 'fit_led'];
export const DEFAULT_APPROACH: EvidenceApproach = 'event_led';

export interface ApproachPolicy {
  approach: Approach;
  needsThesis: boolean;
  /** The signal claim classes (ProspectingSignal.claim_class) a thesis of this approach may cite as its opener. */
  admits: readonly string[];
  /** What the seller must have or do (seller words). */
  requires: readonly string[];
  /** What the copy may never say (seller words). */
  forbids: readonly string[];
  enabled: boolean;
}

export const APPROACH_POLICY: Record<Approach, ApproachPolicy> = {
  event_led: {
    approach: 'event_led',
    needsThesis: true,
    admits: ['FACT'],
    requires: ['a verified, dated, quoted physical-network change in the account\'s own words', 'an approved thesis on it'],
    forbids: ['that the change proves congestion, loss, demand or a purchase intention'],
    enabled: true,
  },
  job_procurement_led: {
    approach: 'job_procurement_led',
    needsThesis: true,
    admits: ['JOB_POSTING', 'PROCUREMENT', 'FACT'],
    requires: ['a verified posting with yard, dock, trailer, gate or fleet duties that is not known closed, or a notice the account issued', 'a question whether it is still open', 'an approved thesis on it'],
    forbids: ['that they lack a system, are understaffed or have a budget', 'that the contract is open or YardFlow qualifies', 'any pain the posting does not state'],
    enabled: true,
  },
  report_led: {
    approach: 'report_led',
    needsThesis: true,
    admits: [],
    requires: ['an attributed report, corroborated where material (not yet supported)'],
    forbids: ['presenting a rumor, vendor marketing or an analyst line as the account\'s own statement'],
    enabled: false,
  },
  fit_led: {
    approach: 'fit_led',
    needsThesis: true,
    admits: ['FACT'],
    requires: ['a stable operating fact (an ongoing state, not a fresh event)', 'a transparent fit question with no why-now'],
    forbids: ['an invented event or urgency', 'a diagnosed pain'],
    enabled: true,
  },
  warm_intro: {
    approach: 'warm_intro',
    needsThesis: false,
    admits: [],
    requires: ['a real relationship: met, introduced or referred (never a list membership)'],
    forbids: ['a cold email to anyone else at the account while the introduction is open'],
    enabled: true,
  },
  existing_thread_reply: {
    approach: 'existing_thread_reply',
    needsThesis: false,
    admits: [],
    requires: ['the buyer\'s own message in the thread'],
    forbids: ['a public news thesis as a precondition to answering', 'a cold email to a colleague before the reply is recorded'],
    enabled: true,
  },
  active_deal_follow_up: {
    approach: 'active_deal_follow_up',
    needsThesis: false,
    admits: [],
    requires: ['an open HubSpot deal', 'the recorded commitment or next step'],
    forbids: ['a cold first touch to the account', 'a claim of prospect acceptance that was not given'],
    enabled: true,
  },
};

export function isApproach(v: unknown): v is Approach {
  return typeof v === 'string' && v in APPROACH_POLICY;
}

export function isEvidenceApproach(v: unknown): v is EvidenceApproach {
  return typeof v === 'string' && (EVIDENCE_APPROACHES as readonly string[]).includes(v);
}

/** The evidence approach a thesis declares (metadata.approach), else the default (the physical-change path). */
export function approachOfHypothesis(h: { metadata?: unknown } | null | undefined): EvidenceApproach {
  const m = h?.metadata;
  const v = m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>).approach : undefined;
  return isEvidenceApproach(v) ? v : DEFAULT_APPROACH;
}

export type ClaimAdmission = { ok: true } | { ok: false; reason: 'approach_not_enabled' | 'claim_not_admitted_for_approach' | 'posting_closed' | 'not_an_ongoing_state' };

/**
 * May a claim of this class open a thesis of this approach? The gate's other rules (verified, dated, the account's
 * own, live, a real publisher page) are the caller's and run regardless.
 */
export function claimAdmittedFor(approach: EvidenceApproach, claim: { claimClass: string | null | undefined; attributes?: ClaimAttributes | null; continuity?: 'event' | 'ongoing_state' | 'ended' | null }): ClaimAdmission {
  const p = APPROACH_POLICY[approach];
  if (!p.enabled) return { ok: false, reason: 'approach_not_enabled' };
  const cls = claim.claimClass ?? 'FACT';
  if (!p.admits.includes(cls)) return { ok: false, reason: 'claim_not_admitted_for_approach' };
  if (approach === 'job_procurement_led' && cls === 'JOB_POSTING' && claim.attributes?.postingStatus === 'closed') return { ok: false, reason: 'posting_closed' };
  if (approach === 'fit_led' && claim.continuity && claim.continuity !== 'ongoing_state') return { ok: false, reason: 'not_an_ongoing_state' };
  return { ok: true };
}

/** The motion kinds that need no thesis, mapped to their approach (the brief's own decision stays the authority). */
export function contextApproachOf(motionKind: string): ContextApproach | null {
  switch (motionKind) {
    case 'IN_DEAL':
      return 'active_deal_follow_up';
    case 'FOLLOW_UP':
      return 'existing_thread_reply';
    case 'INTRO_ONLY':
    case 'REFERRAL_LED':
    case 'RELATIONSHIP_LED':
      return 'warm_intro';
    default:
      return null;
  }
}
