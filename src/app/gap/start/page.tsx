/**
 * /gap/start[?t=<signed action token>][&next=1]   (X06, GAP OS sales execution engine, 2026-10-08)
 *
 * START the day: records `work.day_started` once for the New York day, plans the day if no snapshot exists (the one
 * day builder, X01/X04), and sends the first assignment as its own email to the seller's configured address when the
 * GAP identity is configured (`?next=1` sends the next unassigned item). Session-protected: the signed link only
 * binds the day; a direct visit works the same for a signed-in seller. Nothing here goes to a buyer; nothing is
 * drafted, enrolled or written to HubSpot.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { actionSecret, verifyActionToken } from '@/lib/gap/work/action-token';
import { nextUnassignedItem, sendAssignment, startDay } from '@/lib/gap/work/assignment';
import { nyDay } from '@/lib/gap/work/dates';
import { loadWorkDay } from '@/lib/gap/work/load-day';
import { planDay } from '@/lib/gap/work/plan';
import { loadSellerSettings } from '@/lib/gap/work/settings';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Start the day' };

export default async function StartPage({ searchParams }: { searchParams?: Promise<{ t?: string; next?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/start/'));
  const actor = session.user.email;
  const q = (await searchParams) ?? {};
  const now = new Date();
  const day = nyDay(now);
  const token = q.t ? verifyActionToken(q.t, { secret: actionSecret(), now }) : null;
  const via = token?.ok ? 'link' : 'app';

  const plan = await planDay(prisma, { now, load: async () => (await loadWorkDay(prisma, { lane: false, preview: false, fresh: false, now })).day }, actor);
  const started = await startDay(prisma, { day, now, actor, via });
  const settings = await loadSellerSettings(prisma);
  const sender = gapGmailSender();
  const item = await nextUnassignedItem(prisma, plan);
  let mailed: { to: string; subject: string } | { reason: string } | null = null;
  if (item && settings.briefingTo && sender) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || 'https://modex-gtm.vercel.app';
    try {
      const r = await sendAssignment(prisma, { plan, item, revision: 0, to: settings.briefingTo, sender, baseUrl, actionSecret: actionSecret(), commandsEnabled: true, now, actor });
      mailed = r.sent ? { to: settings.briefingTo, subject: r.subject } : { reason: 'already sent' };
    } catch (e) {
      mailed = { reason: e instanceof Error ? e.message : String(e) };
    }
  } else if (item && !settings.briefingTo) mailed = { reason: 'no briefing address is set (Settings)' };
  else if (item && !sender) mailed = { reason: 'the GAP mailbox is not configured' };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{started.started ? 'The day is started' : 'The day was already started'}</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-testid="start-summary">
          {plan.items.length === 0 ? 'Nothing on the list needs you today.' : `${plan.items.length} ${plan.items.length === 1 ? 'item needs' : 'items need'} you today, in order.`}
          {token && !token.ok ? ` (The link was ${token.reason === 'expired' ? 'expired' : 'not valid'}; you are signed in, so the day started anyway.)` : ''}
        </p>
      </div>
      {item ? (
        <section className="space-y-2 rounded-md border border-[var(--border)] p-3" data-testid="start-first">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">First up</p>
          <p className="font-semibold">{item.accountName}: {item.title}</p>
          <p className="text-sm">{item.why}{item.person ? ` ${item.person.name}${item.person.title ? ` (${item.person.title})` : ''}.` : ''}</p>
          {mailed && 'to' in mailed ? <p className="text-xs text-[var(--muted-foreground)]">Sent to {mailed.to} as its own email: {mailed.subject}</p> : null}
          {mailed && 'reason' in mailed ? <p className="text-xs text-[var(--muted-foreground)]">Not emailed: {mailed.reason}.</p> : null}
          <div className="flex flex-wrap gap-2">
            <Link href={item.href} className="inline-flex min-h-11 items-center rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary-foreground)]" data-testid="start-open">Open it</Link>
            <Link href="/gap/start?next=1" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-sm">Send the next one by email</Link>
            <Link href="/gap/" className="inline-flex min-h-11 items-center text-sm underline">Work</Link>
          </div>
        </section>
      ) : (
        <p className="text-sm">
          Every item on today&apos;s list has gone out. <Link href="/gap/" className="underline">Open Work</Link> for what is waiting and parked.
        </p>
      )}
    </div>
  );
}
