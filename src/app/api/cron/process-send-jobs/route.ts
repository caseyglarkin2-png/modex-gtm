import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/client';
import { markCronFailure, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { SOURCE_APPROVAL_GATE_ENABLED } from '@/lib/feature-flags';
import { requiresApprovalForSend } from '@/lib/revops/generated-content-approval';
import { buildCandidateTraceLookup, resolveCandidateTrace } from '@/lib/revops/candidate-trace';
import { recordSourceBackedMetric } from '@/lib/source-backed/metrics';

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
      select: {
        id: true,
        send_strategy: true,
        recipients: {
          where: { status: 'pending' },
          orderBy: { created_at: 'asc' },
          take: 100,
        },
      },
    });

    const processed: Array<{ jobId: number; status: string; sent: number; failed: number; skipped: number }> = [];

    for (const job of pendingJobs) {
      const candidateTraceLookup = await buildCandidateTraceLookup(prisma, {
        accountNames: Array.from(new Set(job.recipients.map((recipient) => recipient.account_name))),
        emails: Array.from(new Set(job.recipients.flatMap((recipient) => [recipient.to_email, ...(recipient.cc_emails ?? [])]))),
      });

      await prisma.sendJob.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          started_at: new Date(),
        },
      });

      for (const recipient of job.recipients) {
        if (recipient.status !== 'pending') {
          continue;
        }

        await prisma.sendJobRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sending', attempted_at: new Date() },
        });

        try {
          if (SOURCE_APPROVAL_GATE_ENABLED) {
            const approvalDecision = await requiresApprovalForSend(prisma, recipient.generated_content_id);
            if (!approvalDecision.approved) {
              await recordSourceBackedMetric({
                metric: 'approval_blocks',
                endpoint: '/api/cron/process-send-jobs',
                accountName: recipient.account_name,
                details: {
                  generatedContentId: recipient.generated_content_id,
                  status: approvalDecision.status,
                },
              });
              await prisma.sendJobRecipient.update({
                where: { id: recipient.id },
                data: {
                  status: 'skipped',
                  error_message: `APPROVAL_REQUIRED:${approvalDecision.status}`,
                },
              });
              continue;
            }
          }

          const result = await sendEmail({
            to: recipient.to_email,
            cc: recipient.cc_emails ?? [],
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
              metadata: (() => {
                const strategy = job.send_strategy && typeof job.send_strategy === 'object'
                  ? job.send_strategy as Record<string, unknown>
                  : null;
                const workflow = strategy?.workflow;
                if (!workflow || typeof workflow !== 'object') return undefined;
                const recipientCandidateTrace = resolveCandidateTrace(candidateTraceLookup, {
                  email: recipient.to_email,
                  accountName: recipient.account_name,
                });
                const ccCandidateTraces = (recipient.cc_emails ?? [])
                  .map((email) => ({
                    email,
                    trace: resolveCandidateTrace(candidateTraceLookup, {
                      email,
                      accountName: recipient.account_name,
                    }),
                  }))
                  .filter((entry) => entry.trace)
                  .map((entry) => ({
                    email: entry.email,
                    trace: entry.trace,
                  }));
                return JSON.parse(JSON.stringify({
                  workflow: {
                    ...workflow,
                    details: {
                      ...((workflow as Record<string, unknown>).details && typeof (workflow as Record<string, unknown>).details === 'object'
                        ? ((workflow as Record<string, unknown>).details as Record<string, unknown>)
                        : {}),
                      candidateTrace: {
                        recipient: recipientCandidateTrace,
                        cc: ccCandidateTraces,
                      },
                    },
                  },
                  recipient: {
                    sendJobRecipientId: recipient.id,
                    cc: recipient.cc_emails ?? [],
                    candidateTrace: recipientCandidateTrace,
                    ccCandidateTraces,
                  },
                }));
              })(),
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

        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          await prisma.sendJobRecipient.update({
            where: { id: recipient.id },
            data: {
              status: 'failed',
              error_message: message.slice(0, 1000),
            },
          });
        }
      }

      const aggregateStatuses = await prisma.sendJobRecipient.findMany({
        where: { send_job_id: job.id },
        select: { status: true },
      });
      const aggregateCounts = aggregateStatuses.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = (acc[row.status] ?? 0) + 1;
        return acc;
      }, {});
      const totalSent = aggregateCounts.sent ?? 0;
      const totalFailed = aggregateCounts.failed ?? 0;
      const totalSkipped = aggregateCounts.skipped ?? 0;
      const totalPending = (aggregateCounts.pending ?? 0) + (aggregateCounts.sending ?? 0);
      const completedStatus = totalPending > 0
        ? 'processing'
        : totalFailed === 0 && totalSkipped === 0 && totalSent > 0
          ? 'completed'
          : totalSent > 0
            ? 'partial'
            : 'failed';
      await prisma.sendJob.update({
        where: { id: job.id },
        data: {
          status: completedStatus,
          completed_at: totalPending > 0 ? null : new Date(),
          sent_count: totalSent,
          failed_count: totalFailed,
          skipped_count: totalSkipped,
          error_message: completedStatus === 'failed' ? 'All recipients failed' : null,
        },
      });

      processed.push({ jobId: job.id, status: completedStatus, sent: totalSent, failed: totalFailed, skipped: totalSkipped });
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
