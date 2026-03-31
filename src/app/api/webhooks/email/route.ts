import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';

/**
 * Resend webhook handler — tracks email delivery, opens, clicks, bounces.
 * POST /api/webhooks/email
 *
 * Resend sends events with this shape:
 * { type: "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | ...,
 *   data: { email_id: string, ... } }
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

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Read raw body first — required for HMAC signature verification
  const rawBody = await req.text();

  // Verify Resend webhook signature via svix
  if (WEBHOOK_SECRET) {
    const svixId = req.headers.get('svix-id') ?? '';
    const svixTimestamp = req.headers.get('svix-timestamp') ?? '';
    const svixSignature = req.headers.get('svix-signature') ?? '';

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 401 });
    }

    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      wh.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch {
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
