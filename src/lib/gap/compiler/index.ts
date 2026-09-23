/**
 * GAP message compiler (Sprint 3, S3-T9): the check roster and the version
 * stamp. Spec section 8.
 *
 * `ALL_CHECKS` is groups A, B and C in CODE order, C01..C16, so a compile's
 * `checks[]` reads top to bottom the way the spec table does. The group
 * arrays keep their own file order (A: C01, C05, C10; B: C02, C03, C04, C06;
 * C: C07..C16); this file is the only place the sixteen are put in order.
 *
 * `COMPILER_VERSION` is stamped on every GapCompile row. Bump it whenever a
 * check, the verdict rule or the critic mapping changes, so a row can be read
 * against the rules that produced it.
 *
 * This module never imports the orchestrator (compile.ts imports from here),
 * so there is no import cycle. Consumers take `compile` from './compile'.
 */

import { checkObservationFirst, checkObservationUnsupported, checkProofUnsupported } from './checks/c01-evidence';
import { checkHypothesisAsFact, checkProspectRoiPredicted } from './checks/c02-hedge';
import { checkPrivateIntentExposed, checkProductLeads } from './checks/c04-product';
import { checkOneCta, checkOneProblem, checkStepLinks, checkSubjectForm, checkWordCount } from './checks/c07-structure';
import { checkBannedPhrases, checkVoiceWarn } from './checks/c11-banned';
import { checkFollowupNewInfo } from './checks/c12-newinfo';
import { checkClaims } from './checks/c13-claims';
import type { Check } from './types';

export type {
  Check,
  CheckResult,
  CheckSeverity,
  CheckSpan,
  CompileContext,
  CompileDraft,
  CompileEvidenceRef,
} from './types';
export type { ClaimsValidator, ClaimsValidationContext, ClaimsValidationResult } from './checks/c07-structure';

/** Bump on any change to a check, the verdict rule or the critic mapping. */
export const COMPILER_VERSION = 'gap-compiler.2026-09-23.1';

/** [code, check] pairs in code order. The single source of the roster. */
const ROSTER: ReadonlyArray<readonly [string, Check]> = [
  ['C01', checkObservationUnsupported],
  ['C02', checkHypothesisAsFact],
  ['C03', checkProspectRoiPredicted],
  ['C04', checkProductLeads],
  ['C05', checkProofUnsupported],
  ['C06', checkPrivateIntentExposed],
  ['C07', checkWordCount],
  ['C08', checkOneProblem],
  ['C09', checkOneCta],
  ['C10', checkObservationFirst],
  ['C11', checkBannedPhrases],
  ['C12', checkFollowupNewInfo],
  ['C13', checkClaims],
  ['C14', checkVoiceWarn],
  ['C15', checkSubjectForm],
  ['C16', checkStepLinks],
];

/** Every check, C01..C16. */
export const ALL_CHECKS: readonly Check[] = ROSTER.map(([, check]) => check);

/** The codes parallel to ALL_CHECKS. */
export const CHECK_CODES: readonly string[] = ROSTER.map(([code]) => code);

const CODE_BY_CHECK: WeakMap<Check, string> = new WeakMap(ROSTER.map(([code, check]) => [check, code]));

/**
 * The code a check emits, known without running it. A roster check answers
 * its code; anything else answers its function name, or `check_<index>` when
 * it is anonymous. The orchestrator uses this to label a check that threw.
 */
export function codeOfCheck(check: Check, index: number): string {
  const known = CODE_BY_CHECK.get(check);
  if (known) return known;
  const name = typeof check.name === 'string' ? check.name.trim() : '';
  return name.length > 0 ? name : `check_${index}`;
}
