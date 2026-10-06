'use client';

/**
 * WORK (account-first UX, UX-08): the accounts that need the seller, one card each, in the Work order; the lanes as
 * filter chips whose counts are the contents; a name search. Each card: account, state, why now, next person, next
 * action, blocker, Open. Pure presentation over lib/gap/work/list.ts; the filter and search live in the URL
 * (`?filter=`, `?q=`) so Back to Work restores them (UX-09).
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { filterWork, WORK_FILTER_LABEL, WORK_FILTERS, workCounts, type WorkCard, type WorkFilter } from '@/lib/gap/work/list';
import { saveWorkOrder } from '@/lib/gap/work/order';
import { accountSlug } from '@/lib/gap/account-intel/href';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)]`;
const STATE_TONE: Record<WorkCard['stateKind'], string> = {
  replied: 'text-[var(--primary)]',
  opted_out: 'text-amber-700 dark:text-amber-400',
  bounced: 'text-amber-700 dark:text-amber-400',
  follow_up: 'text-[var(--primary)]',
  ready: 'text-[var(--primary)]',
  decide: '',
  research: 'text-[var(--muted-foreground)]',
  in_deal: 'text-[var(--muted-foreground)]',
  unknown_deal: 'text-amber-700 dark:text-amber-400',
};

function isFilter(v: string | null): v is WorkFilter {
  return !!v && (WORK_FILTERS as readonly string[]).includes(v);
}

export function WorkList({ cards, focus }: { cards: WorkCard[]; /** The card index to focus on arrival (Back to Work). */ focus?: number | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<WorkFilter>(isFilter(params.get('filter')) ? (params.get('filter') as WorkFilter) : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const counts = workCounts(cards);
  const shown = filterWork(cards, filter, query);
  // UX-09: the order Work holds now is what Next account walks, frozen with the filter and the search for Back to Work.
  useEffect(() => {
    saveWorkOrder({ at: new Date().toISOString(), filter, q: query, accounts: cards.map((c) => ({ name: c.accountName, slug: accountSlug(c.accountName) })) });
  }, [cards, filter, query]);
  const focused = useRef(false);
  useEffect(() => {
    if (focused.current || focus === null || focus === undefined) return;
    const el = document.getElementById(`work-card-${focus}`);
    if (el) {
      focused.current = true;
      el.focus();
      el.scrollIntoView({ block: 'center' });
    }
  }, [focus]);
  const setUrl = (f: WorkFilter, q: string) => {
    const p = new URLSearchParams();
    if (f !== 'all') p.set('filter', f);
    if (q.trim()) p.set('q', q.trim());
    router.replace(`/gap${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false });
  };
  return (
    <section className="space-y-3" data-testid="work-list" aria-labelledby="work-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="work-heading" className="text-lg font-semibold">Work</h2>
        <p className="text-xs text-[var(--muted-foreground)]">{cards.length === 1 ? '1 account needs you' : `${cards.length} accounts need you`}, in order. Counts are what the list holds.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter the work by state">
        {WORK_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            className={`${BTN} min-h-9 border px-2.5 text-xs ${filter === f ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] hover:bg-[var(--muted)]'}`}
            onClick={() => {
              setFilter(f);
              setUrl(f, query);
            }}
            data-testid={`work-filter-${f}`}
          >
            {WORK_FILTER_LABEL[f]} {counts[f]}
          </button>
        ))}
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs sm:max-w-xs">
          <span className="sr-only">Search accounts</span>
          <input
            type="search"
            value={query}
            placeholder="Search accounts"
            className="min-h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm"
            onChange={(e) => {
              setQuery(e.target.value);
              setUrl(filter, e.target.value);
            }}
            data-testid="work-search"
          />
        </label>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]" data-testid="work-empty">
          {cards.length === 0 ? 'Nothing needs you right now. Replies, follow ups, ready accounts and new angles show up here.' : 'No account matches this filter.'}
        </p>
      ) : (
        <ol className="space-y-2" data-testid="work-cards">
          {shown.map((c) => (
            <li key={c.accountName} id={`work-card-${c.index}`} tabIndex={-1} className="rounded-md border border-[var(--border)] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" data-testid="work-card" data-account={c.accountName} data-state={c.stateKind} data-lane={c.lane}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-base font-semibold">
                  <Link href={c.href} className="underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="work-card-account">{c.accountName}</Link>
                </p>
                <p className={`text-sm font-medium ${STATE_TONE[c.stateKind]}`} data-testid="work-card-state">{c.state}</p>
              </div>
              <p className="mt-1 text-sm" data-testid="work-card-why">{c.why}</p>
              {c.person ? (
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]" data-testid="work-card-person">
                  <span className="font-medium text-[var(--foreground)]">{c.person.name}</span>
                  {c.person.title ? `, ${c.person.title}` : ''}
                </p>
              ) : null}
              {c.blocker ? <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400" data-testid="work-card-blocker">{c.blocker}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {c.next ? (
                  <Link href={c.next.href} className={PRIMARY} data-testid="work-card-next">{c.next.label}</Link>
                ) : null}
                <Link href={c.href} className={OUTLINE} data-testid="work-card-open">Open {c.accountName}</Link>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
