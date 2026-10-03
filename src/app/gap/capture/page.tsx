/**
 * /gap/capture: buyer truth capture, phone first (Phase 2 D1).
 *
 * After a real conversation (a meeting, a conference hallway, a call), save
 * what the buyer said in seconds. The note is kept exactly as written; GAP
 * proposes candidate buyer truth that stays a candidate until Casey confirms
 * it. Unlinked notes are listed first so none is forgotten.
 * Behind GAP_OS_ENABLED + GAP_HYPOTHESIS_ENABLED; session enforced here too.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listRecentCaptures } from '@/lib/gap/capture/store';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { CaptureFlow } from '@/components/gap/capture-flow';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Capture' };

export default async function CapturePage({ searchParams }: { searchParams?: Promise<{ account?: string }> }) {
  if (assertGapEnabled('GAP_HYPOTHESIS_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const recent = await listRecentCaptures(prisma, 8).catch(() => []);
  // ?account= from an account page: prefilled only when it names a real account (never a free-text guess).
  const wanted = ((await searchParams) ?? {}).account?.trim() ?? '';
  const initialAccount = wanted ? ((await prisma.account.findUnique({ where: { name: wanted }, select: { name: true } }).catch(() => null))?.name ?? null) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Capture buyer truth</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Right after the conversation. GAP keeps your note as written and suggests what might be buyer truth; only what you confirm counts.</p>
      </div>
      <CaptureFlow initialAccount={initialAccount} />
      {recent.length ? (
        <section className="space-y-2" data-testid="capture-recent">
          <h2 className="text-sm font-semibold">Recent notes</h2>
          <ul className="space-y-1 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <span className={r.accountName ? '' : 'font-medium text-amber-700 dark:text-amber-400'}>{r.accountName ?? `Unlinked${r.accountHint ? ` ("${r.accountHint}")` : ''}`}</span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {r.context} · {r.createdAt.slice(0, 10)} · {r.pending} candidate{r.pending === 1 ? '' : 's'} waiting
                </span>
                <Link href={`/gap/capture/${encodeURIComponent(r.id)}`} className="text-xs underline">
                  open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
