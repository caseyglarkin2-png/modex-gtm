/**
 * GAP message compiler check (Sprint 3, S3-T8): C12 FOLLOWUP_NEW_INFO. Spec
 * section 8. Pure: no I/O.
 *
 * Reject on step 1 and later unless BOTH hold: at least one cited evidence id
 * (a `[[SRC:id]]` / `[S:id]` marker in the body OR an entry of the step's
 * `contract.evidenceIds`, the lane's beside-the-body citation, S3-T13) is
 * used by no prior step (prior bodies' markers plus `contract.priorEvidenceIds`),
 * AND the content-word Jaccard similarity to every prior body is under 0.6.
 * Content words are lowercased runs of four or more letters with stopwords
 * removed, measured after stripping markers, the greeting and the signature.
 * The detail names the new id(s).
 */

import { readCitationContract, stripGreetingAndSignature, stripMarkers } from '../text';
import type { Check } from '../types';

export const C12_CODE = 'C12';
export const NEWINFO_MAX_SIMILARITY = 0.6;

const MARKER_ID_RE = /\[\[SRC:([A-Za-z0-9_-]+)\]\]|\[S:([A-Za-z0-9_-]+)\]/g;

export const STOPWORDS: ReadonlySet<string> = new Set([
  'that', 'this', 'with', 'from', 'your', 'yours', 'have', 'what', 'when', 'where', 'which', 'they',
  'them', 'their', 'there', 'would', 'could', 'should', 'about', 'into', 'than', 'then', 'also', 'been',
  'were', 'will', 'just', 'more', 'most', 'some', 'each', 'only', 'over', 'does', 'done', 'here',
  'those', 'these', 'because', 'while', 'after', 'before', 'still', 'much', 'many', 'very', 'such',
  'other', 'same', 'like', 'make', 'makes', 'take', 'takes', 'through', 'being', 'every', 'since',
]);

export function markerIds(text: string): string[] {
  const ids = new Set<string>();
  const re = new RegExp(MARKER_ID_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) ids.add(m[1] ?? m[2]);
  return [...ids];
}

export function contentWords(body: string): Set<string> {
  const text = stripMarkers(stripGreetingAndSignature(body)).toLowerCase();
  const out = new Set<string>();
  for (const w of text.match(/[a-z]{4,}/g) ?? []) {
    if (!STOPWORDS.has(w)) out.add(w);
  }
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export const checkFollowupNewInfo: Check = (draft, ctx) => {
  if (ctx.stepIndex === 0) {
    return { code: C12_CODE, passed: true, severity: 'reject', detail: 'step 0', span: null };
  }

  // Citation set = markers UNION the step's beside-the-body evidence ids;
  // prior set = every prior body's markers UNION every prior step's ids.
  const citation = readCitationContract(ctx.contract);
  const ids = [...new Set([...markerIds(draft.body), ...citation.evidenceIds])];
  const priorIds = new Set([...ctx.priorStepBodies.flatMap(markerIds), ...citation.priorEvidenceIds.flat()]);
  const reused = ids.filter((id) => priorIds.has(id));
  const fresh = ids.filter((id) => !priorIds.has(id));

  if (ids.length === 0) {
    return {
      code: C12_CODE,
      passed: false,
      severity: 'reject',
      detail: `no evidence id: a follow-up cites at least one evidence id unused in prior steps, as a marker or in evidence_ids (prior ids: ${[...priorIds].join(', ') || 'none'})`,
      span: null,
    };
  }
  if (fresh.length === 0) {
    return {
      code: C12_CODE,
      passed: false,
      severity: 'reject',
      detail: `no new evidence id: every cited id is reused from a prior step (reused ids: ${reused.join(', ')})`,
      span: null,
    };
  }

  const words = contentWords(draft.body);
  let maxSimilarity = 0;
  for (let i = 0; i < ctx.priorStepBodies.length; i += 1) {
    const similarity = jaccard(words, contentWords(ctx.priorStepBodies[i]));
    maxSimilarity = Math.max(maxSimilarity, similarity);
    if (similarity >= NEWINFO_MAX_SIMILARITY) {
      return {
        code: C12_CODE,
        passed: false,
        severity: 'reject',
        detail: `content similarity ${similarity.toFixed(2)} to prior step ${i} is at or above ${NEWINFO_MAX_SIMILARITY.toFixed(2)} (new ids: ${fresh.join(', ')}; reused ids: ${reused.join(', ') || 'none'})`,
        span: null,
      };
    }
  }

  return {
    code: C12_CODE,
    passed: true,
    severity: 'reject',
    detail: `new evidence ids: ${fresh.join(', ')}; reused ids: ${reused.join(', ') || 'none'}; max similarity ${maxSimilarity.toFixed(2)}`,
    span: null,
  };
};
