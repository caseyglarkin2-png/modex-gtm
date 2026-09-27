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
const CHANGE = /\b(open(?:ed|ing|s)?|clos(?:e|ed|es|ing|ure|ures)|exit(?:ed|ing|s)?|consolidat(?:e|ed|es|ing|ion)|expan(?:d|ded|ding|sion)|build(?:s)?|built|construct(?:ed|ing|ion)?|automat(?:e|ed|es|ing|ion)|robot(?:ic|ics)?|acquir(?:e|ed|es|ing)|acquisition|relocat(?:e|ed|ing|ion)|redesign(?:ed)?|add(?:ed|ing)? capacity)\b/i;

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
 * Red team T6: verbatim filing sentences that name a facility word and a
 * change word but state no change to the account's network. Pinned by the
 * three PepsiCo 10-Q (2026-07-09) sentences GAP verified, attached and used to
 * approve a thesis (tests/unit/gap/research-facts.test.ts):
 *   - restructuring-charge breakdowns ("pre-tax charges ... asset impairments
 *     resulting from plant closures"): an accounting split, not a closure
 *   - risk-factor / forward-looking boilerplate ("could result in ...
 *     additional investments in facilities"): a hypothetical
 *   - liquidity and financing ("revolving credit facilities", "working
 *     capital", "debt financing"): a "facility" that is a loan
 *   - generic capital spending ("capital expenditures ... for facilities"):
 *     a budget line, not a named site change
 */
const NON_OPERATIONAL_CONTEXT = new RegExp(
  [
    // restructuring and impairment accounting
    String.raw`\bpre-tax charges?\b`, String.raw`\basset impairments?\b`, String.raw`\bimpairment charges?\b`, String.raw`\brestructuring (?:charges?|costs?)\b`, String.raw`\bseverance\b`,
    // risk factors and forward-looking hedges
    String.raw`\bcould (?:result|adversely|negatively|materially|harm|affect|impact)\b`, String.raw`\bmay (?:be unable|not be able|adversely|negatively|materially)\b`, String.raw`\brisks? (?:related|relating|associated) to\b`, String.raw`\badversely affect\b`, String.raw`\bno assurance\b`,
    // liquidity, credit and financing
    String.raw`\bliquidity\b`, String.raw`\bcredit facilit(?:y|ies)\b`, String.raw`\bworking capital\b`, String.raw`\bdebt financing\b`, String.raw`\bcommercial paper\b`, String.raw`\bborrowings?\b`,
    // generic capital spending
    String.raw`\bcapital (?:expenditures?|spending|investments?)\b`,
    // final red-team regression: deal accounting and legal definitions (General
    // Mills transaction-cost lines; the PepsiCo 8-K "'Principal Property' means")
    String.raw`\btransaction costs?\b`, String.raw`["”]\s*means\b`,
  ].join('|'),
  'i',
);

export function isNonOperationalContext(sentence: string): boolean {
  return NON_OPERATIONAL_CONTEXT.test(sentence);
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

/**
 * Release C review: a hypothetical is not a fact. "We may close additional
 * plants", "we might build warehouses", "could result in investments in
 * facilities" state nothing that happened or is scheduled.
 */
const HYPOTHETICAL = /\b(?:may|might|could|would)\b/i;

/** A "network" that is not a physical one (the retail-media, loyalty or IT kind). */
const NON_PHYSICAL_NETWORK = /\b(?:digital|media|social|payments?|loyalty|advertising|data|computer|telecom|wireless|dealer|franchise)\s+networks?\b/gi;

/** An acquisition of a company that is not physical network (software, data, media). */
const NON_PHYSICAL_ACQUISITION = /\b(?:software|analytics|technology|tech|apps?|platform|digital|saas|data|media|marketing|fintech|e-commerce)\b/i;

/** Vendor and service contracts are paperwork, not a site change. */
const CONTRACT_CONTEXT = /\b(?:vendor|supplier|service|security)\s+contracts?\b|\bcontracts?\s+with\b|\bagreements?\s+with\b/i;

/**
 * A change verb that directly governs a named kind of site: "build a new
 * automated distribution center", "close the Memphis distribution center",
 * "opened two cross-docks". When a sentence says THIS, it is a fact even if it
 * also mentions the money (capital investments, severance) behind it.
 */
const SPECIFIC_SITE_CHANGE =
  /\b(?:open(?:ed|s|ing)?|clos(?:e|ed|es|ing)|build(?:s|ing)?|built|construct(?:s|ed|ing)?|consolidat(?:e|ed|es|ing)|relocat(?:e|ed|es|ing)|automat(?:e|ed|es|ing)|expand(?:s|ed|ing)?|launch(?:ed|es|ing)?|add(?:s|ed|ing)?)\s+(?:(?:a|an|the|its|our|their|two|three|four|five|six|\d+)\s+)?(?:new\s+)?(?:[A-Z][\w.-]*\s+){0,3}(?:(?:automated|regional|temperature[- ]controlled|cold[- ]storage)\s+)?(?:distribution cent(?:er|re)|fulfil?lment cent(?:er|re)|warehouse|manufacturing plant|production plant|plant|facility|DC|cross[- ]dock|yard)s?\b/;

export function hasSpecificSiteChange(sentence: string): boolean {
  return SPECIFIC_SITE_CHANGE.test(sentence);
}

/**
 * Closeout review: a negation states that NO change happens ("we do not plan
 * to close the Memphis DC"), and habitual boilerplate states no particular
 * change ("from time to time we open, close or consolidate facilities"). Both
 * name a site and a change verb, so they are refused before the site match.
 */
// The negation must GOVERN the change verb (within three words before it):
// "we have closed X because they have not been meeting expectations" is a fact.
const NEGATION = /(?:\bnot|n['’]t|\bnever|\bno longer|\bno plans? to)\s+(?:[\w-]+\s+){0,3}?(?:open|clos|consolidat|expan|build|built|construct|automat|relocat|acquir|launch|add|exit)/i;
const HABITUAL = /\b(?:from time to time|ordinary course|normal course|periodically|regularly|continues? to|evaluat(?:e|es|ing))\b/i;

/** Does this sentence state a physical-operations or network change (and is not a financial-statement mention)? */
export function isPhysicalOpsFact(sentence: string): boolean {
  if (NEGATION.test(sentence) || HABITUAL.test(sentence)) return false;
  if (HYPOTHETICAL.test(sentence)) return false;
  if (CONTRACT_CONTEXT.test(sentence)) return false;
  if (hasSpecificSiteChange(sentence)) return true;
  if (isFinancialStatementMention(sentence)) return false;
  if (isNonOperationalContext(sentence)) return false;
  if (isAcquisitionFact(sentence)) return !NON_PHYSICAL_ACQUISITION.test(sentence);
  const physical = sentence.replace(NON_PHYSICAL_NETWORK, ' ');
  return FACILITY.test(physical) && CHANGE.test(physical);
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
