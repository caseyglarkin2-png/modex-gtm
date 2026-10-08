import { NextResponse } from 'next/server';
import { isAuthorizedCronRequest } from '@/lib/cron-auth';
import { markCronFailure, markCronSkipped, markCronStarted, markCronSuccess } from '@/lib/cron-monitor';
import { assertGapEnabled } from '@/lib/gap/flags';
import { agentTaskHandlers } from '@/lib/gap/agents/handlers';
import { runAgentTasks } from '@/lib/gap/agents/tasks';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CRON_NAME = 'gap-agent-tasks';
const CRON_PATH = '/api/cron/gap-agent-tasks';
const CRON_SCHEDULE = '*/5 * * * *';
/** A few tasks per tick: each may spend an LLM call and a compile; the lease outlives the function. */
export const AGENT_TASKS_PER_RUN = 3;

/**
 * GET /api/cron/gap-agent-tasks   (X08, GAP OS sales execution engine, 2026-10-08)
 *
 * The drain for durable agent tasks (src/lib/gap/agents/tasks.ts): claim a
 * few, run each handler (src/lib/gap/agents/handlers.ts), record a success or
 * a failure. A handler's result is a PROPOSAL the seller approves; nothing
 * here sends, drafts, enrolls or writes HubSpot. The command handler also
 * kicks a run with `after()` so a REVISE does not wait for the tick.
 *
 * - Auth first, then the flags (GAP_OS_ENABLED + GAP_ROUTING_ENABLED +
 *   GAP_AGENT_TASKS_ENABLED). Off answers 200 with the skip payload.
 * - `?max=N` (1..10) overrides the per-run cap.
 * - A failed task is reported (the cron stays visible); a retry waits for the
 *   next tick or the lease to lapse.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const startedAt = Date.now();
  const now = new Date();
  await markCronStarted(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE }).catch(() => undefined);
  const skip = assertGapEnabled('GAP_ROUTING_ENABLED', 'GAP_AGENT_TASKS_ENABLED');
  if (skip) {
    await markCronSkipped(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, reason: skip.reason }).catch(() => undefined);
    return NextResponse.json(skip);
  }
  const maxParam = Number(new URL(request.url).searchParams.get('max'));
  const max = Number.isInteger(maxParam) && maxParam > 0 ? Math.min(10, maxParam) : AGENT_TASKS_PER_RUN;
  try {
    const report = await runAgentTasks(prisma, { now, max, claimer: 'cron:gap-agent-tasks', handlers: agentTaskHandlers() });
    const stats = report as unknown as Record<string, unknown>;
    const durationMs = Date.now() - startedAt;
    if (report.failed > 0) {
      const failed = report.results.filter((r) => r.outcome !== 'succeeded').map((r) => `${r.itemKey} ${r.error ?? ''}`).slice(0, 3).join(' | ');
      await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs, error: new Error(`${report.failed} of ${report.claimed} agent task(s) failed: ${failed}`), stats }).catch(() => undefined);
    } else {
      await markCronSuccess(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs, message: `${report.succeeded} of ${report.claimed} agent task(s) done`, stats }).catch(() => undefined);
    }
    return NextResponse.json(report);
  } catch (error) {
    await markCronFailure(CRON_NAME, { path: CRON_PATH, schedule: CRON_SCHEDULE, durationMs: Date.now() - startedAt, error }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
