/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): routing recommendation
 * vs actual human action, over `RoutingDecision.action` (what the router
 * recommended) and `RoutingDecision.human_action` (what the operator actually
 * did, write-once, stamped by `recordHumanAction` in ./queue.ts).
 *
 * Red team T10 (2026-09-27): agreement is judged against EXECUTION, not
 * clicks, and nothing leaves the denominator by going quiet.
 *
 *   - An email-type human action (emailed, enrolled_by_hand) agrees only when
 *     the send ledger proves an email went out for that card or person
 *     (executedEmail). A recorded click without a send is unverified:
 *     counted, never an agreement.
 *   - An executed email recommendation (a ledger send) agrees even with no
 *     button pressed: the send IS the action.
 *   - A card with no action and no execution is pending only while it is
 *     open (the newest card for the person, still fresh). Once superseded or
 *     stale it is unacted: counted, never an agreement, so no rate improves
 *     because unanswered cards expired.
 *
 * Agreement measures seller CONFORMITY with the router, not sales quality.
 * It is never, alone, permission for autonomous sending (automation/gates.ts
 * G1 also requires real sends and their outcomes).
 *
 * Pure: no Prisma, no fetch, no clock.
 */

import { ROUTING_ACTIONS, type HumanAction, type RoutingAction } from '../taxonomy';
import { honestRate, type HonestRate } from '../learning/stats';

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
  /** Every counted non-agreement: a different action, an unverified email click, or an unacted card. */
  disagreements: number;
  /** An email-type action recorded with no send in the ledger. Included in disagreements. */
  unverified: number;
  /** A superseded or stale card nobody acted on. Included in disagreements. */
  unacted: number;
  /** agreements / n. Null when there is nothing comparable. Prefer `honest` for display. */
  rate: number | null;
  n: number;
  /** The same proportion as an HonestRate (suppressed below RELIABLE_N, Wilson above). */
  honest: HonestRate;
}

export interface AgreementDecision {
  id: string;
  action: RoutingAction;
  ruleId: string;
  /** Null = no human action recorded. */
  humanAction: HumanAction | null;
  /** The send ledger proves an email went out for this card or this person after it. */
  executedEmail: boolean;
  /** The newest card for its person and still fresh: a missing action is pending, not unacted. */
  open: boolean;
}

export interface AgreementReport {
  overall: AgreementRate;
  byRuleId: Array<{ key: string; rate: AgreementRate }>;
  byAction: Array<{ key: RoutingAction; rate: AgreementRate }>;
  /** Total decisions handed in (for context; not a rate denominator). */
  totalDecisions: number;
  /** Open cards with no action yet: the only decisions left out of the rates. */
  pending: number;
}

/** Human actions that claim an email went out. */
export const EMAIL_HUMAN_ACTIONS: ReadonlySet<HumanAction> = new Set<HumanAction>(['emailed', 'enrolled_by_hand']);
/** Recommendations to email. */
export const EMAIL_ROUTING_ACTIONS: ReadonlySet<RoutingAction> = new Set<RoutingAction>(['enroll_gap_sequence', 'one_off_email']);

export type AgreementVerdict = 'agree' | 'disagree' | 'unverified' | 'unacted' | 'pending';

/** How one decision counts. Pure. */
export function verdictOf(d: AgreementDecision): AgreementVerdict {
  if (d.humanAction === null) {
    // The send is the action: an executed email recommendation agrees.
    if (d.executedEmail && EMAIL_ROUTING_ACTIONS.has(d.action)) return 'agree';
    return d.open ? 'pending' : 'unacted';
  }
  if (EMAIL_HUMAN_ACTIONS.has(d.humanAction)) {
    if (!d.executedEmail) return 'unverified';
    // A proven email on an email recommendation agrees (enroll and one-off both mean "email this person").
    return EMAIL_ROUTING_ACTIONS.has(d.action) ? 'agree' : 'disagree';
  }
  return agrees(d.action, d.humanAction) ? 'agree' : 'disagree';
}

interface Tally {
  agreements: number;
  disagreements: number;
  unverified: number;
  unacted: number;
}

function emptyTally(): Tally {
  return { agreements: 0, disagreements: 0, unverified: 0, unacted: 0 };
}

function finish(t: Tally): AgreementRate {
  const n = t.agreements + t.disagreements;
  return { ...t, n, rate: n > 0 ? t.agreements / n : null, honest: honestRate(t.agreements, n) };
}

function add(t: Tally, v: Exclude<AgreementVerdict, 'pending'>): void {
  if (v === 'agree') {
    t.agreements += 1;
    return;
  }
  t.disagreements += 1;
  if (v === 'unverified') t.unverified += 1;
  if (v === 'unacted') t.unacted += 1;
}

/**
 * Every decision counts except an OPEN card with no action yet. Silence on a
 * superseded or stale card is `unacted` (a non-agreement), never dropped.
 */
export function computeAgreement(decisions: readonly AgreementDecision[]): AgreementReport {
  const overall = emptyTally();
  const byRuleId = new Map<string, Tally>();
  const byAction = new Map<RoutingAction, Tally>();
  let pending = 0;

  for (const d of decisions) {
    const v = verdictOf(d);
    if (v === 'pending') {
      pending += 1;
      continue;
    }
    add(overall, v);
    const r = byRuleId.get(d.ruleId) ?? emptyTally();
    add(r, v);
    byRuleId.set(d.ruleId, r);
    const a = byAction.get(d.action) ?? emptyTally();
    add(a, v);
    byAction.set(d.action, a);
  }

  return {
    overall: finish(overall),
    byRuleId: [...byRuleId.entries()].map(([key, t]) => ({ key, rate: finish(t) })).sort((a, b) => a.key.localeCompare(b.key)),
    byAction: [...byAction.entries()].map(([key, t]) => ({ key, rate: finish(t) })).sort((a, b) => a.key.localeCompare(b.key)),
    totalDecisions: decisions.length,
    pending,
  };
}
