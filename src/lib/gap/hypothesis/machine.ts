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
import { validateObservation } from './observation';

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
const DAY_MS = 24 * 60 * 60 * 1000;

export function isTerminalStatus(status: HypothesisStatus): boolean {
  return (HYPOTHESIS_TERMINAL_STATUSES as readonly string[]).includes(status);
}

/** The earliest linked-signal expiry, or `now` plus 45 days when no signal carries one. */
export function expiresAtFor(linkedSignals: readonly LinkedSignal[], now: Date): Date {
  let min: Date | null = null;
  for (const signal of linkedSignals) {
    if (signal.expiresAt === null) continue;
    if (min === null || signal.expiresAt.getTime() < min.getTime()) {
      min = signal.expiresAt;
    }
  }
  return min === null
    ? new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * DAY_MS)
    : new Date(min.getTime());
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

function nonBlank(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isExpired(expiresAt: Date | null, now: Date): boolean {
  return expiresAt !== null && expiresAt.getTime() <= now.getTime();
}

/** `null` when live evidence exists, else the refusal reason. */
function evidenceGuard(snapshot: HypothesisSnapshot, now: Date): 'no_evidence' | 'evidence_expired' | null {
  const evidenced = snapshot.linkedSignals.filter((signal) => signal.hasEvidence);
  if (evidenced.length === 0) return 'no_evidence';
  if (!evidenced.some((signal) => !isExpired(signal.expiresAt, now))) return 'evidence_expired';
  return null;
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

function activateGuard(snapshot: HypothesisSnapshot, now: Date): string | null {
  const narrative = submitGuard(snapshot);
  if (narrative) return narrative;
  if (!nonBlank(snapshot.reviewedBy)) return 'not_reviewed';
  const evidence = evidenceGuard(snapshot, now);
  if (evidence) return evidence;
  if (snapshot.primaryPersonaId === null) return 'no_persona';
  if (snapshot.personaSuppressed) return 'suppressed';
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
    const evidence = evidenceGuard(snapshot, ctx.now);
    if (evidence) return refuse(evidence);
    return move('approved', ['set_reviewed']);
  }

  if (from === 'approved' && action === 'activate') {
    const failure = activateGuard(snapshot, ctx.now);
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
