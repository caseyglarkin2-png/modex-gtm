import { prisma } from '@/lib/prisma';

export type CronStateStatus = 'idle' | 'running' | 'ok' | 'error' | 'skipped';

export interface CronStateValue {
  name: string;
  path: string;
  schedule: string;
  status: CronStateStatus;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastDurationMs?: number;
  lastMessage?: string;
  lastStats?: Record<string, unknown>;
  consecutiveFailures?: number;
  runCount?: number;
}

/**
 * Every job the /ops monitor knows how to display.
 *
 * The first nine entries mirror `vercel.json` `crons` exactly and are the
 * source of truth for "is the scheduled fleet alive". Four of them
 * (qualification, dispatch-daily, pounce-scan, refresh-intel) were missing
 * here for months, so /ops rendered a confident green fleet while saying
 * nothing at all about the jobs that gate SQL promotion and outbound
 * dispatch. A monitor that omits a job cannot report that job as dead.
 *
 * The trailing entries are routes that exist but are NOT Vercel-scheduled
 * (they are driven by the queue or were de-scheduled). They are kept so a
 * manual trigger still records state, but they will never self-report a run.
 */
export const KNOWN_CRONS: Array<{ name: string; label: string; path: string; schedule: string }> = [
  // --- Vercel-scheduled (vercel.json) ---
  { name: 'check-inbox', label: 'Inbox Polling', path: '/api/cron/check-inbox', schedule: '*/5 * * * *' },
  { name: 'dispatch-daily', label: 'Daily Dispatch', path: '/api/cron/dispatch-daily', schedule: '0 11 * * 1-5' },
  { name: 'qualification', label: 'MQL/SQL Qualification', path: '/api/cron/qualification', schedule: '30 11 * * *' },
  // Scheduled 2026-07-30. It runs but stays inert until WARM_DISPATCH_ENABLED is
  // true, which is deliberate: scheduling it now means arming it later is one env
  // var rather than a deploy, and /ops shows it skipping rather than hiding it.
  { name: 'warm-dispatch', label: 'Warm Committee Dispatch', path: '/api/cron/warm-dispatch', schedule: '15 12 * * 1-5' },
  { name: 'daily-digest', label: 'Daily Digest', path: '/api/cron/daily-digest', schedule: '0 12 * * *' },
  { name: 'drip-sequence', label: 'Campaign Drip', path: '/api/cron/drip-sequence', schedule: '0 13 * * *' },
  { name: 'pounce-scan', label: 'Pounce Scan', path: '/api/cron/pounce-scan', schedule: '5 13 * * *' },
  { name: 'refresh-intel', label: 'Intel Refresh', path: '/api/cron/refresh-intel', schedule: '0 13 * * 1' },
  { name: 'sync-hubspot', label: 'HubSpot Sync', path: '/api/cron/sync-hubspot', schedule: '0 */6 * * *' },
  { name: 'reenrich-contacts', label: 'Contact Re-enrichment', path: '/api/cron/reenrich-contacts', schedule: '0 */8 * * *' },

  // --- Routes that exist but are not Vercel-scheduled ---
  // These declare no schedule because nothing schedules them. They are absent
  // from vercel.json, so they are manual-trigger-only for any holder of
  // CRON_SECRET. They previously carried '*/5 * * * *', '*/2 * * * *' and
  // '5 11 * * 1', and THIS file is what the ops UI renders for a cron that has
  // never run (src/components/ops/cron-health-rich.tsx) - so the fiction lived
  // on the operator's screen even after the route-local constants were fixed.
  { name: 'process-generation-jobs', label: 'Generation Job Worker', path: '/api/cron/process-generation-jobs', schedule: 'unregistered (manual only)' },
  { name: 'process-send-jobs', label: 'Send Job Worker', path: '/api/cron/process-send-jobs', schedule: 'unregistered (manual only)' },
  { name: 'monday-bump', label: 'Monday Bump', path: '/api/email/monday-bump', schedule: 'unregistered (manual only)' },
];

function cronKey(name: string) {
  return `cron:${name}`;
}

async function readCronState(name: string): Promise<Partial<CronStateValue>> {
  const existing = await prisma.systemConfig.findUnique({ where: { key: cronKey(name) } });
  if (!existing?.value) return {};

  try {
    return JSON.parse(existing.value) as Partial<CronStateValue>;
  } catch {
    return {};
  }
}

async function writeCronState(name: string, next: CronStateValue) {
  await prisma.systemConfig.upsert({
    where: { key: cronKey(name) },
    create: { key: cronKey(name), value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
}

export async function markCronStarted(
  name: string,
  meta: { path: string; schedule: string; stats?: Record<string, unknown> },
) {
  const previous = await readCronState(name);
  const now = new Date().toISOString();

  await writeCronState(name, {
    name,
    path: meta.path,
    schedule: meta.schedule,
    status: 'running',
    lastRunAt: now,
    lastSuccessAt: previous.lastSuccessAt,
    lastFailureAt: previous.lastFailureAt,
    lastDurationMs: previous.lastDurationMs,
    lastMessage: 'Running now',
    lastStats: meta.stats ?? previous.lastStats,
    consecutiveFailures: previous.consecutiveFailures ?? 0,
    runCount: previous.runCount ?? 0,
  });
}

export async function markCronSuccess(
  name: string,
  meta: {
    path: string;
    schedule: string;
    durationMs: number;
    message: string;
    stats?: Record<string, unknown>;
  },
) {
  const previous = await readCronState(name);
  const now = new Date().toISOString();

  await writeCronState(name, {
    name,
    path: meta.path,
    schedule: meta.schedule,
    status: 'ok',
    lastRunAt: now,
    lastSuccessAt: now,
    lastFailureAt: previous.lastFailureAt,
    lastDurationMs: meta.durationMs,
    lastMessage: meta.message,
    lastStats: meta.stats ?? previous.lastStats,
    consecutiveFailures: 0,
    runCount: (previous.runCount ?? 0) + 1,
  });
}

export async function markCronSkipped(
  name: string,
  meta: {
    path: string;
    schedule: string;
    reason: string;
    stats?: Record<string, unknown>;
  },
) {
  const previous = await readCronState(name);
  const now = new Date().toISOString();

  await writeCronState(name, {
    name,
    path: meta.path,
    schedule: meta.schedule,
    status: 'skipped',
    lastRunAt: now,
    lastSuccessAt: previous.lastSuccessAt,
    lastFailureAt: previous.lastFailureAt,
    lastDurationMs: previous.lastDurationMs,
    lastMessage: meta.reason,
    lastStats: meta.stats ?? previous.lastStats,
    consecutiveFailures: previous.consecutiveFailures ?? 0,
    runCount: (previous.runCount ?? 0) + 1,
  });
}

export async function markCronFailure(
  name: string,
  meta: {
    path: string;
    schedule: string;
    durationMs?: number;
    error: unknown;
    stats?: Record<string, unknown>;
  },
) {
  const previous = await readCronState(name);
  const now = new Date().toISOString();
  const message = meta.error instanceof Error ? meta.error.message : String(meta.error);

  await writeCronState(name, {
    name,
    path: meta.path,
    schedule: meta.schedule,
    status: 'error',
    lastRunAt: now,
    lastSuccessAt: previous.lastSuccessAt,
    lastFailureAt: now,
    lastDurationMs: meta.durationMs ?? previous.lastDurationMs,
    lastMessage: message,
    lastStats: meta.stats ?? previous.lastStats,
    consecutiveFailures: (previous.consecutiveFailures ?? 0) + 1,
    runCount: (previous.runCount ?? 0) + 1,
  });
}
