import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { claimDailyRun, releaseDailyRun } from '@/lib/cron-idempotency';
import { prisma } from '@/lib/prisma';
import { loadLatestScored, buildCuratedRows } from '@/lib/discovery/data';
import { enrichRowsWithPipeline } from '@/lib/discovery/enrich';
import { selectFreshTopAccounts } from '@/lib/discovery/auto-dispatch';
import { prepareClawdDispatch, dispatchDraftBatch } from '@/lib/discovery/clawd-dispatch';

const OWNER = 'casey@freightroll.com';
const DAILY_N = Number(process.env.AUTO_DISPATCH_DAILY_N || '50');

function enabled(): boolean {
  return (process.env.AUTO_DISPATCH_DAILY_ENABLED || 'false').toLowerCase() === 'true';
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!enabled()) {
    return NextResponse.json({ skipped: true, reason: 'AUTO_DISPATCH_DAILY_ENABLED=false' });
  }

  const output = loadLatestScored();
  if (!output) return NextResponse.json({ dispatched: 0, reason: 'no worklist' });

  const rows = await enrichRowsWithPipeline(buildCuratedRows(output));

  // Freshness: drop accounts emailed or queued in the last 30 days.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [emailed, queued] = await Promise.all([
    prisma.emailLog.findMany({
      where: { sent_at: { gte: since } },
      distinct: ['account_name'],
      select: { account_name: true },
    }),
    prisma.draftQueueItem.findMany({
      where: { created_at: { gte: since } },
      distinct: ['account_name'],
      select: { account_name: true },
    }),
  ]);
  const contactedNames = new Set<string>(
    [...emailed, ...queued]
      .map((r) => (r.account_name || '').trim().toLowerCase())
      .filter(Boolean),
  );

  const fresh = selectFreshTopAccounts(rows, DAILY_N, { contactedNames });
  if (fresh.length === 0) return NextResponse.json({ dispatched: 0, reason: 'no fresh accounts' });

  const prepared = prepareClawdDispatch(OWNER, fresh);
  if (!prepared.ok) return NextResponse.json({ dispatched: 0, reason: prepared.reason });

  // Idempotency: claim today's run right before we hand a batch to Clawd, so a
  // nudged or retried invocation on the same day no-ops instead of re-sending.
  // Released below if the dispatch itself fails, so a genuine retry can proceed.
  const claim = await claimDailyRun('dispatch-daily');
  if (!claim.claimed) return NextResponse.json({ dispatched: 0, reason: claim.reason });

  let result;
  try {
    result = await dispatchDraftBatch(prepared.payload);
  } catch (err) {
    await releaseDailyRun('dispatch-daily');
    throw err;
  }
  if (!result.ok) await releaseDailyRun('dispatch-daily');

  return NextResponse.json({
    dispatched: fresh.length,
    accepted: result.ok ? result.accepted : 0,
    batchId: result.ok ? result.batchId : null,
    dispatchOk: result.ok,
  });
}
