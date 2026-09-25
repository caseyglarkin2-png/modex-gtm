/**
 * /gap (GAP Prospecting OS, Sprint 2, S2-T11).
 *
 * The work queue. Server page behind GAP_OS_ENABLED + GAP_ROUTING_ENABLED:
 * a flag that is off means 404, the same answer the queue API gives. The
 * session is enforced by middleware for every page; the explicit auth()
 * check here is a second lock so the page never renders operator data
 * without one. The data itself is fetched client-side by <WorkQueue> from
 * GET /api/gap/queue, so this page holds no Prisma call.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listReplies } from '@/lib/gap/replies/list';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, type GapCockpitData } from '@/components/gap/gap-cockpit';
import { WorkQueue } from './work-queue';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP Work Queue' };

const REPLY_TILE_LIMIT = 50;

async function loadCockpitData(): Promise<GapCockpitData> {
  const [hypothesesToReview, routingDecisionsPending, repliesPage] = await Promise.all([
    prisma.prospectingHypothesis.count({ where: { status: { in: ['draft', 'review_required'] } } }),
    prisma.routingDecision.count({ where: { human_action: null } }),
    listReplies(prisma, { state: 'undispositioned', limit: REPLY_TILE_LIMIT }),
  ]);
  return {
    hypothesesToReview,
    routingDecisionsPending,
    repliesNeedingReview: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
    shadowEnabled: process.env.GAP_AUTO_ENROLL_SHADOW === 'true',
  };
}

export default async function GapWorkQueuePage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const cockpit = await loadCockpitData();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP Work Queue' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GAP OS</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          One card per routed decision from the latest run. Each card answers why this account, this person, this problem, now, and this action, and names what would prove us wrong.
        </p>
      </div>
      <GapSubnav />
      <GapCockpit data={cockpit} />
      <WorkQueue />
    </div>
  );
}
