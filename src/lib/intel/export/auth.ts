/**
 * Authorization for the read-only intel export endpoints
 * (`GET /api/intel/export/<stream>`).
 *
 * Primary credential is the `x-queue-secret` header matching QUEUE_AGENT_SECRET
 * (the same secret clawd already uses for `GET /api/campaigns/<tag>/stats`). For
 * convenience we also accept the Bearer form of that same secret, so an operator
 * can hit the endpoint with the credential they already have. No `?secret=`
 * query form — this primitive never lands in access logs.
 */
export function isAuthorizedIntelExport(request: Request): boolean {
  const secret = process.env.QUEUE_AGENT_SECRET;
  if (!secret) return false;

  const headerSecret = request.headers.get('x-queue-secret') ?? '';
  if (headerSecret && headerSecret === secret) return true;

  const auth = request.headers.get('authorization') ?? '';
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
