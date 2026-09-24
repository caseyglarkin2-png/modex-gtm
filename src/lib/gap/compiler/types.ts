/**
 * GAP message compiler: shared check types (Sprint 3). Spec section 8.
 *
 * Every check is a pure function of the draft and the compile context. Other
 * check groups import from here, so keep this file minimal and stable.
 */

export type CheckSeverity = 'reject' | 'review';

export interface CheckSpan {
  /** Offset into the draft body (or subject when the detail says so). */
  start: number;
  end: number;
  text: string;
}

export interface CheckResult {
  code: string;
  passed: boolean;
  severity: CheckSeverity;
  detail: string;
  span?: CheckSpan | null;
}

export interface CompileDraft {
  subject: string;
  body: string;
}

export interface CompileEvidenceRef {
  id: string;
  title: string;
  url: string | null;
  externalOk: boolean;
  fresh: boolean;
  superseded: boolean;
  firstParty: boolean;
  /** The source excerpt when the ledger carries one; C01 counts its numbers as cited (S3-T13). */
  excerpt?: string | null;
}

export interface CompileContext {
  stepIndex: number;
  hypothesis: { observation: string; problemHypothesis: string; problemFamily: string };
  evidence: CompileEvidenceRef[];
  priorStepBodies: string[];
  contract?: unknown | null;
}

export type Check = (draft: CompileDraft, ctx: CompileContext) => CheckResult;
