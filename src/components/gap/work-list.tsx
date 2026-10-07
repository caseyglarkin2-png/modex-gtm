'use client';

/**
 * WORK (account-first UX, UX-08; ranked by commercial obligations, R41): the accounts that need the seller today, one
 * card each, every obligation due today visible on its card with its own Done, Snooze and Skip; why each card sits
 * where it does; the lanes as filter chips whose counts are the contents; a name search; the seller's explicit
 * priority per account; and the Waiting and Snoozed footers, counted, so "needs you" is only what needs the seller
 * today. Pure presentation over lib/gap/work/list.ts plus three recorded actions (commitment status, the account
 * priority), each a session route that writes one append-only row; the filter and search live in the URL (UX-09).
 */
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { filterWork, needsYouCard, WORK_FILTER_LABEL, WORK_FILTERS, workCounts, type WaitingItem, type WorkCard, type WorkFilter } from '@/lib/gap/work/list';
import { saveWorkOrder } from '@/lib/gap/work/order';
import { VoicePreviewButton } from '@/components/voice-preview-button';
import { accountHref, accountSlug } from '@/lib/gap/account-intel/href';
import { ReplyPrepPanel } from './reply-prep';
import { ObligationActions, postJson as post, REFUSAL_TEXT } from './obligation-actions';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)]`;
const SMALL = 'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-2.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60 sm:min-h-9';
const INPUT = 'min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:min-h-9';
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
  committed: 'text-[var(--primary)]',
  meeting: 'text-[var(--primary)]',
};

function isFilter(v: string | null): v is WorkFilter {
  return !!v && (WORK_FILTERS as readonly string[]).includes(v);
}

/** The seller's explicit priority on the account, with a one-line reason. */
function PriorityControl({ c }: { c: WorkCard }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  async function save(level: 'high' | 'clear') {
    const r = await post('/api/gap/accounts/priority', { accountName: c.accountName, level, ...(level === 'high' ? { reason: reason.trim() } : {}) });
    if (!r.ok) {
      setStatus(`Not recorded: ${REFUSAL_TEXT[r.error ?? ''] ?? r.error}.`);
      return;
    }
    setOpen(false);
    setStatus(null);
    router.refresh();
  }
  if (c.priority) {
    return (
      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]" data-testid="work-card-priority">
        <span>Your priority: {c.priority.reason}</span>
        <button type="button" className="underline" onClick={() => void save('clear')} data-testid="work-priority-clear">Clear</button>
        {status ? <span role="status">{status}</span> : null}
      </p>
    );
  }
  if (!open) return <button type="button" className="text-xs underline text-[var(--muted-foreground)]" onClick={() => setOpen(true)} data-testid="work-priority-open">Prioritize</button>;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      <label className="flex min-w-0 flex-1 items-center gap-2">
        <span className="shrink-0">Why first?</span>
        <input className={`${INPUT} min-w-0 flex-1`} maxLength={140} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="work-priority-reason" />
      </label>
      <button type="button" className={SMALL} disabled={!reason.trim()} onClick={() => void save('high')} data-testid="work-priority-save">Save</button>
      <button type="button" className={SMALL} onClick={() => setOpen(false)}>Cancel</button>
      {status ? <span role="status">{status}</span> : null}
    </div>
  );
}

export function WorkList({
  cards,
  focus,
  listenText = null,
  readAt = null,
  snoozed = [],
  waiting = [],
  counts = null,
}: {
  cards: WorkCard[];
  /** The account (slug) to focus on arrival (Back to Work). */ focus?: string | null;
  /** UX-11: the spoken brief for today (lib/gap/voice/today.ts), played on a press only. */ listenText?: string | null;
  /** UX-14: when the read happened, with Refresh to read again. */ readAt?: { at: string; label: string } | null;
  /** R14 / R41: what the seller put away until a date (accounts and obligations), with their lines. */ snoozed?: Array<{ key?: string; accountName: string; line: string; until: string }>;
  /** R41: not today: waiting on someone, or due on a later day. Counted, never cards. */ waiting?: WaitingItem[];
  /** R41: the counts (needs you = the cards that need the seller; the footers count what they list). */ counts?: { needsYou: number; parked?: number; obligationsDue: number; waiting: number; snoozed: number } | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [filter, setFilter] = useState<WorkFilter>(isFilter(params.get('filter')) ? (params.get('filter') as WorkFilter) : 'all');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const chips = workCounts(cards);
  // The shown list IS the Work order: its hrefs carry its own positions, and Next account walks what the seller saw.
  // Batch item 8: the cards that need the seller first, then the parked ones (research, holds, set aside), each in order.
  const filtered = filterWork(cards, filter, query);
  const shown = [...filtered.filter(needsYouCard), ...filtered.filter((c) => !needsYouCard(c))].map((c, k) => ({ ...c, index: k, href: `${accountHref(c.accountName)}?from=work&i=${k}` }));
  const shownNeeds = shown.filter(needsYouCard);
  const shownParked = shown.filter((c) => !needsYouCard(c));
  const needCount = cards.filter(needsYouCard).length;
  const parkedCount = cards.length - needCount;
  const NOTHING = 'Nothing needs you right now. Replies, follow ups, ready accounts and new angles show up here.';
  const emptyText = shown.length === 0 ? (cards.length === 0 ? NOTHING : 'No account matches this filter.') : shownNeeds.length === 0 && filter === 'all' && !query.trim() ? NOTHING : null;
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
  const due = counts?.obligationsDue ?? cards.reduce((n, c) => n + (c.obligations?.length ?? 0), 0);
  return (
    <section className="space-y-3" data-testid="work-list" aria-labelledby="work-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-3">
          <h2 id="work-heading" className="text-lg font-semibold">Work</h2>
          {listenText ? <VoicePreviewButton text={listenText} label="Listen to today" className="min-h-11 px-4" /> : null}
        </div>
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="work-needs-you">
          {needCount === 0 ? 'Nothing needs you today.' : `${needCount === 1 ? '1 account needs you' : `${needCount} accounts need you`} today, in order${due ? `; ${due} ${due === 1 ? 'obligation' : 'obligations'} due on them` : ''}.`}
          {parkedCount ? ` ${parkedCount} ${needCount ? 'more ' : ''}${parkedCount === 1 ? 'account is' : 'accounts are'} parked: research, holds or set aside.` : ''} Counts are what the list holds.
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
            {WORK_FILTER_LABEL[f]} {chips[f]}
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
      {emptyText ? (
        <p className="text-sm italic text-[var(--muted-foreground)]" data-testid="work-empty">
          {emptyText}
        </p>
      ) : null}
      {[{ list: shownNeeds, testId: 'work-cards' }, { list: shownParked, testId: 'work-parked-cards' }].map(({ list, testId }) => list.length === 0 ? null : (
        <div key={testId}>
          {testId === 'work-parked-cards' ? (
            <h3 className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="work-parked-heading">
              Parked ({list.length}): research, holds and set aside. Nothing here needs you today.
            </h3>
          ) : null}
        <ol className="space-y-2 pb-24 sm:pb-0" data-testid={testId}>
          {list.map((c) => (
            <li key={c.accountName} id={`work-card-${c.index}`} tabIndex={-1} className="rounded-md border border-[var(--border)] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" data-testid="work-card" data-account={c.accountName} data-slug={accountSlug(c.accountName)} data-state={c.stateKind} data-lane={c.lane} data-tier={c.tier ?? undefined}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-base font-semibold">
                  <Link href={c.href} className="inline-flex min-h-11 items-center underline decoration-dotted underline-offset-2 hover:decoration-solid" data-testid="work-card-account">{c.accountName}</Link>
                </p>
                <p className={`text-sm font-medium ${STATE_TONE[c.stateKind]}`} data-testid="work-card-state">{c.state}</p>
              </div>
              {c.rankWhy ? <p className="text-xs text-[var(--muted-foreground)]" data-testid="work-card-rank">{c.rankWhy}</p> : null}
              <p className="mt-1 text-sm" data-testid="work-card-why">{c.why}</p>
              {c.person ? (
                <p className="mt-0.5 text-sm text-[var(--muted-foreground)]" data-testid="work-card-person">
                  <span className="font-medium text-[var(--foreground)]">{c.person.name}</span>
                  {c.person.title ? `, ${c.person.title}` : ''}
                </p>
              ) : null}
              {c.blocker ? <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400" data-testid="work-card-blocker">{c.blocker}</p> : null}
              {c.outcome ? <p className="mt-0.5 text-xs text-[var(--muted-foreground)]" data-testid="work-card-outcome">{c.outcome.line}</p> : null}
              {c.reply ? <ReplyPrepPanel prep={c.reply} compact /> : null}
              {c.stalled?.length ? (
                <ul className="mt-1 space-y-0.5 text-xs" data-testid="work-card-stalled">
                  {c.stalled.map((s) => <li key={s}>Stalled: {s}</li>)}
                </ul>
              ) : null}
              {c.obligations?.length ? (
                <ul className="mt-2 space-y-2 border-l-2 border-[var(--primary)] pl-3" data-testid="work-obligations" aria-label={`Due at ${c.accountName}`}>
                  {c.obligations.map((o) => (
                    <li key={o.key} data-testid="work-obligation" data-commitment-id={o.commitmentId ?? undefined} data-kind={o.kind}>
                      <p className="text-sm font-medium">{o.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {o.line}
                        {o.person?.name || o.person?.email ? ` ${o.person.name ?? o.person.email}.` : ''}
                      </p>
                      {o.basis ? <p className="break-words text-xs italic text-[var(--muted-foreground)]">{o.basis}</p> : null}
                      {o.scope ? <p className="text-xs font-semibold text-[var(--muted-foreground)]" data-testid="work-obligation-scope">{o.scope}</p> : null}
                      {o.prep ? <p className="text-xs" data-testid="work-obligation-prep">Prepared: {o.prep}</p> : null}
                      <div className="flex flex-wrap items-center gap-2">
                        {o.href && o.label ? <Link href={o.href} className="inline-flex min-h-11 items-center text-xs underline sm:min-h-9" data-testid="obligation-open">{o.label}</Link> : null}
                      </div>
                      <ObligationActions commitmentId={o.commitmentId} proofNeeded={o.proofNeeded ?? null} />
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {c.next ? (
                  <Link href={c.next.href} className={PRIMARY} data-testid="work-card-next">{c.next.label}</Link>
                ) : null}
                <Link href={c.href} className={OUTLINE} data-testid="work-card-open">Open {c.accountName}</Link>
                {c.capture ? <Link href={c.capture.href} className="inline-flex min-h-11 items-center text-sm underline" data-testid="work-card-capture">{c.capture.label}</Link> : null}
              </div>
              {c.tier !== undefined ? <div className="mt-1"><PriorityControl c={c} /></div> : null}
            </li>
          ))}
        </ol>
        </div>
      ))}
      {waiting.length ? (
        <details className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="work-waiting">
          <summary className="min-h-11 cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Waiting ({waiting.length}): not today</summary>
          <ul className="mt-1 space-y-1 text-xs">
            {waiting.map((w) => (
              <li key={w.key} data-testid="work-waiting-item">
                <Link href={accountHref(w.accountName)} className="underline">{w.accountName}</Link>: {w.title}. {w.line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {snoozed.length ? (
        <details className="rounded-md border border-[var(--border)] px-3 py-2 text-sm" data-testid="work-snoozed">
          <summary className="min-h-11 cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Snoozed ({snoozed.length}): back on their dates</summary>
          <ul className="mt-1 space-y-1 text-xs">
            {snoozed.map((s) => (
              <li key={s.key ?? s.accountName}>
                <Link href={accountHref(s.accountName)} className="underline">{s.accountName}</Link>: {s.line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
