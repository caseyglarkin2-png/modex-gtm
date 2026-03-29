import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Resend webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-resend-signature') || '';
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    // Verify signature (skip in development if no secret configured)
    if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { type, data, created_at } = event;
    const eventId = event.id || `${type}-${created_at}`;

    // Idempotency check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed`);
      return NextResponse.json({ success: true, message: 'Event already processed' });
    }

    // Find email by provider_message_id
    const emailId = data.email_id;
    if (!emailId) {
      console.error('No email_id in webhook data');
      return NextResponse.json({ error: 'No email_id' }, { status: 400 });
    }

    const email = await prisma.emailLog.findFirst({
      where: { provider_message_id: emailId },
    });

    if (!email) {
      console.log(`No EmailLog found for provider_message_id: ${emailId}`);
      // Don't fail - might be email sent outside our system
      return NextResponse.json({ success: true, message: 'Email not found in system' });
    }

    // Process event based on type
    switch (type) {
      case 'email.delivered':
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'delivered',
            delivered_at: new Date(),
          },
        });
        console.log(`Email ${email.id} marked as delivered`);
        break;

      case 'email.bounced':
        const bounceError = data.error || {};
        const isPermanent = bounceError.permanent === true;
        const bounceType = isPermanent ? 'hard' : 'soft';

        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'bounced',
            bounce_type: bounceType,
          },
        });

        // Hard bounce: mark persona email as invalid
        if (isPermanent && email.persona_name) {
          await prisma.persona.updateMany({
            where: {
              account_name: email.account_name,
              name: email.persona_name,
            },
            data: { email_valid: false },
          }).catch((err) => {
            console.error('Failed to mark persona email invalid:', err);
          });
        }

        console.log(`Email ${email.id} bounced (${bounceType})`);
        break;

      case 'email.opened':
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'opened',
            opened_at: email.opened_at || new Date(), // First open only
            open_count: { increment: 1 },
          },
        });
        console.log(`Email ${email.id} opened (count: ${email.open_count + 1})`);
        break;

      case 'email.clicked':
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: 'clicked',
            clicked_at: email.clicked_at || new Date(), // First click only
          },
        });
        console.log(`Email ${email.id} clicked`);
        break;

      default:
        console.log(`Unknown webhook event type: ${type}`);
    }

    // Store event for idempotency
    await prisma.webhookEvent.create({
      data: {
        id: eventId,
        type,
      },
    });

    return NextResponse.json({ success: true, message: 'Event processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
