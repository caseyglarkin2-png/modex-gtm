/**
 * Inline (cid:) image support for the Gmail sender.
 *
 * Fetches a small, allowlisted image and returns it as a base64 inline
 * attachment so it can be embedded with a `Content-ID` and referenced from
 * the HTML body via `src="cid:..."`. This avoids relying on a remote <img>
 * (which Gmail/Outlook often block by default).
 *
 * SECURITY (SSRF): the fetch target is restricted to an explicit host
 * allowlist over https only, and redirects are refused — so an allowlisted
 * URL cannot bounce to an internal/metadata host. Any failure returns null;
 * callers fall back to a hosted <img>. This function never throws.
 */

export interface InlineImage {
  contentId: string;
  mimeType: string;
  base64: string;
}

/** Only fetch from hosts we control — the primary SSRF guard. */
const ALLOWED_HOSTS = ['modex-gtm.vercel.app']; // extend if a proof CDN is added

/** Stable Content-ID token the HTML references via `cid:proof@yardflow`. */
const CONTENT_ID = 'proof@yardflow';

/** Max inline image size (1 MB) — keeps the base64 message body bounded. */
const MAX_BYTES = 1_000_000;

/** Fetch timeout (ms). */
const TIMEOUT_MS = 5000;

/** https only + host in ALLOWED_HOSTS. */
export function isAllowedImageUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && ALLOWED_HOSTS.includes(url.hostname);
}

/**
 * Fetch an allowlisted image as a base64 inline attachment. Returns null on
 * ANY failure (caller falls back to a hosted <img>). Never throws.
 */
export async function fetchImageAsAttachment(url: string): Promise<InlineImage | null> {
  if (!isAllowedImageUrl(url)) return null;

  try {
    const res = await fetch(url, {
      // A redirect must fail, so an allowlisted URL can't bounce to an
      // internal host (SSRF). Combined with the host allowlist this is the
      // core guard.
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') ?? '';
    const mimeType = contentType.split(';')[0].trim().toLowerCase();
    if (!mimeType.startsWith('image/')) return null;

    const declaredLength = res.headers.get('content-length');
    if (declaredLength !== null) {
      const n = Number(declaredLength);
      if (Number.isFinite(n) && n > MAX_BYTES) return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    // Cap streamed bytes too — content-length can be absent or lie.
    if (buffer.byteLength > MAX_BYTES) return null;

    return {
      contentId: CONTENT_ID,
      mimeType,
      base64: buffer.toString('base64'),
    };
  } catch {
    return null;
  }
}
