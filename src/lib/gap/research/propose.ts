/**
 * PROPOSE UPDATED HYPOTHESIS from a research run (last mile, 2026-09-25).
 *
 * One human click after RESEARCH THIS found evidence. Creates a DRAFT through
 * the existing proposeHypothesis (the same guards: every observation sentence
 * cites a linked signal, every signal belongs to the account). It never
 * submits, approves or activates: Casey reviews it like any draft.
 *
 * The observation is built only from FRESH verified facts that are a single
 * sentence, quoted verbatim with the source and date: a fact, never an
 * inference. The narrative (problem hypothesis, root causes, impacts,
 * falsification) is carried from the card's current hypothesis when there is
 * one, else a short hedged default for Casey to edit. Idempotent per run
 * (source_ref research:<runId>).
 */
import { proposeHypothesis } from '../hypothesis/service';
/**
 * Quote a verbatim excerpt as ONE cited observation sentence. An internal
 * period followed by a space (e.g. "The Kroger Co. (the Company)") would be a
 * sentence break to the observation validator, leaving an uncited fragment;
 * a citation token placed right after each such period keeps the quote's
 * words intact (the renderer strips the tokens) and every fragment cited.
 */
export function citedQuote(title: string, excerpt: string, signalId: string): string {
  const token = `[S:${signalId}]`;
  const quote = excerpt.trim().replace(/[.!?]+$/, '').replace(/([.!?])(\s)/g, `$1${token}$2`);
  return `${title}: "${quote}" ${token}.`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type ProposeFromResearchResult =
  | { ok: true; hypothesisId: string; existing: boolean }
  | { ok: false; reason: 'run_not_found' | 'no_fresh_evidence' | 'conflicting_evidence' | string };

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export async function proposeFromResearch(prisma: PrismaLike, input: { researchRunId: string; actor: string; now: Date }): Promise<ProposeFromResearchResult> {
  const run = await prisma.researchRun.findUnique({ where: { id: input.researchRunId }, select: { id: true, account_name: true, persona_id: true, provider_status: true } });
  if (!run) return { ok: false, reason: 'run_not_found' };
  const status = (run.provider_status ?? {}) as { outcome?: string; hypothesisId?: string | null; problemFamily?: string | null };
  if (status.outcome === 'conflicting_evidence') return { ok: false, reason: 'conflicting_evidence' };

  const records: Array<{ id: string }> = await prisma.evidenceRecord.findMany({ where: { research_run_id: run.id }, select: { id: true } });
  const signals: Array<{ id: string; title: string; evidence_text: string | null; observed_at: Date; freshness_expires_at: Date | null }> = records.length
    ? await prisma.prospectingSignal.findMany({
        where: { source_kind: 'evidence_record', source_id: { in: records.map((r) => r.id) }, account_name: run.account_name },
        select: { id: true, title: true, evidence_text: true, observed_at: true, freshness_expires_at: true },
        orderBy: { observed_at: 'desc' },
      })
    : [];
  const fresh = signals.filter((s) => !s.freshness_expires_at || s.freshness_expires_at.getTime() > input.now.getTime());
  const quotable = fresh.filter((s) => s.evidence_text && s.evidence_text.trim().length > 0).slice(0, 2);
  if (quotable.length === 0) return { ok: false, reason: 'no_fresh_evidence' };

  const base = status.hypothesisId
    ? await prisma.prospectingHypothesis.findUnique({ where: { id: status.hypothesisId } })
    : null;
  const persona = run.persona_id ? await prisma.persona.findUnique({ where: { id: run.persona_id }, select: { id: true } }) : null;

  const observation = quotable.map((s) => citedQuote(s.title, s.evidence_text!, s.id)).join(' ');
  const newest = quotable[0].observed_at.toISOString().slice(0, 10);

  const r = await proposeHypothesis(prisma, {
    accountName: run.account_name,
    primaryPersonaId: persona?.id ?? null,
    persona: base?.persona ?? 'supply_chain',
    problemFamily: base?.problem_family ?? status.problemFamily ?? 'hidden_capacity',
    observation,
    problemHypothesis:
      base?.problem_hypothesis ??
      'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.',
    rootCauseHypotheses: asList(base?.root_cause_hypotheses),
    impactHypotheses: asList(base?.impact_hypotheses),
    whyNow: `Public source dated ${newest}.`,
    falsificationQuestions: asList(base?.falsification_questions).length
      ? asList(base?.falsification_questions)
      : ['Did the change above add trailer volume or dwell at the sites that remain?'],
    whatANoMeans: base?.what_a_no_means ?? null,
    confidence: Math.min(Number(base?.confidence ?? 40), 60),
    signalIds: quotable.map((s) => s.id),
    primarySignalId: quotable[0].id,
    sourceRef: `research:${run.id}`,
    metadata: { proposedFrom: 'research_this', researchRunId: run.id, basedOn: base?.id ?? null },
    createdBy: input.actor,
  });
  if (!r.ok) {
    if (r.reason === 'duplicate_source_ref' && r.existingId) return { ok: true, hypothesisId: r.existingId, existing: true };
    return { ok: false, reason: r.reason };
  }
  return { ok: true, hypothesisId: r.id, existing: false };
}
