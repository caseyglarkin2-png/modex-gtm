/**
 * Account-thesis group review (2026-09-25): load the derived sibling groups,
 * approve selected siblings, apply a note to siblings, and research a thesis
 * ONCE for every sibling.
 *
 * Nothing here is a hidden bulk update. Approval runs the NORMAL legal
 * transitions (draft -> submit -> review_required -> approve -> approved)
 * through transitionHypothesis on each selected row, one at a time, so every
 * row gets its own hypothesis events naming the group action and the actor,
 * and one refusal is reported for that row instead of pretending all
 * succeeded. It never activates (approval and "use in routing" stay separate
 * stages), never routes, drafts or sends.
 *
 * House `prisma: any` glue.
 */
import { existingRevisionFor } from './current-revision';
import { linkSignals, proposeHypothesis, transitionHypothesis, updateDraftNarrative } from './service';
import { groupSiblings, REVIEWABLE_STATUSES, thesisFingerprint, type ThesisGroup, type ThesisRow } from './siblings';
import { actionabilityOf, EVIDENCE_REFUSALS, outreachReadiness, type ActionSignal, type NextStep, type ReadinessReason } from './actionability';
import { evidenceDepth, originKeyOf, type DepthSignal, type EvidenceDepth } from '../research/depth';
import { GATE_SIGNAL_SELECT, outreachFactRefusal, sendableEvidence } from '../research/evidence-gate';
import { citedQuote } from '../research/propose';
import { runEvidenceResearch, type ResearchDeps, type ResearchResult } from '../research/run';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GROUP_STATUSES = ['draft', 'review_required', 'approved', 'active'] as const;

export interface GroupMember extends ThesisRow {
  personaName: string | null;
  personaTitle: string | null;
  /** Server-derived (actionability.ts): what Casey can do with this row now. */
  next: NextStep;
}

type ThesisSignal = DepthSignal & ActionSignal & { title: string | null };

export interface LoadedGroup extends ThesisGroup<GroupMember> {
  depth: EvidenceDepth;
  signals: ThesisSignal[];
  reviewable: number;
  /** OUTREACH READINESS of the shared observation (not research depth). */
  readiness: { ready: boolean; reason: ReadinessReason | null };
}

const SIGNAL_SELECT = { ...GATE_SIGNAL_SELECT, summary: true, freshness_expires_at: true };

/**
 * Current work only: a row a newer revision supersedes (supersedes_id) is
 * history. It is never edited; it just stops being offered.
 */
const CURRENT = { superseded_by: { is: null } };

export async function loadThesisRows(prisma: PrismaLike, where: Record<string, unknown> = {}, now: Date = new Date()): Promise<Array<GroupMember & { signals: ThesisSignal[] }>> {
  const rows: any[] = await prisma.prospectingHypothesis.findMany({
    where: { status: { in: [...GROUP_STATUSES] }, ...CURRENT, ...where },
    orderBy: { created_at: 'asc' },
    include: { signals: { include: { signal: { select: SIGNAL_SELECT } } }, primary_persona: { select: { name: true, title: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    account_name: r.account_name,
    problem_family: r.problem_family,
    observation: r.observation,
    problem_hypothesis: r.problem_hypothesis,
    root_cause_hypotheses: r.root_cause_hypotheses,
    impact_hypotheses: r.impact_hypotheses,
    falsification_questions: r.falsification_questions,
    what_a_no_means: r.what_a_no_means,
    status: r.status,
    primary_persona_id: r.primary_persona_id,
    signalIds: (r.signals ?? []).map((l: any) => l.signal_id ?? l.signal?.id).filter(Boolean),
    personaName: r.primary_persona?.name ?? null,
    personaTitle: r.primary_persona?.title ?? null,
    signals: (r.signals ?? []).map((l: any) => l.signal).filter(Boolean),
    next: actionabilityOf({ status: r.status, observation: r.observation, account_name: r.account_name, signals: (r.signals ?? []).map((l: any) => l.signal) }, now).next,
  }));
}

/**
 * Sibling groups (2+ people). `singletons: true` also returns one-person
 * theses, so a one-off hypothesis gets the same research / revise actions.
 */
export async function loadThesisGroups(prisma: PrismaLike, where: Record<string, unknown> = {}, opts: { singletons?: boolean; now?: Date } = {}): Promise<LoadedGroup[]> {
  const now = opts.now ?? new Date();
  const rows = await loadThesisRows(prisma, where, now);
  return groupSiblings(rows, opts.singletons ? 1 : 2).map((g) => {
    const m0 = g.members[0] as (typeof rows)[number];
    const signals = m0.signals;
    return {
      ...g,
      depth: evidenceDepth(signals),
      signals,
      reviewable: g.members.filter((m) => REVIEWABLE_STATUSES.has(m.status)).length,
      readiness: outreachReadiness({ observation: m0.observation, account_name: m0.account_name, signals }, now),
    };
  });
}

/** A thesis is REVIEW work only when a decision on it can succeed. */
export const isReviewWork = (g: { members: Array<{ next: NextStep }> }) => g.members.some((m) => m.next === 'approve_use' || m.next === 'use');
/** A thesis is RESEARCH work when verified evidence is the next step for someone on it. */
export const isResearchWork = (g: { members: Array<{ next: NextStep }> }) => g.members.some((m) => m.next === 'find_evidence' || m.next === 'revise');

/**
 * The cockpit's split of current theses (the lanes, the counts and NEXT UP all
 * read it): REVIEW holds only decisions that can succeed, RESEARCH holds every
 * thesis the evidence gate rates not ready. Shared theses (2+) review as cards;
 * a one-person ready thesis reviews in the one-off list.
 */
export function splitThesisWork<G extends { members: Array<{ id: string; next: NextStep }> }>(groups: readonly G[]): { reviewGroups: G[]; readyOneOffIds: string[]; researchGroups: G[] } {
  return {
    reviewGroups: groups.filter((g) => g.members.length >= 2 && isReviewWork(g)),
    readyOneOffIds: groups.filter((g) => g.members.length === 1 && isReviewWork(g)).map((g) => g.members[0].id),
    researchGroups: groups.filter(isResearchWork),
  };
}

/**
 * Review order for account theses (one-off rows come after every group):
 *   1. groups with someone still awaiting a decision
 *   2. corroborated theses (2+ independent sources) before thinner ones
 *   3. then the most people unlocked by one review / one research action
 *   4. then more independent sources, then larger groups
 */
export function orderGroupsForReview<T extends { reviewable: number; depth: EvidenceDepth; members: unknown[] }>(groups: readonly T[]): T[] {
  return [...groups].sort(
    (a, b) =>
      Number(b.reviewable > 0) - Number(a.reviewable > 0) ||
      Number(b.depth.independentSources >= 2) - Number(a.depth.independentSources >= 2) ||
      b.reviewable - a.reviewable ||
      b.depth.independentSources - a.depth.independentSources ||
      b.members.length - a.members.length,
  );
}

async function groupFor(prisma: PrismaLike, fingerprint: string): Promise<LoadedGroup | null> {
  return (await loadThesisGroups(prisma, {}, { singletons: true })).find((g) => g.fingerprint === fingerprint) ?? null;
}

export interface SiblingResult {
  hypothesisId: string;
  ok: boolean;
  from: string;
  to: string | null;
  detail: string;
  /** The machine's refusal code when the row stopped, for plain-language mapping. */
  reason?: string;
}

/**
 * APPROVE (+ USE IN ROUTING) for one hypothesis: the ordinary state-machine
 * transitions in order, each audited by transitionHypothesis with `reason`.
 *   draft -> submit -> approve [-> activate]
 *   review_required -> approve [-> activate]
 *   approved -> [activate]            (use only)
 *   active -> unchanged
 * Nothing here enrolls, drafts or sends; `use` only makes the thesis
 * routable, and only because Casey clicked it.
 */
export async function advanceHypothesis(
  prisma: PrismaLike,
  id: string,
  from: string,
  opts: { use: boolean; actor: string; now: Date; reason: string },
  transition: typeof transitionHypothesis = transitionHypothesis,
): Promise<SiblingResult> {
  const ctx = { now: opts.now, actor: opts.actor, reason: opts.reason };
  let status = from;
  if (status === 'active' || (status === 'approved' && !opts.use)) {
    return { hypothesisId: id, ok: true, from, to: status, detail: `already ${status}; unchanged` };
  }
  if (!REVIEWABLE_STATUSES.has(status) && status !== 'approved') {
    return { hypothesisId: id, ok: false, from, to: null, detail: `cannot approve from ${status}` };
  }
  if (status === 'draft') {
    const s = await transition(prisma, id, 'submit', ctx);
    if (!s.ok) return { hypothesisId: id, ok: false, from, to: null, detail: `submit refused: ${s.reason}`, reason: s.reason };
    status = 'review_required';
  }
  if (status === 'review_required') {
    const a = await transition(prisma, id, 'approve', ctx);
    if (!a.ok) return { hypothesisId: id, ok: false, from, to: status, detail: `approve refused: ${a.reason}`, reason: a.reason };
    status = 'approved';
  }
  if (!opts.use) return { hypothesisId: id, ok: true, from, to: 'approved', detail: 'approved' };
  const u = await transition(prisma, id, 'activate', ctx);
  if (!u.ok) return { hypothesisId: id, ok: false, from, to: 'approved', detail: `approved, but not in use: ${u.reason}`, reason: u.reason };
  return { hypothesisId: id, ok: true, from, to: 'active', detail: from === 'approved' ? 'now in use' : 'approved and in use' };
}

export async function approveSelectedSiblings(
  prisma: PrismaLike,
  input: { fingerprint: string; hypothesisIds: string[]; actor: string; now: Date; use?: boolean; signalIds?: string[] },
  deps: { transition?: typeof transitionHypothesis } = {},
): Promise<{ ok: boolean; reason?: string; results: SiblingResult[]; attached?: SiblingResult[]; inUse?: Array<{ personaId: number; name: string | null }>; summary?: ApprovalSummary }> {
  const transition = deps.transition ?? transitionHypothesis;
  const group = await groupFor(prisma, input.fingerprint);
  if (!group) return { ok: false, reason: 'group_not_found', results: [] };
  const members = new Map(group.members.map((m) => [m.id, m]));
  const selected = [...new Set(input.hypothesisIds)];
  const outsiders = selected.filter((id) => !members.has(id));
  if (outsiders.length > 0) return { ok: false, reason: `not_in_group:${outsiders.join(',')}`, results: [] };

  // USE THIS EVIDENCE + APPROVE + USE: link the facts Casey chose to the SELECTED
  // editable rows first (each link audited by linkSignals), then approve. A frozen
  // (approved) row is reported, never mutated. A refused link stops that row.
  const attached: SiblingResult[] = [];
  const signalIds = [...new Set(input.signalIds ?? [])];
  if (signalIds.length > 0) {
    for (const id of selected) {
      const m = members.get(id)!;
      if (!REVIEWABLE_STATUSES.has(m.status)) {
        attached.push({ hypothesisId: id, ok: true, from: m.status, to: m.status, detail: `${m.status} narrative is frozen; evidence not added` });
        continue;
      }
      const r = await linkSignals(prisma, id, signalIds, input.actor);
      attached.push(r.ok ? { hypothesisId: id, ok: true, from: m.status, to: m.status, detail: `linked ${r.linked.length}` } : { hypothesisId: id, ok: false, from: m.status, to: null, detail: `link refused: ${r.reason}` });
    }
  }
  const linkFailed = new Set(attached.filter((a) => !a.ok).map((a) => a.hypothesisId));

  const verb = `${signalIds.length > 0 ? 'use evidence + ' : ''}${input.use ? 'approve + use selected siblings' : 'approve selected siblings'}`;
  const reason = `group review ${input.fingerprint.slice(0, 12)}: ${verb} (${selected.length} of ${group.members.length}, ${group.accountName} ${group.problemFamily})`;
  const results: SiblingResult[] = [];
  for (const id of selected) {
    if (linkFailed.has(id)) {
      results.push({ hypothesisId: id, ok: false, from: members.get(id)!.status, to: null, detail: 'not approved: the evidence could not be linked' });
      continue;
    }
    results.push(await advanceHypothesis(prisma, id, members.get(id)!.status, { use: input.use === true, actor: input.actor, now: input.now, reason }, transition));
  }
  // The people now in use: what the caller routes and reports on.
  const inUse = results
    .filter((r) => r.ok && r.to === 'active')
    .map((r) => members.get(r.hypothesisId)!)
    .filter((m) => typeof m.primary_persona_id === 'number')
    .map((m) => ({ personaId: m.primary_persona_id as number, name: m.personaName }));
  return { ok: results.every((r) => r.ok), results, inUse, summary: summarizeApproval(results, input.use === true), ...(signalIds.length > 0 ? { attached } : {}) };
}

/**
 * What is TRUE after an approve request (Monday readiness): the rows' actual
 * state, not only the transitions this request made. Five rows that were
 * already approved and refused activation are "5 approved, 0 in use, verified
 * evidence required", never "0 approved".
 */
export interface ApprovalSummary {
  approved: number;
  newlyApproved: number;
  alreadyApproved: number;
  inUse: number;
  needsResearch: number;
  blocked: number;
  requestedUse: boolean;
  /** Distinct machine refusal codes (details, not the primary message). */
  reasons: string[];
}

export function summarizeApproval(results: readonly SiblingResult[], requestedUse: boolean): ApprovalSummary {
  const final = (r: SiblingResult) => r.to ?? r.from;
  const isApproved = (st: string) => st === 'approved' || st === 'active';
  const refused = results.filter((r) => !r.ok);
  const evidence = (r: SiblingResult) => !!r.reason && EVIDENCE_REFUSALS.has(r.reason);
  return {
    approved: results.filter((r) => isApproved(final(r))).length,
    newlyApproved: results.filter((r) => !isApproved(r.from) && isApproved(final(r))).length,
    alreadyApproved: results.filter((r) => isApproved(r.from)).length,
    inUse: results.filter((r) => final(r) === 'active').length,
    needsResearch: refused.filter(evidence).length,
    blocked: refused.filter((r) => !evidence(r)).length,
    requestedUse,
    reasons: [...new Set(refused.map((r) => r.reason).filter((x): x is string => !!x))],
  };
}

export interface EvidenceResult extends SiblingResult {
  /** The new draft that supersedes a frozen row. */
  revisionId?: string;
}

/**
 * USE THIS VERIFIED EVIDENCE (Monday readiness). Casey chose the facts; this
 * makes the observation SAY them, so the sentence he approves is the sentence
 * the evidence gate judged. It never approves, activates, routes or sends.
 *
 *   draft / review_required   observation rebuilt from the chosen facts and
 *                             the facts linked, in ONE audited narrative edit
 *                             (updateDraftNarrative). The keyword observation
 *                             is replaced, not kept beside the good fact.
 *   approved, not ready       frozen: NEVER edited. A new DRAFT revision is
 *                             proposed with supersedes_id = the old row (the
 *                             schema's reopen relationship), carrying the old
 *                             narrative only as a draft candidate and the new
 *                             observation. The old row keeps its status,
 *                             approval, evidence and events; it simply stops
 *                             being current work. Idempotent (source_ref
 *                             revision:<old id>).
 *   approved and ready        unchanged (nothing to repair).
 *   active                    unchanged (in use; history is not rewritten).
 *
 * Every chosen fact must itself be a LIVE outreach fact; anything else is
 * refused before any write.
 */
export async function useEvidenceForThesis(
  prisma: PrismaLike,
  input: { fingerprint: string; hypothesisIds: string[]; signalIds: string[]; actor: string; now: Date },
  deps: { propose?: typeof proposeHypothesis; updateNarrative?: typeof updateDraftNarrative } = {},
): Promise<{ ok: boolean; reason?: string; observation?: string; results: EvidenceResult[] }> {
  const propose = deps.propose ?? proposeHypothesis;
  const updateNarrative = deps.updateNarrative ?? updateDraftNarrative;
  const group = await groupFor(prisma, input.fingerprint);
  if (!group) return { ok: false, reason: 'group_not_found', results: [] };
  const members = new Map(group.members.map((m) => [m.id, m]));
  const selected = [...new Set(input.hypothesisIds)];
  const outsiders = selected.filter((id) => !members.has(id));
  if (outsiders.length > 0) return { ok: false, reason: `not_in_group:${outsiders.join(',')}`, results: [] };

  const wanted = [...new Set(input.signalIds)];
  const found: any[] = await prisma.prospectingSignal.findMany({ where: { id: { in: wanted } }, select: SIGNAL_SELECT });
  const byId = new Map(found.map((s) => [s.id, s]));
  const facts: any[] = [];
  for (const id of wanted) {
    const s = byId.get(id);
    if (!s) return { ok: false, reason: `unknown_signal:${id}`, results: [] };
    const why = outreachFactRefusal(s, group.accountName);
    if (why) return { ok: false, reason: `not_verified_evidence:${id}:${why}`, results: [] };
    if (s.freshness_expires_at && new Date(s.freshness_expires_at).getTime() <= input.now.getTime()) return { ok: false, reason: `not_verified_evidence:${id}:expired`, results: [] };
    facts.push(s);
  }
  if (facts.length === 0) return { ok: false, reason: 'no_signals', results: [] };

  // The observation is the chosen facts, each quoted whole with its source label and citation.
  const observation = facts.map((f) => citedQuote(f.title ?? '', f.evidence_text ?? '', f.id, group.accountName)).join(' ');
  if (sendableEvidence(observation, facts, group.accountName).tier !== 'VERIFIED_FACT') return { ok: false, reason: 'observation_unsupported', results: [] };

  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  const results: EvidenceResult[] = [];
  for (const id of selected) {
    const m = members.get(id)!;
    const signalIds = [...new Set([...m.signalIds, ...facts.map((f) => f.id)])];
    if (REVIEWABLE_STATUSES.has(m.status)) {
      const r = await updateNarrative(prisma, id, { observation, signalIds, primarySignalId: facts[0].id }, input.actor);
      results.push(
        r.ok
          ? { hypothesisId: id, ok: true, from: m.status, to: m.status, detail: 'observation rebuilt from the verified evidence; review it, then approve' }
          : { hypothesisId: id, ok: false, from: m.status, to: m.status, detail: `evidence not applied: ${r.reason}`, reason: r.reason },
      );
      continue;
    }
    if (m.status !== 'approved' || m.next !== 'revise') {
      results.push({ hypothesisId: id, ok: true, from: m.status, to: m.status, detail: `${m.status === 'active' ? 'in use' : 'approved and ready'}; unchanged` });
      continue;
    }
    const old = await prisma.prospectingHypothesis.findUnique({ where: { id } });
    if (!old) {
      results.push({ hypothesisId: id, ok: false, from: m.status, to: null, detail: 'not found', reason: 'not_found' });
      continue;
    }
    // Final Monday P1: this person already has current work for this thesis (a revision, or
    // an open draft from RESEARCH THIS). Point at it; never a second equivalent draft.
    const already = await existingRevisionFor(prisma, { accountName: old.account_name, personaId: old.primary_persona_id ?? null, problemFamily: old.problem_family, hypothesisId: id });
    if (already) {
      results.push({ hypothesisId: id, ok: true, from: m.status, to: m.status, revisionId: already.hypothesisId, detail: 'revision already exists' });
      continue;
    }
    // A concurrent click (or research-this) can win the unique source_ref / supersedes_id race:
    // that is "revision already exists", never a 500.
    const raced = async (e: unknown) => {
      if ((e as { code?: string })?.code !== 'P2002') throw e;
      const existing = await prisma.prospectingHypothesis.findFirst({ where: { supersedes_id: id }, select: { id: true } });
      if (!existing) throw e;
      return { ok: false as const, reason: 'duplicate_source_ref', existingId: existing.id as string };
    };
    const created = await propose(prisma, {
      accountName: old.account_name,
      primaryPersonaId: old.primary_persona_id ?? null,
      persona: old.persona,
      problemFamily: old.problem_family,
      secondaryFamilies: list(old.secondary_families),
      observation,
      problemHypothesis: old.problem_hypothesis,
      rootCauseHypotheses: list(old.root_cause_hypotheses),
      impactHypotheses: list(old.impact_hypotheses),
      whyNow: old.why_now ?? null,
      falsificationQuestions: list(old.falsification_questions),
      whatANoMeans: old.what_a_no_means ?? null,
      contraryEvidence: old.contrary_evidence ?? null,
      predictedBuyerLanguage: old.predicted_buyer_language ?? null,
      buyingCenter: old.buying_center ?? null,
      confidence: typeof old.confidence === 'number' ? old.confidence : 0,
      signalIds,
      primarySignalId: facts[0].id,
      sourceRef: `revision:${id}`,
      supersedesId: id,
      // The old narrative is a DRAFT CANDIDATE here, not proven truth: Casey reviews it.
      metadata: { revisionOf: id, revisionBasis: 'verified_evidence', narrativeIsDraftCandidate: true },
      createdBy: input.actor,
    }).catch(raced);
    if (!created.ok && !(created.reason === 'duplicate_source_ref' && created.existingId)) {
      results.push({ hypothesisId: id, ok: false, from: m.status, to: m.status, detail: `revision not created: ${created.reason}`, reason: created.reason });
      continue;
    }
    const revisionId = created.ok ? created.id : created.existingId!;
    results.push({ hypothesisId: id, ok: true, from: m.status, to: m.status, revisionId, detail: created.ok ? 'new draft revision created; the approved version is kept in history' : 'revision already exists' });
  }
  return { ok: results.every((r) => r.ok), observation, results };
}

/**
 * Apply a fact/note Casey added on one hypothesis to its siblings. Links the
 * signal to every sibling still editable (draft/review_required); a frozen
 * sibling (approved/active narrative) is NOT mutated: the note is recorded
 * against it (visible on review) and reported as needing a revision. Existing
 * links (person-specific notes) are never removed or overwritten.
 */
export async function applyNoteToSiblings(
  prisma: PrismaLike,
  input: { sourceHypothesisId: string; signalId: string; actor: string; now: Date },
): Promise<{ ok: boolean; reason?: string; results: SiblingResult[] }> {
  const rows = await loadThesisRows(prisma);
  const source = rows.find((r) => r.id === input.sourceHypothesisId);
  if (!source) return { ok: false, reason: 'hypothesis_not_found', results: [] };
  // Siblings = the thesis WITHOUT this note (the note may already be linked to the source).
  const withoutNote = (r: ThesisRow) => thesisFingerprint({ ...r, signalIds: r.signalIds.filter((s) => s !== input.signalId) });
  const fp = withoutNote(source);
  const siblings = rows.filter((r) => r.id !== source.id && withoutNote(r) === fp);
  if (siblings.length === 0) return { ok: false, reason: 'no_siblings', results: [] };

  const results: SiblingResult[] = [];
  for (const s of siblings) {
    let applied: 'linked' | 'already_linked' | 'frozen_recorded' = 'frozen_recorded';
    let detail = '';
    if (REVIEWABLE_STATUSES.has(s.status)) {
      const r = await linkSignals(prisma, s.id, [input.signalId], input.actor);
      if (!r.ok) {
        results.push({ hypothesisId: s.id, ok: false, from: s.status, to: null, detail: `link refused: ${r.reason}` });
        continue;
      }
      applied = r.linked.length > 0 ? 'linked' : 'already_linked';
      detail = applied === 'linked' ? 'note linked as evidence' : 'note was already linked';
    } else {
      detail = `${s.status} narrative is frozen: note recorded and shown on review, not merged; revise the hypothesis to fold it in`;
    }
    await prisma.gapAuditEvent.create({
      data: {
        kind: 'hypothesis.sibling_note',
        actor: input.actor,
        subject_type: 'prospecting_hypothesis',
        subject_id: s.id,
        payload: { signalId: input.signalId, sourceHypothesisId: input.sourceHypothesisId, applied, thesisFingerprint: fp, at: input.now.toISOString() },
      },
    });
    results.push({ hypothesisId: s.id, ok: true, from: s.status, to: s.status, detail });
  }
  return { ok: true, results };
}

export type CorroborationOutcome = 'corroborated' | 'no_second_source' | 'contradicts';

export interface CorroborationResult {
  outcome: CorroborationOutcome;
  reused: boolean;
  research: Pick<ResearchResult, 'runId' | 'outcome' | 'facts' | 'rejected' | 'conflicts' | 'notes'>;
  /** Fresh verified facts whose origin is NOT already behind the thesis. */
  newIndependent: Array<ResearchResult['facts'][number]>;
  before: EvidenceDepth;
}

/** Reuse a thesis research run for this long rather than re-running it per click or per person. */
export const THESIS_RESEARCH_REUSE_MS = 24 * 60 * 60 * 1000;

/**
 * FIND CORROBORATING EVIDENCE for a whole thesis: ONE research run for all
 * siblings (never one per person), reused for 24 hours. It challenges the
 * thesis: a fact already behind it does not count again, a conflict is
 * reported as contradicting, and no second source is a valid answer.
 * Nothing is linked here; attaching facts is a separate human click.
 */
export async function corroborateThesis(
  prisma: PrismaLike,
  input: { fingerprint: string; actor: string; now: Date; force?: boolean },
  deps: ResearchDeps & { run?: typeof runEvidenceResearch } = {},
): Promise<{ ok: false; reason: string } | ({ ok: true } & CorroborationResult)> {
  const group = await groupFor(prisma, input.fingerprint);
  if (!group) return { ok: false, reason: 'group_not_found' };

  let research: ResearchResult | null = null;
  let reused = false;
  if (!input.force) {
    const recent: any[] = await prisma.researchRun.findMany({
      where: { account_name: group.accountName, created_at: { gte: new Date(input.now.getTime() - THESIS_RESEARCH_REUSE_MS) } },
      orderBy: { created_at: 'desc' },
      select: { id: true, provider_status: true },
      take: 20,
    });
    const hit = recent.find((r) => r.provider_status?.thesisFingerprint === input.fingerprint && r.provider_status?.result);
    if (hit) {
      research = hit.provider_status.result as ResearchResult;
      reused = true;
    }
  }
  if (!research) {
    research = await (deps.run ?? runEvidenceResearch)(
      prisma,
      {
        accountName: group.accountName,
        personaId: null,
        hypothesisId: group.members[0].id,
        problemFamily: group.problemFamily,
        decisionId: null,
        actor: input.actor,
        now: input.now,
        context: { thesisFingerprint: input.fingerprint, siblingIds: group.members.map((m) => m.id), purpose: 'corroborate_thesis' },
      },
      deps,
    );
  }

  const existingOrigins = new Set(group.depth.origins.map((o) => o.key));
  let newIndependent: ResearchResult['facts'];
  if (group.readiness.ready) {
    // A ready thesis is corroborated only by a NEW origin (depth, not repetition).
    newIndependent = research.facts.filter((f) => f.fresh && !existingOrigins.has(originKeyOf({ id: f.signalId, source_kind: 'evidence_record', evidence_url: f.url, evidence_text: f.excerpt }) ?? ''));
  } else {
    // Monday readiness: a NOT-ready thesis needs one outreach fact, wherever it comes from. A relevant
    // sentence in the same 10-Q its irrelevant legacy excerpts came from is exactly the repair; filtering
    // it as a repeated origin would report "no verified fact" when one was found. Offer every fresh,
    // not-yet-linked fact that passes the outreach gate (the only facts use_evidence accepts).
    const linked = new Set(group.members.flatMap((m) => m.signalIds));
    const candidates = research.facts.filter((f) => f.fresh && !linked.has(f.signalId));
    const rows: any[] = candidates.length ? await prisma.prospectingSignal.findMany({ where: { id: { in: candidates.map((f) => f.signalId) } }, select: SIGNAL_SELECT }) : [];
    const gate = new Map(rows.map((s) => [s.id, outreachFactRefusal(s, group.accountName) === null && (!s.freshness_expires_at || new Date(s.freshness_expires_at).getTime() > input.now.getTime())]));
    newIndependent = candidates.filter((f) => gate.get(f.signalId) === true);
  }
  const outcome: CorroborationOutcome = research.conflicts.length > 0 ? 'contradicts' : newIndependent.length > 0 ? 'corroborated' : 'no_second_source';
  return {
    ok: true,
    outcome,
    reused,
    research: { runId: research.runId, outcome: research.outcome, facts: research.facts, rejected: research.rejected, conflicts: research.conflicts, notes: research.notes },
    newIndependent,
    before: group.depth,
  };
}

/** Attach chosen verified facts to every editable sibling (per-row results; frozen rows reported, not mutated). */
export async function attachEvidenceToThesis(
  prisma: PrismaLike,
  input: { fingerprint: string; signalIds: string[]; actor: string },
): Promise<{ ok: boolean; reason?: string; results: SiblingResult[] }> {
  const group = await groupFor(prisma, input.fingerprint);
  if (!group) return { ok: false, reason: 'group_not_found', results: [] };
  const results: SiblingResult[] = [];
  for (const m of group.members) {
    if (!REVIEWABLE_STATUSES.has(m.status)) {
      results.push({ hypothesisId: m.id, ok: true, from: m.status, to: m.status, detail: `${m.status} narrative is frozen; not changed` });
      continue;
    }
    const r = await linkSignals(prisma, m.id, input.signalIds, input.actor);
    results.push(r.ok ? { hypothesisId: m.id, ok: true, from: m.status, to: m.status, detail: `linked ${r.linked.length}` } : { hypothesisId: m.id, ok: false, from: m.status, to: null, detail: `link refused: ${r.reason}` });
  }
  return { ok: results.every((r) => r.ok), results };
}

/** The plain, serializable shape the review page renders (server to client). */
export interface ThesisCard {
  fingerprint: string;
  accountName: string;
  problemFamily: string;
  observation: string;
  problemHypothesis: string;
  rootCauses: string[];
  impacts: string[];
  falsification: string[];
  whatANoMeans: string | null;
  depth: EvidenceDepth;
  sources: Array<{ id: string; title: string | null; url: string | null; kind: string; quoted: boolean }>;
  members: Array<{ id: string; status: string; personaName: string | null; personaTitle: string | null; next: NextStep }>;
  reviewable: number;
  /** OUTREACH READINESS from the canonical evidence gate: the UI never re-derives it. */
  readiness: { ready: boolean; reason: ReadinessReason | null };
  /** Sibling notes recorded against a FROZEN member (not merged into its narrative). */
  recordedNotes?: Array<{ hypothesisId: string; personaName: string | null; text: string }>;
}

export function toThesisCard(g: LoadedGroup): ThesisCard {
  const m0 = g.members[0];
  const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
  return {
    fingerprint: g.fingerprint,
    accountName: g.accountName,
    problemFamily: g.problemFamily,
    observation: m0.observation ?? '',
    problemHypothesis: m0.problem_hypothesis ?? '',
    rootCauses: list(m0.root_cause_hypotheses),
    impacts: list(m0.impact_hypotheses),
    falsification: list(m0.falsification_questions),
    whatANoMeans: m0.what_a_no_means ?? null,
    depth: g.depth,
    sources: g.signals.map((s) => ({ id: s.id, title: s.title ?? null, url: s.evidence_url, kind: s.source_kind, quoted: Boolean((s.evidence_text ?? '').trim() || (s.summary ?? '').trim()) })),
    members: g.members.map((m) => ({ id: m.id, status: m.status, personaName: m.personaName, personaTitle: m.personaTitle, next: m.next })),
    reviewable: g.reviewable,
    readiness: g.readiness,
  };
}

/** Attach sibling notes recorded (not merged) against frozen members, so review shows them. */
export async function withRecordedNotes(prisma: PrismaLike, cards: ThesisCard[]): Promise<ThesisCard[]> {
  const frozen = cards.flatMap((c) => c.members.filter((m) => !REVIEWABLE_STATUSES.has(m.status)).map((m) => m.id));
  if (frozen.length === 0) return cards;
  const events: Array<{ subject_id: string; payload: any }> = await prisma.gapAuditEvent.findMany({
    where: { kind: 'hypothesis.sibling_note', subject_type: 'prospecting_hypothesis', subject_id: { in: frozen } },
    select: { subject_id: true, payload: true },
  });
  const recorded = events.filter((e) => e.payload?.applied === 'frozen_recorded');
  if (recorded.length === 0) return cards;
  const signals: Array<{ id: string; evidence_text: string | null; title: string | null }> = await prisma.prospectingSignal.findMany({
    where: { id: { in: [...new Set(recorded.map((e) => String(e.payload.signalId)))] } },
    select: { id: true, evidence_text: true, title: true },
  });
  const textOf = new Map(signals.map((s) => [s.id, s.evidence_text || s.title || s.id]));
  return cards.map((c) => ({
    ...c,
    recordedNotes: recorded
      .filter((e) => c.members.some((m) => m.id === e.subject_id))
      .map((e) => ({ hypothesisId: e.subject_id, personaName: c.members.find((m) => m.id === e.subject_id)?.personaName ?? null, text: textOf.get(String(e.payload.signalId)) ?? '' })),
  }));
}
