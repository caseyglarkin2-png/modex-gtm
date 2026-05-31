/**
 * F.T8 — Gallery runtime flags from Vercel Edge Config.
 *
 * Currently exposes the "audits completed this quarter" counter shown in
 * the gallery hero. The audit team bumps the number weekly from the same
 * Vercel dashboard Items page used for `gallery_pinned_slugs` (store
 * `YardFlow-Feature-Flags-final`, id ecfg_m6qgrvot96umnc9sv1qk89xzcs8b).
 *
 * Graceful by design: any unset/invalid/unreachable case returns null so
 * the hero simply omits the line. Never throws, never blocks the render.
 *
 * Edge Config key: `audits_completed_this_quarter` (positive integer)
 */

import { get } from '@vercel/edge-config';

const AUDITS_KEY = 'audits_completed_this_quarter';

export async function readAuditsThisQuarter(): Promise<number | null> {
  if (!process.env.EDGE_CONFIG) return null;
  let raw: unknown;
  try {
    raw = await get(AUDITS_KEY);
  } catch {
    return null;
  }
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}
