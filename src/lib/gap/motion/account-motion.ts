/**
 * ACCOUNT MOTION v0 (Phase 2 C2-C4, 2026-09-28): who first, who next, and
 * when do we stop, for one account. One cold EMAIL motion at a time.
 *
 * Pure over what the cockpit already loaded: the account's current cards,
 * Casey's recorded primary/next choice, the account's recent GAP first
 * touches, and any account reply still waiting for triage.
 *
 *   paused_reply  someone at the account wrote in and nobody has triaged it:
 *                 no cold email to anyone there (the send gate refuses too)
 *   in_motion     someone at the account got a GAP first touch in the last
 *                 MOTION_UNLOCK_BUSINESS_DAYS business days: that person is
 *                 the motion; the next person unlocks after that many business
 *                 days without a response, or at once if the address failed
 *   ready         no motion yet: ONE primary is READY (Casey's choice, else a
 *                 suggestion from visible factors); the rest wait as NEXT
 *   idle          nobody to email at the account
 *
 * Suggestion factors are shown, never hidden behind a score: seniority from
 * the title, role relevance to the thesis (persona key), contactability.
 * Calls and LinkedIn are human judgment: this only governs EMAIL cards.
 */
import { addBusinessDays } from '../sequence/business-days';

export const MOTION_UNLOCK_BUSINESS_DAYS = 5;
export const ACCOUNT_MOTION = 'account.motion' as const;
export const EMAIL_ACTIONS: ReadonlySet<string> = new Set(['enroll_gap_sequence', 'one_off_email']);

export interface MotionCard {
  id: string;
  action: string;
  account: { name: string };
  persona: { id: number | null; displayName: string | null; title: string | null; email: string | null; personaKey: string | null; phone?: string | null };
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

export type MotionState = 'paused_reply' | 'in_motion' | 'ready' | 'idle';

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

/** Seniority from the title words (5 exec .. 1 other). */
export function titleSeniority(title: string | null | undefined): number {
  const t = String(title ?? '').toLowerCase();
  if (/\bchief\b|\bc[a-z]?o\b|\bcsco\b|president/.test(t)) return 5;
  if (/\b(svp|evp|avp|vp)\b|vice president/.test(t)) return 4;
  if (/director|\bhead\b/.test(t)) return 3;
  if (/manager|lead\b/.test(t)) return 2;
  return 1;
}

const SENIORITY_WORD: Record<number, string> = { 5: 'executive', 4: 'VP', 3: 'director', 2: 'manager', 1: 'individual contributor' };

/** Ranking for a suggestion, with the factors that produced it (shown to Casey). */
export function rankCandidates(cards: readonly MotionCard[], thesisKeys: ReadonlySet<string>): Array<{ card: MotionCard; factors: string[]; key: number[] }> {
  return cards
    .map((card) => {
      const sen = titleSeniority(card.persona.title);
      const relevant = card.persona.personaKey ? thesisKeys.has(card.persona.personaKey) : false;
      const reachable = (card.persona.email ? 1 : 0) + (card.persona.phone ? 1 : 0);
      const factors = [
        `${SENIORITY_WORD[sen]}${card.persona.title ? ` (${card.persona.title})` : ''}`,
        relevant ? `matches the thesis role (${String(card.persona.personaKey).replace(/_/g, ' ')})` : 'outside the thesis role',
        reachable === 2 ? 'email and phone' : card.persona.email ? 'email only' : 'no email',
      ];
      // Relevance first (the right function), then seniority, then reachability, then name.
      return { card, factors, key: [relevant ? 1 : 0, sen, reachable] };
    })
    .sort((x, y) => y.key[0] - x.key[0] || y.key[1] - x.key[1] || y.key[2] - x.key[2] || String(x.card.persona.displayName ?? '').localeCompare(String(y.card.persona.displayName ?? '')) || x.card.id.localeCompare(y.card.id));
}

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
  now: Date;
}): AccountMotion {
  const { accountName, readyEmailCards, choice, now } = input;
  const cards = readyEmailCards.filter((c) => typeof c.persona.id === 'number');
  // Relevance is to the THESIS role (the hypothesis persona key), never to the candidates' own roles.
  const thesisKeys = new Set(cards.map((c) => c.hypothesis?.persona).filter((k): k is string => !!k));
  const ranked = rankCandidates(cards, thesisKeys);
  const allIds = cards.map((c) => c.id);

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
    const nextPick = (choice?.nextPersonaId ? waiting.find((r) => r.card.persona.id === choice.nextPersonaId) : null) ?? waiting[0] ?? null;
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
                : `after ${day(unlockAt)} with no response (${MOTION_UNLOCK_BUSINESS_DAYS} business days), or at once if ${owner ? nameOf(owner) : live.recipient}'s address fails`,
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
    // Unlock window passed with no response: the next person becomes the primary.
    if (nextPick) {
      return {
        accountName,
        state: 'ready',
        primary: { ...person(nextPick.card, [...nextPick.factors, `unlocked: no response since ${live.sentAt.slice(0, 10)}`]), chosen: choice?.nextPersonaId === nextPick.card.persona.id },
        next: null,
        alsoWaiting: waiting.filter((r) => r !== nextPick).map((x) => person(x.card, x.factors)),
        heldCardIds: allIds.filter((id) => id !== nextPick.card.id),
        headline: `Next person unlocked: no response to the first touch on ${live.sentAt.slice(0, 10)}.`,
      };
    }
  }

  if (ranked.length === 0) return { accountName, state: 'idle', primary: null, next: null, alsoWaiting: [], heldCardIds: [], headline: 'Nobody to email here right now.' };

  const chosen = choice ? ranked.find((r) => r.card.persona.id === choice.primaryPersonaId) ?? null : null;
  const primary = chosen ?? ranked[0];
  const rest = ranked.filter((r) => r !== primary);
  const nextPick = (choice?.nextPersonaId ? rest.find((r) => r.card.persona.id === choice.nextPersonaId) : null) ?? rest[0] ?? null;
  const released = input.firstTouches.some((t) => t.released);
  return {
    accountName,
    state: 'ready',
    primary: { ...person(primary.card, primary.factors), chosen: !!chosen },
    next: nextPick ? { ...person(nextPick.card, nextPick.factors), unlock: `after ${MOTION_UNLOCK_BUSINESS_DAYS} business days with no response to ${nameOf(primary.card)}, or at once if that address fails`, unlockAt: null } : null,
    alsoWaiting: rest.filter((r) => r !== nextPick).map((x) => person(x.card, x.factors)),
    heldCardIds: allIds.filter((id) => id !== primary.card.id),
    headline: chosen ? `Primary: ${nameOf(primary.card)} (your choice).` : `Suggested primary: ${nameOf(primary.card)}.${released ? ' An earlier address failed, so the motion moved on.' : ''}`,
  };
}
