/**
 * /gap/sources   every work source and what GAP did with it (real states, no score).
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listSources } from '@/lib/gap/intake/views';
import { GapSubnav } from '@/components/gap/gap-subnav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP sources' };

export default async function SourcesPage() {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const sources = await listSources(prisma).catch(() => []);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Where your people and accounts came from, and what GAP did with each.</p>
        </div>
        <Link href="/gap/add" className="min-h-[44px] rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)]">
          Add to GAP
        </Link>
      </div>
      {sources.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">No sources yet. Add a list, a person or a conference.</p> : null}
      <ul className="space-y-2" data-testid="sources-list">
        {sources.map((s) => (
          <li key={s.id} className="rounded-md border border-[var(--border)] p-3">
            <Link href={`/gap/sources/${s.id}`} className="text-base font-semibold hover:underline" data-testid="source-link">
              {s.name}
            </Link>
            {s.current ? <span className="ml-2 rounded bg-[var(--muted)] px-1.5 py-0.5 text-xs">current</span> : null}
            <p className="text-xs text-[var(--muted-foreground)]">
              {s.sourceType.replace(/_/g, ' ')} · {s.intent.replace(/_/g, ' ')}
              {s.relationshipContext ? ` · ${s.relationshipContext}` : ''}
            </p>
            <p className="mt-1 text-sm">
              {s.members} {s.members === 1 ? 'member' : 'members'} · {s.accounts} {s.accounts === 1 ? 'account' : 'accounts'} · {s.byResolution.resolved ?? 0} known · {s.byResolution.new_candidate ?? 0} new at known accounts · {(s.byResolution.unresolved ?? 0) + (s.byResolution.ambiguous ?? 0)} need identity
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
