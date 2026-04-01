import { sendViaGmail, isGmailSenderConfigured } from './gmail-sender';

export interface EmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
}

// ── Public API (Gmail only) ─────────────────────────────────────────
// Sends from casey@freightroll.com via Gmail API.
// Gmail auto-mirrors to Sent folder — no separate mirror step needed.

export async function sendEmail(payload: EmailPayload) {
  if (!isGmailSenderConfigured()) {
    throw new Error(
      'Gmail API not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.'
    );
  }

  const result = await sendViaGmail(payload);
  return {
    headers: { 'x-message-id': result.id ?? '' },
    statusCode: 202,
    provider: result.provider,
  };
}

export async function sendBulk(payloads: EmailPayload[]) {
  const results = await Promise.allSettled(payloads.map(sendEmail));
  return results;
}
