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

import { ROUTING_ACTIONS, type HumanAction, type RoutingAction } from '../taxonomy';

/**
 * Each human action maps to the routing action(s) it counts as agreeing
 * with; a routing action reached through no listed human action, or a human
 * action that names a different routing action, is a disagreement.
 *
 *   enrolled_by_hand    -> enroll_gap_sequence (the operator did what the router said)
 *   called              -> call_now
 *   emailed             -> one_off_email
 *   dismissed           -> do_not_contact, nurture (the operator agreed nothing should go out now; kept for historical rows)
 *   deferred            -> nurture (the operator agreed to hold, on the router's own "not yet" action)
 *   researched          -> research_required
 *   approved_hypothesis -> approve_hypothesis
 *   linkedin_messaged   -> linkedin_manual_task
 *   do_not_contact      -> do_not_contact
 *
 * Before the dogfood fix (2026-09-25), research_required, approve_hypothesis
 * and linkedin_manual_task had NO human action that could ever agree with
 * them -- a structural gap in the closed vocabulary (HUMAN_ACTIONS,
 * taxonomy.ts), not a bug in this map. `researched`, `approved_hypothesis`
 * and `linkedin_messaged` close it. The invariant this file guarantees (see
 * `agreement.test.ts`): every ROUTING_ACTIONS member has at least one
 * HumanAction key whose list includes it.
 */
export const HUMAN_ACTION_AGREEMENT: Readonly<Record<HumanAction, readonly RoutingAction[]>> = {
  enrolled_by_hand: ['enroll_gap_sequence'],
  called: ['call_now'],
  emailed: ['one_off_email'],
  dismissed: ['do_not_contact', 'nurture'],
  deferred: ['nurture'],
  researched: ['research_required'],
  approved_hypothesis: ['approve_hypothesis'],
  linkedin_messaged: ['linkedin_manual_task'],
  do_not_contact: ['do_not_contact'],
};

/**
 * The ONE human action that means "I actually did what GAP recommended,"
 * per routing action -- what "I did this" writes. Distinct from
 * HUMAN_ACTION_AGREEMENT, which is broader (e.g. `dismissed` also agrees
 * with `do_not_contact` for historical rows) and answers a different
 * question ("does this count as agreement") than this one ("what is THE
 * exact matching action").
 */
export const RECOMMENDED_HUMAN_ACTION: Readonly<Record<RoutingAction, HumanAction>> = {
  research_required: 'researched',
  approve_hypothesis: 'approved_hypothesis',
  call_now: 'called',
  enroll_gap_sequence: 'enrolled_by_hand',
  one_off_email: 'emailed',
  linkedin_manual_task: 'linkedin_messaged',
  nurture: 'deferred',
  do_not_contact: 'do_not_contact',
};

export function agrees(routingAction: RoutingAction, humanAction: HumanAction): boolean {
  return HUMAN_ACTION_AGREEMENT[humanAction].includes(routingAction);
}

/**
 * The invariant this module guarantees: no RoutingAction may be structurally
 * incapable of agreement. Exported so a test can assert it directly rather
 * than trusting the map's authors; also cheap enough to call once at import
 * time in dev if that is ever wanted, though nothing here does that today.
 */
export function everyRoutingActionHasAnAgreeingHumanAction(): boolean {
  const covered = new Set(Object.values(HUMAN_ACTION_AGREEMENT).flat());
  return ROUTING_ACTIONS.every((action) => covered.has(action));
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
