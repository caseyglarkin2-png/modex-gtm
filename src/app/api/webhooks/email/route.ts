import { NextRequest, NextResponse } from 'next/server';
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

// Webhook signing secret — set in Resend dashboard → Webhooks
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  let payload: ResendWebhookPayload;

  try {
    payload = await req.json() as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Optional: Verify webhook signature via svix if secret is configured
  if (WEBHOOK_SECRET) {
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 401 });
    }

    // Timestamp replay protection (5 minute window)
    const ts = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 });
    }
  }

  const { type, data } = payload;
  const emailId = data?.email_id;

  if (!emailId) {
    return NextResponse.json({ error: 'No email_id' }, { status: 400 });
  }

  const now = new Date();

  try {
    // Find the email log by provider_message_id
    const log = await prisma.emailLog.findFirst({
      where: { provider_message_id: emailId },
    });

    if (!log) {
      // Not tracked — could be a test or older send
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
            // Also mark opened if not already
            opened_at: log.opened_at ?? now,
          },
        });
        break;

      case 'email.bounced':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'bounced' },
        });
        break;

      case 'email.complained':
        await prisma.emailLog.update({
          where: { id: log.id },
          data: { status: 'bounced' },
        });
        break;

      default:
        // Other events (sent, delivery_delayed, etc.) — acknowledge
        break;
    }

    return NextResponse.json({ received: true, matched: true, type });
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
