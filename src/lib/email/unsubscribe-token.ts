import { createHmac, timingSafeEqual } from 'crypto';

const ALGORITHM = 'sha256';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET environment variable is not set');
  }
  return secret;
}

/** Generate an HMAC token for a given email address */
export function generateToken(email: string): string {
  const hmac = createHmac(ALGORITHM, getSecret());
  hmac.update(email.toLowerCase().trim());
  return hmac.digest('hex');
}

/** Validate an HMAC token against an email address (timing-safe) */
export function validateToken(email: string, token: string): boolean {
  if (!token || !email) return false;
  const expected = generateToken(email);
  if (expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
