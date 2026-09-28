/**
 * EVIDENCE CONTINUITY (2026-09-28). Two different questions, two clocks:
 *
 *   SIGNAL FRESHNESS   should this event create a fresh trigger / alert NOW?
 *                      (signals/promote.ts: 21 days from publication; unchanged)
 *   EVIDENCE VALIDITY  is the underlying operating fact still true enough to
 *                      support an observation today?
 *
 * A fact is one of (deterministic, from its own words; no model, no score):
 *   EVENT            a point-in-time occurrence ("opened a DC on March 3")
 *   ONGOING_STATE    a condition described as continuing ("a multi-year
 *                    partnership", "is already operating", "moves freight for")
 *   ENDED            the condition ended ("ended its pilot", "no longer")
 * An ONGOING_STATE fact stays current past its own clock only when a NEWER,
 * independent source says the same program still operates (same distinctive
 * program name, present-tense operation, naming the account). Continuity never
 * comes from an old source's own wording ("multi-year" in 2023 is not proof in
 * 2026). A newer source saying the program ended SUPERSEDES it.
 * Seller relevance is separate from truth: it orders facts for a first touch,
 * it never changes whether a fact is verified.
 */
import { freshnessExpiresAt } from '../signals/freshness';
import type { SignalType } from '../taxonomy';

export type ContinuityKind = 'event' | 'ongoing_state' | 'ended';

const ENDED = /\b(?:ended|ends|terminated|terminates|discontinued|discontinues|wound down|winding down|no longer|ceased|ceases|paused|suspended|halted|shut down|exited|pulled out of)\b/i;
const ONGOING = /\b(?:multi-?year|ongoing|already operating|is operating|are operating|currently (?:operat\w*|serv\w*|run\w*|us\w*)|continues? to|continuing|under construction|in progress|rolling out|is being|are being|moves? freight|operates|still operat\w*|remains? (?:in operation|operational|active))\b/i;

/** How the sentence describes its change: a one-time event, a continuing state, or an ended one. */
export function classifyContinuity(sentence: string): ContinuityKind {
  if (ENDED.test(sentence)) return 'ended';
  if (ONGOING.test(sentence)) return 'ongoing_state';
  return 'event';
}

/** A present-tense statement that the program operates NOW (what a currentness corroboration must say). */
const OPERATES_NOW = /\b(?:moves? freight|is (?:already |still |now )?operating|are (?:already |still |now )?operating|operates|currently \w+|continues? to|still \w+|remains? (?:in operation|operational|active)|(?:now )?(?:runs|serves))\b/i;

const MONTHS = 'january|february|march|april|may|june|july|august|september|october|november|december';
const STATES =
  'alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|hampshire|jersey|mexico|york|carolina|dakota|ohio|oklahoma|oregon|pennsylvania|rhode|island|tennessee|texas|utah|vermont|virginia|washington|wisconsin|wyoming';
const NOT_A_PROGRAM = new Set(
  [...MONTHS.split('|'), ...STATES.split('|'), 'north', 'south', 'east', 'west', 'america', 'american', 'united', 'states', 'today', 'the', 'this', 'that', 'these', 'it', 'in', 'on', 'a', 'an', 'our', 'we', 'its', 'as', 'at', 'for', 'and', 'senior', 'vice', 'president', 'chief', 'officer', 'ceo', 'supply', 'chain', 'freightwaves', 'reuters', 'inc', 'corp', 'company'],
);

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

/** The distinctive proper nouns a sentence names (a partner, a program, a site), not the account, places or months. */
export function programKeys(sentence: string, accountName: string): Set<string> {
  const account = new Set(words(accountName));
  const out = new Set<string>();
  for (const m of sentence.matchAll(/\b([A-Z][A-Za-z]{2,})(?:['’]s)?\b/g)) {
    const w = m[1].toLowerCase();
    if (NOT_A_PROGRAM.has(w) || account.has(w) || [...account].some((a) => w.startsWith(a) && a.length >= 4)) continue;
    out.add(w);
  }
  return out;
}

const namesAccount = (sentence: string, accountName: string) => ` ${words(sentence).join(' ')} `.includes(` ${words(accountName).join(' ')} `);
const shares = (a: Set<string>, b: Set<string>) => [...a].some((x) => b.has(x));

export interface DatedFact {
  excerpt: string;
  publishedAt: Date;
}

/** Does a NEWER source establish that the older ongoing fact's program still operates? */
export function corroboratesCurrentness(older: DatedFact, newer: DatedFact, accountName: string): boolean {
  if (newer.publishedAt.getTime() <= older.publishedAt.getTime()) return false;
  if (classifyContinuity(older.excerpt) !== 'ongoing_state') return false;
  if (classifyContinuity(newer.excerpt) === 'ended' || !OPERATES_NOW.test(newer.excerpt)) return false;
  if (!namesAccount(newer.excerpt, accountName)) return false;
  return shares(programKeys(older.excerpt, accountName), programKeys(newer.excerpt, accountName));
}

/** Does a NEWER source say the older fact's program ended? */
export function supersedes(older: DatedFact, newer: DatedFact, accountName: string): boolean {
  if (newer.publishedAt.getTime() <= older.publishedAt.getTime()) return false;
  if (classifyContinuity(newer.excerpt) !== 'ended') return false;
  if (!namesAccount(newer.excerpt, accountName)) return false;
  return shares(programKeys(older.excerpt, accountName), programKeys(newer.excerpt, accountName));
}

/** The OUTREACH EVIDENCE clock: the type's window from the newest currentness evidence (the corroboration, else the source). */
export function outreachCurrentUntil(type: SignalType, publishedAt: Date, corroboratedAt: Date | null): Date {
  return freshnessExpiresAt(type, corroboratedAt && corroboratedAt > publishedAt ? corroboratedAt : publishedAt);
}

/** An ongoing fact whose own clock ends within this window is worth a currentness check. */
export const CORROBORATION_CHECK_AFTER_MS = 45 * 86_400_000;

export interface ContinuityRecord {
  kind: ContinuityKind;
  primary: { signalId: string; url: string | null; title: string; publishedAt: string };
  currentness: { url: string | null; title: string; publishedAt: string; excerpt: string } | null;
  establishedAt: string;
}

// ---------------------------------------------------------------- seller relevance (not truth)

const INTERNATIONAL = /\b(?:india|china|brazil|mexico|europe|european|uk|united kingdom|england|scotland|spain|germany|france|italy|africa|african|asia|asian|japan|australia|indonesia|philippines|vietnam|bengaluru|karnataka|iberia)\b/i;
const DIVEST = /\b(?:sell|sells|sold|sale of|selling|divest\w*|dispos\w*|spin[- ]?off)\b/i;
const LEGAL = /\b(?:definitive agreement|plan of merger|agreement and plan|merger agreement)\b/i;
const BROAD = /\b(?:restructuring|cost savings|workforce reduction|layoffs?)\b/i;
const NETWORK = /\b(?:network|transportation|autonomous|driverless|fleet|linehaul|routes?|middle[- ]mile|moves? freight)\b/i;
const NETWORK_ACTION = /\b(?:redesign\w*|transform\w*|deploy\w*|operat\w*|partnership|multi-?year|moves? freight|consolidat\w*|optimiz\w*)\b/i;
const SITE = /\b(?:distribution cent(?:er|re)s?|fulfil?lment cent(?:er|re)s?|warehouses?|plants?|yards?|docks?|DCs?|cross[- ]docks?|facilit(?:y|ies))\b/i;
const AUTOMATION = /\b(?:automat\w*|robot\w*)\b/i;

export interface SellerRelevance {
  bucket: 'best' | 'context';
  rank: number;
  reason: string;
}

/**
 * Deterministic first-touch ordering. BEST: ongoing physical network transformation (1), a distribution /
 * warehouse / plant / yard change (2), an automation program (3). CONTEXT (still verified, never hidden): a
 * divestiture, legal transaction text, activity outside the US, a broad restructuring.
 */
export function sellerRelevance(excerpt: string): SellerRelevance {
  if (INTERNATIONAL.test(excerpt)) return { bucket: 'context', rank: 8, reason: 'activity outside the US network' };
  if (DIVEST.test(excerpt)) return { bucket: 'context', rank: 7, reason: 'a divestiture or sale' };
  if (LEGAL.test(excerpt) && !NETWORK.test(excerpt)) return { bucket: 'context', rank: 6, reason: 'legal transaction text' };
  if (BROAD.test(excerpt) && !SITE.test(excerpt)) return { bucket: 'context', rank: 6, reason: 'a broad corporate restructuring' };
  if (NETWORK.test(excerpt) && NETWORK_ACTION.test(excerpt)) return { bucket: 'best', rank: 1, reason: 'a physical network transformation' };
  if (SITE.test(excerpt)) return { bucket: 'best', rank: 2, reason: 'a distribution, warehouse, plant or yard change' };
  if (AUTOMATION.test(excerpt)) return { bucket: 'best', rank: 3, reason: 'an automation program' };
  return { bucket: 'context', rank: 5, reason: 'technically physical, low relevance' };
}
