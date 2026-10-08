/**
 * THE ACTIONABLE RESULT (GAP OS execution recovery, R10, 2026-10-06): ONE shape every seller surface renders the
 * next move from, derived from the one pursuit state (state.ts) and its NEXT (next.ts). Work's card, the account
 * page's NEXT, the shell's last-known line and the spoken brief all read it, so identical underlying state yields
 * the identical intent, person, allowed action and blocker on every surface, and a held account can never become
 * sendable through a different view (`allowed` is null under every hold; the send gates re-run at the click anyway).
 *
 *   intent        what kind of move this is (reply, deal, hold, follow-up, warm touch, cold first touch, review a
 *                 proposal, research, nothing)
 *   person        the person the move is with, when one is named
 *   allowed       the one action the seller may take now (label + where it runs), or null
 *   blocker       what stops a cold touch, or null
 *   preparation   how far GAP has prepared the move: ready (a usable thesis), under_review (a proposal waits for
 *                 approval), incomplete (something the seller must set), none
 *   completion    the event that closes this item (so navigation is never mistaken for completion, R14)
 *
 * Pure; pinned by tests/unit/gap/actionable.test.ts.
 */
import type { PursuitState, PursuitStateKind } from './state';
import type { NextAction } from './next';

export type ActionIntent = 'reply' | 'opt_out' | 'deal' | 'hold' | 'follow_up' | 'in_motion' | 'warm_touch' | 'cold_first_touch' | 'review_proposal' | 'choose_person' | 'research' | 'none';
export type Preparation = 'ready' | 'under_review' | 'incomplete' | 'none';
export type CompletionEvent = 'reply_recorded' | 'opt_out_recorded' | 'deal_step_recorded' | 'hold_lifted' | 'touch_sent' | 'touch_logged' | 'proposal_decided' | 'person_chosen' | 'fact_verified' | 'none';

export interface ActionableResult {
  accountName: string;
  state: PursuitStateKind;
  stateLine: string;
  intent: ActionIntent;
  person: { name: string; title: string | null; personaId: number | null } | null;
  /** NEXT, as the page says it. */
  recommendation: string;
  allowed: { label: string; href: string } | null;
  blocker: string | null;
  preparation: Preparation;
  completion: CompletionEvent;
  /** The thesis the move runs on, when one is usable or under review. */
  hypothesisId: string | null;
}

const INTENT: Record<PursuitStateKind, ActionIntent> = {
  replied: 'reply',
  opted_out: 'opt_out',
  in_deal: 'deal',
  held: 'hold',
  follow_up_due: 'follow_up',
  in_motion: 'in_motion',
  ready: 'cold_first_touch',
  choose_person: 'choose_person',
  research: 'research',
  idle: 'none',
};

const COMPLETION: Record<ActionIntent, CompletionEvent> = {
  reply: 'reply_recorded',
  opt_out: 'opt_out_recorded',
  deal: 'deal_step_recorded',
  hold: 'hold_lifted',
  follow_up: 'touch_sent',
  in_motion: 'reply_recorded',
  warm_touch: 'touch_logged',
  cold_first_touch: 'touch_sent',
  review_proposal: 'proposal_decided',
  choose_person: 'person_chosen',
  research: 'fact_verified',
  none: 'none',
};

export function actionableFromPursuit(
  s: PursuitState,
  next: NextAction,
  opts: { hypothesisId: string | null; usableTheses: readonly string[]; pendingProposals?: number; incompleteProposals?: number },
): ActionableResult {
  let intent = INTENT[s.state];
  if (s.state === 'ready' && /^Relationship-led/.test(s.stateLine)) intent = 'warm_touch';
  const pending = opts.pendingProposals ?? 0;
  const incomplete = opts.incompleteProposals ?? 0;
  if (s.state === 'research' && pending > 0) intent = 'review_proposal';
  const usable = opts.usableTheses.length > 0;
  const preparation: Preparation = intent === 'cold_first_touch' ? (usable ? 'ready' : 'none') : intent === 'review_proposal' ? (incomplete > 0 ? 'incomplete' : 'under_review') : intent === 'warm_touch' || intent === 'follow_up' || intent === 'reply' || intent === 'opt_out' || intent === 'deal' ? 'ready' : 'none';
  // Under a reply, an opt-out, a deal or a hold nothing cold is allowed; the control is the one that records or works it.
  const allowed = next.control ? { label: next.control.label, href: next.control.href } : null;
  return {
    accountName: s.accountName,
    state: s.state,
    stateLine: s.stateLine,
    intent,
    person: s.person ? { name: s.person.name, title: s.person.title, personaId: s.person.personaId } : null,
    recommendation: next.text,
    allowed,
    blocker: s.blocker,
    preparation,
    completion: COMPLETION[intent],
    hypothesisId: opts.hypothesisId,
  };
}

/** The card words for an intent (Work and the shell say the same thing). */
export const INTENT_TEXT: Record<ActionIntent, string> = {
  reply: 'Someone replied',
  opt_out: 'Opted out',
  deal: 'In a deal',
  hold: 'Held',
  follow_up: 'Follow up due',
  in_motion: 'First touch in motion',
  warm_touch: 'Relationship-led',
  cold_first_touch: 'Ready for a first touch',
  review_proposal: 'A proposal waits for your review',
  choose_person: 'Choose who hears this first',
  research: 'Research',
  none: 'Nothing needs you',
};
