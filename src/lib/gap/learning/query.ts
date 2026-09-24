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
}

export interface LearningConversationRow extends FunnelConversation {
  sender: string | null;
}

export interface LearningInputs {
  hypotheses: LearningHypothesisRow[];
  conversations: LearningConversationRow[];
}

/** BID types that carry a root-cause or impact signal (mirrors resolution.ts). */
const IMPACT_BID_TYPES = new Set(['impact', 'metric']);

function nonEmpty(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function loadLearningInputs(prisma: any): Promise<LearningInputs> {
  const [hypothesisRows, dispositionRows, bidRows] = await Promise.all([
    prisma.prospectingHypothesis.findMany({
      select: {
        id: true,
        status: true,
        account_name: true,
        problem_family: true,
        persona: true,
        sequence_family_id: true,
        sequence_version_id: true,
        account: { select: { tier: true } },
        signals: { select: { role: true, signal: { select: { type: true } } } },
      },
    }),
    // The gate: only a HUMAN-CONFIRMED disposition is a conversation. See file header.
    prisma.conversationDisposition.findMany({
      where: { human_confirmed: true },
      select: {
        id: true,
        hypothesis_id: true,
        response_class: true,
        channel: true,
        root_cause_class: true,
        impact_class: true,
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
  ]);

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

  const hypotheses: LearningHypothesisRow[] = (hypothesisRows as any[]).map((h) => {
    const signals: Array<{ role: string; signal: { type: string } | null }> = h.signals ?? [];
    const primary = signals.find((s) => s.role === 'primary') ?? signals[0];
    return {
      id: h.id,
      status: h.status,
      accountName: h.account_name,
      problemFamily: h.problem_family ?? null,
      persona: h.persona ?? null,
      tamTier: h.account?.tier ?? null,
      sequenceFamilyId: h.sequence_family_id ?? null,
      sequenceVersionId: h.sequence_version_id ?? null,
      primarySignalType: primary?.signal?.type ?? null,
    };
  });

  const conversations: LearningConversationRow[] = (dispositionRows as any[]).map((d) => {
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
}

export async function buildLearningReport(prisma: any): Promise<LearningReport> {
  const { hypotheses, conversations } = await loadLearningInputs(prisma);

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
      hypotheses.map((h) => h.primarySignalType).filter((t): t is string => t !== null),
    ),
    counts: { hypotheses: hypotheses.length, conversations: conversations.length },
  };
}
