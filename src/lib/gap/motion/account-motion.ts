/**
 * ACCOUNT MOTION v0 (Phase 2 C2-C4, 2026-09-28): who first, who next, and
 * when do we stop, for one account. One cold EMAIL motion at a time.
 *
 * Pure over what the cockpit already loaded: the account's current cards,
 * Casey's recorded primary/next choice, the account's recent GAP first
 * touches, and any account reply still waiting for triage.
 *
 *   in_conversation  a buyer at the account ANSWERED (a confirmed disposition,
 *                 final review P1): no cold first touch to anyone else there;
 *                 Casey works it from the conversation
 *   paused_reply  someone at the account wrote in and nobody has triaged it:
 *                 no cold email to anyone there (the send gate refuses too)
 *   in_motion     someone at the account got a GAP first touch in the last
 *                 MOTION_UNLOCK_BUSINESS_DAYS business days: that person is
 *                 the motion; the next person unlocks after that many business
 *                 days without a response, or at once if the address failed
 *   ready         no motion yet: ONE primary is READY (Casey's choice, else a
 *                 suggestion from visible factors); the rest wait as NEXT
 *   needs_owner   cards exist, but nobody on them is a COLD WHO (a direct freight operator; seller correction
 *                 2026-10-04): no suggested primary, every card held; the sponsor is named and Casey's explicit
 *                 choice still makes anyone primary
 *   idle          nobody to email at the account
 *
 * Suggestion factors are shown, never hidden behind a score: seniority from
 * the title, role relevance to the thesis (persona key), contactability.
 * Calls and LinkedIn are human judgment: this only governs EMAIL cards.
 */
import { addBusinessDays } from '../sequence/business-days';
import { LANE_LABEL, isColdWho, isSponsor, priorKey, readPerson, titleSeniority, geoPhrase, type PersonRead } from '../people/person-prior';

export const MOTION_UNLOCK_BUSINESS_DAYS = 5;
export const ACCOUNT_MOTION = 'account.motion' as const;
export const EMAIL_ACTIONS: ReadonlySet<string> = new Set(['enroll_gap_sequence', 'one_off_email']);

export interface MotionCard {
  id: string;
  action: string;
  account: { name: string };
  /** `location`: the person's own HubSpot city / state / country when the cockpit could read it (US-first, review S3). */
  persona: { id: number | null; displayName: string | null; title: string | null; email: string | null; personaKey: string | null; phone?: string | null; location?: string | null };
  /** `persona`: the THESIS role (the hypothesis persona key), what "relevant" is measured against. */
  hypothesis: { id: string; status: string; family?: string; persona?: string | null } | null;
  createdAt: Date | string;
}

export interface MotionChoice {
  primaryPersonaId: number;
  nextPersonaId: number | null;
  by: string;
  at: string;
}

export interface FirstTouch {
  personaId: number | null;
  recipient: string;
  sentAt: string;
  /** The address failed afterwards (hard bounce, invalid, DNC): the motion released. */
  released: boolean;
  /** A first-touch Gmail draft not yet sent or deleted: it holds the account until it is (review C P1). */
  outstanding?: boolean;
}

export interface MotionPerson {
  personaId: number;
  name: string;
  title: string | null;
  cardId: string | null;
  factors: string[];
}

export type MotionState = 'in_conversation' | 'paused_reply' | 'in_motion' | 'ready' | 'needs_owner' | 'idle';

export interface AccountMotion {
  accountName: string;
  state: MotionState;
  primary: (MotionPerson & { chosen: boolean }) | null;
  next: (MotionPerson & { unlock: string; unlockAt: string | null }) | null;
  /** Everyone else waiting at the account (review C P1: no held person is ever invisible). */
  alsoWaiting: MotionPerson[];
  /** Email cards that are NOT the account's motion right now: never READY. */
  heldCardIds: string[];
  /** One plain line for the seller. */
  headline: string;
  pausedBy?: { from: string; receivedAt: string };
}

export { titleSeniority } from '../people/person-prior';

const SENIORITY_WORD: Record<number, string> = { 5: 'executive', 4: 'VP', 3: 'director', 2: 'manager', 1: 'individual contributor' };

/** Ranking for a suggestion, with the factors that produced it (shown to Casey). */
export function rankCandidates(cards: readonly MotionCard[], thesisKeys: ReadonlySet<string>): Array<{ card: MotionCard; factors: string[]; key: number[]; read: PersonRead }> {
  return cards
    .map((card) => {
      const sen = titleSeniority(card.persona.title);
      const relevant = card.persona.personaKey ? thesisKeys.has(card.persona.personaKey) : false;
      const reachable = (card.persona.email ? 1 : 0) + (card.persona.phone ? 1 : 0);
      // THE PERSON PRIOR (people/person-prior.ts), the same order the account brief's WHO uses: operating lane, then
      // US / North America remit, then network scope; then the thesis role, seniority and reachability.
      const read = readPerson(card.persona.title, { location: card.persona.location ?? null });
      const factors = [
        `${LANE_LABEL[read.lane]}${card.persona.title ? ` (${card.persona.title})` : ''}`,
        read.region === 'US_NA' ? geoPhrase(read) : read.regionWhy,
        SENIORITY_WORD[sen],
        relevant ? `matches the thesis role (${String(card.persona.personaKey).replace(/_/g, ' ')})` : 'outside the thesis role',
        reachable === 2 ? 'email and phone' : card.persona.email ? 'email only' : 'no email',
      ];
      return { card, factors, key: [...priorKey(read), relevant ? 1 : 0, sen, reachable], read };
    })
    .sort((x, y) => x.key.reduce((d, _, k) => d || y.key[k] - x.key[k], 0) || String(x.card.persona.displayName ?? '').localeCompare(String(y.card.persona.displayName ?? '')) || x.card.id.localeCompare(y.card.id));
}

/**
 * No cold WHO among the cards (seller correction, 2026-10-04): the cockpit suggests nobody. Every card is held, the
 * best sponsor is named, and Casey's explicit choice (Make X the primary) is the only way one of them leads.
 */
function needsOwner(accountName: string, ranked: ReturnType<typeof rankCandidates>, allIds: string[]): AccountMotion {
  // The sponsor by the one sponsor rule (the brief uses it too), never simply the first card (review S2). The cockpit
  // sees only GAP contacts with a card, so it points at the buyer map rather than claiming nobody exists.
  const sponsor = ranked.find((r) => isSponsor(r.read, r.card.persona.title)) ?? null;
  return {
    accountName,
    state: 'needs_owner',
    primary: null,
    next: null,
    alsoWaiting: ranked.map((x) => person(x.card, x.factors)),
    heldCardIds: allIds,
    headline: `No ready card is for a direct transportation operator: check the BRIEF buyer map (it may name one in HubSpot to add as a GAP contact), else research.${sponsor ? ` Sponsor on record: ${nameOf(sponsor.card)}${sponsor.card.persona.title ? ` (${sponsor.card.persona.title})` : ''}.` : ''} A card leads only by your choice.`,
  };
}

/** A next person who is not a cold WHO never unlocks on their own: the line says so (review N1). */
const byChoiceOnly = (r: { read: PersonRead }, chosen: boolean) => (chosen || isColdWho(r.read) ? '' : ', then only by your choice (not a direct transportation operator)');

const nameOf = (c: MotionCard) => c.persona.displayName?.trim() || c.persona.email || `person ${c.persona.id}`;
const person = (c: MotionCard, factors: string[]): MotionPerson => ({ personaId: c.persona.id as number, name: nameOf(c), title: c.persona.title, cardId: c.id, factors });
const day = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/**
 * One account's motion. `readyEmailCards` are the account's email cards that
 * would otherwise be READY (the lane logic already applied); `firstTouches`
 * are GAP first touches at the account within the unlock window.
 */
export function computeAccountMotion(input: {
  accountName: string;
  readyEmailCards: readonly MotionCard[];
  choice: MotionChoice | null;
  firstTouches: readonly FirstTouch[];
  replyHold: { from: string; receivedAt: string } | null;
  /** The newest buyer answer at the account (motion/load.ts loadAccountConversations). */
  conversation?: { who: string; responseClass: string; at: string } | null;
  now: Date;
}): AccountMotion {
  const { accountName, readyEmailCards, choice, now } = input;
  const cards = readyEmailCards.filter((c) => typeof c.persona.id === 'number');
  // Relevance is to the THESIS role (the hypothesis persona key), never to the candidates' own roles.
  const thesisKeys = new Set(cards.map((c) => c.hypothesis?.persona).filter((k): k is string => !!k));
  const ranked = rankCandidates(cards, thesisKeys);
  const allIds = cards.map((c) => c.id);

  if (input.conversation) {
    const c = input.conversation;
    return {
      accountName,
      state: 'in_conversation',
      primary: null,
      next: null,
      alsoWaiting: ranked.map((x) => person(x.card, x.factors)),
      heldCardIds: allIds,
      headline: `In a conversation: ${c.who} answered (${c.responseClass.replace(/_/g, ' ')}, ${c.at.slice(0, 10)}). No cold email to anyone else at ${accountName}; work it from that conversation.`,
    };
  }

  if (input.replyHold) {
    const r = input.replyHold;
    return {
      accountName,
      state: 'paused_reply',
      primary: null,
      next: ranked[0] ? { ...person(ranked[0].card, ranked[0].factors), unlock: `after ${r.from}'s reply is triaged in Replies`, unlockAt: null } : null,
      alsoWaiting: ranked.slice(1).map((x) => person(x.card, x.factors)),
      heldCardIds: allIds,
      headline: `Paused: ${r.from} at ${accountName} wrote in on ${r.receivedAt.slice(0, 10)}. Triage it in Replies before anyone there gets a cold email.`,
      pausedBy: r,
    };
  }

  // The newest live first touch at the account owns the motion.
  // An outstanding first-touch draft outranks sent touches: it holds until it is sent or deleted.
  const live = input.firstTouches.filter((t) => !t.released).sort((a, b) => Number(!!b.outstanding) - Number(!!a.outstanding) || b.sentAt.localeCompare(a.sentAt))[0];
  if (live) {
    const unlockAt = live.outstanding ? new Date(8.64e15) : addBusinessDays(new Date(live.sentAt), MOTION_UNLOCK_BUSINESS_DAYS);
    const owner = cards.find((c) => c.persona.id === live.personaId) ?? null;
    const waiting = ranked.filter((r) => r.card.persona.id !== live.personaId);
    // Casey's choice of who comes next: the recorded next person, or (from the needs_owner panel, review S1) the person
    // chosen as primary when they are still waiting.
    const chosenNext = choice ? waiting.find((r) => r.card.persona.id === choice.nextPersonaId) ?? waiting.find((r) => r.card.persona.id === choice.primaryPersonaId) ?? null : null;
    const nextPick = chosenNext ?? waiting[0] ?? null;
    if (now.getTime() < unlockAt.getTime()) {
      return {
        accountName,
        state: 'in_motion',
        primary: owner ? { ...person(owner, ['first touch sent ' + live.sentAt.slice(0, 10)]), chosen: true } : { personaId: live.personaId ?? -1, name: live.recipient, title: null, cardId: null, factors: ['first touch sent ' + live.sentAt.slice(0, 10)], chosen: true },
        next: nextPick
          ? {
              ...person(nextPick.card, nextPick.factors),
              unlock: live.outstanding
                ? `after the outstanding first-touch draft to ${owner ? nameOf(owner) : live.recipient} is sent (then ${MOTION_UNLOCK_BUSINESS_DAYS} business days) or deleted`
                : `after ${day(unlockAt)} with no response (${MOTION_UNLOCK_BUSINESS_DAYS} business days), or at once if ${owner ? nameOf(owner) : live.recipient}'s address fails${byChoiceOnly(nextPick, !!chosenNext)}`,
              unlockAt: live.outstanding ? null : unlockAt.toISOString(),
            }
          : null,
        alsoWaiting: waiting.filter((r) => r !== nextPick).map((x) => person(x.card, x.factors)),
        heldCardIds: allIds,
        headline: live.outstanding
          ? `In motion: a first-touch draft to ${owner ? nameOf(owner) : live.recipient} is outstanding. One cold email motion at a time.`
          : `In motion: ${owner ? nameOf(owner) : live.recipient} got a first touch on ${live.sentAt.slice(0, 10)}. One cold email motion at a time.`,
      };
    }
    // Unlock window passed with no response: the next person becomes the primary, if they are a cold WHO or chosen.
    if (nextPick && !isColdWho(nextPick.read) && !chosenNext) return needsOwner(accountName, waiting, allIds);
    if (nextPick) {
      return {
        accountName,
        state: 'ready',
        primary: { ...person(nextPick.card, [...nextPick.factors, `unlocked: no response since ${live.sentAt.slice(0, 10)}`]), chosen: !!chosenNext },
        next: null,
        alsoWaiting: waiting.filter((r) => r !== nextPick).map((x) => person(x.card, x.factors)),
        heldCardIds: allIds.filter((id) => id !== nextPick.card.id),
        headline: `Next person unlocked: no response to the first touch on ${live.sentAt.slice(0, 10)}.`,
      };
    }
  }

  if (ranked.length === 0) return { accountName, state: 'idle', primary: null, next: null, alsoWaiting: [], heldCardIds: [], headline: 'Nobody to email here right now.' };

  const chosen = choice ? ranked.find((r) => r.card.persona.id === choice.primaryPersonaId) ?? null : null;
  // The cockpit SUGGESTS only a cold WHO; a sponsor or adjacent role leads only by Casey's choice.
  if (!chosen && !isColdWho(ranked[0].read)) return needsOwner(accountName, ranked, allIds);
  const primary = chosen ?? ranked[0];
  const rest = ranked.filter((r) => r !== primary);
  const nextPick = (choice?.nextPersonaId ? rest.find((r) => r.card.persona.id === choice.nextPersonaId) : null) ?? rest[0] ?? null;
  const released = input.firstTouches.some((t) => t.released);
  return {
    accountName,
    state: 'ready',
    primary: { ...person(primary.card, primary.factors), chosen: !!chosen },
    next: nextPick ? { ...person(nextPick.card, nextPick.factors), unlock: `after ${MOTION_UNLOCK_BUSINESS_DAYS} business days with no response to ${nameOf(primary.card)}, or at once if that address fails${byChoiceOnly(nextPick, choice?.nextPersonaId === nextPick.card.persona.id)}`, unlockAt: null } : null,
    alsoWaiting: rest.filter((r) => r !== nextPick).map((x) => person(x.card, x.factors)),
    heldCardIds: allIds.filter((id) => id !== primary.card.id),
    headline: chosen ? `Primary: ${nameOf(primary.card)} (your choice).` : `Suggested primary: ${nameOf(primary.card)}.${released ? ' An earlier address failed, so the motion moved on.' : ''}`,
  };
}
