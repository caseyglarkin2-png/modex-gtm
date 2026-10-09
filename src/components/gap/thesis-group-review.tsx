'use client';

/**
 * Account thesis review (dogfood addendum 2026-09-25; reduced 2026-09-26).
 *
 * One card per account thesis (shared by 2+ people, or one person in the
 * Research lane). Casey makes ONE decision per thesis; everything after it is
 * system work:
 *
 *   APPROVE + USE FOR N           the normal legal transitions per checked row,
 *                                 each audited, then routing runs on its own and
 *                                 the outcome (ready / research / blocked) shows
 *                                 above the list. There is no separate ROUTE.
 *   FIND MORE EVIDENCE            one research run for the whole thesis
 *                                 (POST /api/gap/theses op corroborate).
 *   USE THIS EVIDENCE +           a READY thesis: the facts Casey ticks are
 *   APPROVE + USE                 linked to the checked people, then the same
 *                                 approve + use. Nothing he did not choose.
 *   HOLD                          no good evidence is a complete answer.
 *
 * Monday readiness (2026-09-27): what the card offers comes from the SERVER
 * (card.readiness and each member's `next`, derived from the canonical
 * evidence gate), never from status alone. A thesis that is not ready for
 * outreach offers FIND VERIFIED EVIDENCE, never an Approve + use the server
 * will refuse. Choosing verified evidence (op use_evidence) rebuilds an
 * editable observation, or creates a DRAFT revision of a frozen approved one;
 * Casey then reads the new observation and approves it explicitly.
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
import { refusalCopy, refusalSentence } from '@/lib/gap/ui/refusal-copy';
import { UseOutcome, type OutcomeState, type UseOutcomeResponse } from './use-outcome';
import { refreshNow } from '@/components/gap/refresh-now';

interface RowResult { hypothesisId: string; ok: boolean; from: string; to: string | null; detail: string; reason?: string; revisionId?: string }
interface Summary extends OutcomeState { approved: number; inUse: number }
interface Fact { signalId: string; excerpt: string; url: string; title: string; publishedAt: string; fresh: boolean }
interface Corroboration {
  outcome: 'corroborated' | 'no_second_source' | 'contradicts' | 'search_unavailable';
  reused: boolean;
  research: { runId: string; facts: Fact[]; conflicts: Array<{ site: string; signalIds: string[] }>; notes: string[] };
  newIndependent: Fact[];
  /** The ONE fact a first touch opens with by default (server-chosen, research order). */
  primaryDefault?: string | null;
  /** Facts too long to open a first touch with: research context only. */
  tooLongToOpen?: string[];
}
export interface ThesisOutcome {
  key: string;
  title: string;
  approved: number;
  inUse: number;
  routing: UseOutcomeResponse | null;
  failures: string[];
  state?: OutcomeState;
  /** USE THIS VERIFIED EVIDENCE: revisions created / observations rebuilt. */
  revised?: { drafts: number; rebuilt: number };
}

/** Server-derived next steps (hypothesis/actionability.ts). */
const DECIDE = new Set(['approve_use', 'use']);
const RESEARCH = new Set(['find_evidence', 'revise']);
const NEXT_WORDS: Record<string, string> = {
  approve_use: 'needs review',
  use: 'approved, not in use',
  find_evidence: 'needs verified evidence',
  revise: 'approved, needs verified evidence',
  in_use: 'in use',
  none: 'closed',
};
const READINESS_WORDS: Record<string, string> = {
  evidence_insufficient: 'no outreach evidence yet',
  evidence_expired: 'evidence ended, closed, undated or superseded',
  no_evidence: 'no evidence',
  opener_too_long: 'opener too long',
};
const DEPTH_TONE: Record<string, string> = {
  INSUFFICIENT: 'border-[var(--destructive)] text-[var(--destructive)]',
  'SINGLE-SOURCE': 'border-amber-500 text-amber-700 dark:text-amber-400',
  CORROBORATED: 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
  'WELL-SUPPORTED': 'border-emerald-600 text-emerald-700 dark:text-emerald-400',
};
/** Plain words for a refused USE THIS EVIDENCE (the raw code stays in parentheses as the detail). */
function evidenceRefusal(code: string): string {
  const [head, , why] = code.split(':');
  if (head === 'not_verified_evidence') {
    const what = ['expired', 'ended', 'closed', 'undated', 'superseded'].includes(why ?? '') ? 'ended, closed, is undated or was superseded: it cannot open a conversation' : why === 'not_a_physical_network_change' ? 'does not state a physical-network change' : 'is not a verified, quoted fact about this account';
    return `Nothing changed. The fact you chose ${what}. Choose another fact or research again. (${code})`;
  }
  if (head === 'observation_unsupported') return `Nothing changed. The chosen fact could not be quoted as a supported observation. Choose another fact. (${code})`;
  return refusalSentence(code) ?? code;
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

async function post<T>(body: unknown): Promise<{ ok: boolean; data: T & { error?: string; reason?: string } }> {
  const res = await fetch('/api/gap/theses', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as T & { error?: string; reason?: string } };
}

function DepthBadge({ card }: { card: ThesisCard }) {
  const n = card.depth.independentSources;
  return (
    <Badge variant="outline" className={DEPTH_TONE[card.depth.label] ?? ''} title="Research depth. Independent sources: syndicated copies, the same filing, AI summaries and quote-of-quote count once">
      Research depth: {card.depth.label} · {n} independent source{n === 1 ? '' : 's'}
      {card.depth.keywordOnly > 0 ? ` · ${card.depth.keywordOnly} keyword hit` : ''}
    </Badge>
  );
}

/** OUTREACH READINESS: a thesis can have a source and still not be ready. */
function ReadinessBadge({ card }: { card: ThesisCard }) {
  return card.readiness.ready ? (
    <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:text-emerald-400" data-testid="outreach-readiness">Ready for outreach</Badge>
  ) : (
    <Badge variant="outline" className="border-[var(--destructive)] text-[var(--destructive)]" data-testid="outreach-readiness">
      Not ready for outreach{card.readiness.reason ? `: ${READINESS_WORDS[card.readiness.reason] ?? card.readiness.reason}` : ''}
    </Badge>
  );
}

function ThesisGroupCard({ card, openInitially, onOutcome }: { card: ThesisCard; openInitially: boolean; onOutcome: (o: ThesisOutcome) => void }) {
  const router = useRouter();
  const ready = card.readiness.ready;
  const actionable = ready ? DECIDE : RESEARCH;
  const [open, setOpen] = useState(openInitially);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(card.members.filter((m) => actionable.has(m.next)).map((m) => m.id)));
  const [busy, setBusy] = useState<'approve' | 'use' | 'corroborate' | 'evidence' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [corr, setCorr] = useState<Corroboration | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  // Not ready: exactly ONE primary outreach fact opens the first touch (final Monday P1).
  const [primary, setPrimary] = useState<string | null>(null);
  // Decided: the card stops offering the decision at once (the outcome shows above);
  // the refreshed page drops it. A stale Approve + use must never sit under a result.
  const [decided, setDecided] = useState(false);
  const nameOf = (id: string) => card.members.find((m) => m.id === id)?.personaName ?? id;
  const title = `${card.accountName} · ${card.problemFamily.replace(/_/g, ' ')}`;
  const key = `${card.accountName}|${card.problemFamily}`;

  /** The ONE decision: approve (+ use, which routes), optionally with the evidence Casey ticked. */
  async function approve(use: boolean, signalIds: string[] = []) {
    setBusy(use ? 'use' : 'approve'); setError(null);
    try {
      const r = await post<{ results: RowResult[]; routing?: UseOutcomeResponse | null; summary?: Summary }>({
        op: 'approve', fingerprint: card.fingerprint, hypothesisIds: [...checked], use, ...(signalIds.length ? { signalIds } : {}),
      });
      const rows = r.data.results ?? [];
      if (!r.ok && rows.length === 0) { setError(r.data.reason ?? r.data.error ?? 'approve_failed'); return; }
      // Actual state (already approved rows count): never "0 approved" over approved rows.
      const summary = r.data.summary;
      const final = (x: RowResult) => x.to ?? x.from;
      const approved = summary?.approved ?? rows.filter((x) => final(x) === 'approved' || final(x) === 'active').length;
      const inUse = summary?.inUse ?? rows.filter((x) => final(x) === 'active').length;
      onOutcome({ key, title, approved, inUse, routing: r.data.routing ?? null, failures: rows.filter((x) => !x.ok).map((x) => `${nameOf(x.hypothesisId)}: ${x.detail}`), state: summary });
      if (approved > 0 && rows.every((x) => x.ok)) setDecided(true);
      refreshNow(router);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  /** USE THIS VERIFIED EVIDENCE: rebuild editable observations, revise frozen ones. Never approves. */
  async function useEvidence(primarySignalId: string) {
    setBusy('evidence'); setError(null);
    try {
      const r = await post<{ results: RowResult[] }>({ op: 'use_evidence', fingerprint: card.fingerprint, hypothesisIds: [...checked], signalIds: [primarySignalId], primarySignalId });
      const rows = r.data.results ?? [];
      if (!r.ok && rows.length === 0) { setError(evidenceRefusal(r.data.reason ?? r.data.error ?? 'evidence_failed')); return; }
      const drafts = rows.filter((x) => x.ok && x.revisionId).length;
      const rebuilt = rows.filter((x) => x.ok && !x.revisionId && (x.from === 'draft' || x.from === 'review_required')).length;
      onOutcome({ key, title, approved: 0, inUse: 0, routing: null, failures: rows.filter((x) => !x.ok).map((x) => `${nameOf(x.hypothesisId)}: ${x.detail}`), revised: { drafts, rebuilt } });
      setCorr(null); setChosen(new Set()); setPrimary(null);
      if (rows.length > 0 && rows.every((x) => x.ok)) setDecided(true);
      refreshNow(router);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  async function corroborate() {
    setBusy('corroborate'); setError(null);
    try {
      const r = await post<Corroboration>({ op: 'corroborate', fingerprint: card.fingerprint });
      if (!r.ok) setError(r.data.reason ?? r.data.error ?? 'research_failed');
      else {
        setCorr(r.data);
        setChosen(new Set(r.data.outcome === 'contradicts' ? [] : r.data.newIndependent.map((f) => f.signalId)));
        setPrimary(r.data.outcome === 'contradicts' ? null : (r.data.primaryDefault ?? null));
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(null); }
  }

  if (decided) {
    return (
      <p className="rounded-lg border border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]" data-testid="thesis-group-decided">
        {title}: decided. The outcome is above.
      </p>
    );
  }

  const approvedCount = card.members.filter((m) => m.status === 'approved' || m.status === 'active').length;
  const decideCount = card.members.filter((m) => DECIDE.has(m.next)).length;
  const researchCount = card.members.filter((m) => RESEARCH.has(m.next)).length;
  const inUseCount = card.members.filter((m) => m.next === 'in_use').length;
  const why = ready ? null : refusalCopy(card.readiness.reason);

  return (
    <div className="rounded-lg border border-[var(--border)] p-4" data-testid="thesis-group">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]" data-testid="thesis-state">
            {[
              card.members.length === 1 ? '1 person' : `${card.members.length} people share this thesis`,
              approvedCount ? `${approvedCount} approved` : null,
              `${inUseCount} in use`,
              decideCount ? `${decideCount} waiting for you` : null,
              researchCount ? `${researchCount} need verified evidence` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {card.members.map((m) => m.personaName ?? 'unknown').join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2"><ReadinessBadge card={card} /><DepthBadge card={card} /></div>
        </div>
        <Button type="button" size="sm" variant={open ? 'outline' : 'default'} onClick={() => setOpen(!open)}>
          {open ? 'Close' : ready ? 'Decide' : 'Research'}
        </Button>
      </div>

      {open ? (
        <div className="mt-4 space-y-4 text-sm">
          {why ? (
            <section data-testid="not-ready-why" className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3">
              <p className="font-medium">Not ready for outreach. {why.why}</p>
              <p className="mt-1">Next: {why.next}</p>
              {card.members.some((m) => m.next === 'revise') ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Approved versions are frozen: the fact you choose creates a new draft for your review. The approved versions and their history are kept.
                </p>
              ) : null}
            </section>
          ) : null}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{card.members.length > 1 ? 'Shared thesis' : 'Thesis'}</h3>
            <p className="mt-1"><span className="text-[var(--muted-foreground)]">Observation:</span> {card.observation}</p>
            <p className="mt-1"><span className="text-[var(--muted-foreground)]">What we think is happening:</span> {card.problemHypothesis}</p>
            {card.rootCauses.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Root causes:</span> {card.rootCauses.join('; ')}</p> : null}
            {card.impacts.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Impacts:</span> {card.impacts.join('; ')}</p> : null}
            {card.falsification.length ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">Falsify with:</span> {card.falsification.join(' ')}</p> : null}
            {card.whatANoMeans ? <p className="mt-1"><span className="text-[var(--muted-foreground)]">What a no means:</span> {card.whatANoMeans}</p> : null}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Evidence</h3>
            <ul className="mt-1 space-y-1">
              {card.sources.map((s) => (
                <li key={s.id} className="break-words">
                  {s.url ? <a className="underline" href={s.url} target="_blank" rel="noreferrer">{s.title ?? s.url}</a> : (s.title ?? s.id)}
                  {!s.quoted && s.kind !== 'operator_knowledge' ? <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">keyword hit, no quoted passage (not counted as a source)</span> : null}
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
                <Button type="button" size="sm" variant={ready ? 'outline' : 'default'} data-testid="find-evidence" disabled={busy !== null} onClick={() => void corroborate()}>
                  {busy === 'corroborate' ? 'Searching public sources...' : ready ? 'Find more evidence' : 'Find verified evidence'}
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
                      {corr.newIndependent.map((f) => {
                        const tooLong = (corr.tooLongToOpen ?? []).includes(f.signalId);
                        return (
                          <li key={f.signalId} className="flex items-start gap-2">
                            {ready ? (
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
                            ) : (
                              <input
                                type="radio"
                                className="mt-1"
                                name={`primary-${card.fingerprint}`}
                                aria-label={`Open with ${f.title}`}
                                data-testid="primary-fact"
                                disabled={tooLong}
                                checked={primary === f.signalId}
                                onChange={() => setPrimary(f.signalId)}
                              />
                            )}
                            <span className="min-w-0 break-words">
                              <q>{f.excerpt}</q>
                              <span className="ml-1 text-xs text-[var(--muted-foreground)]"><a className="underline" href={f.url} target="_blank" rel="noreferrer">{f.title}</a>, {day(f.publishedAt)}</span>
                              {!ready && tooLong ? <span className="ml-1 text-xs text-[var(--muted-foreground)]">Too long to open a first email; research context only.</span> : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]" data-testid="what-it-changes">
                      {ready
                        ? `What it changes: ${card.depth.independentSources} to ${card.depth.independentSources + chosen.size} independent sources for the people you check below.`
                        : 'What it changes: the observation is rewritten as the ONE fact you choose to open with, quoted with its source. The other facts stay research context. You review it before anything is approved.'}
                    </p>
                  </>
                ) : corr.outcome === 'search_unavailable' ? (
                  <p className="mt-1 text-[var(--muted-foreground)]" data-testid="search-unavailable">
                    The web search could not run right now. Nothing was learned, so nothing is concluded: try again in an hour.
                  </p>
                ) : corr.outcome === 'no_second_source' ? (
                  <p className="mt-1 text-[var(--muted-foreground)]" data-testid="hold">
                    {ready
                      ? 'Nothing fresh and independent was verified. Holding is a complete answer: close this and research later, or approve on what the thesis has.'
                      : 'No outreach evidence was found (what research did find is under the account\'s Sources / signals). Holding is a complete answer: this thesis stays in Research and there is nothing to approve yet. Research again later.'}
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">People</h3>
            <ul className="mt-1 space-y-1">
              {card.members.map((m) => {
                const editable = actionable.has(m.next);
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
                    <Badge variant="outline" className="text-[10px]">{NEXT_WORDS[m.next] ?? m.status.replace(/_/g, ' ')}</Badge>
                  </li>
                );
              })}
            </ul>
            {ready ? (
              <>
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
                  {card.members.some((m) => m.next === 'approve_use' && checked.has(m.id)) ? (
                    <Button type="button" size="sm" variant="ghost" disabled={busy !== null || checked.size === 0} onClick={() => void approve(false)}>
                      {busy === 'approve' ? 'Approving...' : 'Approve only'}
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Use means GAP routes these people now and recommends who to contact. Nothing is drafted, enrolled or sent.</p>
              </>
            ) : (
              <div className="mt-3 space-y-1">
                {corr?.outcome === 'corroborated' && primary ? (
                  <Button type="button" size="sm" data-testid="use-verified-evidence" disabled={busy !== null || checked.size === 0} onClick={() => void useEvidence(primary)}>
                    {busy === 'evidence' ? 'Rewriting the observation...' : `Open with this fact for ${checked.size}`}
                  </Button>
                ) : corr?.outcome === 'corroborated' ? (
                  <p className="text-xs text-[var(--muted-foreground)]" data-testid="no-openable-fact">Every fact found is too long to open a first email with. Hold, or research again later.</p>
                ) : null}
                <p className="text-xs text-[var(--muted-foreground)]">Nothing is approved, used or sent from here. Using evidence rewrites the observation from the fact you choose, for your review.</p>
              </div>
            )}
          </section>
          {error ? <p role="alert" className="text-[var(--destructive)]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function RevisionOutcome({ revised }: { revised: NonNullable<ThesisOutcome['revised']> }) {
  return (
    <div data-testid="revision-outcome" className="space-y-2 rounded-md border border-[var(--border)] p-3 text-sm">
      <p className="font-semibold uppercase tracking-wide">
        {revised.drafts > 0
          ? `${revised.drafts} revised draft${revised.drafts === 1 ? '' : 's'} ready for your review`
          : `${revised.rebuilt} observation${revised.rebuilt === 1 ? '' : 's'} rewritten from verified evidence`}
      </p>
      <p className="text-xs">
        {revised.drafts > 0 ? 'The approved versions are unchanged and kept in history. ' : ''}Read the new observation, then Approve + use. Nothing is approved, in use or sent yet.
      </p>
      <a href="/gap?lane=review" className="inline-flex rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90">
        Review the revised thesis
      </a>
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
          {o.revised ? <RevisionOutcome revised={o.revised} /> : <UseOutcome approved={o.approved} inUse={o.inUse} routing={o.routing} state={o.state} />}
          {o.failures.length ? (
            // Per-person machine detail sits under Details; the plain-language outcome above is the primary message.
            <details className="text-xs" data-testid="row-failures">
              <summary className="cursor-pointer text-[var(--muted-foreground)]">Details for {o.failures.length} {o.failures.length === 1 ? 'person' : 'people'}</summary>
              <ul className="mt-1 space-y-0.5 text-[var(--muted-foreground)]">
                {o.failures.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </details>
          ) : null}
        </div>
      ))}
      {cards.map((c, i) => (
        <ThesisGroupCard
          key={c.fingerprint}
          card={c}
          openInitially={i === 0 && c.members.some((m) => DECIDE.has(m.next) || RESEARCH.has(m.next))}
          onOutcome={(o) => setOutcomes((cur) => [o, ...cur.filter((x) => x.key !== o.key)])}
        />
      ))}
    </section>
  );
}
