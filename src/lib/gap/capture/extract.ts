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
import { dayLabel, parseDuePhrase, type ParsedDay } from '../work/dates';

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

/**
 * R44: a pasted summary is never the buyer's words: a line that opens a summary or note-taker block ("Summary:", "AI
 * summary:", "TL;DR:", "Key takeaways:", "Action items:", "Otter:", "Fireflies:") and every line under such a header
 * up to the next blank line.
 */
const SUMMARY_LINE = /^\s*(?:[-*\u2022]\s*)?(?:ai\s+)?(?:meeting\s+)?(?:summary|summaries|tl;?\s?dr|key\s+takeaways|takeaways|action\s+items|notes\s+(?:by|from)|generated\s+by|otter(?:\.ai)?|fireflies(?:\.ai)?|gong|fathom|read\.ai)\b[^:\n]{0,40}:/i;
/** R44: the seller's own read on an unlabeled line ("I think", "my guess", "probably") is never a buyer quote. */
const SPECULATION = /^\s*(?:i\s+think|i\s+suspect|i\s+bet|i\s+assume|i'?d\s+guess|my\s+(?:guess|sense|read|hunch)|probably|seems\s+like|it\s+seems|maybe\s+they|feels\s+like|sounds\s+like\s+they)\b/i;

export type NoteLine = { sentence: string; speaker: string | null; seller: boolean; excluded: null | 'summary' | 'speculation' };

/** Every sentence of the note EXACTLY as written, with its speaker, whether the seller said it, and why it is never a buyer quote. */
export function noteSentences(text: string): NoteLine[] {
  const out: NoteLine[] = [];
  let inSummary = false;
  for (const fullLine of text.split(/\r?\n/)) {
    if (!fullLine.trim()) {
      inSummary = false;
      continue;
    }
    // A bullet marker is layout, not words: "- Maria: we lose..." is Maria's line.
    const rawLine = fullLine.replace(/^\s*[-*\u2022]\s+/, '');
    const summaryHead = SUMMARY_LINE.exec(rawLine);
    if (summaryHead) inSummary = !rawLine.slice(summaryHead[0].length).trim();
    const summary = !!summaryHead || inSummary;
    const seller = SELLER_SPEAKER.test(rawLine);
    const m = seller ? /^\s*[^:\-]+[:\-]\s*/.exec(rawLine) : SPEAKER.exec(rawLine);
    const speaker = m && !seller ? m[1].trim() : seller ? 'You' : null;
    const line = summaryHead ? rawLine.slice(summaryHead[0].length) : m ? rawLine.slice(m[0].length) : rawLine;
    const parts = line.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) ?? [];
    for (const p of parts) {
      const sentence = p.trim();
      if (sentence.split(/\s+/).length < 4) continue;
      const excluded: NoteLine['excluded'] = summary ? 'summary' : !seller && speaker === null && SPECULATION.test(sentence) ? 'speculation' : null;
      out.push({ sentence, speaker, seller, excluded });
    }
  }
  return out;
}

/** Split into sentences, keeping each one EXACTLY as it appears in the text, with the line's speaker label (buyer lines only). */
export function sentencesWithSpeaker(text: string): Array<{ sentence: string; speaker: string | null }> {
  return noteSentences(text).filter((x) => !x.seller && !x.excluded).map(({ sentence, speaker }) => ({ sentence, speaker }));
}

/** The lines the note holds that are never proposed as buyer words, and why (shown to the seller, kept in the note). */
export function excludedLines(text: string): Array<{ text: string; reason: string }> {
  return noteSentences(text)
    .filter((x) => x.excluded)
    .map((x) => ({ text: x.sentence, reason: x.excluded === 'summary' ? 'A summary, not their words' : 'Your own read, not their words' }));
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

// ---------------------------------------------------------------------------------------------------------------
// R44: commitments and dates, with the right speaker
// ---------------------------------------------------------------------------------------------------------------

export interface CandidateCommitment {
  /** `k1`, `k2`, ... (never a BID candidate id). */
  id: string;
  /** The sentence it rests on, verbatim. */
  quote: string;
  /** Who said it: the note's label, "You" for the seller, or null. */
  speaker: string | null;
  /** Who owes it: the seller (they asked, or you promised) or the buyer (they promised). */
  owner: 'seller' | 'buyer';
  kind: 'deliverable' | 'buyer_promise' | 'prepare_meeting';
  /** The proposed obligation in seller words; the seller edits it in the review. */
  title: string;
  /** R63-A B1: the thing owed ("Ben a one-page agenda for the walk"), so the review can retitle it when the seller changes who owes it. */
  object?: string | null;
  /** The day the sentence names (New York, read from the time the note was saved), or null. */
  due: ParsedDay | null;
}

const ASKS = /\b(?:send|share|forward|email)\s+(?:me|us|over)\b|\b(?:can|could|would)\s+you\s+(?:send|share|get|put together|pull together|forward|email)\b|\bget\s+(?:me|us)\b|\bplease\s+(?:send|share)\b/i;
const PROMISE = /\b(?:i'?ll|i\s+will|we'?ll|we\s+will|let\s+me|i\s+can)\s+(?:send|share|get\s+you|get\s+them|put\s+together|pull\s+together|forward|email|follow\s+up)\b|\b(?:i|we)\s+owe\b/i;
/**
 * R63-A B1: a promise in the third person ("Ben will send us the volumes", "she'll share the map"): theirs. The name
 * (a capitalised word, never I or We) is who owes it.
 */
const THIRD_PROMISE = /\b(he|she|they|He|She|They|(?!I\b|We\b)[A-Z][a-z]{1,30})(?:\s+will|'ll|\s+is\s+going\s+to|\s+are\s+going\s+to|\s+promised\s+to)\s+(?:send|share|get\s+us|get\s+me|put\s+together|pull\s+together|forward|email|follow\s+up)\b/;

/** R63-A B1: the obligation's title for who owes it ("Send Ben the agenda"; "Maria sends the volumes"; "They send ..."). */
export function commitmentTitle(owner: 'seller' | 'buyer', object: string | null, who: string | null, sentence: string): string {
  if (owner === 'seller') return object ? `Send ${object}` : `Follow through: ${sentence.slice(0, 80)}`;
  return object ? (who ? `${who} sends ${object}` : `They send ${object}`) : `${who ?? 'They'} promised: ${sentence.slice(0, 80)}`;
}
const MEETING = /\b(?:let'?s\s+(?:meet|talk|connect|walk)|meet\s+(?:on|next|this|tomorrow)|(?:a|the|our)\s+(?:call|meeting|walk-?through|site\s+visit|demo)\s+(?:on|next|this|tomorrow)|see\s+you\s+(?:on|next|tomorrow))\b/i;
const OBJECT = /\b(?:send|share|forward|email|get|put together|pull together)\s+(?:me\s+|us\s+|you\s+|them\s+|over\s+)?(?:a\s+copy\s+of\s+)?(.+?)(?:\s+(?:by|before|on|until|no later than|this|next|tomorrow|today|end of)\b.*)?[.?!]*$/i;

function objectOf(sentence: string): string | null {
  const m = OBJECT.exec(sentence);
  const o = m?.[1]?.replace(/^(?:you|it|them)\s+/i, '').replace(/[,;].*$/, '').trim();
  return o && o.split(/\s+/).length <= 12 ? o : null;
}

export const MAX_COMMITMENTS = 6;

/**
 * The obligations a conversation note states, each on its verbatim sentence with its speaker: a buyer asking the
 * seller for something (the seller owes a deliverable), the seller promising something (the seller owes it; the
 * seller's own words, never a buyer quote), a buyer promising something (waiting on them), a meeting named with a
 * day (prepare it). The day comes from the sentence, read in New York from `now`. A pasted summary and the seller's
 * own speculation propose nothing. Pure; the seller confirms, edits or rejects each in one review.
 *
 * R63-A B1: a line with no speaker label is the seller's own note, so a first-person promise there ("I will send Ben
 * a one-page agenda by tonight", "I'll", "we will", "I owe") is OWED BY THE SELLER; a third-person promise ("Ben will
 * send us the volumes") is theirs. In a note that IS the buyer's own message (opened from a reply,
 * `firstPersonIsBuyer`), an unlabelled "I" is the buyer.
 */
export function extractCommitments(text: string, now: Date, opts: { firstPersonIsBuyer?: boolean } = {}): CandidateCommitment[] {
  const out: CandidateCommitment[] = [];
  for (const x of noteSentences(text)) {
    if (x.excluded) continue;
    const who = x.seller ? 'You' : x.speaker;
    const first = who && who !== 'You' ? who.split(/[\s(]/)[0] : null;
    const due = parseDuePhrase(x.sentence, now);
    // The thing owed, without the day the sentence names ("the pilot plan Monday" is "the pilot plan").
    const rawObj = objectOf(x.sentence);
    const obj = rawObj && due ? rawObj.replace(new RegExp(`\\s*(?:by|before|on|this|next)?\\s*${due.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i'), '').trim() || rawObj : rawObj;
    let c: Omit<CandidateCommitment, 'id'> | null = null;
    // R63-A B1: an unlabelled line in the seller's own note is the seller speaking.
    const sellerVoice = x.seller || (x.speaker === null && !opts.firstPersonIsBuyer);
    // A third-person promise ("Ben will send us the volumes") is theirs, even though "send us" reads like an ask.
    const third = !x.seller && !/\b(?:can|could|would)\s+you\b/i.test(x.sentence) ? THIRD_PROMISE.exec(x.sentence) : null;
    if (third && !PROMISE.test(x.sentence)) {
      const named = !/^(?:he|she|they)$/i.test(third[1]) ? third[1] : null;
      const owes = x.speaker ? first : named;
      c = { quote: x.sentence, speaker: x.speaker ?? named, owner: 'buyer', kind: 'buyer_promise', title: commitmentTitle('buyer', obj, owes, x.sentence), object: obj, due };
    } else if (!x.seller && ASKS.test(x.sentence)) {
      c = { quote: x.sentence, speaker: x.speaker, owner: 'seller', kind: 'deliverable', title: obj ? `Send ${first ?? 'them'} ${obj}` : `Answer: ${x.sentence.slice(0, 80)}`, object: obj ? `${first ?? 'them'} ${obj}` : null, due };
    } else if (PROMISE.test(x.sentence) && sellerVoice) {
      c = { quote: x.sentence, speaker: 'You', owner: 'seller', kind: 'deliverable', title: commitmentTitle('seller', obj, null, x.sentence), object: obj, due };
    } else if (PROMISE.test(x.sentence) || third) {
      const named = third && !/^(?:he|she|they)$/i.test(third[1]) ? third[1] : null;
      const owes = x.speaker ? first : named;
      c = { quote: x.sentence, speaker: x.speaker ?? named, owner: 'buyer', kind: 'buyer_promise', title: commitmentTitle('buyer', obj, owes, x.sentence), object: obj, due };
    } else if (MEETING.test(x.sentence) && due) {
      c = { quote: x.sentence, speaker: who, owner: 'seller', kind: 'prepare_meeting', title: `Prepare the meeting (${due.phrase})`, due };
    }
    if (c) out.push({ id: `k${out.length + 1}`, ...c, title: c.title.slice(0, 200) });
    if (out.length >= MAX_COMMITMENTS) break;
  }
  return out;
}

/** "Due Fri, Oct 9" for the review, or a note that the words name no day. */
export function dueText(c: CandidateCommitment, now: Date): string {
  if (!c.due) return 'No day named';
  return `${dayLabel(c.due.day, now)}${c.due.ambiguous ? ' (check: the words allow another day)' : ''}`;
}
