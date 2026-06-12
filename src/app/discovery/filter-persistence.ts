/**
 * Persist the worklist filter set so /discovery opens on Casey's last view each
 * morning, the same way the weighting preset already persists (Sprint 6.3).
 *
 * Rule: the URL wins. When the page is opened with any filter param (a shared or
 * refreshed link), that view is authoritative and we do NOT restore from storage
 * — see urlHasFilters. Otherwise we restore the saved filters on mount.
 */

export const FILTER_STORAGE_KEY = 'discovery.filters';

export interface PersistedFilters {
  tier: string | null;
  corridor: string | null;
  segment: string | null;
  minScore: number | null;
  /** true when widened to all sites (the daily slice is off). */
  all: boolean;
  /** true when narrowed to rows with no known contacts. */
  needsContacts: boolean;
}

/** The URL params that, when present, make the URL authoritative for the view. */
const FILTER_URL_KEYS = ['tier', 'corridor', 'segment', 'minScore', 'all', 'needsContacts'] as const;

/**
 * True when the URL already carries any filter param — then the URL is the
 * source of truth for this view and stored filters must not override it.
 */
export function urlHasFilters(get: (key: string) => string | null): boolean {
  return FILTER_URL_KEYS.some((k) => get(k) != null);
}

export function serializeFilters(f: PersistedFilters): string {
  return JSON.stringify(f);
}

/**
 * Safely parse stored filters, coercing each field to its expected type so a
 * malformed or stale payload can never crash the page. Returns null when the
 * input is empty, not valid JSON, or not a plain object.
 */
export function parseStoredFilters(raw: string | null): PersistedFilters | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  const o = parsed as Record<string, unknown>;
  return {
    tier: typeof o.tier === 'string' ? o.tier : null,
    corridor: typeof o.corridor === 'string' ? o.corridor : null,
    segment: typeof o.segment === 'string' ? o.segment : null,
    minScore: typeof o.minScore === 'number' && Number.isFinite(o.minScore) ? o.minScore : null,
    all: o.all === true,
    needsContacts: o.needsContacts === true,
  };
}
