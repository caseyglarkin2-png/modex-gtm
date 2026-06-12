import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { runPounceScan } from '@/lib/pounce/scan';
import { PING_THRESHOLD } from '@/lib/pounce/score';
import { sendSlackNotification } from '@/lib/microsites/intent-notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Pounce Engine — daily account-trigger scan (Phase 1, Task 4).
 *
 * Scheduled (Vercel cron, Bearer auth): scans the last 36h of news for every
 * audited /for account, scores each story on the pounce taxonomy, and pings
 * #yardflow-intent with the top triggers (capped) so outreach timing rides
 * the prospect's own news cycle.
 *
 * Manual (?secret=CRON_SECRET) defaults to DRYRUN (report only, no pings) —
 * same idiom as /api/cron/qualification. Override with &mode=apply.
 * Params: &hours=336 (backfill, max 720) &minScore=8 &account=<slug>.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sp = request.nextUrl.searchParams;
  const scheduled =
    (request.headers.get('authorization') ?? '').startsWith('Bearer ') && !sp.get('secret');
  const mode = sp.get('mode') ?? (scheduled ? 'apply' : 'dryrun');
  const hours = Math.min(Math.max(Number(sp.get('hours')) || 36, 1), 720);
  const minScore = Number(sp.get('minScore')) || PING_THRESHOLD;
  const account = sp.get('account') ?? undefined;

  const result = await runPounceScan({
    hours,
    minScore,
    slugs: account ? [account] : undefined,
  });

  const PING_CAP = 6;
  let pinged = 0;
  if (mode === 'apply') {
    for (const t of result.triggers.slice(0, PING_CAP)) {
      const date = t.publishedAt.slice(0, 10);
      const ok = await sendSlackNotification(
        `🎯 POUNCE — *${t.account}*\n"${t.title}"\n${t.source} · ${date} · score ${t.score} [${t.categories.join(', ')}]\n${t.url}\nSpear: https://yardflow.ai/for/${t.slug}/`,
      );
      if (ok) pinged += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    pinged,
    ...result,
  });
}
