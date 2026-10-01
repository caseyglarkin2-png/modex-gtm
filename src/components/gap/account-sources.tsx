/**
 * SOURCES / SIGNALS (research aperture): what GAP found about an account, apart from what is verified for outreach.
 * "No verified outreach fact" is never "no information found": both counts are always shown.
 */
import Link from 'next/link';
import type { AccountSources } from '@/lib/gap/sources/account-sources';
import { SourceCard } from './source-card';

export function sourceCounts(s: Pick<AccountSources, 'sourcesFound' | 'verifiedFacts'>): string {
  return `Sources found: ${s.sourcesFound} · Outreach facts verified: ${s.verifiedFacts}`;
}

const GROUPS: Array<[AccountSources['items'][number]['status'], string]> = [
  ['VERIFIED_FOR_OUTREACH', 'Verified for outreach'],
  ['NOT_VERIFIED_FOR_OUTREACH', 'Not verified for outreach'],
  ['COULD_NOT_VERIFY', 'Could not verify'],
];

export function AccountSourcesSection({ sources, limit, viewAllHref, researchHref }: { sources: AccountSources; limit?: number; viewAllHref?: string; researchHref?: string }) {
  const shown = limit ? sources.items.slice(0, limit) : sources.items;
  const notVerified = sources.items.filter((i) => i.status !== 'VERIFIED_FOR_OUTREACH').length;
  return (
    <section className="min-w-0 space-y-2" data-testid="account-sources">
      <h2 className="text-sm font-semibold">Sources / signals</h2>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="account-sources-counts">
        {sourceCounts(sources)}
      </p>
      {sources.items.length ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          {notVerified ? `${notVerified} ${notVerified === 1 ? 'source is' : 'sources are'} not outreach facts; shown with the reason. ` : ''}Newest publication first. You decide what matters.
        </p>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="account-sources-empty">
          GAP has not found a source for this account yet.
        </p>
      )}
      {limit ? (
        <ul>
          {shown.map((s) => (
            <SourceCard key={s.key} s={s} accountName={sources.accountName} compact />
          ))}
        </ul>
      ) : (
        // The full view: grouped by evidence status (a count on each), newest first inside each; nothing hidden.
        GROUPS.map(([status, label]) => {
          const group = sources.items.filter((i) => i.status === status);
          return group.length ? (
            <div key={status} data-testid={`account-sources-group-${status}`}>
              <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide">
                {label} ({group.length})
              </h3>
              <ul>
                {group.map((s) => (
                  <SourceCard key={s.key} s={s} accountName={sources.accountName} researchHref={researchHref} />
                ))}
              </ul>
            </div>
          ) : null;
        })
      )}
      <p className="flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
        {viewAllHref && limit && sources.items.length > 0 ? (
          <Link href={viewAllHref} className="font-semibold text-[var(--foreground)] underline" data-testid="account-sources-view-all">
            View all sources ({sources.items.length})
          </Link>
        ) : null}
        {researchHref ? (
          <Link href={researchHref} className="underline" data-testid="account-sources-research-more">
            Research more
          </Link>
        ) : null}
        {sources.partial ? <span data-testid="account-sources-partial">Older research runs are not loaded here; the newest are.</span> : null}
        {sources.setAside ? <span data-testid="account-sources-set-aside">{sources.setAside} set aside by you</span> : null}
        {sources.dropped ? <span data-testid="account-sources-dropped">{sources.dropped} not shown: search redirects, broken links or pages that do not name {sources.accountName}</span> : null}
      </p>
      {!limit && sources.setAsideItems.length ? (
        <details className="text-xs" data-testid="account-sources-set-aside-list">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">Set aside by you ({sources.setAsideItems.length})</summary>
          <ul>
            {sources.setAsideItems.map((s) => (
              <SourceCard key={s.key} s={s} accountName={sources.accountName} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
