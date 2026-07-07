/**
 * In-process idempotency guard for the Paper Booking Concierge -> pipeline handler.
 *
 * The find-or-create in /api/concierge/booked is a read-before-write: it searches
 * for an open deal by contact -> company -> exact name, and only creates one if
 * all three miss. That is NOT atomic. For a brand-new identity (nothing in the CRM
 * yet) two near-simultaneous bookings — a double-tap "book", or a client retry —
 * both run the dedup lookups, both miss (nothing is indexed yet), and both create
 * a "YardFlow - X" deal. Worse, even a SEQUENTIAL retry a few seconds later can
 * miss, because HubSpot's deal search index and v4 associations lag several
 * seconds behind a create. The per-IP rate limit (10/min) does not stop two rapid
 * requests. This is the one path that defeats the "never add to the deal pile"
 * guarantee.
 *
 * This guard closes that window locally, BEFORE the HubSpot create, so the second
 * call short-circuits regardless of HubSpot index lag:
 *   - Concurrent calls for the same key share ONE in-flight promise (coalesced),
 *     so exactly one find-or-create runs and both callers get the same result.
 *   - A completed result is cached for a short TTL, so a fast sequential retry
 *     returns the first booking's result instead of re-running the create while
 *     HubSpot is still indexing.
 *   - A FAILED attempt is evicted immediately, so a genuine retry re-attempts.
 *
 * This is process-local (a warm serverless instance handles double-taps and
 * client retries, which land within seconds on the same container). It is not a
 * distributed lock — the deal-layer dedup (findOpenDeal*) remains the backstop for
 * the rarer cross-instance race once HubSpot has indexed the first write.
 */

interface Entry<T> {
  promise: Promise<T>;
  expiresAt: number;
}

/**
 * How long a completed booking result stays cached. Must comfortably exceed
 * HubSpot's search/association indexing lag (a few seconds) so a retry inside the
 * window reuses the first result rather than racing a second create.
 */
export const BOOKING_IDEMPOTENCY_TTL_MS = 60_000;

// Keyed by `${email}|${startTime}`. Module-scoped so it persists across requests
// served by the same warm instance.
const inFlight = new Map<string, Entry<unknown>>();

function sweepExpired(now: number): void {
  for (const [key, entry] of inFlight) {
    if (entry.expiresAt <= now) inFlight.delete(key);
  }
}

/** Normalize the identity+slot into a stable idempotency key. */
export function bookingIdempotencyKey(email: string, startTime: string): string {
  return `${email.trim().toLowerCase()}|${startTime.trim()}`;
}

/**
 * Run `fn` at most once per `key` within the TTL window. Concurrent callers for
 * the same key await the same promise; a caller inside the TTL after completion
 * gets the cached result. On rejection the entry is evicted so retries re-run.
 */
export function runBookingOnce<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number = BOOKING_IDEMPOTENCY_TTL_MS,
): Promise<T> {
  const now = Date.now();
  sweepExpired(now);

  const existing = inFlight.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.promise as Promise<T>;
  }

  const promise = fn();
  const entry: Entry<T> = { promise, expiresAt: now + ttlMs };
  inFlight.set(key, entry);

  // Do NOT cache failures: evict on rejection so a real retry re-attempts. The
  // onRejected handler here also prevents an unhandled-rejection warning on this
  // derived promise; the original `promise` is returned to (and awaited by) the
  // caller, which owns the actual error handling.
  promise.then(undefined, () => {
    if (inFlight.get(key) === entry) inFlight.delete(key);
  });

  return promise;
}

/** Test-only: clear the process-local cache so cases don't leak across each other. */
export function __resetBookingIdempotency(): void {
  inFlight.clear();
}
