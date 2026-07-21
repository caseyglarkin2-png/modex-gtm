import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { prisma } from '@/lib/prisma';
import { getRecentReplies, markAsProcessed } from '@/lib/email/gmail-inbox';
import { classifyInboundReply } from '@/lib/email/reply-precision';
import { logReplyToHubSpot } from '@/lib/hubspot/emails';
import { searchContactByEmail, stampContactReplyIntent } from '@/lib/hubspot/contacts';
import { searchCompanyByDomain } from '@/lib/hubspot/companies';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';
import { INBOX_POLLING_ENABLED } from '@/lib/feature-flags';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { ensureLocalMeetingDealLink } from '@/lib/hubspot/deals';
import { advancePipelineStage, derivePipelineStage } from '@/lib/pipeline';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

const CRON_NAME = 'check-inbox';
const CRON_PATH = '/api/cron/check-inbox';
const CRON_SCHEDULE = '*/5 * * * *';
const FAIL_KEY = 'inbox_poll_consecutive_failures';

/**
 * Notification type for inbound mail the precision gate rejected. Chosen so it does
 * NOT contain the substring "reply": /engagement counts `type contains 'reply'`.
 */
const FILTERED_TYPE = 'filtered_inbound';

export async function GET(request: Request) {
  // Auth: Vercel cron Bearer header or ?secret= query, vs CRON_SECRET
  if (!isAuthorizedCronRequest(request)) {
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
    let filtered = 0;
    let lowConfidence = 0;
    const filterReasons: Record<string, number> = {};

    for (const reply of replies) {
      // Check if we already processed this message. Covers BOTH notification types
      // so a filtered message is not re-created on every 5-minute poll.
      const existing = await prisma.notification.findFirst({
        where: { source_id: reply.messageId, type: { in: ['reply', FILTERED_TYPE] } },
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

      // ---------------------------------------------------------------------
      // PRECISION GATE (2026-07-21). Everything below this point mutates the
      // pipeline and the CRM, and `stampContactReplyIntent` feeds hasIntent(),
      // which is the SQL gate. Before this gate an out-of-office autoresponder,
      // a statuspage.io alert or a HubSpot marketing blast could manufacture an
      // SQL. Measured base rate on the real mailbox: ~2 of 33 inbound "replies"
      // to a campaign were typed by a human.
      // ---------------------------------------------------------------------
      const verdict = classifyInboundReply({
        fromEmail: reply.fromEmail,
        headers: reply.headers,
        subject: reply.subject,
        bodyText: reply.bodyText,
        // Local Persona match is the cheap proxy for "known sender" — a HubSpot
        // lookup here would cost an API call per message. An unknown sender is
        // still processed (a new logo knocking is the hottest signal there is),
        // just reported at low confidence.
        knownContact: !!persona,
      });

      if (!verdict.isHumanReply) {
        filterReasons[verdict.reason] = (filterReasons[verdict.reason] ?? 0) + 1;
        filtered++;
        console.warn(
          `[check-inbox] filtered non-human inbound from ${reply.fromEmail} ` +
          `(reason=${verdict.reason}, subject="${reply.subject.slice(0, 80)}")`,
        );

        // Record it, clearly labeled, so the next operator can audit what the
        // filter caught. `filtered_inbound` deliberately does NOT contain the
        // substring "reply" — /engagement counts notifications with
        // `type contains 'reply'`, and a filtered message must never inflate a
        // reply metric, a digest count, or the unread-reply badge.
        await prisma.notification.create({
          data: {
            type: FILTERED_TYPE,
            account_name: persona?.account_name ?? null,
            persona_email: reply.fromEmail,
            subject: `[filtered: ${verdict.reason}] ${reply.subject}`.slice(0, 500),
            preview: reply.snippet.slice(0, 200),
            source_id: reply.messageId,
            read: true, // not actionable; do not sit unread in the bell
          },
        }).catch(() => undefined);

        // Label it in Gmail so it is not re-fetched once it is read.
        await markAsProcessed(reply.messageId).catch(() => undefined);
        continue;
      }

      if (verdict.confidence === 'low') lowConfidence++;

      // 4.7 (audit 2026-06-12): UNSOLICITED inbound - an unknown sender is
      // potentially a new logo knocking, the hottest signal there is, but
      // it previously landed only in the in-app bell. Precision gate: only
      // page when the sender's domain is a TAM-in company (keeps vendor
      // spam and newsletters out of #yardflow-intent). The robotic/own-domain
      // checks that used to live here are now covered by classifyInboundReply
      // above, which runs before this block.
      if (!persona) {
        try {
          const fromDomain = (reply.fromEmail.split('@')[1] || '').toLowerCase();
          if (fromDomain) {
            const company = await searchCompanyByDomain(fromDomain);
            if (company?.yardflow_tam === 'in') {
              await sendSlackNotification(
                `:fire: *Unsolicited inbound from a TAM account* - ${reply.fromEmail} (${company.name})` +
                String.fromCharCode(10) + `Subject: ${reply.subject}` +
                String.fromCharCode(10) + reply.snippet.slice(0, 200),
              );
            }
          }
        } catch (tamError) {
          console.error('TAM inbound check failed', tamError);
        }
      }

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

      // Persist the full conversation message + thread so the reply can
      // be read and answered in-app without opening Gmail.
      try {
        await prisma.emailThread.upsert({
          where: { id: reply.threadId },
          create: {
            id: reply.threadId,
            account_name: persona?.account_name ?? null,
            persona_email: reply.fromEmail,
            subject: reply.subject,
            last_message_at: reply.receivedAt,
          },
          update: {
            last_message_at: reply.receivedAt,
            ...(persona?.account_name ? { account_name: persona.account_name } : {}),
          },
        });
        await prisma.inboundMessage.upsert({
          where: { id: reply.messageId },
          create: {
            id: reply.messageId,
            thread_id: reply.threadId,
            rfc_message_id: reply.rfcMessageId,
            from_email: reply.fromEmail,
            from_name: reply.fromName,
            subject: reply.subject,
            body_html: reply.bodyHtml || null,
            body_text: reply.bodyText || null,
            snippet: reply.snippet,
            received_at: reply.receivedAt,
          },
          update: {},
        });
      } catch (persistError) {
        console.error('Failed to persist inbound message', persistError);
      }

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

      // Stamp reply-intent so the qualification engine's SQL gate sees it (drip replies
      // arrive via Gmail and never set HubSpot's native reply fields).
      try {
        const hsContact = await searchContactByEmail(reply.fromEmail);
        if (hsContact) await stampContactReplyIntent(hsContact.id);
      } catch {
        // Non-fatal
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

    // Reset the consecutive-failure counter. Without this it only ever ratcheted
    // up (it was stuck at 19), so past the threshold of 3 every future failure
    // fired a Sentry error regardless of actual health.
    await prisma.systemConfig.upsert({
      where: { key: FAIL_KEY },
      update: { value: '0' },
      create: { key: FAIL_KEY, value: '0' },
    }).catch(() => undefined);

    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message:
        `Processed ${replies.length} inbound. Created ${created} reply notifications, ` +
        `filtered ${filtered} non-human.`,
      stats: {
        repliesFound: replies.length,
        notificationsCreated: created,
        skipped,
        filtered,
        lowConfidence,
        filterReasons,
      },
    }).catch(() => undefined);

    return NextResponse.json({
      success: true,
      inbound_found: replies.length,
      replies_found: replies.length, // retained for existing consumers
      notifications_created: created,
      skipped,
      // Precision gate (2026-07-21): how many inbound messages were rejected as
      // non-human, and why. `filtered_reasons` keys are ReplyRejectionReason values.
      filtered,
      filtered_reasons: filterReasons,
      low_confidence_accepted: lowConfidence,
    });
  } catch (error) {
    Sentry.captureException(error);

    // Track consecutive failures. Reset to 0 on success (see the success path) so
    // this measures a real outage streak rather than a lifetime total.
    const failConfig = await prisma.systemConfig.findUnique({ where: { key: FAIL_KEY } });
    const parsedFails = parseInt(failConfig?.value || '0', 10);
    const failCount = (Number.isNaN(parsedFails) ? 0 : parsedFails) + 1;
    await prisma.systemConfig.upsert({
      where: { key: FAIL_KEY },
      update: { value: failCount.toString() },
      create: { key: FAIL_KEY, value: failCount.toString() },
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
