/**
 * GAP cockpit: Casey's work, not the data model (first-principles pass,
 * 2026-09-25). Five lanes, each a count and a link to exactly that work:
 *
 *   REVIEW     account theses and hypotheses waiting for his judgment
 *   RESEARCH   cards missing evidence or contact data
 *   READY      people to contact now (email, call, LinkedIn)
 *   FOLLOW UP  sent sequences whose next touch is due
 *   REPLIES    buyer replies waiting for his confirmation
 *
 * Pure presentational; the server page counts with sellerLaneOf (the same
 * function the queue filter uses) and the existing replies list.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface GapCockpitData {
  review: number;
  research: number;
  ready: number;
  followUp: number;
  replies: { count: number; atLeast: boolean };
  /** The lane the queue below is filtered to, if any. */
  active: 'research' | 'ready' | 'follow_up' | null;
}

function Tile({ href, label, value, hint, active }: { href: string; label: string; value: React.ReactNode; hint: string; active?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      data-testid={`cockpit-tile-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn(
        'flex flex-col justify-between rounded-md border bg-[var(--background)] p-4 transition-colors hover:bg-[var(--muted)]',
        active ? 'border-[var(--primary)]' : 'border-[var(--border)]',
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{hint}</p>
    </Link>
  );
}

export function GapCockpit({ data }: { data: GapCockpitData }) {
  return (
    <section data-testid="gap-cockpit" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile href="/gap/hypotheses" label="Review" value={data.review} hint="Theses waiting for you" />
      <Tile href="/gap?lane=research" label="Research" value={data.research} hint="Find evidence or contact data" active={data.active === 'research'} />
      <Tile href="/gap?lane=ready" label="Ready" value={data.ready} hint="Contact now" active={data.active === 'ready'} />
      <Tile href="/gap?lane=follow_up" label="Follow up" value={data.followUp} hint="Next touch due" active={data.active === 'follow_up'} />
      <Tile href="/gap/replies" label="Replies" value={`${data.replies.count}${data.replies.atLeast ? '+' : ''}`} hint="Buyer replied" />
    </section>
  );
}
