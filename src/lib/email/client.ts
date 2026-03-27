import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY?.trim();
const RESEND_KEY = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL = process.env.FROM_EMAIL ?? process.env.SENDGRID_FROM_EMAIL ?? 'casey@yardflow.ai';
const FROM_NAME = process.env.FROM_NAME ?? 'Casey Larkin — YardFlow';

export interface EmailPayload {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

// ── SendGrid ─────────────────────────────────────────────────────────

async function sendViaSendGrid(payload: EmailPayload) {
  if (!SENDGRID_KEY) throw new Error('SENDGRID_API_KEY not set');
  sgMail.setApiKey(SENDGRID_KEY);
  const [response] = await sgMail.send({
    to: payload.to,
    cc: payload.cc || undefined,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: payload.subject,
    html: payload.html,
    trackingSettings: { clickTracking: { enable: true }, openTracking: { enable: true } },
  });
  return { provider: 'sendgrid' as const, id: response.headers?.['x-message-id'] ?? null };
}

// ── Resend ───────────────────────────────────────────────────────────

async function sendViaResend(payload: EmailPayload) {
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY not set');
  const resend = new Resend(RESEND_KEY);
  // Try custom domain first; fall back to Resend's shared domain if not verified yet
  const fromAddresses = [
    `${FROM_NAME} <${FROM_EMAIL}>`,
    `${FROM_NAME} <onboarding@resend.dev>`,
  ];
  let lastErr: Error | null = null;
  for (const from of fromAddresses) {
    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      cc: payload.cc || undefined,
      subject: payload.subject,
      html: payload.html,
    });
    if (!error && data?.id) {
      return { provider: 'resend' as const, id: data.id };
    }
    lastErr = new Error(error?.message ?? 'Unknown Resend error');
    // If domain not verified, try the fallback address
    if (error?.message?.includes('not verified') || error?.message?.includes('not found')) continue;
    throw lastErr;
  }
  throw lastErr ?? new Error('Resend send failed');
}

// ── Public API (try Resend → SendGrid) ──────────────────────────────
// Resend first: webhook tracking is wired to Resend, and domain is verified.

export async function sendEmail(payload: EmailPayload) {
  const providers: Array<() => Promise<{ provider: string; id: string | null }>> = [];
  if (RESEND_KEY) providers.push(() => sendViaResend(payload));
  if (SENDGRID_KEY) providers.push(() => sendViaSendGrid(payload));

  if (providers.length === 0) {
    throw new Error('No email provider configured. Set SENDGRID_API_KEY or RESEND_API_KEY.');
  }

  let lastError: Error | null = null;
  for (const tryProvider of providers) {
    try {
      const result = await tryProvider();
      return { headers: { 'x-message-id': result.id ?? '' }, statusCode: 202, provider: result.provider };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

export async function sendBulk(payloads: EmailPayload[]) {
  const results = await Promise.allSettled(payloads.map(sendEmail));
  return results;
}
