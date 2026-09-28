/**
 * The bounded probes behind the GAP health strip (Phase 2 A3). Each probe has
 * its own timeout and never throws: a probe that cannot answer is reported as
 * that dependency failing, never skipped and never green.
 */
import { gapGmailSender } from '../execution/gap-sender';
import { ROUTING_RUN_DONE } from '../routing/queue';
import { createClawdSuppressionReader } from '../routing/suppression-read';
import type { HealthInputs } from './health';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const HEALTH_PROBE_TIMEOUT_MS = 8_000;
/** A reserved address the suppression contract is asked about; it is never contacted. */
export const HEALTH_PROBE_EMAIL = 'gap-health-probe@yardflow.ai';

export interface HealthDeps {
  env?: Record<string, string | undefined>;
  hubspotPing?: () => Promise<void>;
  suppressionRead?: (to: string) => Promise<{ verdict: 'clear' | 'suppressed' | 'unknown' }>;
  clock?: () => number;
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

async function defaultHubspotPing(): Promise<void> {
  const { getHubSpotClient } = await import('@/lib/hubspot/client');
  await getHubSpotClient().crm.companies.basicApi.getPage(1);
}

export async function loadHealthInputs(prisma: PrismaLike, deps: HealthDeps = {}): Promise<HealthInputs> {
  const env = deps.env ?? process.env;
  const clock = deps.clock ?? Date.now;
  const gapSender = gapGmailSender(env);
  const hubspotConfigured = !!env.HUBSPOT_ACCESS_TOKEN?.trim();
  const suppressionConfigured = !!env.CLAWD_CONTROL_PLANE_URL?.trim() && !!env.CLAWD_CONTROL_PLANE_TOKEN?.trim();

  const [cron, lastRun, hs, sup] = await Promise.all([
    prisma.systemConfig.findUnique({ where: { key: 'cron:gap-mailbox' } }).catch(() => null),
    prisma.gapAuditEvent.findFirst({ where: { kind: ROUTING_RUN_DONE }, orderBy: { created_at: 'desc' }, select: { created_at: true } }).catch(() => null),
    hubspotConfigured ? timed(deps.hubspotPing ?? defaultHubspotPing, clock, HEALTH_PROBE_TIMEOUT_MS) : Promise.resolve(null),
    suppressionConfigured
      ? timed(
          () => (deps.suppressionRead ?? ((to: string) => createClawdSuppressionReader({ env, timeoutMs: HEALTH_PROBE_TIMEOUT_MS }).read({ to })))(HEALTH_PROBE_EMAIL),
          clock,
          HEALTH_PROBE_TIMEOUT_MS,
        )
      : Promise.resolve(null),
  ]);

  let state: Record<string, unknown> = {};
  try {
    state = cron?.value ? (JSON.parse(cron.value) as Record<string, unknown>) : {};
  } catch {
    state = {};
  }
  const date = (v: unknown) => (typeof v === 'string' && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null);

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
    routing: { lastRunAt: lastRun?.created_at ? new Date(lastRun.created_at) : null },
  };
}
