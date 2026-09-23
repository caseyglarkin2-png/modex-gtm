/**
 * GAP message compiler checks (Sprint 3, S3-T7): C02 HYPOTHESIS_AS_FACT and
 * C03 PROSPECT_ROI_PREDICTED. Spec section 8. Pure: no I/O.
 *
 * C02: the hypothesis paragraph carries a hedge token and no assertive
 * second-person claim outside a question. The observation paragraph is the
 * first paragraph carrying a `[[SRC:` or `[S:` marker; the hypothesis is the
 * paragraph after it, or the first paragraph when nothing is cited.
 *
 * C03: no sentence pairs a second-person reference with a money, percent or
 * payback token outside a question. Canon Primo proof ("48 to 24 minutes
 * measured", "about 5% observed", "$1M+ per site modeled") stays allowed as
 * long as the sentence is not second-person about the prospect.
 */

import { ASSERTIVE_PATTERNS, HEDGE_TOKENS } from '../../taxonomy';
import {
  bodyParagraphs,
  hasMarker,
  hasSecondPerson,
  isQuestion,
  sentenceSpans,
  spanOf,
  splitSentences,
  stripGreetingAndSignature,
} from '../text';
import type { Check } from '../types';

export const C02_CODE = 'C02';
export const C03_CODE = 'C03';

const ASSERTIVE_RES: readonly RegExp[] = ASSERTIVE_PATTERNS.map((p) => new RegExp(p, 'i'));

/** Money, percent or payback language. */
const ROI_TOKEN_RE = /\$\s?\d|\d+(?:\.\d+)?\s?%|\bpayback\b|\bROI\b|\bsav(?:e|es|ed|ing|ings)\b|\brecover\s+\$/i;

/** The hypothesis paragraph per the section 8 rule, or null when the body has none. */
export function findHypothesisParagraph(body: string): string | null {
  const paragraphs = bodyParagraphs(body);
  if (paragraphs.length === 0) return null;
  const observationIndex = paragraphs.findIndex(hasMarker);
  if (observationIndex === -1) return paragraphs[0];
  return paragraphs[observationIndex + 1] ?? null;
}

export function hasHedgeToken(text: string): boolean {
  const lower = text.toLowerCase();
  return HEDGE_TOKENS.some((token) => lower.includes(token));
}

export const checkHypothesisAsFact: Check = (draft) => {
  const paragraph = findHypothesisParagraph(draft.body);
  if (paragraph == null) {
    return {
      code: C02_CODE,
      passed: false,
      severity: 'reject',
      detail: 'no hypothesis paragraph: the body needs a paragraph after the cited observation',
      span: null,
    };
  }

  for (const { sentence, span } of sentenceSpans(draft.body, paragraph)) {
    if (isQuestion(sentence)) continue;
    const hit = ASSERTIVE_RES.find((re) => re.test(sentence));
    if (hit) {
      return {
        code: C02_CODE,
        passed: false,
        severity: 'reject',
        detail: `hypothesis stated as fact: "${sentence}" matches assertive pattern /${hit.source}/ outside a question`,
        span,
      };
    }
  }

  if (!hasHedgeToken(paragraph)) {
    return {
      code: C02_CODE,
      passed: false,
      severity: 'reject',
      detail: `hypothesis paragraph carries no hedge token (expected one of: ${HEDGE_TOKENS.map((t) => t.trim()).join(', ')})`,
      span: spanOf(draft.body, splitSentences(paragraph)[0] ?? paragraph),
    };
  }

  return { code: C02_CODE, passed: true, severity: 'reject', detail: 'hypothesis paragraph is hedged', span: null };
};

function roiViolation(sentence: string): boolean {
  return !isQuestion(sentence) && hasSecondPerson(sentence) && ROI_TOKEN_RE.test(sentence);
}

export const checkProspectRoiPredicted: Check = (draft) => {
  const subject = draft.subject.trim();
  if (subject.length > 0 && roiViolation(subject)) {
    return {
      code: C03_CODE,
      passed: false,
      severity: 'reject',
      detail: `subject predicts prospect ROI in second person: "${subject}"`,
      span: { start: 0, end: subject.length, text: subject },
    };
  }

  const content = stripGreetingAndSignature(draft.body);
  for (const { sentence, span } of sentenceSpans(draft.body, content)) {
    if (roiViolation(sentence)) {
      return {
        code: C03_CODE,
        passed: false,
        severity: 'reject',
        detail: `second person plus money, percent or payback outside a question: "${sentence}"`,
        span,
      };
    }
  }

  return { code: C03_CODE, passed: true, severity: 'reject', detail: 'no second-person ROI prediction', span: null };
};
