/**
 * /gap/activity   (X20b, GAP OS sales execution engine, 2026-10-08; the mandate's section 10)
 *
 * The accountability view: what I intended today (the day's plan), what was completed (the ledger projected into the
 * activity kinds, provider-proven apart from self-reported), what needs attention (open plan items, blocked work),
 * what the agents are handling. `?day=YYYY-MM-DD` reads another New York day. Read only; session only; behind the
 * GAP flags. Nothing here sends, drafts, enrolls or writes HubSpot.
 */
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadAccountability } from '@/lib/gap/work/activity';
import { addDays, isDay, nyDay } from '@/lib/gap/work/dates';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { ActivityView } from '@/components/gap/activity-view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP activity' };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/activity/'));
  const sp = await searchParams;
  const now = new Date();
  const today = nyDay(now);
  const raw = typeof sp.day === 'string' ? sp.day : null;
  const day = raw && isDay(raw) && raw <= today ? raw : today;
  const a = await loadAccountability(prisma, now, day);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          What you intended, what was completed, what needs attention and what the agents are handling, for {day === today ? 'today' : day}. Counted from the ledger, never from opening a page.
        </p>
        <p className="mt-1 text-xs">
          <Link href={`/gap/activity/?day=${addDays(day, -1)}`} className="underline">Previous day</Link>
          {day < today ? <> · <Link href={`/gap/activity/?day=${addDays(day, 1)}`} className="underline">Next day</Link> · <Link href="/gap/activity/" className="underline">Today</Link></> : null}
        </p>
      </div>
      <ActivityView a={a} />
    </div>
  );
}
