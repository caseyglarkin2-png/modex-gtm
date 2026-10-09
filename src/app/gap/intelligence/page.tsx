/**
 * /gap/intelligence: EVERYTHING GAP RETAINED (intelligence wiring, IW05 + IW13). Server component.
 *
 * The Work panel shows the day's selection; this is the complete pool, newest first, paged deterministically, with
 * the producers' own status at the top (IW13: last import, counts, current or stalled or failed or never) so a
 * missing source is visible, never silent. Filters are links (producer, decided or not, the archive, triggers).
 * Decisions stay on Work: no buttons here, no Slack, no CRM, no outreach. Session enforced here and by middleware.
 */
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { loginHref } from '@/lib/auth-return';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { BrowseCursorError, browseIntelligence, type BrowseFilters, type BrowseResult } from '@/lib/gap/signals/intelligence-browse';
import { browseHref, parseBrowseQuery } from '@/lib/gap/signals/intelligence-query';
import { loadProducerStatus, type ProducerStatus } from '@/lib/gap/signals/producer-status';
import { GapSubnav } from '@/components/gap/gap-subnav';
import { IntelligenceList } from '@/components/gap/intelligence-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Intelligence' };

type Params = Record<string, string | string[] | undefined>;

const link = 'underline decoration-dotted underline-offset-2 hover:decoration-solid';

function FilterLink({ filters, label, active }: { filters: BrowseFilters; label: string; active: boolean }) {
  return active ? (
    <span className="rounded bg-[var(--muted)] px-2 py-0.5 font-semibold">{label}</span>
  ) : (
    <Link href={browseHref(filters)} className={`rounded px-2 py-0.5 ${link}`}>
      {label}
    </Link>
  );
}

export default async function IntelligencePage({ searchParams }: { searchParams?: Promise<Params> }) {
  if (assertGapEnabled('GAP_ROUTING_ENABLED')) notFound();
  const session = await auth();
  if (!session?.user?.email) redirect(loginHref('/gap/intelligence/'));
  const parsed = parseBrowseQuery((await searchParams) ?? {});
  const query = parsed.ok ? parsed.query : { limit: undefined, cursor: null, filters: {} };
  const now = new Date();
  let result: BrowseResult | null = null;
  let error: string | null = parsed.ok ? null : `The ${parsed.field} filter was not understood; showing everything.`;
  try {
    result = await browseIntelligence(prisma, { now, limit: query.limit, cursor: query.cursor, filters: query.filters });
  } catch (e) {
    if (e instanceof BrowseCursorError) {
      error = 'That page link was not understood; showing the first page.';
      result = await browseIntelligence(prisma, { now, limit: query.limit, cursor: null, filters: query.filters }).catch(() => null);
    } else {
      error = 'The intelligence could not be read this time.';
    }
  }
  const producers: ProducerStatus[] = await loadProducerStatus(prisma, now).catch(() => []);
  const f: BrowseFilters = result?.applied ?? query.filters;
  const kind = f.kind ?? 'signal';
  const decided = f.decided ?? 'all';
  const withProducers = producers.filter((p) => p.producer !== 'vault' && p.totalItems + p.totalReports > 0);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <GapSubnav />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Intelligence</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Everything GAP retained, newest first. Work shows the day&apos;s selection; this is the whole pool. Each item says its source and its dates as what they are. Decide on Work.</p>
      </div>
      <section className="space-y-1" data-testid="producer-status">
        <h2 className="text-sm font-semibold">Sources</h2>
        <ul className="space-y-0.5 text-xs text-[var(--muted-foreground)]">
          {producers.map((p) => (
            <li key={p.producer} data-state={p.state}>{p.line}</li>
          ))}
        </ul>
      </section>
      <nav className="flex flex-wrap items-center gap-2 text-xs" aria-label="Filters">
        <span className="text-[var(--muted-foreground)]">Show:</span>
        <FilterLink filters={{ ...f, kind: 'signal' }} label="Signals" active={kind === 'signal'} />
        <FilterLink filters={{ ...f, kind: 'trigger', producer: undefined, origin: undefined }} label="Triggers" active={kind === 'trigger'} />
        <span className="text-[var(--muted-foreground)]">·</span>
        <FilterLink filters={{ ...f, decided: 'all' }} label="All" active={decided === 'all'} />
        <FilterLink filters={{ ...f, decided: 'undecided' }} label="Undecided" active={decided === 'undecided'} />
        <FilterLink filters={{ ...f, decided: 'decided' }} label="Decided" active={decided === 'decided'} />
        <span className="text-[var(--muted-foreground)]">·</span>
        <FilterLink filters={{ ...f, archive: !f.archive }} label={f.archive ? 'Archive shown (hide)' : 'Include the archive'} active={false} />
        {kind === 'signal' && withProducers.length ? (
          <>
            <span className="text-[var(--muted-foreground)]">· Producer:</span>
            <FilterLink filters={{ ...f, producer: undefined }} label="any" active={!f.producer} />
            {withProducers.map((p) => (
              <FilterLink key={p.producer} filters={{ ...f, producer: p.producer }} label={p.label} active={f.producer === p.producer} />
            ))}
          </>
        ) : null}
        {f.account ? (
          <>
            <span className="text-[var(--muted-foreground)]">· Account: {f.account}</span>
            <Link href={browseHref({ ...f, account: undefined })} className={link}>clear</Link>
          </>
        ) : null}
      </nav>
      {error ? <p className="text-sm text-amber-800 dark:text-amber-300">{error}</p> : null}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">{result ? `${result.total} ${kind === 'trigger' ? 'trigger' : 'item'}${result.total === 1 ? '' : 's'}${result.items.length < result.total ? `, ${result.items.length} on this page` : ''}` : 'Items'}</h2>
        <IntelligenceList items={result?.items ?? []} />
        {result?.next ? (
          <p className="text-sm">
            <Link href={browseHref(f, result.next)} className={link} data-testid="intel-next">
              Next page
            </Link>
          </p>
        ) : null}
      </section>
    </div>
  );
}
