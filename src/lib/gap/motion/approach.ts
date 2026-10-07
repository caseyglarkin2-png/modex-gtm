/**
 * THE APPROACH, decided in ONE place (2026-09-29). The account brief's motion, the cohort opportunity cards and
 * the six-line brief all call this, so they can never give opposite advice for the same account and person.
 *
 * Gates first, then the strongest honest way in:
 *   IN_DEAL           an open HubSpot deal: work it from the deal, never cold
 *   NO_GOOD_MOTION    "do not contact yet" is a first-class answer: the deal state unknown, the buyer said no or
 *                     not now, the story contradicted, a first touch already out, nobody reachable, nothing to say
 *   FOLLOW_UP         a live conversation that is not a no
 *   INTRO_ONLY        a restricted account (policy/restriction.ts): the named introduction is the only way in; it
 *                     beats a fact and fires with nobody reachable. GAP drafts nothing.
 *   FACT_LED          a verified fact; a relationship is an optional opener, never the reason
 *   REFERRAL_LED      an introduction, no verified fact: ask for perspective; GAP drafts nothing
 *   RELATIONSHIP_LED  real relationship context (met, or a relational source), no verified fact: the same
 * It advises; every send still runs its own gates at the click.
 */
import { traitsOf } from '../intake/traits';

export type ApproachKind = 'IN_DEAL' | 'NO_GOOD_MOTION' | 'FOLLOW_UP' | 'INTRO_ONLY' | 'FACT_LED' | 'REFERRAL_LED' | 'RELATIONSHIP_LED';

/** Conversation answers that mean "no new outreach" (the buyer said no, not now, or stop). */
export const STOP_CLASSES: ReadonlySet<string> = new Set(['do_not_contact', 'meeting_declined', 'problem_rejected', 'not_priority']);

export interface ApproachInput {
  deal: 'ACTIVE' | 'CLEAR' | 'UNKNOWN' | 'NOT_READ';
  /** R55: no open deal, but a customer (closed won) or parked (closed lost, nothing material since): never cold. */
  closure?: { kind: 'customer' | 'parked'; why: string } | null;
  /** Why the deal state is unknown, when the cause is specific (an account with no HubSpot company link). */
  dealUnknownWhy?: string;
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
  /** A thesis grounded in a live verified fact exists (red team: fact-led is problem-led, never fact-only). Default true. */
  groundedThesis?: boolean;
  /** Every live fact is sensitive (people harmed): the label, else null. */
  sensitiveOnly?: string | null;
  /** The approved thesis needs review before it is used. */
  staleThesis?: boolean;
  /**
   * YardFlow fit (entity/fit.ts): what the company is never decides this; its operations do. PARTNER and NOT_FIT
   * hold (never a direct-buyer pitch); DIRECT_BUYER, POTENTIAL_DIRECT_BUYER and UNKNOWN go on to the other rules.
   */
  fit?: { fit: string; why: string };
  /** RELATED ACCOUNT ACTIVITY in the corporate family (family/family.ts relatedHold), else null. */
  relatedHold?: string | null;
  /** A warm-intro-only restriction (policy/restriction.ts), else null. */
  restriction?: { introducer: string; route: string } | null;
}

export interface Approach {
  kind: ApproachKind;
  why: string;
}

const cls = (c: string) => c.replace(/_/g, ' ');

export function decideApproach(x: ApproachInput): Approach {
  if (x.deal === 'ACTIVE') return { kind: 'IN_DEAL', why: 'An open HubSpot deal: work it from the deal, never cold.' };
  if (x.deal === 'CLEAR' && x.closure) return { kind: 'NO_GOOD_MOTION', why: x.closure.why };
  // Not a fit (or a partner) is the answer before any HubSpot-link or deal-read hold: nothing to link for.
  if (x.fit?.fit === 'PARTNER') return { kind: 'NO_GOOD_MOTION', why: `Not a direct buyer: ${x.fit.why} Work it as a partnership, never with a buyer pitch.` };
  if (x.fit?.fit === 'NOT_FIT') return { kind: 'NO_GOOD_MOTION', why: `Not a YardFlow fit on the evidence: ${x.fit.why}` };
  if (x.deal === 'UNKNOWN') return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.dealUnknownWhy ?? 'the HubSpot deal state could not be read.'}` };
  if (x.deal === 'NOT_READ') return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: the HubSpot deal state was not read here.' };
  if (x.relatedHold) return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.relatedHold}` };
  if (x.conversation && STOP_CLASSES.has(x.conversation.responseClass)) return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.conversation.who} answered "${cls(x.conversation.responseClass)}" (${x.conversation.at.slice(0, 10)}). No new outreach; learn from that conversation.` };
  if (x.contradicted) return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: the buyer contradicted the current story. Learn what is true first.' };
  if (x.conversation) return { kind: 'FOLLOW_UP', why: `A live conversation with ${x.conversation.who} (${cls(x.conversation.responseClass)}, ${x.conversation.at.slice(0, 10)}): continue that thread, never a cold first touch.` };
  // After every gate that says "not now", before the touch hold and reachability: a restricted account has nobody
  // to reach cold by design, and the introduction beats a fact.
  if (x.restriction) return { kind: 'INTRO_ONLY', why: `Warm intro only: ask ${x.restriction.introducer} for the introduction to ${x.restriction.route}, as a way to learn their current state, never to forward a pitch. No cold outreach; GAP drafts nothing.` };
  if (x.touchHold) return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${x.touchHold}` };
  if (!x.reachable) return { kind: 'NO_GOOD_MOTION', why: 'Do not contact yet: nobody reachable here (do not contact, or no email).' };
  const t = x.source ? traitsOf(x.source.sourceType) : null;
  const known = x.source && t && (t.engaged || t.relational) ? x.source.context ?? x.source.name : null;
  // Fact-led means problem-led: a usable verified fact AND a thesis grounded in it that Casey can stand behind.
  const factBlock = !x.verifiedFact ? 'no verified fact' : x.sensitiveOnly ? `the only live fact is sensitive (${x.sensitiveOnly}) and is never the hook` : x.groundedThesis === false ? 'a verified fact, but no thesis grounded in it yet (draft and review one first)' : x.staleThesis ? 'the approved thesis needs review before it is used' : null;
  if (!factBlock) return { kind: 'FACT_LED', why: `A verified fact and a thesis grounded in it.${known ? ` Optional opener: ${known}.` : ''}` };
  const noDraft = 'No problem is claimed; GAP drafts nothing until a usable fact and a grounded thesis exist.';
  // A subscription or an inbound is context; with what the company operates unknown it is no reason to reach out.
  // Someone Casey met or was introduced to stays a way in (his own act put the account in scope).
  if (known && !t?.engaged && x.fit?.fit === 'UNKNOWN') return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: what this company operates is not established (fit unknown), and "${known}" is context, not a reason to reach out. Scout it first.` };
  if (x.source && t?.approach === 'referral_led') return { kind: 'REFERRAL_LED', why: `${known}: name the introduction and ask for their perspective. ${noDraft}` };
  if (known) return { kind: 'RELATIONSHIP_LED', why: `${known}: ask for their perspective${t?.opener === 'author' ? ` (you write ${x.source!.name}; never say they subscribe)` : ''}. ${noDraft}` };
  return { kind: 'NO_GOOD_MOTION', why: `Do not contact yet: ${factBlock}${x.verifiedFact ? '' : ' and no relationship to open with'}.` };
}
