/**
 * Gmail API Send — Primary email provider.
 * Sends email via Gmail API (messages.send) which also places it in Sent folder automatically.
 * Reuses OAuth token refresh from gmail-mirror.ts infrastructure.
 */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN?.trim();
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com';
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'casey@freightroll.com';
const FROM_NAME = process.env.FROM_NAME ?? 'Casey Larkin - YardFlow';

interface GmailSendPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
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

function buildMimeMessage(payload: GmailSendPayload): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const plainText = payload.html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();

  const headers = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    payload.bcc ? `Bcc: ${payload.bcc}` : null,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean);

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

async function getAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Gmail sender not configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = (await res.json()) as OAuthTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to obtain Google access token');
  }

  return data.access_token;
}

export async function sendViaGmail(payload: GmailSendPayload): Promise<{ provider: 'gmail'; id: string | null }> {
  const accessToken = await getAccessToken();
  const raw = base64Url(buildMimeMessage(payload));

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(GMAIL_USER_EMAIL)}/messages/send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${errBody.slice(0, 200)}`);
  }

  const result = (await res.json()) as { id?: string };
  return { provider: 'gmail', id: result.id ?? null };
}

/**
 * Check if Gmail sender is configured (env vars present).
 */
export function isGmailSenderConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_REFRESH_TOKEN);
}
