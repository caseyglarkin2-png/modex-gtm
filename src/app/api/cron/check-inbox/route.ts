import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getRecentReplies, markAsProcessed } from '@/lib/email/gmail-inbox';
import { logReplyToHubSpot } from '@/lib/hubspot/emails';
import { INBOX_POLLING_ENABLED } from '@/lib/feature-flags';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  secret: z.string().min(1),
});

const CRON_NAME = 'check-inbox';
const CRON_PATH = '/api/cron/check-inbox';
const CRON_SCHEDULE = '*/5 * * * *';

export async function GET(request: Request) {
  // Auth: validate CRON_SECRET
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ secret: searchParams.get('secret') ?? '' });

  if (!parsed.success || parsed.data.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  // Feature flag gate
  if (!INBOX_POLLING_ENABLED) {
    await markCronSkipped(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      reason: 'INBOX_POLLING_ENABLED is false',
    }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason: 'INBOX_POLLING_ENABLED is false' });
  }

  try {
    // Get last poll timestamp from SystemConfig
    const lastPollConfig = await prisma.systemConfig.findUnique({
      where: { key: 'last_inbox_poll' },
    });

    let sinceTimestamp: number;
    if (lastPollConfig?.value) {
      const parsed = parseInt(lastPollConfig.value, 10);
      if (isNaN(parsed)) {
        // Corrupt value: fallback to 24h ago + Sentry warning
        Sentry.captureMessage('Corrupt last_inbox_poll value, falling back to 24h', {
          extra: { value: lastPollConfig.value },
        });
        sinceTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
      } else {
        sinceTimestamp = parsed;
      }
    } else {
      // First run: poll from 24h ago
      sinceTimestamp = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
    }

    const replies = await getRecentReplies(sinceTimestamp);

    let created = 0;
    let skipped = 0;

    for (const reply of replies) {
      // Check if we already processed this message
      const existing = await prisma.notification.findFirst({
        where: { source_id: reply.messageId, type: 'reply' },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Try to match to a persona by email
      const persona = await prisma.persona.findFirst({
        where: { email: reply.fromEmail },
        include: { account: true },
      });

      // Create Notification
      await prisma.notification.create({
        data: {
          type: 'reply',
          account_name: persona?.account_name ?? null,
          persona_email: reply.fromEmail,
          subject: reply.subject,
          preview: reply.snippet.slice(0, 200),
          source_id: reply.messageId,
          read: false,
        },
      });

      // Create Activity if persona found
      if (persona) {
        await prisma.activity.create({
          data: {
            activity_date: reply.receivedAt,
            account_name: persona.account_name,
            persona: persona.name,
            activity_type: 'reply_received',
            owner: 'System',
            outcome: `Reply from ${reply.from}: ${reply.snippet.slice(0, 100)}`,
          },
        });

        // Update persona email_status to "replied"
        await prisma.persona.update({
          where: { id: persona.id },
          data: { email_status: 'replied' },
        });

        const nextStage = advancePipelineStage(
          derivePipelineStage({
            pipeline_stage: persona.account.pipeline_stage,
            outreach_status: persona.account.outreach_status,
            meeting_status: persona.account.meeting_status,
          }),
          'engaged',
        );

        await prisma.account.updateMany({
          where: { name: persona.account_name },
          data: {
            outreach_status: 'Replied',
            pipeline_stage: nextStage,
            current_motion: `Pipeline stage: ${nextStage}`,
          },
        }).catch(() => undefined);

        await ensureLocalMeetingDealLink(persona.account_name, nextStage).catch(() => undefined);

        // Increment reply_count on matching EmailLog by thread
        if (reply.subject) {
          const cleanSubject = reply.subject.replace(/^(Re:\s*)+/i, '').trim();
          await prisma.emailLog.updateMany({
            where: {
              to_email: reply.fromEmail,
              subject: { contains: cleanSubject },
            },
            data: { reply_count: { increment: 1 } },
          });
        }
      }

      // Mark as processed in Gmail
      try {
        await markAsProcessed(reply.messageId);
      } catch {
        // Non-fatal: label failure shouldn't block processing
      }

      // Log reply to HubSpot
      try {
        await logReplyToHubSpot(reply.subject, reply.snippet, reply.fromEmail);
      } catch {
        // Non-fatal: HubSpot failure shouldn't block processing
      }

      created++;
    }

    // Update poll timestamp
    const nowEpoch = Math.floor(Date.now() / 1000).toString();
    await prisma.systemConfig.upsert({
      where: { key: 'last_inbox_poll' },
      update: { value: nowEpoch },
      create: { key: 'last_inbox_poll', value: nowEpoch },
    });

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Processed ${replies.length} replies. Created ${created} notifications.`,
      stats: {
        repliesFound: replies.length,
        notificationsCreated: created,
        skipped,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      replies_found: replies.length,
      notifications_created: created,
      skipped,
    });
  } catch (error) {
    Sentry.captureException(error);

    // Track consecutive failures
    const failKey = 'inbox_poll_consecutive_failures';
    const failConfig = await prisma.systemConfig.findUnique({ where: { key: failKey } });
    const failCount = parseInt(failConfig?.value || '0', 10) + 1;
    await prisma.systemConfig.upsert({
      where: { key: failKey },
      update: { value: failCount.toString() },
      create: { key: failKey, value: failCount.toString() },
    });

    if (failCount >= 3) {
      Sentry.captureMessage(`Inbox polling failed ${failCount} consecutive times`, {
        level: 'error',
      });
    }

    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
      stats: { failCount },
    }).catch(() => undefined);

    return NextResponse.json(
      { error: 'Inbox polling failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
