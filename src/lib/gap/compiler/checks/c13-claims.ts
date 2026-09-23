/**
 * GAP message compiler check (Sprint 3, S3-T8): C13 CLAIMS. Spec section 8.
 * Pure: no I/O, and no import of the claims module. The S3-T1 validator is
 * injected through the contract:
 *
 *   ctx.contract.claimsUsed: string[]
 *   ctx.contract.validateClaims: (ids, { stepIsQuestion, surface: 'sales_email' })
 *       -> { ok: true; unnamedOnly?: string[] } | { ok: false; reason: string }
 *
 * `stepIsQuestion` is whether the body's CTA sentence (C09's finder) is a
 * question. A refusal rejects with the validator's reason. `unnamedOnly` ids are
 * attached to the detail; C05 enforces the innuendo rule for them. No claims used
 * passes. Claims used with no validator, or a validator that throws, is a review
 * (never a pass, never a reject): the ids are unverified, not wrong.
 */

import { isQuestion } from '../text';
import type { Check } from '../types';
import {
  checkOneCta,
  checkOneProblem,
  checkStepLinks,
  checkSubjectForm,
  checkWordCount,
  findCtaSentences,
  readGroupCContract,
} from './c07-structure';
import { checkBannedPhrases, checkVoiceWarn } from './c11-banned';
import { checkFollowupNewInfo } from './c12-newinfo';

export const C13_CODE = 'C13';

export function stepIsQuestion(body: string): boolean {
  const [cta] = findCtaSentences(body);
  return cta ? isQuestion(cta.sentence) : false;
}

export const checkClaims: Check = (draft, ctx) => {
  const contract = readGroupCContract(ctx);
  const ids = contract.claimsUsed ?? [];

  if (ids.length === 0) {
    return { code: C13_CODE, passed: true, severity: 'reject', detail: 'no claims used', span: null };
  }
  if (!contract.validateClaims) {
    return {
      code: C13_CODE,
      passed: false,
      severity: 'review',
      detail: `no validator: ${ids.length} claim id(s) unverified (${ids.join(', ')})`,
      span: null,
    };
  }

  const question = stepIsQuestion(draft.body);
  let result;
  try {
    result = contract.validateClaims(ids, { stepIsQuestion: question, surface: 'sales_email' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      code: C13_CODE,
      passed: false,
      severity: 'review',
      detail: `validator threw: ${message} (${ids.join(', ')})`,
      span: null,
    };
  }

  if (!result.ok) {
    return {
      code: C13_CODE,
      passed: false,
      severity: 'reject',
      detail: `claim refused: ${result.reason} (claims ${ids.join(', ')}; stepIsQuestion=${question})`,
      span: null,
    };
  }

  const unnamed = result.unnamedOnly ?? [];
  const suffix = unnamed.length > 0 ? `; unnamedOnly: ${unnamed.join(', ')} (C05 enforces the innuendo)` : '';
  return {
    code: C13_CODE,
    passed: true,
    severity: 'reject',
    detail: `${ids.length} claim(s) validated (stepIsQuestion=${question})${suffix}`,
    span: null,
  };
};

/** Group C in check-code order: C07, C08, C09, C11, C12, C13, C14, C15, C16. */
export const GROUP_C_CHECKS: Check[] = [
  checkWordCount,
  checkOneProblem,
  checkOneCta,
  checkBannedPhrases,
  checkFollowupNewInfo,
  checkClaims,
  checkVoiceWarn,
  checkSubjectForm,
  checkStepLinks,
];
