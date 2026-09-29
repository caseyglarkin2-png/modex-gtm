/**
 * THE APPROACH, decided in ONE place (2026-09-29). The account brief's motion, the cohort opportunity cards and
 * the six-line brief all call this, so they can never give opposite advice for the same account and person.
 *
 * Gates first, then the strongest honest way in:
 *   IN_DEAL           an open HubSpot deal: work it from the deal, never cold
 *   NO_GOOD_MOTION    "do not contact yet" is a first-class answer: the deal state unknown, the buyer said no or
 *                     not now, the story contradicted, a first touch already out, nobody reachable, nothing to say
 *   FOLLOW_UP         a live conversation that is not a no
 *   FACT_LED          a verified fact; a relationship is an optional opener, never the reason
 *   REFERRAL_LED      an introduction, no verified fact: ask for perspective; GAP drafts nothing
 *   RELATIONSHIP_LED  real relationship context (met, or a relational source), no verified fact: the same
 * It advises; every send still runs its own gates at the click.
 */
import { traitsOf } from '../intake/traits';

export type ApproachKind = 'IN_DEAL' | 'NO_GOOD_MOTION' | 'FOLLOW_UP' | 'FACT_LED' | 'REFERRAL_LED' | 'RELATIONSHIP_LED';

/** Conversation answers that mean "no new outreach" (the buyer said no, not now, or stop). */
export const STOP_CLASSES: ReadonlySet<string> = new Set(['do_not_contact', 'meeting_declined', 'problem_rejected', 'not_priority']);

export interface ApproachInput {
  deal: 'ACTIVE' | 'CLEAR' | 'UNKNOWN' | 'NOT_READ';
  /** The buyer contradicted the current story (an objection BID on the thesis). */
  contradicted: boolean;
  conversation: { who: string; responseClass: string; at: string } | null;
  /** A first touch holds the account (motion/account-motion.ts in_motion headline), else null. */
  touchHold: string | null;
  verifiedFact: boolean;
  /** Someone GAP could reach (not do-not-contact, has an address). */
  reachable: boolean;
  /** How Casey knows them (the strongest work source), if at all. */
  source: { sourceType: string; context: string | null; name: string } | null;
}

export interface Approach {
  kind: ApproachKind;
  why: string;
}

const cls = (c: string) => c.replace(/_/g, ' ');

export function decideApproach(x: ApproachInput): Approach {
  if (x.deal === 'ACTIVE') return { kind: 'IN_DEAL', why: 'An open HubSpot deal: work it from the deal, never cold.' };
  if (x.deal === 'UNKNOWN') return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: the HubSpot deal state could not be read.' };
  if (x.deal === 'NOT_READ') return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: the HubSpot deal state was not read here.' };
  if (x.conversation && STOP_CLASSES.has(x.conversation.responseClass)) return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.conversation.who} answered "${cls(x.conversation.responseClass)}" (${x.conversation.at.slice(0, 10)}). No new outreach; learn from that conversation.` };
  if (x.contradicted) return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: the buyer contradicted the current story. Learn what is true first.' };
  if (x.conversation) return { kind: 'FOLLOW_UP', why: `A live conversation with ${x.conversation.who} (${cls(x.conversation.responseClass)}, ${x.conversation.at.slice(0, 10)}): continue that thread, never a cold first touch.` };
  if (x.touchHold) return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.touchHold}` };
  if (!x.reachable) return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: nobody reachable here (do not contact, or no email).' };
  const t = x.source ? traitsOf(x.source.sourceType) : null;
  const known = x.source && t && (t.engaged || t.relational) ? x.source.context ?? x.source.name : null;
  if (x.verifiedFact) return { kind: 'FACT_LED', why: `A verified fact to open with.${known ? ` Optional opener: ${known}.` : ''}` };
  if (x.source && t?.approach === 'referral_led') return { kind: 'REFERRAL_LED', why: `${known}: name the introduction and ask for their perspective. No problem is claimed; GAP drafts nothing without a verified fact.` };
  if (known) return { kind: 'RELATIONSHIP_LED', why: `${known}: ask for their perspective. No problem is claimed; GAP drafts nothing without a verified fact.` };
  return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: no verified fact and no relationship to open with.' };
}
