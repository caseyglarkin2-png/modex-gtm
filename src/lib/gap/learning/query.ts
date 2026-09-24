/**
 * Learning query (GAP Prospecting OS, Sprint 5). Prisma glue for `metrics.ts`.
 *
 * The one place that is allowed to decide what counts as a "conversation":
 * `conversationDisposition.findMany` is filtered `human_confirmed: true` at
 * the query itself, not in application code after the fetch, so an
 * AI-suggested unconfirmed row can never reach a learning metric no matter
 * what a later refactor does to this file (the mutation this file owns: drop
 * the `where` clause and `learning-query.test.ts`'s structural assertion
 * goes red naming this query, independent of the behavioral fixture that
 * also proves an unconfirmed root-cause BID is excluded from the join).
 *
 * BID rows are fetched WHOLE (confirmed and unconfirmed, corrections and
 * originals) because `selectConfirmedBids` needs the whole set to compute
 * which rows are superseded (see `bid/select.ts`); filtering to
 * `human_confirmed: true` at the query here would silently keep a row a
 * later correction had superseded.
 *
 * House convention for DB glue is `prisma: any`.
 */

import { selectConfirmedBids, numericValueOf } from '../bid/select';
import { loadReplyBacklog, type ReplyBacklog } from './reply-backlog';
import { isInternalRecipient } from '../sequence/internal-recipient';
import {
  computeFunnel,
  breakdownByHypothesisDimension,
  breakdownByConversationDimension,
  dispositionDistribution,
  computeSignalYield,
  type ConversationFunnel,
  type FunnelConversation,
  type FunnelHypothesis,
  type LearningFunnel,
} from './metrics';

export interface LearningHypothesisRow extends FunnelHypothesis {
  accountName: string;
  problemFamily: string | null;
  persona: string | null;
  tamTier: string | null;
  sequenceFamilyId: string | null;
  sequenceVersionId: string | null;
  primarySignalType: string | null;
  /** SF16 (Opus adversarial review, 2026-09-24): the primary signal's own id, so yield can dedupe distinct signals rather than count hypotheses. */
  primarySignalId: string | null;
}

export interface LearningConversationRow extends FunnelConversation {
  sender: string | null;
}

export interface LearningInputs {
  hypotheses: LearningHypothesisRow[];
  conversations: LearningConversationRow[];
}

/**
 * R-A (owner-confirmed finish requirement, 2026-09-24): campaign/program and
 * date-range filters over the learning report. Answers "how did <program>
 * perform" and "what happened in this window", not a BI platform: two
 * filters, both optional, both pushed into the query.
 *
 * `program` matches `SequenceFamily.program` through the same
 * SequenceEnrollment attribution B8 uses. A conversation whose disposition
 * has no enrollment at all (a bare phone call, never enrolled) carries no
 * program and is excluded when this filter is set, since it cannot be
 * attributed to the campaign in question. `from`/`to` filter conversations
 * by `ConversationDisposition.confirmed_at`, inclusive; hypotheses are not
 * date-filtered by themselves (a hypothesis can span the window), only
 * restricted by `program` when that filter is set.
 */
export interface LearningFilters {
  program?: string | null;
  from?: Date | null;
  to?: Date | null;
  /** 6E: clock for the reply backlog metric. Defaults to `new Date()`. */
  now?: Date;
}

/** BID types that carry a root-cause or impact signal (mirrors resolution.ts). */
const IMPACT_BID_TYPES = new Set(['impact', 'metric']);

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function loadLearningInputs(prisma: any, filters: LearningFilters = {}): Promise<LearningInputs> {
  const program = filters.program?.trim() || null;

  const dispositionWhere: Record<string, unknown> = program
    ? // A program filter requires a real, external, in-program enrollment;
      // a disposition with no enrollment (a bare call) cannot match a program.
      { human_confirmed: true, enrollment: { is_test: false, family: { program } } }
    : // No program filter: the B9 OR gate lets a no-enrollment disposition through.
      { human_confirmed: true, OR: [{ enrollment_id: null }, { enrollment: { is_test: false } }] };
  if (filters.from || filters.to) {
    dispositionWhere.confirmed_at = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  const enrollmentWhere: Record<string, unknown> = { hypothesis_id: { not: null } };
  if (program) enrollmentWhere.family = { program };

  const [hypothesisRows, dispositionRows, bidRows, enrollmentAttributionRows] = await Promise.all([
    prisma.prospectingHypothesis.findMany({
      select: {
        id: true,
        status: true,
        account_name: true,
        problem_family: true,
        persona: true,
        account: { select: { tier: true } },
        signals: { select: { role: true, signal: { select: { id: true, type: true } } } },
      },
    }),
    // The gate: only a HUMAN-CONFIRMED disposition is a conversation (see
    // file header). B9 (Opus adversarial review, 2026-09-24): also excludes
    // an is_test enrollment, so an internal test run's confirmed dispositions
    // never feed resolution, precision or the G5 gate.
    prisma.conversationDisposition.findMany({
      where: dispositionWhere,
      select: {
        id: true,
        hypothesis_id: true,
        response_class: true,
        channel: true,
        root_cause_class: true,
        impact_class: true,
        contact_email: true,
        enrollment: { select: { sender: true } },
      },
    }),
    prisma.buyerInputData.findMany({
      select: {
        id: true,
        hypothesis_id: true,
        type: true,
        human_confirmed: true,
        supersedes_id: true,
        numeric_value: true,
        unit: true,
      },
    }),
    // B8 (Opus adversarial review, 2026-09-24): ProspectingHypothesis.sequence_family_id
    // and .sequence_version_id are never written by any code path (grep of
    // src and scripts). SequenceEnrollment.hypothesis_id is the real
    // attribution; the newest enrollment per hypothesis wins.
    prisma.sequenceEnrollment.findMany({
      where: enrollmentWhere,
      select: { hypothesis_id: true, family_id: true, sequence_version_id: true, enrolled_at: true },
      orderBy: { enrolled_at: 'desc' },
    }),
  ]);

  // B9: the internal-recipient exclusion cannot be expressed as a Prisma
  // `where` (the FROM_EMAIL override is an env read), so it runs here,
  // structurally identical to the is_test predicate perform-send.ts and
  // sequence/enrollment.ts already apply.
  const externalDispositionRows = (dispositionRows as any[]).filter((d) => !isInternalRecipient(d.contact_email));

  const sequenceAttributionByHypothesis = new Map<string, { familyId: string | null; versionId: string | null }>();
  for (const row of enrollmentAttributionRows as any[]) {
    if (!row.hypothesis_id || sequenceAttributionByHypothesis.has(row.hypothesis_id)) continue;
    sequenceAttributionByHypothesis.set(row.hypothesis_id, {
      familyId: row.family_id ?? null,
      versionId: row.sequence_version_id ?? null,
    });
  }

  // R-A: a program filter also restricts which hypotheses count toward the
  // funnel's denominator, to the ones with at least one enrollment in that
  // program (via the same attribution map, itself already program-scoped).
  const hypothesisIdsInScope = program ? sequenceAttributionByHypothesis : null;

  const confirmedBids = selectConfirmedBids(
    (bidRows as any[]).map((b) => ({ id: b.id, humanConfirmed: b.human_confirmed === true, supersedesId: b.supersedes_id ?? null })),
  );
  const confirmedIds = new Set(confirmedBids.map((b) => b.id));
  const bidById = new Map((bidRows as any[]).map((b) => [b.id, b]));

  const rootCauseHypIds = new Set<string>();
  const impactHypIds = new Set<string>();
  const quantifiedImpactHypIds = new Set<string>();
  for (const id of confirmedIds) {
    const row = bidById.get(id);
    if (!row) continue;
    if (row.type === 'root_cause') rootCauseHypIds.add(row.hypothesis_id);
    if (IMPACT_BID_TYPES.has(row.type)) {
      impactHypIds.add(row.hypothesis_id);
      const numeric = numericValueOf(row.numeric_value);
      if (numeric !== null && nonEmpty(row.unit)) quantifiedImpactHypIds.add(row.hypothesis_id);
    }
  }

  const hypotheses: LearningHypothesisRow[] = (hypothesisRows as any[])
    .filter((h) => !hypothesisIdsInScope || hypothesisIdsInScope.has(h.id))
    .map((h) => {
      const signals: Array<{ role: string; signal: { id: string; type: string } | null }> = h.signals ?? [];
      const primary = signals.find((s) => s.role === 'primary') ?? signals[0];
      const attribution = sequenceAttributionByHypothesis.get(h.id);
      return {
        id: h.id,
        status: h.status,
        accountName: h.account_name,
        problemFamily: h.problem_family ?? null,
        persona: h.persona ?? null,
        tamTier: h.account?.tier ?? null,
        sequenceFamilyId: attribution?.familyId ?? null,
        sequenceVersionId: attribution?.versionId ?? null,
        primarySignalType: primary?.signal?.type ?? null,
        primarySignalId: primary?.signal?.id ?? null,
      };
    });

  const conversations: LearningConversationRow[] = externalDispositionRows.map((d) => {
    const quantified = quantifiedImpactHypIds.has(d.hypothesis_id);
    return {
      id: d.id,
      hypothesisId: d.hypothesis_id,
      responseClass: d.response_class,
      channel: d.channel,
      sender: d.enrollment?.sender ?? null,
      rootCauseConfirmed: nonEmpty(d.root_cause_class) || rootCauseHypIds.has(d.hypothesis_id),
      impactAcknowledged: nonEmpty(d.impact_class) || impactHypIds.has(d.hypothesis_id) || quantified,
      impactQuantified: quantified,
    };
  });

  return { hypotheses, conversations };
}

export interface LearningReport {
  funnel: LearningFunnel;
  byProblemFamily: Array<{ key: string; funnel: LearningFunnel }>;
  byPersona: Array<{ key: string; funnel: LearningFunnel }>;
  bySignalType: Array<{ key: string; funnel: LearningFunnel }>;
  byTamTier: Array<{ key: string; funnel: LearningFunnel }>;
  bySequenceFamily: Array<{ key: string; funnel: LearningFunnel }>;
  bySequenceVersion: Array<{ key: string; funnel: LearningFunnel }>;
  byChannel: Array<{ key: string; funnel: ConversationFunnel }>;
  bySender: Array<{ key: string; funnel: ConversationFunnel }>;
  dispositionDistribution: Array<{ responseClass: string; count: number }>;
  signalYield: ReturnType<typeof computeSignalYield>;
  counts: { hypotheses: number; conversations: number };
  /** 6E: replies (Gmail or HubSpot, already unified at ingestion) with no disposition yet, past the threshold. */
  replyBacklog: ReplyBacklog;
}

export async function buildLearningReport(prisma: any, filters: LearningFilters = {}): Promise<LearningReport> {
  const { hypotheses, conversations } = await loadLearningInputs(prisma, filters);
  const replyBacklog = await loadReplyBacklog(prisma, filters.now ?? new Date());

  const signalCountRows = await prisma.prospectingSignal.groupBy({ by: ['type'], _count: { _all: true } });
  const signalCounts = new Map<string, number>((signalCountRows as any[]).map((r) => [r.type, r._count._all as number]));

  return {
    funnel: computeFunnel(hypotheses, conversations),
    byProblemFamily: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.problemFamily),
    byPersona: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.persona),
    bySignalType: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.primarySignalType),
    byTamTier: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.tamTier),
    bySequenceFamily: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.sequenceFamilyId),
    bySequenceVersion: breakdownByHypothesisDimension(hypotheses, conversations, (h) => h.sequenceVersionId),
    byChannel: breakdownByConversationDimension(conversations, (c) => c.channel),
    bySender: breakdownByConversationDimension(conversations, (c) => c.sender),
    dispositionDistribution: dispositionDistribution(conversations),
    signalYield: computeSignalYield(
      signalCounts,
      hypotheses
        .filter((h): h is typeof h & { primarySignalType: string; primarySignalId: string } => h.primarySignalType !== null && h.primarySignalId !== null)
        .map((h) => ({ signalType: h.primarySignalType, signalId: h.primarySignalId })),
    ),
    counts: { hypotheses: hypotheses.length, conversations: conversations.length },
    replyBacklog,
  };
}

/** R-A: distinct SequenceFamily.program values, for the UI's campaign filter. Newest-created families first. */
export async function listLearningPrograms(prisma: any): Promise<string[]> {
  const rows: Array<{ program: string | null }> = await prisma.sequenceFamily.findMany({
    where: { program: { not: null } },
    select: { program: true },
    distinct: ['program'],
    orderBy: { created_at: 'desc' },
  });
  return rows.map((r) => r.program).filter((p): p is string => typeof p === 'string' && p.length > 0);
}
