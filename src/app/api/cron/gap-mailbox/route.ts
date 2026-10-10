import { NextResponse, after } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { classifyMailboxMessage, GAP_MAILBOX_WATERMARK_KEY, loadGapSendContext, MAILBOX_FIRST_LOOKBACK_SECONDS, MAILBOX_OVERLAP_SECONDS, pollGapMailbox } from '@/lib/gap/replies/gap-mailbox';
import { getMailboxMessage, listMailboxIds, listSentTo } from '@/lib/email/gmail-inbox';
import { reconcileUnknownSends } from '@/lib/gap/execution/unknown-send-reconcile';
import { reconcileFollowUpsFromSent } from '@/lib/gap/execution/follow-up-load';
import { reconcileCopiesFromSent } from '@/lib/gap/execution/copies-reconcile';
import { prisma } from '@/lib/prisma';
import { sendViaGmail } from '@/lib/email/gmail-sender';
import { applyCommand, loadCommandContext } from '@/lib/gap/replies/commands-apply';
import { retryDispositionMirrors } from '@/lib/gap/disposition/mirror-retry';
import { reviseRequest } from '@/lib/gap/agents/revise-message';
import { approveRequest } from '@/lib/gap/agents/approve-request';
import { agentTaskHandlers } from '@/lib/gap/agents/handlers';
import { runAgentTasks } from '@/lib/gap/agents/tasks';
import { gapFlag } from '@/lib/gap/flags';
import { actionSecret } from '@/lib/gap/work/action-token';
import { loadSellerSettings } from '@/lib/gap/work/settings';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-mailbox';
const CRON_PATH = '/api/cron/gap-mailbox';
const CRON_SCHEDULE = '*/10 * * * *';
/** A dry run classifies at most this many unhandled messages. */
const DRY_RUN_SAMPLE = 50;

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
      const listing = await listMailboxIds(sender, since);
      const ctx = await loadGapSendContext(prisma);
      const handled = await prisma.gapAuditEvent.findMany({
        where: { subject_type: 'gmail_message', subject_id: { in: listing.ids.slice(0, 1000) }, kind: { startsWith: 'mailbox.' } },
        select: { subject_id: true },
      });
      const done = new Set(handled.map((r: { subject_id: string }) => r.subject_id));
      const pending = listing.ids.filter((id) => !done.has(id));
      const counts: Record<string, number> = {};
      for (const id of pending.slice(0, DRY_RUN_SAMPLE)) {
        const kind = classifyMailboxMessage(await getMailboxMessage(sender, id), ctx, sender.userEmail).kind;
        counts[kind] = (counts[kind] ?? 0) + 1;
      }
      report = { since, seen: listing.ids.length, pending: pending.length, sampled: Math.min(pending.length, DRY_RUN_SAMPLE), counts };
    } else {
      // X07: the seller's email commands. The senders come from the seller settings; the assignment and briefing
      // threads from the ledger; an authenticated command's effect runs after its verdict row (commands-apply.ts).
      const settings = await loadSellerSettings(prisma);
      const commands = settings.commandSenders.length ? await loadCommandContext(prisma, settings, now) : undefined;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '') || 'https://modex-gtm.vercel.app';
      report = {
        ...(await pollGapMailbox(
          prisma,
          { now },
          {
            listIds: (after) => listMailboxIds(sender, after),
            fetch: (id) => getMailboxMessage(sender, id),
            mailbox: sender.userEmail,
            commands,
            onCommand: async (m, _v, at) => {
              const r = await applyCommand(prisma, { m, ctx: commands as NonNullable<typeof commands>, now: at, settings, sender, baseUrl, actionSecret: actionSecret(), actor: 'cron:gap-mailbox' }, { send: sendViaGmail, onRevise: reviseRequest, onApprove: approveRequest });
              // X09: a REVISE does not wait for the five-minute tick; the drain runs after this response (the same lease rules).
              if (r.applied && r.effect === 'revision_queued' && gapFlag('GAP_AGENT_TASKS_ENABLED')) {
                after(() => runAgentTasks(prisma, { now: new Date(), max: 1, claimer: 'after:gap-mailbox', handlers: agentTaskHandlers() }).catch(() => undefined));
              }
            },
          },
        )),
      };
      // The DONE unification: a reply DONE whose HubSpot mirror failed is retried here (at most three attempts each,
      // bounded per tick; the mirror is idempotent by its key, so a retry never posts a second note).
      report.mirrorRetries = await retryDispositionMirrors(prisma, { now }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
      // Ops closeout 13B: direct sends whose Gmail answer was lost, reconciled against Sent.
      // Still-unknown ones stay visible in the report; they are never read as not sent.
      report.unknownSends = await reconcileUnknownSends(prisma, { now }, { listSent: (rcpt, a, b) => listSentTo(sender, rcpt, a, b), mailbox: sender.userEmail });
      // R43: a follow-up sent by hand from this mailbox closes its obligation (Sent is the proof; nothing else is written).
      report.followUpsFromSent = await reconcileFollowUpsFromSent(prisma, { now }, { listSent: (rcpt, a, b) => listSentTo(sender, rcpt, a, b) }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
      // X14: copied is not sent. A copied reply or cold email is recorded as sent only once Sent shows it went (the proof is the Gmail message).
      report.copiesFromSent = await reconcileCopiesFromSent(prisma, { now }, { listSent: (rcpt, a, b) => listSentTo(sender, rcpt, a, b) }).catch((e) => ({ error: e instanceof Error ? e.message : String(e) }));
      // Release C review S2: a failed or quarantined message, an unattributable
      // delivery notice or a truncated listing is never a quiet success.
      const errors = Array.isArray(report.errors) ? (report.errors as string[]) : [];
      if (errors.length > 0) {
        await markCronFailure(CRON_NAME, {
          path: CRON_PATH,
          schedule: CRON_SCHEDULE,
          durationMs: Date.now() - startedAt,
          error: new Error(`${errors.length} mailbox intake error(s): ${errors.slice(0, 3).join(' | ')}`),
        }).catch(() => undefined);
        return NextResponse.json({ ...report, mode, mailbox: sender.userEmail, ok: false });
      }
    }
    await markCronSuccess(CRON_NAME, {
      path: CRON_PATH,
      schedule: CRON_SCHEDULE,
      durationMs: Date.now() - startedAt,
      message: `${mode}: ${String(report.seen)} inbox messages since ${String(report.since)}${(report.unknownSends as { stillUnknown?: unknown[] } | undefined)?.stillUnknown?.length ? `; ${(report.unknownSends as { stillUnknown: unknown[] }).stillUnknown.length} unknown-outcome send(s)` : ''}`,
      stats: { mode, ...report },
    }).catch(() => undefined);
    return NextResponse.json({ ...report, mode, mailbox: sender.userEmail });
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
