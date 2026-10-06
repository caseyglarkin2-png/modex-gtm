/**
 * Observation citation validator (GAP Prospecting OS, Sprint 1, S1-T4).
 *
 * An observation is the "what we saw" half of a hypothesis. Every sentence in
 * it must cite at least one linked signal with a token of the form `[S:<id>]`,
 * and every cited id must be one of the signals actually linked to the
 * hypothesis. This is SYNTACTIC traceability only: the validator proves each
 * sentence points at a signal, not that the signal supports the sentence. The
 * human reviewer at the review_required gate is the semantic check.
 *
 * Pure module. No I/O, no clock, no imports beyond types.
 */

const CITATION_TOKEN = /\[S:([A-Za-z0-9_-]+)\]/g;

/** A sentence that, once tokens are removed, has no letters or digits is not a sentence. */
const HAS_CONTENT = /[\p{L}\p{N}]/u;

export type ObservationValidation =
  | { ok: true; sentences: number; citedIds: string[] }
  | {
      ok: false;
      reason: 'empty_observation' | 'uncited_sentence' | 'unlinked_citation' | 'title_shaped_observation';
      sentenceIndex?: number;
      signalId?: string;
    };

/** Plain words for each refusal, for any surface that shows one. */
export const OBSERVATION_REFUSAL_TEXT: Record<Extract<ObservationValidation, { ok: false }>['reason'], string> = {
  empty_observation: 'Write what changed, in one or two sentences, before the thesis can advance.',
  uncited_sentence: 'Every sentence of the observation must cite a linked fact ([S:id]).',
  unlinked_citation: 'A cited fact is not linked to this thesis. Link it, or cite one that is.',
  title_shaped_observation: 'The observation reads like a headline. Write it as a sentence about what changed, with the date and the source\'s own words, for example: "FedEx completed the sale of FedEx Supply Chain to CMA CGM on October 1." Keep the citation.',
};

const SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'by', 'as', 'its', 'from', 'into', 'over', 'vs', 'after', 'before']);
const PAST_OR_PRESENT_VERB = /\b(?:is|are|was|were|has|have|had|will|owns?|operates?|runs?|uses?|includes?|employs?|serves?|holds?|now|announced|completed|opened|opens|opening|closed|closes|closing|plans|planned|planning|said|says|began|begins|started|starts|signed|signs|acquired|acquires|sold|sells|invested|invests|investing|expanded|expands|expanding|moved|moves|moving|launched|launches|launching|built|builds|building|cut|cuts|cutting|added|adds|adding|reported|reports|filed|files|agreed|agrees|committed|commits|hired|hires|hiring|consolidat(?:ed|es|ing)|redesign(?:ed|s|ing)|roll(?:ed|s|ing) out|broke ground|breaks ground)\b/i;

/**
 * UX-06: a TITLE-SHAPED observation (a pasted headline such as "FedEx Completes Sale of FedEx Supply Chain to CMA CGM
 * Group") is refused with plain language. A headline is Title Case (most words capitalised), carries no sentence
 * punctuation and no ordinary past- or present-tense verb. A sentence in the source's own words with its citation
 * ("FedEx completed the sale of FedEx Supply Chain to CMA CGM on October 1. [S:x]") passes. Pure.
 */
export function titleShapedReason(observation: string): string | null {
  const text = stripCitations(observation).trim();
  if (!text) return null;
  const sentences = splitSentences(text).map((s) => stripCitations(s).trim()).filter(Boolean);
  for (const s of sentences) {
    const words = s.replace(/[“”"'’]/g, '').split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
    if (words.length < 4) continue;
    const meaningful = words.filter((w, k) => k === 0 || !SMALL_WORDS.has(w.toLowerCase()));
    const capitalised = meaningful.filter((w) => /^[A-Z]/.test(w) || /^[A-Z0-9&.$-]+$/.test(w)).length;
    const titleCase = capitalised / meaningful.length >= 0.8;
    const hasVerb = PAST_OR_PRESENT_VERB.test(s);
    // A nudge, not the gate: the reviewer is the semantic check. Title Case with no ordinary verb is a headline.
    if (titleCase && !hasVerb) return `"${s.slice(0, 80)}${s.length > 80 ? '...' : ''}" reads like a headline, not a sentence about what changed`;
  }
  return null;
}

/** Distinct citation ids in order of first appearance. */
export function extractCitationIds(text: string): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const match of text.matchAll(CITATION_TOKEN)) {
    const id = match[1];
    if (!seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** Remove every citation token and collapse the double spaces they leave behind. */
export function stripCitations(text: string): string {
  return text
    .replace(CITATION_TOKEN, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .replace(/^[ \t]+/gm, '')
    .trim();
}

/**
 * Split an observation into sentences. Terminators are `.`, `!` or `?`
 * followed by whitespace or end of text, plus any newline. Fragments that are
 * only citation tokens or punctuation are dropped.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])(?=\s|$)|\r?\n/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0)
    .filter((fragment) => HAS_CONTENT.test(fragment.replace(CITATION_TOKEN, '')));
}

export function validateObservation(
  observation: string,
  linkedSignalIds: readonly string[],
): ObservationValidation {
  if (observation.trim().length === 0) {
    return { ok: false, reason: 'empty_observation' };
  }

  const sentences = splitSentences(observation);
  if (sentences.length === 0) {
    return { ok: false, reason: 'empty_observation' };
  }
  // UX-06: a pasted headline is not an observation (the opening is built on it verbatim).
  if (titleShapedReason(observation)) {
    return { ok: false, reason: 'title_shaped_observation' };
  }

  for (let index = 0; index < sentences.length; index += 1) {
    if (extractCitationIds(sentences[index]).length === 0) {
      return { ok: false, reason: 'uncited_sentence', sentenceIndex: index };
    }
  }

  const linked = new Set(linkedSignalIds);
  const citedIds = extractCitationIds(observation);
  for (const id of citedIds) {
    if (!linked.has(id)) {
      return { ok: false, reason: 'unlinked_citation', signalId: id };
    }
  }

  return { ok: true, sentences: sentences.length, citedIds };
}
