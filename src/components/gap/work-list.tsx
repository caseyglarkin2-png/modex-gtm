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
import { VoicePreviewButton } from '@/components/voice-preview-button';
import { accountHref, accountSlug } from '@/lib/gap/account-intel/href';

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
  held: 'text-amber-700 dark:text-amber-400',
};

function isFilter(v: string | null): v is WorkFilter {
  return !!v && (WORK_FILTERS as readonly string[]).includes(v);
}

export function WorkList({ cards, focus, listenText = null, readAt = null, snoozed = [] }: { cards: WorkCard[]; /** The account (slug) to focus on arrival (Back to Work). */ focus?: string | null; /** UX-11: the spoken brief for today (lib/gap/voice/today.ts), played on a press only. */ listenText?: string | null; /** UX-14: when the read happened, with Refresh to read again. */ readAt?: { at: string; label: string } | null; /** R14: the accounts snoozed out of Work, with their lines. */ snoozed?: Array<{ accountName: string; line: string; until: string }> }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<WorkFilter>(isFilter(params.get('filter')) ? (params.get('filter') as WorkFilter) : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const counts = workCounts(cards);
  // The shown list IS the Work order: its hrefs carry its own positions, and Next account walks what the seller saw.
  const shown = filterWork(cards, filter, query).map((c, k) => ({ ...c, index: k, href: `${accountHref(c.accountName)}?from=work&i=${k}` }));
  useEffect(() => {
    saveWorkOrder({ at: new Date().toISOString(), filter, q: query, accounts: shown.map((c) => ({ name: c.accountName, slug: accountSlug(c.accountName) })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, filter, query]);
  const focused = useRef(false);
  useEffect(() => {
    if (focused.current || !focus) return;
    const el = document.querySelector<HTMLElement>(`[data-testid="work-card"][data-slug="${focus}"]`);
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
        <div className="flex items-center gap-3">
          <h2 id="work-heading" className="text-lg font-semibold">Work</h2>
          {listenText ? <VoicePreviewButton text={listenText} label="Listen to today" className="min-h-11 px-4" /> : null}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {cards.length === 1 ? '1 account needs you' : `${cards.length} accounts need you`}, in order. Counts are what the list holds.
          {readAt ? (
            <>
              {' '}
              <span data-testid="work-read-at">{readAt.label}.</span> <Link href="/gap?fresh=1" className="underline" data-testid="work-refresh">Refresh</Link>
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter the work by state">
        {WORK_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            className={`${BTN} min-h-11 border px-2.5 text-xs sm:min-h-9 ${filter === f ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] hover:bg-[var(--muted)]'}`}
            onClick={() => {
              setFilter(f);
              setUrl(f, query);
            }}
            data-testid={`work-filter-${f}`}
          >
            {WORK_FILTER_LABEL[f]} {counts[f]}
          </button>
        ))}
        <label className="flex min-w-0 basis-full items-center gap-2 text-xs sm:basis-auto sm:flex-1 sm:max-w-xs">
          <span className="sr-only">Search accounts</span>
          <input
            type="search"
            value={query}
            placeholder="Search accounts"
            className="min-h-11 w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:min-h-9"
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
        <ol className="space-y-2 pb-24 sm:pb-0" data-testid="work-cards">
          {shown.map((c) => (
            <li key={c.accountName} id={`work-card-${c.index}`} tabIndex={-1} className="rounded-md border border-[var(--border)] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" data-testid="work-card" data-account={c.accountName} data-slug={accountSlug(c.accountName)} data-state={c.stateKind} data-lane={c.lane}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-base font-semibold">
                  <Link href={c.href} className="inline-flex min-h-11 items-center underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="work-card-account">{c.accountName}</Link>
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
              {c.outcome ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]" data-testid="work-card-outcome">{c.outcome.line}</p> : null}
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
      {snoozed.length ? (
        <details className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="work-snoozed">
          <summary className="min-h-11 cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Snoozed ({snoozed.length}): back on their dates</summary>
          <ul className="mt-1 space-y-1 text-xs">
            {snoozed.map((s) => (
              <li key={s.accountName}>
                <Link href={accountHref(s.accountName)} className="underline">{s.accountName}</Link>: {s.line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
