/**
 * WHOSE WORDING A BUYER STATEMENT IS (R63-A S5, 2026-10-07). Pure and client-safe.
 *
 * The seller's paraphrase "He said the gate still checks trailers in on paper..." was badged BUYER CONFIRMED and the
 * recap to Ben quoted it "in your words". Only their own words are quoted: a reply's text (their message) or a
 * transcript's labelled line. A sentence the seller wrote in a note, and any reported speech ("He said ...", "She told
 * me ..."), is what the seller noted they said: shown and sent as such, never in quotation marks.
 */
export type BidWording = 'verbatim' | 'noted';

/** Reported speech: the seller telling what someone said ("He said", "Ann told me", "they mentioned"). */
export const REPORTED_SPEECH = /^\s*(?:he|she|they|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|says|told\s+(?:me|us|casey|him|her|them)|mentioned|explained|noted|claimed|claims|thinks|thought|believes|believed|complained|admitted|felt|feels)\b/i;

/** At capture: their own words come from their message or a transcript's labelled line, unless the line reports speech. */
export function bidWording(quote: string, from: { reply: boolean; speakerLabelled: boolean }): BidWording {
  if (REPORTED_SPEECH.test(quote)) return 'noted';
  return from.reply || from.speakerLabelled ? 'verbatim' : 'noted';
}

/** On read: the recorded wording; a statement recorded before this rule is noted when it reports speech. */
export function wordingOf(metadata: unknown, quote: string): BidWording {
  const w = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>).wording : undefined;
  if (w === 'verbatim' || w === 'noted') return w;
  return REPORTED_SPEECH.test(quote) ? 'noted' : 'verbatim';
}
