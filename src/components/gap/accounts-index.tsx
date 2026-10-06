'use client';

/**
 * ACCOUNTS (UX-10): the searchable index of every GAP account. The search box has focus on arrival; typing narrows
 * the list as you type; Enter opens the first match. Pure presentation over lib/gap/accounts/index-list.ts.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { filterAccounts, type AccountIndexRow } from '@/lib/gap/accounts/index-list';

export const INDEX_PAGE = 60;
const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

export function AccountsIndex({ rows, initialQuery = '' }: { rows: AccountIndexRow[]; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const box = useRef<HTMLInputElement>(null);
  useEffect(() => {
    box.current?.focus();
  }, []);
  const matched = filterAccounts(rows, query);
  // A long index renders its first page until a query narrows it (the whole list is never a 90,000 px page).
  const shown = query.trim() ? matched : matched.slice(0, INDEX_PAGE);
  const more = matched.length - shown.length;
  return (
    <section className="space-y-3" data-testid="accounts-index" aria-labelledby="accounts-heading">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          // Enter opens the first MATCH of a typed query, never the first row of the whole index.
          if (query.trim() && shown[0]) router.push(shown[0].href);
        }}
      >
        <label className="flex w-full min-w-0 items-center gap-2 text-sm sm:max-w-md sm:flex-1">
          <span className="sr-only">Search accounts</span>
          <input ref={box} type="search" value={query} placeholder="Type an account name; Enter opens the first match" className="min-h-11 w-full rounded-md border border-[var(--border)] bg-transparent px-3 text-sm" onChange={(e) => setQuery(e.target.value)} data-testid="accounts-search" />
        </label>
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="accounts-count" aria-live="polite">
          {matched.length === rows.length ? `${rows.length} accounts${more ? `, the first ${shown.length} shown: type to find one` : ''}` : `${matched.length} of ${rows.length}`}
        </p>
      </form>
      {matched.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]" data-testid="accounts-empty">No account matches. Add one from Add to GAP.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]" data-testid="accounts-rows">
          {shown.map((r) => (
            <li key={r.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2" data-testid="accounts-row" data-account={r.name}>
              <Link href={r.href} className="min-h-9 font-medium underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="accounts-row-link">{r.name}</Link>
              <span className="text-xs text-[var(--muted-foreground)]">
                {[r.tier, r.vertical?.replace(/_/g, ' '), `${r.people} ${r.people === 1 ? 'person' : 'people'} on record`, r.lastTouchAt ? `last first touch ${day(r.lastTouchAt)}` : 'no GAP touch yet'].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
