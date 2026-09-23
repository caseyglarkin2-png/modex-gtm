/**
 * GAP message compiler orchestrator (Sprint 3, S3-T9). Spec section 8.
 *
 * `compile()` runs every check in code order, consults the clawd critic only
 * when no check rejected, computes one verdict, persists a GapCompile row
 * when a prisma client is given, and audits `compile.result`. It has no send
 * path: nothing here imports email or queue send code, and a compile result
 * never sends anything. Sending stays behind the existing approval flow.
 *
 * Verdict rule (the only rule; the tests pin it structurally):
 *   any check reject                       -> reject   (critic not consulted)
 *   critic ok and critic reject            -> reject
 *   every check passed and critic ok pass  -> pass
 *   anything else                          -> review_required
 * "Anything else" covers a review-severity check, a check that threw
 * (`check_error:<message>`, recorded as a review, never a pass), a critic
 * review, and every critic failure: unreachable, timeout, non-2xx, malformed,
 * unconfigured, or a client that threw. A critic failure can never produce a
 * pass.
 *
 * Contract: `input.contract` is the loose object the checks already read
 * (`readProofContract` in c01-evidence.ts, `readGroupCContract` in
 * c07-structure.ts) plus two fields lifted onto the CheckContext:
 *   hypothesis  { observation, problemHypothesis, problemFamily }
 *   evidence    CompileEvidenceRef[]; a ref missing a flag reads fail-closed
 *               (not fresh, not external_ok, not first-party) so C01 rejects
 *               rather than trusting an unstated freshness.
 * The claims validator is injected through `deps.validateClaims`, never taken
 * from the request contract, so a caller cannot smuggle a permissive one in.
 *
 * Contract sanitising (R3-3): three keys can widen the gate, so the
 * orchestrator does not take them on trust from whoever built the contract:
 *   wordRange      honoured only on the Top100 adapter path (`createdBy`
 *                  starts with `compile-top100`, the only producer with a
 *                  lane-authored range) and then clamped inside the spec's
 *                  45..120; everywhere else it is dropped and C07 uses the
 *                  per-step defaults.
 *   journeyStage   honoured only when it is a cold sequence stage
 *                  (sequence_step_1, sequence_step_2_plus); any other stage
 *                  (meeting_prep reaches the CTA policy's meeting branch) is
 *                  dropped and the stage derives from stepIndex.
 *   top100Compile  the enroll-row gate's lookup key; persisted only on the
 *                  adapter path so a session compile can never masquerade as
 *                  a lane row.
 * `inputs_snapshot.contract` is the contract the checks actually saw (after
 * the drops), and `inputs_snapshot.ignoredContractKeys` lists what was
 * dropped, so a row can be read for what it judged. The route adds its own
 * allowlist in front of this (src/app/api/gap/compile/route.ts); this is the
 * floor for every programmatic caller.
 *
 * Audit: the local `gapAuditEvent` write is what tests assert. The war-room
 * review-feed fan-out (fire-and-forget inside audit()) fires only for a
 * `pass`, because a pass is the verdict that makes copy eligible to send and
 * therefore the one an operator may want to veto. Rejects and reviews stay in
 * the local ledger and, for reviews, in the SendApprovalRequest the route
 * creates (./approval.ts).
 */

import { getCtaPolicy, type CtaFamily } from '../../revops/cold-outbound-policy';
import { audit, type AuditResult } from '../audit';
import type { CriticClient, CriticScoreResult } from '../critic-client';
import type { postReviewLog } from '../review-feed';
import { SPEC_WORD_RANGE, findCtaSentences, journeyStageFor, type ClaimsValidator, type WordRange } from './checks/c07-structure';
import { markerIds } from './checks/c12-newinfo';
import { ALL_CHECKS, COMPILER_VERSION, codeOfCheck } from './index';
import { wordCount } from './text';
import type { Check, CheckResult, CompileContext, CompileDraft, CompileEvidenceRef } from './types';

export type CompileVerdict = 'pass' | 'review_required' | 'reject';

export interface CompileInput {
  hypothesisId?: string | null;
  sequenceVersionId?: string | null;
  draftQueueItemId?: number | null;
  stepIndex: number;
  subject: string;
  body: string;
  priorBodies: string[];
  /**
   * Prior steps' beside-the-body citation ids (the lane's `touches[].evidence_ids`),
   * index-aligned with `priorBodies`; copied onto the contract as `priorEvidenceIds`
   * for C12 when the contract does not already carry one (S3-T13).
   */
  priorEvidenceIds?: string[][];
  /** The loose check contract (see the header). Null or junk reads as empty. */
  contract: unknown;
  createdBy: string;
  /**
   * A template-level compile (R3-3): the version's template copy judged with
   * no hypothesis, so `hypothesisId` is null by construction. Recorded on the
   * snapshot as `template: true`; such rows are shadow-only evidence.
   */
  template?: boolean;
}

export type CompileCriticOutcome =
  | CriticScoreResult
  | { ok: false; reason: 'critic_skipped:check_reject' | `critic_threw:${string}` };

export interface CompileDeps {
  /** Defaults to ALL_CHECKS (C01..C16). Tests inject stubs. */
  checks?: readonly Check[];
  critic: CriticClient;
  /** The S3-T1 validator; absent means C13 reviews any claims used. */
  validateClaims?: ClaimsValidator | null;
  now?: () => Date;
  /** House `prisma: any` glue. Absent means nothing is persisted or audited. */
  prisma?: any;
  /** Review-feed poster handed to audit(); tests inject a stub. */
  postReview?: typeof postReviewLog;
}

export interface CompileResult {
  /** The GapCompile row id, present when prisma was given and the write succeeded. */
  id?: string;
  verdict: CompileVerdict;
  checks: CheckResult[];
  critic: CompileCriticOutcome;
  wordCount: number;
  ctaFamily: CtaFamily | null;
  allowedCtaFamily: CtaFamily;
  evidenceIdsUsed: string[];
  compilerVersion: string;
  hypothesisId: string | null;
  stepIndex: number;
  audit?: AuditResult;
  /** Set when prisma was given and the GapCompile write failed; the verdict still stands. */
  persistError?: string;
}

// ---------------------------------------------------------------------------
// Contract reading
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function bool(value: unknown): boolean {
  return value === true;
}

/** Evidence refs with fail-closed defaults: an unstated flag is false. */
export function readEvidenceRefs(raw: unknown): CompileEvidenceRef[] {
  if (!Array.isArray(raw)) return [];
  const out: CompileEvidenceRef[] = [];
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.id !== 'string' || entry.id.length === 0) continue;
    out.push({
      id: entry.id,
      title: str(entry.title),
      url: typeof entry.url === 'string' ? entry.url : null,
      externalOk: bool(entry.externalOk),
      fresh: bool(entry.fresh),
      superseded: bool(entry.superseded),
      firstParty: bool(entry.firstParty),
      ...(typeof entry.excerpt === 'string' && entry.excerpt.length > 0 ? { excerpt: entry.excerpt } : {}),
    });
  }
  return out;
}

/** The only producer whose contract may carry a lane word range and the Top100 lookup key. */
export const ADAPTER_CREATED_BY_PREFIX = 'compile-top100';

export function isAdapterPath(createdBy: string): boolean {
  return typeof createdBy === 'string' && createdBy.startsWith(ADAPTER_CREATED_BY_PREFIX);
}

/** Journey stages a contract may name; anything else derives from stepIndex. */
const COLD_SEQUENCE_STAGES: ReadonlySet<string> = new Set(['sequence_step_1', 'sequence_step_2_plus']);

/** The contract key the Top100 adapter writes and the enroll-row gate reads back (import/top100-compile.ts). */
const TOP100_COMPILE_KEY = 'top100Compile';

/** Clamp a lane range inside the spec's outer bound; null when it is not a usable range. */
export function clampWordRange(raw: unknown): WordRange | null {
  if (!isRecord(raw)) return null;
  const { min, max } = raw;
  if (typeof min !== 'number' || typeof max !== 'number' || !Number.isFinite(min) || !Number.isFinite(max) || min > max) return null;
  const clamped = { min: Math.max(min, SPEC_WORD_RANGE.min), max: Math.min(max, SPEC_WORD_RANGE.max) };
  return clamped.min <= clamped.max ? clamped : null;
}

interface SanitizedContract {
  /** The contract the checks see and the row persists (hypothesis and evidence included). */
  contract: Record<string, unknown>;
  /** Keys dropped because the producer may not set them. */
  ignored: string[];
}

/** Apply the R3-3 rules (see the header). Never throws on junk. */
export function sanitizeContract(raw: unknown, createdBy: string): SanitizedContract {
  const source = isRecord(raw) ? raw : {};
  const contract: Record<string, unknown> = { ...source };
  const ignored: string[] = [];
  const adapter = isAdapterPath(createdBy);

  if ('validateClaims' in contract) {
    delete contract.validateClaims;
    ignored.push('validateClaims');
  }
  if ('wordRange' in contract) {
    const clamped = adapter ? clampWordRange(contract.wordRange) : null;
    if (clamped) contract.wordRange = clamped;
    else {
      delete contract.wordRange;
      ignored.push('wordRange');
    }
  }
  if ('journeyStage' in contract && !(typeof contract.journeyStage === 'string' && COLD_SEQUENCE_STAGES.has(contract.journeyStage))) {
    delete contract.journeyStage;
    ignored.push('journeyStage');
  }
  if (TOP100_COMPILE_KEY in contract && !adapter) {
    delete contract[TOP100_COMPILE_KEY];
    ignored.push(TOP100_COMPILE_KEY);
  }
  return { contract, ignored };
}

function buildContext(
  input: CompileInput,
  sanitized: Record<string, unknown>,
  validateClaims: ClaimsValidator | null | undefined,
): CompileContext {
  const hyp = isRecord(sanitized.hypothesis) ? sanitized.hypothesis : {};
  const { hypothesis: _hypothesis, evidence: _evidence, ...rest } = sanitized;
  void _hypothesis;
  void _evidence;
  const contract: Record<string, unknown> = { ...rest };
  if (validateClaims) contract.validateClaims = validateClaims;
  if (Array.isArray(input.priorEvidenceIds) && !Array.isArray(contract.priorEvidenceIds)) {
    contract.priorEvidenceIds = input.priorEvidenceIds;
  }
  return {
    stepIndex: input.stepIndex,
    hypothesis: {
      observation: str(hyp.observation),
      problemHypothesis: str(hyp.problemHypothesis),
      problemFamily: str(hyp.problemFamily) || 'unmapped',
    },
    evidence: readEvidenceRefs(sanitized.evidence),
    priorStepBodies: Array.isArray(input.priorBodies) ? input.priorBodies.filter((b): b is string => typeof b === 'string') : [],
    contract,
  };
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Run every check; a throwing check is a review-severity failure, never a pass. */
export function runChecks(checks: readonly Check[], draft: CompileDraft, ctx: CompileContext): CheckResult[] {
  return checks.map((check, index) => {
    try {
      return check(draft, ctx);
    } catch (error) {
      return {
        code: codeOfCheck(check, index),
        passed: false,
        severity: 'review',
        detail: `check_error:${errorMessage(error)}`,
        span: null,
      };
    }
  });
}

/** JSON round trip: drops functions and undefined so a row never carries a validator. */
function toJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---------------------------------------------------------------------------
// compile
// ---------------------------------------------------------------------------

export async function compile(input: CompileInput, deps: CompileDeps): Promise<CompileResult> {
  const checks = deps.checks ?? ALL_CHECKS;
  const now = deps.now ?? (() => new Date());
  const draft: CompileDraft = { subject: input.subject, body: input.body };
  const sanitized = sanitizeContract(input.contract, input.createdBy);
  const ctx = buildContext(input, sanitized.contract, deps.validateClaims);

  const results = runChecks(checks, draft, ctx);
  const anyReject = results.some((r) => !r.passed && r.severity === 'reject');
  const anyReview = results.some((r) => !r.passed && r.severity === 'review');

  // A check reject is final: the critic is not consulted (save the call).
  let critic: CompileCriticOutcome;
  if (anyReject) {
    critic = { ok: false, reason: 'critic_skipped:check_reject' };
  } else {
    try {
      critic = await deps.critic.score({ subject: input.subject, body: input.body, type: 'cold_email' });
    } catch (error) {
      critic = { ok: false, reason: `critic_threw:${errorMessage(error)}` };
    }
  }

  let verdict: CompileVerdict = 'review_required';
  const checksClean = !anyReject && !anyReview;
  const criticPassed = critic.ok === true && critic.verdict === 'pass';
  if (anyReject || (critic.ok === true && critic.verdict === 'reject')) {
    verdict = 'reject';
  } else if (checksClean && criticPassed) {
    verdict = 'pass';
  }

  const cta = findCtaSentences(input.body)[0] ?? null;
  const allowedCtaFamily = getCtaPolicy('outreach_sequence', journeyStageFor(ctx)).allowedFamily;
  const result: CompileResult = {
    verdict,
    checks: results,
    critic,
    wordCount: wordCount(input.body),
    ctaFamily: cta ? cta.family : null,
    allowedCtaFamily,
    evidenceIdsUsed: markerIds(input.body),
    compilerVersion: COMPILER_VERSION,
    hypothesisId: input.hypothesisId ?? null,
    stepIndex: input.stepIndex,
  };

  if (!deps.prisma) return result;

  const prisma = deps.prisma;
  const inputsSnapshot = toJson({
    hypothesisId: input.hypothesisId ?? null,
    sequenceVersionId: input.sequenceVersionId ?? null,
    draftQueueItemId: input.draftQueueItemId ?? null,
    stepIndex: input.stepIndex,
    subject: input.subject,
    body: input.body,
    priorBodies: ctx.priorStepBodies,
    contract: isRecord(input.contract) ? sanitized.contract : null,
    ...(sanitized.ignored.length > 0 ? { ignoredContractKeys: sanitized.ignored } : {}),
    ...(input.template === true ? { template: true } : {}),
    createdBy: input.createdBy,
    compiledAt: now().toISOString(),
  });

  try {
    const row = await prisma.gapCompile.create({
      data: {
        hypothesis_id: input.hypothesisId ?? null,
        sequence_version_id: input.sequenceVersionId ?? null,
        draft_queue_item_id: input.draftQueueItemId ?? null,
        step_index: input.stepIndex,
        verdict,
        checks: toJson(results),
        word_count: result.wordCount,
        cta_family: result.ctaFamily,
        evidence_ids_used: result.evidenceIdsUsed,
        compiler_version: COMPILER_VERSION,
        critic: toJson(critic),
        inputs_snapshot: inputsSnapshot,
        result: toJson(result),
        created_by: input.createdBy,
      },
      select: { id: true },
    });
    result.id = row.id;
  } catch (error) {
    result.persistError = errorMessage(error);
  }

  const failedChecks = results.filter((r) => !r.passed).map((r) => r.code);
  const target = input.hypothesisId ?? (input.draftQueueItemId != null ? `draft_queue_item:${input.draftQueueItemId}` : 'unlinked');
  result.audit = await audit(
    prisma,
    {
      kind: 'compile.result',
      actor: input.createdBy,
      subjectType: 'gap_compile',
      subjectId: result.id ?? 'unsaved',
      payload: {
        verdict,
        hypothesisId: input.hypothesisId ?? null,
        sequenceVersionId: input.sequenceVersionId ?? null,
        draftQueueItemId: input.draftQueueItemId ?? null,
        stepIndex: input.stepIndex,
        compilerVersion: COMPILER_VERSION,
        failedChecks,
        critic: critic.ok ? { ok: true, verdict: critic.verdict, score: critic.score } : critic,
        ...(result.persistError ? { persistError: result.persistError } : {}),
      },
      ...(verdict === 'pass'
        ? {
            review: {
              target,
              title: `compile pass: step ${input.stepIndex} "${input.subject}"`,
              intent: 'every deterministic check and the clawd critic passed; this copy is now eligible for the approval flow',
              ...(result.id ? { rollbackRef: `gap_compile:${result.id}` } : {}),
            },
          }
        : {}),
    },
    deps.postReview ? { postReview: deps.postReview } : {},
  );

  return result;
}
