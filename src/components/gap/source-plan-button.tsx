'use client';

/** PLAN NOW: qualify this source's accounts now (bounded). Research itself runs in the background, account by account. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SourcePlanButton({ workSourceId }: { workSourceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function plan() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/gap/sources/${encodeURIComponent(workSourceId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'plan' }) });
    const body = ((await res.json().catch(() => ({}))) ?? {}) as { accounts?: number; deferredAccounts?: number; changed?: number; error?: string };
    setBusy(false);
    if (!res.ok) return setMsg(`Not planned: ${body.error ?? res.status}`);
    setMsg(`Qualified ${body.accounts ?? 0} accounts${body.deferredAccounts ? `, ${body.deferredAccounts} more next run` : ''}. Research runs in the background; nothing is sent.`);
    router.refresh();
  }
  return (
    <div className="space-y-1">
      <button type="button" data-testid="source-plan" disabled={busy} onClick={() => void plan()} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--muted)] disabled:opacity-60">
        {busy ? 'Qualifying...' : 'Qualify accounts now'}
      </button>
      {msg ? <p className="text-xs" data-testid="source-plan-result">{msg}</p> : null}
    </div>
  );
}
