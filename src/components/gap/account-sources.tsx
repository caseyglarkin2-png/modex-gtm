/**
 * SOURCES / SIGNALS (research aperture): what GAP found about an account, on the truth vocabulary's levels. Three
 * counts, always: sources / signals found, claims verified at their source, and the subset eligible as outreach
 * evidence. "No outreach evidence" is never "no information found".
 *
 * The compact view shows EVENTS, new and unreviewed first: one story's best source with "+ N more" (nothing hidden;
 * View all lists every source). The full view groups by the claim's state, newest first inside each.
 */
import Link from 'next/link';
import { groupEvents, type AccountSources } from '@/lib/gap/sources/account-sources';
import { SourceCard } from './source-card';

export function sourceCounts(s: Pick<AccountSources, 'sourcesFound' | 'claimsVerified' | 'outreachEligible'>): string {
  return `Sources / signals: ${s.sourcesFound} · Verified at source: ${s.claimsVerified} ${s.claimsVerified === 1 ? 'claim' : 'claims'} · Eligible as outreach evidence: ${s.outreachEligible}`;
}

type Item = AccountSources['items'][number];
const GROUPS: Array<[string, string, (i: Item) => boolean]> = [
  ['eligible', 'Eligible as outreach evidence', (i) => i.outreach === 'ELIGIBLE'],
  ['judgment', 'Needs your judgment', (i) => i.outreach === 'NEEDS_HUMAN_JUDGMENT' || i.verification === 'CONTRADICTED'],
  ['verified', 'Verified at source, not eligible as outreach evidence', (i) => i.verification === 'VERIFIED_AT_SOURCE' && i.outreach !== 'ELIGIBLE' && i.outreach !== 'NEEDS_HUMAN_JUDGMENT'],
  ['other', 'Sources / signals not verified (unchecked, verifying or could not verify)', (i) => i.verification !== 'VERIFIED_AT_SOURCE' && i.verification !== 'CONTRADICTED' && i.outreach !== 'ELIGIBLE' && i.outreach !== 'NEEDS_HUMAN_JUDGMENT'],
];

export function AccountSourcesSection({ sources, limit, viewAllHref, researchHref }: { sources: AccountSources; limit?: number; viewAllHref?: string; researchHref?: string }) {
  const events = limit ? groupEvents(sources.items).slice(0, limit) : [];
  return (
    <section className="min-w-0 space-y-2" data-testid="account-sources">
      <h2 className="text-sm font-semibold">Sources / signals</h2>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="account-sources-counts">
        {sourceCounts(sources)}
      </p>
      {sources.items.length ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          A source may matter without being a verified fact; a verified fact may be true without being usable in outreach. You decide what matters.
        </p>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="account-sources-empty">
          GAP has not found a source for this account yet.
        </p>
      )}
      {limit ? (
        <ul>
          {events.map((e) => (
            <li key={e.id} data-testid="source-event" data-unreviewed={e.unreviewed} className="list-none">
              <ul>
                <SourceCard s={e.lead} accountName={sources.accountName} compact />
              </ul>
              {e.more.length ? (
                <p className="-mt-1 pb-2 text-xs text-[var(--muted-foreground)]" data-testid="source-event-more">
                  + {e.more.length} more {e.more.length === 1 ? 'source' : 'sources'} on this story ({e.more.map((m) => m.publisher).slice(0, 3).join(', ')}
                  {e.more.length > 3 ? ', ...' : ''})
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        GROUPS.map(([id, label, test]) => {
          const group = sources.items.filter(test);
          return group.length ? (
            <div key={id} data-testid={`account-sources-group-${id}`}>
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
        {sources.dropped ? <span data-testid="account-sources-dropped">{sources.dropped} not shown: search redirects or broken links</span> : null}
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
