/**
 * PROPOSE UPDATED HYPOTHESIS from a research run (last mile, 2026-09-25).
 *
 * Machine work after RESEARCH THIS found evidence (the cockpit calls it on its
 * own; since the debt burn, 2026-09-26, it is not a Casey click). Creates a DRAFT through
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
 *
 * Group research (2026-09-26): with `personaIds`, ONE run proposes the same
 * draft for every person in the group (each its own row, source_ref
 * research:<runId>:p<personaId>; the run's own person keeps research:<runId>),
 * so the drafts form one sibling thesis and Casey decides once in REVIEW.
 * A person who does not belong to the run's account is skipped, never proposed.
 */
import { sourceLabel } from './source-label';
import { proposeHypothesis } from '../hypothesis/service';
import { GATE_SIGNAL_SELECT, outreachFactRefusal, type GateSignal } from './evidence-gate';
import { actionabilityOf } from '../hypothesis/actionability';
import { existingRevisionFor, type ExistingRevision } from '../hypothesis/current-revision';
/**
 * Quote a verbatim excerpt as ONE cited observation sentence. An internal
 * period followed by a space (e.g. "The Kroger Co. (the Company)") would be a
 * sentence break to the observation validator, leaving an uncited fragment;
 * a citation token placed right after each such period keeps the quote's
 * words intact (the renderer strips the tokens) and every fragment cited.
 */
export function citedQuote(title: string, excerpt: string, signalId: string, accountName?: string | null): string {
  const token = `[S:${signalId}]`;
  const quote = excerpt.trim().replace(/[.!?]+$/, '').replace(/([.!?])(\s)/g, `$1${token}$2`);
  return `${sourceLabel(title, accountName)}: "${quote}" ${token}.`;
}

// Moved to ./source-label (ops closeout 16: the evidence gate reads it too).
export { sourceLabel } from './source-label';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/**
 * The narrative every draft of this proposal carries, returned so Casey reads
 * exactly what he is approving (debt burn, 2026-09-26: the proposal is shown
 * inline and decided with one APPROVE + USE, never a second trip to REVIEW).
 */
export interface ProposedNarrative {
  observation: string;
  problemHypothesis: string;
  rootCauses: string[];
  impacts: string[];
  wouldProveWrong: string[];
  whatANoMeans: string | null;
  evidence: Array<{ signalId: string; title: string; excerpt: string; observedAt: string }>;
}

export type ProposeFromResearchResult =
  | {
      ok: true;
      hypothesisId: string;
      existing: boolean;
      hypothesisIds: string[];
      skipped?: number[];
      /** Group members who already have current thesis work: nothing new was proposed for them (final Monday P1). */
      alreadyRevised?: Array<{ personaId: number; revision: ExistingRevision }>;
      narrative: ProposedNarrative;
    }
  /** Final Monday P1: the person already has a revision of this thesis; nothing new was created. */
  | { ok: false; reason: 'revision_exists'; existingRevision: ExistingRevision }
  | { ok: false; reason: 'run_not_found' | 'no_fresh_evidence' | 'conflicting_evidence' | string };

/**
 * Monday readiness: the person's current APPROVED row this proposal replaces,
 * when that row is frozen and not ready for outreach (a keyword observation).
 * The new draft points at it with supersedes_id, so the old row leaves current
 * work instead of lingering in Research beside its replacement. The old row is
 * never written. A ready or active row is never superseded here.
 */
async function frozenToSupersede(prisma: PrismaLike, accountName: string, personaId: number | null, problemFamily: string, now: Date): Promise<string | null> {
  if (personaId == null) return null;
  // Same thesis family only: a draft for family X never retires an unrelated family Y thesis.
  const row = await prisma.prospectingHypothesis.findFirst({
    where: { account_name: accountName, primary_persona_id: personaId, problem_family: problemFamily, status: 'approved', superseded_by: { is: null } },
    orderBy: { created_at: 'desc' },
    include: { signals: { include: { signal: { select: { ...GATE_SIGNAL_SELECT, freshness_expires_at: true } } } } },
  });
  if (!row || row.status !== 'approved') return null;
  const next = actionabilityOf({ status: row.status, observation: row.observation, account_name: row.account_name, signals: (row.signals ?? []).map((l: { signal?: unknown }) => l.signal as never) }, now).next;
  return next === 'revise' ? row.id : null;
}

const asList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

export async function proposeFromResearch(prisma: PrismaLike, input: { researchRunId: string; actor: string; now: Date; personaIds?: number[] }): Promise<ProposeFromResearchResult> {
  const run = await prisma.researchRun.findUnique({ where: { id: input.researchRunId }, select: { id: true, account_name: true, persona_id: true, provider_status: true } });
  if (!run) return { ok: false, reason: 'run_not_found' };
  const status = (run.provider_status ?? {}) as { outcome?: string; hypothesisId?: string | null; problemFamily?: string | null };
  if (status.outcome === 'conflicting_evidence') return { ok: false, reason: 'conflicting_evidence' };

  const records: Array<{ id: string }> = await prisma.evidenceRecord.findMany({ where: { research_run_id: run.id }, select: { id: true } });
  const signals: Array<GateSignal & { id: string; title: string; evidence_text: string | null; observed_at: Date; freshness_expires_at: Date | null }> = records.length
    ? await prisma.prospectingSignal.findMany({
        where: { source_kind: 'evidence_record', source_id: { in: records.map((r) => r.id) }, account_name: run.account_name },
        select: { ...GATE_SIGNAL_SELECT, title: true, freshness_expires_at: true },
        orderBy: { observed_at: 'desc' },
      })
    : [];
  const fresh = signals.filter((s) => !s.freshness_expires_at || s.freshness_expires_at.getTime() > input.now.getTime());
  if (fresh.length === 0) return { ok: false, reason: 'no_fresh_evidence' };
  // Red team T6/T7: the observation is built only from evidence that passes
  // the SAME gate approval applies. A verified quote that states no network
  // change (a risk factor, a liquidity paragraph) is not a fact to open with.
  const quotable = fresh.filter((s) => outreachFactRefusal(s, run.account_name) === null).slice(0, 2);
  if (quotable.length === 0) return { ok: false, reason: 'no_outreach_fact' };

  const base = status.hypothesisId
    ? await prisma.prospectingHypothesis.findUnique({ where: { id: status.hypothesisId } })
    : null;
  // One fact opens the first touch (red team T6/T7); a second outreach fact
  // stays linked as supporting evidence, never a second quote in the email.
  const observation = citedQuote(quotable[0].title, quotable[0].evidence_text!, quotable[0].id, run.account_name);
  const problemHypothesis =
    base?.problem_hypothesis ??
    'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.';
  const falsificationQuestions = asList(base?.falsification_questions).length
    ? asList(base?.falsification_questions)
    : ['Did the change above add trailer volume or dwell at the sites that remain?'];
  const narrative: ProposedNarrative = {
    observation,
    problemHypothesis,
    rootCauses: asList(base?.root_cause_hypotheses),
    impacts: asList(base?.impact_hypotheses),
    wouldProveWrong: falsificationQuestions,
    whatANoMeans: base?.what_a_no_means ?? null,
    evidence: quotable.map((s) => ({ signalId: s.id, title: s.title, excerpt: s.evidence_text!, observedAt: s.observed_at.toISOString() })),
  };

  const family = base?.problem_family ?? status.problemFamily ?? 'hidden_capacity';
  type ProposeOne = { ok: true; id: string; existing: boolean } | { ok: false; reason: 'revision_exists'; revision: ExistingRevision } | { ok: false; reason: string };
  // The card thesis's own revision chain counts only for the person it belongs to.
  const chainFor = (personaId: number | null) => (base && (base.primary_persona_id == null || base.primary_persona_id === personaId) ? base.id : null);
  const current = (personaId: number | null) => existingRevisionFor(prisma, { accountName: run.account_name, personaId, problemFamily: family, hypothesisId: chainFor(personaId) });
  const proposeFor = async (personaId: number | null, sourceRef: string): Promise<ProposeOne> => {
    // This run already proposed for this person (a retry or a second click): the same draft, idempotent.
    const mine: { id: string } | null = await prisma.prospectingHypothesis.findFirst({ where: { source_ref: sourceRef }, select: { id: true } });
    if (mine) return { ok: true, id: mine.id, existing: true };
    // Final Monday P1: the person already has current work for this thesis (a revision
    // created from verified evidence, or an open draft). Never a second equivalent draft.
    const already = await current(personaId);
    if (already) return { ok: false, reason: 'revision_exists', revision: already };
    const supersedesId = await frozenToSupersede(prisma, run.account_name, personaId, family, input.now);
    const raced = async (e: unknown) => {
      // A concurrent click won the unique supersedes_id / source_ref race: that is the existing revision.
      if ((e as { code?: string })?.code !== 'P2002') throw e;
      const won = (await prisma.prospectingHypothesis.findFirst({ where: { source_ref: sourceRef }, select: { id: true } })) as { id: string } | null;
      if (won) return { ok: false as const, reason: 'duplicate_source_ref', existingId: won.id };
      const revision = await current(personaId);
      if (!revision) throw e;
      return { ok: false as const, reason: 'revision_exists', existingId: revision.hypothesisId, revision };
    };
    const r = await proposeHypothesis(prisma, {
      accountName: run.account_name,
      primaryPersonaId: personaId,
      persona: base?.persona ?? 'supply_chain',
      problemFamily: base?.problem_family ?? status.problemFamily ?? 'hidden_capacity',
      observation,
      problemHypothesis,
      rootCauseHypotheses: narrative.rootCauses,
      impactHypotheses: narrative.impacts,
      // Red team T7: no auto "why now = source age" sentence and no auto
      // confidence number. Why now is Casey's to write; confidence is unscored (0).
      whyNow: null,
      falsificationQuestions,
      whatANoMeans: narrative.whatANoMeans,
      confidence: 0,
      signalIds: quotable.map((s) => s.id),
      primarySignalId: quotable[0].id,
      sourceRef,
      ...(supersedesId ? { supersedesId } : {}),
      metadata: { proposedFrom: 'research_this', researchRunId: run.id, basedOn: base?.id ?? null, ...(supersedesId ? { revisionOf: supersedesId } : {}) },
      createdBy: input.actor,
    }).catch(raced);
    if (r.ok) return { ok: true, id: r.id, existing: false };
    if ('revision' in r && r.revision) return { ok: false, reason: 'revision_exists', revision: r.revision };
    if (r.reason === 'duplicate_source_ref' && r.existingId) return { ok: true, id: r.existingId, existing: true };
    return { ok: false, reason: r.reason };
  };

  const group = [...new Set(input.personaIds ?? [])];
  if (group.length === 0) {
    const persona = run.persona_id ? await prisma.persona.findUnique({ where: { id: run.persona_id }, select: { id: true } }) : null;
    const r = await proposeFor(persona?.id ?? null, `research:${run.id}`);
    if (r.ok) return { ok: true, hypothesisId: r.id, existing: r.existing, hypothesisIds: [r.id], narrative };
    if ('revision' in r) return { ok: false, reason: 'revision_exists', existingRevision: r.revision };
    return { ok: false, reason: r.reason };
  }

  const ids: string[] = [];
  const skipped: number[] = [];
  const alreadyRevised: Array<{ personaId: number; revision: ExistingRevision }> = [];
  let allExisting = true;
  for (const pid of group) {
    const persona: { id: number; account_name: string | null } | null = await prisma.persona.findUnique({ where: { id: pid }, select: { id: true, account_name: true } });
    if (!persona || persona.account_name !== run.account_name) {
      skipped.push(pid);
      continue;
    }
    const r = await proposeFor(persona.id, pid === run.persona_id ? `research:${run.id}` : `research:${run.id}:p${pid}`);
    if (!r.ok && 'revision' in r) {
      alreadyRevised.push({ personaId: persona.id, revision: r.revision });
      continue;
    }
    if (!r.ok) return { ok: false, reason: r.reason };
    ids.push(r.id);
    allExisting &&= r.existing;
  }
  if (ids.length === 0 && alreadyRevised.length > 0) return { ok: false, reason: 'revision_exists', existingRevision: alreadyRevised[0].revision };
  if (ids.length === 0) return { ok: false, reason: 'no_person_in_account' };
  return { ok: true, hypothesisId: ids[0], existing: allExisting, hypothesisIds: ids, skipped, ...(alreadyRevised.length ? { alreadyRevised } : {}), narrative };
}
