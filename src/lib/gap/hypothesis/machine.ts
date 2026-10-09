/**
 * Hypothesis lifecycle state machine (GAP Prospecting OS, Sprint 1, S1-T4).
 *
 * Pure. Takes a plain snapshot of a hypothesis plus an action and a context,
 * and returns either the next status with a list of named side effects for
 * the caller to apply, or a literal refusal reason. Nothing here touches
 * Prisma, the clock, or the network. `LEGAL_TRANSITIONS` enumerates the table
 * so tests and UI can render it without re-deriving it.
 *
 * Refusal reasons are stable strings: callers and tests match on them.
 *
 * Two invariants worth naming. The submit guard set (signals, cited
 * observation, hedged problem, falsification questions, mapped family) is
 * re-run on approve and on activate, because narrative edits are accepted
 * while a hypothesis sits in review. And resolve never takes the seller's
 * word for the outcome: the newest confirmed disposition decides.
 */

import {
  HEDGE_TOKENS,
  HYPOTHESIS_TERMINAL_STATUSES,
  isProblemFamily,
  type HypothesisStatus,
} from '../taxonomy';
import { extractCitationIds, validateObservation } from './observation';
import { openerFits } from '../research/opener';

export type { HypothesisStatus };

export type HypothesisAction =
  | 'submit'
  | 'reject_review'
  | 'approve'
  | 'activate'
  | 'resolve'
  | 'close_unresolved'
  | 'expire'
  | 'withdraw';

export type ResolutionOutcome = 'confirmed' | 'partially_confirmed' | 'rejected';

export interface LinkedSignal {
  id: string;
  hasEvidence: boolean;
  /**
   * Red team T6: a verified, dated, quoted, account-specific statement of a
   * physical-network change (research/evidence-gate.ts). Computed by the
   * snapshot loader; absent reads as false. A keyword hit is never one.
   */
  outreachFact?: boolean;
  /**
   * I06 (2026-10-08): may the fact support a thesis at all? False only for a reason that is not the calendar (ended
   * by a newer source, closed on its due date, undated, superseded), judged by research/currentness.ts
   * `isUsableFact` in the snapshot loader. Absent reads as usable: age alone never disqualifies.
   */
  usable?: boolean;
  expiresAt: Date | null;
}

export interface HypothesisVersionSnapshot {
  status: 'draft' | 'frozen' | 'retired';
  firstTouchProductProof: boolean;
}

export interface HypothesisSnapshot {
  status: HypothesisStatus;
  problemFamily: string;
  persona: string;
  observation: string;
  problemHypothesis: string;
  falsificationQuestions: string[];
  linkedSignals: LinkedSignal[];
  reviewedBy: string | null;
  primaryPersonaId: number | null;
  personaSuppressed: boolean;
  /**
   * Owner resolution (2026-10-05): the primary person's contact currentness at this account, when it blocks.
   * A person who left, or whose employer is in conflict, never activates (they are not do-not-contact: this is
   * its own guard, with its own reason). Absent reads as not blocked.
   */
  personaEmploymentBlocked?: 'persona_left_account' | 'persona_employment_conflict' | null;
  version: HypothesisVersionSnapshot | null;
  expiresAt: Date | null;
  confirmedDispositions: Array<{ responseClass: string; createdAt: Date }>;
}

export interface TransitionContext {
  now: Date;
  actor?: string;
  reason?: string;
  outcome?: ResolutionOutcome;
}

export type TransitionResult =
  | { ok: true; to: HypothesisStatus; effects: string[] }
  | { ok: false; reason: string };

export interface LegalTransition {
  from: HypothesisStatus;
  action: HypothesisAction;
  /**
   * The destination status, or `'outcome'` when the destination is derived from
   * the newest confirmed disposition (see `DISPOSITION_OUTCOMES`). A `ctx.outcome`
   * that disagrees with the derived one is refused with `outcome_mismatch:<derived>`.
   */
  to: HypothesisStatus | 'outcome';
}

export const LEGAL_TRANSITIONS: readonly LegalTransition[] = [
  { from: 'draft', action: 'submit', to: 'review_required' },
  { from: 'review_required', action: 'reject_review', to: 'draft' },
  { from: 'review_required', action: 'approve', to: 'approved' },
  { from: 'approved', action: 'activate', to: 'active' },
  { from: 'active', action: 'resolve', to: 'outcome' },
  { from: 'active', action: 'close_unresolved', to: 'unresolved' },
  { from: 'approved', action: 'expire', to: 'expired' },
  { from: 'active', action: 'expire', to: 'expired' },
  { from: 'draft', action: 'withdraw', to: 'rejected' },
  { from: 'review_required', action: 'withdraw', to: 'rejected' },
  { from: 'approved', action: 'withdraw', to: 'rejected' },
];

export const DEFAULT_EXPIRY_DAYS = 45;

export function isTerminalStatus(status: HypothesisStatus): boolean {
  return (HYPOTHESIS_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/**
 * I06 (2026-10-08): a thesis no longer expires on the calendar. Its expiry used to be the earliest linked-signal
 * expiry (or 45 days), which was signal age as an automatic disqualification; a fact's usability is judged by its
 * content (ended, closed, undated, superseded), never by the clock. Null: no expiry. Rows that carry a date from
 * before this change keep it (the sweep still reads it); nothing new is written.
 */
export function expiresAtFor(): Date | null {
  return null;
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function nonBlank(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** The clock helper the explicit `expire` action still reads for rows that carry a date from before I06; no guard on the way to approval, activation or use reads it. */
function isExpired(expiresAt: Date | null, now: Date): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

/** I06: a fact is usable unless the loader judged it ended, closed, undated or superseded; age never counts. */
const usable = (signal: LinkedSignal): boolean => signal.usable !== false;

/** `null` when usable evidence exists, else the refusal reason (`evidence_expired` now means ended, closed, undated or superseded). */
function evidenceGuard(snapshot: HypothesisSnapshot): 'no_evidence' | 'evidence_expired' | null {
  const evidenced = snapshot.linkedSignals.filter((signal) => signal.hasEvidence);
  if (evidenced.length === 0) return 'no_evidence';
  if (!evidenced.some(usable)) return 'evidence_expired';
  return null;
}

/**
 * Red team T6: approval and activation need at least one LIVE outreach fact.
 * Evidence GAP itself rates INSUFFICIENT (keyword hits, operator hearsay,
 * unverified or irrelevant sentences) can inform research, never use.
 */
function outreachFactGuard(snapshot: HypothesisSnapshot): 'evidence_insufficient' | 'opener_too_long' | null {
  // Final Monday P1: an opener quoting more than the compiler lets one first
  // touch carry can never pass Send. It is never approved or put in use.
  if (!openerFits(snapshot.observation)) return 'opener_too_long';
  // I06: a usable outreach fact, whatever its age (the copy states the date).
  const live = (signal: LinkedSignal) => signal.outreachFact === true && usable(signal);
  if (!snapshot.linkedSignals.some(live)) return 'evidence_insufficient';
  // Release C review SF1: the observation is the sentence the buyer reads.
  // Every signal it cites must itself be a live outreach fact; a fact linked
  // beside a cited keyword hit does not make the keyword hit citable.
  const facts = new Set(snapshot.linkedSignals.filter(live).map((s) => s.id));
  const cited = extractCitationIds(snapshot.observation ?? '');
  return cited.length > 0 && cited.every((id) => facts.has(id)) ? null : 'evidence_insufficient';
}

/** Response classes that resolve a hypothesis, and the status each one resolves to. */
export const DISPOSITION_OUTCOMES: Readonly<Record<string, ResolutionOutcome>> = {
  problem_confirmed: 'confirmed',
  problem_partially_confirmed: 'partially_confirmed',
  problem_rejected: 'rejected',
};

/**
 * The newest disposition with a resolving response class, or `null`. Ties on
 * createdAt go to the later entry in the array. The seller does not pick the
 * outcome; the buyer's latest answer does.
 */
export function newestConfirmedDisposition(
  dispositions: readonly { responseClass: string; createdAt: Date }[],
): { responseClass: string; createdAt: Date } | null {
  let newest: { responseClass: string; createdAt: Date } | null = null;
  for (const disposition of dispositions) {
    if (!(disposition.responseClass in DISPOSITION_OUTCOMES)) continue;
    if (newest === null || disposition.createdAt.getTime() >= newest.createdAt.getTime()) {
      newest = disposition;
    }
  }
  return newest;
}

function isHedged(problemHypothesis: string): boolean {
  const lower = problemHypothesis.toLowerCase();
  return HEDGE_TOKENS.some((token) => lower.includes(token));
}

function submitGuard(snapshot: HypothesisSnapshot): string | null {
  if (snapshot.linkedSignals.length < 1) return 'no_signals';
  const observation = validateObservation(
    snapshot.observation,
    snapshot.linkedSignals.map((signal) => signal.id),
  );
  if (!observation.ok) return observation.reason;
  if (!nonBlank(snapshot.problemHypothesis)) return 'no_problem';
  if (!isHedged(snapshot.problemHypothesis)) return 'unhedged_hypothesis';
  if (!snapshot.falsificationQuestions.some(nonBlank)) return 'no_falsification';
  if (!isProblemFamily(snapshot.problemFamily)) return 'unmapped_family';
  return null;
}

function activateGuard(snapshot: HypothesisSnapshot): string | null {
  const narrative = submitGuard(snapshot);
  if (narrative) return narrative;
  if (!nonBlank(snapshot.reviewedBy)) return 'not_reviewed';
  const evidence = evidenceGuard(snapshot);
  if (evidence) return evidence;
  const fact = outreachFactGuard(snapshot);
  if (fact) return fact;
  if (snapshot.primaryPersonaId === null) return 'no_persona';
  if (snapshot.personaSuppressed) return 'suppressed';
  if (snapshot.personaEmploymentBlocked) return snapshot.personaEmploymentBlocked;
  if (snapshot.version) {
    if (snapshot.version.status === 'retired') return 'version_retired';
    if (snapshot.version.firstTouchProductProof) return 'first_touch_proof';
  }
  return null;
}

function expireGuard(snapshot: HypothesisSnapshot, now: Date): string | null {
  if (isExpired(snapshot.expiresAt, now)) return null;
  const signals = snapshot.linkedSignals;
  if (signals.length > 0 && signals.every((signal) => isExpired(signal.expiresAt, now))) return null;
  return 'not_yet_expired';
}

// ---------------------------------------------------------------------------
// Transition
// ---------------------------------------------------------------------------

const refuse = (reason: string): TransitionResult => ({ ok: false, reason });
const move = (to: HypothesisStatus, effects: string[] = []): TransitionResult => ({ ok: true, to, effects });

export function transition(
  snapshot: HypothesisSnapshot,
  action: HypothesisAction,
  ctx: TransitionContext,
): TransitionResult {
  const from = snapshot.status;

  if (isTerminalStatus(from)) return refuse('terminal');

  if (from === 'draft' && action === 'submit') {
    const failure = submitGuard(snapshot);
    return failure ? refuse(failure) : move('review_required');
  }

  if (from === 'review_required' && action === 'reject_review') {
    if (!nonBlank(ctx.reason)) return refuse('no_reason');
    return move('draft');
  }

  if (from === 'review_required' && action === 'approve') {
    // Review-stage narrative edits can land after submit, so the submit guard
    // set is re-run here: nothing unhedged, unmapped or unfalsifiable gets approved.
    const narrative = submitGuard(snapshot);
    if (narrative) return refuse(narrative);
    if (!nonBlank(ctx.actor)) return refuse('no_actor');
    const evidence = evidenceGuard(snapshot);
    if (evidence) return refuse(evidence);
    const fact = outreachFactGuard(snapshot);
    if (fact) return refuse(fact);
    return move('approved', ['set_reviewed']);
  }

  if (from === 'approved' && action === 'activate') {
    const failure = activateGuard(snapshot);
    return failure ? refuse(failure) : move('active', ['set_activated', 'freeze_narrative', 'set_expires_at']);
  }

  if (from === 'active' && action === 'resolve') {
    const deciding = newestConfirmedDisposition(snapshot.confirmedDispositions);
    if (!deciding) return refuse('no_confirmed_disposition');
    const derived = DISPOSITION_OUTCOMES[deciding.responseClass];
    if (ctx.outcome !== undefined && ctx.outcome !== derived) return refuse(`outcome_mismatch:${derived}`);
    return move(derived, [
      'set_resolved',
      'stop_enrollments:hypothesis_resolved',
      `resolved_by_disposition:${deciding.createdAt.toISOString()}`,
    ]);
  }

  if (from === 'active' && action === 'close_unresolved') {
    if (!nonBlank(ctx.reason)) return refuse('no_reason');
    return move('unresolved', ['stop_enrollments:manual']);
  }

  if ((from === 'approved' || from === 'active') && action === 'expire') {
    const failure = expireGuard(snapshot, ctx.now);
    return failure ? refuse(failure) : move('expired', ['stop_enrollments:hypothesis_expired']);
  }

  if ((from === 'draft' || from === 'review_required' || from === 'approved') && action === 'withdraw') {
    if (!nonBlank(ctx.reason)) return refuse('no_reason');
    return move('rejected');
  }

  return refuse(`ILLEGAL_TRANSITION:${from}->${action}`);
}
