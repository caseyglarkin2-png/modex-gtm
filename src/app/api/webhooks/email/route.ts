import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Email webhook handler — tracks delivery, opens, clicks, bounces.
 * POST /api/webhooks/email
 *
 * Currently dormant (Gmail API has no outbound webhooks).
 * Kept for future use if an external tracking provider is added.
 */

type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained';

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    [key: string]: unknown;
  };
}

const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Read raw body first — required for HMAC signature verification
  const rawBody = await req.text();

  // In production, the secret is required — fail closed if it's not configured
  // so we never accept unsigned webhooks. Outside production we allow unsigned
  // calls to keep local/dev iteration easy.
  if (!WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Webhook secret is not configured on the server' },
        { status: 503 },
      );
    }
  } else {
    const signature = req.headers.get('x-webhook-signature') ?? '';
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const expected = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const valid = signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, data } = payload;
  const emailId = data?.email_id;

  if (!emailId) {
    return NextResponse.json({ error: 'No email_id' }, { status: 400 });
  }

  const now = new Date();

  try {
    const log = await prisma.emailLog.findFirst({
      where: { provider_message_id: emailId },
    });

    if (!log) {
      return NextResponse.json({ received: true, matched: false });
    }

    switch (type) {
      case 'email.delivered':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'delivered' },
        });
        break;

      case 'email.opened':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: {
            status: 'opened',
            opened_at: log.opened_at ?? now,
          },
        });
        break;

      case 'email.clicked':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: {
            status: 'clicked',
            clicked_at: log.clicked_at ?? now,
            opened_at: log.opened_at ?? now,
          },
        });
        break;

      case 'email.bounced':
      case 'email.complained':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'bounced' },
        });
        // Auto-suppress bounced/complained addresses
        await prisma.unsubscribedEmail.upsert({
          where: { email: log.to_email },
          create: { email: log.to_email },
          update: {},
        }).catch(() => {});
        break;

      default:
        break;
    }

    return NextResponse.json({ received: true, matched: true, type });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
