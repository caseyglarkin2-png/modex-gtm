'use client';

/**
 * RESEARCH THIS on a research-required card (last mile, 2026-09-25; one
 * decision since the debt burn, 2026-09-26).
 *
 * One click runs the evidence search for the card (POST /api/gap/research)
 * and shows exactly one result:
 *   facts found          GAP proposes a thesis from the fresh verified facts
 *                        on its own (a DRAFT; the machine proposing is not a
 *                        Casey judgment) and shows the WHOLE narrative right
 *                        here: facts, hypothesis, root causes, impacts, what
 *                        would prove it wrong, evidence. Casey decides once:
 *                        APPROVE + USE (the audited submit, approve, activate
 *                        transitions, then routing for these people only),
 *                        REJECT, or NEEDS WORK (edit it in Review).
 *   nothing defensible   "No defensible outreach trigger found." Hold.
 *   conflicting          the conflict, and no outreach
 * Nothing here drafts or sends. Voice: no em dashes.
 */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UseOutcome, type UseOutcomeResponse } from './use-outcome';
import { ReportThis } from './feedback-button';
import { refreshNow } from '@/components/gap/refresh-now';

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
  outcome: 'evidence_found' | 'insufficient_evidence' | 'conflicting_evidence' | 'provider_unavailable';
  facts: Fact[];
  rejected: Array<{ url: string; reason: string }>;
  /** Every page the run looked at (research aperture). */
  sources?: Array<{ url: string; status: string }>;
  conflicts: Array<{ site: string; signalIds: string[] }>;
}
/** Final Monday P1: the person already has a revision of this thesis; research did not run. */
interface ExistingRevisionResult {
  outcome: 'existing_revision';
  existingRevision: { hypothesisId: string; status: string };
}
type ResearchResponse = Result | ExistingRevisionResult;
interface Narrative {
  observation: string;
  problemHypothesis: string;
  rootCauses: string[];
  impacts: string[];
  wouldProveWrong: string[];
  whatANoMeans: string | null;
  evidence: Array<{ signalId: string; title: string; excerpt: string; observedAt: string }>;
}
interface Proposal {
  hypothesisIds: string[];
  narrative: Narrative;
}
export type Decided =
  | { kind: 'used'; approved: number; inUse: number; routing: UseOutcomeResponse | null; failures: string[] }
  | { kind: 'rejected'; count: number };

/**
 * The lane that hosts RESEARCH THIS keeps each decision's outcome on screen:
 * APPROVE + USE re-routes the people, so their card leaves RESEARCH (and this
 * component with it) the moment the lane refreshes. Success must never make
 * the result disappear.
 */
export const ResearchOutcomeContext = createContext<((o: { key: string; decided: Decided }) => void) | null>(null);

export function ResearchOutcomeView({ decided }: { decided: Decided }) {
  return decided.kind === 'used' ? (
    <>
      <UseOutcome approved={decided.approved} inUse={decided.inUse} routing={decided.routing} />
      {decided.failures.length ? <p role="alert" className="text-xs text-[var(--destructive)]">{decided.failures.join('; ')}</p> : null}
    </>
  ) : (
    <p data-testid="proposal-rejected" className="text-xs font-semibold">Rejected. Nothing will be contacted for this thesis.</p>
  );
}

const day = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
/** Citation tokens are for the validator, not for Casey. */
const uncited = (text: string) => text.replace(/\s*\[S:[^\]]+\]/g, '').trim();

async function postJson<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return { ok: res.ok, data: (await res.json().catch(() => ({}))) as T & { error?: string } };
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      {children}
    </div>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  ) : (
    <p className="italic text-[var(--muted-foreground)]">{empty}</p>
  );
}

/** The proposed thesis, exactly as it will be approved. */
function ProposedThesis({ narrative, links = {} }: { narrative: Narrative; links?: Record<string, string> }) {
  return (
    <div data-testid="proposed-thesis" className="space-y-2">
      <Section label="Facts">
        <p>{uncited(narrative.observation)}</p>
      </Section>
      <Section label="What we think is happening">
        <p>{narrative.problemHypothesis}</p>
      </Section>
      <Section label="Root causes">
        <List items={narrative.rootCauses} empty="None stated. Add them under Needs work if they matter." />
      </Section>
      <Section label="Impacts">
        <List items={narrative.impacts} empty="None stated. Add them under Needs work if they matter." />
      </Section>
      <Section label="Would prove it wrong">
        <List items={[...narrative.wouldProveWrong, ...(narrative.whatANoMeans ? [`A no means: ${narrative.whatANoMeans}`] : [])]} empty="None stated." />
      </Section>
      <Section label="Evidence">
        <ul className="space-y-0.5">
          {narrative.evidence.map((e) => (
            <li key={e.signalId}>
              {links[e.signalId] ? (
                <a href={links[e.signalId]} target="_blank" rel="noreferrer noopener" className="underline">
                  {e.title}
                </a>
              ) : (
                e.title
              )}
              , {day(e.observedAt)}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

/** `personaIds` (a RESEARCH group, 2026-09-26): one search, and the proposal covers every person in the group. */
export function ResearchThis({ decisionId, personaIds }: { decisionId: string; personaIds?: number[] }) {
  const router = useRouter();
  const report = useContext(ResearchOutcomeContext);
  const [busy, setBusy] = useState<'research' | 'propose' | 'use' | 'reject' | null>(null);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  // The person's existing revision (from research or from propose): the one place to go next.
  const [revision, setRevision] = useState<{ hypothesisId: string; status: string } | null>(null);
  // A double click fires twice before React re-renders `disabled`: one request at a time, always.
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [decided, setDecided] = useState<Decided | null>(null);
  const group = personaIds && personaIds.length > 1 ? personaIds : null;

  async function research() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy('research');
    setError(null);
    setResult(null);
    setProposal(null);
    setDecided(null);
    try {
      const r = await postJson<ResearchResponse>('/api/gap/research', { decisionId });
      if (!r.ok) setError(r.data.error ?? 'research_failed');
      else {
        setResult(r.data);
        if (r.data.outcome === 'existing_revision') setRevision(r.data.existingRevision);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }

  // Evidence found: the machine proposes on its own. Casey's judgment is the decision below, not this.
  const runId = result?.outcome === 'evidence_found' ? result.runId : null;
  useEffect(() => {
    if (!runId) return;
    let live = true;
    setBusy('propose');
    postJson<{ hypothesisIds?: string[]; narrative?: Narrative; existingRevision?: { hypothesisId: string; status: string } }>(`/api/gap/research/${encodeURIComponent(runId)}/propose`, group ? { personaIds: group } : {})
      .then((r) => {
        if (!live) return;
        if (r.data.error === 'revision_exists' && r.data.existingRevision) setRevision(r.data.existingRevision);
        else if (!r.ok || !r.data.hypothesisIds?.length || !r.data.narrative) setError(`The thesis could not be proposed: ${r.data.error ?? 'propose_failed'}`);
        else setProposal({ hypothesisIds: r.data.hypothesisIds, narrative: r.data.narrative });
      })
      .catch((err) => live && setError(err instanceof Error ? err.message : String(err)))
      .finally(() => live && setBusy(null));
    return () => {
      live = false;
    };
    // group is derived from props and stable for the card's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function decide(decision: 'approve_and_use' | 'reject') {
    if (!proposal || !runId) return;
    setBusy(decision === 'reject' ? 'reject' : 'use');
    setError(null);
    try {
      const r = await postJson<{ results?: Array<{ ok: boolean; to: string | null; detail: string }>; routing?: UseOutcomeResponse | null }>(
        `/api/gap/research/${encodeURIComponent(runId)}/decide`,
        { hypothesisIds: proposal.hypothesisIds, decision },
      );
      const rows = r.data.results ?? [];
      if (rows.length === 0) {
        setError(r.data.error ?? 'decision_failed');
        return;
      }
      const outcome: Decided =
        decision === 'reject'
          ? { kind: 'rejected', count: rows.filter((x) => x.ok).length }
          : {
              kind: 'used',
              approved: rows.filter((x) => x.ok && (x.to === 'approved' || x.to === 'active')).length,
              inUse: rows.filter((x) => x.ok && x.to === 'active').length,
              routing: r.data.routing ?? null,
              failures: rows.filter((x) => !x.ok).map((x) => x.detail),
            };
      setDecided(outcome);
      report?.({ key: runId, decided: outcome });
      refreshNow(router);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const people = proposal?.hypothesisIds.length ?? 0;
  return (
    <div data-testid="research-this" className="space-y-2">
      {revision ? (
        <div data-testid="research-existing-revision" className="space-y-1 rounded-md border border-[var(--border)] p-3 text-xs">
          <p className="font-semibold">A revised thesis already exists for this person.</p>
          <p className="text-[var(--muted-foreground)]">Nothing new was created. Review that revision instead.</p>
          <a href="/gap?lane=review" className="underline">
            Review the revised thesis
          </a>
        </div>
      ) : null}
      {decided || revision ? null : (
        <Button type="button" size="sm" disabled={busy !== null} onClick={research}>
          {busy === 'research' ? 'Researching public sources...' : result ? 'Research again' : 'Research this'}
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-xs text-[var(--destructive)]">
          {error}
          <ReportThis errorCode="research_failed" surface="research-this" />
        </p>
      ) : null}

      {result?.outcome === 'evidence_found' ? (
        <div data-testid="research-found" className="space-y-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
          {decided && !report ? (
            <ResearchOutcomeView decided={decided} />
          ) : decided ? (
            <p className="text-[var(--muted-foreground)]">Decided. The outcome is at the top of this lane.</p>
          ) : proposal ? (
            <>
              <p className="font-semibold">
                Proposed thesis{people > 1 ? ` for ${people} people` : ''}. Nothing is contacted until you approve and use it.
              </p>
              <ProposedThesis narrative={proposal.narrative} links={Object.fromEntries(result.facts.map((f) => [f.signalId, f.url]))} />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" disabled={busy !== null} onClick={() => void decide('approve_and_use')}>
                  {busy === 'use' ? 'Approving and routing...' : people > 1 ? `Approve + use for ${people}` : 'Approve + use'}
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => void decide('reject')}>
                  {busy === 'reject' ? 'Rejecting...' : 'Reject'}
                </Button>
                <a href="/gap?lane=review" className="underline">
                  Needs work: edit in Review
                </a>
              </div>
            </>
          ) : busy === 'propose' ? (
            <p>Evidence found. Proposing a thesis from it...</p>
          ) : null}
        </div>
      ) : null}

      {result?.outcome === 'provider_unavailable' ? (
        <div data-testid="research-unavailable" className="space-y-1 rounded-md border border-[var(--border)] p-3 text-xs">
          <p className="font-semibold">The web search could not run right now.</p>
          <p className="text-[var(--muted-foreground)]">Nothing was learned, so nothing is concluded. Try again in an hour.</p>
        </div>
      ) : null}

      {result?.outcome === 'insufficient_evidence' ? (
        <div data-testid="research-none" className="space-y-1 rounded-md border border-[var(--border)] p-3 text-xs">
          <p className="font-semibold">No defensible outreach trigger found.</p>
          <p className="text-[var(--muted-foreground)]">
            Recommendation: hold and research later.{' '}
            {result.facts.length > 0 ? `${result.facts.length} older fact(s) were found but are stale. ` : ''}
            {result.sources?.length
              ? `Sources / signals looked at: ${result.sources.length} · claims verified at source: ${result.facts.length}. No outreach evidence is not "nothing found": they are on the account page under Sources / signals, with the reason.`
              : result.rejected.length > 0
                ? `${result.rejected.length} candidate(s) did not qualify as outreach facts (not verifiable at the source, undated, or not about physical operations); they are on the account page under Sources / signals.`
                : ''}
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
