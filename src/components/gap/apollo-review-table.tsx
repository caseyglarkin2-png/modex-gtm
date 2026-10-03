'use client';

/**
 * The cross-account Apollo review table: filter, select, copy. Copy is the only action: it puts the requests on
 * Casey's clipboard to run (or not) by hand. Nothing here calls Apollo or any API.
 */
import { useMemo, useState } from 'react';
import type { ApolloCandidate } from '@/lib/gap/people/apollo-candidates';
import { apolloBatchText, apolloRequestText, filterCandidates, KIND_LABEL } from '@/lib/gap/people/apollo-review';

export function ApolloReviewTable({ rows }: { rows: ApolloCandidate[] }) {
  const [account, setAccount] = useState('');
  const [kind, setKind] = useState('');
  const [decision, setDecision] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const shown = useMemo(() => filterCandidates(rows, { account, kind, decision }), [rows, account, kind, decision]);
  const accounts = [...new Set(rows.map((r) => r.account))].sort();
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`Copied ${what}.`);
    } catch {
      setCopied('Could not copy: select the text and copy it by hand.');
    }
  };
  const pickedRows = shown.filter((r) => picked.has(r.key));

  return (
    <div className="space-y-3" data-testid="apollo-review">
      <div className="flex flex-wrap gap-2 text-sm">
        <label className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground">Account</span>
          <select className="min-h-11 rounded-md border border-input bg-background px-2" value={account} onChange={(e) => setAccount(e.target.value)} aria-label="Filter by account">
            <option value="">All accounts</option>
            {accounts.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground">Lookup</span>
          <select className="min-h-11 rounded-md border border-input bg-background px-2" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by lookup type">
            <option value="">All lookups</option>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground">Decision it could change</span>
          <input className="min-h-11 rounded-md border border-input bg-background px-2" value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="e.g. WHO" aria-label="Filter by decision" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="min-h-11 rounded-md border border-border px-3 text-sm" disabled={!pickedRows.length} onClick={() => copy(apolloBatchText(pickedRows), `${pickedRows.length} selected`)}>
          Copy selected ({pickedRows.length})
        </button>
        <button type="button" className="min-h-11 rounded-md border border-border px-3 text-sm" disabled={!shown.length} onClick={() => copy(apolloBatchText(shown), `all ${shown.length} shown`)}>
          Copy all shown ({shown.length})
        </button>
        {copied ? <span role="status" className="text-sm">{copied}</span> : null}
      </div>
      {shown.length ? (
        <ul className="space-y-2">
          {shown.map((c) => (
            <li key={c.key} className="rounded-md border border-border p-3 text-sm" data-testid="apollo-review-row">
              <div className="flex flex-wrap items-start gap-2">
                <input type="checkbox" className="mt-1 h-5 w-5" checked={picked.has(c.key)} aria-label={`Select ${c.account}: ${KIND_LABEL[c.kind]}`} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(c.key); else n.delete(c.key); return n; })} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.account} · {KIND_LABEL[c.kind]}</p>
                  <p>{c.target}</p>
                  <dl className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[9rem_1fr]">
                    <dt className="text-xs font-semibold text-muted-foreground">Missing</dt><dd>{c.missing}</dd>
                    <dt className="text-xs font-semibold text-muted-foreground">Why it matters</dt><dd>{c.whyItMatters}</dd>
                    <dt className="text-xs font-semibold text-muted-foreground">Could change</dt><dd>{c.decision}</dd>
                    <dt className="text-xs font-semibold text-muted-foreground">Possible match</dt><dd>{c.possibleMatch ?? 'None on record'}</dd>
                    <dt className="text-xs font-semibold text-muted-foreground">GAP checked</dt><dd>{c.checkedFirst.join(', ')}</dd>
                    <dt className="text-xs font-semibold text-muted-foreground">Credit cost</dt><dd>Unknown until run</dd>
                  </dl>
                </div>
                <button type="button" className="min-h-11 rounded-md border border-border px-3 text-sm" onClick={() => copy(apolloRequestText(c), 'this request')}>Copy</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" data-testid="apollo-review-empty">No lookups match these filters.</p>
      )}
    </div>
  );
}
