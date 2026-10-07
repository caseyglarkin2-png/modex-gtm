'use client';

/**
 * USE / IGNORE / OPEN SOURCE on one verified candidate fact in the Verified
 * Evidence Inbox (Phase 2 B2).
 *
 *   USE      the existing audited use_evidence operation (POST /api/gap/theses),
 *            labelled by what the server will do (InboxThesis.useLabel):
 *            USE IN DRAFT, USE & CREATE REVISION, or USE FOR THIS THESIS (both);
 *            an editable row gets its observation rebuilt from this fact; a
 *            frozen approved row gets a new draft revision. Nothing is
 *            approved: the result goes to REVIEW for Casey.
 *            No thesis at the account yet: DRAFT THESIS FROM THIS FACT
 *            (the existing POST /api/gap/research/{runId}/propose: a DRAFT).
 *   IGNORE   POST /api/gap/evidence/ignore: this exact fact stops being
 *            surfaced; research history is kept.
 *   OPEN SOURCE  the source URL.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { InboxThesis } from '@/lib/gap/research/inbox';
import { refreshNow } from '@/components/gap/refresh-now';

type State = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; text: string; review: boolean } | { kind: 'error'; text: string } | { kind: 'ignored' };

async function json(res: Response): Promise<Record<string, unknown>> {
  return ((await res.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
}

export function EvidenceActions({
  signalId,
  sourceUrl,
  theses,
  runId,
  contradicted = false,
}: {
  signalId: string;
  sourceUrl: string | null;
  theses: InboxThesis[];
  runId: string | null;
  /** One side of a detected contradiction: it cannot be used until the other side is resolved (ignored). */
  contradicted?: boolean;
}) {
  const router = useRouter();
  const usable = theses.filter((t) => t.usableIds.length > 0);
  const [fingerprint, setFingerprint] = useState(usable[0]?.fingerprint ?? '');
  const [state, setState] = useState<State>({ kind: 'idle' });

  async function use() {
    const t = usable.find((x) => x.fingerprint === fingerprint);
    if (!t) return;
    setState({ kind: 'busy' });
    try {
      const res = await fetch('/api/gap/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'use_evidence', fingerprint: t.fingerprint, hypothesisIds: t.usableIds, signalIds: [signalId], primarySignalId: signalId }),
      });
      const body = await json(res);
      const results = Array.isArray(body.results) ? (body.results as Array<{ ok: boolean; detail: string }>) : [];
      if (!res.ok || body.ok === false) {
        setState({ kind: 'error', text: String(body.reason ?? body.error ?? results.find((r) => !r.ok)?.detail ?? `HTTP ${res.status}`) });
        return;
      }
      setState({ kind: 'done', text: [...new Set(results.map((r) => r.detail))].join('; ') || 'Applied.', review: true });
      refreshNow(router);
    } catch (e) {
      setState({ kind: 'error', text: e instanceof Error ? e.message : 'network error' });
    }
  }

  async function draft() {
    if (!runId) return;
    setState({ kind: 'busy' });
    try {
      // This exact fact is the opener (review B2: never whichever fact the run happens to list first).
      const res = await fetch(`/api/gap/research/${encodeURIComponent(runId)}/propose`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signalIds: [signalId] }) });
      const body = await json(res);
      if (!res.ok) {
        setState({ kind: 'error', text: String(body.error ?? `HTTP ${res.status}`) });
        return;
      }
      setState({ kind: 'done', text: 'Draft thesis created from this fact. Nothing is approved.', review: true });
      refreshNow(router);
    } catch (e) {
      setState({ kind: 'error', text: e instanceof Error ? e.message : 'network error' });
    }
  }

  async function ignore() {
    setState({ kind: 'busy' });
    try {
      const res = await fetch('/api/gap/evidence/ignore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signalId }) });
      if (!res.ok) {
        setState({ kind: 'error', text: String((await json(res)).error ?? `HTTP ${res.status}`) });
        return;
      }
      setState({ kind: 'ignored' });
    } catch (e) {
      setState({ kind: 'error', text: e instanceof Error ? e.message : 'network error' });
    }
  }

  if (state.kind === 'ignored') return <p data-testid="evidence-ignored" className="text-xs text-[var(--muted-foreground)]">Ignored. It will not be shown again.</p>;
  const busy = state.kind === 'busy';
  const btn = 'rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)] disabled:opacity-60';
  return (
    <div className="space-y-1" data-testid="evidence-actions">
      <div className="flex flex-wrap items-center gap-2">
        {contradicted ? (
          <span className="text-xs text-amber-700 dark:text-amber-400">Contradicted: ignore the side you do not believe, then use the other.</span>
        ) : usable.length > 0 ? (
          <>
            {usable.length > 1 ? (
              <select aria-label="Use in which thesis" value={fingerprint} onChange={(e) => setFingerprint(e.target.value)} className="h-7 max-w-[16rem] rounded-md border border-[var(--border)] bg-transparent px-1 text-xs">
                {usable.map((t) => (
                  <option key={t.fingerprint} value={t.fingerprint}>
                    {t.problemFamily.replace(/_/g, ' ')} ({t.people} {t.people === 1 ? 'person' : 'people'})
                  </option>
                ))}
              </select>
            ) : null}
            <button type="button" data-testid="evidence-use" disabled={busy} onClick={() => void use()} className={`${btn} bg-[var(--primary)] font-medium text-[var(--primary-foreground)]`}>
              {busy ? 'Working...' : (usable.find((x) => x.fingerprint === fingerprint) ?? usable[0]).useLabel ?? 'USE FOR THIS THESIS'}
            </button>
          </>
        ) : theses.length === 0 && runId ? (
          <button type="button" data-testid="evidence-draft" disabled={busy} onClick={() => void draft()} className={`${btn} bg-[var(--primary)] font-medium text-[var(--primary-foreground)]`}>
            {busy ? 'Working...' : 'DRAFT THESIS FROM THIS FACT'}
          </button>
        ) : (
          <span className="text-xs text-[var(--muted-foreground)]">Every thesis here is already in use.</span>
        )}
        <button type="button" data-testid="evidence-ignore" disabled={busy} onClick={() => void ignore()} className={btn}>
          {contradicted ? 'Ignore this side' : 'Ignore'}
        </button>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noreferrer noopener" className={btn}>
            Open source
          </a>
        ) : null}
      </div>
      {state.kind === 'done' ? (
        <p data-testid="evidence-done" className="text-xs">
          {state.text} {state.review ? <Link href="/gap?lane=review" className="underline">Review it</Link> : null}
        </p>
      ) : null}
      {state.kind === 'error' ? (
        <p role="alert" data-testid="evidence-error" className="text-xs text-[var(--destructive)]">
          Not applied: {state.text}
        </p>
      ) : null}
    </div>
  );
}
