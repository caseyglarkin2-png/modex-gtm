/**
 * /gap/learning (GAP Prospecting OS, Sprint 5).
 *
 * Server page behind GAP_OS_ENABLED: off means 404, the same answer the
 * learning API gives. The session is enforced by middleware for every page;
 * the explicit auth() check here is a second lock, same pattern as
 * /gap/replies. Data is fetched client-side by <LearningDashboard> from
 * GET /api/gap/learning, so this page holds no Prisma call.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { LearningDashboard } from './learning-dashboard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP Learning' };

export default async function GapLearningPage() {
  if (assertGapEnabled()) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP Work Queue', href: '/gap' }, { label: 'Learning' }]} />
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">What did the system learn</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Where the prospecting hypothesis is working or failing: targeting, the hypothesis, the message, the ask, and
          discovery. Every rate carries its sample size; a small n is shown, never hidden.
        </p>
      </div>
      <LearningDashboard />
    </div>
  );
}
