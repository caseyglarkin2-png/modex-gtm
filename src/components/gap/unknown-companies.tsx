'use client';

/**
 * COMPANIES GAP DOES NOT KNOW YET (Universal Work Intake): the people in a
 * source whose company GAP could not place. Casey can say "this is <an
 * existing account>" (a curated alias; the source is re-resolved) or leave it.
 * GAP never creates an account from a list. Voice: no em dashes.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UnknownCompany } from '@/lib/gap/intake/views';

function Row({ workSourceId, c }: { workSourceId: string; c: UnknownCompany }) {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const q = account.trim();
    if (q.length < 2 || options.includes(q)) return;
    const t = setTimeout(() => {
      fetch(`/api/gap/capture/lookup?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { accounts: [] }))
        .then((b: { accounts?: string[] }) => setOptions(b.accounts ?? []))
        .catch(() => setOptions([]));
    }, 250);
    return () => clearTimeout(t);
  }, [account, options]);
  async function map() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/gap/sources/${encodeURIComponent(workSourceId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'map_company', company: c.company, accountName: account.trim() }) });
    const body = ((await res.json().catch(() => ({}))) ?? {}) as { error?: string; reresolved?: number };
    setBusy(false);
    if (!res.ok) return setMsg(body.error === 'account_not_found' ? 'GAP has no account by that name (it never creates one from a list).' : body.error?.startsWith('alias_conflict:') ? `That name already means ${body.error.split(':')[1]}.` : `Not saved: ${body.error ?? res.status}`);
    setMsg(`Saved. ${body.reresolved ?? 0} ${body.reresolved === 1 ? 'person is' : 'people are'} now placed at ${account.trim()}.`);
    router.refresh();
  }
  const listId = `acct-${c.company.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <li className="space-y-1 border-b border-[var(--border)] py-2 text-sm" data-testid="unknown-company">
      <p>
        <span className="font-medium">{c.company}</span> <span className="text-[var(--muted-foreground)]">· {c.people} {c.people === 1 ? 'person' : 'people'}{c.titles.length ? ` · ${c.titles.join(' / ')}` : ''}{c.ambiguous ? ' · ambiguous' : ''}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label={`Which account is ${c.company}`} list={listId} className="min-h-[36px] w-full rounded-md border border-[var(--border)] bg-transparent px-2 text-sm sm:w-64" placeholder="This is which GAP account?" value={account} onChange={(e) => setAccount(e.target.value)} />
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <button type="button" disabled={busy || account.trim().length < 2} onClick={() => void map()} className="min-h-[36px] rounded-md border border-[var(--border)] px-2 text-xs hover:bg-[var(--muted)] disabled:opacity-60" data-testid="unknown-company-map">
          {busy ? 'Saving...' : 'Same company'}
        </button>
      </div>
      {msg ? <p className="text-xs" data-testid="unknown-company-result">{msg}</p> : null}
    </li>
  );
}

export function UnknownCompanies({ workSourceId, items, total }: { workSourceId: string; items: UnknownCompany[]; total?: number }) {
  if (!items.length) return null;
  // Collapsed by default: on a phone a long list would bury everything below it.
  return (
    <details className="space-y-1 rounded-md border border-[var(--border)] p-3" data-testid="unknown-companies">
      <summary className="cursor-pointer text-sm font-semibold">
        Companies GAP does not know yet ({total ?? items.length}){total && total > items.length ? `, top ${items.length} shown` : ''}
      </summary>
      <p className="text-xs text-[var(--muted-foreground)]">If one is an account GAP already has under another name, say which; the people there are placed and qualified. Otherwise leave it: GAP never creates an account from a list.</p>
      <ul>
        {items.map((c) => (
          <Row key={c.company} workSourceId={workSourceId} c={c} />
        ))}
      </ul>
    </details>
  );
}
