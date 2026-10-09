import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { runClawdImport } from '@/lib/gap/signals/clawd-import';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const CRON_NAME = 'gap-clawd-import';
const CRON_PATH = '/api/cron/gap-clawd-import';
const CRON_SCHEDULE = '20 */2 * * *';

/**
 * GET /api/cron/gap-clawd-import   (intelligence wiring, IW07 on a schedule, 2026-10-09)
 *
 * The Clawd signal hunter's read-only export into GAP's intelligence records every two hours: from the cursor the
 * last import recorded, at most three pages of two hundred, the retained low-score candidates included, one retry on
 * a network failure, a failed ledger row on a failure (health and the briefing's coverage say so). The control plane
 * is CLAWD_CONTROL_PLANE_URL with CLAWD_CONTROL_PLANE_TOKEN (the production names; MC_API_TOKEN and CLAWD_BASE_URL
 * are read too). No credential is logged. Nothing here posts to Slack, writes HubSpot, drafts or sends.
 *
 * - Auth first, then GAP_OS_ENABLED. Off answers 200 with the skip payload.
 * - No control-plane url or token is a skip with the reason, never an error.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const startedAt = Date.now();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled();
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const baseUrl = (process.env.CLAWD_CONTROL_PLANE_URL ?? process.env.CLAWD_BASE_URL ?? '').trim();
  const token = (process.env.CLAWD_CONTROL_PLANE_TOKEN ?? process.env.MC_API_TOKEN ?? '').trim();
  if (!baseUrl || !token) {
    const reason = !baseUrl ? 'clawd_control_plane_url_not_set' : 'clawd_control_plane_token_not_set';
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason }).catch(() => undefined);
    return NextResponse.json({ skipped: true, reason });
  }
  try {
    const result = await runClawdImport(prisma, { now: new Date(), baseUrl, token, candidates: true });
    if (!result.ok) {
      await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error: new Error(`${result.kind}: ${result.error}`) }).catch(() => undefined);
      return NextResponse.json(result, { status: 502 });
    }
    const message = `${result.pages} page${result.pages === 1 ? '' : 's'}, ${result.items} items: ${result.accepted} accepted, ${result.duplicates} duplicates, ${result.revised} revised, ${result.invalid} invalid${result.more ? '; more waits for the next run' : ''}`;
    await markCronSuccess(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, message, stats: { ...result } }).catch(() => undefined);
    return NextResponse.json(result);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
