import { sendViaGmail, isGmailSenderConfigured } from './gmail-sender';
import { logSendToHubSpot } from '@/lib/hubspot/emails';

export interface EmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

// ── Public API (Gmail only) ─────────────────────────────────────────
// Sends from casey@freightroll.com via Gmail API.
// Gmail auto-mirrors to Sent folder — no separate mirror step needed.
// After send, automatically logs to HubSpot (if HUBSPOT_LOGGING_ENABLED).

export async function sendEmail(payload: EmailPayload) {
  if (!isGmailSenderConfigured()) {
    throw new Error(
      'Gmail API not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.'
    );
  }

  const result = await sendViaGmail(payload);

  // Log to HubSpot (non-blocking, non-fatal)
  let hubspotEngagementId: string | null = null;
  try {
    hubspotEngagementId = await logSendToHubSpot(payload.subject, payload.html, payload.to);
  } catch {
    // HubSpot failure must never block email sends
  }

  return {
    headers: { 'x-message-id': result.id ?? '' },
    statusCode: 202,
    provider: result.provider,
    hubspotEngagementId,
  };
}

export async function sendBulk(payloads: EmailPayload[]) {
  const results = await Promise.allSettled(payloads.map(sendEmail));
  return results;
}
