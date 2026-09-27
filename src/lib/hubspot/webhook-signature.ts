/**
 * HubSpot v3 webhook signature (X-HubSpot-Signature-v3), per HubSpot's
 * "Validating requests" doc: HMAC-SHA256 over
 *   method + requestUri + rawBody + timestamp
 * with the app secret, base64. `requestUri` is the FULL URL HubSpot posted to
 * (scheme + host + path + query), with the characters HubSpot lists decoded.
 * A timestamp older than 5 minutes is refused; comparison is constant-time.
 * Pinned to HubSpot's published example (tests/unit/hubspot-webhook-signature.test.ts).
 */
import crypto from 'node:crypto';

const DECODE: Record<string, string> = {
  '%3A': ':', '%2F': '/', '%3F': '?', '%40': '@', '%21': '!', '%24': '$',
  '%27': "'", '%28': '(', '%29': ')', '%2A': '*', '%2C': ',', '%3B': ';',
};

export const HUBSPOT_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

/** The URI HubSpot signs: the full URL with HubSpot's listed percent-encodings decoded. */
export function hubspotSignatureUri(url: URL): string {
  return `${url.origin}${url.pathname}${url.search}`.replace(/%(3A|2F|3F|40|21|24|27|28|29|2A|2C|3B)/gi, (m) => DECODE[m.toUpperCase()]);
}

export function validHubSpotSignatureV3(input: {
  secret: string | null | undefined;
  signature: string | null;
  timestamp: string | null;
  method: string;
  uri: string;
  body: string;
  now: Date;
}): boolean {
  const { secret, signature, timestamp } = input;
  if (!secret || !signature || !timestamp) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(input.now.getTime() - ts) > HUBSPOT_SIGNATURE_MAX_AGE_MS) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${input.method}${input.uri}${input.body}${timestamp}`).digest('base64');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
