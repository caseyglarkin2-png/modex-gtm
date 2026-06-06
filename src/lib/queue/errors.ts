/** A transient Gmail rate-limit / quota error. The queue reschedules the item
 *  for retry instead of marking it terminally failed. */
export class RateLimitedError extends Error {
  constructor(message: string) { super(message); this.name = 'RateLimitedError'; }
}
