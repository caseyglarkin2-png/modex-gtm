'use client';

/**
 * WATCHING (GAP Signal Intelligence C): the priority accounts GAP asks about,
 * generated from existing data. Casey never configures them; he can fix a
 * wrong or missing alias. Collapsed by default.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { WatchProfile } from '@/lib/gap/signals/watch';

const REASON: Record<string, string> = { priority: 'priority', gap_thesis: 'GAP thesis', audited_for_page: '/for page', buying_committee: 'buying committee' };
const input = 'min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-base sm:text-sm';

export function SignalWatch({ profiles }: { profiles: Array<Pick<WatchProfile, 'accountName' | 'aliases' | 'reasons'>> }) {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [alias, setAlias] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(kind: 'addAliases' | 'removeAliases') {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gap/signal-watch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountName: account.trim(), [kind]: [alias.trim()] }) });
      const b = (await res.json().catch(() => ({}))) as { error?: string };
      setMsg(res.ok ? (kind === 'addAliases' ? 'Alias added.' : 'Alias removed.') : `Not saved: ${(b.error ?? String(res.status)).replace(/_/g, ' ')}`);
      if (res.ok) {
        setAlias('');
        router.refresh();
      }
    } catch {
      setMsg('Not saved: no connection.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <details data-testid="signal-watch" className="rounded-md border border-[var(--border)] p-3 text-sm">
      <summary className="cursor-pointer font-semibold">Watching {profiles.length} accounts</summary>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">GAP asks the news about these accounts every day, a few questions each, and brings back what may matter. Built from your priority list, theses, /for pages and buying committees.</p>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs">
        {profiles.map((p) => (
          <li key={p.accountName} className="break-words">
            <span className="font-medium">{p.accountName}</span>
            <span className="text-[var(--muted-foreground)]"> · {p.reasons.map((r) => REASON[r] ?? r).join(', ')}{p.aliases.length ? ` · also: ${p.aliases.join(', ')}` : ''}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input aria-label="Account" className={input} placeholder="Account" list="signal-watch-accounts" value={account} onChange={(e) => setAccount(e.target.value)} />
        <datalist id="signal-watch-accounts">
          {profiles.map((p) => (
            <option key={p.accountName} value={p.accountName} />
          ))}
        </datalist>
        <input aria-label="Alias" className={input} placeholder="Alias (another name it goes by)" value={alias} onChange={(e) => setAlias(e.target.value)} />
        <button type="button" disabled={busy || !account.trim() || alias.trim().length < 2} onClick={() => void send('addAliases')} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 disabled:opacity-50">
          Add alias
        </button>
        <button type="button" disabled={busy || !account.trim() || alias.trim().length < 2} onClick={() => void send('removeAliases')} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 disabled:opacity-50">
          Remove
        </button>
      </div>
      {msg ? <p className="mt-1 text-xs" role="status">{msg}</p> : null}
    </details>
  );
}
