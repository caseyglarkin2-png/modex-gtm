/**
 * /gap/call/[personaId] (GAP Prospecting OS, Sprint 4, S4-T5).
 *
 * Call Mode. Server page behind GAP_OS_ENABLED: off means 404, the same
 * answer the call brief API gives. The session is enforced by middleware
 * for every page; the explicit auth() check here is a second lock. The
 * brief is fetched client-side by <CallMode> from
 * GET /api/gap/call/[personaId], so this page holds no Prisma call.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { assertGapEnabled } from '@/lib/gap/flags';
import { Breadcrumb } from '@/components/breadcrumb';
import { CallMode } from './call-mode';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Call Mode' };

type Params = { personaId: string };

export default async function GapCallPage({ params }: { params: Promise<Params> }) {
  if (assertGapEnabled()) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { personaId } = await params;
  if (!personaId || personaId.trim().length === 0) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP Work Queue', href: '/gap' }, { label: 'Call Mode' }]} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Call mode</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Read the brief, dial, then record the outcome in one tap. Keys 1 to 4 for the first row, Enter records, Esc clears.
        </p>
      </div>
      <CallMode personaId={personaId} />
    </div>
  );
}
