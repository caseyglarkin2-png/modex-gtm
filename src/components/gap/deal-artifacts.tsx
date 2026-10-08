'use client';

/**
 * THE NEXT DEAL ARTIFACT (GAP OS execution recovery, R53): the one artifact the deal needs now (with why, naming the
 * commitment or blocker and the person), then the others, each a prepared text block labeled "Prepared, not sent"
 * with its citations, what it could not say, and a copy control. GAP never sends it; there is no governed copy
 * family for deal artifacts, so the seller copies it into their own email if they choose. A text the voice and claim
 * guard flags is shown with the problem and cannot be copied.
 */
import { useState } from 'react';
import type { ArtifactProof, PreparedArtifact } from '@/lib/gap/deals/artifacts';
import { stableHash } from '@/lib/gap/deals/crm-model';
import { postJson } from './obligation-actions';

const SMALL = 'inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] px-2.5 text-xs hover:bg-[var(--muted)] disabled:opacity-60 sm:min-h-9';

type Person = { personaId?: number; name: string | null; email: string | null };

/** X14b: who the copy is for: the artifact's own addressee by name, else the deal's one person with an address. */
export function recipientFor(a: Pick<PreparedArtifact, 'to'>, people: readonly Person[]): string | null {
  const withEmail = people.filter((p) => typeof p.email === 'string' && p.email.includes('@'));
  const to = (a.to ?? '').trim().toLowerCase();
  const named = to ? withEmail.find((p) => (p.name ?? '').trim().toLowerCase() === to || to.startsWith((p.name ?? '').trim().toLowerCase().split(' ')[0] || '\u0000')) : null;
  const pick = named ?? (withEmail.length === 1 ? withEmail[0] : null);
  return pick?.email ? pick.email.trim().toLowerCase() : null;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });

function Block({ a, lead, scope, people = [], proof = null }: { a: PreparedArtifact; lead: boolean; scope: { accountName: string; dealId: string } | null; people?: readonly Person[]; proof?: ArtifactProof | null }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy() {
    try {
      await navigator.clipboard.writeText(a.text);
    } catch {
      setCopied('Could not copy: select the text and copy it.');
      return;
    }
    // Batch item 8: the copy is recorded, so the deal's next move moves on (the recap is not offered again until the
    // buyer says something new). Recording never sends anything.
    if (!scope) {
      setCopied('Copied. Nothing was sent.');
      return;
    }
    // X14b: the recipient rides on the record, so the mailbox cron can find the send in Sent; a copy is never a send.
    const recipient = recipientFor(a, people);
    const r = await postJson('/api/gap/deals/artifact-used', { accountName: scope.accountName, dealId: scope.dealId, kind: a.kind, textHash: stableHash(a.text), ...(recipient ? { recipient } : {}) });
    setCopied(r.ok ? (recipient ? `Copied and recorded for ${recipient}. Not sent until Sent shows it.` : 'Copied and recorded. Nothing was sent.') : `Copied. Nothing was sent. Not recorded: ${r.error}.`);
  }
  return (
    <div className="space-y-1" data-testid="deal-artifact" data-kind={a.kind} data-next={lead ? 'true' : 'false'}>
      <p className="text-sm font-semibold">
        {a.title}
        <span className="ml-2 rounded bg-[var(--muted)] px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]" data-testid="artifact-status">{a.status}</span>
      </p>
      <p className="text-xs" data-testid="artifact-why">{a.why}</p>
      {proof && proof.kind === a.kind ? (
        <p className="text-xs text-[var(--muted-foreground)]" data-testid="artifact-proof" data-state={proof.state}>
          {proof.state === 'sent' ? `Sent ${when(proof.at)}${proof.recipient ? ` to ${proof.recipient}` : ''} (found in Sent).` : `Copied ${when(proof.at)}${proof.recipient ? ` for ${proof.recipient}` : ''}; GAP has not seen it sent.`}
        </p>
      ) : null}
      <textarea readOnly className="min-h-32 w-full rounded-md border border-[var(--border)] bg-transparent p-2 font-mono text-xs" value={a.text} aria-label={`${a.title}, prepared, not sent`} data-testid="artifact-text" rows={Math.min(14, a.text.split('\n').length + 1)} />
      {a.citations.length ? (
        <ul className="text-xs text-[var(--muted-foreground)]" data-testid="artifact-citations">
          {a.citations.map((c, n) => <li key={`${c.ref}-${n}`}>Rests on: {c.label}</li>)}
        </ul>
      ) : null}
      {a.gaps.length ? <p className="text-xs text-amber-700 dark:text-amber-400" data-testid="artifact-gaps">{a.gaps.join(' ')}</p> : null}
      {a.problems.length ? <p className="text-xs text-red-700 dark:text-red-400" data-testid="artifact-problems">Not ready: {a.problems.join('; ')}.</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={SMALL} disabled={a.problems.length > 0} onClick={() => void copy()} data-testid="artifact-copy">Copy the text</button>
        {copied ? <span role="status" className="text-xs text-[var(--muted-foreground)]" data-testid="artifact-copied">{copied}</span> : null}
      </div>
    </div>
  );
}

export function DealArtifacts({ next, all, accountName, dealId, people = [], proof = null }: { next: PreparedArtifact; all: readonly PreparedArtifact[]; /** Batch item 8: where a copy is recorded. */ accountName?: string; dealId?: string; /** X14b: the deal's people with the address GAP holds (the copy's recipient). */ people?: readonly Person[]; /** X14b: what the ledger proves about the recap. */ proof?: ArtifactProof | null }) {
  const scope = accountName && dealId ? { accountName, dealId } : null;
  const others = all.filter((a) => a.kind !== next.kind);
  return (
    <div className="space-y-2" data-testid="deal-artifacts">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">The next deal move, prepared</h4>
      <Block a={next} lead scope={scope} people={people} proof={proof} />
      {others.length ? (
        <details className="text-sm">
          <summary className="min-h-11 cursor-pointer text-xs text-[var(--muted-foreground)]">Other prepared artifacts ({others.length})</summary>
          <div className="mt-2 space-y-3">{others.map((a) => <Block key={a.kind} a={a} lead={false} scope={scope} people={people} proof={proof} />)}</div>
        </details>
      ) : null}
    </div>
  );
}
