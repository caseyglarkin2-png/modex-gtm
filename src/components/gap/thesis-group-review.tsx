'use client';

/**
 * Account thesis review (dogfood addendum 2026-09-25; reduced 2026-09-26).
 *
 * One card per account thesis shared by 2+ people. Casey makes ONE decision
 * per thesis; everything after it is system work:
 *
 *   APPROVE + USE FOR N           the normal legal transitions per checked row,
 *                                 each audited, then routing runs on its own and
 *                                 the outcome (ready / research / blocked) shows
 *                                 above the list. There is no separate ROUTE.
 *   FIND MORE EVIDENCE            one research run for the whole thesis
 *                                 (POST /api/gap/theses op corroborate).
 *   USE THIS EVIDENCE +           the facts Casey ticks are linked to the checked
 *   APPROVE + USE                 people, then the same approve + use. Nothing
 *                                 is attached that Casey did not choose.
 *   HOLD                          no good evidence is a complete answer.
 *
 * Evidence depth is shown next to the thesis, never folded into confidence.
 * Routing creates recommendations only: nothing drafts, enrolls or sends.
 * Voice: no em dashes.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ThesisCard } from '@/lib/gap/hypothesis/thesis-groups';
import { UseOutcome, type UseOutcomeResponse } from './use-outcome';

interface RowResult { hypothesisId: string; ok: boolean; from: string; to: string | null; detail: string }
interface Fact { signalId: string; excerpt: string; url: string; title: string; publishedAt: string; fresh: boolean }
interface Corroboration {
  outcome: 'corroborated' | 'no_second_source' | 'contradicts';
  reused: boolean;
  research: { runId: string; facts: Fact[]; conflicts: Array<{ site: string; signalIds: string[] }>; notes: string[] };
  newIndependent: Fact[];
}
export interface ThesisOutcome { key: string; title: string; approved: number; inUse: number; routing: UseOutcomeResponse | null; failures: string[] }

/** Rows APPROVE + USE can still move (approved rows only need "use"). */
const SELECTABLE = new Set(['draft', 'review_required', 'approved']);
const STATUS_WORDS: Record<string, string> = { draft: 'needs review', review_required: 'needs review', approved: 'approved, not in use', active: 'in use' };
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

function ThesisGroupCard({ card, openInitially, onOutcome }: { card: ThesisCard; openInitially: boolean; onOutcome: (o: ThesisOutcome) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(openInitially);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(card.members.filter((m) => SELECTABLE.has(m.status)).map((m) => m.id)));
  const [busy, setBusy] = useState<'approve' | 'use' | 'corroborate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corr, setCorr] = useState<Corroboration | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  // Decided: the card stops offering the decision at once (the outcome shows above);
  // the refreshed page drops it. A stale Approve + use must never sit under a result.
  const [decided, setDecided] = useState(false);
  const nameOf = (id: string) => card.members.find((m) => m.id === id)?.personaName ?? id;
  const title = `${card.accountName} · ${card.problemFamily.replace(/_/g, ' ')}`;

  /** The ONE decision: approve (+ use, which routes), optionally with the evidence Casey ticked. */
  async function approve(use: boolean, signalIds: string[] = []) {
    setBusy(use ? 'use' : 'approve'); setError(null);
    try {
      const r = await post<{ results: RowResult[]; routing?: UseOutcomeResponse | null }>({
        op: 'approve', fingerprint: card.fingerprint, hypothesisIds: [...checked], use, ...(signalIds.length ? { signalIds } : {}),
      });
      const rows = r.data.results ?? [];
      if (!r.ok && rows.length === 0) { setError(r.data.reason ?? r.data.error ?? 'approve_failed'); return; }
      const approved = rows.filter((x) => x.ok && (x.to === 'approved' || x.to === 'active')).length;
      const inUse = rows.filter((x) => x.ok && x.to === 'active').length;
      onOutcome({ key: `${card.accountName}|${card.problemFamily}`, title, approved, inUse, routing: r.data.routing ?? null, failures: rows.filter((x) => !x.ok).map((x) => `${nameOf(x.hypothesisId)}: ${x.detail}`) });
      if (approved > 0 && rows.every((x) => x.ok)) setDecided(true);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  async function corroborate() {
    setBusy('corroborate'); setError(null);
    try {
      const r = await post<Corroboration>({ op: 'corroborate', fingerprint: card.fingerprint });
      if (!r.ok) setError(r.data.reason ?? r.data.error ?? 'research_failed');
      else { setCorr(r.data); setChosen(new Set(r.data.outcome === 'contradicts' ? [] : r.data.newIndependent.map((f) => f.signalId))); }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  if (decided) {
    return (
      <p className="rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]" data-testid="thesis-group-decided">
        {title}: decided. The outcome is above.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] p-4" data-testid="thesis-group">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{card.accountName} · {card.problemFamily.replace(/_/g, ' ')}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {card.members.length} people share this thesis · {(() => { const waiting = card.members.filter((m) => SELECTABLE.has(m.status)).length; const inUse = card.members.filter((m) => m.status === 'active').length; return [waiting ? `${waiting} waiting for you` : null, inUse ? `${inUse} in use` : null].filter(Boolean).join(' · '); })()}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {card.members.map((m) => m.personaName ?? 'unknown').join(', ')}
          </p>
          <div className="mt-2"><DepthBadge card={card} /></div>
        </div>
        <Button type="button" size="sm" variant={open ? 'outline' : 'default'} onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Decide'}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 text-sm">
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
            {!corr ? (
              <>
                <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void corroborate()}>
                  {busy === 'corroborate' ? 'Searching public sources...' : 'Find more evidence'}
                </Button>
                <span className="ml-2 text-xs text-[var(--muted-foreground)]">One search for the whole thesis, not one per person.</span>
              </>
            ) : (
              <div className="rounded-md border border-[var(--border)] p-3" data-testid="corroboration">
                <p className="font-medium">
                  {corr.outcome === 'corroborated' ? 'FOUND EVIDENCE' : corr.outcome === 'contradicts' ? 'EVIDENCE CONTRADICTS THIS THESIS' : 'NO NEW EVIDENCE FOUND'}
                  {corr.reused ? <span className="ml-2 text-xs font-normal text-[var(--muted-foreground)]">(this thesis was searched in the last 24 hours)</span> : null}
                </p>
                {corr.outcome === 'contradicts' ? (
                  <ul className="mt-1 list-disc pl-5">{corr.research.conflicts.map((c) => <li key={c.site}>{c.site}: sources describe it moving both ways. Do not approve on this thesis.</li>)}</ul>
                ) : null}
                {corr.outcome === 'corroborated' ? (
                  <>
                    <ul className="mt-2 space-y-2">
                      {corr.newIndependent.map((f) => (
                        <li key={f.signalId} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            className="mt-1"
                            aria-label={`Use ${f.title}`}
                            checked={chosen.has(f.signalId)}
                            onChange={(e) => {
                              const next = new Set(chosen);
                              if (e.target.checked) next.add(f.signalId); else next.delete(f.signalId);
                              setChosen(next);
                            }}
                          />
                          <span>
                            <q>{f.excerpt}</q>
                            <span className="ml-1 text-xs text-[var(--muted-foreground)]"><a className="underline" href={f.url} target="_blank" rel="noreferrer">{f.title}</a>, {day(f.publishedAt)}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]" data-testid="what-it-changes">
                      What it changes: {card.depth.independentSources} to {card.depth.independentSources + chosen.size} independent sources for the people you check below.
                    </p>
                  </>
                ) : corr.outcome === 'no_second_source' ? (
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    Nothing fresh and independent was verified. Holding is a complete answer: close this and research later, or approve on what the thesis has.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">People</h3>
            <ul className="mt-1 space-y-1">
              {card.members.map((m) => {
                const editable = SELECTABLE.has(m.status);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-2">
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
                    <Badge variant="outline" className="text-[10px]">{STATUS_WORDS[m.status] ?? m.status.replace(/_/g, ' ')}</Badge>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {corr?.outcome === 'corroborated' && chosen.size > 0 ? (
                <Button type="button" size="sm" data-testid="use-evidence-approve" disabled={busy !== null || checked.size === 0} onClick={() => void approve(true, [...chosen])}>
                  {busy === 'use' ? 'Approving and routing (about a minute)...' : `Use this evidence + approve + use for ${checked.size}`}
                </Button>
              ) : (
                <Button type="button" size="sm" data-testid="approve-use" disabled={busy !== null || checked.size === 0 || corr?.outcome === 'contradicts'} onClick={() => void approve(true)}>
                  {busy === 'use' ? 'Approving and routing (about a minute)...' : `Approve + use for ${checked.size}`}
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" disabled={busy !== null || checked.size === 0} onClick={() => void approve(false)}>
                {busy === 'approve' ? 'Approving...' : 'Approve only'}
              </Button>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">Use means GAP routes these people now and recommends who to contact. Nothing is drafted, enrolled or sent.</p>
          </section>
          {error ? <p role="alert" className="text-[var(--destructive)]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function ThesisGroupReview({ cards, intro = true }: { cards: ThesisCard[]; intro?: boolean }) {
  // Held here, not on the card: approving changes the card (it may leave the list),
  // and success must never make the result disappear.
  const [outcomes, setOutcomes] = useState<ThesisOutcome[]>([]);
  if (cards.length === 0 && outcomes.length === 0) return null;
  return (
    <section className="space-y-3" aria-label="Account theses">
      {intro ? (
        <div>
          <h2 className="text-lg font-semibold">Account theses</h2>
          <p className="text-sm text-[var(--muted-foreground)]">One thesis, several people at one account: decide once.</p>
        </div>
      ) : null}
      {outcomes.map((o) => (
        <div key={o.key} className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{o.title}</p>
          <UseOutcome approved={o.approved} inUse={o.inUse} routing={o.routing} />
          {o.failures.length ? (
            <ul className="space-y-0.5 text-xs text-[var(--destructive)]" data-testid="row-failures">
              {o.failures.map((f) => <li key={f}>{f}</li>)}
            </ul>
          ) : null}
        </div>
      ))}
      {cards.map((c, i) => (
        <ThesisGroupCard
          key={c.fingerprint}
          card={c}
          openInitially={i === 0 && c.members.some((m) => SELECTABLE.has(m.status))}
          onOutcome={(o) => setOutcomes((cur) => [o, ...cur.filter((x) => x.key !== o.key)])}
        />
      ))}
    </section>
  );
}
