import { describe, expect, it, vi } from 'vitest';

import type { ClaimsValidator } from '@/lib/gap/compiler/checks/c07-structure';
import { checkClaims, forbiddenClaimPhrases, stepIsQuestion } from '@/lib/gap/compiler/checks/c13-claims';
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

// ---------------------------------------------------------------------------
// N1: the body is scanned for DO_NOT_USE and INTERNAL_ONLY text whether or not
// the claim is declared. Before this, a body carrying CR-029's banned phrasing
// with claimsUsed [] passed C13.
// ---------------------------------------------------------------------------

describe('C13 forbidden claim text (N1)', () => {
  const HYP = 'My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where.';
  const withHypothesis = (sentence: string) => QUESTION_BODY.replace(HYP, `${HYP} ${sentence}`);

  it('exposes the scanned phrases from the committed snapshot, CR-029 included', () => {
    const entries = forbiddenClaimPhrases();
    const cr029 = entries.find((e) => e.id === 'CR-029');
    expect(cr029).toBeDefined();
    expect(cr029!.status).toBe('DO_NOT_USE');
    expect(cr029!.phrases).toEqual(expect.arrayContaining(['not a YMS', 'coexist', 'layer above', 'not a replacement', 'not displacement']));
    expect(entries.every((e) => e.status === 'DO_NOT_USE' || e.status === 'INTERNAL_ONLY')).toBe(true);
    expect(entries.some((e) => e.id === 'CR-001')).toBe(false);
  });

  it("rejects CR-029's phrasing in the body with claimsUsed [] and names the id, the phrase and the surface", () => {
    const body = withHypothesis('YardFlow is not a YMS, it runs beside the one you have.');
    const r = checkClaims(draft(body), ctxWith({ claimsUsed: [] }));
    expect(r).toMatchObject({ code: 'C13', passed: false, severity: 'reject' });
    expect(r.detail).toBe('claim_text_forbidden:CR-029 (DO_NOT_USE phrasing "not a YMS" in the body)');
    expect(r.span?.text).toBe('not a YMS');
    expect(body.slice(r.span!.start, r.span!.end)).toBe('not a YMS');
  });

  it('matches whole phrases after normalising case, spacing and curly quotes, and the inflected single-word form', () => {
    expect(checkClaims(draft(withHypothesis('It is NOT A  YMS.')), ctxWith(null)).detail).toContain('claim_text_forbidden:CR-029');
    expect(checkClaims(draft(withHypothesis('It coexists with your YMS.')), ctxWith(null)).detail).toContain('claim_text_forbidden:CR-029');
    expect(checkClaims(draft(withHypothesis('Think of it as a layer above the YMS.')), ctxWith(null)).detail).toContain(
      'claim_text_forbidden:CR-029',
    );
  });

  it('scans the subject too', () => {
    const r = checkClaims({ subject: 'A layer above your YMS', body: QUESTION_BODY }, ctxWith(null));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('claim_text_forbidden:CR-029 (DO_NOT_USE phrasing "layer above" in the subject)');
  });

  it("rejects an INTERNAL_ONLY claim's canonical text (CR-017) and a DO_NOT_USE figure (CR-024)", () => {
    const cr017 = forbiddenClaimPhrases().find((e) => e.id === 'CR-017')!;
    const canonical = cr017.phrases[0];
    const r = checkClaims(draft(withHypothesis(canonical)), ctxWith(null));
    expect(r.detail).toMatch(/^claim_text_forbidden:CR-017 \(INTERNAL_ONLY phrasing /);
    const figure = checkClaims(draft(withHypothesis('The cost of inaction is $70,363 a month.')), ctxWith(null));
    expect(figure.detail).toBe('claim_text_forbidden:CR-024 (DO_NOT_USE phrasing "$70,363" in the body)');
  });

  it('runs before the declared-id validation, so a passing validator cannot launder banned text', () => {
    const validateClaims = vi.fn<ClaimsValidator>(() => ({ ok: true }));
    const r = checkClaims(draft(withHypothesis('It is not a replacement for your YMS.')), ctxWith({ claimsUsed: ['CR-001'], validateClaims }));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('claim_text_forbidden:CR-029');
    expect(validateClaims).not.toHaveBeenCalled();
  });

  it('passes ordinary language that shares words with a banned phrase', () => {
    for (const sentence of [
      'The lot sits a level above the dock.',
      'Every yard runs its own YMS today.',
      'Displacement of the clerk role is the question.',
    ]) {
      expect(checkClaims(draft(withHypothesis(sentence)), ctxWith(null)).passed, sentence).toBe(true);
    }
  });
});
