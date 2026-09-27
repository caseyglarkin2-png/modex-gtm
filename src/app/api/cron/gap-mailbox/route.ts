import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { classifyMailboxMessage, GAP_MAILBOX_WATERMARK_KEY, loadGapSendContext, MAILBOX_FIRST_LOOKBACK_SECONDS, MAILBOX_OVERLAP_SECONDS, pollGapMailbox } from '@/lib/gap/replies/gap-mailbox';
import { listMailboxMessages } from '@/lib/email/gmail-inbox';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-mailbox';
const CRON_PATH = '/api/cron/gap-mailbox';
const CRON_SCHEDULE = '*/10 * * * *';

/**
 * GAP mailbox intake cron (red team T9): reads the GAP mailbox
 * (GAP_GMAIL_USER_EMAIL, casey@yardflow.ai) for replies and delivery-status
 * notifications to GAP sends. Read-only toward Gmail. See
 * src/lib/gap/replies/gap-mailbox.ts for what each message becomes.
 *
 * - Auth first (Bearer, x-cron-secret, or legacy ?secret=), then the GAP
 *   flag. Off answers 200 with the skip payload so a schedule never reads as
 *   an outage. An unconfigured GAP mailbox is a skip, never a silent success.
 * - N9: a dry run unless ?mode=apply (the schedule carries it). A dry run
 *   reads and classifies and writes nothing, the watermark included.
 * - Idempotent per Gmail message id; no daily claim is needed (it sends
 *   nothing, and every write is keyed on the message).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('mode') !== 'apply';
  const mode = dryRun ? 'dryrun' : 'apply';
  const now = new Date();
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);

  const skip = assertGapEnabled('GAP_OS_ENABLED');
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
    let report: Record<string, unknown>;
    if (dryRun) {
      const stored = await prisma.systemConfig.findUnique({ where: { key: GAP_MAILBOX_WATERMARK_KEY } });
      const parsed = stored?.value ? Number.parseInt(stored.value, 10) : NaN;
      const since = Number.isFinite(parsed) ? parsed - MAILBOX_OVERLAP_SECONDS : Math.floor(now.getTime() / 1000) - MAILBOX_FIRST_LOOKBACK_SECONDS;
      const messages = await listMailboxMessages(sender, since);
      const ctx = await loadGapSendContext(prisma);
      const counts: Record<string, number> = {};
      for (const m of messages) {
        const kind = classifyMailboxMessage(m, ctx, sender.userEmail).kind;
        counts[kind] = (counts[kind] ?? 0) + 1;
      }
      report = { since, seen: messages.length, counts };
    } else {
      report = { ...(await pollGapMailbox(prisma, { now }, { list: (after) => listMailboxMessages(sender, after), mailbox: sender.userEmail })) };
    }
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${mode}: ${String(report.seen)} inbox messages since ${String(report.since)}`,
      stats: { mode, ...report },
    }).catch(() => undefined);
    return NextResponse.json({ ...report, mode, mailbox: sender.userEmail });
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
