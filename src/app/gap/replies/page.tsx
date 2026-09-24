/**
 * /gap/replies (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Reply triage. Server page behind GAP_OS_ENABLED: off means 404, the same
 * answer the replies API gives. The session is enforced by middleware for
 * every page; the explicit auth() check here is a second lock so the page
 * never renders operator data without one. The rows are fetched client-side
 * by <RepliesTriage> from GET /api/gap/replies, so this page holds no
 * Prisma call.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { Breadcrumb } from '@/components/breadcrumb';
import { RepliesTriage } from './replies-triage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reply Triage' };

export default async function GapRepliesPage() {
  if (assertGapEnabled()) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP Work Queue', href: '/gap' }, { label: 'Reply Triage' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reply triage</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Every inbound reply waits here until a human says what it meant. A suggestion is a hint, never a disposition.
        </p>
      </div>
      <RepliesTriage />
    </div>
  );
}
