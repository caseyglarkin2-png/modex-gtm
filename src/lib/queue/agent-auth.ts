/** The Draft Queue agent (Clawd) authenticates with a DEDICATED secret —
 *  NOT the shared CRON_SECRET — so a leak is independently revocable and cannot
 *  trigger other internal crons. Bearer header ONLY; the ?secret= query form is
 *  rejected so this primitive never lands in access logs. */
export function isAuthorizedQueueAgent(request: Request): boolean {
  const secret = process.env.QUEUE_AGENT_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}
