/**
 * Sprint G8 — Gallery campaign-pin override (Casey's "more control" call).
 *
 * Reads an optional list of pinned anchor slugs from Vercel Edge Config.
 * When the list is set + non-empty, the matching anchors render at the
 * front of the gallery in the listed order. The remaining anchors keep
 * their `industry-tags.ts` array order.
 *
 * No deploy needed to flip the pin order. Set/clear in 30 seconds via
 * the Vercel dashboard. Documented setup in
 * `docs/gallery-pin-edge-config.md`.
 *
 * Edge Config key: `gallery_pinned_slugs`
 * Value shape: string[] of anchor slugs, in priority order
 * Example:
 *   ["walmart-campaign-anchor", "ford"]
 *
 * Graceful fallback paths:
 *   - EDGE_CONFIG env var unset → return null → insertion order
 *   - Edge Config unreachable (transient) → return null → insertion order
 *   - Key missing → return null → insertion order
 *   - Key present but value is not a string[] → log + return null
 *   - Listed slug is not in INDUSTRY_ANCHORS → silently ignored
 *
 * Read is server-side, runs once per gallery render. Edge Config
 * lookups are sub-50ms typically.
 */

import { get } from '@vercel/edge-config';

const PIN_KEY = 'gallery_pinned_slugs';

export async function readPinnedSlugs(): Promise<string[] | null> {
  // No Edge Config wired (local dev, or modex-gtm not yet connected
  // to the store) → behave exactly like today.
  if (!process.env.EDGE_CONFIG) return null;

  let raw: unknown;
  try {
    raw = await get(PIN_KEY);
  } catch {
    // Transient Edge Config failure: fail safe to insertion order.
    return null;
  }

  if (!Array.isArray(raw)) return null;
  const slugs = raw.filter((s): s is string => typeof s === 'string' && s.length > 0);
  return slugs.length > 0 ? slugs : null;
}

/**
 * Apply pin order on top of the default anchor order.
 *
 * For each pinned slug that matches an anchor in the input array, move
 * it to the front, in the order it appears in `pinnedSlugs`. Anchors
 * not in the pin list keep their original relative order behind the
 * pinned set.
 */
export function applyPinOrder<T extends { slug: string }>(
  anchors: ReadonlyArray<T>,
  pinnedSlugs: string[] | null,
): T[] {
  if (!pinnedSlugs || pinnedSlugs.length === 0) return [...anchors];
  const bySlug = new Map(anchors.map((a) => [a.slug, a] as const));
  const pinned: T[] = [];
  for (const slug of pinnedSlugs) {
    const a = bySlug.get(slug);
    if (a) {
      pinned.push(a);
      bySlug.delete(slug);
    }
  }
  const rest = anchors.filter((a) => bySlug.has(a.slug));
  return [...pinned, ...rest];
}
