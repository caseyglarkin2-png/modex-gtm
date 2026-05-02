import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import { markCronFailure, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  secret: z.string().min(1),
});

const CRON_NAME = 'process-send-jobs';
const CRON_PATH = '/api/cron/process-send-jobs';
const CRON_SCHEDULE = '*/2 * * * *';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ secret: searchParams.get('secret') ?? '' });
  if (!parsed.success || parsed.data.secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  try {
    const pendingJobs = await prisma.sendJob.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' },
      take: 2,
      include: {
        recipients: {
          where: { status: 'pending' },
          orderBy: { created_at: 'asc' },
          take: 100,
        },
      },
    });

    const processed: Array<{ jobId: number; status: string; sent: number; failed: number; skipped: number }> = [];

    for (const job of pendingJobs) {
      await prisma.sendJob.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          started_at: new Date(),
        },
      });

      let sent = 0;
      let failed = 0;
      let skipped = 0;

      for (const recipient of job.recipients) {
        if (recipient.status !== 'pending') {
          skipped += 1;
          continue;
        }

        await prisma.sendJobRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sending', attempted_at: new Date() },
        });

        try {
          const result = await sendEmail({
            to: recipient.to_email,
            subject: recipient.subject,
            html: recipient.body_html,
          });

          const emailLog = await prisma.emailLog.create({
            data: {
              account_name: recipient.account_name,
              campaign_id: recipient.campaign_id ?? undefined,
              persona_name: recipient.persona_name ?? null,
              to_email: recipient.to_email,
              subject: recipient.subject,
              body_html: recipient.body_html,
              status: 'sent',
              provider_message_id: result.headers['x-message-id'] ?? null,
              generated_content_id: recipient.generated_content_id,
              hubspot_engagement_id: result.hubspotEngagementId ?? null,
            },
            select: { id: true },
          });

          await prisma.sendJobRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'sent',
              sent_at: new Date(),
              provider_message_id: result.headers['x-message-id'] ?? null,
              hubspot_engagement_id: result.hubspotEngagementId ?? null,
              email_log_id: emailLog.id,
            },
          });

          await prisma.generatedContent.update({
            where: { id: recipient.generated_content_id },
            data: { external_send_count: { increment: 1 } },
          }).catch(() => undefined);

          sent += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await prisma.sendJobRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'failed',
              error_message: message.slice(0, 1000),
            },
          });
          failed += 1;
        }
      }

      const completedStatus = failed === 0 && sent > 0 ? 'completed' : sent > 0 ? 'partial' : 'failed';
      await prisma.sendJob.update({
        where: { id: job.id },
        data: {
          status: completedStatus,
          completed_at: new Date(),
          sent_count: sent,
          failed_count: failed,
          skipped_count: skipped,
          error_message: completedStatus === 'failed' ? 'All recipients failed' : null,
        },
      });

      processed.push({ jobId: job.id, status: completedStatus, sent, failed, skipped });
    }

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `Processed ${processed.length} send jobs`,
      stats: { processed },
    }).catch(() => undefined);

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    Sentry.captureException(error);
    await markCronFailure(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      error,
    }).catch(() => undefined);

    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
