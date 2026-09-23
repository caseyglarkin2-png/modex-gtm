/**
 * Hypothesis service (GAP Prospecting OS, Sprint 1, S1-T8).
 *
 * The DB glue around the pure state machine in ./machine.ts. The split is
 * deliberate: the MACHINE owns the rules (which action is legal from which
 * status, and which guards must hold), the SERVICE owns the transaction and
 * the optimistic status check. Every transition runs as one `$transaction`
 * that (1) moves the row with `updateMany({ where: { id, status: from } })`
 * so a concurrent writer who already moved it makes the update match nothing,
 * and (2) appends the HypothesisEvent through the same tx so the event lands
 * or rolls back with the status change. A zero-row match throws inside the
 * transaction to roll it back and surfaces as `{ ok: false, reason:
 * 'stale_status' }`.
 *
 * Enrollment stops are NOT applied here. Callers receive the machine's
 * `stop_enrollments:*` effects and act on them (Sprint 3).
 *
 * House convention for DB glue is `prisma: any` (see
 * src/lib/queue/sequence-runtime.ts). Column names are the schema's
 * snake_case; delegates are the camelCase model names.
 */

import { audit as defaultAudit, recordHypothesisEvent, type GapAuditKind } from '../audit';
import {
  expiresAtFor,
  transition,
  type HypothesisAction,
  type HypothesisSnapshot,
  type HypothesisStatus,
  type LinkedSignal,
  type TransitionContext,
} from './machine';
import { validateObservation } from './observation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProposeInput {
  accountName: string;
  primaryPersonaId?: number | null;
  persona: string;
  problemFamily: string;
  secondaryFamilies?: string[];
  observation: string;
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow?: string | null;
  falsificationQuestions: string[];
  whatANoMeans?: string | null;
  contraryEvidence?: string | null;
  predictedBuyerLanguage?: string | null;
  buyingCenter?: string | null;
  confidence: number;
  signalIds: string[];
  primarySignalId?: string | null;
  sourceRef?: string | null;
  metadata?: unknown;
  createdBy: string;
}

export type ProposeResult =
  | { ok: true; id: string; status: 'draft' }
  | { ok: false; reason: string; existingId?: string };

export interface LoadedSnapshot extends HypothesisSnapshot {
  id: string;
  accountName: string;
  primaryPersonaId: number | null;
  sequenceVersionId: string | null;
}

export type TransitionOutcome =
  | { ok: true; from: HypothesisStatus; to: HypothesisStatus; effects: string[] }
  | { ok: false; reason: string };

export interface ServiceDeps {
  audit?: typeof defaultAudit;
}

export interface NarrativePatch {
  problemFamily?: string;
  secondaryFamilies?: string[];
  persona?: string;
  observation?: string;
  problemHypothesis?: string;
  rootCauseHypotheses?: string[];
  impactHypotheses?: string[];
  whyNow?: string | null;
  falsificationQuestions?: string[];
  whatANoMeans?: string | null;
  contraryEvidence?: string | null;
  predictedBuyerLanguage?: string | null;
  buyingCenter?: string | null;
  confidence?: number;
  signalIds?: string[];
  primarySignalId?: string | null;
}

export type NarrativeResult =
  | { ok: true; id: string; status: HypothesisStatus }
  | { ok: false; reason: string };

export interface ExpireDueResult {
  expired: number;
  skipped: Array<{ id: string; reason: string }>;
}

export interface ListFilters {
  accountName?: string;
  status?: HypothesisStatus | HypothesisStatus[];
  problemFamily?: string;
  limit?: number;
  cursor?: string | null;
}

/** Audit kind per action. `transition` names the actions; this names the ledger rows. */
const AUDIT_KIND: Record<HypothesisAction, GapAuditKind> = {
  submit: 'hypothesis.submitted',
  reject_review: 'hypothesis.review_rejected',
  approve: 'hypothesis.approved',
  activate: 'hypothesis.activated',
  resolve: 'hypothesis.resolved',
  close_unresolved: 'hypothesis.closed_unresolved',
  expire: 'hypothesis.expired',
  withdraw: 'hypothesis.withdrawn',
};

const EDITABLE_STATUSES: readonly HypothesisStatus[] = ['draft', 'review_required'];
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 200;

/** Column map for the narrative patch. Keys not listed here (signalIds, primarySignalId) are join changes. */
const NARRATIVE_COLUMNS: Record<Exclude<keyof NarrativePatch, 'signalIds' | 'primarySignalId'>, string> = {
  problemFamily: 'problem_family',
  secondaryFamilies: 'secondary_families',
  persona: 'persona',
  observation: 'observation',
  problemHypothesis: 'problem_hypothesis',
  rootCauseHypotheses: 'root_cause_hypotheses',
  impactHypotheses: 'impact_hypotheses',
  whyNow: 'why_now',
  falsificationQuestions: 'falsification_questions',
  whatANoMeans: 'what_a_no_means',
  contraryEvidence: 'contrary_evidence',
  predictedBuyerLanguage: 'predicted_buyer_language',
  buyingCenter: 'buying_center',
  confidence: 'confidence',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isConfidence(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

/** `null` when every id exists, else the first missing id. */
async function firstUnknownSignal(prisma: any, signalIds: readonly string[]): Promise<string | null> {
  const found: Array<{ id: string }> = await prisma.prospectingSignal.findMany({
    where: { id: { in: [...signalIds] } },
    select: { id: true },
  });
  const known = new Set(found.map((signal) => signal.id));
  for (const id of signalIds) {
    if (!known.has(id)) return id;
  }
  return null;
}

function joinRows(hypothesisId: string, signalIds: readonly string[], primarySignalId: string | null | undefined, linkedBy: string) {
  const unique = Array.from(new Set(signalIds));
  return unique.map((signalId) => ({
    hypothesis_id: hypothesisId,
    signal_id: signalId,
    role: signalId === primarySignalId ? 'primary' : 'supporting',
    linked_by: linkedBy,
  }));
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

const STALE = 'stale_status';

class StaleStatusError extends Error {
  constructor() {
    super(STALE);
    this.name = 'StaleStatusError';
  }
}

// ---------------------------------------------------------------------------
// propose
// ---------------------------------------------------------------------------

/**
 * Create a hypothesis in `draft`. Guards run before any write; the row, its
 * signal links and the `propose` event land in one transaction. No audit
 * fan-out: submit is a separate action and is what the review feed sees.
 */
export async function proposeHypothesis(prisma: any, input: ProposeInput): Promise<ProposeResult> {
  if (input.signalIds.length === 0) return { ok: false, reason: 'no_signals' };

  const unknown = await firstUnknownSignal(prisma, input.signalIds);
  if (unknown !== null) return { ok: false, reason: `unknown_signal:${unknown}` };

  const observation = validateObservation(input.observation, input.signalIds);
  if (!observation.ok) return { ok: false, reason: observation.reason };

  if (!isConfidence(input.confidence)) return { ok: false, reason: 'bad_confidence' };

  if (input.sourceRef) {
    const existing = await prisma.prospectingHypothesis.findFirst({
      where: { source_ref: input.sourceRef },
      select: { id: true },
    });
    if (existing) return { ok: false, reason: 'duplicate_source_ref', existingId: existing.id };
  }

  const data: Record<string, unknown> = {
    account_name: input.accountName,
    primary_persona_id: input.primaryPersonaId ?? null,
    problem_family: input.problemFamily,
    secondary_families: input.secondaryFamilies ?? [],
    observation: input.observation,
    problem_hypothesis: input.problemHypothesis,
    root_cause_hypotheses: input.rootCauseHypotheses,
    impact_hypotheses: input.impactHypotheses,
    why_now: input.whyNow ?? null,
    falsification_questions: input.falsificationQuestions,
    what_a_no_means: input.whatANoMeans ?? null,
    contrary_evidence: input.contraryEvidence ?? null,
    predicted_buyer_language: input.predictedBuyerLanguage ?? null,
    buying_center: input.buyingCenter ?? null,
    persona: input.persona,
    confidence: input.confidence,
    status: 'draft',
    source_ref: input.sourceRef ?? null,
    created_by: input.createdBy,
  };
  if (input.metadata !== undefined) data.metadata = input.metadata;

  const id: string = await prisma.$transaction(async (tx: any) => {
    const created = await tx.prospectingHypothesis.create({ data, select: { id: true } });
    await tx.hypothesisSignal.createMany({
      data: joinRows(created.id, input.signalIds, input.primarySignalId, input.createdBy),
    });
    await recordHypothesisEvent(prisma, tx, {
      hypothesisId: created.id,
      fromStatus: null,
      toStatus: 'draft',
      action: 'propose',
      actor: input.createdBy,
      payload: { signalIds: input.signalIds, primarySignalId: input.primarySignalId ?? null },
    });
    return created.id;
  });

  return { ok: true, id, status: 'draft' };
}

// ---------------------------------------------------------------------------
// snapshot
// ---------------------------------------------------------------------------

/**
 * Load the machine's view of one hypothesis in one query plus, when the
 * primary persona has an email, one unsubscribe lookup. `null` when the row
 * does not exist.
 */
export async function loadSnapshot(prisma: any, id: string): Promise<LoadedSnapshot | null> {
  const row = await prisma.prospectingHypothesis.findUnique({
    where: { id },
    include: {
      signals: {
        include: {
          signal: {
            select: { id: true, evidence_url: true, evidence_text: true, freshness_expires_at: true },
          },
        },
      },
      primary_persona: { select: { do_not_contact: true, email: true } },
      sequence_version: { select: { status: true, steps: true } },
      dispositions: {
        where: { human_confirmed: true },
        select: { response_class: true, created_at: true },
      },
    },
  });
  if (!row) return null;

  const persona = row.primary_persona ?? null;
  let unsubscribed = false;
  const email = typeof persona?.email === 'string' ? persona.email.trim().toLowerCase() : '';
  if (email.length > 0) {
    const hit = await prisma.unsubscribedEmail.findUnique({ where: { email }, select: { id: true } });
    unsubscribed = Boolean(hit);
  }

  const linkedSignals: LinkedSignal[] = (row.signals ?? []).map((link: any) => ({
    id: link.signal?.id ?? link.signal_id,
    hasEvidence: Boolean(link.signal?.evidence_url || link.signal?.evidence_text),
    expiresAt: link.signal?.freshness_expires_at ?? null,
  }));

  const versionRow = row.sequence_version ?? null;
  const steps = Array.isArray(versionRow?.steps) ? versionRow.steps : [];
  const version = versionRow
    ? { status: versionRow.status, firstTouchProductProof: Boolean(steps[0]?.productProofAllowed) }
    : null;

  return {
    id: row.id,
    accountName: row.account_name,
    primaryPersonaId: row.primary_persona_id ?? null,
    sequenceVersionId: row.sequence_version_id ?? null,
    status: row.status,
    problemFamily: row.problem_family,
    persona: row.persona,
    observation: row.observation,
    problemHypothesis: row.problem_hypothesis,
    falsificationQuestions: asStringArray(row.falsification_questions),
    linkedSignals,
    reviewedBy: row.reviewed_by ?? null,
    personaSuppressed: Boolean(persona?.do_not_contact) || unsubscribed,
    version,
    expiresAt: row.expires_at ?? null,
    confirmedDispositions: (row.dispositions ?? []).map((d: any) => ({
      responseClass: d.response_class,
      createdAt: d.created_at,
    })),
  };
}

// ---------------------------------------------------------------------------
// transition
// ---------------------------------------------------------------------------

function columnsForEffects(
  effects: readonly string[],
  action: HypothesisAction,
  snapshot: LoadedSnapshot,
  ctx: TransitionContext,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const actor = ctx.actor ?? null;
  for (const effect of effects) {
    if (effect === 'set_reviewed') {
      data.reviewed_by = actor;
      data.reviewed_at = ctx.now;
    } else if (effect === 'set_activated') {
      data.activated_at = ctx.now;
    } else if (effect === 'set_expires_at') {
      data.expires_at = expiresAtFor(snapshot.linkedSignals, ctx.now);
    } else if (effect === 'set_resolved') {
      data.resolved_at = ctx.now;
      data.resolved_by = actor;
      data.resolution = {
        problem:
          ctx.outcome === 'confirmed' ? 'confirmed' : ctx.outcome === 'partially_confirmed' ? 'partial' : 'rejected',
        rootCause: 'unknown',
        impact: 'unknown',
        notes: ctx.reason ?? null,
        dispositionIds: [],
        bidIds: [],
      };
    }
    // freeze_narrative and stop_enrollments:* have no column here. The DB
    // trigger freezes the narrative; enrollment stops belong to the caller.
  }
  if (action === 'withdraw' || action === 'close_unresolved' || action === 'expire') {
    data.resolved_at = ctx.now;
    data.resolved_by = actor;
  }
  return data;
}

/**
 * Apply one action to a hypothesis. The machine decides; the service moves
 * the row under an optimistic `status: from` predicate and appends the event
 * in the same transaction. After commit the audit ledger and review feed are
 * notified fire-and-forget. Returns the machine's effects so the caller can
 * act on `stop_enrollments:*`.
 */
export async function transitionHypothesis(
  prisma: any,
  id: string,
  action: HypothesisAction,
  ctx: TransitionContext,
  deps: ServiceDeps = {},
): Promise<TransitionOutcome> {
  const snapshot = await loadSnapshot(prisma, id);
  if (!snapshot) return { ok: false, reason: 'not_found' };

  const decision = transition(snapshot, action, ctx);
  if (!decision.ok) return decision;

  const from = snapshot.status;
  const { to, effects } = decision;
  const actor = ctx.actor ?? 'system';
  const data = { status: to, ...columnsForEffects(effects, action, snapshot, ctx) };

  try {
    await prisma.$transaction(async (tx: any) => {
      const moved = await tx.prospectingHypothesis.updateMany({ where: { id, status: from }, data });
      if (moved.count !== 1) throw new StaleStatusError();
      await recordHypothesisEvent(prisma, tx, {
        hypothesisId: id,
        fromStatus: from,
        toStatus: to,
        action,
        actor,
        reason: ctx.reason ?? null,
        payload: { effects },
      });
    });
  } catch (error) {
    if (error instanceof StaleStatusError) return { ok: false, reason: STALE };
    throw error;
  }

  // Fire-and-forget after commit: the ledger and review feed never gate the transition.
  const auditFn = deps.audit ?? defaultAudit;
  try {
    void auditFn(prisma, {
      kind: AUDIT_KIND[action],
      actor,
      subjectType: 'hypothesis',
      subjectId: id,
      payload: { from, to, effects },
      review: {
        target: snapshot.accountName,
        title: `${action} ${snapshot.problemFamily}`,
        intent: ctx.reason ?? action,
      },
    }).catch(() => undefined);
  } catch {
    // A synchronous throw from an injected audit must not surface either.
  }

  return { ok: true, from, to, effects };
}

// ---------------------------------------------------------------------------
// narrative edits
// ---------------------------------------------------------------------------

/**
 * Edit the narrative of a hypothesis that has not left draft/review_required.
 * A new observation or a new signal set is re-validated against the (new)
 * linked set and fails closed with the validator's reason. Records an `edit`
 * event in the same transaction.
 */
export async function updateDraftNarrative(
  prisma: any,
  id: string,
  patch: NarrativePatch,
  actor: string,
): Promise<NarrativeResult> {
  const row = await prisma.prospectingHypothesis.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      observation: true,
      signals: { select: { signal_id: true, role: true } },
    },
  });
  if (!row) return { ok: false, reason: 'not_found' };
  if (!EDITABLE_STATUSES.includes(row.status)) return { ok: false, reason: 'narrative_frozen' };

  const currentIds: string[] = (row.signals ?? []).map((link: any) => link.signal_id);
  const nextIds = patch.signalIds ?? currentIds;

  if (patch.signalIds !== undefined) {
    if (patch.signalIds.length === 0) return { ok: false, reason: 'no_signals' };
    const unknown = await firstUnknownSignal(prisma, patch.signalIds);
    if (unknown !== null) return { ok: false, reason: `unknown_signal:${unknown}` };
  }

  if (patch.observation !== undefined || patch.signalIds !== undefined) {
    const observation = validateObservation(patch.observation ?? row.observation, nextIds);
    if (!observation.ok) return { ok: false, reason: observation.reason };
  }

  if (patch.confidence !== undefined && !isConfidence(patch.confidence)) {
    return { ok: false, reason: 'bad_confidence' };
  }

  const data: Record<string, unknown> = {};
  for (const key of Object.keys(NARRATIVE_COLUMNS) as Array<keyof typeof NARRATIVE_COLUMNS>) {
    if (patch[key] !== undefined) data[NARRATIVE_COLUMNS[key]] = patch[key];
  }

  const fields = Object.keys(patch).filter((key) => (patch as Record<string, unknown>)[key] !== undefined);
  if (fields.length === 0) return { ok: false, reason: 'empty_patch' };

  const replaceJoins = patch.signalIds !== undefined;
  const primarySignalId =
    patch.primarySignalId !== undefined
      ? patch.primarySignalId
      : ((row.signals ?? []).find((link: any) => link.role === 'primary')?.signal_id ?? null);

  await prisma.$transaction(async (tx: any) => {
    if (Object.keys(data).length > 0) {
      await tx.prospectingHypothesis.update({ where: { id }, data });
    }
    if (replaceJoins) {
      await tx.hypothesisSignal.deleteMany({ where: { hypothesis_id: id } });
      await tx.hypothesisSignal.createMany({ data: joinRows(id, nextIds, primarySignalId, actor) });
    }
    await recordHypothesisEvent(prisma, tx, {
      hypothesisId: id,
      fromStatus: row.status,
      toStatus: row.status,
      action: 'edit',
      actor,
      payload: { fields },
    });
  });

  return { ok: true, id, status: row.status };
}

// ---------------------------------------------------------------------------
// expiry sweep
// ---------------------------------------------------------------------------

/**
 * Expire every approved/active hypothesis whose `expires_at` has passed. Each
 * row goes through `transitionHypothesis` so the machine's guard and the
 * optimistic check still apply; refusals are reported, not thrown.
 */
export async function expireDue(
  prisma: any,
  now: Date,
  actor: string,
  deps: ServiceDeps = {},
): Promise<ExpireDueResult> {
  const due: Array<{ id: string }> = await prisma.prospectingHypothesis.findMany({
    where: { status: { in: ['approved', 'active'] }, expires_at: { lte: now } },
    select: { id: true },
  });

  let expired = 0;
  const skipped: Array<{ id: string; reason: string }> = [];
  for (const { id } of due) {
    const out = await transitionHypothesis(prisma, id, 'expire', { now, actor }, deps);
    if (out.ok) expired += 1;
    else skipped.push({ id, reason: out.reason });
  }
  return { expired, skipped };
}

// ---------------------------------------------------------------------------
// reads
// ---------------------------------------------------------------------------

/** Newest first, cursor-paged. `nextCursor` is the id to pass for the following page. */
export async function listHypotheses(
  prisma: any,
  filters: ListFilters = {},
): Promise<{ items: any[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
  const where: Record<string, unknown> = {};
  if (filters.accountName) where.account_name = filters.accountName;
  if (filters.problemFamily) where.problem_family = filters.problemFamily;
  if (filters.status) {
    where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
  }

  const query: Record<string, unknown> = {
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  };
  if (filters.cursor) {
    query.cursor = { id: filters.cursor };
    query.skip = 1;
  }

  const rows: any[] = await prisma.prospectingHypothesis.findMany(query);
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
}

/** One hypothesis with its signal links (and the signals) and its event log, oldest event first. */
export async function getHypothesis(prisma: any, id: string): Promise<any | null> {
  return prisma.prospectingHypothesis.findUnique({
    where: { id },
    include: {
      signals: { include: { signal: true } },
      events: { orderBy: { created_at: 'asc' } },
    },
  });
}
