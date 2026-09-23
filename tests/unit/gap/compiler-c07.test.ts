import { describe, expect, it } from 'vitest';

import {
  checkOneCta,
  checkOneProblem,
  checkStepLinks,
  checkSubjectForm,
  checkWordCount,
  classifyCtaFamily,
  readGroupCContract,
} from '@/lib/gap/compiler/checks/c07-structure';
import { wordCount } from '@/lib/gap/compiler/text';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

function ctxAt(stepIndex: number, contract: unknown = null, priorStepBodies: string[] = []): CompileContext {
  return {
    stepIndex,
    hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'hidden_capacity' },
    evidence: [],
    priorStepBodies,
    contract,
  };
}

function draft(body: string, subject = 'Ohio gate roles'): CompileDraft {
  return { subject, body };
}

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';

/** 60 words, one diagnostic question, one family. */
const STEP0 = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where. The lot usually loses that argument, and the clerk becomes the reconciliation.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

/** 54 words, one asset offer. */
const STEP1 = `Kara,

Your Q2 call flagged a second Ohio building coming online next spring [[SRC:ev_2]]. Same carriers, same gate design, twice the inbound.

My guess is the clerk model does not scale to two lots; the reconciliation cost doubles with the doors.

Worth sending over the short version of how a peer network handled the second building?

${SIGN}`;

const FILLER = 'The lot loses the argument and the clerk carries the reconciliation every single shift of the year.';

function bodyOfWords(target: number): string {
  const words: string[] = [];
  while (words.length < target) words.push(...FILLER.split(' '));
  return `Hi Kara,\n\n${words.slice(0, target).join(' ')}\n\n${SIGN}`;
}

describe('C07 WORD_COUNT', () => {
  it('passes a 60-word step 0 body and states the count and range', () => {
    const r = checkWordCount(draft(STEP0), ctxAt(0));
    expect(r).toMatchObject({ code: 'C07', passed: true, severity: 'reject' });
    expect(wordCount(STEP0)).toBe(60);
    expect(r.detail).toBe('60 words, within 45..80 for step 0');
  });

  it('rejects a short step 0 body with the count and the 45..80 range', () => {
    const body = bodyOfWords(20);
    const r = checkWordCount(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('20 words, outside 45..80 for step 0');
  });

  it('uses 40..100 after step 0: 90 words fails step 0 and passes step 2', () => {
    const body = bodyOfWords(90);
    expect(checkWordCount(draft(body), ctxAt(0)).detail).toBe('90 words, outside 45..80 for step 0');
    expect(checkWordCount(draft(body), ctxAt(2)).detail).toBe('90 words, within 40..100 for step 2');
  });

  it('honours a contract wordRange override (the spec outer bound 45..120)', () => {
    const body = bodyOfWords(110);
    expect(checkWordCount(draft(body), ctxAt(2)).passed).toBe(false);
    const r = checkWordCount(draft(body), ctxAt(2, { wordRange: { min: 45, max: 120 } }));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('110 words, within 45..120 for step 2');
  });

  it('ignores a malformed wordRange', () => {
    expect(readGroupCContract(ctxAt(0, { wordRange: { min: 'a', max: 9 } })).wordRange).toBeUndefined();
    expect(readGroupCContract(ctxAt(0, { wordRange: { min: 50, max: 10 } })).wordRange).toBeUndefined();
    expect(readGroupCContract(ctxAt(0, 'junk')).wordRange).toBeUndefined();
  });
});

describe('C08 ONE_PROBLEM', () => {
  it('rejects a body with two families at two or more hits each and names both with counts', () => {
    const body = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Detention on inbound carriers ran higher in the same quarter, and detention is where the gate shows up in the freight bill.

My guess is the gate waits and the carrier accessorial charges are the same problem seen from two desks, with the capacity loss landing on the dock.

How many detention disputes reach your desk in a month?

${SIGN}`;
    const r = checkOneProblem(draft(body), ctxAt(0));
    expect(r).toMatchObject({ code: 'C08', passed: false, severity: 'reject' });
    expect(r.detail).toBe('two problem families in one body: cost_to_ship (6 hits) and hidden_capacity (4 hits)');
  });

  it('passes a single-family body and names the family', () => {
    const r = checkOneProblem(draft(STEP0), ctxAt(0));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('one problem family: hidden_capacity (1 hits)');
  });

  it('tolerates a one-hit secondary family', () => {
    const r = checkOneProblem(draft(STEP1), ctxAt(1));
    expect(r.passed).toBe(true);
  });

  it('passes a body with no cues at all', () => {
    const r = checkOneProblem(draft('Hi Kara,\n\nA plain note with nothing in it.\n\nCasey Larkin'), ctxAt(0));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('no family cues');
  });
});

describe('C09 ONE_CTA', () => {
  it('passes one diagnostic question at step 0 as scorecard_reply', () => {
    const r = checkOneCta(draft(STEP0), ctxAt(0));
    expect(r).toMatchObject({ code: 'C09', passed: true, severity: 'reject' });
    expect(r.detail).toBe('one CTA (scorecard_reply): "How many trailers sit past their appointment on a normal Tuesday?"');
    expect(STEP0.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
  });

  it('rejects a meeting request before a meeting', () => {
    const body = STEP0.replace(
      'How many trailers sit past their appointment on a normal Tuesday?',
      'Could we find 15 minutes next week?',
    );
    const r = checkOneCta(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'CTA family meeting_request is disallowed before a meeting (step 0, sequence_step_1): "Could we find 15 minutes next week?"',
    );
    expect(r.span?.text).toBe('Could we find 15 minutes next week?');
  });

  it('rejects a meeting request at a later step too', () => {
    const body = STEP1.replace(
      'Worth sending over the short version of how a peer network handled the second building?',
      'Open to a quick call on the second building?',
    );
    const r = checkOneCta(draft(body), ctxAt(2));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('meeting_request is disallowed before a meeting (step 2, sequence_step_2_plus)');
  });

  it('rejects two questions and lists both', () => {
    const body = STEP0.replace('Two of them are night shift.', 'Are two of them night shift?');
    const r = checkOneCta(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      '2 CTAs, expected one: "Are two of them night shift?" | "How many trailers sit past their appointment on a normal Tuesday?"',
    );
  });

  it('rejects a body with no CTA', () => {
    const body = STEP0.replace('How many trailers sit past their appointment on a normal Tuesday?', 'Trailers sit past their appointment.');
    const r = checkOneCta(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('no CTA: expected exactly one scorecard_reply sentence for step 0 (sequence_step_1)');
  });

  it('passes an asset offer at step 1 and rejects it at step 0', () => {
    const later = checkOneCta(draft(STEP1), ctxAt(1));
    expect(later.passed).toBe(true);
    expect(later.detail).toContain('one CTA (asset_offer)');

    const early = checkOneCta(draft(STEP1), ctxAt(0));
    expect(early.passed).toBe(false);
    expect(early.detail).toContain('CTA family asset_offer is not the allowed scorecard_reply for step 0 (sequence_step_1)');
  });

  it('accepts a diagnostic question at step 1 even though the policy prefers an asset offer', () => {
    const r = checkOneCta(draft(STEP0), ctxAt(1));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe(
      'one CTA (scorecard_reply, a gap question is accepted at any pre-meeting stage): "How many trailers sit past their appointment on a normal Tuesday?"',
    );
  });

  it('still rejects a meeting request at step 2', () => {
    const body = STEP1.replace(
      'Worth sending over the short version of how a peer network handled the second building?',
      'Could we find 15 minutes next week?',
    );
    const r = checkOneCta(draft(body), ctxAt(2));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'CTA family meeting_request is disallowed before a meeting (step 2, sequence_step_2_plus): "Could we find 15 minutes next week?"',
    );
  });

  it('classifies the policy scorecard_reply phrases as scorecard_reply and passes them at step 0', () => {
    for (const phrase of [
      "Reply and I'll send the short version.",
      `Reply and I${String.fromCharCode(0x2019)}ll send the short version.`,
      'Worth sending over the yard-network scorecard?',
      'If useful, I can send the 1-page scorecard.',
    ]) {
      expect(classifyCtaFamily(phrase), phrase).toBe('scorecard_reply');
      const body = STEP0.replace('How many trailers sit past their appointment on a normal Tuesday?', phrase);
      const r = checkOneCta(draft(body), ctxAt(0));
      expect(r.passed, phrase).toBe(true);
      expect(r.detail).toBe(`one CTA (scorecard_reply): "${phrase}"`);
    }
    expect(classifyCtaFamily('Worth sending over the short version?')).toBe('asset_offer');
  });

  it('classifies a bare "let me know" as light_reaction and rejects it', () => {
    expect(classifyCtaFamily('Let me know.')).toBe('light_reaction');
    const body = STEP0.replace('How many trailers sit past their appointment on a normal Tuesday?', 'Let me know.');
    const r = checkOneCta(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('CTA family light_reaction is not the allowed scorecard_reply');
  });

  it('allows a meeting request only when the contract stage is meeting_prep', () => {
    const body = STEP0.replace(
      'How many trailers sit past their appointment on a normal Tuesday?',
      'Could we find 15 minutes next week?',
    );
    const r = checkOneCta(draft(body), ctxAt(0, { journeyStage: 'meeting_prep' }));
    expect(r.passed).toBe(true);
    expect(r.detail).toContain('one CTA (meeting_request)');
  });
});

describe('C15 SUBJECT_FORM', () => {
  it('passes a sentence-case subject of 2..7 words', () => {
    const r = checkSubjectForm(draft(STEP0, 'Ohio gate roles'), ctxAt(0));
    expect(r).toMatchObject({ code: 'C15', passed: true, severity: 'review' });
  });

  it('flags Title Case', () => {
    const r = checkSubjectForm(draft(STEP0, 'Ohio Gate Roles'), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('review');
    expect(r.detail).toContain('Title Case');
  });

  it('flags a stray capital the body writes in lowercase', () => {
    const r = checkSubjectForm(draft(STEP0, 'Ohio gate Roles'), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('stray capital: Roles');
    expect(r.detail).not.toContain('Title Case');
  });

  it('flags one word, eight words, a reply prefix, an em dash and a lowercase start', () => {
    const emDash = String.fromCharCode(0x2014);
    expect(checkSubjectForm(draft(STEP0, 'Ohio'), ctxAt(0)).detail).toContain('1 words, expected 2..7');
    expect(checkSubjectForm(draft(STEP0, 'one two three four five six seven eight'), ctxAt(0)).detail).toContain(
      '8 words, expected 2..7',
    );
    expect(checkSubjectForm(draft(STEP0, 'Re: Ohio gate roles'), ctxAt(0)).detail).toContain('reply or forward prefix');
    expect(checkSubjectForm(draft(STEP0, 'Fwd: Ohio gate roles'), ctxAt(0)).detail).toContain('reply or forward prefix');
    expect(checkSubjectForm(draft(STEP0, `Ohio ${emDash} gate roles`), ctxAt(0)).detail).toContain('em dash');
    expect(checkSubjectForm(draft(STEP0, 'ohio gate roles'), ctxAt(0)).detail).toContain('first character is not a capital');
  });

  it('accepts a subject that opens on a number', () => {
    expect(checkSubjectForm(draft(STEP0, '48 to 24 at the gate'), ctxAt(0)).passed).toBe(true);
  });
});

describe('C16 STEP_LINKS', () => {
  const PROOF = 'https://yardflow.ai/proof/';
  const withLink = (url: string) =>
    STEP1.replace('Worth sending over the short version', `Worth a look at the short version (${url})`);

  it('rejects any link at step 0', () => {
    const body = STEP0.replace('Two of them are night shift.', `Two of them are night shift (${PROOF}).`);
    const r = checkStepLinks(draft(body), ctxAt(0));
    expect(r).toMatchObject({ code: 'C16', passed: false, severity: 'reject' });
    expect(r.detail).toBe(`link in step 0: ${PROOF}`);
    expect(r.span?.text).toBe(PROOF);
  });

  it('rejects an image reference at step 0', () => {
    const body = STEP0.replace('Two of them are night shift.', 'Two of them are night shift. ![gate](gate.png)');
    const r = checkStepLinks(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('image reference in the body');
  });

  it('allows the three approved pages at the last step, with or without the trailing slash', () => {
    const last = { stepCount: 4 };
    for (const url of [
      PROOF,
      'https://yardflow.ai/proof',
      'https://yardflow.ai/order-of-operations/',
      'https://www.yardflow.ai/roi',
    ]) {
      const r = checkStepLinks(draft(withLink(url)), ctxAt(3, last));
      expect(r.passed, url).toBe(true);
      expect(r.detail).toBe('1 allowlisted link(s) at the last step');
    }
  });

  it('rejects an off-allowlist link at the last step', () => {
    const r = checkStepLinks(draft(withLink('https://yardflow.ai/for/acme/')), ctxAt(3, { stepCount: 4 }));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('link off the allowlist (last step): https://yardflow.ai/for/acme/');
    expect(checkStepLinks(draft(withLink('https://example.com/x')), ctxAt(3, { isLastStep: true })).passed).toBe(false);
  });

  it('rejects any link on a middle step when the position is known', () => {
    const r = checkStepLinks(draft(withLink(PROOF)), ctxAt(1, { stepCount: 4 }));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(`link outside the last step (step 1): ${PROOF}`);
  });

  it('applies the allowlist when the step position is unknown', () => {
    expect(checkStepLinks(draft(withLink(PROOF)), ctxAt(2)).passed).toBe(true);
    const r = checkStepLinks(draft(withLink('https://example.com/x')), ctxAt(2));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('step position unknown, allowlist applied');
  });

  it('rejects a bare URL as the last token before the signature', () => {
    const body = STEP1.replace(
      'Worth sending over the short version of how a peer network handled the second building?',
      `Worth a look at the short version? ${PROOF}`,
    );
    const r = checkStepLinks(draft(body), ctxAt(3, { stepCount: 4 }));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(`bare URL as the last token: ${PROOF}`);
  });

  it('passes a body with no links', () => {
    expect(checkStepLinks(draft(STEP0), ctxAt(0))).toMatchObject({ passed: true, detail: 'no links' });
  });
});
