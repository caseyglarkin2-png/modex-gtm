/**
 * H.T4 — "Save this template" bookmarks, persisted in localStorage.
 *
 * Client-only. All accessors are no-throw: a blocked or unavailable
 * localStorage degrades to an empty list rather than breaking the
 * gallery. Stores an array of anchor slugs under a single key.
 */

const KEY = 'yf-saved-templates';

export function getSavedTemplates(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleSavedTemplate(slug: string): string[] {
  const current = getSavedTemplates();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore — bookmark just won't persist this session.
  }
  return next;
}

export function clearSavedTemplates(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
