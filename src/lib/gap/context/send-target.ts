/**
 * THE READY FIRST-TOUCH CARD for one account (click test P0, 2026-10-03). The cockpit, NOW, the account card and
 * the draft preview named four different people at PepsiCo: each read a different candidate set (everyone on
 * record, GAP contacts, GAP contacts with a ready card, the thesis's routed draft). NOW now names the person the
 * cockpit would act on (its account motion's primary, ranked by the same person prior among READY cards) and links
 * straight to that card. Read-only; fails soft to null (NOW then keeps its own WHO).
 */
import { listQueue } from '../routing/queue';
import { packHref } from '../account-intel/href';
import { loadCockpitMotions } from '../motion/cockpit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ReadyTarget {
  name: string;
  title: string | null;
  /** R60: the card's pack page (the email, the call, Send from YardFlow), never the cockpit lane. */
  href: string;
  /** The cockpit's own line for the account ("Suggested primary: ..."). */
  headline: string;
}

/** The ready target from an already-loaded account motion (UX-03: the pursuit loader reads the queue once for both). */
export function readyTargetOf(mine: { state: string; primary: { name: string; title: string | null; cardId: string | null } | null; headline: string } | null | undefined): ReadyTarget | null {
  const p = mine?.state === 'ready' ? mine.primary : null;
  if (!p?.cardId) return null;
  return { name: p.name, title: p.title, href: packHref(p.cardId), headline: mine!.headline };
}

export async function loadReadyTarget(prisma: PrismaLike, accountName: string, now: Date, deps: { motions?: typeof loadCockpitMotions; list?: typeof listQueue } = {}): Promise<ReadyTarget | null> {
  try {
    const q = await (deps.list ?? listQueue)(prisma, { accountName, limit: 200 });
    if (!q.items.length) return null;
    const m = await (deps.motions ?? loadCockpitMotions)(prisma, q.items, now);
    return readyTargetOf(m.motions.find((x) => x.accountName === accountName));
  } catch {
    return null;
  }
}
