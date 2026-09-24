/**
 * GAP Prospecting OS: pure company-name normalization (Sprint 6A).
 *
 * The lowest-precedence identity tier (see resolve.ts). Strips punctuation,
 * a leading "The", and trailing legal-entity suffix tokens (Inc, LLC, Corp,
 * Ltd, Co, ...) so "Niagara Bottling, Llc" and "Niagara Bottling" fold to the
 * same key. Deterministic string normalization only, never fuzzy/edit-distance
 * matching: the goal is exact identity, not a guess.
 *
 * Pure: no I/O, no clock reads, safe to call from anywhere.
 */

const LEGAL_SUFFIX_TOKENS = new Set([
  'inc',
  'incorporated',
  'llc',
  'lc',
  'llp',
  'lp',
  'ltd',
  'limited',
  'co',
  'company',
  'corp',
  'corporation',
  'plc',
  'pllc',
  'pc',
]);

/**
 * Fold a company display name to a normalization key: lowercase, "&" to
 * "and", punctuation to spaces, a leading "the" dropped, trailing legal
 * suffix tokens stripped (repeatedly, so "Acme Holdings Corp Inc" -> "acme
 * holdings"). Never strips the last remaining token, so a name that is
 * itself only a suffix word ("Inc") still normalizes to something.
 */
export function normalizeCompanyName(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/&/g, ' and ');
  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/^the\s+/, '');
  const tokens = s.split(/\s+/).filter(Boolean);
  while (tokens.length > 1 && LEGAL_SUFFIX_TOKENS.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}
