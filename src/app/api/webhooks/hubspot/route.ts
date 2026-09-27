import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';
import { hubspotSignatureUri, validHubSpotSignatureV3 } from '@/lib/hubspot/webhook-signature';
import { recordHardBounce } from '@/lib/email/bounce';

export const dynamic = 'force-dynamic';

// HubSpot webhook event schema
const eventSchema = z.object({
  eventId: z.number(),
  subscriptionType: z.string(),
  objectId: z.number(),
  propertyName: z.string().optional(),
  propertyValue: z.string().optional(),
  occurredAt: z.number(),
});

const webhookBodySchema = z.array(eventSchema);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const url = new URL(request.url);

  // Validate signature
  const signature = request.headers.get('x-hubspot-signature-v3');
  const timestamp = request.headers.get('x-hubspot-request-timestamp');

  // Ops closeout: HubSpot signs the FULL URL it posted to, not the pathname (every real delivery used to 403).
  if (!validHubSpotSignatureV3({ secret: process.env.HUBSPOT_WEBHOOK_SECRET, signature, timestamp, method: 'POST', uri: hubspotSignatureUri(url), body: rawBody, now: new Date() })) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  let events: z.infer<typeof webhookBodySchema>;
  try {
    events = webhookBodySchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  let processed = 0;
  let skipped = 0;

  for (const event of events) {
    const eventIdStr = event.eventId.toString();

    // Dedup: check if already processed
    const existing = await prisma.webhookEvent.findUnique({ where: { id: eventIdStr } });
    if (existing) {
      skipped++;
      continue;
    }

    try {
      await processEvent(event);

      // Record as processed
      await prisma.webhookEvent.create({
        data: { id: eventIdStr, type: event.subscriptionType },
      });
      processed++;
    } catch (err) {
      Sentry.captureException(err, { extra: { eventId: event.eventId } });

      // Dead letter: store failed event for replay
      await prisma.generatedContent.create({
        data: {
          account_name: '__system__',
          content_type: 'webhook_dead_letter',
          content: JSON.stringify(event),
        },
      });
    }
  }

  return NextResponse.json({ processed, skipped });
}

async function processEvent(event: z.infer<typeof eventSchema>) {
  const type = event.subscriptionType;

  if (type === 'email.open') {
    // Find email log by HubSpot engagement ID
    await prisma.emailLog.updateMany({
      where: { hubspot_engagement_id: event.objectId.toString() },
      data: {
        status: 'opened',
        opened_at: new Date(event.occurredAt),
        open_count: { increment: 1 },
      },
    });

    // Create notification
    const log = await prisma.emailLog.findFirst({
      where: { hubspot_engagement_id: event.objectId.toString() },
    });
    if (log) {
      await prisma.notification.create({
        data: {
          type: 'open',
          account_name: log.account_name,
          persona_email: log.to_email,
          subject: log.subject,
          source_id: event.eventId.toString(),
        },
      });
    }
  } else if (type === 'email.click') {
    await prisma.emailLog.updateMany({
      where: { hubspot_engagement_id: event.objectId.toString() },
      data: {
        status: 'clicked',
        clicked_at: new Date(event.occurredAt),
      },
    });
  } else if (type === 'email.bounce') {
    const log = await prisma.emailLog.findFirst({
      where: { hubspot_engagement_id: event.objectId.toString() },
    });
    if (log) {
      // Hard bounce: the one canonical write (src/lib/email/bounce.ts), shared
      // with the GAP mailbox DSN intake (red team T9). The EmailLog write is
      // scoped to this engagement; the address's other history is untouched.
      await recordHardBounce(prisma, {
        email: log.to_email,
        source: 'hubspot_webhook',
        sourceId: event.eventId.toString(),
        accountName: log.account_name,
        subject: log.subject,
        emailLogScope: { engagementId: event.objectId.toString() },
      });
    }
  } else if (type === 'contact.propertyChange' && event.propertyName === 'hs_email_optout') {
    // HubSpot unsubscribe → DB sync
    if (event.propertyValue === 'true') {
      // Find persona by hubspot_contact_id
      await prisma.persona.updateMany({
        where: { hubspot_contact_id: event.objectId.toString() },
        data: { do_not_contact: true },
      });
    }
  }
}
