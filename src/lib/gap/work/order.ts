/**
 * THE WORK ORDER (account-first UX, UX-09, Direction A change 3): the order Work held when it was opened, frozen in
 * the browser's session storage so "Next account" walks it even while the list behind it moves. Client-safe, pure
 * except the two storage helpers (which swallow every storage error: a private window renders the bar without a
 * position, never a crash). URL state carries the rest: `?from=work&i=n` on the account, `?filter=&q=&focus=` on Work.
 */
import { accountHref, accountSlug } from '../account-intel/href';

export const WORK_ORDER_KEY = 'gap.work.order';

export interface WorkOrder {
  at: string;
  filter: string;
  q: string;
  accounts: Array<{ name: string; slug: string }>;
}

export function saveWorkOrder(order: WorkOrder): void {
  try {
    window.sessionStorage.setItem(WORK_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable: the bar renders without a position */
  }
}

export function readWorkOrder(): WorkOrder | null {
  try {
    const raw = window.sessionStorage.getItem(WORK_ORDER_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<WorkOrder>;
    if (!Array.isArray(o.accounts)) return null;
    return { at: String(o.at ?? ''), filter: String(o.filter ?? ''), q: String(o.q ?? ''), accounts: o.accounts.filter((a): a is { name: string; slug: string } => !!a && typeof a.name === 'string').map((a) => ({ name: a.name, slug: a.slug || accountSlug(a.name) })) };
  } catch {
    return null;
  }
}

export interface DoneNextLinks {
  /** "Account 3 of 14" when the order holds this account at this index; null on a deep link or a stale order. */
  position: { n: number; of: number } | null;
  back: { name: string; href: string } | null;
  next: { name: string; href: string } | null;
  /** Back to Work restores the filter and the search and focuses this card. */
  backToWork: string;
}

/** The links the bar offers for the account at `slug`, opened as item `index` of the frozen order. */
export function doneNextLinks(order: WorkOrder | null, index: number | null, slug: string): DoneNextLinks {
  const p = new URLSearchParams();
  if (order?.filter && order.filter !== 'all') p.set('filter', order.filter);
  if (order?.q) p.set('q', order.q);
  // The index is a hint; the account itself is the key (the list behind the order may have moved).
  const byIndex = order && index !== null && index >= 0 && index < order.accounts.length && order.accounts[index].slug === slug ? index : null;
  const bySlug = order ? order.accounts.findIndex((a) => a.slug === slug) : -1;
  const hit = byIndex ?? (bySlug >= 0 ? bySlug : null);
  if (hit !== null) p.set('focus', slug);
  const backToWork = `/gap${p.toString() ? `?${p.toString()}` : ''}`;
  if (hit === null || !order) return { position: null, back: null, next: null, backToWork };
  const at = (i: number) => ({ name: order.accounts[i].name, href: `${accountHref(order.accounts[i].name)}?from=work&i=${i}` });
  return {
    position: { n: hit + 1, of: order.accounts.length },
    back: hit > 0 ? at(hit - 1) : null,
    next: hit + 1 < order.accounts.length ? at(hit + 1) : null,
    backToWork,
  };
}
