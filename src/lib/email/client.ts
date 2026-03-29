import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY?.trim();
const RESEND_KEY = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'casey@yardflow.ai';
const SENDGRID_FROM = process.env.SENDGRID_FROM_EMAIL ?? FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME ?? 'Casey Larkin - YardFlow';
export interface EmailPayload {
  to: string;
  cc?: string;
  bcc?: string;
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
    bcc: payload.bcc || undefined,
    from: { email: SENDGRID_FROM, name: FROM_NAME },
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
    bcc: payload.bcc || undefined,
    replyTo: FROM_EMAIL,
    subject: payload.subject,
    html: payload.html,
  });
  if (error) throw new Error(error.message ?? 'Resend send failed');
  if (!data?.id) throw new Error('Resend returned no message ID');
  return { provider: 'resend' as const, id: data.id };
}

// ── Public API (try SendGrid → Resend) ──────────────────────────────
// SendGrid first: higher quota, established sender. Resend as fallback.

export async function sendEmail(payload: EmailPayload) {
  const providers: Array<() => Promise<{ provider: string; id: string | null }>> = [];
  if (SENDGRID_KEY) providers.push(() => sendViaSendGrid(payload));
  if (RESEND_KEY) providers.push(() => sendViaResend(payload));

  if (providers.length === 0) {
    throw new Error('No email provider configured. Set SENDGRID_API_KEY or RESEND_API_KEY.');
  }

  let lastError: Error | null = null;
  const errors: string[] = [];
  for (const tryProvider of providers) {
    try {
      const result = await tryProvider();
      return { headers: { 'x-message-id': result.id ?? '' }, statusCode: 202, provider: result.provider, fallbackErrors: errors.length ? errors : undefined };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

export async function sendBulk(payloads: EmailPayload[]) {
  const results = await Promise.allSettled(payloads.map(sendEmail));
  return results;
}
