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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UseOutcome, type UseOutcomeResponse } from './use-outcome';

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
export interface Narrative {
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
type Decided =
  | { kind: 'used'; approved: number; inUse: number; routing: UseOutcomeResponse | null; failures: string[] }
  | { kind: 'rejected'; count: number };

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
export function ProposedThesis({ narrative, links = {} }: { narrative: Narrative; links?: Record<string, string> }) {
  return (
    <div data-testid="proposed-thesis" className="space-y-2">
      <Section label="Facts">
        <p>{uncited(narrative.observation)}</p>
      </Section>
      <Section label="Hypothesis">
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
  const [busy, setBusy] = useState<'research' | 'propose' | 'use' | 'reject' | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [decided, setDecided] = useState<Decided | null>(null);
  const group = personaIds && personaIds.length > 1 ? personaIds : null;

  async function research() {
    setBusy('research');
    setError(null);
    setResult(null);
    setProposal(null);
    setDecided(null);
    try {
      const r = await postJson<Result>('/api/gap/research', { decisionId });
      if (!r.ok) setError(r.data.error ?? 'research_failed');
      else setResult(r.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  // Evidence found: the machine proposes on its own. Casey's judgment is the decision below, not this.
  const runId = result?.outcome === 'evidence_found' ? result.runId : null;
  useEffect(() => {
    if (!runId) return;
    let live = true;
    setBusy('propose');
    postJson<{ hypothesisIds?: string[]; narrative?: Narrative }>(`/api/gap/research/${encodeURIComponent(runId)}/propose`, group ? { personaIds: group } : {})
      .then((r) => {
        if (!live) return;
        if (!r.ok || !r.data.hypothesisIds?.length || !r.data.narrative) setError(`The thesis could not be proposed: ${r.data.error ?? 'propose_failed'}`);
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
      setDecided(
        decision === 'reject'
          ? { kind: 'rejected', count: rows.filter((x) => x.ok).length }
          : {
              kind: 'used',
              approved: rows.filter((x) => x.ok && (x.to === 'approved' || x.to === 'active')).length,
              inUse: rows.filter((x) => x.ok && x.to === 'active').length,
              routing: r.data.routing ?? null,
              failures: rows.filter((x) => !x.ok).map((x) => x.detail),
            },
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const people = proposal?.hypothesisIds.length ?? 0;
  return (
    <div data-testid="research-this" className="space-y-2">
      {decided ? null : (
        <Button type="button" size="sm" disabled={busy !== null} onClick={research}>
          {busy === 'research' ? 'Researching public sources...' : result ? 'Research again' : 'Research this'}
        </Button>
      )}
      {error ? <p role="alert" className="text-xs text-[var(--destructive)]">{error}</p> : null}

      {result?.outcome === 'evidence_found' ? (
        <div data-testid="research-found" className="space-y-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs">
          {decided?.kind === 'used' ? (
            <>
              <UseOutcome approved={decided.approved} inUse={decided.inUse} routing={decided.routing} />
              {decided.failures.length ? <p role="alert" className="text-[var(--destructive)]">{decided.failures.join('; ')}</p> : null}
            </>
          ) : decided?.kind === 'rejected' ? (
            <p data-testid="proposal-rejected" className="font-semibold">Rejected. Nothing will be contacted for this thesis.</p>
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
