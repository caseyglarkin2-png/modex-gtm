/**
 * AGENT TASKS, durable (X08, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * No job table exists in this repo (ResearchRun is written after the run; GenerationJob never retries), so a task is
 * a chain of append-only ledger rows (subject `agent_task` / the task id) folded into one state:
 *   agent.task_queued      the request (kind, the plan item, the seller's words, who asked, from which message)
 *   agent.task_claimed     an attempt (attempt number, the lease end, a fence); claimed under an advisory lock
 *   agent.task_succeeded   the result, accepted only with the newest claim's fence
 *   agent.task_failed      an attempt's error; `final` after AGENT_TASK_MAX_ATTEMPTS or a handler's own refusal
 *   agent.task_superseded  a newer request of the same kind on the same item replaced this queued one
 * The drain is `runAgentTasks` (the cron /api/cron/gap-agent-tasks every five minutes, and `after()` from the
 * command handler): claim a few, run each handler, record. Nothing here sends, drafts or writes HubSpot; a handler's
 * result is a PROPOSAL the seller approves (X09, X11).
 *
 * Invariants (pinned by tests/unit/gap/agent-tasks.test.ts): a claim is exclusive; the lease outlives the function
 * limit and an expired lease is reclaimed with the attempt counted at the claim; completion and failure are fenced;
 * three failures end the task; a handler refusal is final at once; a re-queue supersedes the queued task.
 */
import { randomBytes } from 'node:crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const AGENT_TASK_SUBJECT = 'agent_task' as const;
export const TASK_QUEUED = 'agent.task_queued' as const;
export const TASK_CLAIMED = 'agent.task_claimed' as const;
export const TASK_SUCCEEDED = 'agent.task_succeeded' as const;
export const TASK_FAILED = 'agent.task_failed' as const;
export const TASK_SUPERSEDED = 'agent.task_superseded' as const;
/** Longer than Vercel's 300 s function limit: a killed handler is reclaimed, never run twice at once. */
export const AGENT_TASK_LEASE_MS = 420_000;
export const AGENT_TASK_MAX_ATTEMPTS = 3;
/** Tasks older than this are not folded (the drain reads a bounded window). */
export const AGENT_TASK_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

export const AGENT_TASK_KINDS = ['revise_message', 'research_focus', 'prepare_call', 'prepare_follow_up', 'prepare_meeting'] as const;
export type AgentTaskKind = (typeof AGENT_TASK_KINDS)[number];

export interface AgentTaskRequest {
  kind: AgentTaskKind;
  itemKey: string;
  itemToken: string;
  day: string;
  /** The assignment revision the request answers. */
  revision: number;
  /** The seller's words (a critique, a focus). */
  request: string;
  requestedBy: string;
  /** Where the request came from (`gmail:<message id>`, `app`). */
  requestedFrom: string;
  input?: Record<string, unknown>;
}

export type AgentTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'superseded';

export interface AgentTask extends AgentTaskRequest {
  id: string;
  status: AgentTaskStatus;
  attempts: number;
  queuedAt: string;
  leaseUntil: string | null;
  fence: string | null;
  result: Record<string, unknown> | null;
  lastError: string | null;
  final: boolean;
  supersededBy: string | null;
}

export interface ClaimedTask extends AgentTask {
  attempt: number;
  leaseUntil: string;
  fence: string;
}

type Row = { kind: string; subject_id: string; payload: Record<string, unknown> | null; created_at: Date | string };

const newId = () => `at_${randomBytes(8).toString('hex')}`;

async function write(prisma: PrismaLike, kind: string, actor: string, id: string, payload: Record<string, unknown>) {
  await prisma.gapAuditEvent.create({ data: { kind, actor, subject_type: AGENT_TASK_SUBJECT, subject_id: id, payload } });
}

/** Fold one task's rows (oldest first) into its state. */
export function foldAgentTask(rows: readonly Row[]): AgentTask | null {
  const ordered = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const q = ordered.find((r) => r.kind === TASK_QUEUED);
  if (!q) return null;
  const p = (q.payload ?? {}) as Record<string, unknown>;
  const t: AgentTask = {
    id: q.subject_id,
    kind: p.kind as AgentTaskKind,
    itemKey: String(p.itemKey ?? ''),
    itemToken: String(p.itemToken ?? ''),
    day: String(p.day ?? ''),
    revision: Number(p.revision ?? 0),
    request: String(p.request ?? ''),
    requestedBy: String(p.requestedBy ?? ''),
    requestedFrom: String(p.requestedFrom ?? ''),
    input: (p.input as Record<string, unknown> | undefined) ?? undefined,
    status: 'queued',
    attempts: 0,
    queuedAt: new Date(q.created_at).toISOString(),
    leaseUntil: null,
    fence: null,
    result: null,
    lastError: null,
    final: false,
    supersededBy: null,
  };
  for (const r of ordered) {
    const rp = (r.payload ?? {}) as Record<string, unknown>;
    if (r.kind === TASK_CLAIMED) {
      t.status = 'running';
      t.attempts = Number(rp.attempt ?? t.attempts + 1);
      t.leaseUntil = String(rp.leaseUntil ?? '');
      t.fence = String(rp.fence ?? '');
    } else if (r.kind === TASK_SUCCEEDED && rp.fence === t.fence) {
      t.status = 'succeeded';
      t.result = (rp.result as Record<string, unknown>) ?? {};
    } else if (r.kind === TASK_FAILED && rp.fence === t.fence) {
      t.lastError = String(rp.error ?? '');
      t.final = !!rp.final;
      t.status = t.final ? 'failed' : 'queued';
      t.leaseUntil = null;
    } else if (r.kind === TASK_SUPERSEDED) {
      t.status = 'superseded';
      t.supersededBy = String(rp.by ?? '');
    }
  }
  return t;
}

async function rowsSince(prisma: PrismaLike, now: Date): Promise<Row[]> {
  const since = new Date(now.getTime() - AGENT_TASK_WINDOW_DAYS * DAY_MS);
  return prisma.gapAuditEvent.findMany({ where: { subject_type: AGENT_TASK_SUBJECT, created_at: { gte: since } }, orderBy: [{ created_at: 'asc' }] });
}

export async function loadAgentTask(prisma: PrismaLike, id: string): Promise<AgentTask | null> {
  const rows: Row[] = await prisma.gapAuditEvent.findMany({ where: { subject_type: AGENT_TASK_SUBJECT, subject_id: id }, orderBy: [{ created_at: 'asc' }] });
  return foldAgentTask(rows);
}

/** Every task of the window, oldest first (optionally one item's, or one status). */
export async function listAgentTasks(prisma: PrismaLike, opts: { now: Date; itemKey?: string; status?: AgentTaskStatus }): Promise<AgentTask[]> {
  const byId = new Map<string, Row[]>();
  for (const r of await rowsSince(prisma, opts.now)) byId.set(r.subject_id, [...(byId.get(r.subject_id) ?? []), r]);
  const out: AgentTask[] = [];
  for (const rows of byId.values()) {
    const t = foldAgentTask(rows);
    if (!t) continue;
    if (opts.itemKey && t.itemKey !== opts.itemKey) continue;
    if (opts.status && t.status !== opts.status) continue;
    out.push(t);
  }
  return out.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

async function locked<T>(prisma: PrismaLike, fn: (tx: PrismaLike) => Promise<T>): Promise<T> {
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return fn(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('gap_agent_tasks'))`;
    return fn(tx);
  });
}

/** Queue a task; a queued (unclaimed, unfinished) task of the same kind on the same item is superseded. */
export async function queueAgentTask(prisma: PrismaLike, req: AgentTaskRequest, ctx: { now: Date; actor: string }): Promise<{ id: string; superseded: string[] }> {
  return locked(prisma, async (tx) => {
    const id = newId();
    const older = (await listAgentTasks(tx, { now: ctx.now, itemKey: req.itemKey })).filter((t) => t.kind === req.kind && t.status === 'queued' && t.attempts === 0);
    for (const o of older) await write(tx, TASK_SUPERSEDED, ctx.actor, o.id, { by: id, at: ctx.now.toISOString() });
    await write(tx, TASK_QUEUED, ctx.actor, id, { ...req, queuedAt: ctx.now.toISOString() });
    return { id, superseded: older.map((o) => o.id) };
  });
}

/** Claim up to `max` runnable tasks (queued, or running past their lease, under the attempt limit), exclusively. */
export async function claimAgentTasks(prisma: PrismaLike, opts: { now: Date; max: number; claimer: string; leaseMs?: number }): Promise<ClaimedTask[]> {
  return locked(prisma, async (tx) => {
    const all = await listAgentTasks(tx, { now: opts.now });
    const runnable = all.filter((t) => (t.status === 'queued' || (t.status === 'running' && t.leaseUntil && new Date(t.leaseUntil).getTime() <= opts.now.getTime())) && t.attempts < AGENT_TASK_MAX_ATTEMPTS);
    const out: ClaimedTask[] = [];
    for (const t of runnable.slice(0, Math.max(0, opts.max))) {
      const attempt = t.attempts + 1;
      const fence = randomBytes(8).toString('hex');
      const leaseUntil = new Date(opts.now.getTime() + (opts.leaseMs ?? AGENT_TASK_LEASE_MS)).toISOString();
      await write(tx, TASK_CLAIMED, opts.claimer, t.id, { attempt, fence, leaseUntil, claimedAt: opts.now.toISOString() });
      out.push({ ...t, status: 'running', attempts: attempt, attempt, fence, leaseUntil });
    }
    return out;
  });
}

/** Record success; false when the fence is not the newest claim's (a zombie finisher), then nothing is written. */
export async function completeAgentTask(prisma: PrismaLike, input: { id: string; fence: string; result: Record<string, unknown>; now: Date; actor?: string }): Promise<boolean> {
  const t = await loadAgentTask(prisma, input.id);
  if (!t || t.status !== 'running' || t.fence !== input.fence) return false;
  await write(prisma, TASK_SUCCEEDED, input.actor ?? 'agent', input.id, { fence: input.fence, result: input.result, at: input.now.toISOString() });
  return true;
}

/** Record an attempt's failure; final after the attempt limit or when the handler says so. */
export async function failAgentTask(prisma: PrismaLike, input: { id: string; fence: string; error: string; now: Date; final?: boolean; actor?: string }): Promise<boolean> {
  const t = await loadAgentTask(prisma, input.id);
  if (!t || t.status !== 'running' || t.fence !== input.fence) return false;
  const final = !!input.final || t.attempts >= AGENT_TASK_MAX_ATTEMPTS;
  await write(prisma, TASK_FAILED, input.actor ?? 'agent', input.id, { fence: input.fence, attempt: t.attempts, error: input.error.slice(0, 500), final, at: input.now.toISOString() });
  return true;
}

export type HandlerResult = { ok: true; result: Record<string, unknown> } | { ok: false; reason: string; detail?: string };
export type AgentTaskHandler = (task: ClaimedTask, ctx: { prisma: PrismaLike; now: Date }) => Promise<HandlerResult>;

export interface RunReport {
  claimed: number;
  succeeded: number;
  failed: number;
  results: Array<{ id: string; kind: AgentTaskKind; itemKey: string; outcome: 'succeeded' | 'failed' | 'retry'; error?: string }>;
}

/** The drain: claim, run each handler, record. A handler refusal is final; a throw is a retryable failure. */
export async function runAgentTasks(prisma: PrismaLike, opts: { now: Date; max: number; claimer: string; handlers: Partial<Record<AgentTaskKind, AgentTaskHandler>>; leaseMs?: number }): Promise<RunReport> {
  const claimed = await claimAgentTasks(prisma, { now: opts.now, max: opts.max, claimer: opts.claimer, leaseMs: opts.leaseMs });
  const report: RunReport = { claimed: claimed.length, succeeded: 0, failed: 0, results: [] };
  for (const task of claimed) {
    const handler = opts.handlers[task.kind];
    if (!handler) {
      await failAgentTask(prisma, { id: task.id, fence: task.fence, error: `no_handler: ${task.kind}`, now: opts.now, final: true, actor: opts.claimer });
      report.failed += 1;
      report.results.push({ id: task.id, kind: task.kind, itemKey: task.itemKey, outcome: 'failed', error: `no_handler: ${task.kind}` });
      continue;
    }
    try {
      const r = await handler(task, { prisma, now: opts.now });
      if (r.ok) {
        await completeAgentTask(prisma, { id: task.id, fence: task.fence, result: r.result, now: opts.now, actor: opts.claimer });
        report.succeeded += 1;
        report.results.push({ id: task.id, kind: task.kind, itemKey: task.itemKey, outcome: 'succeeded' });
      } else {
        const error = r.detail ? `${r.reason}: ${r.detail}` : r.reason;
        await failAgentTask(prisma, { id: task.id, fence: task.fence, error, now: opts.now, final: true, actor: opts.claimer });
        report.failed += 1;
        report.results.push({ id: task.id, kind: task.kind, itemKey: task.itemKey, outcome: 'failed', error });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await failAgentTask(prisma, { id: task.id, fence: task.fence, error, now: opts.now, actor: opts.claimer }).catch(() => undefined);
      report.failed += 1;
      const after = await loadAgentTask(prisma, task.id).catch(() => null);
      report.results.push({ id: task.id, kind: task.kind, itemKey: task.itemKey, outcome: after?.status === 'failed' ? 'failed' : 'retry', error });
    }
  }
  return report;
}
