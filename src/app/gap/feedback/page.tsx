/**
 * /gap/feedback   the dogfood note backlog (stabilization E): OPEN, LATER, FIXED, DISMISSED, newest first.
 * Notes are memory for future sessions; nothing here changes the product or seller state.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listFeedback } from '@/lib/gap/feedback/feedback';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { FeedbackList } from '@/components/gap/feedback-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP notes' };

export default async function FeedbackPage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const items = await listFeedback(prisma);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">What you noticed while using GAP: bugs, friction, data, research, copy, ideas, what worked. Copy a debug packet to hand one to a Claude session. A note never changes GAP by itself.</p>
      </div>
      <FeedbackList items={items} />
    </div>
  );
}
