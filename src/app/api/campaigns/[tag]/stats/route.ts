import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { isAuthorizedQueueAgent } from '@/lib/queue/agent-auth';
import { getCampaignStats } from '@/lib/campaigns/stats';

/**
 * Campaign cohort stats. Called by the Clawd digest (Bearer QUEUE_AGENT_SECRET)
 * and internal tooling (Bearer CRON_SECRET / ?secret=). Either credential is
 * accepted. The heavy lifting lives in getCampaignStats() so a server component
 * (the command-center page) can reuse it without an HTTP hop.
 *
 * Fail-soft: getCampaignStats() already returns a zeroed shape with an `error`
 * note on a DB failure, so this route stays 200 in that case.
 */

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tag: string }> },
): Promise<Response> {
  if (!isAuthorizedQueueAgent(request) && !isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tag } = await params;
  const campaignTag = decodeURIComponent(tag);

  const stats = await getCampaignStats(campaignTag);
  return NextResponse.json(stats);
}
