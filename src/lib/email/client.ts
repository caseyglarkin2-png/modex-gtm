import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY?.trim();
const RESEND_KEY = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'casey@freightroll.com';
const FROM_NAME = 'Casey — FreightRoll';

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
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: payload.to,
    cc: payload.cc || undefined,
    subject: payload.subject,
    html: payload.html,
  });
  if (error) throw new Error(error.message);
  return { provider: 'resend' as const, id: data?.id ?? null };
}

// ── Public API (try SendGrid → Resend) ──────────────────────────────

export async function sendEmail(payload: EmailPayload) {
  const providers: Array<() => Promise<{ provider: string; id: string | null }>> = [];
  if (SENDGRID_KEY) providers.push(() => sendViaSendGrid(payload));
  if (RESEND_KEY) providers.push(() => sendViaResend(payload));

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
