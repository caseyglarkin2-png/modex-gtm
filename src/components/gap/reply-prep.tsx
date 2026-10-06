/**
 * THE INCOMING MESSAGE AND ITS PREPARED NOTES (GAP OS execution recovery, R42). Presentational only, used on the Work
 * card and on the account page: who wrote, when, the subject and their words, what kind of answer it is, the prepared
 * notes, the fail-closed line (no reply copy family: GAP never writes the reply), "Answer in Gmail" (the thread) and
 * "Record what they said" (the triage form). There is no send control here, by design.
 */
import Link from 'next/link';
import type { ReplyPrep } from '@/lib/gap/replies/prepare';

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

export function ReplyPrepPanel({ prep, compact = false }: { prep: ReplyPrep; compact?: boolean }) {
  return (
    <section className="mt-2 space-y-2 rounded-md border border-sky-600/30 bg-sky-500/5 p-3 text-sm" data-testid="reply-prep" data-reply-kind={prep.kind} data-reply-human={prep.human ?? undefined} aria-label={`${prep.label}: ${prep.fromName ?? prep.from}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-medium" data-testid="reply-prep-label">
          {prep.label}: {prep.fromName ? `${prep.fromName} (${prep.from})` : prep.from}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{when(prep.at)}</p>
      </div>
      {prep.subject ? <p className="text-xs text-[var(--muted-foreground)]">{prep.subject}</p> : null}
      <blockquote className="break-words border-l-2 border-sky-600/50 pl-2 text-sm" data-testid="reply-prep-message">
        {compact && prep.snippet.length > 280 ? `${prep.snippet.slice(0, 280)}...` : prep.snippet}
      </blockquote>
      <ul className="list-disc space-y-0.5 pl-5 text-xs" data-testid="reply-prep-notes" aria-label="Prepared notes">
        {prep.notes.map((n, k) => (
          <li key={k}>{n}</li>
        ))}
      </ul>
      {prep.noCopyLine ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="reply-prep-no-copy">{prep.noCopyLine}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <a href={prep.threadHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)] sm:min-h-9" data-testid="reply-prep-thread">
          Answer in Gmail
        </a>
        {prep.record ? (
          <Link href={prep.record.href} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)] sm:min-h-9" data-testid="reply-prep-record">
            {prep.record.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
