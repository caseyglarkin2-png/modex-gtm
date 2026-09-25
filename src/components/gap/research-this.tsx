'use client';

/**
 * RESEARCH THIS on a research-required card (last mile, 2026-09-25).
 *
 * One click runs the evidence search for the card (POST /api/gap/research)
 * and shows exactly one result:
 *   facts found          each verified fact, quoted, with source, date and
 *                        freshness; "Propose updated hypothesis" creates a
 *                        DRAFT for Casey to review (never approved or active)
 *   nothing defensible   "No defensible outreach trigger found." Hold.
 *   conflicting          the conflict, and no outreach
 * Voice: no em dashes.
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Fact {
  signalId: string;
  excerpt: string;
  url: string;
  title: string;
  publishedAt: string;
  fresh: boolean;
}
interface Result {
  runId: string;
  outcome: 'evidence_found' | 'insufficient_evidence' | 'conflicting_evidence';
  facts: Fact[];
  rejected: Array<{ url: string; reason: string }>;
  conflicts: Array<{ site: string; signalIds: string[] }>;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export function ResearchThis({ decisionId }: { decisionId: string }) {
  const [busy, setBusy] = useState<'research' | 'propose' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposed, setProposed] = useState<{ id: string; existing: boolean } | null>(null);

  async function research() {
    setBusy('research');
    setError(null);
    setResult(null);
    setProposed(null);
    try {
      const res = await fetch('/api/gap/research', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decisionId }) });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };
      if (!res.ok) setError(data.error ?? `HTTP ${res.status}`);
      else setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function propose(runId: string) {
    setBusy('propose');
    setError(null);
    try {
      const res = await fetch(`/api/gap/research/${encodeURIComponent(runId)}/propose`, { method: 'POST' });
      const data = (await res.json().catch(() => ({}))) as { hypothesisId?: string; existing?: boolean; error?: string };
      if (!res.ok || !data.hypothesisId) setError(data.error ?? `HTTP ${res.status}`);
      else setProposed({ id: data.hypothesisId, existing: data.existing === true });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div data-testid="research-this" className="space-y-2">
      <Button type="button" size="sm" disabled={busy !== null} onClick={research}>
        {busy === 'research' ? 'Researching public sources...' : result ? 'Research again' : 'Research this'}
      </Button>
      {error ? <p role="alert" className="text-xs text-[var(--destructive)]">Research failed: {error}</p> : null}

      {result?.outcome === 'evidence_found' ? (
        <div data-testid="research-found" className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
          <p className="font-semibold">Evidence found</p>
          {result.facts.map((f) => (
            <div key={f.signalId} className="space-y-0.5">
              <p className="italic">&ldquo;{f.excerpt}&rdquo;</p>
              <p className="text-[var(--muted-foreground)]">
                <a href={f.url} target="_blank" rel="noreferrer noopener" className="underline">
                  {f.title}
                </a>
                , {day(f.publishedAt)}, {f.fresh ? 'fresh' : 'stale (kept for the record, not a trigger)'}
              </p>
            </div>
          ))}
          {proposed ? (
            <p>
              {proposed.existing ? 'Draft already proposed.' : 'Draft hypothesis proposed.'}{' '}
              <a href="/gap/hypotheses?status=draft" className="underline">
                Review it
              </a>{' '}
              (it stays a draft until you approve it).
            </p>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => propose(result.runId)}>
              {busy === 'propose' ? 'Proposing...' : 'Propose updated hypothesis'}
            </Button>
          )}
        </div>
      ) : null}

      {result?.outcome === 'insufficient_evidence' ? (
        <div data-testid="research-none" className="space-y-1 rounded-md border border-[var(--border)] p-3 text-xs">
          <p className="font-semibold">No defensible outreach trigger found.</p>
          <p className="text-[var(--muted-foreground)]">
            Recommendation: hold and research later.{' '}
            {result.facts.length > 0 ? `${result.facts.length} older fact(s) were found but are stale. ` : ''}
            {result.rejected.length > 0 ? `${result.rejected.length} candidate(s) rejected (not verifiable at the source, undated, or not about physical operations).` : ''}
          </p>
        </div>
      ) : null}

      {result?.outcome === 'conflicting_evidence' ? (
        <div data-testid="research-conflict" className="space-y-1 rounded-md border border-[var(--destructive)] p-3 text-xs">
          <p className="font-semibold">Conflicting evidence. No outreach.</p>
          {result.conflicts.map((c) => (
            <p key={c.site}>Sources disagree about the {c.site} site (it is described as both opening and closing).</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
