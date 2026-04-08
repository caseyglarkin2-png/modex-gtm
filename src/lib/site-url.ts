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

export function buildAbsoluteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).toString();
}