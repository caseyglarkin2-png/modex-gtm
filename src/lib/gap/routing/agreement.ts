/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): routing recommendation
 * vs actual human action, over `RoutingDecision.action` (what the router
 * recommended) and `RoutingDecision.human_action` (what the operator actually
 * did, write-once, stamped by `recordHumanAction` in ./queue.ts).
 *
 * This is the gate G1 evaluator's data source (spec section 10): before any
 * routing rule earns canary eligibility, its shadow-mode recommendations must
 * demonstrably agree with what humans did on their own. Nothing here writes
 * anything or infers agreement when `human_action` is absent -- a decision
 * with no human action yet is simply not comparable, not a silent disagreement.
 *
 * Pure: no Prisma, no fetch, no clock.
 */

import type { HumanAction, RoutingAction } from '../taxonomy';

/**
 * The vocabularies do not line up one to one (RoutingAction has 8 members,
 * HumanAction has 5, and HumanAction has no entry for a LinkedIn touch or an
 * "approve the hypothesis" action). Each human action maps to the routing
 * action(s) it counts as agreeing with; a routing action reached through no
 * listed human action, or a human action that names a different routing
 * action, is a disagreement.
 *
 *   enrolled_by_hand -> enroll_gap_sequence (the operator did what the router said)
 *   called           -> call_now
 *   emailed          -> one_off_email
 *   dismissed        -> do_not_contact, nurture (the operator agreed nothing should go out now)
 *   deferred         -> nurture (the operator agreed to hold, on the router's own "not yet" action)
 *
 * research_required, approve_hypothesis and linkedin_manual_task have no
 * human action that can agree with them under the current closed vocabulary
 * (HUMAN_ACTIONS, taxonomy.ts): any human action recorded against one of
 * those routing decisions is a disagreement by construction. That is a real
 * vocabulary gap, not a bug; it is why HUMAN_ACTIONS is closed (review nit
 * N3, taxonomy.ts) rather than free text.
 */
export const HUMAN_ACTION_AGREEMENT: Readonly<Record<HumanAction, readonly RoutingAction[]>> = {
  enrolled_by_hand: ['enroll_gap_sequence'],
  called: ['call_now'],
  emailed: ['one_off_email'],
  dismissed: ['do_not_contact', 'nurture'],
  deferred: ['nurture'],
};

export function agrees(routingAction: RoutingAction, humanAction: HumanAction): boolean {
  return HUMAN_ACTION_AGREEMENT[humanAction].includes(routingAction);
}

export interface AgreementRate {
  agreements: number;
  disagreements: number;
  /** agreements / (agreements + disagreements). Null when there is nothing comparable. */
  rate: number | null;
  n: number;
}

export interface AgreementDecision {
  id: string;
  action: RoutingAction;
  ruleId: string;
  /** Null = no human action recorded yet. Never counted as a disagreement. */
  humanAction: HumanAction | null;
}

export interface AgreementReport {
  overall: AgreementRate;
  byRuleId: Array<{ key: string; rate: AgreementRate }>;
  byAction: Array<{ key: RoutingAction; rate: AgreementRate }>;
  /** Total decisions handed in, comparable or not (for context; not a rate denominator). */
  totalDecisions: number;
}

function emptyRate(): AgreementRate {
  return { agreements: 0, disagreements: 0, rate: null, n: 0 };
}

function tally(rate: AgreementRate, agree: boolean): AgreementRate {
  const agreements = rate.agreements + (agree ? 1 : 0);
  const disagreements = rate.disagreements + (agree ? 0 : 1);
  const n = agreements + disagreements;
  return { agreements, disagreements, n, rate: n > 0 ? agreements / n : null };
}

/**
 * Only decisions with a non-null `humanAction` are comparable and feed the
 * rates; a decision with no human action yet is counted in `totalDecisions`
 * only. Never infers agreement from silence.
 */
export function computeAgreement(decisions: readonly AgreementDecision[]): AgreementReport {
  let overall = emptyRate();
  const byRuleId = new Map<string, AgreementRate>();
  const byAction = new Map<RoutingAction, AgreementRate>();

  for (const d of decisions) {
    if (d.humanAction === null) continue;
    const agree = agrees(d.action, d.humanAction);
    overall = tally(overall, agree);
    byRuleId.set(d.ruleId, tally(byRuleId.get(d.ruleId) ?? emptyRate(), agree));
    byAction.set(d.action, tally(byAction.get(d.action) ?? emptyRate(), agree));
  }

  return {
    overall,
    byRuleId: [...byRuleId.entries()].map(([key, rate]) => ({ key, rate })).sort((a, b) => a.key.localeCompare(b.key)),
    byAction: [...byAction.entries()].map(([key, rate]) => ({ key, rate })).sort((a, b) => a.key.localeCompare(b.key)),
    totalDecisions: decisions.length,
  };
}
