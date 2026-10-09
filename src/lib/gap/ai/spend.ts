/**
 * The GAP model route and spend ledger (A01, GAP OS AI recovery, 2026-10-08). Server only.
 *
 * One inexpensive route: the Vercel AI Gateway credential already in this project's production environment
 * (AI_GATEWAY_API_KEY), the routine model `google/gemini-2.5-flash-lite` (free tier allowed, $0.10 per million input
 * tokens and $0.40 per million output, an angle-sized call measured at $0.0002 on 2026-10-08) and the stronger
 * `google/gemini-2.5-flash` only when a task asks for it (tier `strong`). The gateway reports each call's cost in its
 * usage block and the team's credit balance on /v1/credits; a provider that reports no cost (the direct Gemini
 * fallback) is charged a conservative estimate from its tokens, and the row says so.
 *
 * Every call GAP makes is two ledger rows: `ai.model_call_reserved` BEFORE the call at the worst-case estimate (so a
 * call in flight already counts against the month) and `ai.model_call` after it with the task, model, tokens, cost
 * and outcome. The month's ceiling (GAP_AI_MONTHLY_CEILING_USD, default $25) and the per-task budget
 * (GAP_AI_TASK_BUDGET_USD, default $0.10) are checked before the call; a refusal is a PermanentAgentError with the
 * recovery in words and a `refused` row. Hard enforcement at the provider is the gateway's own budget (Casey's
 * dashboard: AI Gateway, Budgets); this ledger is the in-app control and the observable record.
 */
import { AIAllProvidersFailed, generateTextWithMetadata, type AIErrorInfo, type GenerateTextResult } from '@/lib/ai/client';
import { randomBytes } from 'node:crypto';
import { PermanentAgentError } from '../agents/errors';
import { nyWallToInstant } from '../work/dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const MODEL_CALL_SUBJECT = 'model_call' as const;
export const MODEL_CALL_RESERVED = 'ai.model_call_reserved' as const;
export const MODEL_CALL = 'ai.model_call' as const;

export const ROUTINE_MODEL = 'google/gemini-2.5-flash-lite';
export const STRONG_MODEL = 'google/gemini-2.5-flash';

export type ModelTier = 'routine' | 'strong';

export interface GapModelCallContext {
  id: string;
  kind: string;
  itemKey: string;
}

export interface SpendLimits {
  monthlyCeilingUsd: number;
  taskBudgetUsd: number;
  warnFraction: number;
  maxOutputTokens: number;
  maxPromptChars: number;
  routineModel: string;
  strongModel: string;
}

export interface SpendReport {
  month: string;
  label: string;
  monthUsd: number;
  ceilingUsd: number;
  taskBudgetUsd: number;
  calls: number;
  failed: number;
  refused: number;
  inFlight: number;
  lastCall: { at: string; outcome: string; model: string | null; errorCategory: string | null; costUsd: number } | null;
}

/** USD per million tokens [input, output]; unknown models are estimated at a conservative default, never zero. */
const PRICES_PER_M: Readonly<Record<string, readonly [number, number]>> = {
  'google/gemini-2.5-flash-lite': [0.1, 0.4],
  'gemini-2.5-flash-lite': [0.1, 0.4],
  'google/gemini-2.5-flash': [0.3, 2.5],
  'gemini-2.5-flash': [0.3, 2.5],
  'google/gemini-3.5-flash-lite': [0.3, 2.5],
  'gemini-3.5-flash-lite': [0.3, 2.5],
  'openai/gpt-5-nano': [0.05, 0.4],
  'openai/gpt-5-mini': [0.25, 2],
  'gpt-4o-mini': [0.15, 0.6],
};
const DEFAULT_PRICE: readonly [number, number] = [2.5, 15];
/** A rough tokenizer for the estimate only: four characters per token, rounded up. */
const CHARS_PER_TOKEN = 4;

const num = (v: unknown, fallback: number, min = 0) => {
  const n = Number(String(v ?? '').trim());
  return Number.isFinite(n) && n > min ? n : fallback;
};

export function spendLimits(env: Record<string, string | undefined> = process.env): SpendLimits {
  return {
    monthlyCeilingUsd: num(env.GAP_AI_MONTHLY_CEILING_USD, 25),
    taskBudgetUsd: num(env.GAP_AI_TASK_BUDGET_USD, 0.1),
    warnFraction: Math.min(1, num(env.GAP_AI_WARN_FRACTION, 0.8)),
    maxOutputTokens: Math.floor(num(env.GAP_AI_MAX_OUTPUT_TOKENS, 1024)),
    maxPromptChars: Math.floor(num(env.GAP_AI_MAX_PROMPT_CHARS, 24_000)),
    routineModel: env.GAP_AI_MODEL?.trim() || ROUTINE_MODEL,
    strongModel: env.GAP_AI_MODEL_STRONG?.trim() || STRONG_MODEL,
  };
}

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const [input, output] = PRICES_PER_M[model] ?? DEFAULT_PRICE;
  return (Math.max(0, promptTokens) * input + Math.max(0, completionTokens) * output) / 1_000_000;
}

/** The calendar month in New York that holds `now`. */
export function monthWindow(now: Date): { month: string; label: string; start: Date } {
  const wall = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const y = wall.getFullYear();
  const m = wall.getMonth() + 1;
  return { month: `${y}-${String(m).padStart(2, '0')}`, label: wall.toLocaleString('en-US', { month: 'long' }), start: nyWallToInstant(y, m, 1) };
}

type Row = { kind: string; subject_id: string; payload: unknown; created_at: Date | string };

/** The most rows one month's sum reads; at the cap the sum is unknowable and a call is refused (the review's finding 4). */
export const LEDGER_READ_MAX = 5000;

/**
 * The month's ledger rows, newest first. `strict` (a call about to spend): a read that throws, or a month at the read
 * cap, is a configuration failure that refuses the call; soft (health): an unreadable table reads as no rows. A client
 * without the model (a harness stub) reads as no rows either way.
 */
async function monthRows(prisma: PrismaLike, start: Date, strict = false): Promise<Row[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  let rows: Row[];
  try {
    rows = (await prisma.gapAuditEvent.findMany({ where: { subject_type: MODEL_CALL_SUBJECT, created_at: { gte: start } }, orderBy: { created_at: 'desc' }, take: LEDGER_READ_MAX })) as Row[];
  } catch (e) {
    if (strict) throw new PermanentAgentError('configuration', `the model spend ledger could not be read, so the month's spend is unknown and no call is made (${e instanceof Error ? e.message.slice(0, 160) : String(e)}); check the database, then decide the item again`);
    return [];
  }
  if (strict && rows.length >= LEDGER_READ_MAX) throw new PermanentAgentError('configuration', `the model spend ledger holds ${LEDGER_READ_MAX} or more rows this month, more than one read sums; raise LEDGER_READ_MAX or wait for next month`);
  return rows.reverse();
}

function fold(rows: readonly Row[]): Omit<SpendReport, 'month' | 'label' | 'ceilingUsd' | 'taskBudgetUsd'> {
  const reserved = new Map<string, number>();
  let monthUsd = 0;
  let calls = 0;
  let failed = 0;
  let refused = 0;
  let lastCall: SpendReport['lastCall'] = null;
  for (const r of rows) {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const callId = typeof p.callId === 'string' ? p.callId : r.subject_id;
    if (r.kind === MODEL_CALL_RESERVED) {
      reserved.set(callId, Number(p.estimateUsd) || 0);
      continue;
    }
    if (r.kind !== MODEL_CALL) continue;
    reserved.delete(callId);
    const cost = Number(p.costUsd) || 0;
    monthUsd += cost;
    const outcome = String(p.outcome ?? 'ok');
    if (outcome === 'ok') calls += 1;
    else if (outcome === 'refused') refused += 1;
    else failed += 1;
    lastCall = { at: new Date(r.created_at).toISOString(), outcome, model: typeof p.model === 'string' ? p.model : null, errorCategory: typeof p.errorCategory === 'string' ? p.errorCategory : null, costUsd: cost };
  }
  for (const estimate of reserved.values()) monthUsd += estimate;
  return { monthUsd, calls, failed, refused, inFlight: reserved.size, lastCall };
}

/**
 * C50: the month's commitment AT one reservation: every recorded cost plus every still-open reservation the ledger
 * ordered at or before it (created_at, then callId). Two workers that both passed the pre-check and both reserved
 * each re-read the ledger; the later reservation sees the earlier one and yields, so the ceiling holds under a race.
 */
export function committedAt(rows: readonly Row[], callId: string): number {
  const ordered = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || idOf(a).localeCompare(idOf(b)));
  const open = new Map<string, number>();
  let usd = 0;
  let seen = false;
  for (const r of ordered) {
    const id = idOf(r);
    if (r.kind === MODEL_CALL_RESERVED) {
      if (seen) continue;
      open.set(id, Number((r.payload as Record<string, unknown> | null)?.estimateUsd) || 0);
      if (id === callId) seen = true;
      continue;
    }
    if (r.kind !== MODEL_CALL) continue;
    open.delete(id);
    usd += Number((r.payload as Record<string, unknown> | null)?.costUsd) || 0;
  }
  for (const e of open.values()) usd += e;
  return usd;
}
const idOf = (r: Row) => { const p = (r.payload ?? {}) as Record<string, unknown>; return typeof p.callId === 'string' ? p.callId : r.subject_id; };

/** The month's spend as the ledger holds it (recorded cost plus in-flight reservations). Soft: an unreadable table reads as zero calls. */
export async function loadSpend(prisma: PrismaLike, opts: { now: Date; env?: Record<string, string | undefined>; strict?: boolean }): Promise<SpendReport> {
  const limits = spendLimits(opts.env);
  const w = monthWindow(opts.now);
  const folded = fold(await monthRows(prisma, w.start, opts.strict === true));
  return { month: w.month, label: w.label, ceilingUsd: limits.monthlyCeilingUsd, taskBudgetUsd: limits.taskBudgetUsd, ...folded };
}

export type GapGenerate = (prompt: string, maxTokens: number, opts: { model: string; skipControlPlane?: boolean }) => Promise<GenerateTextResult>;

/**
 * A06 (the review's finding 3): the grounded discovery and research providers (entity/providers.ts: the Gemini scout,
 * OpenAI with web search, the gateway with its search tool) answer through the `ai` SDK with tools and report no
 * cost, so they are metered by a conservative estimate per provider attempt: reserved before the attempt, recorded
 * after it with the outcome; the month ceiling refuses before the attempt exactly as it does for an agent task.
 */
export const GROUNDED_ESTIMATE_USD = 0.02;

export interface GroundedMeter {
  before: (provider: string) => Promise<void>;
  after: (provider: string, outcome: string) => Promise<void>;
}

export function groundedMeter(prisma: PrismaLike, ctx: GapModelCallContext, opts: { now: Date; env?: Record<string, string | undefined>; actor?: string } = { now: new Date() }): GroundedMeter {
  const actor = opts.actor ?? 'agent';
  const write = async (kind: string, payload: Record<string, unknown>, strict = false) => {
    if (typeof prisma?.gapAuditEvent?.create !== 'function') return;
    try {
      await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: MODEL_CALL_SUBJECT, subject_id: ctx.id, payload: { taskId: ctx.id, taskKind: ctx.kind, itemKey: ctx.itemKey, tier: 'grounded', ...payload } } });
    } catch (e) {
      if (strict) throw new PermanentAgentError('configuration', `the model spend ledger could not record the reservation, so no grounded call is made (${e instanceof Error ? e.message.slice(0, 160) : String(e)})`);
    }
  };
  const ids = new Map<string, string>();
  return {
    before: async (provider) => {
      const limits = spendLimits(opts.env);
      const spend = await loadSpend(prisma, { now: opts.now, env: opts.env, strict: true });
      if (spend.monthUsd + GROUNDED_ESTIMATE_USD > limits.monthlyCeilingUsd) {
        await write(MODEL_CALL, { callId: `gm_${ctx.id}_${provider}_${randomBytes(3).toString('hex')}`, model: provider, outcome: 'refused', costUsd: 0, estimated: true, errorCategory: 'monthly_ceiling', at: opts.now.toISOString() });
        throw new PermanentAgentError('monthly_ceiling', `the GAP model ceiling of $${limits.monthlyCeilingUsd.toFixed(2)} for ${spend.label} is spent ($${spend.monthUsd.toFixed(2)} recorded); the grounded providers wait for next month or a raised ceiling`);
      }
      const callId = `gm_${ctx.id}_${provider}_${randomBytes(3).toString('hex')}`;
      ids.set(provider, callId);
      await write(MODEL_CALL_RESERVED, { callId, model: provider, estimateUsd: GROUNDED_ESTIMATE_USD, at: opts.now.toISOString() }, true);
    },
    after: async (provider, outcome) => {
      const callId = ids.get(provider) ?? `gm_${ctx.id}_${provider}`;
      // A provider that answered (ok, unparsable, no citations) was billed; one that was unavailable, cooling or errored before answering was not.
      const answered = outcome === 'ok' || outcome === 'unparsable' || outcome === 'no_citations';
      await write(MODEL_CALL, { callId, model: provider, outcome: answered ? 'ok' : 'failed', costUsd: answered ? GROUNDED_ESTIMATE_USD : 0, estimated: true, ...(answered ? {} : { errorCategory: outcome }), at: new Date().toISOString() });
    },
  };
}

export interface GapGenerateInput {
  prompt: string;
  maxTokens: number;
  tier: ModelTier;
  task: GapModelCallContext;
  now: Date;
}

export interface GapGenerateDeps {
  generate?: GapGenerate;
  env?: Record<string, string | undefined>;
  actor?: string;
}

const PERMANENT_CATEGORIES = new Set(['billing', 'authentication', 'model_missing']);

function classifyFailure(errors: readonly AIErrorInfo[]): { permanent: boolean; category: string } {
  if (!errors.length) return { permanent: true, category: 'configuration' };
  // Transient if any provider's failure was transient (it may answer next time); permanent only when every provider failed for good.
  if (errors.some((e) => e.retryable)) return { permanent: false, category: errors.find((e) => e.retryable)!.category };
  const first = errors[0].category;
  return { permanent: true, category: PERMANENT_CATEGORIES.has(first) ? first : 'configuration' };
}

/**
 * One bounded, budgeted, recorded model call for a GAP agent task. Refuses before the call when the month or the task
 * budget would be exceeded (PermanentAgentError); records the call either way; maps a provider failure to a
 * permanent error (billing, authentication, a missing model, no provider configured) or a transient one (thrown as
 * a plain Error for the runner's bounded attempts).
 */
export async function gapGenerate(prisma: PrismaLike, input: GapGenerateInput, deps: GapGenerateDeps = {}): Promise<GenerateTextResult> {
  const limits = spendLimits(deps.env);
  const actor = deps.actor ?? 'agent';
  const model = input.tier === 'strong' ? limits.strongModel : limits.routineModel;
  const prompt = input.prompt.length > limits.maxPromptChars ? input.prompt.slice(0, limits.maxPromptChars) : input.prompt;
  const maxTokens = Math.max(1, Math.min(input.maxTokens, limits.maxOutputTokens));
  const promptTokensEstimate = Math.ceil(prompt.length / CHARS_PER_TOKEN);
  const estimateUsd = estimateCostUsd(model, promptTokensEstimate, maxTokens);
  const callId = `mc_${input.task.id}_${input.now.getTime().toString(36)}_${randomBytes(3).toString('hex')}`;
  const base = { callId, taskId: input.task.id, taskKind: input.task.kind, itemKey: input.task.itemKey, model, tier: input.tier };
  const write = async (kind: string, payload: Record<string, unknown>, opts: { strict?: boolean } = {}) => {
    if (typeof prisma?.gapAuditEvent?.create !== 'function') return;
    try {
      await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: MODEL_CALL_SUBJECT, subject_id: input.task.id, payload: { ...base, ...payload } } });
    } catch (e) {
      // The reservation must land before a call (the review's finding 4): without it the month cannot count the call.
      if (opts.strict) throw new PermanentAgentError('configuration', `the model spend ledger could not record the reservation, so no call is made (${e instanceof Error ? e.message.slice(0, 160) : String(e)}); check the database, then decide the item again`);
    }
  };
  const refuse = async (code: 'monthly_ceiling' | 'task_budget', message: string) => {
    await write(MODEL_CALL, { outcome: 'refused', costUsd: 0, estimated: false, errorCategory: code, error: message, at: input.now.toISOString() });
    throw new PermanentAgentError(code, message);
  };

  if (estimateUsd > limits.taskBudgetUsd) {
    await refuse('task_budget', `this call could cost $${estimateUsd.toFixed(4)} on ${model} (${promptTokensEstimate} prompt tokens, ${maxTokens} output), over the per-task budget of $${limits.taskBudgetUsd.toFixed(2)} (GAP_AI_TASK_BUDGET_USD); shorten the context or raise the budget`);
  }
  const spend = await loadSpend(prisma, { now: input.now, env: deps.env, strict: true });
  if (spend.monthUsd + estimateUsd > limits.monthlyCeilingUsd) {
    await refuse('monthly_ceiling', `the GAP model ceiling of $${limits.monthlyCeilingUsd.toFixed(2)} for ${spend.label} is spent ($${spend.monthUsd.toFixed(2)} recorded, $${estimateUsd.toFixed(4)} more needed); raise GAP_AI_MONTHLY_CEILING_USD with Casey's approval or wait for next month, then decide the item again`);
  }

  await write(MODEL_CALL_RESERVED, { estimateUsd, promptTokensEstimate, maxTokens, at: input.now.toISOString() }, { strict: true });
  // C50: the post-reservation check. A competing worker may have reserved between the pre-check and this row; the
  // ledger's order decides, and the later reservation releases itself (a refused row closes it) and makes no call.
  const committed = committedAt(await monthRows(prisma, monthWindow(input.now).start, true), callId);
  if (committed > limits.monthlyCeilingUsd) {
    await refuse('monthly_ceiling', `the GAP model ceiling of $${limits.monthlyCeilingUsd.toFixed(2)} for ${spend.label} would be passed with the calls already in flight ($${committed.toFixed(2)} committed with this one); this call yields and is not made; decide the item again once they finish, or raise GAP_AI_MONTHLY_CEILING_USD with Casey's approval`);
  }
  const generate: GapGenerate = deps.generate ?? ((p, m, o) => generateTextWithMetadata(p, m, o));
  try {
    // The clawd control plane is never a GAP fallback: a prompt with prospect data would leave for Railway unmetered.
    const out = await generate(prompt, maxTokens, { model, skipControlPlane: true });
    const usedModel = out.model ?? model;
    const promptTokens = out.usage?.promptTokens ?? promptTokensEstimate;
    const completionTokens = out.usage?.completionTokens ?? maxTokens;
    const reported = out.usage?.costUsd;
    const estimated = typeof reported !== 'number';
    const costUsd = estimated ? estimateCostUsd(usedModel, promptTokens, completionTokens) : reported;
    await write(MODEL_CALL, { outcome: 'ok', provider: out.provider, model: usedModel, promptTokens, completionTokens, costUsd, estimated, providerErrors: out.errors.map((e) => `${e.provider}:${e.category}`), at: new Date().toISOString() });
    return out;
  } catch (err) {
    const errors = err instanceof AIAllProvidersFailed ? err.errors : [];
    // C50: an untyped throw (a socket reset, a timeout outside the provider chain) is an outage, not a configuration fault: transient, so the task and the decision wait for the next attempt.
    const { permanent, category } = err instanceof AIAllProvidersFailed ? classifyFailure(errors) : { permanent: false, category: 'outage' };
    const message = err instanceof Error ? err.message : String(err);
    // A failed call may still have been billed (a timeout after generation): charge the estimate, never zero, unless no generation could have run.
    const costUsd = category === 'billing' || category === 'authentication' || category === 'model_missing' || category === 'configuration' ? 0 : estimateUsd;
    await write(MODEL_CALL, { outcome: 'failed', model, costUsd, estimated: true, errorCategory: category, permanent, error: message.slice(0, 600), at: new Date().toISOString() });
    if (permanent) {
      const why = errors.length ? errors.map((e) => `${e.provider} ${e.category}: ${e.message.slice(0, 160)}`).join(' | ') : message.slice(0, 300);
      throw new PermanentAgentError(category as 'billing' | 'authentication' | 'model_missing' | 'configuration', `no funded model route answered (${why}); fix the credential or the model in Vercel, redeploy, then decide the item again`);
    }
    throw new Error(`transient: ${message.slice(0, 600)}`);
  }
}
