/**
 * WHERE SIGN-IN COMES BACK TO (R63-B S8, 2026-10-07). Pure and client-safe.
 *
 * Signed out, an account link went to "/login/" and sign-in landed on the home page: the GAP pages' own sign-in
 * fallback dropped the page, and the login page ignored the `callbackUrl` the session gate adds. Every sign-in now
 * carries the page to come back to, and only ever a page on this site (never another origin: no open redirect).
 */

/** The sign-in page carrying the page to come back to. */
export function loginHref(returnTo: string | null | undefined): string {
  const path = safeReturnPath(returnTo, null);
  return path === '/' ? '/login' : `/login?callbackUrl=${encodeURIComponent(path)}`;
}

/**
 * A same-site path to come back to, or "/". A relative path ("/gap/accounts/x/") is kept; an absolute URL is kept
 * only on `origin` (the session gate sends the full URL), as its path, query and hash; anything else is "/".
 */
export function safeReturnPath(raw: string | null | undefined, origin: string | null): string {
  const s = (raw ?? '').trim();
  if (!s) return '/';
  if (s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\')) return s;
  if (!origin) return '/';
  try {
    const u = new URL(s);
    return u.origin === origin ? `${u.pathname}${u.search}${u.hash}` || '/' : '/';
  } catch {
    return '/';
  }
}
