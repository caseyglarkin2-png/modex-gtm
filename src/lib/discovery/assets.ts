/**
 * Resolve a discovered prospect to a YardFlow microsite slug, so the worklist
 * can link a row to its /for and /demo assets — but only when a microsite
 * actually exists (those routes 404 otherwise). Conservative by design: we link
 * on an existing-account match, the full brand name, or a *distinctive leading*
 * brand token — never a generic word like "home" or "depot" (no false links).
 *
 * The pure functions take the registry as data so they're unit-testable (no
 * heavy registry import here); `data.ts` binds them to the real registry.
 */

export interface MicrositeEntry {
  slug: string;
  accountName: string;
}

// Common / generic words that must never become a single-token brand key.
const COMMON_WORDS = new Set([
  'the', 'and', 'of', 'for', 'food', 'foods', 'home', 'general', 'performance',
  'american', 'national', 'united', 'global', 'supply', 'chain', 'group',
  'logistics', 'services', 'service', 'company', 'distribution', 'center',
  'warehouse', 'international', 'holdings', 'brands', 'north', 'america',
]);

// Places / directionals / generic geo words — common in facility names, never a
// brand on their own (e.g. "Cold Storage, Georgia" ≠ Georgia-Pacific;
// "Foodbank of Southern California" ≠ Southern Glazer's).
const PLACE_WORDS = new Set([
  // states
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'hampshire',
  'jersey', 'mexico', 'york', 'carolina', 'dakota', 'ohio', 'oklahoma', 'oregon',
  'pennsylvania', 'rhode', 'tennessee', 'texas', 'utah', 'vermont', 'virginia',
  'washington', 'wisconsin', 'wyoming', 'boston', 'dallas', 'houston',
  // directionals / generic geo
  'southern', 'northern', 'eastern', 'western', 'central', 'south', 'north', 'east',
  'west', 'greater', 'metro', 'valley', 'coastal', 'atlantic', 'pacific', 'mountain',
  'midwest', 'americas', 'tristate', 'regional', 'county', 'state',
]);

/** A single-token key is only safe if it is distinctive: ≥5 chars and not a place/direction. */
function isSafeSingleToken(token: string): boolean {
  return token.length >= 5 && !PLACE_WORDS.has(token);
}

/** Lowercase, de-accent, strip punctuation, collapse whitespace. */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Build a brand-key → slug index from the microsite registry. */
export function buildBrandIndex(entries: MicrositeEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  // Multi-word keys (full names, slug phrases) are specific and always allowed;
  // single-word keys must clear isSafeSingleToken to avoid place/word collisions.
  const add = (key: string, slug: string) => {
    if (map.has(key)) return;
    const single = !key.includes(' ');
    if (single && !isSafeSingleToken(key)) return;
    if (key.length < 3) return;
    map.set(key, slug);
  };
  for (const e of entries) {
    const full = norm(e.accountName);
    add(full, e.slug);
    add(e.slug.replace(/-/g, ' '), e.slug);
    const firstWord = full.split(' ')[0];
    if (firstWord && !COMMON_WORDS.has(firstWord)) add(firstWord, e.slug);
  }
  return map;
}

/** The slug for a prospect, or null when no microsite confidently matches. */
export function resolveMicrositeSlug(
  name: string,
  existingSlug: string | undefined,
  index: Map<string, string>,
  validSlugs: Set<string>,
): string | null {
  if (existingSlug && validSlugs.has(existingSlug)) return existingSlug;
  const n = norm(name);
  // Longest key first so a full brand name wins over its leading token.
  const keys = [...index.keys()].sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (re.test(n)) return index.get(key) ?? null;
  }
  return null;
}
