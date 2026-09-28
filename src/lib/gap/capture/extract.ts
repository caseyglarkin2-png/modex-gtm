/**
 * Candidate Buyer Input Data from pasted notes, a transcript or dictation
 * (Phase 2 D2, 2026-09-28). Pure and deterministic.
 *
 * Every candidate's quote is a sentence cut EXACTLY out of the supplied
 * text (never paraphrased), so it is verbatim by construction; confirmation
 * re-checks that anyway (quoteInSource). The machine only proposes a type
 * from visible cue words; a candidate is not truth until Casey confirms it,
 * and the type is his to relabel. Seller lines in a transcript ("Casey:",
 * "Me:", "YardFlow:") are never proposed as buyer language.
 */
import type { BidType } from '../taxonomy';

export interface CandidateBid {
  id: string;
  quote: string;
  /** The speaker label the line carried in the note ("Maria (VP DC Ops)"), or null (dictation, plain notes). */
  speaker: string | null;
  type: BidType;
  /** The cue words that suggested the type (shown to Casey; not a score). */
  cues: string[];
}

/** Seller labels, including a full name ("Casey Larkin:", "Casey L.:") (review D P1). */
const SELLER_SPEAKER = /^\s*(casey\b[\w .'-]{0,40}|me|i|yardflow[\w .'-]{0,40}|freightroll[\w .'-]{0,40}|seller|ae|rep)\s*[:\-]/i;
const SPEAKER = /^\s*([A-Z][\w .'(),&/-]{0,60}):\s*/;

/** Ordered: the first matching rule labels the sentence. */
const RULES: Array<{ type: BidType; cues: RegExp }> = [
  { type: 'objection', cues: /\b(not a priority|no budget|already (have|use|built)|we use [a-z]+ for|not interested|happy with|locked in|contract with)\b/i },
  { type: 'metric', cues: /(\$\s?\d[\d,.]*|\b\d[\d,.]*\s?(%|percent|hours?|hrs|minutes?|mins|days?|trailers?|trucks?|loads?|doors?|drivers?|per (day|week|month|shift))\b)/i },
  { type: 'impact', cues: /\b(costs? us|cost|detention|overtime|demurrage|penalt(y|ies)|chargebacks?|lost|losing|missed|late (loads|trucks|shipments)|service level|fill rate|revenue)\b/i },
  { type: 'root_cause', cues: /\b(because|the reason|root cause|due to|comes down to|we don'?t have|no visibility|can'?t see|manual(ly)?|radio|clipboard|paper|spreadsheet|walk the yard|hunt(ing)? for)\b/i },
  { type: 'future_state', cues: /\b(we want|we'?d like|ideally|our goal|the goal|need to be able|we need|looking for a way|would love)\b/i },
  { type: 'priority', cues: /\b(this quarter|this year|top priority|priority for|by q[1-4]|before peak|initiative)\b/i },
  { type: 'constraint', cues: /\b(budget|approval|procurement|it security|union|contract|timeline|capex)\b/i },
  { type: 'business_problem', cues: /\b(problem|struggle|pain|issue|challenge|bottleneck|backed up|congest(ed|ion)|dwell|waiting|wait time|can'?t find|lose track|chaos|mess)\b/i },
  { type: 'current_state', cues: /\b(today we|right now|currently|we use|we track|we run|our process|the way we)\b/i },
];

/** Split into sentences, keeping each one EXACTLY as it appears in the text, with the line's speaker label. */
export function sentencesWithSpeaker(text: string): Array<{ sentence: string; speaker: string | null }> {
  const out: Array<{ sentence: string; speaker: string | null }> = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || SELLER_SPEAKER.test(rawLine)) continue;
    const m = SPEAKER.exec(rawLine);
    const speaker = m ? m[1].trim() : null;
    const line = m ? rawLine.slice(m[0].length) : rawLine;
    const parts = line.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [];
    for (const p of parts) {
      const s = p.trim();
      if (s.split(/\s+/).length >= 4) out.push({ sentence: s, speaker });
    }
  }
  return out;
}

export function sentencesOf(text: string): string[] {
  return sentencesWithSpeaker(text).map((x) => x.sentence);
}

/** Distinct first names of the non-seller speaker labels ("Maria (VP)" and "Maria" are one speaker). */
export function buyerSpeakers(text: string): string[] {
  const names = new Set<string>();
  for (const { speaker } of sentencesWithSpeaker(text)) if (speaker) names.add(speaker.split(/[\s(]/)[0].toLowerCase());
  return [...names];
}

const norm = (s: string) =>
  s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** A quote is usable only if it appears verbatim (whitespace and quote marks normalized) in the source. */
export function quoteInSource(quote: string, source: string): boolean {
  const q = norm(quote);
  return q.length > 0 && norm(source).includes(q);
}

/** Review D: an edited quote must stay inside its own candidate sentence and keep at least 4 words. */
export function quoteWithinSentence(quote: string, sentence: string): boolean {
  return quote.trim().split(/\s+/).length >= 4 && quoteInSource(quote, sentence);
}

export const MAX_CANDIDATES = 8;

export function extractCandidates(text: string): CandidateBid[] {
  const out: CandidateBid[] = [];
  const seen = new Set<string>();
  for (const { sentence, speaker } of sentencesWithSpeaker(text)) {
    const key = norm(sentence);
    if (seen.has(key)) continue;
    const rule = RULES.find((r) => r.cues.test(sentence));
    if (!rule) continue;
    seen.add(key);
    const cues = [...new Set((sentence.match(new RegExp(rule.cues.source, 'gi')) ?? []).map((c) => c.toLowerCase()))].slice(0, 3);
    out.push({ id: `c${out.length + 1}`, quote: sentence, speaker, type: rule.type, cues });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}
