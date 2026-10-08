/**
 * /gap/add   ADD TO GAP: the one front door for any work (a link, a person, a
 * list of people or accounts, a conversation). Session required.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listSources } from '@/lib/gap/intake/views';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { WorkIntake } from '@/components/gap/work-intake';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add to GAP' };

export default async function AddToGapPage({ searchParams }: { searchParams?: Promise<{ mode?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/add/'));
  const mode = (await searchParams)?.mode;
  const sources = await listSources(prisma).catch(() => []);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add to GAP</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Give GAP something worth working. It finds who and which account, researches each account once, and brings back what deserves your judgment.</p>
      </div>
      <WorkIntake
        sources={sources.map((s) => ({ id: s.id, name: s.name, sourceType: s.sourceType, relationshipContext: s.relationshipContext, members: s.members, current: s.current }))}
        initialMode={mode === 'people' || mode === 'accounts' || mode === 'person' ? mode : undefined}
      />
    </div>
  );
}
