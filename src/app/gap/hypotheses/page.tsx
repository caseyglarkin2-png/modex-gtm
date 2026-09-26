/**
 * /gap/hypotheses (GAP Prospecting OS, Sprint 1, S1-T13; demoted 2026-09-26).
 *
 * ALL HYPOTHESES: history and diagnosis. Deciding happens in the cockpit REVIEW
 * lane (/gap?lane=review), which renders the same thesis cards and list.
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
export const metadata = { title: 'All hypotheses' };

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
  // Every thesis shows regardless of the status filter, so an approved group never vanishes from view.
  const groups = orderGroupsForReview(await loadThesisGroups(prisma));
  const cards = await withRecordedNotes(prisma, groups.map(toThesisCard));

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'GAP', href: '/gap' }, { label: 'All hypotheses' }]} />
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All hypotheses</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          History and every status. To decide what is waiting, use <a className="underline" href="/gap?lane=review">Review</a> in the cockpit.
        </p>
      </div>
      <ThesisGroupReview cards={cards} />
      <HypothesisList items={items} status={status} />
    </div>
  );
}
