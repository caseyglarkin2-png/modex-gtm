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

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}