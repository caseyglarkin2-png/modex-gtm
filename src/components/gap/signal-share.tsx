'use client';

/**
 * SHARE TO GAP (GAP Signal Intelligence): the fastest way to hand GAP
 * something that may matter. A link is enough; the account and a one-line
 * note are optional. The default intent is FOLLOW THIS UP: remember it,
 * resolve the account, research the real event, verify what can be verified.
 * It never emails anyone. Conference mode takes a note with no link: that is
 * Casey's private context, never public evidence.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SignalView } from '@/lib/gap/signals/ops';
import { BUYER_WORDS } from '@/lib/gap/capture/buyer-words';
import { refreshNow } from '@/components/gap/refresh-now';

const input = 'w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base';

const STATUS_TONE: Record<string, string> = {
  'Needs you': 'text-amber-700 dark:text-amber-400',
  'Fact ready': 'text-emerald-700 dark:text-emerald-400',
};

export function SignalShare({ initialUrl = '', initialAccount = '', initialNote = '' }: { initialUrl?: string; initialAccount?: string; initialNote?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'link' | 'conference'>('link');
  const [url, setUrl] = useState(initialUrl);
  const [account, setAccount] = useState(initialAccount);
  const [note, setNote] = useState(initialNote);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ signal: SignalView; created: boolean } | null>(null);

  useEffect(() => {
    const q = account.trim();
    if (q.length < 2 || accounts.includes(q)) return;
    const t = setTimeout(() => {
      fetch(`/api/gap/capture/lookup?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { accounts: [] }))
        .then((b: { accounts?: string[] }) => setAccounts(b.accounts ?? []))
        .catch(() => setAccounts([]));
    }, 250);
    return () => clearTimeout(t);
  }, [account, accounts]);

  async function save() {
    setSaving(true);
    setError(null);
    let res: Response;
    try {
      res = await fetch('/api/gap/signal-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mode === 'link' ? url.trim() : null, account: account.trim() || null, note: note.trim() || null, kind: mode }),
      });
    } catch {
      setSaving(false);
      setError('No connection. Nothing was lost: press Save again when you have signal.');
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { signal?: SignalView; created?: boolean; error?: string };
    setSaving(false);
    if (!res.ok || !body.signal) {
      setError(body.error === 'bad_url' ? 'That does not look like a web link.' : body.error === 'url_or_note_required' ? 'Paste a link, or write a note.' : `Not saved: ${body.error ?? res.status}`);
      return;
    }
    setSaved({ signal: body.signal, created: !!body.created });
    refreshNow(router);
  }

  if (saved) {
    const s = saved.signal;
    return (
      <section data-testid="signal-saved" className="space-y-3 rounded-md border border-[var(--border)] p-4">
        <p className="text-base font-semibold">{saved.created ? 'Saved. GAP will follow it up.' : 'Already in GAP. GAP remembered that you shared it.'}</p>
        <p className="break-words text-sm">{s.title ?? s.url ?? s.note}</p>
        <p className={`text-sm font-medium ${STATUS_TONE[s.status] ?? ''}`} data-testid="signal-saved-status">
          {s.status}: {s.statusDetail}
        </p>
        {s.accountName ? <p className="text-xs text-[var(--muted-foreground)]">Account: {s.accountName}</p> : null}
        {!s.url && s.note && BUYER_WORDS.test(s.note) ? (
          <p className="text-xs">
            This sounds like a buyer&apos;s own words. If it came from a real conversation, <Link href="/gap/capture" className="underline">capture it as buyer truth</Link> so you can confirm it.
          </p>
        ) : null}
        <button
          type="button"
          data-testid="signal-share-another"
          onClick={() => {
            setSaved(null);
            setUrl('');
            setNote('');
          }}
          className="w-full rounded-md border border-[var(--border)] px-4 py-3 text-base sm:w-auto"
        >
          Share another
        </button>
      </section>
    );
  }

  return (
    <section data-testid="signal-share" className="space-y-3 rounded-md border border-[var(--border)] p-4">
      <div className="flex gap-2 text-sm" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'link'} onClick={() => setMode('link')} className={`min-h-[44px] rounded-md px-3 py-2 ${mode === 'link' ? 'bg-[var(--muted)] font-semibold' : ''}`}>
          Link
        </button>
        <button type="button" role="tab" aria-selected={mode === 'conference'} data-testid="signal-mode-conference" onClick={() => setMode('conference')} className={`min-h-[44px] rounded-md px-3 py-2 ${mode === 'conference' ? 'bg-[var(--muted)] font-semibold' : ''}`}>
          Heard it (no link)
        </button>
      </div>
      {mode === 'link' ? (
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Link</span>
          <input data-testid="signal-url" className={input} type="url" inputMode="url" autoComplete="off" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]">Something you heard or saw with no link. GAP keeps it as your context. It never becomes public evidence.</p>
      )}
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Account {mode === 'link' ? <span className="font-normal text-[var(--muted-foreground)]">(optional)</span> : null}</span>
        <input data-testid="signal-account" className={input} list="signal-accounts" autoComplete="off" placeholder="GAP will work it out" value={account} onChange={(e) => setAccount(e.target.value)} />
        <datalist id="signal-accounts">
          {accounts.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Note <span className="font-normal text-[var(--muted-foreground)]">({mode === 'link' ? 'optional, your words' : 'what you heard'})</span></span>
        <textarea data-testid="signal-note" className={`${input} min-h-[4.5rem]`} maxLength={1000} placeholder={mode === 'link' ? 'Why it caught your eye' : 'VP Ops said trailer visibility is still site-by-site.'} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {mode === 'conference' && BUYER_WORDS.test(note) ? (
        <p className="text-xs" data-testid="signal-buyer-words">
          If these are a buyer&apos;s own words from a real conversation, <Link href="/gap/capture" className="underline">capture them as buyer truth</Link> instead. Only what you confirm there counts.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="button"
        data-testid="signal-save"
        disabled={saving || (mode === 'link' ? !url.trim() : !note.trim() || !account.trim())}
        onClick={() => void save()}
        className="w-full rounded-md bg-[var(--primary)] px-4 py-3 text-base font-semibold text-[var(--primary-foreground)] disabled:opacity-50 sm:w-auto"
      >
        {saving ? 'Saving...' : 'Share to GAP'}
      </button>
    </section>
  );
}
