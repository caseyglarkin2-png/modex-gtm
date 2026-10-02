'use client';
/**
 * The note backlog, grouped OPEN / LATER / FIXED / DISMISSED, newest first. Actions: mark fixed, later, dismiss,
 * reopen, and copy a debug packet (what Casey said, where, the objects, the build, the route, the error, the time).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { debugPacket as debugPacketOf, type FeedbackItem as FeedbackListItem } from '@/lib/gap/feedback/packet';

const GROUPS: Array<[FeedbackListItem['status'], string]> = [
  ['open', 'Open'],
  ['later', 'Later'],
  ['fixed', 'Fixed'],
  ['dismissed', 'Dismissed'],
];

export function FeedbackList({ items }: { items: FeedbackListItem[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  async function mark(id: string, status: FeedbackListItem['status']) {
    setBusy(id);
    try {
      await fetch(`/api/gap/feedback/${encodeURIComponent(id)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }
  async function copy(f: FeedbackListItem) {
    try {
      await navigator.clipboard.writeText(debugPacketOf(f));
      setCopied(f.id);
    } catch {
      setCopied(null);
    }
  }
  if (!items.length) return <p className="text-sm text-[var(--muted-foreground)]" data-testid="feedback-empty">No notes yet. Tap Note on any GAP screen.</p>;
  const btn = 'rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-50';
  return (
    <div className="space-y-4">
      {GROUPS.map(([status, label]) => {
        const group = items.filter((i) => i.status === status);
        if (!group.length) return null;
        const body = (
          <ul className="space-y-2">
            {group.map((f) => (
              <li key={f.id} className="min-w-0 rounded-md border border-[var(--border)] p-2 text-sm" data-testid="feedback-item" data-status={f.status}>
                <p className="whitespace-pre-wrap break-words">{f.note}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {f.type ?? 'unclassified'} · {f.createdAt.slice(0, 16).replace('T', ' ')} UTC · {f.context.surface ?? 'unknown surface'}
                  {f.context.accountName || f.context.accountSlug ? ` · ${f.context.accountName ?? f.context.accountSlug}` : ''}
                  {f.context.errorCode ? ` · error ${f.context.errorCode}` : ''} · build {f.build ? f.build.slice(0, 8) : 'unknown'}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {f.status !== 'fixed' ? <button type="button" disabled={busy === f.id} onClick={() => void mark(f.id, 'fixed')} className={btn}>Mark fixed</button> : null}
                  {f.status !== 'later' ? <button type="button" disabled={busy === f.id} onClick={() => void mark(f.id, 'later')} className={btn}>Later</button> : null}
                  {f.status !== 'dismissed' ? <button type="button" disabled={busy === f.id} onClick={() => void mark(f.id, 'dismissed')} className={btn}>Dismiss</button> : null}
                  {f.status !== 'open' ? <button type="button" disabled={busy === f.id} onClick={() => void mark(f.id, 'open')} className={btn}>Reopen</button> : null}
                  <button type="button" onClick={() => void copy(f)} className={btn} data-testid="feedback-copy">
                    {copied === f.id ? 'Copied' : 'Copy debug packet'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        );
        return (
          <section key={status} data-testid={`feedback-group-${status}`}>
            {status === 'open' ? (
              <>
                <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide">{label} ({group.length})</h2>
                {body}
              </>
            ) : (
              <details>
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide">{label} ({group.length})</summary>
                <div className="mt-1">{body}</div>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}
