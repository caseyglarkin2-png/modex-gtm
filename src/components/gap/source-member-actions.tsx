'use client';

/**
 * Casey's decision on one member of a work source: RESEARCH MORE (ask GAP to
 * research this account next), NOT NOW, IGNORE. Audited; nothing is sent.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const btn = 'min-h-[36px] rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-60';

export function SourceMemberActions({ memberId, status, canResearch }: { memberId: string; status: string; canResearch: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function set(next: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/gap/sources/members/${encodeURIComponent(memberId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    if (!res.ok) return setError(String(((await res.json().catch(() => ({}))) as { error?: string }).error ?? res.status));
    router.refresh();
  }
  if (status !== 'active') {
    return (
      <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
        {status === 'research_requested' ? 'Research requested' : status === 'not_now' ? 'Not now' : 'Ignored'}
        <button type="button" className={btn} disabled={busy} onClick={() => void set('active')} data-testid="member-undo">
          Undo
        </button>
      </span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1" data-testid="member-actions">
      {canResearch ? (
        <button type="button" className={btn} disabled={busy} onClick={() => void set('research_requested')} data-testid="member-research">
          Research more
        </button>
      ) : null}
      <button type="button" className={btn} disabled={busy} onClick={() => void set('not_now')} data-testid="member-not-now">
        Not now
      </button>
      <button type="button" className={btn} disabled={busy} onClick={() => void set('ignored')} data-testid="member-ignore">
        Ignore
      </button>
      {error ? <span role="alert" className="text-xs text-[var(--destructive)]">{error}</span> : null}
    </span>
  );
}
