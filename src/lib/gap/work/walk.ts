/**
 * THE WALK (the walk fix, Casey, 2026-10-10: "yes, change the command. optimize!"). Pure and client-safe (type imports
 * only): the order START and NEXT hand the day's plan items to the seller, what they leave out, and the day's
 * new-conversation count. Shared by the walk (work/assignment.ts nextAssignableItem) and the briefing
 * (work/briefing.ts), so the briefing's "Begin with" pointer is the item START sends.
 *
 * The adversarial audit of his October 10 morning: START and NEXT handed him seven deal-hygiene items ("Confirm the
 * real date") before anything new, and the briefing never said that 0 of 14 items were new conversations.
 *
 *   the walk order      1 replies to answer (kind reply)
 *                       2 commitments due (commitment, meeting, follow_up, and a deal item with its next step or a
 *                         due deal step)
 *                       3 ready first touches (ready)
 *                       4 review items (review)
 *                       5 admin (an opt-out to record, an old reply to triage)
 *                       inside a group, the plan's own order (Work's ranking)
 *   left out            deal hygiene: a deal item whose only move is hygiene (no next step, no due commitment; a
 *                       stalled deal's "Confirm the real date"). It stays in the plan, on Work and in the briefing's
 *                       one line ("Deals, in one line"); ITEM n still opens it by its number.
 *
 * The plan's numbering and order are unchanged (the digest, ITEM n and the refresh read them); only the walk reorders.
 * Pinned by tests/unit/gap/walk-order.test.ts.
 */
import type { PlanItem } from './plan';

type WalkItem = Pick<PlanItem, 'kind' | 'stateKind' | 'title' | 'rank'> & { refs?: PlanItem['refs'] };

/** The briefing's one-line deals: a deal item whose title is not its next step (the shape the briefing has always used). */
export function isDealHygiene(it: Pick<PlanItem, 'kind' | 'stateKind' | 'title'>): boolean {
  return it.kind === 'deal' && it.stateKind === 'in_deal' && !/^Next step/i.test(it.title);
}

/** Left out of the walk: deal hygiene that is not a due commitment (a due deal step is a commitment due, walked). */
export function walkSkips(it: Pick<PlanItem, 'kind' | 'stateKind' | 'title'> & { refs?: PlanItem['refs'] }): boolean {
  return isDealHygiene(it) && !it.refs?.commitmentId;
}

/** The walk's groups by plan item kind; anything else walks last. */
export const WALK_GROUP: Readonly<Partial<Record<PlanItem['kind'], number>>> = { reply: 0, commitment: 1, meeting: 1, follow_up: 1, deal: 1, ready: 2, review: 3, admin: 4 };

/** A held item (the prepared email names another person; "Held: ..." on the plan): START records the hold and walks past it, so the briefing never says "Begin with" it. */
export const isHeld = (it: Pick<PlanItem, 'title'> & { hold?: PlanItem['hold'] }): boolean => !!it.hold || /^Held:/.test(it.title);

/** The item the briefing points at: the first walked item that is not held. */
export function walkBegins<T extends WalkItem & { hold?: PlanItem['hold'] }>(items: readonly T[]): T | null {
  return walkOrder(items).find((it) => !isHeld(it)) ?? null;
}

/** The plan's items in the order START and NEXT walk them, deal hygiene left out. Stable. */
export function walkOrder<T extends WalkItem>(items: readonly T[]): T[] {
  return items
    .map((it, n) => ({ it, n }))
    .filter(({ it }) => !walkSkips(it))
    .sort((a, b) => (WALK_GROUP[a.it.kind] ?? 5) - (WALK_GROUP[b.it.kind] ?? 5) || a.it.rank - b.it.rank || a.n - b.n)
    .map(({ it }) => it);
}

/** A new conversation on the plan: a first touch ready to go, or a buyer's reply to answer (the mandate's measure). */
export function isNewConversation(it: Pick<PlanItem, 'kind' | 'stateKind'>): boolean {
  return it.kind === 'ready' || (it.kind === 'reply' && it.stateKind === 'replied');
}

/**
 * The shortage, said plainly, when fewer than half the plan's items are new conversations ("New conversations today:
 * 0 of 14 items are a first touch or a reply from a buyer; the rest is deal work and admin."); null otherwise or on an
 * empty plan. The rest is named by what it is: deal work (deal, commitment, meeting), follow-ups, reviews, admin.
 */
export function newConversationLine(items: ReadonlyArray<Pick<PlanItem, 'kind' | 'stateKind'>>): string | null {
  const n = items.length;
  if (!n) return null;
  const fresh = items.filter(isNewConversation).length;
  if (fresh * 2 >= n) return null;
  const rest = items.filter((it) => !isNewConversation(it));
  const parts = [
    rest.some((it) => it.kind === 'deal' || it.kind === 'commitment' || it.kind === 'meeting') ? 'deal work' : null,
    rest.some((it) => it.kind === 'follow_up') ? 'follow-ups' : null,
    rest.some((it) => it.kind === 'review') ? 'reviews' : null,
    rest.some((it) => !['deal', 'commitment', 'meeting', 'follow_up', 'review'].includes(it.kind)) ? 'admin' : null,
  ].filter((x): x is string => !!x);
  const restWords = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0] ?? 'other work';
  return `New conversations today: ${fresh} of ${n} ${n === 1 ? 'item is' : 'items are'} a first touch or a reply from a buyer; the rest is ${restWords}.`;
}
