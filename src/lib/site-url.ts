function normalizeUrl(value: string): string {
  const compact = value.replace(/\s+/g, '');
  if (/^https?:\/\//i.test(compact)) {
    return compact;
  }

  return `https://${compact}`;
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

/**
 * Base URL for public prospect-facing routes (/for, /demo, /proposal). These
 * are shown under yardflow.ai via the Flow-State- rewrite, so their canonical +
 * OG URLs must be yardflow.ai, NOT the modex-gtm Vercel origin. Defaulting to
 * getSiteUrl() (VERCEL_PROJECT_PRODUCTION_URL = modex-gtm.vercel.app) was
 * publishing canonicals that pointed search authority at the preview origin and
 * leaked it in shared unfurls (2026-07-09 audit). Default to the real public
 * domain; NEXT_PUBLIC_MICROSITE_BASE_URL still overrides for previews/local.
 */
export function getMicrositeBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MICROSITE_BASE_URL?.replace(/\s+/g, '');
  const base = configured ? normalizeUrl(configured) : 'https://yardflow.ai';
  return base.replace(/\/+$/, '');
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
  const url = new URL(pathname, getMicrositeBaseUrl()).toString();
  // yardflow.ai is trailingSlash:true — the slashless form 308s, and a
  // canonical must never point at a redirect (2026-07-09 audit).
  if (url.includes('?') || url.includes('#') || /\.[a-z0-9]+$/i.test(url)) return url;
  return url.endsWith('/') ? url : `${url}/`;
}
