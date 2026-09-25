/**
 * /gap/hypotheses (GAP Prospecting OS, Sprint 1, S1-T13).
 *
 * Server page behind GAP_OS_ENABLED + GAP_HYPOTHESIS_ENABLED: a flag that is
 * off means 404, the same answer the API gives. The session is enforced by
 * middleware for every page; the explicit auth() check here is a second
 * lock so the page never renders operator data without one.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { listHypotheses } from '@/lib/gap/hypothesis/service';
import { loadThesisGroups, orderGroupsForReview, toThesisCard, withRecordedNotes } from '@/lib/gap/hypothesis/thesis-groups';
import { HYPOTHESIS_STATUSES, type HypothesisStatus } from '@/lib/gap/taxonomy';
import { Breadcrumb } from '@/components/breadcrumb';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { ThesisGroupReview } from '@/components/gap/thesis-group-review';
import { HypothesisList } from './hypothesis-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Hypotheses' };

type SearchParams = { status?: string };

function parseStatus(value: string | undefined): HypothesisStatus | null {
  const trimmed = value?.trim();
  return trimmed && (HYPOTHESIS_STATUSES as readonly string[]).includes(trimmed) ? (trimmed as HypothesisStatus) : null;
}

export default async function HypothesesPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (assertGapEnabled('GAP_HYPOTHESIS_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const params = (await searchParams) ?? {};
  const status = parseStatus(params.status);
  const { items } = await listHypotheses(prisma, { limit: 50, ...(status ? { status } : {}) });
  // Account theses shared by 2+ people come first (grouped review), then the one-off table.
  const groups = orderGroupsForReview(await loadThesisGroups(prisma)).filter((g) => !status || g.members.some((m) => m.status === status));
  const cards = await withRecordedNotes(prisma, groups.map(toThesisCard));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP OS', href: '/gap' }, { label: 'Hypotheses' }]} />
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hypotheses</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Cited facts first in each drawer, seller inference below. Nothing advances without a cited fact.
        </p>
      </div>
      <ThesisGroupReview cards={cards} />
      <HypothesisList items={items} status={status} />
    </div>
  );
}
