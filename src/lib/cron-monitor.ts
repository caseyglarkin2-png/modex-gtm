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

export const KNOWN_CRONS: Array<{ name: string; label: string; path: string; schedule: string }> = [
  { name: 'process-generation-jobs', label: 'Generation Job Worker', path: '/api/cron/process-generation-jobs', schedule: '*/5 * * * *' },
  { name: 'process-send-jobs', label: 'Send Job Worker', path: '/api/cron/process-send-jobs', schedule: '*/2 * * * *' },
  { name: 'check-inbox', label: 'Inbox Polling', path: '/api/cron/check-inbox', schedule: '*/5 * * * *' },
  { name: 'daily-digest', label: 'Daily Digest', path: '/api/cron/daily-digest', schedule: '0 12 * * *' },
  { name: 'sync-hubspot', label: 'HubSpot Sync', path: '/api/cron/sync-hubspot', schedule: '0 */6 * * *' },
  { name: 'reenrich-contacts', label: 'Contact Re-enrichment', path: '/api/cron/reenrich-contacts', schedule: '0 */8 * * *' },
  { name: 'drip-sequence', label: 'Campaign Drip', path: '/api/cron/drip-sequence', schedule: '0 13 * * *' },
  { name: 'monday-bump', label: 'Monday Bump', path: '/api/email/monday-bump', schedule: '5 11 * * 1' },
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
