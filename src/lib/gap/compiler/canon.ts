/**
 * GAP message compiler: the number canon and Primo phrasing rules as data
 * (Sprint 3, S3-T6). Spec section 0 (number canon) and section 8 (C01, C05).
 *
 * Source of the rules: top100/CLAIMS.md rows CR-001, CR-002, CR-004, CR-005,
 * CR-007 and the "How to phrase Primo proof" ladder. Every figure carries the
 * qualifier it must travel with and the qualifiers that are forbidden next to
 * it. Checks consume this table; nothing here reads I/O.
 *
 * Phrasing is judged per sentence with a nearest-qualifier rule: the required
 * phrasing must appear somewhere in the sentence, and when a forbidden word
 * also appears, the one closer to the figure wins. This lets the canonical
 * "260 sites under contract, with 24 live today" pass while "260 live" and
 * "$1M+ per site, measured" fail.
 */

export interface CanonNumber {
  /** Stable label used in check details. */
  label: string;
  /** Matches the figure itself (evaluated per sentence, global flag set). */
  pattern: RegExp;
  /** Qualifier the figure must travel with (case-insensitive). */
  requiredPhrasing: RegExp;
  /** Human form of the required qualifier for check details. */
  requiredLabel: string;
  /** Qualifiers that must not sit closer to the figure than the required one. */
  forbiddenPhrasing: RegExp;
}

export const CANON_NUMBERS: readonly CanonNumber[] = [
  {
    label: 'turn_time',
    pattern: /\b48\b[^.!?\n]*?\b24\b|\b24\b[^.!?\n]*?\b48\b/g,
    requiredPhrasing: /\bmeasured\b/i,
    requiredLabel: 'measured',
    forbiddenPhrasing: /\bprove[dn]\b|\bguaranteed\b|\bmodeled\b|\bmodelled\b/i,
  },
  {
    label: 'volume_lift',
    pattern: /\b5\s?%|\bfive percent\b|\b5 percent\b/gi,
    requiredPhrasing: /\bobserved\b/i,
    requiredLabel: 'observed',
    forbiddenPhrasing: /\bmeasured\b|\bprove[dn]\b|\bguaranteed\b|\bevery (?:site|location|facility|plant)\b|\beverywhere\b/i,
  },
  {
    label: 'sites_live',
    pattern: /\b24\s+(?:live\s+)?(?:sites?|plants?|DCs?|facilities|Primo(?:\s+Brands)?)\b|\b24\s+(?:of\s+(?:those|the|its|their)\s+260|live)\b/gi,
    requiredPhrasing: /\blive\b|\brun(?:s|ning)?\b|\bdeployed\b/i,
    requiredLabel: 'live',
    forbiddenPhrasing: /\bcommitted\b|\bcontracted\b|\bunder contract\b/i,
  },
  {
    label: 'committed_network',
    pattern: /\b260(?:-site)?\b/g,
    requiredPhrasing: /\bcommitted\b|\bcontracted\b|\bunder contract\b/i,
    requiredLabel: 'committed or contracted',
    forbiddenPhrasing: /\blive\b|\bdeployed\b|\brolled out\b|\brolling out\b|\brunning\b/i,
  },
  {
    label: 'modeled_per_site',
    pattern: /\$\s?1\s?M\+?(?!\S)|\$\s?1\s?M\+?\b|\$1,000,000\b|\$1 million\b/gi,
    requiredPhrasing: /\bmodel(?:ed|led)\b/i,
    requiredLabel: 'modeled',
    forbiddenPhrasing: /\bmeasured\b|\bprove[dn]\b|\bguaranteed\b/i,
  },
];

/** Primo Brands is the only customer that may be named next to a result. */
export const PRIMO_NAMEABLE = true;
export const PUBLIC_REFERENCE_CUSTOMERS: readonly string[] = ['Primo', 'Primo Brands'];

/** Our own names. They are never pipeline accounts even when a lane list carries them. */
export const OWN_NAMES: readonly string[] = ['YardFlow', 'FreightRoll', 'YardFlow by FreightRoll'];

/**
 * Number tokens that must be backed by a cited title or the canon. Alternation
 * order matters: money, percent, unit count (one optional adjective before the
 * unit, as in "110 dock doors"), then bare count. A bare count is
 * two or more digits (with thousands separators); four-digit years 1900-2099
 * are excluded because a year is a date, not a count.
 */
export const NUMBER_TOKEN_RE =
  /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?[KMB]\+?|\+)?|\d+(?:\.\d+)?\s?%|\b\d[\d,]*(?:\.\d+)?\s+(?:[a-z-]+\s+)?(?:sites?|minutes?|mins?|doors?|spots?|trailers?|plants?|DCs?|facilities|facility)\b|\b(?!(?:19|20)\d{2}\b)\d{2,}(?:,\d{3})*\b/gi;

/** The digits of a token with currency, separators, units and suffixes removed (for title matching). */
export function tokenDigits(token: string): string {
  return token
    .replace(/[$,%\s]/g, '')
    .replace(/[KMB]\+?$/i, '')
    .replace(/\+$/, '')
    .replace(/[A-Za-z].*$/, '');
}
