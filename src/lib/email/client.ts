import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'casey@freightroll.com';
const FROM_NAME = 'Casey — FreightRoll';

export interface EmailPayload {
  to: string;
  cc?: string;
  subject: string;
  html: string;
}

function getClient() {
  if (!API_KEY) throw new Error('SENDGRID_API_KEY is not set. Add it to your Vercel environment variables.');
  sgMail.setApiKey(API_KEY.trim());
  return sgMail;
}

export async function sendEmail(payload: EmailPayload) {
  const client = getClient();
  const msg: sgMail.MailDataRequired = {
    to: payload.to,
    cc: payload.cc ? payload.cc : undefined,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: payload.subject,
    html: payload.html,
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
  };
  const [response] = await client.send(msg);
  return response;
}

export async function sendBulk(payloads: EmailPayload[]) {
  const client = getClient();
  const results = await Promise.allSettled(
    payloads.map((p) =>
      client.send({
        to: p.to,
        cc: p.cc ?? undefined,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: p.subject,
        html: p.html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      })
    )
  );
  return results;
}
