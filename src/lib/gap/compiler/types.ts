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
  /** I06: usable (not ended, closed, undated or superseded). Absent reads as usable; `fresh` is the label beside it. */
  usable?: boolean;
  /** I06: when the fact was observed (ISO); a historical ref is citable only when the copy states this date. */
  observedAt?: string | null;
  superseded: boolean;
  firstParty: boolean;
  /** The source excerpt when the ledger carries one; C01 counts its numbers as cited (S3-T13). */
  excerpt?: string | null;
  /**
   * Red team T6: the signal quotes nothing (an auto-ingested keyword hit). It
   * may trigger research, never be cited: externalOk is forced false.
   */
  keywordOnly?: boolean;
}

export interface CompileContext {
  stepIndex: number;
  hypothesis: { observation: string; problemHypothesis: string; problemFamily: string };
  evidence: CompileEvidenceRef[];
  priorStepBodies: string[];
  contract?: unknown | null;
}

export type Check = (draft: CompileDraft, ctx: CompileContext) => CheckResult;
