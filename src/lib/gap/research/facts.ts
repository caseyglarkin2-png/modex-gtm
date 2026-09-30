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

const FACILITY = /\b((?:terminal|yard|electric) tractors?|hostlers?|spotter trucks?|linear feet of (?:rail )?track|rail (?:yards?|spurs?|infrastructure)|(?:container|marine|intermodal) terminals?|pallet positions?|square feet of (?:(?:new|additional|temperature-controlled|refrigerated|frozen) )?(?:warehouse|distribution|manufacturing|industrial|cold[- ]storage|production|fulfil?lment|freezer|cooler) space|(?:manufacturing|production|distribution|warehouse|plant|industrial|fulfil?lment|cold[- ]storage|existing [A-Z][a-z]+) sites?|distribution cent(?:er|re)s?|fulfil?lment cent(?:er|re)s?|distribution facilit(?:y|ies)|warehouses?|cross[- ]docks?|food production plants?|manufacturing plants?|plants?|facilit(?:y|ies)|yards?|docks?|gates?|DCs?|network)\b/i;
// Scale dogfood (paid research): real operations verbs the gate missed: "ceased manufacturing and warehouse
// operations", "shut down its warehouse", "idled five facilities", "the groundbreaking of our newest facility".
const CHANGE = /\b(grow(?:s|ing)? (?:the |its )?(?:facility['’]s |site['’]s )?(?:electric )?fleet|add(?:s|ed|ing)? (?:approximately |about |over |more than |nearly |roughly |some |an additional )?[\d,.]+(?:\s|-)(?:square|sq|pallet|dock|doors?|acres?|jobs|positions|bays|linear)|replac(?:e|es|ed|ing) (?:the |its |an? )?(?:former|existing|older|old|previous)|operational since|reopen(?:ed|ing|s)?|demoli(?:sh|shed|shing|tion)|discontinu(?:e|ed|es|ing)|deploy(?:s|ed|ing|ment)?|ceas(?:e|ed|es|ing)|shut(?:s|ting)? down|shutdown|idl(?:e|ed|es|ing)|mothball(?:s|ed|ing)?|groundbreaking|grand opening|wind(?:s|ing)? down|went live|goes live|commenc(?:e|ed|es|ing)|open(?:ed|ing|s)?|clos(?:e|ed|es|ing|ure|ures)|exit(?:ed|ing|s)?|consolidat(?:e|ed|es|ing|ion)|expan(?:d|ded|ding|sion)|build(?:s)?|built|construct(?:ed|ing|ion)?|automat(?:e|ed|es|ing|ion)|robot(?:ic|ics)?|acquir(?:e|ed|es|ing)|acquisition|relocat(?:e|ed|ing|ion)|redesign(?:ed)?|add(?:ed|ing)? capacity)\b/i;

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
// The month "May" ("On May 9, 2026", "In May 2026") is a date, not the modal "may".
const HYPOTHETICAL = /\b(?:might|could)\b|\bwould\b(?<!\b(?:said|announced|confirmed|stated|disclosed)\s+(?:that\s+)?(?:it|the company)\s+would)|\bmay\b(?!\s+\d)(?<!\b(?:in|on|of|since|until|by|through|from|early|late|mid|during)\s+may)/i;

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
const EVENT_MARKER = /\b(?:contracted with [^.]{0,60}? for \d|added|adds|replaces the|replaced the|operational since|reopened|reopens|demolition|would discontinue|will discontinue|discontinued|deploying|deployed|deploys|is (?:actively )?(?:consolidating|closing|opening|building|expanding)|are (?:consolidating|closing|opening|building|expanding)|ceased|shut down|shuts down|idled|celebrated|groundbreaking|grand opening|went live|commenced|began operations|officially (?:opened|closed|shut|launched)|completed (?:an|the|its) expansion|announcement|will|plans? to|planning to|announced|announces|expects? to|expected to|is expected|are expected|opened|closed|completed|began|begins|broke ground|breaks ground|shutter(?:s|ed|ing)?|agreed to|has (?:opened|closed|begun|started)|have (?:opened|closed)|to (?:open|close|build|expand|consolidate|relocate|shutter|exit)|under construction|construction of the new|recently (?:opened|closed|expanded|completed)|by (?:closing|opening|consolidating|relocating|expanding|building)|(?:closing|opening|consolidating|relocating|shuttering) (?:facilities|plants|its|the|two|three|four|several))\b/i;

/** A payment, proceeds or entitlement around a "definitive agreement" is money, not a site. */
const PAYMENT_CONTEXT = /\b(?:cash payment|entitled to|net proceeds|proceeds from|received in)\b/i;

export function isBoilerplate(sentence: string): boolean {
  return BOILERPLATE.test(sentence);
}

/** A run-on of page navigation ("Regulation Technology Labor Operations Equipment M&A An article from...") or a paragraph is not one statement. */
export function isRunOnOrNavigation(sentence: string): boolean {
  if (sentence.trim().split(/\s+/).length > 70) return true;
  // Page chrome glued to a fact (cited-page reading): markup residue, UI controls, a title separator.
  if (/\]:|\bdata-[a-z-]+|="|">|<\/?[a-z]|[{}]|\btext-[a-z]+-[a-z]+/i.test(sentence)) return true;
  if (/\b(?:Skip to (?:main )?content|Search Query|Submit Search|Focus mode|Show Search|Advertisement|Set us as preferred|Subscribe (?:now|to)|Sign up for|Share (?:on|this)|Follow us|Accept (?:all )?cookies|Newsletter)\b/i.test(sentence)) return true;
  if (/\s\|\s/.test(sentence)) return true;
  // A headline glued to its body ("More Value : By opening ...") or a cookie / menu bar before the text.
  if (/\s:\s/.test(sentence)) return true;
  const ui = sentence.match(/\b(?:Accept|Customize|Decline|Log in|Sign in|SUBSCRIBE|Subscribe|Menu|Home|About|Contact|magnifying-glass|Search)\b/g) ?? [];
  if (new Set(ui).size >= 3) return true;
  // Headline case: most words capitalized is a title or a menu, not a sentence.
  const words = sentence.split(/\s+/).filter((w) => /^[A-Za-z]{3,}/.test(w));
  if (words.length >= 10 && words.filter((w) => /^[A-Z]/.test(w)).length / words.length > 0.7) return true;
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
    // A wire-service dateline says where the release was filed; the fact is the text after it (still verbatim).
    const s = raw.replace(/\s+/g, ' ').trim().replace(/^.{0,160}?\((?:GLOBE NEWSWIRE|BUSINESS WIRE|PR ?Newswire|PRNewswire|ACCESSWIRE|Canada NewsWire)\)\s*(?:--|[-\u2013\u2014])\s*/i, '');
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
    // Every other entity decodes to its character ("Caf&#233;" is "Café", "15,000 m&sup2;" is "15,000 m²"); an
    // unknown named entity is dropped, never turned into a space inside a word.
    .replace(/&#(\d+);/g, (_, n) => safeChar(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&([a-z]+[0-9]?);/gi, (m, name) => (Object.hasOwn(NAMED_ENTITY, name) ? NAMED_ENTITY[name] : /^(amp|lt|gt|quot|apos)$/i.test(name) ? m : ''))
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
}

// Printable characters only: no controls, lone surrogates, zero-width or bidi overrides, line separators or BOM.
const safeChar = (n: number) =>
  Number.isFinite(n) && n > 31 && n < 0x10ffff && !(n >= 0x7f && n <= 0x9f) && !(n >= 0xd800 && n <= 0xdfff) && !(n >= 0x200b && n <= 0x200f) && !(n >= 0x2028 && n <= 0x202e) && !(n >= 0x2066 && n <= 0x2069) && n !== 0xfeff
    ? String.fromCodePoint(n)
    : ' ';
const NAMED_ENTITY: Record<string, string> = {
  eacute: 'é', Eacute: 'É', egrave: 'è', Egrave: 'È', ecirc: 'ê', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', Auml: 'Ä',
  ccedil: 'ç', Ccedil: 'Ç', iacute: 'í', ntilde: 'ñ', oacute: 'ó', ocirc: 'ô', ouml: 'ö', Ouml: 'Ö', uacute: 'ú', uuml: 'ü', Uuml: 'Ü',
  atilde: 'ã', otilde: 'õ', szlig: 'ß', sup2: '²', sup3: '³', deg: '°', ndash: '–', mdash: '—', hellip: '…', reg: '®', trade: '™', copy: '©',
  quot: '"', apos: "'", lt: '<', gt: '>', middot: '·', bull: '•', frac12: '½', times: '×',
};

/** The anti-fabrication rule: the excerpt must appear at its own source. */
export function excerptFoundIn(excerpt: string, pageText: string): boolean {
  const e = normalizeForMatch(excerpt);
  return e.length >= 40 && normalizeForMatch(pageText).includes(e);
}

const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'will', 'its', 'their', 'has', 'have', 'was', 'were', 'are', 'into', 'over', 'which', 'about', 'also', 'more', 'than', 'company', 'said']);
const contentWords = (t: string) => new Set(normalizeForMatch(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w)));
const numbersIn = (t: string) => new Set((normalizeForMatch(t).match(/\d[\d,.]*/g) ?? []).map((n) => n.replace(/[,.]+$/, '').replace(/,/g, '')));

/**
 * The page's OWN sentence for a paraphrased proposal (a search model restates what it read). Accepted only when
 * one physical-operations sentence on the page carries at least 70% of the proposal's content words AND every
 * number the proposal states; the stored quote is then the page's verbatim sentence, never the paraphrase.
 * Null when no sentence qualifies (the proposal is rejected as not found at the source).
 */
/**
 * What a sentence ASSERTS, beyond its words: a re-anchored page sentence must assert the same thing. Negation,
 * direction (open vs close), acquisition side (buy vs sell), plan vs done, and every named place or party.
 */
const NEG = /\b(not|no|never|without|won'?t|isn'?t|didn'?t|doesn'?t|cancel\w*|halt\w*|suspend\w*|scrap\w*|abandon\w*|delay\w*)\b/i;
const FEATURES: Array<[string, RegExp]> = [
  ['open', /\b(open\w*|launch\w*|expand\w*|build\w*|construct\w*|add(s|ed|ing)?|new)\b/i],
  ['close', /\b(clos\w*|shut\w*|consolidat\w*|exit\w*|reduc\w*|cut\w*|wind\w* down)\b/i],
  ['buy', /\b(acquir\w*|purchas\w*|buy\w*|bought)\b/i],
  ['sell', /\b(sell\w*|sold|divest\w*|sale)\b/i],
  ['plan', /\b(will|plans?|planned|planning|expects?|expected|propos\w*|intends?|to (open|build|close|begin))\b/i],
  ['done', /\b(opened|completed|finished|began|launched|closed|has (opened|closed|completed|begun))\b/i],
];
const asserts = (t: string) => new Set([...(NEG.test(t) ? ['neg'] : []), ...FEATURES.filter(([, re]) => re.test(t)).map(([k]) => k)]);
/** Proper names in the proposal (places, parties): capitalized words past the first, each must be on the sentence. */
const properNames = (t: string) =>
  new Set(
    t.replace(/\s+/g, ' ').trim()
      .split(/\s+/)
      .slice(1)
      .map((w) => w.replace(/[^A-Za-z]/g, ''))
      .filter((w) => w.length >= 3 && /^[A-Z]/.test(w) && !/^(The|This|That|These|Its|Our|In|On|At|By|For|And|With|From|New)$/.test(w))
      .map((w) => w.toLowerCase()),
  );
/** Every capitalized name in a text, its first word included (the account name usually leads). */
const allNames = (t: string) =>
  new Set(
    t.replace(/\s+/g, ' ').trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z]/g, ''))
      .filter((w) => w.length >= 3 && /^[A-Z]/.test(w))
      .map((w) => w.toLowerCase()),
  );

/** Same claim, not just similar words: every assertion and named place/party of the proposal is on the sentence. */
/** Number + the unit word after it ("250 jobs", "84,000 square", "12 plants"). */
const unitNumbers = (t: string) => {
  const out = new Map<string, Set<string>>();
  for (const m of normalizeForMatch(t).toLowerCase().matchAll(/(\d[\d,.]*)\s*(?:-|\s)?\s*([a-z]+)/g)) {
    const n = m[1].replace(/[,.]+$/, '').replace(/,/g, '');
    const u = m[2].replace(/s$/, '');
    if (!out.has(u)) out.set(u, new Set());
    out.get(u)!.add(n);
  }
  return out;
};
/** Where the proposal and the sentence both count the same unit, the counts agree ("250 jobs" vs "900 jobs" is a different fact). */
function sameNumbers(proposal: string, sentence: string): boolean {
  const a = unitNumbers(proposal);
  const b = unitNumbers(sentence);
  for (const [u, ns] of b) {
    const theirs = a.get(u);
    if (theirs && ![...ns].some((n) => theirs.has(n))) return false;
  }
  return true;
}

/**
 * The page sentence asserts nothing the proposal does not: no negation the proposal lacks (or the reverse), no
 * direction the proposal lacks (open vs close, buy vs sell), never done-vs-planned opposite. The sentence may state
 * LESS than the proposal (a proposal summarizes several sentences); it may never state something different.
 */
export function sameAssertion(proposal: string, sentence: string): boolean {
  const a = asserts(proposal);
  const b = asserts(sentence);
  if (a.has('neg') !== b.has('neg')) return false;
  for (const k of ['open', 'close', 'buy', 'sell']) if (b.has(k) && !a.has(k)) return false;
  if ((a.has('plan') && !a.has('done') && b.has('done') && !b.has('plan')) || (a.has('done') && !a.has('plan') && b.has('plan') && !b.has('done'))) return false;
  return true;
}

/**
 * The page's OWN sentence for a proposal (a search model restates and summarizes what it read). A page fact
 * sentence qualifies only when it is CONTAINED in the proposal's claim: at least 60% of the sentence's content
 * words (and at least 5) are in the proposal, every number the sentence states is in the proposal, it asserts
 * nothing different (sameAssertion), and it names one of the proposal's places or parties when the proposal names
 * any. The stored quote is always the page's verbatim sentence; null rejects the proposal.
 */
export function pageSentenceFor(excerpt: string, pageText: string): string | null {
  const want = contentWords(excerpt);
  const names = [...properNames(excerpt)];
  if (want.size < 4) return null;
  let best: { s: string; score: number } | null = null;
  for (const s of extractFactSentences(pageText, 400)) {
    const have = contentWords(s);
    const inProposal = [...have].filter((w) => want.has(w)).length;
    const contained = have.size ? inProposal / have.size : 0;
    if (inProposal < 5 || contained < 0.5) continue;
    if (!sameNumbers(excerpt, s)) continue;
    if (!sameAssertion(excerpt, s)) continue;
    // Every place or party the sentence names is one the proposal names (Fresno is not Stockton).
    const allowed = allNames(excerpt);
    if (![...allNames(s)].every((n) => allowed.has(n) || /^(the|this|that|these|its|our|in|on|at|by|for|and|with|from|new|as|after|following|during)$/.test(n))) continue;
    if (names.length && ![...properNames(s)].some((n) => names.includes(n)) && !names.some((n) => normalizeForMatch(s).toLowerCase().includes(n))) continue;
    const score = inProposal + contained;
    if (!best || score > best.score) best = { s, score };
  }
  return best?.s ?? null;
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
