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
import { listQueue } from '@/lib/gap/routing/queue';
import { sellerLaneOf } from '@/lib/gap/routing/card-readiness';
import { loadThesisGroups } from '@/lib/gap/hypothesis/thesis-groups';
import { resolveRoutableHypothesisScope } from '@/lib/gap/routing/run';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { GapCockpit, type GapCockpitData } from '@/components/gap/gap-cockpit';
import { GapQueueSection } from './gap-queue-section';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP' };

const REPLY_TILE_LIMIT = 50;

interface LoadedPageData {
  cockpit: GapCockpitData;
  latestRunId: string | null;
  canRunRouting: boolean;
  routableHypotheses: number;
  routableAccounts: number;
}

type Lane = GapCockpitData['active'];

async function loadCockpitData(active: Lane): Promise<LoadedPageData> {
  const [hypothesesToReview, routableScope, latestQueuePage, repliesPage, groups] = await Promise.all([
    prisma.prospectingHypothesis.count({ where: { status: { in: ['draft', 'review_required'] } } }),
    // The exact scope the Run Routing button will use (resolveRoutableHypothesisScope
    // is the single source of truth, shared with the route) -- so the count shown
    // before the click always matches what the click actually does.
    resolveRoutableHypothesisScope(prisma),
    listQueue(prisma, { limit: 100 }),
    listReplies(prisma, { state: 'undispositioned', limit: REPLY_TILE_LIMIT }),
    loadThesisGroups(prisma).catch(() => []),
  ]);
  // REVIEW counts decisions, not rows: a shared account thesis is ONE review however many people it covers.
  const grouped = groups.flatMap((g) => g.members.filter((m) => m.status === 'draft' || m.status === 'review_required').map((m) => m.id));
  const thesesWaiting = groups.filter((g) => g.members.some((m) => m.status === 'draft' || m.status === 'review_required' || m.status === 'approved')).length;
  const lanes = latestQueuePage.items.map((item) => sellerLaneOf(item));
  const count = (lane: string) => lanes.filter((l) => l === lane).length;
  const routableHypotheses = 'tooLarge' in routableScope ? 0 : routableScope.hypothesesCount;
  const routableAccounts = 'tooLarge' in routableScope ? routableScope.accountCount : routableScope.accountNames.length;
  return {
    cockpit: {
      review: thesesWaiting + Math.max(0, hypothesesToReview - grouped.length),
      research: count('research'),
      ready: count('ready'),
      followUp: count('follow_up'),
      replies: { count: repliesPage.items.length, atLeast: repliesPage.nextCursor !== null },
      active,
    },
    latestRunId: latestQueuePage.runId,
    // Enable Run routing when there is something new to route, or a prior run to refresh.
    canRunRouting: routableHypotheses > 0 || latestQueuePage.runId !== null,
    routableHypotheses,
    routableAccounts,
  };
}

const LANES = new Set(['research', 'ready', 'follow_up']);

export default async function GapWorkQueuePage({ searchParams }: { searchParams?: Promise<{ lane?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const laneParam = ((await searchParams) ?? {}).lane;
  const active = (laneParam && LANES.has(laneParam) ? laneParam : null) as Lane;
  const { cockpit, latestRunId, canRunRouting, routableHypotheses, routableAccounts } = await loadCockpitData(active);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GAP</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Review theses, then contact the people GAP marks ready.</p>
      </div>
      <GapSubnav />
      <GapCockpit data={cockpit} />
      <GapQueueSection
        latestRunId={latestRunId}
        canRunRouting={canRunRouting}
        routableHypotheses={routableHypotheses}
        routableAccounts={routableAccounts}
        sellerLane={active}
      />
    </div>
  );
}
