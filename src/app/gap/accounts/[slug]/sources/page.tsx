/**
 * /gap/accounts/:slug/sources   EVERY source GAP found about one account (research aperture).
 * Provenance first, the evidence status with its factual reason, newest publication first. Nothing is hidden on a
 * bot's judgment; only what Casey set aside is folded away (and still listed). Read-only except Casey's own actions.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { accountNamesForSlug } from '@/lib/gap/account-intel/load';
import { loadAccountSources } from '@/lib/gap/sources/account-sources';
import { AccountSourcesSection } from '@/components/gap/account-sources';
import { GapSubnav } from '@/components/gap/gap-subnav';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'GAP sources' };

export default async function AccountSourcesPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ name?: string }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const { slug } = await params;
  const q = (await searchParams) ?? {};
  const names = await accountNamesForSlug(prisma, slug);
  const name = q.name && names.includes(q.name) ? q.name : names.length === 1 ? names[0] : null;
  if (!name) {
    if (names.length > 1) redirect(`/gap/accounts/${slug}`);
    notFound();
  }
  const sources = await loadAccountSources(prisma, name, { now: new Date() });
  const back = `/gap/accounts/${slug}${q.name ? `?name=${encodeURIComponent(q.name)}` : ''}`;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <p className="text-xs">
          <Link href={back} className="underline">
            {name}
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="account-name">
          All sources: {name}
        </h1>
      </div>
      <AccountSourcesSection sources={sources} />
    </div>
  );
}
