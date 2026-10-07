/**
 * ACTIONABILITY (Monday readiness, 2026-09-27). Pure.
 *
 * What Casey can do with one hypothesis right now, derived on the SERVER from
 * the canonical evidence gate (research/evidence-gate.ts sendableEvidence),
 * never from status alone and never re-implemented in React.
 *
 * The live defect: five PepsiCo rows were already approved on a keyword-only
 * observation. The UI offered Approve + use from status alone, the server
 * correctly refused `evidence_insufficient`, and Casey was told "0 approved".
 * The rule this module enforces for every surface (thesis cards, the drawer,
 * the lanes, NEXT UP):
 *
 *   THE UI NEVER OFFERS A PRIMARY ACTION THE SERVER ALREADY KNOWS WILL FAIL.
 *
 * RESEARCH DEPTH (research/depth.ts) says how many independent sources exist.
 * OUTREACH READINESS (here) says whether the sentence the buyer would read is
 * a verified, cited fact. A thesis can have a source and still be not ready.
 */
import { sendableEvidence, type GateSignal } from '../research/evidence-gate';
import { openerFits } from '../research/opener';
import { approachOfHypothesis } from '../research/approach-policy';
import { isCurrentFact } from '../research/currentness';

export type ReadinessReason = 'no_evidence' | 'evidence_expired' | 'evidence_insufficient' | 'opener_too_long';

/**
 * The next useful step for one row:
 *   approve_use    draft/review_required and outreach ready
 *   use            approved and outreach ready
 *   find_evidence  draft/review_required, not ready: chosen evidence rebuilds the observation
 *   revise         approved (frozen), not ready: chosen evidence creates a new draft revision
 *   in_use         active
 *   none           closed
 */
export type NextStep = 'approve_use' | 'use' | 'find_evidence' | 'revise' | 'in_use' | 'none';

export interface Actionability {
  outreachReady: boolean;
  reason: ReadinessReason | null;
  canApprove: boolean;
  canUse: boolean;
  next: NextStep;
}

export type ActionSignal = GateSignal & { freshness_expires_at?: Date | string | null };

export interface ActionabilityInput {
  status: string;
  observation?: string | null;
  account_name: string;
  signals: ReadonlyArray<ActionSignal | null | undefined>;
  /** R34: the thesis's metadata, so readiness is judged under its declared approach (absent: event-led). */
  metadata?: unknown;
}

const EDITABLE = new Set(['draft', 'review_required']);

// Item 2a: the one freshness authority (research/currentness.ts).
const live = (s: ActionSignal, now: Date) => isCurrentFact(s, now);

/** Outreach readiness of the observation + linked signals, and why not. */
export function outreachReadiness(input: Omit<ActionabilityInput, 'status'>, now: Date): { ready: boolean; reason: ReadinessReason | null } {
  const signals = input.signals.filter((s): s is ActionSignal => !!s && typeof s.id === 'string');
  const opts = { approach: approachOfHypothesis(input) };
  if (sendableEvidence(input.observation, signals.filter((s) => live(s, now)), input.account_name, opts).tier === 'VERIFIED_FACT') {
    // Final Monday P1: verified, but quoting more than one first touch can carry. It would only fail at Send.
    return openerFits(input.observation) ? { ready: true, reason: null } : { ready: false, reason: 'opener_too_long' };
  }
  const evidenced = signals.filter((s) => (s.evidence_text ?? '').trim() || (s.evidence_url ?? '').trim());
  if (evidenced.length === 0) return { ready: false, reason: 'no_evidence' };
  // It would be sendable but for the clock: the facts behind it expired.
  if (sendableEvidence(input.observation, signals, input.account_name, opts).tier === 'VERIFIED_FACT') return { ready: false, reason: 'evidence_expired' };
  return { ready: false, reason: 'evidence_insufficient' };
}

export function actionabilityOf(input: ActionabilityInput, now: Date): Actionability {
  if (input.status === 'active') return { outreachReady: outreachReadiness(input, now).ready, reason: null, canApprove: false, canUse: false, next: 'in_use' };
  if (!EDITABLE.has(input.status) && input.status !== 'approved') return { outreachReady: false, reason: null, canApprove: false, canUse: false, next: 'none' };
  const { ready, reason } = outreachReadiness(input, now);
  const editable = EDITABLE.has(input.status);
  if (ready) return { outreachReady: true, reason: null, canApprove: editable, canUse: true, next: editable ? 'approve_use' : 'use' };
  return { outreachReady: false, reason, canApprove: false, canUse: false, next: editable ? 'find_evidence' : 'revise' };
}

/** Steps that are REVIEW work (a decision that can succeed). */
export const REVIEW_STEPS: ReadonlySet<NextStep> = new Set(['approve_use', 'use']);
/** Steps that are RESEARCH work (verified evidence first). */
export const RESEARCH_STEPS: ReadonlySet<NextStep> = new Set(['find_evidence', 'revise']);

/** Machine refusal reasons that mean "find verified evidence", not "blocked". */
export const EVIDENCE_REFUSALS: ReadonlySet<string> = new Set(['evidence_insufficient', 'evidence_expired', 'no_evidence', 'no_signals', 'opener_too_long']);
