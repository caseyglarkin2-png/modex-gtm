/**
 * GAP evidence research: the pure fact rules (last mile, 2026-09-25).
 *
 * A FACT here is one verbatim sentence, taken from a fetched public source,
 * that states a change to the account's PHYSICAL operations: a distribution
 * or fulfillment center, warehouse, plant, yard, gate or dock being opened,
 * closed, exited, consolidated, expanded, built, automated, acquired or
 * relocated. Nothing here infers a problem; a yard problem is never a fact.
 *
 * Verification is the anti-fabrication rule: a candidate from ANY provider is
 * accepted only if its excerpt is found, after whitespace/quote/case
 * normalization, in the text of the page fetched from its own URL.
 */
import type { SignalType } from '../taxonomy';

const FACILITY = /\b(distribution cent(?:er|re)s?|fulfil?lment cent(?:er|re)s?|distribution facilit(?:y|ies)|warehouses?|cross[- ]docks?|food production plants?|manufacturing plants?|plants?|facilit(?:y|ies)|yards?|docks?|gates?|DCs?|network)\b/i;
const CHANGE = /\b(open(?:ed|ing|s)?|clos(?:e|ed|es|ing|ure|ures)|exit(?:ed|ing|s)?|consolidat(?:e|ed|es|ing|ion)|expan(?:d|ded|ding|sion)|buil(?:d|t|ding)|construct(?:ed|ing|ion)?|automat(?:e|ed|es|ing|ion)|robot(?:ic|ics)?|acquir(?:e|ed|es|ing)|acquisition|relocat(?:e|ed|ing|ion)|launch(?:ed|es|ing)?|invest(?:ed|ing|ment|ments)?|redesign(?:ed)?|add(?:ed|ing)? capacity)\b/i;

export type FactChange = 'opening' | 'closure' | 'expansion' | 'automation' | 'acquisition' | 'relocation' | 'investment';

export interface FactClassification {
  type: SignalType;
  change: FactChange;
}

/**
 * Financial-statement sentences that mention a facility change only in
 * passing ("Excluding the effect of fulfillment center exits ..., sales
 * increased 0.1%"). Verified live against Kroger's 2026 10-Qs: every one of
 * those is about sales or cash, not about the facilities, so it is not a fact
 * about physical operations.
 */
const FINANCIAL_MENTION = /\b(excluding|partially offset|offset by|cash flows?|cash (?:used|provided)|financing activities|operating activities|identical sales|sales (?:increased|decreased)|(?:was|were) primarily due|primarily due to|compared to the same period|per diluted share|net earnings|gross margin|basis points)\b/i;

export function isFinancialStatementMention(sentence: string): boolean {
  return FINANCIAL_MENTION.test(sentence);
}

/**
 * A definitive acquisition or merger by the account: a network-integration
 * event (the brief's "acquisition / network integration" fact type), even
 * without a facility noun. Verified live: Kroger's 8-K of 2026-07-01
 * ("...entered into an agreement and plan of merger pursuant to which it will
 * acquire Giant Eagle, Inc.").
 */
const DEFINITIVE_ACQUISITION = /\b(agreement and plan of merger|definitive (?:merger )?agreement|will acquire|agreed to acquire|completed (?:its |the )?acquisition)\b/i;

export function isAcquisitionFact(sentence: string): boolean {
  return DEFINITIVE_ACQUISITION.test(sentence);
}

/** Does this sentence state a physical-operations or network change (and is not a financial-statement mention)? */
export function isPhysicalOpsFact(sentence: string): boolean {
  if (isFinancialStatementMention(sentence)) return false;
  return (FACILITY.test(sentence) && CHANGE.test(sentence)) || isAcquisitionFact(sentence);
}

const ABBREVIATION_END = /\b(?:Co|Inc|Corp|Ltd|Cos|L\.P|U\.S|No|Nos|Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|approx|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.$/;

/** Sentences, without breaking after "Co.", "Inc.", "U.S." and the like. */
export function splitSentencesAware(text: string): string[] {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z"(“])/);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length > 0 && ABBREVIATION_END.test(out[out.length - 1])) out[out.length - 1] = `${out[out.length - 1]} ${p}`;
    else out.push(p);
  }
  return out;
}

export function classifyFact(sentence: string): FactClassification {
  const s = sentence.toLowerCase();
  // A change of status (closed, acquired, opened, moved) outranks a mention of
  // automation in the same sentence ("opened ... with automated check-in").
  if (/clos|exit|consolidat/.test(s)) return { type: 'site_expansion', change: 'closure' };
  if (/acqui/.test(s)) return { type: 'acquisition', change: 'acquisition' };
  if (/open|launch|build|built|construct/.test(s)) return { type: 'new_site', change: 'opening' };
  if (/relocat/.test(s)) return { type: 'site_expansion', change: 'relocation' };
  if (/automat|robot/.test(s)) return { type: 'automation_program', change: 'automation' };
  if (/expan|add(?:ed|ing)? capacity/.test(s)) return { type: 'site_expansion', change: 'expansion' };
  return { type: 'site_expansion', change: 'investment' };
}

/** Sentences of a document text that are physical-operations facts (deduplicated, bounded length). */
export function extractFactSentences(text: string, max = 12): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of splitSentencesAware(text)) {
    const s = raw.replace(/\s+/g, ' ').trim();
    if (s.length < 60 || s.length > 500) continue;
    if (!isPhysicalOpsFact(s)) continue;
    const key = normalizeForMatch(s);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

/** Whitespace, quote and case normalization for verbatim matching. */
export function normalizeForMatch(text: string): string {
  return text
    .replace(/[‘’‛`]/g, "'")
    .replace(/[“”‟]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** HTML to plain text, good enough for verbatim matching. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#8217;|&rsquo;/g, '’')
    .replace(/&#8216;|&lsquo;/g, '‘')
    .replace(/&#8220;|&ldquo;/g, '“')
    .replace(/&#8221;|&rdquo;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** The anti-fabrication rule: the excerpt must appear at its own source. */
export function excerptFoundIn(excerpt: string, pageText: string): boolean {
  const e = normalizeForMatch(excerpt);
  return e.length >= 40 && normalizeForMatch(pageText).includes(e);
}

/** A single quotable sentence (no internal sentence break), safe to cite as one observation sentence. */
export function isSingleSentence(excerpt: string): boolean {
  return !/[.!?]\s+\S/.test(excerpt.trim().replace(/[.!?]["')\]]*$/, ''));
}

export interface ConflictFact {
  id: string;
  excerpt: string;
  change: FactChange;
}

/**
 * CONFLICTING evidence: the same NAMED site (a capitalized place word right
 * before the facility noun, e.g. "Monroe distribution center") is described
 * as both opening/expanding and closing/exiting. Different sites changing in
 * different directions is a network change, not a conflict.
 */
export function detectConflicts(facts: readonly ConflictFact[]): Array<{ site: string; ids: string[] }> {
  const siteOf = (s: string) => /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s+(?:distribution|fulfil?lment|DC|warehouse|plant|facility)\b/.exec(s)?.[1] ?? null;
  const bySite = new Map<string, ConflictFact[]>();
  for (const f of facts) {
    const raw = siteOf(f.excerpt);
    const site = raw?.replace(/^(?:(?:The|Our|We|Its|Their|A|An|Certain|Customer|New)\s+)+/, '').trim() ?? null;
    if (!site || /^(The|Our|We|Its|Their|A|An|Certain|Customer|New)$/i.test(site)) continue;
    bySite.set(site, [...(bySite.get(site) ?? []), f]);
  }
  const out: Array<{ site: string; ids: string[] }> = [];
  for (const [site, list] of bySite) {
    const up = list.some((f) => f.change === 'opening' || f.change === 'expansion');
    const down = list.some((f) => f.change === 'closure');
    if (up && down) out.push({ site, ids: list.map((f) => f.id) });
  }
  return out;
}
