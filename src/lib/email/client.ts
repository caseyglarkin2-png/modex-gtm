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

export interface EmailSendResult {
  headers: { 'x-message-id': string };
  statusCode: number;
  provider: string;
  hubspotEngagementId: string | null;
  hubspotError?: string;
}

// ── Public API (Gmail only) ─────────────────────────────────────────
// Sends from casey@freightroll.com via Gmail API.
// Gmail auto-mirrors to Sent folder — no separate mirror step needed.
// After send, automatically logs to HubSpot (if HUBSPOT_LOGGING_ENABLED).

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  if (!isGmailSenderConfigured()) {
    throw new Error(
      'Gmail API not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.'
    );
  }

  const result = await sendViaGmail(payload);

  // Log to HubSpot (non-blocking, non-fatal)
  let hubspotEngagementId: string | null = null;
  let hubspotError: string | undefined;
  try {
    hubspotEngagementId = await logSendToHubSpot(payload.subject, payload.html, payload.to);
  } catch (error) {
    hubspotError = error instanceof Error ? error.message : String(error);
    console.error('HubSpot email logging failed', { to: payload.to, subject: payload.subject, error: hubspotError });
    // HubSpot failure must never block email sends
  }

  return {
    headers: { 'x-message-id': result.id ?? '' },
    statusCode: 202,
    provider: result.provider,
    hubspotEngagementId,
    hubspotError,
  };
}

export async function sendBulk(payloads: EmailPayload[]) {
  const results = await Promise.allSettled(payloads.map(sendEmail));
  return results;
}
