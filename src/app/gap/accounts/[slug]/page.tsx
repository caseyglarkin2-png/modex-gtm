/**
 * /gap/accounts/:slug   ONE account surface: the canonical account intelligence brief.
 * The 30-second glance first, then everything GAP knows by section (truth class and
 * source on every line). Read-only: nothing here writes, drafts or sends.
 * Two accounts can share a slug ("P&G", "P-G"): the page asks which (?name=), never picks.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { loadAccountBrief } from '@/lib/gap/account-intel/load';
import { AccountBriefView } from '@/components/gap/account-brief';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { ResearchPlanView } from '@/components/gap/research-plan';
import { loadResearchHistory, planResearch } from '@/lib/gap/account-intel/orchestrate';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP account' };

export default async function AccountPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ name?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { slug } = await params;
  const q = (await searchParams) ?? {};
  const now = new Date();
  const brief = await loadAccountBrief(prisma, slug, now, { live: true, name: q.name });
  if (!brief) notFound();
  if ('collision' in brief) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <GapSubnav />
        <h1 className="text-2xl font-semibold tracking-tight">Which account?</h1>
        <p className="text-sm text-[var(--muted-foreground)]">These accounts share one link. Pick one; if they are the same company, they are duplicate rows.</p>
        <ul className="space-y-1 text-sm" data-testid="account-collision">
          {brief.collision.map((n) => (
            <li key={n}>
              <Link className="underline" href={`/gap/accounts/${slug}?name=${encodeURIComponent(n)}`}>
                {n}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="account-name">{brief.accountName}</h1>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Built live from what GAP holds, {brief.generatedAt.slice(0, 10)}. Every line says whether the buyer confirmed it, a source verified it, GAP modeled it or GAP inferred it.
        </p>
      </div>
      <AccountBriefView brief={brief} afterGlance={<ResearchPlanView accountName={brief.accountName} plan={planResearch(brief, await loadResearchHistory(prisma, brief.accountName, now).catch(() => []), now)} />} />
    </div>
  );
}
