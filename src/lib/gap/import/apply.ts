/**
 * Import plan applier (GAP Prospecting OS, Sprint 1, S1-T10).
 *
 * The ONE module in `src/lib/gap/import` that touches the database, and it
 * does so only through injected dependencies: the signal registry, the
 * hypothesis service's `proposeHypothesis`, and `createBid` below. Tests pass
 * stubs; the CLIs pass the real functions. Nothing here imports the
 * hypothesis service at module level, so this compiles on its own.
 *
 * Invariants:
 *   - `dryRun: true` calls NO dependency. It only counts.
 *   - A hypothesis is only ever proposed as `draft`. Activation is a human act.
 *   - A BID written here is `human_confirmed: false`, always. `createBid`
 *     throws if asked otherwise.
 *   - Re-applying a plan creates nothing: signals dedupe on
 *     (source_kind, source_id) in the registry, hypotheses on source_ref in
 *     the service (`duplicate_source_ref` counts as existing), and BIDs are
 *     skipped whenever their hypothesis was not created in this run.
 *
 * House convention for DB glue is `prisma: any`.
 */

import type { ProspectingSignalInput } from '../signals/projection';
import type { BidPlan, HypothesisPlan, ImportPlan } from './pic';

// ---------------------------------------------------------------------------
// Dependency contracts
// ---------------------------------------------------------------------------

/** Mirrors the hypothesis service's ProposeInput. `predictedBuyerLanguage` is serialized text. */
export interface ProposeHypothesisInput {
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

export type ProposeHypothesisResult =
  | { ok: true; id: string; status: 'draft' }
  | { ok: false; reason: string; existingId?: string };

export interface CreateBidInput extends BidPlan {
  hypothesisId: string;
  accountName: string;
  personaId?: number | null;
  /** Lowercased on write. Empty when the source names a speaker but no address. */
  contactEmail?: string | null;
}

export interface ApplyDeps {
  registerSignal: (prisma: any, input: ProspectingSignalInput) => Promise<{ created: boolean; id: string }>;
  proposeHypothesis: (prisma: any, input: ProposeHypothesisInput) => Promise<ProposeHypothesisResult>;
  createBid: (prisma: any, input: CreateBidInput) => Promise<{ id: string }>;
}

export interface ApplyOptions {
  dryRun: boolean;
  createdBy: string;
}

export interface ApplyReport {
  dryRun: boolean;
  hypotheses: { created: number; existing: number; wouldCreate: number; refused: Record<string, number> };
  signals: { created: number; existing: number; wouldCreate: number; refused: Record<string, number> };
  bids: { created: number; wouldCreate: number };
}

// ---------------------------------------------------------------------------
// createBid: the thin buyer_input_data insert
// ---------------------------------------------------------------------------

/**
 * Insert one unconfirmed buyer-input-data row. The raw language is write-once
 * at the database (GAP_BID_IMMUTABLE), so what lands here is what the buyer
 * said, verbatim from the source, and only a human may confirm it later.
 */
export async function createBid(prisma: any, input: CreateBidInput): Promise<{ id: string }> {
  if (input.humanConfirmed !== false) {
    throw new Error('createBid refuses human_confirmed: an importer never confirms buyer truth');
  }
  const row = await prisma.buyerInputData.create({
    data: {
      hypothesis_id: input.hypothesisId,
      account_name: input.accountName,
      persona_id: input.personaId ?? null,
      contact_email: (input.contactEmail ?? '').trim().toLowerCase(),
      type: input.type,
      raw_buyer_language: input.rawBuyerLanguage,
      source: input.source,
      captured_at: input.capturedAt,
      captured_by: input.capturedBy,
      ai_extracted: input.aiExtracted,
      human_confirmed: false,
      metadata: input.metadata,
    },
    select: { id: true },
  });
  return { id: row.id };
}

// ---------------------------------------------------------------------------
// applyPlan
// ---------------------------------------------------------------------------

function bump(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function emptyReport(dryRun: boolean): ApplyReport {
  return {
    dryRun,
    hypotheses: { created: 0, existing: 0, wouldCreate: 0, refused: {} },
    signals: { created: 0, existing: 0, wouldCreate: 0, refused: {} },
    bids: { created: 0, wouldCreate: 0 },
  };
}

/** Render the observation template with registered ids: one cited sentence per line. */
export function renderObservation(plan: HypothesisPlan, idBySourceId: Map<string, string>): string {
  if (plan.observationTemplate.length === 0) return plan.observation;
  const sentences: string[] = [];
  for (const line of plan.observationTemplate) {
    const id = idBySourceId.get(line.signalSourceId);
    if (!id) continue;
    sentences.push(`${line.text} [S:${id}].`);
  }
  return sentences.join(' ');
}

function toProposeInput(
  plan: HypothesisPlan,
  signalIds: string[],
  observation: string,
  primarySignalId: string | null,
  createdBy: string,
): ProposeHypothesisInput {
  return {
    accountName: plan.accountName,
    primaryPersonaId: null,
    persona: plan.persona,
    problemFamily: plan.problemFamily,
    secondaryFamilies: plan.secondaryFamilies,
    observation,
    problemHypothesis: plan.problemHypothesis,
    rootCauseHypotheses: plan.rootCauseHypotheses,
    impactHypotheses: plan.impactHypotheses,
    whyNow: plan.whyNow,
    falsificationQuestions: plan.falsificationQuestions,
    whatANoMeans: plan.whatANoMeans,
    contraryEvidence: plan.contraryEvidence,
    predictedBuyerLanguage: plan.predictedBuyerLanguage ? JSON.stringify(plan.predictedBuyerLanguage) : null,
    buyingCenter: plan.buyingCenter,
    confidence: plan.confidence,
    signalIds,
    primarySignalId,
    sourceRef: plan.sourceRef,
    metadata: plan.metadata,
    createdBy,
  };
}

async function applyHypothesis(
  prisma: any,
  plan: HypothesisPlan,
  deps: ApplyDeps,
  opts: ApplyOptions,
  report: ApplyReport,
): Promise<void> {
  for (const refusal of plan.signalRefusals) bump(report.signals.refused, refusal.reason);

  if (opts.dryRun) {
    report.signals.wouldCreate += plan.signals.length;
    report.hypotheses.wouldCreate += 1;
    report.bids.wouldCreate += plan.bids.length;
    return;
  }

  const signalIds: string[] = [];
  const idBySourceId = new Map<string, string>();
  for (const signal of plan.signals) {
    const registered = await deps.registerSignal(prisma, signal);
    if (registered.created) report.signals.created += 1;
    else report.signals.existing += 1;
    signalIds.push(registered.id);
    idBySourceId.set(signal.sourceId, registered.id);
  }

  const observation = renderObservation(plan, idBySourceId);
  const primarySourceId = plan.observationTemplate[0]?.signalSourceId ?? plan.signals[0]?.sourceId;
  const primarySignalId = primarySourceId ? (idBySourceId.get(primarySourceId) ?? null) : null;

  const proposed = await deps.proposeHypothesis(
    prisma,
    toProposeInput(plan, signalIds, observation, primarySignalId, opts.createdBy),
  );

  if (!proposed.ok) {
    if (proposed.reason === 'duplicate_source_ref') report.hypotheses.existing += 1;
    else bump(report.hypotheses.refused, proposed.reason);
    return;
  }

  report.hypotheses.created += 1;
  for (const bid of plan.bids) {
    await deps.createBid(prisma, {
      ...bid,
      hypothesisId: proposed.id,
      accountName: plan.accountName,
      personaId: null,
      contactEmail: null,
    });
    report.bids.created += 1;
  }
}

/**
 * Apply an import plan. With `dryRun` nothing is called and the report says
 * what WOULD be created. Otherwise signals are registered, each hypothesis is
 * proposed as draft, and on-tape BIDs are attached to hypotheses created in
 * this run.
 */
export async function applyPlan(
  prisma: any,
  plan: ImportPlan,
  deps: ApplyDeps,
  opts: ApplyOptions,
): Promise<ApplyReport> {
  const report = emptyReport(opts.dryRun);
  for (const hypothesis of plan.hypotheses) {
    await applyHypothesis(prisma, hypothesis, deps, opts, report);
  }
  return report;
}
