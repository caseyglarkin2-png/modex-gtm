/**
 * GAP cockpit: Casey's work, not the data model (first-principles pass
 * 2026-09-25; every lane lives on /gap since 2026-09-26). Five lanes, each a
 * count and a link to exactly that work, all on this page:
 *
 *   REVIEW     account theses and hypotheses waiting for his judgment
 *   RESEARCH   cards missing evidence or contact data
 *   READY      people to contact now (email, call, LinkedIn)
 *   FOLLOW UP  sent sequences whose next touch is due
 *   REPLIES    buyer replies waiting for his confirmation
 *
 * NEXT UP, shown when no lane is open, names the single best use of Casey's
 * next minute in operator priority (reply, follow up, ready, review,
 * research) with one button. It only points; it never acts.
 *
 * Pure presentational; the server page does the counting (sellerLaneOf, the
 * same function the lanes filter with) and picks the next item.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

export type CockpitLane = 'review' | 'research' | 'ready' | 'follow_up' | 'replies';

export interface GapCockpitData {
  review: number;
  research: number;
  ready: number;
  followUp: number;
  replies: { count: number; atLeast: boolean };
  /** The lane open below, if any. */
  active: CockpitLane | null;
}

export interface NextUpItem {
  lane: CockpitLane;
  title: string;
  detail: string;
  href: string;
}

function Tile({ href, label, value, hint, active }: { href: string; label: string; value: React.ReactNode; hint: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-testid={`cockpit-tile-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'flex min-w-0 flex-col justify-between rounded-md border bg-[var(--background)] p-3 transition-colors hover:bg-[var(--muted)] sm:p-4',
        active ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[var(--border)]',
      )}
    >
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 hidden text-xs text-[var(--muted-foreground)] sm:block">{hint}</p>
    </Link>
  );
}

export function GapCockpit({ data }: { data: GapCockpitData }) {
  return (
    <section data-testid="gap-cockpit" className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
      <Tile href="/gap?lane=review" label="Review" value={data.review} hint="Theses waiting for you" active={data.active === 'review'} />
      <Tile href="/gap?lane=research" label="Research" value={data.research} hint="Find evidence or contact data" active={data.active === 'research'} />
      <Tile href="/gap?lane=ready" label="Ready" value={data.ready} hint="Contact now" active={data.active === 'ready'} />
      <Tile href="/gap?lane=follow_up" label="Follow up" value={data.followUp} hint="Next touch due" active={data.active === 'follow_up'} />
      <Tile href="/gap?lane=replies" label="Replies" value={`${data.replies.count}${data.replies.atLeast ? '+' : ''}`} hint="Buyer replied" active={data.active === 'replies'} />
    </section>
  );
}

const LANE_LABEL: Record<CockpitLane, string> = {
  replies: 'Buyer replied',
  follow_up: 'Follow up due',
  ready: 'Ready to contact',
  review: 'Thesis to decide',
  research: 'Needs research',
};

export function NextUp({ items }: { items: NextUpItem[] }) {
  const [first, ...rest] = items;
  if (!first) {
    return (
      <section data-testid="next-up" className="rounded-md border border-[var(--border)] p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Next up</p>
        <p className="mt-1">Nothing needs you right now. Replies, follow ups and new theses show up here.</p>
      </section>
    );
  }
  return (
    <section data-testid="next-up" className="space-y-3 rounded-md border-2 border-[var(--primary)] p-4 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Next up · {LANE_LABEL[first.lane]}</p>
        <p className="mt-1 text-lg font-semibold" data-testid="next-up-title">{first.title}</p>
        <p className="text-[var(--muted-foreground)]">{first.detail}</p>
      </div>
      <Link href={first.href} data-testid="do-this-next" className="inline-flex rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90">
        Do this next
      </Link>
      {rest.length ? (
        <ul className="space-y-1 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted-foreground)]">
          {rest.map((i) => (
            <li key={`${i.lane}-${i.href}`}>
              Then:{' '}
              <Link href={i.href} className="underline">
                {i.title}
              </Link>{' '}
              ({LANE_LABEL[i.lane].toLowerCase()})
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Pure: NEXT UP in operator priority, one entry per lane that has work. */
export function pickNextUp(candidates: Partial<Record<CockpitLane, Omit<NextUpItem, 'lane'> | null>>): NextUpItem[] {
  const order: CockpitLane[] = ['replies', 'follow_up', 'ready', 'review', 'research'];
  return order.flatMap((lane) => {
    const c = candidates[lane];
    return c ? [{ lane, ...c }] : [];
  });
}
