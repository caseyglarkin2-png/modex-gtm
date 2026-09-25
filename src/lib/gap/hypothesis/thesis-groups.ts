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
import { linkSignals, transitionHypothesis } from './service';
import { groupSiblings, REVIEWABLE_STATUSES, thesisFingerprint, type ThesisGroup, type ThesisRow } from './siblings';
import { evidenceDepth, originKeyOf, type DepthSignal, type EvidenceDepth } from '../research/depth';
import { runEvidenceResearch, type ResearchDeps, type ResearchResult } from '../research/run';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const GROUP_STATUSES = ['draft', 'review_required', 'approved', 'active'] as const;

export interface GroupMember extends ThesisRow {
  personaName: string | null;
  personaTitle: string | null;
}

export interface LoadedGroup extends ThesisGroup<GroupMember> {
  depth: EvidenceDepth;
  signals: Array<DepthSignal & { title: string | null }>;
  reviewable: number;
}

const SIGNAL_SELECT = { id: true, source_kind: true, source_type: true, evidence_url: true, evidence_text: true, summary: true, title: true, observed_at: true };

export async function loadThesisRows(prisma: PrismaLike, where: Record<string, unknown> = {}): Promise<Array<GroupMember & { signals: Array<DepthSignal & { title: string | null }> }>> {
  const rows: any[] = await prisma.prospectingHypothesis.findMany({
    where: { status: { in: [...GROUP_STATUSES] }, ...where },
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
  }));
}

export async function loadThesisGroups(prisma: PrismaLike, where: Record<string, unknown> = {}): Promise<LoadedGroup[]> {
  const rows = await loadThesisRows(prisma, where);
  return groupSiblings(rows).map((g) => {
    const signals = (g.members[0] as (typeof rows)[number]).signals;
    return { ...g, depth: evidenceDepth(signals), signals, reviewable: g.members.filter((m) => REVIEWABLE_STATUSES.has(m.status)).length };
  });
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
  return (await loadThesisGroups(prisma)).find((g) => g.fingerprint === fingerprint) ?? null;
}

export interface SiblingResult {
  hypothesisId: string;
  ok: boolean;
  from: string;
  to: string | null;
  detail: string;
}

export async function approveSelectedSiblings(
  prisma: PrismaLike,
  input: { fingerprint: string; hypothesisIds: string[]; actor: string; now: Date },
  deps: { transition?: typeof transitionHypothesis } = {},
): Promise<{ ok: boolean; reason?: string; results: SiblingResult[] }> {
  const transition = deps.transition ?? transitionHypothesis;
  const group = await groupFor(prisma, input.fingerprint);
  if (!group) return { ok: false, reason: 'group_not_found', results: [] };
  const members = new Map(group.members.map((m) => [m.id, m]));
  const selected = [...new Set(input.hypothesisIds)];
  const outsiders = selected.filter((id) => !members.has(id));
  if (outsiders.length > 0) return { ok: false, reason: `not_in_group:${outsiders.join(',')}`, results: [] };

  const reason = `group review ${input.fingerprint.slice(0, 12)}: approve selected siblings (${selected.length} of ${group.members.length}, ${group.accountName} ${group.problemFamily})`;
  const results: SiblingResult[] = [];
  for (const id of selected) {
    const m = members.get(id)!;
    if (!REVIEWABLE_STATUSES.has(m.status)) {
      results.push({ hypothesisId: id, ok: true, from: m.status, to: m.status, detail: `already ${m.status}; unchanged` });
      continue;
    }
    let status = m.status;
    if (status === 'draft') {
      const s = await transition(prisma, id, 'submit', { now: input.now, actor: input.actor, reason });
      if (!s.ok) {
        results.push({ hypothesisId: id, ok: false, from: status, to: null, detail: `submit refused: ${s.reason}` });
        continue;
      }
      status = 'review_required';
    }
    const a = await transition(prisma, id, 'approve', { now: input.now, actor: input.actor, reason });
    results.push(a.ok ? { hypothesisId: id, ok: true, from: m.status, to: 'approved', detail: 'approved' } : { hypothesisId: id, ok: false, from: status, to: null, detail: `approve refused: ${a.reason}` });
  }
  return { ok: results.every((r) => r.ok), results };
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
  const newIndependent = research.facts.filter((f) => f.fresh && !existingOrigins.has(originKeyOf({ id: f.signalId, source_kind: 'evidence_record', evidence_url: f.url, evidence_text: f.excerpt }) ?? ''));
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
  members: Array<{ id: string; status: string; personaName: string | null; personaTitle: string | null }>;
  reviewable: number;
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
    members: g.members.map((m) => ({ id: m.id, status: m.status, personaName: m.personaName, personaTitle: m.personaTitle })),
    reviewable: g.reviewable,
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
