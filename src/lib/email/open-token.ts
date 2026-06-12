import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Open-tracking pixel token. Mirrors the HMAC pattern in unsubscribe-token.ts.
 *
 * We never expose the raw EmailLog row id in the pixel URL. Instead each send
 * mints an opaque random `tracking_id` (stored on the EmailLog row); the pixel
 * URL carries `<tracking_id>.<hmac(tracking_id)>`. The open route splits the
 * token, recomputes the HMAC, compares it timing-safe, and only then resolves
 * the EmailLog by tracking_id. A bad/forged token simply fails verification and
 * the route still returns the gif (fail-soft).
 */

const ALGORITHM = 'sha256';
const SEPARATOR = '.';

function getSecret(): string {
  // Reuse the existing email-token secret (already required for unsubscribe
  // links) rather than introducing a new env var.
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
  }
  return secret;
}

function sign(trackingId: string): string {
  const hmac = createHmac(ALGORITHM, getSecret());
  hmac.update(trackingId);
  return hmac.digest('hex');
}

/** Build the opaque, signed pixel token for a tracking id: `<id>.<hmac>`. */
export function generateOpenToken(trackingId: string): string {
  return `${trackingId}${SEPARATOR}${sign(trackingId)}`;
}

/**
 * Verify a pixel token and return the embedded tracking id, or null when the
 * token is malformed or the signature does not match (timing-safe). Never
 * throws on a bad token shape; a missing secret still throws (config error).
 */
export function verifyOpenToken(token: string): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0 || idx === token.length - 1) return null;
  const trackingId = token.slice(0, idx);
  const provided = token.slice(idx + 1);
  const expected = sign(trackingId);
  if (expected.length !== provided.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return null;
  } catch {
    return null;
  }
  return trackingId;
}
