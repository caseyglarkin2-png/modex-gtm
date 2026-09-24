/**
 * Learning metrics (GAP Prospecting OS, Sprint 5). Pure.
 *
 * Answers "where is the prospecting hypothesis working or failing": targeting
 * (signal yield), the hypothesis itself (resolution rate, precision), the
 * message (problem resonance, root cause, impact), the ask (problem to
 * meeting) and discovery (meeting to qualified problem). Every rate returns
 * `{ value, n }` with the numerator and denominator restated for audit; a
 * zero denominator returns `value: null`, never a fabricated 0% or 100%.
 * Nothing here implies statistical significance -- that is a UI-layer
 * decision (`MIN_RELIABLE_SAMPLE`), not a math one.
 *
 * Inputs are pre-shaped by `learning/query.ts` (the Prisma glue): every
 * `FunnelConversation` the caller passes MUST already be human-confirmed --
 * this module has no confirmation column to check and trusts the caller, the
 * same contract `resolution.ts` uses for its BID input. The query layer is
 * the enforcement point; the mutation-tested guard lives there
 * (`learning-query.test.ts`), not here.
 */

import type { ResponseClass } from '../taxonomy';

// ---------------------------------------------------------------------------
// Rate
// ---------------------------------------------------------------------------

export interface Rate {
  /** null when denominator is 0. Never implies significance at any n. */
  value: number | null;
  /** Sample size: the denominator, restated so a UI never has to dig for it. */
  n: number;
  numerator: number;
  denominator: number;
}

export function rate(numerator: number, denominator: number): Rate {
  return { value: denominator > 0 ? numerator / denominator : null, n: denominator, numerator, denominator };
}

/** Below this n, a UI shows the number with a low-sample flag, never suppresses it. */
export const MIN_RELIABLE_SAMPLE = 5;

export function isLowSample(r: Rate): boolean {
  return r.denominator > 0 && r.denominator < MIN_RELIABLE_SAMPLE;
}

// ---------------------------------------------------------------------------
// Vocabulary (section 7 / taxonomy.ts, restated here so this module has no
// import-time dependency beyond the type)
// ---------------------------------------------------------------------------

/** Not a conversation: the sequence kept running, or nobody was reached. */
export const NON_SUBSTANTIVE_RESPONSE_CLASSES = [
  'no_answer',
  'voicemail',
  'gatekeeper',
  'out_of_office',
  'bounce',
  'no_signal',
] as const satisfies readonly ResponseClass[];

/** The buyer spoke to the business problem, one way or the other. */
export const PROBLEM_CONFIRMING_RESPONSE_CLASSES = ['problem_confirmed', 'problem_partially_confirmed'] as const satisfies readonly ResponseClass[];

/** A hypothesis reached a human verdict (section 5.1: active -> resolve). */
export const RESOLVED_HYPOTHESIS_STATUSES = ['confirmed', 'partially_confirmed', 'rejected'] as const;

function isNonSubstantive(responseClass: string): boolean {
  return (NON_SUBSTANTIVE_RESPONSE_CLASSES as readonly string[]).includes(responseClass);
}

function isProblemConfirming(responseClass: string): boolean {
  return (PROBLEM_CONFIRMING_RESPONSE_CLASSES as readonly string[]).includes(responseClass);
}

function isResolvedStatus(status: string): boolean {
  return (RESOLVED_HYPOTHESIS_STATUSES as readonly string[]).includes(status);
}

// ---------------------------------------------------------------------------
// Row shapes the query layer builds
// ---------------------------------------------------------------------------

export interface FunnelHypothesis {
  id: string;
  /** ProspectingHypothesis.status, any value; only RESOLVED_HYPOTHESIS_STATUSES count as resolved. */
  status: string;
}

export interface FunnelConversation {
  /** ConversationDisposition.id. Caller guarantees human_confirmed === true. */
  id: string;
  hypothesisId: string;
  responseClass: string;
  channel: string;
  /**
   * A root-cause signal exists ANYWHERE on this conversation's hypothesis: a
   * confirmed, unsuperseded root_cause BID on any of the hypothesis's
   * conversations, or this disposition's own root_cause_class. Not
   * conversation-scoped or time-ordered: a BID confirmed on a later touch
   * marks every problem-confirming conversation of that hypothesis true,
   * including earlier ones. Deliberate (query.ts), because root cause and
   * impact are properties of the account's overall answer, not of one reply;
   * it cannot push a rate over 1 (the denominator is conversation-counted the
   * same way), but it does mean rootCauseConfirmationRate reads as "did the
   * hypothesis establish a root cause", not "did THIS message contain one".
   */
  rootCauseConfirmed: boolean;
  /** Same hypothesis-wide rule as rootCauseConfirmed, for impact/metric BID types or impact_class. */
  impactAcknowledged: boolean;
  /** A confirmed, unsuperseded impact/metric BID (anywhere on the hypothesis) carries a numeric value and a unit. Implies impactAcknowledged. */
  impactQuantified: boolean;
}

// ---------------------------------------------------------------------------
// The hypothesis funnel (metrics 1, 2)
// ---------------------------------------------------------------------------

export interface HypothesisFunnel {
  /** resolved hypotheses / hypotheses with substantive buyer interaction. */
  resolutionRate: Rate;
  /** (confirmed + partially_confirmed) / resolved. */
  precision: Rate;
  /** confirmed only / resolved -- the confirmed component of precision. */
  precisionConfirmed: Rate;
  /** partially_confirmed only / resolved -- the partial component of precision. */
  precisionPartial: Rate;
}

export function computeHypothesisFunnel(
  hypotheses: readonly FunnelHypothesis[],
  conversations: readonly FunnelConversation[],
): HypothesisFunnel {
  const substantiveHypothesisIds = new Set(
    conversations.filter((c) => !isNonSubstantive(c.responseClass)).map((c) => c.hypothesisId),
  );
  const withInteraction = hypotheses.filter((h) => substantiveHypothesisIds.has(h.id));
  const resolved = withInteraction.filter((h) => isResolvedStatus(h.status));
  const confirmed = resolved.filter((h) => h.status === 'confirmed');
  const partial = resolved.filter((h) => h.status === 'partially_confirmed');

  return {
    resolutionRate: rate(resolved.length, withInteraction.length),
    precision: rate(confirmed.length + partial.length, resolved.length),
    precisionConfirmed: rate(confirmed.length, resolved.length),
    precisionPartial: rate(partial.length, resolved.length),
  };
}

// ---------------------------------------------------------------------------
// The conversation funnel (metrics 3-8)
// ---------------------------------------------------------------------------

export interface ConversationFunnel {
  /** problem-confirming conversations / substantive conversations. */
  problemResonanceRate: Rate;
  /** root cause confirmed or partial / problem-confirming conversations. */
  rootCauseConfirmationRate: Rate;
  /** impact acknowledged or quantified / problem-confirming conversations. */
  impactAcknowledgmentRate: Rate;
  /** impact quantified / problem-confirming conversations. */
  impactQuantificationRate: Rate;
  /**
   * meetings accepted / problem-confirming conversations, counted per
   * hypothesis (a hypothesis with a problem-confirming conversation and a
   * later meeting_accepted conversation counts once), so the rate cannot
   * exceed 1 even when a hypothesis carries several conversations.
   */
  problemToMeetingRate: Rate;
  /**
   * qualified business problems / meetings held, counted per hypothesis. A
   * "meeting held" is a conversation captured with channel `meeting`
   * (Call Mode's meeting form); "qualified" means that same meeting's
   * disposition confirmed or partially confirmed the business problem.
   */
  meetingToQualifiedProblemRate: Rate;
}

export function computeConversationFunnel(conversations: readonly FunnelConversation[]): ConversationFunnel {
  const substantive = conversations.filter((c) => !isNonSubstantive(c.responseClass));
  const problemConfirming = substantive.filter((c) => isProblemConfirming(c.responseClass));

  const rootCauseCount = problemConfirming.filter((c) => c.rootCauseConfirmed).length;
  const impactAckCount = problemConfirming.filter((c) => c.impactAcknowledged).length;
  const impactQuantCount = problemConfirming.filter((c) => c.impactQuantified).length;

  const problemConfirmingHypothesisIds = new Set(problemConfirming.map((c) => c.hypothesisId));
  const meetingAcceptedHypothesisIds = new Set(
    conversations.filter((c) => c.responseClass === 'meeting_accepted').map((c) => c.hypothesisId),
  );
  const problemToMeetingHits = [...problemConfirmingHypothesisIds].filter((id) => meetingAcceptedHypothesisIds.has(id));

  const meetingsHeld = conversations.filter((c) => c.channel === 'meeting');
  const meetingsHeldHypothesisIds = new Set(meetingsHeld.map((c) => c.hypothesisId));
  const qualifiedAtMeetingHypothesisIds = new Set(
    meetingsHeld.filter((c) => isProblemConfirming(c.responseClass)).map((c) => c.hypothesisId),
  );

  return {
    problemResonanceRate: rate(problemConfirming.length, substantive.length),
    rootCauseConfirmationRate: rate(rootCauseCount, problemConfirming.length),
    impactAcknowledgmentRate: rate(impactAckCount, problemConfirming.length),
    impactQuantificationRate: rate(impactQuantCount, problemConfirming.length),
    problemToMeetingRate: rate(problemToMeetingHits.length, problemConfirmingHypothesisIds.size),
    meetingToQualifiedProblemRate: rate(qualifiedAtMeetingHypothesisIds.size, meetingsHeldHypothesisIds.size),
  };
}

export interface LearningFunnel extends HypothesisFunnel, ConversationFunnel {}

export function computeFunnel(
  hypotheses: readonly FunnelHypothesis[],
  conversations: readonly FunnelConversation[],
): LearningFunnel {
  return { ...computeHypothesisFunnel(hypotheses, conversations), ...computeConversationFunnel(conversations) };
}

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

export interface FunnelBreakdownRow<K extends string = string> {
  key: K;
  funnel: LearningFunnel;
}

/**
 * Group by a property of the HYPOTHESIS (problem family, persona, signal
 * type, TAM tier, sequence family, sequence version). Every conversation of a
 * grouped hypothesis rides along, so the full funnel (including the
 * hypothesis-level rates) is meaningful per group. Hypotheses the key
 * function returns null for are left out of every group (not folded into an
 * "unknown" bucket silently) so a caller can decide how to label the gap.
 */
export function breakdownByHypothesisDimension<T extends FunnelHypothesis, K extends string>(
  hypotheses: readonly T[],
  conversations: readonly FunnelConversation[],
  keyOf: (hypothesis: T) => K | null,
): FunnelBreakdownRow<K>[] {
  const keyByHypothesisId = new Map<string, K>();
  const hypothesesByKey = new Map<K, T[]>();
  for (const h of hypotheses) {
    const key = keyOf(h);
    if (key === null) continue;
    keyByHypothesisId.set(h.id, key);
    const bucket = hypothesesByKey.get(key);
    if (bucket) bucket.push(h);
    else hypothesesByKey.set(key, [h]);
  }
  const conversationsByKey = new Map<K, FunnelConversation[]>();
  for (const c of conversations) {
    const key = keyByHypothesisId.get(c.hypothesisId);
    if (key === undefined) continue;
    const bucket = conversationsByKey.get(key);
    if (bucket) bucket.push(c);
    else conversationsByKey.set(key, [c]);
  }
  return [...hypothesesByKey.entries()].map(([key, hyps]) => ({
    key,
    funnel: computeFunnel(hyps, conversationsByKey.get(key) ?? []),
  }));
}

/**
 * Group by a property of the CONVERSATION (channel, sender). Only the
 * conversation-level rates (3-8) are meaningful at this grain -- a single
 * hypothesis can carry conversations on several channels, so "resolution
 * rate by channel" would double-count the hypothesis. The hypothesis-level
 * rates (1, 2) are therefore not part of this breakdown's shape.
 */
export function breakdownByConversationDimension<T extends FunnelConversation, K extends string>(
  conversations: readonly T[],
  keyOf: (conversation: T) => K | null,
): Array<{ key: K; funnel: ConversationFunnel }> {
  const byKey = new Map<K, T[]>();
  for (const c of conversations) {
    const key = keyOf(c);
    if (key === null) continue;
    const bucket = byKey.get(key);
    if (bucket) bucket.push(c);
    else byKey.set(key, [c]);
  }
  return [...byKey.entries()].map(([key, rows]) => ({ key, funnel: computeConversationFunnel(rows) }));
}

/** Raw counts of response classes among the conversations passed in (typically the substantive set). Never hides a class with n=0 the caller expected -- it simply omits classes with no rows, same as every other breakdown here. */
export function dispositionDistribution(conversations: readonly FunnelConversation[]): Array<{ responseClass: string; count: number }> {
  const counts = new Map<string, number>();
  for (const c of conversations) counts.set(c.responseClass, (counts.get(c.responseClass) ?? 0) + 1);
  return [...counts.entries()]
    .map(([responseClass, count]) => ({ responseClass, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Signal yield: how many registered signals of a type became a hypothesis
// ---------------------------------------------------------------------------

export interface SignalYieldRow {
  signalType: string;
  signalCount: number;
  hypothesisCount: number;
  rate: Rate;
}

/**
 * `signalCounts` and `hypothesisSignalTypes` are independent inputs (a
 * signal type can exist with zero hypotheses, or vice versa if a hypothesis
 * cites a signal type no longer freshly registered) so this stays a pure
 * join rather than assuming one side is a superset of the other.
 */
export function computeSignalYield(
  signalCounts: ReadonlyMap<string, number>,
  hypothesisPrimarySignalTypes: readonly string[],
): SignalYieldRow[] {
  const hypothesisCountByType = new Map<string, number>();
  for (const type of hypothesisPrimarySignalTypes) hypothesisCountByType.set(type, (hypothesisCountByType.get(type) ?? 0) + 1);

  const types = new Set<string>([...signalCounts.keys(), ...hypothesisCountByType.keys()]);
  return [...types]
    .map((signalType) => {
      const signalCount = signalCounts.get(signalType) ?? 0;
      const hypothesisCount = hypothesisCountByType.get(signalType) ?? 0;
      return { signalType, signalCount, hypothesisCount, rate: rate(hypothesisCount, signalCount) };
    })
    .sort((a, b) => b.signalCount - a.signalCount);
}
