'use client';

/**
 * SIGNAL INBOX (GAP Signal Intelligence): WHAT HAPPENED THAT MAY MATTER?
 * Distinct from the Verified Evidence Inbox (what have we verified that Casey
 * can use). One row per event (other sources of the same event are counted,
 * never lost). Actions: research, assign account, ignore, open source, and
 * lightweight feedback. No Pounce diagnostics by default.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SignalView } from '@/lib/gap/signals/ops';

const TONE: Record<string, string> = {
  'Needs you': 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
  'Fact ready': 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
  Researching: 'bg-sky-500/15 text-sky-800 dark:text-sky-300',
};
const btn = 'rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] disabled:opacity-50';
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }) : null);

function SignalRow({ s }: { s: SignalView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pick, setPick] = useState(s.candidates[0]?.name ?? '');
  const [typed, setTyped] = useState('');

  async function op(body: Record<string, unknown>, done: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/gap/signal-intake/${encodeURIComponent(s.id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? done : `Not done: ${(b.error ?? String(res.status)).replace(/_/g, ' ')}`);
      if (res.ok) router.refresh();
    } catch {
      setMsg('Not done: no connection.');
    } finally {
      setBusy(false);
    }
  }

  const needsAccount = s.resolution === 'needs_account' || s.resolution === 'ambiguous';
  return (
    <li data-testid="signal-row" className="space-y-2 rounded-md border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 font-semibold ${TONE[s.status] ?? 'bg-[var(--muted)]'}`} data-testid="signal-status">
          {s.status}
        </span>
        <span className="font-semibold">{s.accountName ?? (s.accountHint ? `"${s.accountHint}"?` : 'Account unknown')}</span>
        {s.caseyShared ? <span className="text-[var(--muted-foreground)]">you shared</span> : null}
        <span className="text-[var(--muted-foreground)]">{s.sourceName ?? s.sourceClass}{s.publishedAt ? ` · ${day(s.publishedAt)}` : ` · captured ${day(s.capturedAt)}`}</span>
        {s.alsoCoveredBy ? <span className="text-[var(--muted-foreground)]">+{s.alsoCoveredBy} more source{s.alsoCoveredBy === 1 ? '' : 's'}</span> : null}
      </div>
      <p className="break-words text-sm font-medium">{s.title ?? (s.url ? s.url : 'Your note')}</p>
      {s.note ? <p className="break-words text-sm italic text-[var(--muted-foreground)]">Your note: {s.note}</p> : null}
      <p className="text-xs text-[var(--muted-foreground)]">{s.statusDetail} {s.why}</p>

      {needsAccount ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {s.candidates.length ? (
            <select aria-label="Account" className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm" value={pick} onChange={(e) => setPick(e.target.value)}>
              {s.candidates.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.why})
                </option>
              ))}
            </select>
          ) : (
            <input aria-label="Account" placeholder="Which account?" className="min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-base sm:text-sm" value={typed} onChange={(e) => setTyped(e.target.value)} />
          )}
          <button type="button" className={btn} disabled={busy || !(s.candidates.length ? pick : typed.trim())} onClick={() => void op({ op: 'assign', accountName: s.candidates.length ? pick : typed.trim() }, 'Account set.')}>
            Assign account
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {s.url && !needsAccount && (s.researchStatus === 'none' || s.researchStatus === 'no_usable_fact') ? (
          <button type="button" className={btn} disabled={busy} onClick={() => void op({ op: 'research' }, 'Queued for research.')}>
            Research
          </button>
        ) : null}
        {s.url ? (
          <a href={s.url} target="_blank" rel="noopener noreferrer" className={btn}>
            Open source
          </a>
        ) : null}
        {s.researchStatus === 'fact_found' || s.researchStatus === 'contradiction' ? (
          <Link href="/gap?lane=research" className={btn}>
            See it in Research
          </Link>
        ) : null}
        <button type="button" className={btn} disabled={busy} onClick={() => void op({ op: 'ignore' }, 'Ignored.')}>
          Ignore
        </button>
        <details className="text-sm">
          <summary className="cursor-pointer select-none rounded-md px-2 py-2 text-[var(--muted-foreground)]">More</summary>
          <div className="mt-1 flex flex-wrap gap-2">
            {(
              [
                ['irrelevant', 'Irrelevant'],
                ['wrong_account', 'Wrong account'],
                ['already_knew', 'Already knew'],
                ['good_context', 'Good context'],
                ['not_sayable', 'Not sayable'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} type="button" className={btn} disabled={busy} onClick={() => void op({ op: 'feedback', value: v }, `Marked ${label.toLowerCase()}.`)}>
                {label}
              </button>
            ))}
          </div>
        </details>
      </div>
      {msg ? <p className="text-xs" role="status">{msg}</p> : null}
    </li>
  );
}

export function SignalInbox({ items }: { items: SignalView[] }) {
  if (items.length === 0) return <p className="text-sm italic text-[var(--muted-foreground)]">No signals yet. Share a link above; GAP also watches your priority accounts.</p>;
  return (
    <ul className="space-y-3" data-testid="signal-inbox">
      {items.map((s) => (
        <SignalRow key={s.id} s={s} />
      ))}
    </ul>
  );
}
