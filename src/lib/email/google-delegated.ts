/**
 * Google Workspace domain-wide delegation: mint a Gmail access token AS a
 * Workspace user from a service account key (closeout 2026-09-25).
 *
 * Why: GAP seller drafts go out from casey@yardflow.ai (yardflow.ai publishes
 * a Google DKIM key; freightroll.com does not). The authorized, working
 * credential for that mailbox is the yardflow.ai domain-wide-delegation
 * service account clawd already runs with in production. Verified 2026-09-25
 * with a read-only Gmail profile call: impersonating casey@yardflow.ai with
 * scope gmail.modify returns that mailbox (gmail.compose is not delegated).
 *
 * gmail.modify covers drafts.create, drafts.get and threads.get. It is the
 * scope Workspace delegated; nothing here ever calls a send endpoint.
 */
import { createSign } from 'node:crypto';

export const GMAIL_DELEGATED_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function parseKey(json: string): ServiceAccountKey {
  let key: Partial<ServiceAccountKey>;
  try {
    key = JSON.parse(json) as Partial<ServiceAccountKey>;
  } catch {
    throw new Error('delegated Gmail sender: service account JSON is not valid JSON');
  }
  if (!key.client_email || !key.private_key) throw new Error('delegated Gmail sender: service account JSON lacks client_email or private_key');
  return key as ServiceAccountKey;
}

/** The signed JWT-bearer assertion (exported for tests). */
export function delegatedAssertion(json: string, subject: string, scope: string, nowSec: number): string {
  const key = parseKey(json);
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: key.client_email,
    sub: subject,
    scope,
    aud: key.token_uri || 'https://oauth2.googleapis.com/token',
    iat: nowSec,
    exp: nowSec + 600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  return `${unsigned}.${signature}`;
}

export async function mintDelegatedAccessToken(
  json: string,
  subject: string,
  scope: string = GMAIL_DELEGATED_SCOPE,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const key = parseKey(json);
  const res = await fetchImpl(key.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: delegatedAssertion(json, subject, scope, Math.floor(Date.now() / 1000)),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`delegated Gmail token for ${subject} failed: ${data.error_description || data.error || res.status}`);
  }
  return data.access_token;
}
