const windowMs = 60_000; // 1 minute
const maxRequests = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { ok: false, remaining: 0 };
  }

  return { ok: true, remaining: maxRequests - entry.count };
}
