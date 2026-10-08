import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { sendViaGmail } from '@/lib/email/gmail-sender';
import { listSentTo } from '@/lib/email/gmail-inbox';
import { actionSecret } from '@/lib/gap/work/action-token';
import { sendMorningBriefing } from '@/lib/gap/work/briefing-send';
import { loadWorkDay } from '@/lib/gap/work/load-day';
import { decisionIdsFromCandidates } from '@/lib/gap/work/plan';
import { loadSellerSettings } from '@/lib/gap/work/settings';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-briefing';
const CRON_PATH = '/api/cron/gap-briefing';
/** Hourly at :05; the send happens on the first tick at or after the seller's configured New York hour. */
const CRON_SCHEDULE = '5 * * * *';

/**
 * GET /api/cron/gap-briefing   (X05b, GAP OS sales execution engine, 2026-10-08)
 *
 * The morning briefing: the day's plan (the one day builder, X01, snapshotted
 * by X04) mailed once to the seller's configured address (X03) from the GAP
 * identity as an internal message. The rules (skip before the hour, claim
 * before sending, retry after a failure, recover from Sent, abandon after
 * three) are in src/lib/gap/work/briefing-send.ts. Nothing here goes to a
 * buyer; nothing is drafted, enrolled or written to HubSpot.
 *
 * - Auth first, then the flags (GAP_OS_ENABLED + GAP_ROUTING_ENABLED +
 *   GAP_BRIEFING_ENABLED). Off answers 200 with the skip payload.
 * - An unconfigured GAP mailbox is a skip, never a silent success.
 * - Email commands (X07) are announced in the footer (COMMANDS_ENABLED).
 */
const COMMANDS_ENABLED = true;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  const now = new Date();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_BRIEFING_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const sender = gapGmailSender();
  if (!sender) {
    const reason = 'gap_mailbox_not_configured';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
  }
  try {
    const settings = await loadSellerSettings(prisma);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || 'https://modex-gtm.vercel.app';
    const result = await sendMorningBriefing(
      prisma,
      {
        now,
        settings,
        sender,
        baseUrl,
        actionSecret: actionSecret(),
        commandsEnabled: COMMANDS_ENABLED,
        legacyDigest: true,
        load: async () => {
          const l = await loadWorkDay(prisma, { lane: false, preview: false, fresh: true, now });
          return { day: l.day, decisionIds: decisionIdsFromCandidates(l.data.workInput.candidates) };
        },
      },
      { send: sendViaGmail, listSent: (rcpt, a, b) => listSentTo(sender, rcpt, a, b) },
    );
    if ('skipped' in result) {
      await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: result.reason }).catch(() => undefined);
      return NextResponse.json(result);
    }
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${result.day}: ${result.items} items to ${result.to}${result.recoveredFromSent ? ' (recorded from Sent)' : ''}`,
      stats: result as unknown as Record<string, unknown>,
    }).catch(() => undefined);
    return NextResponse.json(result);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
