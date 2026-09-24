/**
 * GAP Prospecting OS, Sprint 6D: the generic campaign reconciler.
 *
 * "Whatever actually happened in an engine" (a HubSpot engagement, a Gmail
 * message, a modex send) is reconciled back to GAP's own truth
 * (ProspectingHypothesis, SequenceEnrollment, ConversationDisposition),
 * generalizing the pattern `sequence/external-sync.ts`'s `runEnrollmentSync`
 * already established for the hubspot_native/Top100 lane. This module is
 * engine-agnostic: the caller supplies one piece of `EngineEvidence` (an
 * event that happened in SOME engine) and the reconciler classifies it,
 * read-only toward the engine (it never writes to HubSpot or Gmail) and
 * read-only toward GAP too in `reconcileOne` -- classification only.
 * Recording a MATCHED result (creating the ConversationDisposition row with
 * enrollment_id, frozen once set by 6D-T1's trigger) is a separate,
 * deliberate write step a caller takes after reviewing the classification,
 * never automatic here.
 *
 * The six outcomes are exhaustive and mutually exclusive for one piece of
 * evidence: MATCHED (a specific enrollment can be attributed), ALREADY_IMPORTED
 * (this exact evidence was reconciled before), UNATTRIBUTED (the account and
 * hypothesis are known but no enrollment explains this evidence),
 * IDENTITY_UNRESOLVED (6A's resolver could not name an account),
 * HYPOTHESIS_MISSING (the account resolved but GAP never built a hypothesis
 * for it), AMBIGUOUS (6A's resolver found more than one plausible account).
 */
import type { ExecutionEngine } from './contract';
import type { IdentityInput, ResolveIdentityResult } from '../identity/resolve';

export type ReconcileOutcome = 'MATCHED' | 'ALREADY_IMPORTED' | 'UNATTRIBUTED' | 'IDENTITY_UNRESOLVED' | 'HYPOTHESIS_MISSING' | 'AMBIGUOUS';

export interface EngineEvidence {
  engine: ExecutionEngine;
  rawAccountName: string;
  hubspotCompanyId?: string | null;
  contactEmail: string;
  /** The engine's own id for this event (a HubSpot engagement id, a Gmail message id, ...). */
  engineEventId: string;
  occurredAt: Date;
}

export interface ReconcileResult {
  outcome: ReconcileOutcome;
  engine: ExecutionEngine;
  engineEventId: string;
  accountName: string | null;
  hypothesisId: string | null;
  enrollmentId: string | null;
  detail?: string;
}

export interface HypothesisLookupRow {
  id: string;
}

export interface EnrollmentLookupRow {
  id: string;
  hypothesis_id: string | null;
}

export interface ReconcilerDeps {
  resolveIdentity: (input: IdentityInput) => Promise<ResolveIdentityResult>;
  /** Has this exact (engine, engineEventId) already been reconciled to a disposition? */
  findAlreadyImported: (engine: ExecutionEngine, engineEventId: string) => Promise<EnrollmentLookupRow | null>;
  /** Any hypothesis GAP has ever built for this canonical account (open or terminal; existence is what matters here). */
  findHypothesis: (accountName: string) => Promise<HypothesisLookupRow | null>;
  /** The enrollment(s) GAP itself created for this contact under this account. Zero or more; the reconciler decides MATCHED vs UNATTRIBUTED from the count. */
  findEnrollments: (accountName: string, contactEmail: string) => Promise<EnrollmentLookupRow[]>;
}

/** Classify one piece of engine evidence. Read-only: no write anywhere. */
export async function reconcileOne(evidence: EngineEvidence, deps: ReconcilerDeps): Promise<ReconcileResult> {
  const base = { engine: evidence.engine, engineEventId: evidence.engineEventId };

  const already = await deps.findAlreadyImported(evidence.engine, evidence.engineEventId);
  if (already) {
    return { ...base, outcome: 'ALREADY_IMPORTED', accountName: null, hypothesisId: already.hypothesis_id, enrollmentId: already.id };
  }

  const identity = await deps.resolveIdentity({ rawName: evidence.rawAccountName, hubspotCompanyId: evidence.hubspotCompanyId ?? null });
  if (!identity.ok) {
    return {
      ...base,
      outcome: identity.reason === 'ambiguous_identity' ? 'AMBIGUOUS' : 'IDENTITY_UNRESOLVED',
      accountName: null,
      hypothesisId: null,
      enrollmentId: null,
      detail: identity.reason,
    };
  }

  const hypothesis = await deps.findHypothesis(identity.accountName);
  if (!hypothesis) {
    return { ...base, outcome: 'HYPOTHESIS_MISSING', accountName: identity.accountName, hypothesisId: null, enrollmentId: null };
  }

  const enrollments = await deps.findEnrollments(identity.accountName, evidence.contactEmail.trim().toLowerCase());
  if (enrollments.length !== 1) {
    return {
      ...base,
      outcome: 'UNATTRIBUTED',
      accountName: identity.accountName,
      hypothesisId: hypothesis.id,
      enrollmentId: null,
      detail: enrollments.length === 0 ? 'no_enrollment_found' : `ambiguous_enrollments:${enrollments.length}`,
    };
  }

  return { ...base, outcome: 'MATCHED', accountName: identity.accountName, hypothesisId: hypothesis.id, enrollmentId: enrollments[0].id };
}

/** Classify a batch, tallied by outcome and (optionally) by engine. Never throws on one bad row: a thrown dep is reported as UNATTRIBUTED with the error as detail, so one bad piece of evidence never stops the batch. */
export async function reconcileBatch(evidence: readonly EngineEvidence[], deps: ReconcilerDeps): Promise<ReconcileResult[]> {
  const results: ReconcileResult[] = [];
  for (const one of evidence) {
    try {
      results.push(await reconcileOne(one, deps));
    } catch (err) {
      results.push({
        engine: one.engine,
        engineEventId: one.engineEventId,
        outcome: 'UNATTRIBUTED',
        accountName: null,
        hypothesisId: null,
        enrollmentId: null,
        detail: `reconcile_error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }
  return results;
}

export function tallyByOutcome(results: readonly ReconcileResult[]): Record<ReconcileOutcome, number> {
  const tally: Record<ReconcileOutcome, number> = {
    MATCHED: 0,
    ALREADY_IMPORTED: 0,
    UNATTRIBUTED: 0,
    IDENTITY_UNRESOLVED: 0,
    HYPOTHESIS_MISSING: 0,
    AMBIGUOUS: 0,
  };
  for (const r of results) tally[r.outcome] += 1;
  return tally;
}

export function tallyByEngine(results: readonly ReconcileResult[]): Record<string, Record<ReconcileOutcome, number>> {
  const out: Record<string, Record<ReconcileOutcome, number>> = {};
  for (const r of results) {
    out[r.engine] ??= { MATCHED: 0, ALREADY_IMPORTED: 0, UNATTRIBUTED: 0, IDENTITY_UNRESOLVED: 0, HYPOTHESIS_MISSING: 0, AMBIGUOUS: 0 };
    out[r.engine][r.outcome] += 1;
  }
  return out;
}
