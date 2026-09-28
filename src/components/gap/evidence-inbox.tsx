/**
 * The Verified Evidence Inbox (Phase 2 B2): the top of the RESEARCH lane.
 * Evidence the machine found and verified, grouped by account, for Casey to
 * judge. The machine gathers; Casey decides what it means (USE / IGNORE).
 * Contradictions and rejected sources are shown, never quietly filtered.
 * Pure presentation over research/inbox.ts. Voice: no em dashes.
 */
import type { InboxAccount, InboxFact } from '@/lib/gap/research/inbox';
import { EvidenceActions } from './evidence-actions';

const MAX_ACCOUNTS = 15;

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

function reasonCopy(reason: string): string {
  if (reason === 'excerpt_not_found_at_source') return 'quote not found at the source';
  if (reason === 'page_does_not_name_account') return 'page does not name the account';
  if (reason === 'not_a_physical_operations_fact') return 'not a physical network change';
  if (reason === 'no_publication_date') return 'undated';
  if (reason.startsWith('source_unreadable')) return `source unreadable (${reason.split(':').slice(1).join(':') || 'error'})`;
  return reason.replace(/_/g, ' ');
}

function outcomeCopy(outcome: string): string {
  if (outcome === 'evidence_found') return 'verified evidence found';
  if (outcome === 'insufficient_evidence') return 'no verifiable physical-network fact found';
  if (outcome === 'conflicting_evidence') return 'conflicting evidence found';
  return outcome.replace(/_/g, ' ');
}

function Fact({ f, a }: { f: InboxFact; a: InboxAccount }) {
  return (
    <li data-testid="evidence-fact" className="space-y-1 rounded-md border border-[var(--border)] p-3">
      <blockquote className="border-l-2 border-[var(--primary)] pl-2 text-sm">&ldquo;{f.quote}&rdquo;</blockquote>
      <p className="text-xs text-[var(--muted-foreground)]">
        {f.sourceTitle} · published {f.publishedAt.slice(0, 10)}
        {f.daysLeft !== null ? ` · usable for ${plural(f.daysLeft, 'more day')}` : ''}
      </p>
      <p className="text-xs">
        <span className="font-medium">Why it qualifies:</span> {f.why}
      </p>
      <EvidenceActions signalId={f.signalId} sourceUrl={f.sourceUrl} theses={a.theses} runId={f.runId} />
    </li>
  );
}

export function EvidenceInbox({ accounts, now }: { accounts: InboxAccount[]; now: Date }) {
  const shown = accounts.slice(0, MAX_ACCOUNTS);
  return (
    <section data-testid="evidence-inbox" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Verified evidence inbox</h3>
        <p className="text-xs text-[var(--muted-foreground)]">Found and verified at the source before you got here. You decide what it means: Use sends it to a thesis for your review; nothing is approved for you.</p>
      </div>
      {shown.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">Nothing new from research.</p> : null}
      {shown.map((a) => {
        const hours = a.lastRun ? Math.max(0, Math.round((now.getTime() - new Date(a.lastRun.at).getTime()) / 3_600_000)) : null;
        return (
          <article key={a.accountName} data-testid="evidence-account" data-account={a.accountName} className="space-y-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm">
            <header>
              <p className="text-base font-semibold">{a.accountName}</p>
              <p data-testid="evidence-account-summary" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {[plural(a.ready.length, 'verified fact') + ' ready', a.contradictions.length ? plural(a.contradictions.length, 'contradiction') : null, a.rejected.length ? plural(a.rejected.length, 'rejected source') : null].filter(Boolean).join(' · ')}
              </p>
              {a.lastRun ? (
                <p className="text-xs text-[var(--muted-foreground)]">
                  Last researched {hours === 0 ? 'within the hour' : `${hours}h ago`}
                  {a.lastRun.background ? ' in the background' : ''}: {outcomeCopy(a.lastRun.outcome)}.
                </p>
              ) : null}
            </header>
            {a.ready.length ? <ul className="space-y-2">{a.ready.map((f) => <Fact key={f.signalId} f={f} a={a} />)}</ul> : null}
            {a.contradictions.map((c) => (
              <div key={c.site} data-testid="evidence-contradiction" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
                <p className="font-semibold">Contradiction at {c.site}: sources describe it moving both ways. Resolve before using either.</p>
                <ul className="mt-1 list-disc pl-4">
                  {c.facts.map((f) => (
                    <li key={f.signalId}>
                      &ldquo;{f.quote}&rdquo; ({f.sourceTitle}, {f.publishedAt.slice(0, 10)})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {a.rejected.length ? (
              <details className="text-xs" data-testid="evidence-rejected">
                <summary className="cursor-pointer text-[var(--muted-foreground)]">{plural(a.rejected.length, 'rejected source')}</summary>
                <ul className="mt-1 space-y-0.5">
                  {a.rejected.slice(0, 10).map((r) => (
                    <li key={r.url} className="break-all">
                      {reasonCopy(r.reason)}: <span className="text-[var(--muted-foreground)]">{r.url}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        );
      })}
      {accounts.length > MAX_ACCOUNTS ? <p className="text-xs text-[var(--muted-foreground)]">{accounts.length - MAX_ACCOUNTS} more accounts with research results.</p> : null}
    </section>
  );
}
