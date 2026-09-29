/**
 * The Verified Evidence Inbox (Phase 2 B2; account-centric 2026-09-28): the
 * RESEARCH lane, one coherent section per account. Each section carries its
 * own counts, the BEST FACT TO CONSIDER (seller relevance, never truth), the
 * OTHER VERIFIED CONTEXT (shown, never hidden), contradictions, rejected
 * sources, the one NEXT action, and that account's own theses (children).
 * Nothing from one account sits inside another's section. The machine
 * gathers; Casey decides what it means. Pure presentation over
 * research/inbox.ts. Voice: no em dashes.
 */
import type { ReactNode } from 'react';
import type { ChainLink, InboxAccount, InboxFact } from '@/lib/gap/research/inbox';
import { EvidenceActions } from './evidence-actions';
import { AccountLink } from './account-link';

const MAX_ACCOUNTS = 15;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Jun 8" (with the year when it is not the current one). */
function short(iso: string, now: Date): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear() === now.getUTCFullYear() ? '' : `, ${d.getUTCFullYear()}`;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${y}`;
}

function reasonCopy(reason: string): string {
  if (reason === 'excerpt_not_found_at_source') return 'quote not found at the source';
  if (reason === 'page_does_not_name_account') return 'page does not name the account';
  if (reason === 'not_a_physical_operations_fact') return 'not a physical network change';
  if (reason === 'no_publication_date') return 'undated';
  if (reason === 'describes_past_event') return 'an older event restated';
  if (reason.startsWith('source_unreadable')) return `source unreadable (${reason.split(':').slice(1).join(':') || 'error'})`;
  return reason.replace(/_/g, ' ');
}

function outcomeCopy(outcome: string): string {
  if (outcome === 'evidence_found') return 'verified evidence found';
  if (outcome === 'insufficient_evidence') return 'no verifiable physical-network fact found';
  if (outcome === 'conflicting_evidence') return 'conflicting evidence found';
  if (outcome === 'provider_unavailable') return 'the web search could not run (retry later; nothing concluded)';
  return outcome.replace(/_/g, ' ');
}

function Link_({ l, now }: { l: ChainLink; now: Date }) {
  const text = `${l.label} · ${short(l.date, now)}`;
  return l.url ? (
    <a href={l.url} target="_blank" rel="noreferrer noopener" className="underline decoration-dotted">
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );
}

/** The compact source chain: where the fact comes from, and what says it is still current. */
function SourceChain({ f, now }: { f: InboxFact; now: Date }) {
  const c = f.chain;
  return (
    <dl data-testid="evidence-chain" className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
      <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{c.kind === 'primary' ? 'Primary source' : 'Source'}</dt>
      <dd className="min-w-0 break-words">
        <Link_ l={c.source} now={now} />
      </dd>
      {c.currentness ? (
        <>
          <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Currentness confirmed</dt>
          <dd data-testid="evidence-currentness" className="min-w-0 break-words">
            <Link_ l={c.currentness} now={now} />
          </dd>
        </>
      ) : null}
      {c.others.length ? (
        <>
          <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Also reported</dt>
          <dd className="min-w-0 break-words">
            {c.others.map((o, i) => (
              <span key={`${o.url}-${i}`}>
                {i ? ', ' : ''}
                <Link_ l={o} now={now} />
              </span>
            ))}
          </dd>
        </>
      ) : null}
      {f.expiresAt ? (
        <>
          <dt className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Current until</dt>
          <dd>
            {short(f.expiresAt, now)} ({f.daysLeft !== null ? plural(f.daysLeft, 'day') : ''}, {c.basis === 'corroborated' ? 'from the newer confirmation' : 'from publication'})
          </dd>
        </>
      ) : null}
    </dl>
  );
}

function Fact({ f, a, now, best = false }: { f: InboxFact; a: InboxAccount; now: Date; best?: boolean }) {
  return (
    <li data-testid="evidence-fact" data-best={best ? 'true' : undefined} className={`space-y-2 rounded-md border p-3 ${best ? 'border-[var(--primary)]' : 'border-[var(--border)]'}`}>
      <blockquote className="border-l-2 border-[var(--primary)] pl-2 text-sm">&ldquo;{f.quote}&rdquo;</blockquote>
      <p className="text-xs text-[var(--muted-foreground)]">{f.sourceTitle}</p>
      <SourceChain f={f} now={now} />
      <p className="text-xs">
        <span className="font-medium">Why it qualifies:</span> {f.why}
        {best ? null : <span className="text-[var(--muted-foreground)]"> Context: {f.relevance.reason}.</span>}
      </p>
      <EvidenceActions signalId={f.signalId} sourceUrl={f.sourceUrl} theses={a.theses} runId={f.runId} />
    </li>
  );
}

/** One account's research section: its evidence, its next step, and (children) its own theses. */
export function EvidenceAccount({ a, now, thesesNeedingEvidence = 0, children }: { a: InboxAccount; now: Date; thesesNeedingEvidence?: number; children?: ReactNode }) {
  const hours = a.lastRun ? Math.max(0, Math.round((now.getTime() - new Date(a.lastRun.at).getTime()) / 3_600_000)) : null;
  const best = a.ready.find((f) => f.signalId === a.bestSignalId) ?? null;
  const context = a.ready.filter((f) => f !== best);
  return (
    <article data-testid="evidence-account" data-account={a.accountName} className="min-w-0 space-y-3 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 shadow-sm sm:p-4">
      <header className="space-y-1">
        <p className="text-base font-semibold"><AccountLink name={a.accountName} /></p>
        <p data-testid="evidence-account-summary" className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {[
            plural(a.ready.length, 'verified fact') + ' ready',
            thesesNeedingEvidence ? `${plural(thesesNeedingEvidence, 'thesis', 'theses')} ${thesesNeedingEvidence === 1 ? 'needs' : 'need'} evidence` : null,
            a.contradictions.length ? plural(a.contradictions.length, 'contradiction') : null,
            a.rejected.length ? plural(a.rejected.length, 'rejected source') : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <p data-testid="evidence-next" className="text-sm">
          <span className="font-semibold">Next:</span> {a.next}
        </p>
        {a.lastRun ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Last researched {hours === 0 ? 'within the hour' : `${hours}h ago`}
            {a.lastRun.background ? ' in the background' : ''}: {outcomeCopy(a.lastRun.outcome)}.
          </p>
        ) : null}
      </header>
      {best ? (
        <div data-testid="evidence-best" className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide">Best fact to consider</p>
          <ul>
            <Fact f={best} a={a} now={now} best />
          </ul>
        </div>
      ) : null}
      {context.length ? (
        <div data-testid="evidence-context" className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Other verified context</p>
          <ul className="space-y-2">
            {context.map((f) => (
              <Fact key={f.signalId} f={f} a={a} now={now} />
            ))}
          </ul>
        </div>
      ) : null}
      {a.contradictions.map((c) => (
        <div key={c.site} data-testid="evidence-contradiction" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs">
          <p className="font-semibold">Contradiction at {c.site}: sources describe it moving both ways. Neither side can be used until you ignore the one you do not believe.</p>
          <ul className="mt-1 space-y-2">
            {c.facts.map((f) => (
              <li key={f.signalId} className="space-y-1">
                <p>
                  &ldquo;{f.quote}&rdquo; ({f.sourceTitle}, {f.publishedAt.slice(0, 10)})
                </p>
                <EvidenceActions signalId={f.signalId} sourceUrl={f.sourceUrl} theses={a.theses} runId={f.runId} contradicted />
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
      {children}
    </article>
  );
}

export function EvidenceInbox({ accounts, now }: { accounts: InboxAccount[]; now: Date }) {
  const shown = accounts.slice(0, MAX_ACCOUNTS);
  return (
    <section data-testid="evidence-inbox" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Verified evidence inbox</h3>
        <p className="text-xs text-[var(--muted-foreground)]">Found and verified at the source before you got here. You decide what it means; nothing is approved for you.</p>
      </div>
      {shown.length === 0 ? <p className="text-sm italic text-[var(--muted-foreground)]">Nothing new from research.</p> : null}
      {shown.map((a) => (
        <EvidenceAccount key={a.accountName} a={a} now={now} />
      ))}
      {accounts.length > MAX_ACCOUNTS ? <p className="text-xs text-[var(--muted-foreground)]">{accounts.length - MAX_ACCOUNTS} more accounts with research results.</p> : null}
    </section>
  );
}
