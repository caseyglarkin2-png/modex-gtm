/**
 * The bounded probes behind the GAP health strip (Phase 2 A3). Each probe has
 * its own timeout and never throws: a probe that cannot answer is reported as
 * that dependency failing, never skipped and never green.
 */
import { gapGmailSender } from '../execution/gap-sender';
import type { ContextSourceCoverage } from './health';
import { ROUTING_RUN_DONE } from '../routing/queue';
import { ACTION_TIME_SUPPRESSION_TIMEOUT_MS, probeSuppressionContract } from '@/lib/email/suppression-gate';
import type { HealthInputs } from './health';
import { nyDay } from '../work/dates';
import { listAgentTasks } from '../agents/tasks';
import { loadSpend, spendLimits } from '../ai/spend';
import { SELLER_SETTINGS_KEY } from '../work/settings';
import { vaultTableStatus } from '../knowledge/vault-table-adapter';
import { lastVaultSync } from '../knowledge/vault-sync';
import { loadProducerStatus } from '../signals/producer-status';

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
  /** C46: the HubSpot contact association read (the C02 path) for a probe address; the default reads a contact by email. */
  associationsProbe?: () => Promise<void>;
  /** C46: the GAP sender's Gmail Sent read for a short window; the default lists Sent to the sender's own address. */
  sentProbe?: () => Promise<void>;
  /** C46: the vault and Clawd knowledge read for one account (retrieval.ts coverage); the default is story/load's loadAccountKnowledge. */
  knowledge?: (input: { accountName: string; domain: string | null; now: Date }) => Promise<{ coverage: Array<{ source: string; configured: boolean; reachable: boolean; completeness: 'complete' | 'partial' | 'unknown'; watermark: string | null; indexedAt: string | null; omittedReason: string | null }> }>;
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

async function defaultAssociationsProbe(): Promise<void> {
  const { hubspotContactByEmail } = await import('../opportunity/contact-reads');
  await hubspotContactByEmail(HEALTH_PROBE_EMAIL);
}

async function defaultSentProbe(env: Record<string, string | undefined>, now: Date): Promise<void> {
  const sender = gapGmailSender(env);
  if (!sender) throw new Error('no GAP sender');
  const { listSentTo } = await import('@/lib/email/gmail-inbox');
  const nowS = Math.floor(now.getTime() / 1000);
  await listSentTo(sender, sender.userEmail, nowS - 7 * 86_400, nowS);
}

async function defaultKnowledge(prisma: PrismaLike, env: Record<string, string | undefined>, input: { accountName: string; domain: string | null; now: Date }) {
  const { loadAccountKnowledge } = await import('../story/load');
  // Stream A: the table-backed vault is read through the health's own prisma (the local directory still wins when set).
  return loadAccountKnowledge({ accountName: input.accountName, domain: input.domain, now: input.now }, { env, prisma });
}

/** Stream A: the synced vault table itself (rows, the newest sync, the counts by kind) and the last cron tick's fate from the ledger. */
async function loadVaultTable(prisma: PrismaLike, env: Record<string, string | undefined>): Promise<NonNullable<Exclude<HealthInputs['context'], { failed: string }>>['vaultTable']> {
  const tokenConfigured = !!env.GAP_VAULT_GITHUB_TOKEN?.trim();
  const localDir = !!env.GAP_VAULT_DIR?.trim();
  // A client that does not know the model at all (an older stub) has nothing to probe: absent, nothing claimed. A client
  // that knows it and cannot read it (the migration not applied) is said unreadable.
  if (typeof prisma?.gapKnowledgeNote?.count !== 'function') return undefined;
  try {
    const [status, last] = await Promise.all([vaultTableStatus(prisma), lastVaultSync(prisma).catch(() => null)]);
    // The source revision the sync recorded (vault-push.ts and the cron put commitSha on the ledger row): health says
    // which vault revision the table holds. The branch rides along when the ledger reader returns it.
    const branch = (last as { branch?: unknown } | null)?.branch;
    return { readable: true, rows: status.rows, lastSyncedAt: status.syncedAt, kinds: status.kinds, tokenConfigured, localDir, lastSync: last ? { ok: last.ok, at: last.at, error: last.error, written: last.written, skipped: last.skipped, commitSha: last.commitSha, branch: typeof branch === 'string' && branch ? branch : null } : null };
  } catch (e) {
    return { readable: false, error: (e instanceof Error ? e.message : String(e)).slice(0, 160), tokenConfigured, localDir };
  }
}

/** C46: the context sources, each read soft and bounded; an unreadable source is said as such, never as empty. */
async function loadContextInputs(prisma: PrismaLike, deps: HealthDeps, env: Record<string, string | undefined>, clock: () => number, hubspotConfigured: boolean): Promise<NonNullable<HealthInputs['context']>> {
  const now = new Date(clock());
  const count = async (model: string) => {
    const m = (prisma as Record<string, { count?: (q?: unknown) => Promise<number> } | undefined>)[model];
    if (typeof m?.count !== 'function') throw new Error(`${model} not readable`);
    return m.count();
  };
  const [companies, aliases, canaryRow] = await Promise.all([
    count('canonicalCompany').then((n) => ({ ok: true as const, n })).catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message.slice(0, 120) : String(e) })),
    count('gapAccountAlias').then((n) => ({ ok: true as const, n })).catch((e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message.slice(0, 120) : String(e) })),
    // The canary: the newest resolved canonical company with a domain and an account name; else the newest account by name alone.
    typeof prisma?.canonicalCompany?.findFirst === 'function' ? prisma.canonicalCompany.findFirst({ where: { domain: { not: null }, primary_account_name: { not: null } }, orderBy: { updated_at: 'desc' }, select: { primary_account_name: true, domain: true } }).catch(() => null) : Promise.resolve(null),
  ]);
  const fallback = !canaryRow && typeof prisma?.account?.findFirst === 'function' ? await prisma.account.findFirst({ orderBy: { updated_at: 'desc' }, select: { name: true } }).catch(() => null) : null;
  const canary = canaryRow && typeof canaryRow.primary_account_name === 'string' ? { account: canaryRow.primary_account_name, domain: typeof canaryRow.domain === 'string' && canaryRow.domain ? canaryRow.domain : null } : fallback && typeof fallback.name === 'string' ? { account: fallback.name, domain: null } : null;
  const gapSender = gapGmailSender(env);
  const [assoc, sent, knowledge] = await Promise.all([
    hubspotConfigured ? timed(deps.associationsProbe ?? defaultAssociationsProbe, clock, HEALTH_PROBE_TIMEOUT_MS) : Promise.resolve(null),
    gapSender ? timed(deps.sentProbe ?? (() => defaultSentProbe(env, now)), clock, HEALTH_PROBE_TIMEOUT_MS) : Promise.resolve(null),
    canary ? timed(() => (deps.knowledge ?? ((i) => defaultKnowledge(prisma, env, i)))({ accountName: canary.account, domain: canary.domain, now }), clock, HEALTH_PROBE_TIMEOUT_MS) : Promise.resolve(null),
  ]);
  const vaultTable = await loadVaultTable(prisma, env);
  const cov = (source: 'vault' | 'clawd'): ContextSourceCoverage => {
    if (!knowledge) return { configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: canary ? 'not probed' : 'no account on record to probe with' };
    if (!knowledge.ok) return { configured: true, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: knowledge.error };
    const c = knowledge.value.coverage.find((x) => x.source === source);
    if (!c) return { configured: false, reachable: false, completeness: 'unknown', watermark: null, indexedAt: null, omittedReason: 'no coverage row' };
    return { configured: c.configured, reachable: c.reachable, completeness: c.completeness, watermark: c.watermark, indexedAt: c.indexedAt, omittedReason: c.omittedReason };
  };
  return {
    identity: companies.ok && aliases.ok ? { readable: true, companies: companies.n, aliases: aliases.n, error: null } : { readable: false, companies: companies.ok ? companies.n : null, aliases: aliases.ok ? aliases.n : null, error: [companies, aliases].map((x) => (x.ok ? null : x.error)).filter(Boolean).join('; ') },
    associations: assoc === null ? null : { readable: assoc.ok, ms: assoc.ms, error: assoc.ok ? null : assoc.error },
    sent: !gapSender ? { configured: false, readable: null, ms: null, error: null } : { configured: true, readable: sent ? sent.ok : null, ms: sent?.ms ?? null, error: sent && !sent.ok ? sent.error : null },
    vault: cov('vault'),
    clawd: cov('clawd'),
    canary,
    vaultTable,
  };
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
  const [cron, lastRun, hs, sup, briefingCron, agentsCron, settingsRow, sentToday, failedToday, tasks, spend, credits, context, producers] = await Promise.all([
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
    // C46: the context sources, soft and bounded.
    loadContextInputs(prisma, deps, env, clock, hubspotConfigured).catch((e: unknown) => ({ failed: (e instanceof Error ? e.message : String(e)).slice(0, 160) })),
    // IW13: the intelligence producers, read from the import ledger and the signal rows. A client without the signal
    // table is not read (no component); a read that throws is null (said unreadable).
    typeof prisma?.gapSignal?.count === 'function' ? loadProducerStatus(prisma, new Date(clock()), { env }).catch(() => null) : Promise.resolve(undefined),
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
    context,
    ...(producers !== undefined ? { producers } : {}),
    model: spend ? { month: spend.month, label: spend.label, monthUsd: spend.monthUsd, ceilingUsd: spend.ceilingUsd, warnFraction: spendLimits(env).warnFraction, calls: spend.calls, failed: spend.failed, refused: spend.refused, inFlight: spend.inFlight, lastCall: spend.lastCall ? { at: spend.lastCall.at, outcome: spend.lastCall.outcome, model: spend.lastCall.model, errorCategory: spend.lastCall.errorCategory } : null, credits: credits && credits.ok && Number.isFinite(credits.value.balance) ? credits.value : null } : undefined,
  };
}
