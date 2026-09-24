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
      reason: 'empty_observation' | 'uncited_sentence' | 'unlinked_citation';
      sentenceIndex?: number;
      signalId?: string;
    };

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
