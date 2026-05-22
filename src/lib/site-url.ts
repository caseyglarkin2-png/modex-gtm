function normalizeUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

export function getSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (configured) {
    return normalizeUrl(configured);
  }

  return 'http://localhost:3000';
}

/** Get the base URL for public microsites (yardflow.ai or fallback to app URL). */
export function getMicrositeBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MICROSITE_BASE_URL || getSiteUrl();
}

/** Build a full microsite URL for an account slug. */
export function getMicrositeUrl(slug: string, personSlug?: string): string {
  const base = getMicrositeBaseUrl();
  if (personSlug) {
    return `${base}/for/${slug}/${personSlug}`;
  }
  return `${base}/for/${slug}`;
}

/**
 * Build a full demo URL for an account slug. Lives on the same canonical
 * base as the microsite (yardflow.ai) so the browser origin matches
 * `/roi/` and same-origin localStorage tricks work (D8.1: ROI pre-fill).
 *
 * Optional query params: `site` to deep-link to a facility,
 * `play=1` to auto-open the driver-journey replay,
 * `view=sim` to land on the simulator tab.
 */
export function getDemoUrl(
  slug: string,
  opts?: { site?: string; play?: boolean; view?: 'atlas' | 'sim' },
): string {
  const base = getMicrositeBaseUrl();
  const params = new URLSearchParams();
  if (opts?.site) params.set('site', opts.site);
  if (opts?.play) params.set('play', '1');
  if (opts?.view) params.set('view', opts.view);
  const qs = params.toString();
  return qs ? `${base}/demo/${slug}?${qs}` : `${base}/demo/${slug}`;
}

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}

/**
 * Build an absolute URL against the public microsite base (yardflow.ai),
 * not the app base (modex-gtm.vercel.app). Use this for share / OG /
 * canonical URLs on prospect-facing routes (/for, /demo, /proposal).
 * Internal admin routes should still use buildAbsoluteUrl().
 */
export function buildMicrositeAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getMicrositeBaseUrl()).toString();
}