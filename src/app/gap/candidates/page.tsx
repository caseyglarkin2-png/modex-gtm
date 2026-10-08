/**
 * /gap/candidates   every company GAP met in a work source but could not place, across all sources: what Scout
 * found and Casey's choice (add, map, research more, ignore). Nothing becomes an account on its own.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadCandidateQueue } from '@/lib/gap/entity/candidates';
import { CandidateQueue } from '@/components/gap/candidate-queue';
import { GapSubnav } from '@/components/gap/gap-subnav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP new companies' };

export default async function CandidatesPage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/candidates/'));
  const items = await loadCandidateQueue(prisma, { limit: 150 });
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New companies</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Companies your sources brought in that GAP does not know yet. Direct buyers first (anyone who runs freight facilities, yards or fleets: shippers, 3PLs, carriers, terminals), then the ones to check, partners, and not-fits last.</p>
      </div>
      {items.length ? <CandidateQueue items={items} title={`${items.length}${items.length >= 150 ? '+' : ''} companies`} /> : <p className="text-sm italic text-[var(--muted-foreground)]">Every company in your sources is placed, decided or ignored.</p>}
    </div>
  );
}
