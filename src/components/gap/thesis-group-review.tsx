'use client';

/**
 * Account thesis review (dogfood addendum, 2026-09-25).
 *
 * One card per account thesis shared by 2+ people (same account, family,
 * observation, hypothesis, root causes, impacts, falsification questions and
 * evidence; the person may differ). The card shows who and what evidence.
 * REVIEW ACCOUNT THESIS opens the shared thesis, its sources with evidence
 * depth, and one checkbox per person:
 *
 *   FIND CORROBORATING EVIDENCE   one research run for the whole thesis
 *                                 (POST /api/gap/theses op corroborate);
 *                                 corroborated, no second source, or contradicts.
 *                                 Attaching a found fact is its own click.
 *   APPROVE SELECTED SIBLINGS     the normal approve transitions per checked
 *                                 row, each audited; every row's result shown,
 *                                 failures included. Nothing activates or sends.
 *
 * Evidence depth is shown next to the thesis, never folded into confidence.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ThesisCard } from '@/lib/gap/hypothesis/thesis-groups';

interface RowResult { hypothesisId: string; ok: boolean; from: string; to: string | null; detail: string }
interface Fact { signalId: string; excerpt: string; url: string; title: string; publishedAt: string; fresh: boolean }
interface Corroboration {
  outcome: 'corroborated' | 'no_second_source' | 'contradicts';
  reused: boolean;
  research: { runId: string; facts: Fact[]; conflicts: Array<{ site: string; signalIds: string[] }>; notes: string[] };
  newIndependent: Fact[];
}

const REVIEWABLE = new Set(['draft', 'review_required']);
const DEPTH_TONE: Record<string, string> = {
  INSUFFICIENT: 'border-[var(--destructive)] text-[var(--destructive)]',
  'SINGLE-SOURCE': 'border-amber-500 text-amber-600',
  CORROBORATED: 'border-emerald-600 text-emerald-700',
  'WELL-SUPPORTED': 'border-emerald-600 text-emerald-700',
};
const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

async function post<T>(body: unknown): Promise<{ ok: boolean; data: T & { error?: string; reason?: string } }> {
  const res = await fetch('/api/gap/theses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as T & { error?: string; reason?: string } };
}

function DepthBadge({ card }: { card: ThesisCard }) {
  const n = card.depth.independentSources;
  return (
    <Badge variant="outline" className={DEPTH_TONE[card.depth.label] ?? ''} title="Independent sources: syndicated copies, the same filing, AI summaries and quote-of-quote count once">
      {card.depth.label} · {n} independent source{n === 1 ? '' : 's'}
      {card.depth.keywordOnly > 0 ? ` · ${card.depth.keywordOnly} keyword hit` : ''}
    </Badge>
  );
}

function ThesisGroupCard({ card, openInitially }: { card: ThesisCard; openInitially: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(openInitially);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(card.members.filter((m) => REVIEWABLE.has(m.status)).map((m) => m.id)));
  const [busy, setBusy] = useState<'approve' | 'corroborate' | 'attach' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [corr, setCorr] = useState<Corroboration | null>(null);
  const [attached, setAttached] = useState<RowResult[] | null>(null);
  const nameOf = (id: string) => card.members.find((m) => m.id === id)?.personaName ?? id;

  async function approve() {
    setBusy('approve'); setError(null); setResults(null);
    try {
      const r = await post<{ results: RowResult[] }>({ op: 'approve', fingerprint: card.fingerprint, hypothesisIds: [...checked] });
      if (!r.ok && !r.data.results?.length) setError(r.data.reason ?? r.data.error ?? 'approve_failed');
      setResults(r.data.results ?? []);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  async function corroborate(force = false) {
    setBusy('corroborate'); setError(null); setAttached(null);
    try {
      const r = await post<Corroboration>({ op: 'corroborate', fingerprint: card.fingerprint, ...(force ? { force: true } : {}) });
      if (!r.ok) setError(r.data.reason ?? r.data.error ?? 'research_failed'); else setCorr(r.data);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  async function attach(signalIds: string[]) {
    setBusy('attach'); setError(null);
    try {
      const r = await post<{ results: RowResult[] }>({ op: 'attach', fingerprint: card.fingerprint, signalIds });
      setAttached(r.data.results ?? []);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  return (
    <div className="rounded-lg border border-[var(--border)] p-4" data-testid="thesis-group">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{card.accountName} · {card.problemFamily.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {card.members.length} people share this thesis · {card.reviewable} awaiting review
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {card.members.map((m) => m.personaName ?? 'unknown').join(', ')}
          </p>
          <div className="mt-2"><DepthBadge card={card} /></div>
        </div>
        <Button type="button" size="sm" variant={open ? 'outline' : 'default'} onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Review account thesis'}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 text-sm">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Evidence</h3>
            <ul className="mt-1 space-y-1">
              {card.sources.map((s) => (
                <li key={s.id}>
                  {s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.title ?? s.url}</a> : (s.title ?? s.id)}
                  {!s.quoted && s.kind !== 'operator_knowledge' ? <span className="ml-2 text-xs text-amber-600">keyword hit, no quoted passage (not counted as a source)</span> : null}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Depth is shown beside the thesis and is not converted into confidence.</p>
            {card.recordedNotes?.length ? (
              <ul className="mt-2 space-y-1 text-xs">
                {card.recordedNotes.map((n, i) => (
                  <li key={`${n.hypothesisId}-${i}`}>Note recorded for {n.personaName ?? n.hypothesisId} (frozen, not merged): <q>{n.text}</q></li>
                ))}
              </ul>
            ) : null}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Shared thesis</h3>
            <p className="mt-1"><span className="text-[var(--muted-foreground)]">Observation:</span> {card.observation}</p>
            <p className="mt-1"><span className="text-[var(--muted-foreground)]">Hypothesis:</span> {card.problemHypothesis}</p>
            {card.rootCauses.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Root causes:</span> {card.rootCauses.join('; ')}</p> : null}
            {card.impacts.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Impacts:</span> {card.impacts.join('; ')}</p> : null}
            {card.falsification.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Falsify with:</span> {card.falsification.join(' ')}</p> : null}
            {card.whatANoMeans ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">What a no means:</span> {card.whatANoMeans}</p> : null}
          </section>

          <section>
            <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void corroborate()}>
              {busy === 'corroborate' ? 'Searching...' : 'Find corroborating evidence'}
            </Button>
            <span className="ml-2 text-xs text-[var(--muted-foreground)]">One search for the whole thesis, not one per person.</span>
            {corr ? (
              <div className="mt-2 rounded-md border border-[var(--border)] p-3" data-testid="corroboration">
                <p className="font-medium">
                  {corr.outcome === 'corroborated' ? 'SECOND SOURCE FOUND' : corr.outcome === 'contradicts' ? 'EVIDENCE CONTRADICTS HYPOTHESIS' : 'NO SECOND SOURCE FOUND'}
                  {corr.reused ? <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">(result of this thesis's search in the last 24 hours)</span> : null}
                </p>
                {corr.outcome === 'contradicts' ? (
                  <ul className="mt-1 list-disc pl-5">{corr.research.conflicts.map((c) => <li key={c.site}>{c.site}: sources describe it moving both ways. Do not approve on this thesis.</li>)}</ul>
                ) : null}
                {corr.newIndependent.length ? (
                  <>
                    <ul className="mt-1 space-y-2">
                      {corr.newIndependent.map((f) => (
                        <li key={f.signalId}>
                          <q>{f.excerpt}</q>
                          <span className="ml-1 text-xs text-[var(--muted-foreground)]"><a className="underline" href={f.url} target="_blank" rel="noreferrer">{f.title}</a>, {day(f.publishedAt)}</span>
                        </li>
                      ))}
                    </ul>
                    <Button type="button" size="sm" className="mt-2" disabled={busy !== null} onClick={() => void attach(corr.newIndependent.map((f) => f.signalId))}>
                      {busy === 'attach' ? 'Attaching...' : `Attach to the ${card.reviewable} editable sibling${card.reviewable === 1 ? '' : 's'}`}
                    </Button>
                  </>
                ) : corr.outcome === 'no_second_source' ? (
                  <p className="mt-1 text-[var(--muted-foreground)]">Nothing fresh and independent was verified. The thesis stays {card.depth.label.toLowerCase()}; it can still be approved on what it has.</p>
                ) : null}
                {attached ? <ResultList results={attached} nameOf={nameOf} /> : null}
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">People</h3>
            <ul className="mt-1 space-y-1">
              {card.members.map((m) => {
                const editable = REVIEWABLE.has(m.status);
                return (
                  <li key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${m.personaName ?? m.id}`}
                      disabled={!editable}
                      checked={editable && checked.has(m.id)}
                      onChange={(e) => {
                        const next = new Set(checked);
                        if (e.target.checked) next.add(m.id); else next.delete(m.id);
                        setChecked(next);
                      }}
                    />
                    <span>{m.personaName ?? 'unknown'}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{m.personaTitle ?? ''}</span>
                    <Badge variant="outline" className="text-[10px]">{m.status.replace(/_/g, ' ')}</Badge>
                  </li>
                );
              })}
            </ul>
            <Button type="button" size="sm" className="mt-3" disabled={busy !== null || checked.size === 0} onClick={() => void approve()}>
              {busy === 'approve' ? 'Approving...' : `Approve selected siblings (${checked.size})`}
            </Button>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Approves only. Nothing is activated, enrolled, drafted or sent.</p>
            {results ? <ResultList results={results} nameOf={nameOf} /> : null}
          </section>
          {error ? <p role="alert" className="text-[var(--destructive)]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function ResultList({ results, nameOf }: { results: RowResult[]; nameOf: (id: string) => string }) {
  return (
    <ul className="mt-2 space-y-1" data-testid="row-results">
      {results.map((r) => (
        <li key={r.hypothesisId} className={r.ok ? '' : 'text-[var(--destructive)]'}>
          {r.ok ? 'OK' : 'FAILED'} · {nameOf(r.hypothesisId)} · {r.detail}
        </li>
      ))}
    </ul>
  );
}

export function ThesisGroupReview({ cards }: { cards: ThesisCard[] }) {
  if (cards.length === 0) return null;
  return (
    <section className="space-y-3" aria-label="Account theses">
      <div>
        <h2 className="text-lg font-semibold">Account theses</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Identical hypotheses for different people at one account, reviewed once. Pending and better-corroborated theses first. One-offs are in the table below.
        </p>
      </div>
      {cards.map((c, i) => <ThesisGroupCard key={c.fingerprint} card={c} openInitially={i === 0 && c.reviewable > 0} />)}
    </section>
  );
}
