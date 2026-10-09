/**
 * The bounded probes behind the GAP health strip (Phase 2 A3). Each probe has
 * its own timeout and never throws: a probe that cannot answer is reported as
 * that dependency failing, never skipped and never green.
 */
import { gapGmailSender } from '../execution/gap-sender';
import { ROUTING_RUN_DONE } from '../routing/queue';
import { ACTION_TIME_SUPPRESSION_TIMEOUT_MS, probeSuppressionContract } from '@/lib/email/suppression-gate';
import type { HealthInputs } from './health';
import { nyDay } from '../work/dates';
import { listAgentTasks } from '../agents/tasks';
import { loadSpend, spendLimits } from '../ai/spend';
import { SELLER_SETTINGS_KEY } from '../work/settings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const HEALTH_PROBE_TIMEOUT_MS = 8_000;
/** The suppression probe waits exactly as long as a draft or send does (one SLA). */
export const HEALTH_SUPPRESSION_TIMEOUT_MS = ACTION_TIME_SUPPRESSION_TIMEOUT_MS;
/** A reserved address the suppression contract is asked about; it is never contacted. */
export const HEALTH_PROBE_EMAIL = 'gap-health-probe@yardflow.ai';

export interface HealthDeps {
  env?: Record<string, string | undefined>;
  hubspotPing?: () => Promise<void>;
  suppressionRead?: (to: string) => Promise<{ verdict: 'clear' | 'suppressed' | 'unknown' }>;
  clock?: () => number;
  /** A04: the AI Gateway credit balance read; the default calls the gateway's credits endpoint with the production key, never printing it. */
  gatewayCredits?: () => Promise<{ balance: number; totalUsed: number }>;
}

async function timed<T>(fn: () => Promise<T>, clock: () => number, timeoutMs: number): Promise<{ ok: true; value: T; ms: number } | { ok: false; error: string; ms: number }> {
  const t0 = clock();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
    return { ok: true, value, ms: clock() - t0 };
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 200), ms: clock() - t0 };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function defaultGatewayCredits(env: Record<string, string | undefined>): Promise<{ balance: number; totalUsed: number }> {
  const key = env.AI_GATEWAY_API_KEY?.trim();
  if (!key) throw new Error('AI_GATEWAY_API_KEY not set');
  const base = env.AI_GATEWAY_BASE_URL?.trim() || 'https://ai-gateway.vercel.sh/v1';
  const r = await fetch(`${base}/credits`, { headers: { authorization: `Bearer ${key}` }, cache: 'no-store' });
  if (!r.ok) throw new Error(`credits HTTP ${r.status}`);
  const j = (await r.json()) as { balance?: unknown; total_used?: unknown };
  return { balance: Number(j.balance), totalUsed: Number(j.total_used) };
}

async function defaultHubspotPing(): Promise<void> {
  const { getHubSpotClient } = await import('@/lib/hubspot/client');
  await getHubSpotClient().crm.companies.basicApi.getPage(1);
}

/**
 * Routing freshness is the newest APPLIED run that completed clean: a dry run (no card written) or a run with a
 * failed account never resets the seller's "routing refreshed" clock. A marker without a readable report is not
 * proof of an applied run.
 */
export function lastAppliedRoutingRun(events: ReadonlyArray<{ created_at: Date | string; payload: unknown }>): Date | null {
  for (const e of events) {
    const p = (e.payload ?? {}) as { dryRun?: unknown; failed?: unknown };
    if (p.dryRun === false && Array.isArray(p.failed) && p.failed.length === 0) return new Date(e.created_at);
  }
  return null;
}

export async function loadHealthInputs(prisma: PrismaLike, deps: HealthDeps = {}): Promise<HealthInputs> {
  const env = deps.env ?? process.env;
  const clock = deps.clock ?? Date.now;
  const gapSender = gapGmailSender(env);
  const hubspotConfigured = !!env.HUBSPOT_ACCESS_TOKEN?.trim();
  const suppressionConfigured = !!env.CLAWD_CONTROL_PLANE_URL?.trim() && !!env.CLAWD_CONTROL_PLANE_TOKEN?.trim();

  const config = (key: string) => (typeof prisma?.systemConfig?.findUnique === 'function' ? prisma.systemConfig.findUnique({ where: { key } }).catch(() => null) : Promise.resolve(null));
  const day = nyDay(new Date(clock()));
  const [cron, lastRun, hs, sup, briefingCron, agentsCron, settingsRow, sentToday, failedToday, tasks, spend, credits] = await Promise.all([
    config('cron:gap-mailbox'),
    prisma.gapAuditEvent.findMany({ where: { kind: ROUTING_RUN_DONE }, orderBy: { created_at: 'desc' }, take: 25, select: { created_at: true, payload: true } }).catch(() => []),
    hubspotConfigured ? timed(deps.hubspotPing ?? defaultHubspotPing, clock, HEALTH_PROBE_TIMEOUT_MS) : Promise.resolve(null),
    suppressionConfigured
      ? timed(
          // The wire's own read (same contract, same timeout), so health says what a click will experience.
          () => (deps.suppressionRead ?? ((to: string) => probeSuppressionContract(to, env)))(HEALTH_PROBE_EMAIL),
          clock,
          // a hair past the read's own timeout, so the read's own UNREADABLE answer is the one reported
          HEALTH_SUPPRESSION_TIMEOUT_MS + 500,
        )
      : Promise.resolve(null),
    // X20a: the briefing and agent-task crons, the seller settings, today's briefing rows and the task rows. All soft.
    config('cron:gap-briefing'),
    config('cron:gap-agent-tasks'),
    config(SELLER_SETTINGS_KEY),
    typeof prisma?.gapAuditEvent?.findFirst === 'function' ? prisma.gapAuditEvent.findFirst({ where: { kind: 'briefing.sent', subject_type: 'work_day', subject_id: day }, select: { created_at: true } }).catch(() => null) : Promise.resolve(null),
    typeof prisma?.gapAuditEvent?.count === 'function' ? prisma.gapAuditEvent.count({ where: { kind: 'briefing.failed', subject_type: 'work_day', subject_id: day } }).catch(() => 0) : Promise.resolve(0),
    listAgentTasks(prisma, { now: new Date(clock()) }).catch(() => []),
    // A02: the model spend ledger for the month. Soft.
    loadSpend(prisma, { now: new Date(clock()), env }).catch(() => null),
    // A04: the gateway's credit balance. Soft, bounded.
    env.AI_GATEWAY_API_KEY?.trim() ? timed(() => (deps.gatewayCredits ?? (() => defaultGatewayCredits(env)))(), clock, 5_000) : Promise.resolve(null),
  ]);

  let state: Record<string, unknown> = {};
  try {
    state = cron?.value ? (JSON.parse(cron.value) as Record<string, unknown>) : {};
  } catch {
    state = {};
  }
  const date = (v: unknown) => (typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null);
  const parse = (row: { value?: unknown } | null): Record<string, unknown> => {
    try {
      const v = typeof row?.value === 'string' ? (JSON.parse(row.value) as unknown) : null;
      return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  };
  const bState = parse(briefingCron);
  const aState = parse(agentsCron);
  const settings = parse(settingsRow);
  // The same reading as gap/flags.ts gapFlag, over the injected env.
  const flagOn = (v: unknown) => /^(1|true|yes|on)$/i.test(String(v ?? '').trim());
  const queued = (Array.isArray(tasks) ? tasks : []).filter((t) => t.status === 'queued');

  return {
    mailbox: {
      senderConfigured: !!gapSender,
      lastSuccessAt: date(state.lastSuccessAt),
      lastFailureAt: date(state.lastFailureAt),
      consecutiveFailures: typeof state.consecutiveFailures === 'number' ? state.consecutiveFailures : 0,
      lastMessage: typeof state.lastMessage === 'string' ? state.lastMessage.slice(0, 200) : null,
    },
    hubspot: hs === null ? { configured: false, ok: false, ms: null, error: null } : { configured: true, ok: hs.ok, ms: hs.ms, error: hs.ok ? null : hs.error },
    suppression:
      sup === null
        ? { configured: false, verdict: null, ms: null, error: null }
        : { configured: true, verdict: sup.ok ? sup.value.verdict : null, ms: sup.ms, error: sup.ok ? (sup.value.verdict === 'unknown' ? 'verdict unknown' : null) : sup.error },
    sender: { configured: !!gapSender, mailbox: gapSender?.userEmail ?? null },
    routing: { lastRunAt: lastAppliedRoutingRun(lastRun ?? []) },
    briefing: {
      enabled: flagOn(env.GAP_BRIEFING_ENABLED),
      to: typeof settings.briefingTo === 'string' && settings.briefingTo.includes('@') ? settings.briefingTo : null,
      hourNy: typeof settings.briefingHourNy === 'number' ? settings.briefingHourNy : null,
      lastSuccessAt: date(bState.lastSuccessAt),
      consecutiveFailures: typeof bState.consecutiveFailures === 'number' ? bState.consecutiveFailures : 0,
      lastMessage: typeof bState.lastMessage === 'string' ? bState.lastMessage.slice(0, 200) : null,
      sentTodayAt: sentToday?.created_at ? new Date(sentToday.created_at) : null,
      failedToday: typeof failedToday === 'number' ? failedToday : 0,
    },
    agents: {
      enabled: flagOn(env.GAP_AGENT_TASKS_ENABLED),
      lastSuccessAt: date(aState.lastSuccessAt),
      consecutiveFailures: typeof aState.consecutiveFailures === 'number' ? aState.consecutiveFailures : 0,
      lastMessage: typeof aState.lastMessage === 'string' ? aState.lastMessage.slice(0, 200) : null,
      queued: queued.length,
      oldestQueuedAt: queued.length ? new Date(Math.min(...queued.map((t) => new Date(t.queuedAt).getTime()))) : null,
      failedFinalToday: (Array.isArray(tasks) ? tasks : []).filter((t) => t.status === 'failed' && t.final && nyDay(new Date(t.queuedAt)) === day).length,
    },
    model: spend ? { month: spend.month, label: spend.label, monthUsd: spend.monthUsd, ceilingUsd: spend.ceilingUsd, warnFraction: spendLimits(env).warnFraction, calls: spend.calls, failed: spend.failed, refused: spend.refused, inFlight: spend.inFlight, lastCall: spend.lastCall ? { at: spend.lastCall.at, outcome: spend.lastCall.outcome, model: spend.lastCall.model, errorCategory: spend.lastCall.errorCategory } : null, credits: credits && credits.ok && Number.isFinite(credits.value.balance) ? credits.value : null } : undefined,
  };
}
