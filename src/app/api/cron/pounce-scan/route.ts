import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { runPounceScan } from '@/lib/pounce/scan';
import { PING_THRESHOLD } from '@/lib/pounce/score';
import { ingestTriggers, type RawTrigger } from '@/lib/pounce/ingest';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Pounce Engine — daily account-trigger scan (news source).
 *
 * Scheduled (Vercel cron, Bearer auth): scans the last 36h of news for every
 * audited /for account, scores each story, and routes the hits through the
 * shared spine (ingestTriggers) — which dedupes against the PounceTrigger
 * table and fires Slack + HubSpot EXACTLY ONCE per story, across all sources
 * and runs. This route no longer pings Slack itself; the spine owns that.
 *
 * Manual (?secret=CRON_SECRET) defaults to DRYRUN (scan + report, NO ingest /
 * no pings). Override with &mode=apply. Params: &hours=336 (max 720)
 * &minScore=6 &account=<slug>.
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

  let ingest = null;
  if (mode === 'apply') {
    const raw: RawTrigger[] = result.triggers.map((t) => ({
      accountSlug: t.slug,
      accountName: t.account,
      title: t.title,
      url: t.url,
      source: 'news',
      score: t.score,
      categories: t.categories,
      publishedAt: t.publishedAt,
    }));
    ingest = await ingestTriggers(raw);
  }

  return NextResponse.json({ ok: true, mode, ingest, ...result });
}
