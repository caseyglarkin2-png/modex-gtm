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

/** An acquisition of a company that is not physical network (software, data, media), or of paper and stock, not sites. */
const NON_PHYSICAL_ACQUISITION = /\b(?:software|analytics|technology|tech|apps?|platform|digital|saas|data|media|marketing|fintech|e-commerce|inventory|receivables|securities|shares|stock|notes)\b/i;

/**
 * Signal Intelligence quality review (2026-09-28, the production dogfood's verified facts): filing and legal
 * boilerplate that names a facility word and a change word but states no change to the physical network. Each
 * pattern is from a sentence research verified verbatim and GAP must not treat as a fact:
 *   credit agreements ("the Facility ... Maturity Date", lenders, covenants, leverage ratios), presentation and
 *   accounting notes ("reclassified to conform", segment methodology, equity method, held for sale, fair value,
 *   goodwill), filing headers ("Item 1.01 Entry into a Material Definitive Agreement"), cost lines ("facility
 *   closing costs", "costs related to ... acquisitions") and synthetic leases.
 */
const BOILERPLATE = new RegExp(
  [
    String.raw`\bmaturity date\b`, String.raw`\blenders?\b`, String.raw`\bcovenants?\b`, String.raw`\bleverage ratio\b`, String.raw`\brevolving\b`, String.raw`\bclosing date\b`,
    String.raw`\breclassified\b`, String.raw`\bconform (?:to|with) the\b`, String.raw`\bmethodology\b`, String.raw`\bsegment (?:net )?assets\b`, String.raw`\bequity method\b`, String.raw`\bheld for sale\b`,
    String.raw`\bfair value\b`, String.raw`\bgoodwill\b`, String.raw`\bintangible assets?\b`, String.raw`\bitem \d\.\d\d\b`, String.raw`\bentry into a material definitive agreement\b`,
    String.raw`\bsynthetic lease\b`, String.raw`\bnon-?cancell?able\b`, String.raw`\bclosing costs?\b`, String.raw`\bcosts? (?:related|relating|associated) (?:to|with)\b`, String.raw`\bprofessional fees\b`,
    String.raw`\bterms? (?:and conditions )?(?:of|in effect)\b`, String.raw`\bselects? third-party\b`,
    // second pass over the production sample: accounting lines that slipped the first list
    String.raw`\bpretax\b`, String.raw`\bcapitaliz(?:e|es|ed|ation of) interest\b`, String.raw`\bsame[- ](?:warehouse|store)\b`, String.raw`\bpopulation\b`, String.raw`\brestructuring-related\b`, String.raw`\bnet proceeds\b`, String.raw`\bescrow\b`, String.raw`\bnotes due\b`,
    // evidence integrity review (2026-09-28): accounting policy, and software or management practice (a technology signal, not a physical-network change)
    String.raw`\bdepreciat\w*\b`, String.raw`\buseful lives?\b`, String.raw`\b(?:planning|procurement|analytics|software) platform\b`, String.raw`\bmanagement practices\b`,
  ].join('|'),
  'i',
);

/** The sentence reports an event (it happened, is under way, or is scheduled), not a description. */
const EVENT_MARKER = /\b(?:will|plans? to|planning to|announced|announces|expects? to|expected to|is expected|are expected|opened|closed|completed|began|begins|broke ground|breaks ground|shutter(?:s|ed|ing)?|agreed to|has (?:opened|closed|begun|started)|have (?:opened|closed)|to (?:open|close|build|expand|consolidate|relocate|shutter|exit)|under construction|construction of the new|recently (?:opened|closed|expanded|completed)|by (?:closing|opening|consolidating|relocating|expanding|building)|(?:closing|opening|consolidating|relocating|shuttering) (?:facilities|plants|its|the|two|three|four|several))\b/i;

/** A payment, proceeds or entitlement around a "definitive agreement" is money, not a site. */
const PAYMENT_CONTEXT = /\b(?:cash payment|entitled to|net proceeds|proceeds from|received in)\b/i;

export function isBoilerplate(sentence: string): boolean {
  return BOILERPLATE.test(sentence);
}

/** A run-on of page navigation ("Regulation Technology Labor Operations Equipment M&A An article from...") or a paragraph is not one statement. */
export function isRunOnOrNavigation(sentence: string): boolean {
  if (sentence.trim().split(/\s+/).length > 70) return true;
  if (/\bAn article from\b/.test(sentence)) return true;
  const t = sentence.trim();
  // A page control run into the text ("Learn more News & Media ..."): navigation, not a sentence.
  if (/^(?:Learn more|Read more|Skip to|Back to|See all|View all|Share this)\b/i.test(t)) return true;
  // Six or more capitalized words in a row before any verb-like lowercase word: a menu, not a sentence.
  if (/^(?:[A-Z][\w&.-]*\s+){6,}/.test(t)) return true;
  // The same menu run ANYWHERE, counting "&" as a menu joiner ("News & Media Innovation & Tech PepsiCo").
  return /(?:^|\s)(?:(?:[A-Z][\w.'’-]*|&)\s+){5,}(?:[A-Z][\w.'’-]*|&)(?=\s)/.test(t) && /&/.test(t);
}

/**
 * A sentence that dates its event to an EARLIER year than the source is a past event restated ("On March 12,
 * 2024, we completed the acquisition of Sovos Brands" in a 2026 filing): true, but not something happening now.
 * January and February sources may describe the prior year's December.
 */
export function describesPastEvent(sentence: string, publishedAt: Date): boolean {
  const years = [...sentence.matchAll(/\b(19[5-9]\d|20\d\d)\b/g)].map((m) => Number(m[1]));
  if (!years.length) return false;
  const pubYear = publishedAt.getUTCFullYear();
  const floor = publishedAt.getUTCMonth() <= 1 ? pubYear - 1 : pubYear;
  return Math.max(...years) < floor;
}

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

/**
 * Evidence continuity (2026-09-28): a TRANSPORTATION-network deployment is a physical-network change too
 * ("a multi-year strategic partnership to bring autonomous freight into PepsiCo's supply chain", "Gatik moves
 * freight for PepsiCo across roughly 250 retail locations"). A funding round, a stock story or an analyst's
 * view that mentions the same words is not.
 */
const TRANSPORT = /\b(?:(?:autonomous|driverless|self-driving)\s+(?:freight|trucks?|trucking|delivery|vehicles?)|moves? freight|(?:private|dedicated) fleets?|linehaul|middle[- ]mile|transportation networks?|regional (?:transportation )?networks?)\b/i;
const TRANSPORT_ACTION = /\b(?:deploy\w*|operat\w*|moves? freight|serv(?:e|es|ing)|runs|running|launch\w*|bring|brings|partnership|roll(?:ing)? out|rollout|expan\w*|convert\w*)\b/i;
const FUNDING_OR_MARKET = /\b(?:raises?|raised|funding|series [a-f]\b|valuation|shares|stock|analysts?|investors?|price target)\b/i;

export function isTransportNetworkFact(sentence: string): boolean {
  return TRANSPORT.test(sentence) && TRANSPORT_ACTION.test(sentence) && !FUNDING_OR_MARKET.test(sentence);
}

/** Does this sentence state a physical-operations or network change (and is not a financial-statement mention)? */
export function isPhysicalOpsFact(sentence: string): boolean {
  if (NEGATION.test(sentence) || HABITUAL.test(sentence)) return false;
  if (isBoilerplate(sentence) || isRunOnOrNavigation(sentence)) return false;
  if (isTransportNetworkFact(sentence)) return true;
  if (HYPOTHETICAL.test(sentence)) return false;
  if (CONTRACT_CONTEXT.test(sentence)) return false;
  if (hasSpecificSiteChange(sentence)) return true;
  if (isFinancialStatementMention(sentence)) return false;
  if (isNonOperationalContext(sentence)) return false;
  if (isAcquisitionFact(sentence)) return !NON_PHYSICAL_ACQUISITION.test(sentence) && !PAYMENT_CONTEXT.test(sentence);
  const physical = sentence.replace(NON_PHYSICAL_NETWORK, ' ');
  // Quality review: a facility word and a change word are not an EVENT. "Our parts distribution centers are
  // involved in storage", "operating a network of 26 distribution centers" and "a supply chain built for the
  // future" describe; a fact states that something happened, is happening, or is scheduled.
  return FACILITY.test(physical) && CHANGE.test(physical) && EVENT_MARKER.test(sentence);
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

const NAMED_SITE = /\b(?:distribution cent(?:er|re)s?|fulfil?lment cent(?:er|re)s?|warehouses?|plants?|facilit(?:y|ies)|yards?|DCs?|hubs?)\b/i;
const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/**
 * Evidence integrity review (2026-09-28): a filing restates an earlier event ("On July 1, 2026, we announced
 * ..." in a September 10-Q). The source date is when it was PUBLISHED; the evidence clock runs from the event
 * date the sentence itself states, when that is more than a week earlier. A future date (a plan) or the
 * source's own dateline never counts.
 */
export function statedEventDate(sentence: string, publishedAt: Date): Date | null {
  const re = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})\b/gi;
  let latest: Date | null = null;
  for (const m of sentence.matchAll(re)) {
    const d = new Date(Date.UTC(Number(m[3]), MONTH_NAMES.indexOf(m[1].toLowerCase()), Number(m[2])));
    if (Number.isNaN(d.getTime()) || d.getTime() > publishedAt.getTime()) continue;
    if (!latest || d > latest) latest = d;
  }
  return latest && publishedAt.getTime() - latest.getTime() > 7 * 86_400_000 ? latest : null;
}

export function classifyFact(sentence: string): FactClassification {
  const s = sentence.toLowerCase();
  // A transportation-network deployment with no named site is not a site opening ("builds on ... private
  // fleets and brings Gatik's autonomous freight ..." once read as `build` = opening).
  if (isTransportNetworkFact(sentence) && !NAMED_SITE.test(sentence)) {
    return /autonom|driverless|self-driving/.test(s) ? { type: 'automation_program', change: 'automation' } : { type: 'site_expansion', change: 'investment' };
  }
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
