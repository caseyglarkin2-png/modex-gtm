import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify a Slack request signature (HMAC-SHA256 of `v0:timestamp:body`).
 * `nowSec` is injectable for tests. Rejects timestamps older than 5 minutes
 * (replay guard) and any request missing the signature/timestamp headers.
 */
export function verifySlackSignature(
  rawBody: string,
  headers: { 'x-slack-signature'?: string | null; 'x-slack-request-timestamp'?: string | null },
  signingSecret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): boolean {
  const sig = headers['x-slack-signature'];
  const ts = headers['x-slack-request-timestamp'];
  if (!sig || !ts) return false;
  if (!Number.isFinite(Number(ts)) || Math.abs(nowSec - Number(ts)) > 60 * 5) return false;
  const expected = 'v0=' + createHmac('sha256', signingSecret).update(`v0:${ts}:${rawBody}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
