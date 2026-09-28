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
  type: BidType;
  /** The cue words that suggested the type (shown to Casey; not a score). */
  cues: string[];
}

const SELLER_SPEAKER = /^\s*(casey|me|i|yardflow|freightroll|seller|ae|rep)\s*[:\-]/i;
const SPEAKER = /^\s*[A-Z][\w .'(),&/-]{0,60}:\s*/;

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

/** Split into sentences, keeping each one EXACTLY as it appears in the text. */
export function sentencesOf(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim() || SELLER_SPEAKER.test(rawLine)) continue;
    const line = rawLine.replace(SPEAKER, '');
    const parts = line.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [];
    for (const p of parts) {
      const s = p.trim();
      if (s.split(/\s+/).length >= 4) out.push(s);
    }
  }
  return out;
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

export const MAX_CANDIDATES = 8;

export function extractCandidates(text: string): CandidateBid[] {
  const out: CandidateBid[] = [];
  const seen = new Set<string>();
  for (const sentence of sentencesOf(text)) {
    const key = norm(sentence);
    if (seen.has(key)) continue;
    const rule = RULES.find((r) => r.cues.test(sentence));
    if (!rule) continue;
    seen.add(key);
    const cues = [...new Set((sentence.match(new RegExp(rule.cues.source, 'gi')) ?? []).map((c) => c.toLowerCase()))].slice(0, 3);
    out.push({ id: `c${out.length + 1}`, quote: sentence, type: rule.type, cues });
    if (out.length >= MAX_CANDIDATES) break;
  }
  return out;
}
