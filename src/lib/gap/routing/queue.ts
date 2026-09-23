/**
 * GAP routing queue read + human-action capture (Sprint 2, S2-T7).
 *
 * `listQueue` pages one run's `routing_decisions` rows, highest priority
 * first, with a stable keyset cursor so a page never repeats or skips a row
 * while new runs land. `recordHumanAction` stamps what the operator did with
 * a decision, once; the row is the record and a second stamp is refused.
 *
 * Both readers take the house `prisma: any` glue and read the row plus its
 * `inputs_snapshot` (written by run.ts). Nothing here enrolls or sends.
 */

import { audit as auditEvent } from '../audit';
import type { HumanAction } from '../taxonomy';
import { LAST_RUN_CONFIG_KEY } from './types';
import type { RoutingExplain } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DEFAULT_QUEUE_LIMIT = 50;
export const MAX_QUEUE_LIMIT = 100;

/** Ordering is (priority desc, id desc); the cursor encodes both. */
export const QUEUE_ORDER_BY = [{ priority: 'desc' as const }, { id: 'desc' as const }];

export interface ListQueueOptions {
  runId?: string;
  cursor?: string;
  limit?: number;
  action?: string;
  lane?: string;
  ruleId?: string;
}

export interface QueueItem {
  id: string;
  action: string;
  lane: string;
  ruleId: string;
  priority: number;
  blocked: boolean;
  target: string | null;
  explain: RoutingExplain | null;
  account: {
    name: string;
    hubspotCompanyId: string | null;
    tam: string | null;
    tamTier: string | null;
    heatTier: number | null;
  };
  persona: {
    id: number | null;
    personaKey: string | null;
    displayName: string | null;
    email: string | null;
    hubspotContactId: string | null;
  };
  hypothesis: { id: string; status: string; family: string; confidence: number } | null;
  humanAction: string | null;
  humanActionAt: Date | null;
  createdAt: Date;
}

export interface ListQueueResult {
  runId: string | null;
  items: QueueItem[];
  nextCursor: string | null;
}

export type HumanActionResult = { ok: true } | { ok: false; reason: 'not_found' | 'already_acted' };

interface DecisionRow {
  id: string;
  run_id: string;
  account_name: string;
  persona_id: number | null;
  hypothesis_id: string | null;
  action: string;
  lane: string;
  rule_id: string;
  priority: number;
  explain: unknown;
  inputs_snapshot: unknown;
  human_action: string | null;
  human_action_at: Date | null;
  created_at: Date;
}

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function optStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

function optNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

// ---------------------------------------------------------------------------
// Cursor: base64 of `${priority}:${id}`
// ---------------------------------------------------------------------------

export function encodeCursor(priority: number, id: string): string {
  return Buffer.from(`${priority}:${id}`, 'utf8').toString('base64');
}

export function decodeCursor(cursor: string): { priority: number; id: string } | null {
  let text: string;
  try {
    text = Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const sep = text.indexOf(':');
  if (sep <= 0) return null;
  const priority = Number.parseInt(text.slice(0, sep), 10);
  const id = text.slice(sep + 1);
  if (!Number.isFinite(priority) || !id) return null;
  return { priority, id };
}

// ---------------------------------------------------------------------------
// Row -> item
// ---------------------------------------------------------------------------

function toItem(row: DecisionRow): QueueItem {
  const snap = isObj(row.inputs_snapshot) ? row.inputs_snapshot : {};
  const account = isObj(snap.account) ? snap.account : {};
  const persona = isObj(snap.persona) ? snap.persona : {};
  const hypothesis = isObj(snap.hypothesis) ? snap.hypothesis : null;
  return {
    id: row.id,
    action: row.action,
    lane: row.lane,
    ruleId: row.rule_id,
    priority: row.priority,
    blocked: row.lane === 'blocked',
    target: optStr(snap.target),
    explain: isObj(row.explain) ? (row.explain as unknown as RoutingExplain) : null,
    account: {
      name: optStr(account.name) ?? row.account_name,
      hubspotCompanyId: optStr(account.hubspotCompanyId),
      tam: optStr(account.tam),
      tamTier: optStr(account.tamTier),
      heatTier: optNum(account.heatTier),
    },
    persona: {
      id: optNum(persona.id) ?? row.persona_id,
      personaKey: optStr(persona.personaKey),
      displayName: optStr(snap.displayName),
      email: optStr(persona.email),
      hubspotContactId: optStr(persona.hubspotContactId),
    },
    hypothesis:
      hypothesis && typeof hypothesis.id === 'string'
        ? {
            id: hypothesis.id,
            status: optStr(hypothesis.status) ?? '',
            family: optStr(hypothesis.family) ?? '',
            confidence: optNum(hypothesis.confidence) ?? 0,
          }
        : row.hypothesis_id
          ? { id: row.hypothesis_id, status: '', family: '', confidence: 0 }
          : null,
    humanAction: row.human_action ?? null,
    humanActionAt: row.human_action_at ?? null,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// listQueue
// ---------------------------------------------------------------------------

/**
 * The run the queue shows when the caller names none (N6): the
 * `gap_routing_last_run` pointer, which run.ts advances only AFTER every row
 * of a run is written, so a run that crashed half-way never becomes the
 * queue. The newest row is the fallback only when the pointer is missing.
 * Shared by the queue and the enroll-row emitter.
 */
export async function resolveLatestRunId(prisma: PrismaLike): Promise<string | undefined> {
  const pointer = (await prisma.systemConfig.findUnique({
    where: { key: LAST_RUN_CONFIG_KEY },
    select: { value: true },
  })) as { value: string } | null | undefined;
  const pointed = pointer?.value?.trim();
  if (pointed) return pointed;
  const newest = (await prisma.routingDecision.findFirst({
    orderBy: { created_at: 'desc' },
    select: { run_id: true },
  })) as { run_id: string } | null;
  return newest?.run_id || undefined;
}

export async function listQueue(prisma: PrismaLike, opts: ListQueueOptions = {}): Promise<ListQueueResult> {
  const limit = Math.min(MAX_QUEUE_LIMIT, Math.max(1, Math.trunc(opts.limit ?? DEFAULT_QUEUE_LIMIT)));

  let runId = opts.runId?.trim() || undefined;
  if (!runId) runId = await resolveLatestRunId(prisma);
  if (!runId) return { runId: null, items: [], nextCursor: null };

  const where: Record<string, unknown> = { run_id: runId };
  if (opts.action) where.action = opts.action;
  if (opts.lane) where.lane = opts.lane;
  if (opts.ruleId) where.rule_id = opts.ruleId;
  if (opts.cursor) {
    const c = decodeCursor(opts.cursor);
    if (c) {
      where.OR = [{ priority: { lt: c.priority } }, { priority: c.priority, id: { lt: c.id } }];
    }
  }

  const rows = (await prisma.routingDecision.findMany({
    where,
    orderBy: QUEUE_ORDER_BY,
    take: limit + 1,
  })) as DecisionRow[];

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor = rows.length > limit && last ? encodeCursor(last.priority, last.id) : null;

  return { runId, items: page.map(toItem), nextCursor };
}

// ---------------------------------------------------------------------------
// recordHumanAction
// ---------------------------------------------------------------------------

export interface RecordHumanActionDeps {
  audit?: typeof auditEvent;
  now?: () => Date;
}

/**
 * Stamp the operator's action on a decision, once. The write is conditional
 * on `human_action` still being null so two operators cannot both win; a
 * lost race reads back as `already_acted`.
 */
export async function recordHumanAction(
  prisma: PrismaLike,
  decisionId: string,
  action: HumanAction,
  actor: string,
  deps: RecordHumanActionDeps = {},
): Promise<HumanActionResult> {
  const now = deps.now ? deps.now() : new Date();
  const audit = deps.audit ?? auditEvent;
  const trimmed = action.trim();
  if (!trimmed) throw new Error('recordHumanAction: action is required');

  const updated = (await prisma.routingDecision.updateMany({
    where: { id: decisionId, human_action: null },
    data: { human_action: trimmed, human_actor: actor, human_action_at: now },
  })) as { count: number };

  if (updated.count === 0) {
    const existing = (await prisma.routingDecision.findUnique({
      where: { id: decisionId },
      select: { id: true },
    })) as { id: string } | null;
    return { ok: false, reason: existing ? 'already_acted' : 'not_found' };
  }

  await audit(prisma, {
    kind: 'decision.human_action',
    actor,
    subjectType: 'routing_decision',
    subjectId: decisionId,
    payload: { action: trimmed, at: now.toISOString() },
  });

  return { ok: true };
}
