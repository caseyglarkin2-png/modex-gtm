/**
 * GAP message compiler checks (Sprint 3, S3-T7): C04 PRODUCT_LEADS and
 * C06 PRIVATE_INTENT_EXPOSED. Spec section 8. Pure: no I/O.
 *
 * C04 (step 0 only): the first sentence of the body, after any greeting line,
 * must not name the product or open with "we help" language. The signature
 * ("Casey Larkin, YardFlow by FreightRoll") is never the first sentence.
 *
 * C06: subject and body must not reveal first-party intent. Reuses the
 * routing explain tripwire patterns and adds copy-specific phrasings.
 * Ordinary language ("the plant opened in 2024", "with the intention of",
 * "we downloaded the 10-K") must pass.
 */

import { FORBIDDEN_EXPLAIN_PATTERNS, type ForbiddenExplainPattern } from '../../routing/explain';
import { firstBodySentence, spanOf, stripMarkers } from '../text';
import type { Check, CheckSpan } from '../types';
import { checkHypothesisAsFact, checkProspectRoiPredicted } from './c02-hedge';

export const C04_CODE = 'C04';
export const C06_CODE = 'C06';

/** Product names in use (yardflow-context.ts suite) plus the soft product openers. */
export const PRODUCT_NAME_RE =
  /\b(?:YardFlow|FreightRoll|flowYMS|flowVISION|flowGATE|flowDRIVER|flowBOL|flowNETWORK|flowAI)\b|\bour (?:platform|software|system|product|tool)\b|\bwe (?:help|built|build|offer|provide)\b/i;

/** Copy-specific private-intent phrasings, checked before the routing explain patterns. */
export const COPY_INTENT_PATTERNS: readonly ForbiddenExplainPattern[] = [
  { label: 'saw you', pattern: /\bsaw (?:that )?you\b/i },
  {
    label: 'noticed you visited/viewed/opened/clicked/downloaded/read',
    pattern: /\bnoticed (?:that )?you (?:visited|viewed|opened|clicked|downloaded|read)\b/i,
  },
  { label: 'you visited/viewed/opened/clicked/downloaded', pattern: /\byou (?:visited|viewed|opened|clicked|downloaded)\b/i },
  { label: 'on our site/website/page', pattern: /\bon our (?:site|website|page)\b/i },
  { label: 'your team/colleagues opened/viewed/visited', pattern: /\byour (?:team|colleague)s? (?:opened|viewed|visited)\b/i },
  { label: 'engagement score', pattern: /\bengagement score\b/i },
  { label: 'hot lead', pattern: /\bhot lead\b/i },
];

const ALL_INTENT_PATTERNS: readonly ForbiddenExplainPattern[] = [...COPY_INTENT_PATTERNS, ...FORBIDDEN_EXPLAIN_PATTERNS];

export const checkProductLeads: Check = (draft, ctx) => {
  if (ctx.stepIndex !== 0) {
    return { code: C04_CODE, passed: true, severity: 'reject', detail: 'not step 0', span: null };
  }
  const first = firstBodySentence(draft.body);
  if (first.length === 0) {
    return { code: C04_CODE, passed: true, severity: 'reject', detail: 'empty body', span: null };
  }
  const hit = PRODUCT_NAME_RE.exec(stripMarkers(first));
  if (hit) {
    return {
      code: C04_CODE,
      passed: false,
      severity: 'reject',
      detail: `first sentence leads with the product ("${hit[0]}"): "${first}"`,
      span: spanOf(draft.body, first),
    };
  }
  return { code: C04_CODE, passed: true, severity: 'reject', detail: 'first sentence does not name the product', span: null };
};

function findIntentHit(text: string): { label: string; span: CheckSpan } | null {
  for (const { label, pattern } of ALL_INTENT_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags.replace('g', ''));
    const m = re.exec(text);
    if (m) {
      return { label, span: { start: m.index, end: m.index + m[0].length, text: m[0] } };
    }
  }
  return null;
}

export const checkPrivateIntentExposed: Check = (draft) => {
  const subjectHit = findIntentHit(draft.subject);
  if (subjectHit) {
    return {
      code: C06_CODE,
      passed: false,
      severity: 'reject',
      detail: `subject exposes private intent (${subjectHit.label}): "${subjectHit.span.text}"`,
      span: subjectHit.span,
    };
  }
  const bodyHit = findIntentHit(draft.body);
  if (bodyHit) {
    return {
      code: C06_CODE,
      passed: false,
      severity: 'reject',
      detail: `body exposes private intent (${bodyHit.label}): "${bodyHit.span.text}"`,
      span: bodyHit.span,
    };
  }
  return { code: C06_CODE, passed: true, severity: 'reject', detail: 'no private intent language', span: null };
};

/** Group B in check-code order: C02, C03, C04, C06. */
export const GROUP_B_CHECKS: Check[] = [
  checkHypothesisAsFact,
  checkProspectRoiPredicted,
  checkProductLeads,
  checkPrivateIntentExposed,
];
