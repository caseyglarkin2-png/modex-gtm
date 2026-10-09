'use client';

/**
 * DONE, NEXT (account-first UX, UX-09; execution recovery R14, 2026-10-06): one bar under NEXT when the account was
 * opened from Work. Navigation records nothing: Back, Next account and Back to Work are plain links that walk the
 * order Work held when it was opened. What the seller DID is recorded by its own control, through
 * POST /api/gap/accounts/outcome (an append-only audit row, work/outcome.ts), and only then moves on:
 *
 *   Skip today          the card drops to the end of Work until tomorrow
 *   Snooze              the card leaves Work until the date the seller picks (a week by default)
 *   Logged outside GAP  a call or a conversation GAP did not run: the note is kept; it never claims a send
 *
 * Sent, drafted and replied are recorded by the email, the draft and the disposition themselves, never here.
 * Not a wizard: every link is a plain link, the seller can leave at any point, and a deep link without the order
 * still offers Back to Work.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { doneNextLinks, readWorkOrder, type DoneNextLinks } from '@/lib/gap/work/order';
import { postAction, type ActionResult } from '@/lib/gap/ui/action-result';
import { refreshNow } from './refresh-now';

const BTN = 'inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium';
const PRIMARY = `${BTN} bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90`;
const OUTLINE = `${BTN} border border-[var(--border)] hover:bg-[var(--muted)] disabled:opacity-60`;

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const dateInput = (d: Date) => d.toISOString().slice(0, 10);

export function DoneNext({ slug, index, accountName }: { slug: string; index: number | null; /** The account's name for the outcome record (absent on a legacy render: the controls then stay hidden). */ accountName?: string | null }) {
  const router = useRouter();
  // The order lives in session storage: read after mount (the server renders the bar with Back to Work only).
  const [links, setLinks] = useState<DoneNextLinks>(() => doneNextLinks(null, index, slug));
  useEffect(() => {
    setLinks(doneNextLinks(readWorkOrder(), index, slug));
  }, [index, slug]);
  const [mode, setMode] = useState<'idle' | 'snooze' | 'logged'>('idle');
  const [until, setUntil] = useState(() => dateInput(addDays(new Date(), 7)));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'status' | 'alert'; text: string; result: ActionResult | null } | null>(null);
  const [last, setLast] = useState<'skipped' | 'snoozed' | 'logged' | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  async function record(kind: 'skipped' | 'snoozed' | 'logged') {
    if (!accountName) return;
    setBusy(true);
    setStatus(null);
    setLast(kind);
    const body: Record<string, unknown> = { accountName, kind };
    if (kind === 'snoozed') body.until = new Date(`${until}T12:00:00Z`).toISOString();
    if (kind === 'logged' && note.trim()) body.reason = note.trim();
    // C44: never a throw; a refusal keeps its words and nothing changed; an incomplete request may have applied (reload).
    const r = await postAction('/api/gap/accounts/outcome', body, { verb: 'Recorded', source: accountName, refusedLine: (code) => `Could not record it (${code}). Nothing changed.` });
    setBusy(false);
    if (r.state !== 'accepted' && r.state !== 'queued') {
      setStatus({ kind: 'alert', text: r.line, result: r });
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    setStatus({ kind: 'status', text: `${r.line} ${links.next ? 'Moving to the next account.' : 'Back to Work.'}`, result: r });
    setMode('idle');
    router.push(links.next ? links.next.href : links.backToWork);
  }

  return (
    <nav className="space-y-2 rounded-md border border-[var(--border)] px-3 py-2" aria-label="Work order" data-testid="done-next" data-position={links.position ? `${links.position.n}/${links.position.of}` : 'none'}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 basis-full text-xs text-[var(--muted-foreground)] sm:basis-auto sm:flex-1" data-testid="done-next-position">
          {links.position ? `Account ${links.position.n} of ${links.position.of} in Work.${links.next ? '' : ' The last one.'}` : 'Opened from Work.'}
        </p>
        {links.back ? (
          <Link href={links.back.href} className={OUTLINE} data-testid="done-next-back" aria-label={`Back to ${links.back.name}`}>
            Back
          </Link>
        ) : null}
        <Link href={links.backToWork} className={links.next ? OUTLINE : PRIMARY} data-testid="done-next-work">
          Back to Work
        </Link>
        {links.next ? (
          <Link href={links.next.href} className={PRIMARY} data-testid="done-next-next" aria-label={`Next account: ${links.next.name}`}>
            Next account
          </Link>
        ) : null}
      </div>
      {accountName ? (
        <div className="flex flex-wrap items-center gap-2" data-testid="done-next-outcomes">
          <span className="text-xs text-[var(--muted-foreground)]">Or record what you did:</span>
          <button type="button" className={OUTLINE} disabled={busy} onClick={() => void record('skipped')} data-testid="done-next-skip">Skip today</button>
          <button type="button" className={OUTLINE} disabled={busy} aria-expanded={mode === 'snooze'} onClick={() => setMode(mode === 'snooze' ? 'idle' : 'snooze')} data-testid="done-next-snooze">Snooze</button>
          <button type="button" className={OUTLINE} disabled={busy} aria-expanded={mode === 'logged'} onClick={() => setMode(mode === 'logged' ? 'idle' : 'logged')} data-testid="done-next-logged">Logged outside GAP</button>
        </div>
      ) : null}
      {mode === 'snooze' ? (
        <form
          className="flex flex-wrap items-end gap-2"
          data-testid="done-next-snooze-form"
          onSubmit={(e) => {
            e.preventDefault();
            void record('snoozed');
          }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span>Back on</span>
            <input type="date" value={until} min={dateInput(addDays(new Date(), 1))} max={dateInput(addDays(new Date(), 90))} className="min-h-11 rounded-md border border-[var(--border)] bg-transparent px-2 text-sm" onChange={(e) => setUntil(e.target.value)} data-testid="done-next-snooze-until" />
          </label>
          <button type="submit" className={PRIMARY} disabled={busy} data-testid="done-next-snooze-confirm">{busy ? 'Recording...' : 'Snooze until then'}</button>
        </form>
      ) : null}
      {mode === 'logged' ? (
        <form
          className="flex flex-wrap items-end gap-2"
          data-testid="done-next-logged-form"
          onSubmit={(e) => {
            e.preventDefault();
            void record('logged');
          }}
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
            <span>What happened (a call, a conversation; never a send GAP did not prove)</span>
            <input type="text" value={note} maxLength={240} className="min-h-11 w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm" onChange={(e) => setNote(e.target.value)} data-testid="done-next-logged-note" />
          </label>
          <button type="submit" className={PRIMARY} disabled={busy} data-testid="done-next-logged-confirm">{busy ? 'Recording...' : 'Record it'}</button>
        </form>
      ) : null}
      <p ref={statusRef} tabIndex={-1} role={status?.kind === 'alert' ? 'alert' : 'status'} aria-live="polite" className={`text-xs outline-none ${status?.kind === 'alert' ? 'text-red-700 dark:text-red-400' : 'text-[var(--muted-foreground)]'}`} data-testid="done-next-status" data-state={status?.result?.state ?? 'idle'}>
        {status?.text ?? ''}
        {status?.result?.retry && last ? (
          <>
            {' '}
            <button type="button" className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60" disabled={busy} onClick={() => void record(last)} data-testid="done-next-status-retry">
              Try again
            </button>
          </>
        ) : null}
        {status?.result?.next?.kind === 'reload' ? (
          <>
            {' '}
            <button type="button" className="rounded border border-[var(--border)] px-1.5 py-0.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60" disabled={busy} onClick={() => refreshNow(router)} data-testid="done-next-status-reload">
              {status.result.next.label}
            </button>
          </>
        ) : null}
      </p>
    </nav>
  );
}
