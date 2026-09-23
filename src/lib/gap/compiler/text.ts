/**
 * GAP message compiler: shared text helpers (Sprint 3). Spec section 8.
 *
 * Pure string utilities the checks share: paragraph and sentence splitting
 * (the sentence rule mirrors `hypothesis/observation.ts`), marker stripping
 * for `[[SRC:id]]` (attribution.ts) and `[S:id]` (observation.ts), greeting
 * and signature detection, second-person detection, and span location.
 */

import type { CheckSpan } from './types';

/** Both marker forms: `[[SRC:id]]` (source-backed attribution) and `[S:id]` (observation citation). */
export const MARKER_RE = /\[\[SRC:[A-Za-z0-9_-]+\]\]|\[S:[A-Za-z0-9_-]+\]/g;

const HAS_CONTENT = /[A-Za-z0-9]/;

/** Greeting word plus at most two name tokens, optional trailing comma or colon. */
const GREETING_WORD_RE = /^(?:hi|hello|hey|dear|good (?:morning|afternoon|evening))(?:\s+[A-Za-z.'-]+){0,2}\s*[,:!]?$/i;
/** A bare name (one to three capitalised tokens) ending in a comma. */
const GREETING_NAME_RE = /^[A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2},$/;

const SIGNATURE_START_PATTERNS: readonly RegExp[] = [
  /^casey larkin(?:\s*$|\s*,)/i,
  /^casey\s*$/i,
  /^--\s*$/,
];

const SECOND_PERSON_RE = /\b(?:you|your|yours|yourself|yourselves)\b/i;

export function hasMarker(text: string): boolean {
  MARKER_RE.lastIndex = 0;
  return MARKER_RE.test(text);
}

/** Remove markers and the whitespace they leave behind. Newlines are preserved. */
export function stripMarkers(text: string): string {
  return text
    .replace(MARKER_RE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+(?=[.,!?;:])/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join('\n');
}

/** Paragraphs are separated by one or more blank lines. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\r?\n(?:[ \t]*\r?\n)+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Split text into sentences. Terminators are `.`, `!` or `?` followed by
 * whitespace or end of text, plus any newline (the observation.ts rule).
 * Fragments that are only markers or punctuation are dropped.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])(?=\s|$)|\r?\n/)
    .map((fragment) => fragment.trim())
    .filter((fragment) => fragment.length > 0)
    .filter((fragment) => HAS_CONTENT.test(fragment.replace(MARKER_RE, '')));
}

export function isGreetingLine(line: string): boolean {
  const t = line.trim();
  return GREETING_WORD_RE.test(t) || GREETING_NAME_RE.test(t);
}

export function isSignatureStart(line: string): boolean {
  const t = line.trim();
  return SIGNATURE_START_PATTERNS.some((p) => p.test(t));
}

/**
 * Drop the greeting line (when the first non-blank line is one) and the
 * trailing signature block (from the first signature-start line onward).
 */
export function stripGreetingAndSignature(body: string): string {
  const lines = body.split(/\r?\n/);
  const firstContent = lines.findIndex((l) => l.trim().length > 0);
  let start = 0;
  if (firstContent !== -1 && isGreetingLine(lines[firstContent])) {
    start = firstContent + 1;
  }
  let end = lines.length;
  for (let i = start; i < lines.length; i += 1) {
    if (isSignatureStart(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trim();
}

/** Paragraphs of the body with the greeting line and signature block removed. */
export function bodyParagraphs(body: string): string[] {
  return splitParagraphs(stripGreetingAndSignature(body));
}

/** Words after stripping markers, the greeting line and the signature block. */
export function wordCount(body: string): number {
  return stripMarkers(stripGreetingAndSignature(body))
    .split(/\s+/)
    .filter((w) => HAS_CONTENT.test(w)).length;
}

export function isQuestion(sentence: string): boolean {
  return sentence.trim().endsWith('?');
}

export function hasSecondPerson(sentence: string): boolean {
  return SECOND_PERSON_RE.test(sentence);
}

/** First sentence of the body after the greeting line, or '' when the body has none. */
export function firstBodySentence(body: string): string {
  return splitSentences(stripGreetingAndSignature(body))[0] ?? '';
}

/** Locate `text` inside `haystack` from `from`; null when absent. */
export function spanOf(haystack: string, text: string, from = 0): CheckSpan | null {
  if (text.length === 0) return null;
  const start = haystack.indexOf(text, from);
  if (start === -1) return null;
  return { start, end: start + text.length, text };
}

/** Sentences of `paragraph` with their spans in `body`, located in order. */
export function sentenceSpans(body: string, paragraph: string): Array<{ sentence: string; span: CheckSpan | null }> {
  let cursor = Math.max(0, body.indexOf(paragraph));
  return splitSentences(paragraph).map((sentence) => {
    const span = spanOf(body, sentence, cursor);
    if (span) cursor = span.end;
    return { sentence, span };
  });
}
