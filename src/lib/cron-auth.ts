/**
 * Cron request authorization.
 *
 * Vercel-scheduled cron invocations carry `Authorization: Bearer ${CRON_SECRET}`.
 * Manual or app-internal triggers may instead pass `?secret=`. Accept either,
 * checked against the CRON_SECRET environment variable.
 */
export function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const querySecret = new URL(request.url).searchParams.get('secret');
  return querySecret === cronSecret;
}
