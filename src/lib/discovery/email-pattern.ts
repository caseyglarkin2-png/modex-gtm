/**
 * Email-pattern inference (pure, no I/O).
 *
 * Casey's prospecting play without enrichment credits: find the right person via
 * research, then infer their email from the pattern of emails we already have at
 * that company. This module detects a company's email pattern from known
 * {name,email} samples and applies it to a new name — or uses a researched
 * fallback pattern — and reports how confident we should be.
 */

export type EmailPattern =
  | 'first.last'
  | 'firstlast'
  | 'flast'
  | 'f.last'
  | 'first_last'
  | 'first'
  | 'last.first'
  | 'lastfirst'
  | 'firstl';

/** All patterns we try to detect, ordered most-distinctive first (tie-break). */
const PATTERNS: EmailPattern[] = [
  'first.last',
  'first_last',
  'f.last',
  'last.first',
  'firstlast',
  'lastfirst',
  'flast',
  'firstl',
  'first',
];

/** Lowercase, de-accent, strip everything but a–z. */
export function normalizeNamePart(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function localPart(first: string, last: string, pattern: EmailPattern): string | null {
  const f = normalizeNamePart(first);
  const l = normalizeNamePart(last);
  if (!f || !l) {
    // `first`-only pattern can work with just a first name
    if (pattern === 'first' && f) return f;
    return null;
  }
  const fi = f[0];
  const li = l[0];
  switch (pattern) {
    case 'first.last': return `${f}.${l}`;
    case 'firstlast': return `${f}${l}`;
    case 'flast': return `${fi}${l}`;
    case 'f.last': return `${fi}.${l}`;
    case 'first_last': return `${f}_${l}`;
    case 'first': return f;
    case 'last.first': return `${l}.${f}`;
    case 'lastfirst': return `${l}${f}`;
    case 'firstl': return `${f}${li}`;
  }
}

/** Build a full address for a name + domain under a pattern. */
export function applyPattern(first: string, last: string, domain: string, pattern: EmailPattern): string {
  const local = localPart(first, last, pattern);
  return `${local ?? normalizeNamePart(first)}@${domain.replace(/^@/, '')}`;
}

export interface NameEmailSample {
  firstName: string;
  lastName: string;
  email: string;
}

export interface PatternMatch {
  pattern: EmailPattern;
  /** Fraction of samples this pattern explains (0..1). */
  matchRate: number;
  /** Number of usable samples considered. */
  n: number;
}

/** Detect the dominant email pattern from known {name,email} samples at one domain. */
export function detectPattern(samples: NameEmailSample[]): PatternMatch | null {
  const usable = samples.filter(
    (s) => normalizeNamePart(s.firstName) && normalizeNamePart(s.lastName) && s.email.includes('@'),
  );
  if (usable.length === 0) return null;

  let best: PatternMatch | null = null;
  for (const pattern of PATTERNS) {
    let hits = 0;
    for (const s of usable) {
      const actual = s.email.split('@')[0].toLowerCase();
      if (localPart(s.firstName, s.lastName, pattern) === actual) hits += 1;
    }
    if (hits === 0) continue;
    const matchRate = hits / usable.length;
    if (!best || matchRate > best.matchRate) {
      best = { pattern, matchRate, n: usable.length };
    }
  }
  return best;
}

export type InferConfidence = 'high' | 'medium' | 'low' | 'none';

export interface InferredEmail {
  email: string | null;
  confidence: InferConfidence;
  /** Human-readable basis, e.g. "from 4 known emails" / "researched pattern". */
  basis: string;
  pattern?: EmailPattern;
}

/**
 * Infer an email for a new person — always offer the best guess when there's any
 * basis (real conventions are mixed; the composer is the review gate).
 *  - high   — ≥2 corpus samples, one pattern explains ≥80% (clean convention)
 *  - medium — a clear plurality pattern (≥45% of ≥2 samples) OR a researched pattern
 *  - low    — a pattern from a single sample, or a weak plurality
 *  - none   — no pattern detected and no researched fallback → email null
 */
export function inferEmail(
  first: string,
  last: string,
  domain: string,
  opts: { samples?: NameEmailSample[]; storedPattern?: EmailPattern },
): InferredEmail {
  const detected = opts.samples?.length ? detectPattern(opts.samples) : null;

  if (detected) {
    const email = applyPattern(first, last, domain, detected.pattern);
    const basis = `from ${detected.n} known ${domain} email${detected.n === 1 ? '' : 's'} (${Math.round(detected.matchRate * 100)}% ${detected.pattern})`;
    let confidence: InferConfidence;
    if (detected.n >= 2 && detected.matchRate >= 0.8) confidence = 'high';
    else if (detected.n >= 2 && detected.matchRate >= 0.45) confidence = 'medium';
    else confidence = 'low';
    return { email, confidence, basis, pattern: detected.pattern };
  }

  if (opts.storedPattern) {
    return {
      email: applyPattern(first, last, domain, opts.storedPattern),
      confidence: 'medium',
      basis: 'researched pattern',
      pattern: opts.storedPattern,
    };
  }

  return { email: null, confidence: 'none', basis: 'no known emails at this company' };
}
