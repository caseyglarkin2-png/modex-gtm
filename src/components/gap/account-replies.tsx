/**
 * THE ACCOUNT'S WAITING REPLIES (R60, capture once on a reply, 2026-10-07). Presentational, no client state.
 *
 * Each reply from this account that still waits to be recorded, with one control: "Log what they said", which opens
 * Capture with the reply itself (its words, who wrote it, their deal, the message as the source). Capture reviews
 * their words and what the reply means together and records both in one pass, so the account page never shows a
 * second form for the same reply. The record form (DispositionForm) stays for calls and meetings, never beside a reply.
 */
import Link from 'next/link';

export interface WaitingReply {
  id: string;
  from: string;
  receivedAt: string;
  snippet: string;
  /** Capture, opened on this reply. */
  href: string;
  label: string;
}

const day = (iso: string) => (Number.isNaN(Date.parse(iso)) ? '' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }));

export function AccountReplies({ items, accountName }: { items: readonly WaitingReply[]; accountName: string }) {
  if (!items.length) return <p className="text-xs text-[var(--muted-foreground)]" data-testid="account-replies-none">Nothing from {accountName} is waiting to be recorded.</p>;
  return (
    <ul className="space-y-2" data-testid="account-replies">
      {items.map((r) => (
        <li key={r.id} className="space-y-1 text-sm" data-testid="account-reply" data-reply-id={r.id}>
          <p className="text-xs text-[var(--muted-foreground)]">
            {r.from}
            {day(r.receivedAt) ? `, ${day(r.receivedAt)}` : ''}
          </p>
          <p className="break-words">{r.snippet}</p>
          <Link href={r.href} className="inline-flex min-h-11 items-center rounded-md border border-[var(--border)] px-3 text-xs hover:bg-[var(--muted)] sm:min-h-9" data-testid="account-reply-log">
            {r.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
