/**
 * Gmail API Send — the only email send path.
 * Sends email via Gmail API (messages.send), which also files the message
 * in the Sent folder automatically and assigns a real Gmail threadId.
 *
 * Being the only send path is what makes it the right place for the mailbox
 * daily ceiling. Two CLI scripts, scripts/batch-send-gmail.ts and
 * scripts/wave1-resend-gmail.ts, define their OWN local sendViaGmail and call
 * the Gmail API directly, so they are NOT covered by this and remain uncapped.
 */
import { assertUnderDailyCap } from './daily-cap';
import { assertAutonomyPermitsSend, type SendPurpose } from './autonomy-gate';
import { assertSuppressionPermitsSend } from './suppression-gate';

// Read at call time, not module load time, so dynamically-set values work
function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'casey@freightroll.com';
const FROM_NAME = process.env.FROM_NAME ?? 'Casey Larkin - YardFlow';

import type { InlineImage } from './inline-image';

interface GmailSendPayload {
  to: string;
  cc?: string[];
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  /** Gmail threadId — set to thread a reply into an existing conversation. */
  threadId?: string;
  /** Optional inline (cid:) image. When present the message becomes
   *  multipart/related wrapping the multipart/alternative block. */
  inlineImage?: InlineImage;
  /** Per-identity sender. When set, the message is sent using this user's
   *  refresh token and From/{userEmail}/messages URL instead of the Casey env
   *  token. When absent, behavior is exactly as before (env/Casey). */
  sender?: { refreshToken: string; userEmail: string };
  /** Why this message is being sent. Absent means PROSPECT_OUTREACH, so a
   *  caller that does not declare is GATED by the canonical kill-switch rather
   *  than exempted. Only OPERATOR_ALERT is exempt. See ./autonomy-gate.ts. */
  purpose?: SendPurpose;
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function base64Url(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** Sanitize any value interpolated into a MIME header, preventing header
 *  injection via attacker-influenceable input. A CR/LF in a header value would
 *  otherwise let a caller smuggle additional headers (silent Bcc, spoofed
 *  Reply-To); we drop everything from the first CR/LF onward so no injected
 *  header survives, then trim. Valid header values contain no CR/LF and are
 *  unaffected. */
function sanitizeHeader(value: string): string {
  return String(value).replace(/[\r\n][\s\S]*$/, '').trim();
}

/** Split a base64 string into 76-char lines joined by CRLF (RFC 2045). */
function wrap76(b64: string): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76));
  }
  return lines.join('\r\n');
}

export function buildMimeMessage(payload: GmailSendPayload): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const plainText = (payload.text ?? payload.html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const customHeaders = Object.entries(payload.headers ?? {}).map(([key, value]) => {
    const safeKey = key.replace(/[\r\n:]+/g, '').trim();
    const safeValue = sanitizeHeader(value);
    return `${safeKey}: ${safeValue}`;
  });

  const ccHeader = payload.cc?.length
    ? payload.cc.map((entry) => sanitizeHeader(entry)).join(', ')
    : null;

  // From-line: when a per-identity sender is set, send as that user (bare
  // address, no display name); otherwise keep the env/Casey From exactly.
  const fromHeader = payload.sender
    ? `From: ${sanitizeHeader(payload.sender.userEmail)}`
    : `From: ${sanitizeHeader(FROM_NAME)} <${sanitizeHeader(FROM_EMAIL)}>`;

  // Per-message envelope headers (From/To/Subject/…), shared by both layouts.
  const envelopeHeaders = [
    fromHeader,
    `To: ${sanitizeHeader(payload.to)}`,
    ccHeader ? `Cc: ${ccHeader}` : null,
    payload.bcc ? `Bcc: ${sanitizeHeader(payload.bcc)}` : null,
    payload.replyTo ? `Reply-To: ${sanitizeHeader(payload.replyTo)}` : null,
    `Subject: ${sanitizeHeader(payload.subject)}`,
    ...customHeaders,
    'MIME-Version: 1.0',
  ].filter(Boolean);

  // When there's no inline image, keep the exact byte-for-byte layout we had
  // before: envelope headers + the multipart/alternative Content-Type, then
  // the two alternative leaf parts.
  if (!payload.inlineImage) {
    const headers = [
      ...envelopeHeaders,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];
    const parts = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      plainText,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      payload.html,
      `--${boundary}--`,
    ];
    return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
  }

  // Inline image present → wrap the multipart/alternative block (as a body,
  // without its own envelope headers) inside a multipart/related container.
  const relBoundary = `related_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const { contentId, mimeType, base64 } = payload.inlineImage;
  const safeMimeType = sanitizeHeader(mimeType);
  const safeContentId = sanitizeHeader(contentId);

  const headers = [
    ...envelopeHeaders,
    `Content-Type: multipart/related; boundary="${relBoundary}"`,
  ];

  const alternativeBlock = [
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    plainText,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    '',
    payload.html,
    `--${boundary}--`,
  ].join('\r\n');

  const parts = [
    `--${relBoundary}`,
    alternativeBlock,
    `--${relBoundary}`,
    `Content-Type: ${safeMimeType}`,
    'Content-Transfer-Encoding: base64',
    `Content-ID: <${safeContentId}>`,
    'Content-Disposition: inline',
    '',
    wrap76(base64),
    `--${relBoundary}--`,
  ];

  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
}

async function getAccessToken(overrideRefreshToken?: string): Promise<string> {
  const cfg = getGmailConfig();
  const clientId = cfg.clientId;
  const clientSecret = cfg.clientSecret;
  // When a per-user refresh token is supplied, mint the access token from it
  // (send as that identity); otherwise use the env/Casey refresh token.
  const refreshToken = overrideRefreshToken ?? cfg.refreshToken;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail sender not configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = (await res.json()) as OAuthTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to obtain Google access token');
  }

  return data.access_token;
}

export async function sendViaGmail(
  payload: GmailSendPayload,
): Promise<{ provider: 'gmail'; id: string | null; threadId: string | null }> {
  // THE MAILBOX CEILING, enforced at the wire rather than at any route.
  //
  // Seven application paths reach this function and none of them counted a
  // send: perform-send (manual /discovery + the clawd-driven draft queue),
  // send-bulk (whose recipients array has .min(1) and no .max()),
  // process-send-jobs, monday-bump, the engagement thread reply, the daily
  // digest, and the admin gmail-token probe - which imports this function
  // directly and so bypasses client.sendEmail entirely. Gating any subset of
  // those routes would have left the others open, and more routes will be
  // added. This is the one place every app send must pass.
  //
  // THE CANONICAL KILL-SWITCH, checked immediately before transmission and at
  // the wire for the same reason the ceiling is: gating any subset of the eight
  // application paths leaves the rest open.
  //
  // The authority is clawd's, read over HTTP; modex holds no autonomy state of
  // its own. Refuses when outreach is halted, when the two repos have drifted,
  // and when the authority cannot be read at all - unreadable is not permission.
  // OPERATOR_ALERT is exempt so alerts still reach a human during a halt.
  await assertAutonomyPermitsSend(payload.purpose);

  // THE CROSS-PLANE SUPPRESSION CONTRACT, the third and last plane to get it.
  // clawd's `_boundary_check` and war-room's SendGrid lane were already gated;
  // this function was not, so modex was the last way to mail someone we had
  // recorded a decision NOT to contact.
  //
  // A KILL SWITCH IS NOT A CONSENT GATE. The line above and `OUTREACH_PAUSED`
  // both stop sending, but they are switches: the moment either is lifted, a
  // do-not-contact recipient is reachable again. Measured 2026-08-16: 242 of
  // 1,936 personas carry do_not_contact=TRUE, 204 were invisible to clawd, and
  // one had already been mailed at that exact address.
  //
  // Checks TO, CC and BCC — a gate reading only `to` has a documented bypass.
  // Fails CLOSED on every unprovable state, because an unreadable authority is
  // not permission. OPERATOR_ALERT is exempt so a human still learns that
  // suppression is holding a wave.
  await assertSuppressionPermitsSend(
    { to: payload.to, cc: payload.cc, bcc: payload.bcc },
    payload.purpose,
  );

  // Throws DailyCapExceededError, which fails CLOSED on an unreadable ledger.
  // See src/lib/email/daily-cap.ts for why this guard alone does that.
  await assertUnderDailyCap();

  // Per-identity send: when payload.sender is set, mint the access token from
  // the sender's refresh token and address the mailbox URL to the sender.
  // Otherwise send via the env/Casey identity exactly as before.
  const userEmail = payload.sender?.userEmail ?? getGmailConfig().userEmail;
  const accessToken = await getAccessToken(payload.sender?.refreshToken);
  const raw = base64Url(buildMimeMessage(payload));

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(userEmail)}/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload.threadId ? { raw, threadId: payload.threadId } : { raw }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  const result = (await res.json()) as { id?: string; threadId?: string };
  return { provider: 'gmail', id: result.id ?? null, threadId: result.threadId ?? null };
}

/**
 * Check if Gmail sender is configured (env vars present).
 */
export function isGmailSenderConfigured(): boolean {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  return !!(clientId && clientSecret && refreshToken);
}
