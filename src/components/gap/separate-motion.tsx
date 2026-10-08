'use client';

/**
 * RELATED ACCOUNT ACTIVITY: the hold, in words, and Casey's audited way past it (SEPARATE BUYING MOTION: a
 * reason, the related accounts it covers, an expiry). Every other send gate still runs. Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshNow } from '@/components/gap/refresh-now';

export function SeparateMotion({ accountName, detail, relatedAccounts }: { accountName: string; detail: string; relatedAccounts: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gap/accounts/separate-motion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName, relatedAccounts, reason: reason.trim(), days }) });
      const body = ((await res.json().catch(() => ({}))) ?? {}) as { expiresAt?: string; reason?: string; error?: string };
      if (!res.ok) return setMsg(body.reason ?? `Not saved: ${body.error ?? res.status}`);
      setMsg(`Recorded until ${String(body.expiresAt).slice(0, 10)}. Every other gate still runs at the click.`);
      refreshNow(router);
    } catch {
      setMsg('Not saved: the request did not complete.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-2 rounded-md border border-amber-600 px-3 py-2 text-sm" data-testid="related-activity">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Related account activity</p>
      <p>{detail}</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)]" data-testid="separate-motion-open">
          This is a separate buying motion
        </button>
      ) : (
        <div className="space-y-2" data-testid="separate-motion-form">
          <label className="block text-xs">
            Why is it separate from {relatedAccounts.join(', ')}? (recorded with your name)
            <textarea className="min-h-[60px] w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <label className="block text-xs">
            Review again in
            <select className="ml-2 rounded-md border border-[var(--border)] bg-transparent px-1 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {[30, 60, 90, 180].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={busy || reason.trim().length < 10} onClick={() => void save()} className="min-h-[36px] rounded-md bg-[var(--primary)] px-3 text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-60" data-testid="separate-motion-save">
            {busy ? 'Saving...' : 'Record separate buying motion'}
          </button>
        </div>
      )}
      {msg ? <p className="text-xs">{msg}</p> : null}
    </section>
  );
}
