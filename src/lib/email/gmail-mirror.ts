const GMAIL_MIRROR_ENABLED = (process.env.GMAIL_MIRROR_ENABLED ?? 'true').toLowerCase() !== 'false';
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL?.trim() || process.env.FROM_EMAIL?.trim();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim();
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET?.trim();
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN?.trim();
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'casey@freightroll.com';
const FROM_NAME = process.env.FROM_NAME ?? 'Casey Larkin - YardFlow';

interface MirrorPayload {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  accessToken?: string;
  gmailUserEmail?: string;
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

function buildMimeMessage(payload: MirrorPayload): string {
  const headers = [
    `From: ${FROM_NAME} <${FROM_EMAIL}>`,
    `To: ${payload.to}`,
    payload.cc ? `Cc: ${payload.cc}` : null,
    `Subject: ${payload.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
  ].filter(Boolean);

  return `${headers.join('\r\n')}\r\n\r\n${payload.html}`;
}

async function getAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Gmail mirror not configured: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REFRESH_TOKEN');
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

export async function mirrorEmailToGmailSent(payload: MirrorPayload): Promise<{ mirrored: boolean; reason?: string }> {
  if (!GMAIL_MIRROR_ENABLED) return { mirrored: false, reason: 'disabled' };
  const userEmail = payload.gmailUserEmail || GMAIL_USER_EMAIL;
  if (!userEmail) return { mirrored: false, reason: 'missing-gmail-user' };

  const accessToken = payload.accessToken || (await getAccessToken());
  const raw = base64Url(buildMimeMessage(payload));

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(userEmail)}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      labelIds: ['SENT'],
      raw,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    // Scope not granted yet (user hasn't re-consented) — fail silently, don't break send
    if (res.status === 403 || res.status === 401) {
      return { mirrored: false, reason: `gmail-auth-${res.status}: ${errBody.slice(0, 120)}` };
    }
    throw new Error(`Gmail mirror insert failed (${res.status}): ${errBody}`);
  }

  return { mirrored: true };
}
