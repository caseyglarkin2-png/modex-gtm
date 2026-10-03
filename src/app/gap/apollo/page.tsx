/**
 * /gap/apollo: which Apollo lookups are worth Casey's credits, across accounts. Opening the page evaluates nothing and
 * spends nothing; Casey picks up to 10 watched accounts, GAP runs the same per-account projection the account page
 * uses, and Casey copies the requests worth running. GAP never calls Apollo from here.
 */
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { loadWatchProfilesCached } from '@/lib/gap/signals/watch';
import { accountSlug } from '@/lib/gap/account-intel/href';
import { MAX_REVIEW_ACCOUNTS, reviewApolloCandidates } from '@/lib/gap/people/apollo-review';
import { ApolloReviewTable } from '@/components/gap/apollo-review-table';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apollo review | GAP' };

export default async function ApolloReviewPage({ searchParams }: { searchParams?: Promise<{ a?: string | string[] }> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect('/login');
  const q = (await searchParams) ?? {};
  const chosen = (Array.isArray(q.a) ? q.a : q.a ? [q.a] : []).slice(0, MAX_REVIEW_ACCOUNTS);
  const watched = (await loadWatchProfilesCached(prisma).catch(() => [])).map((p) => ({ name: p.accountName, slug: accountSlug(p.accountName) })).sort((x, y) => x.name.localeCompare(y.name));
  const review = chosen.length ? await reviewApolloCandidates(prisma, chosen, new Date()) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-28">
      <GapSubnav />
      <h1 className="text-2xl font-semibold tracking-tight">Apollo review</h1>
      <p className="text-sm text-muted-foreground">Which lookups are worth your credits. GAP never spends Apollo credits on its own and nothing on this page runs a lookup: pick accounts, review what GAP would look up and why, and copy the requests you want to run.</p>
      <form method="get" className="space-y-2" data-testid="apollo-review-picker">
        <fieldset>
          <legend className="text-sm font-semibold">Accounts to review (up to {MAX_REVIEW_ACCOUNTS})</legend>
          {watched.length ? null : <p className="text-sm text-amber-700 dark:text-amber-400">The watched accounts could not be read just now.</p>}
          <div className="mt-1 grid max-h-64 grid-cols-1 gap-x-3 overflow-y-auto sm:grid-cols-2">
            {watched.map((w) => (
              <label key={w.slug} className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" name="a" value={w.slug} defaultChecked={chosen.includes(w.slug)} className="h-5 w-5" />
                {w.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Review selected accounts</button>
      </form>
      {review ? (
        <section className="space-y-3" aria-label="Apollo lookups">
          <ApolloReviewTable rows={review.rows} />
          {review.notes.length ? (
            <div className="space-y-1 text-sm">
              <h2 className="font-semibold">Nothing to look up</h2>
              <ul>{review.notes.map((n) => <li key={n.account}>{n.account}: {n.note}</li>)}</ul>
            </div>
          ) : null}
          {review.failed.length ? <p className="text-sm text-amber-700 dark:text-amber-400">Could not be read just now: {review.failed.join(', ')}.</p> : null}
        </section>
      ) : null}
    </div>
  );
}
