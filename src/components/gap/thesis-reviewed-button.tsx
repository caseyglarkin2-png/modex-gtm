'use client';

/** "I reviewed it, keep it": clears a THESIS NEEDS REVIEW flag until the next material change. Never rewrites the thesis. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ThesisReviewedButton({ hypothesisId }: { hypothesisId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function mark() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/gap/accounts/thesis-reviewed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hypothesisId }) });
      if (!res.ok) return setErr(String(((await res.json().catch(() => ({}))) as { reason?: string; error?: string }).reason ?? res.status));
      router.refresh();
    } catch {
      setErr('Not saved: the request did not complete.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button type="button" disabled={busy} onClick={() => void mark()} className="min-h-[32px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60" data-testid="thesis-reviewed">
        {busy ? 'Saving...' : 'Reviewed, keep it'}
      </button>
      {err ? <span className="text-xs text-amber-700">{err}</span> : null}
    </span>
  );
}
