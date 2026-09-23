import { describe, expect, it, vi } from 'vitest';

import type { ClaimsValidator } from '@/lib/gap/compiler/checks/c07-structure';
import { checkClaims, stepIsQuestion } from '@/lib/gap/compiler/checks/c13-claims';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

function ctxWith(contract: unknown): CompileContext {
  return {
    stepIndex: 0,
    hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'hidden_capacity' },
    evidence: [],
    priorStepBodies: [],
    contract,
  };
}

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';

const QUESTION_BODY = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

const OFFER_BODY = QUESTION_BODY.replace(
  'How many trailers sit past their appointment on a normal Tuesday?',
  'Happy to send the short version of the Primo scorecard.',
);

function draft(body: string): CompileDraft {
  return { subject: 'Ohio gate roles', body };
}

describe('C13 CLAIMS', () => {
  it('passes when no claims are used, without calling the validator', () => {
    const validateClaims = vi.fn<ClaimsValidator>(() => ({ ok: true }));
    const r = checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: [], validateClaims }));
    expect(r).toMatchObject({ code: 'C13', passed: true, severity: 'reject', detail: 'no claims used' });
    expect(validateClaims).not.toHaveBeenCalled();
    expect(checkClaims(draft(QUESTION_BODY), ctxWith(null)).passed).toBe(true);
  });

  it('is a review, never a reject, when claims are used and no validator is injected', () => {
    const r = checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: ['CR-001', 'CR-007'] }));
    expect(r).toMatchObject({ code: 'C13', passed: false, severity: 'review' });
    expect(r.detail).toBe('no validator: 2 claim id(s) unverified (CR-001, CR-007)');
  });

  it('calls the validator once with every id, the surface and stepIsQuestion from the CTA', () => {
    const validateClaims = vi.fn<ClaimsValidator>(() => ({ ok: true }));
    const r = checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: ['CR-001', 'CR-007'], validateClaims }));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('2 claim(s) validated (stepIsQuestion=true)');
    expect(validateClaims).toHaveBeenCalledTimes(1);
    expect(validateClaims).toHaveBeenCalledWith(['CR-001', 'CR-007'], { stepIsQuestion: true, surface: 'sales_email' });
  });

  it('reports stepIsQuestion=false when the CTA is an offer, not a question', () => {
    const validateClaims = vi.fn<ClaimsValidator>(() => ({ ok: true }));
    checkClaims(draft(OFFER_BODY), ctxWith({ claimsUsed: ['CR-001'], validateClaims }));
    expect(validateClaims).toHaveBeenCalledWith(['CR-001'], { stepIsQuestion: false, surface: 'sales_email' });
    expect(stepIsQuestion(QUESTION_BODY)).toBe(true);
    expect(stepIsQuestion(OFFER_BODY)).toBe(false);
    expect(stepIsQuestion('Hi Kara,\n\nNo ask here.\n\nCasey Larkin')).toBe(false);
  });

  it('rejects with the validator reason on a refusal', () => {
    const validateClaims: ClaimsValidator = () => ({ ok: false, reason: 'claim_needs_question:CR-012' });
    const r = checkClaims(draft(OFFER_BODY), ctxWith({ claimsUsed: ['CR-012'], validateClaims }));
    expect(r).toMatchObject({ code: 'C13', passed: false, severity: 'reject' });
    expect(r.detail).toBe('claim refused: claim_needs_question:CR-012 (claims CR-012; stepIsQuestion=false)');
  });

  it('attaches unnamedOnly ids to a passing detail', () => {
    const validateClaims: ClaimsValidator = () => ({ ok: true, unnamedOnly: ['CR-020', 'CR-021'] });
    const r = checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: ['CR-001', 'CR-020', 'CR-021'], validateClaims }));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe(
      '3 claim(s) validated (stepIsQuestion=true); unnamedOnly: CR-020, CR-021 (C05 enforces the innuendo)',
    );
  });

  it('is a review when the validator throws', () => {
    const validateClaims: ClaimsValidator = () => {
      throw new Error('snapshot missing');
    };
    const r = checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: ['CR-001'], validateClaims }));
    expect(r).toMatchObject({ code: 'C13', passed: false, severity: 'review' });
    expect(r.detail).toBe('validator threw: snapshot missing (CR-001)');
  });

  it('drops non-string ids from claimsUsed before validating', () => {
    const validateClaims = vi.fn<ClaimsValidator>(() => ({ ok: true }));
    checkClaims(draft(QUESTION_BODY), ctxWith({ claimsUsed: ['CR-001', 7, null, ''], validateClaims }));
    expect(validateClaims).toHaveBeenCalledWith(['CR-001'], expect.anything());
  });
});
