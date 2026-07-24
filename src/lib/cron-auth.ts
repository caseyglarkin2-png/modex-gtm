/**
 * Cron request authorization.
 *
 * Vercel-scheduled cron invocations carry `Authorization: Bearer ${CRON_SECRET}`.
 * Manual or app-internal triggers may instead pass an `x-cron-secret` header, or
 * (legacy) `?secret=` in the query string. Accept any of the three, checked
 * against the CRON_SECRET environment variable.
 *
 * Prefer a header over the query param: a `?secret=` value lands in Vercel
 * access logs and any proxy in front of the function, so the header paths are
 * the ones to reach for on new triggers. The query param stays supported for
 * back-compat with existing manual triggers and is not being removed here.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader === `Bearer ${cronSecret}`) return true;

  // Dedicated header, kept out of the URL so it never reaches an access log.
  const headerSecret = request.headers.get('x-cron-secret') ?? '';
  if (headerSecret === cronSecret) return true;

  const querySecret = new URL(request.url).searchParams.get('secret');
  return querySecret === cronSecret;
}
