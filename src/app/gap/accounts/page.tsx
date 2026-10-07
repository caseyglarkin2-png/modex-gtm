/**
 * /gap/accounts (account-first UX, UX-10): the searchable index of every GAP account, the fast way to a workspace.
 * Three cheap reads (accounts, people per account, the newest first touch per account); no pursuit read here.
 * Behind GAP_OS_ENABLED + GAP_ROUTING_ENABLED like the workspace; session enforced by middleware, auth() a second lock.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { AccountsIndex } from '@/components/gap/accounts-index';
import { orderAccounts, toIndexRow, type AccountIndexRow } from '@/lib/gap/accounts/index-list';
import { loadAccountFirstTouches } from '@/lib/gap/motion/load';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Accounts | GAP' };

async function loadIndex(): Promise<AccountIndexRow[]> {
  const now = new Date();
  const accounts = (await prisma.account.findMany({ select: { name: true, tier: true, vertical: true, priority_band: true }, orderBy: { name: 'asc' } })) as Array<{ name: string; tier: string | null; vertical: string | null; priority_band: string | null }>;
  const names = accounts.map((a) => a.name);
  const [people, theses, touches] = await Promise.all([
    prisma.persona.groupBy({ by: ['account_name'], _count: { _all: true } }).catch(() => [] as Array<{ account_name: string; _count: { _all: number } }>),
    // GAP accounts are the ones GAP has worked: people, a thesis or a first touch on record (the TAM universe stays in Sources).
    prisma.prospectingHypothesis.groupBy({ by: ['account_name'] }).catch(() => [] as Array<{ account_name: string }>),
    // The same proven first touches the motion reads (Gmail-proven sends, drafts in flight): the newest per account.
    loadAccountFirstTouches(prisma, names, now).catch(() => new Map<string, Array<{ sentAt: string }>>()),
  ]);
  const peopleBy = new Map((people as Array<{ account_name: string; _count: { _all: number } }>).map((p) => [p.account_name, p._count._all]));
  const lastTouch = (name: string) => {
    const t = [...(touches.get(name) ?? [])].map((x) => x.sentAt).sort().pop();
    return t ?? null;
  };
  const withThesis = new Set((theses as Array<{ account_name: string }>).map((t) => t.account_name));
  // Test fixtures (E2E) and bare-domain rows are not seller accounts.
  const isFixture = (name: string) => /\bE2E\b/i.test(name) || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(name.trim());
  const gapAccounts = accounts.filter((a) => !isFixture(a.name) && ((peopleBy.get(a.name) ?? 0) > 0 || withThesis.has(a.name) || (touches.get(a.name)?.length ?? 0) > 0));
  return orderAccounts(gapAccounts.map((a) => toIndexRow(a, peopleBy.get(a.name) ?? 0, lastTouch(a.name))));
}

export default async function GapAccountsPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/accounts/'));
  const q = ((await searchParams) ?? {}).q ?? '';
  const rows = await loadIndex();
  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP', href: '/gap' }, { label: 'Accounts' }]} />
      <div>
        <h1 id="accounts-heading" className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Every GAP account. Type to find one; Work lists the ones that need you.</p>
      </div>
      <GapSubnav />
      <AccountsIndex rows={rows} initialQuery={q} />
    </div>
  );
}
