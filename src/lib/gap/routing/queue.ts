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
import { classifySuppression, type SuppressionClass } from '../suppression/provenance';

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
    /** Live-hydrated from the canonical Persona row (dogfood Seller Action Center, 2026-09-25); null if the persona no longer exists. Never written back to the frozen snapshot. */
    title: string | null;
    phone: string | null;
    linkedinUrl: string | null;
  };
  hypothesis: { id: string; status: string; family: string; confidence: number } | null;
  /** Provenance class of the suppression the router saw, re-derived from the frozen snapshot (routing only; the send gate still refuses any hit). */
  suppression: { class: SuppressionClass; hits: string[] };
  /** The multi-touch state, only for cards with a Gmail-proven sent touch. */
  touch?: TouchSummary | null;
  humanAction: string | null;
  humanActionAt: Date | null;
  createdAt: Date;
}

export interface TouchSummary {
  state: 'waiting' | 'due' | 'complete' | 'stopped' | 'unknown';
  stepIndex?: number;
  dueAt?: string;
  reason?: string;
  detail?: string;
  sentCount: number;
}

/** Cards per page whose next touch is evaluated (each may read one Gmail thread). */
export const MAX_TOUCH_EVALUATIONS = 20;

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

/** Live Persona fields hydrated in on read (never snapshotted, never written back). */
export interface LivePersonaFields {
  title: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  email: string | null;
  hubspotContactId: string | null;
  displayName: string | null;
}

function suppressionOfSnapshot(snap: Obj, persona: Obj): QueueItem['suppression'] {
  const sup = isObj(snap.suppression) ? snap.suppression : {};
  const verdict = sup.verdict === 'suppressed' || sup.verdict === 'unknown' ? sup.verdict : 'clear';
  const legs: Record<string, 'clear' | 'hit' | 'unknown'> = {};
  if (isObj(sup.legs)) {
    for (const [k, v] of Object.entries(sup.legs)) if (v === 'clear' || v === 'hit' || v === 'unknown') legs[k] = v;
  }
  const c = classifySuppression({
    verdict,
    legs,
    persona: { doNotContact: persona.doNotContact === true, emailStatus: optStr(persona.emailStatus) },
  });
  return { class: c.class, hits: c.hits };
}

function toItem(row: DecisionRow, live?: LivePersonaFields | null): QueueItem {
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
      // Live values win when the persona still exists (a seller acting today
      // needs today's contact info, not the frozen-at-routing-time snapshot);
      // the frozen snapshot is the fallback for a persona later deleted.
      displayName: live?.displayName ?? optStr(snap.displayName),
      email: live?.email ?? optStr(persona.email),
      hubspotContactId: live?.hubspotContactId ?? optStr(persona.hubspotContactId),
      title: live?.title ?? null,
      phone: live?.phone ?? null,
      linkedinUrl: live?.linkedinUrl ?? null,
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
    suppression: suppressionOfSnapshot(snap, persona),
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

  const personaIds = [...new Set(page.map((r) => r.persona_id).filter((id): id is number => typeof id === 'number'))];
  const liveById = new Map<number, LivePersonaFields>();
  if (personaIds.length > 0) {
    const personas: Array<{
      id: number;
      name: string | null;
      title: string | null;
      phone: string | null;
      linkedin_url: string | null;
      email: string | null;
      hubspot_contact_id: string | null;
    }> = await prisma.persona.findMany({
      where: { id: { in: personaIds } },
      select: { id: true, name: true, title: true, phone: true, linkedin_url: true, email: true, hubspot_contact_id: true },
    });
    for (const p of personas) {
      liveById.set(p.id, {
        displayName: optStr(p.name),
        title: optStr(p.title),
        phone: optStr(p.phone),
        linkedinUrl: optStr(p.linkedin_url),
        email: optStr(p.email),
        hubspotContactId: optStr(p.hubspot_contact_id),
      });
    }
  }

  const items = page.map((row) => toItem(row, typeof row.persona_id === 'number' ? liveById.get(row.persona_id) : null));
  await attachTouches(prisma, items);
  return { runId, items, nextCursor };
}

/**
 * Next-touch state for cards that have a Gmail-proven sent touch (last mile).
 * One indexed ledger read for the page, then at most MAX_TOUCH_EVALUATIONS
 * evaluations. Never breaks the queue: any failure leaves `touch` unset.
 */
async function attachTouches(prisma: PrismaLike, items: QueueItem[]): Promise<void> {
  if (items.length === 0 || typeof prisma?.gapAuditEvent?.findMany !== 'function') return;
  try {
    // Lazy: the queue module must not load the execution layer (Gmail, ledger) at import time.
    const { DIRECT_SENT, DRAFT_SENT, DRAFTED, MANUAL_SENT } = await import('../execution/draft-ledger');
    const { computeNextTouch } = await import('../execution/next-touch');
    // A sequence belongs to the PERSON: a send recorded on an earlier card for
    // this person (e.g. Joey's hand-sent email) still drives today's card.
    const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    const sentRows = (await prisma.gapAuditEvent.findMany({
      where: { subject_type: 'routing_decision', kind: { in: [DRAFT_SENT, MANUAL_SENT, DIRECT_SENT] }, created_at: { gte: since } },
      select: { subject_id: true, kind: true, payload: true },
      take: 500,
    })) as Array<{ subject_id: string; kind: string; payload: unknown }>;
    const draftedRows = (await prisma.gapAuditEvent.findMany({
      where: { subject_type: 'routing_decision', kind: DRAFTED, subject_id: { in: [...new Set(sentRows.map((r) => r.subject_id))] } },
      select: { subject_id: true, payload: true },
    })) as Array<{ subject_id: string; payload: unknown }>;
    const personaOf = new Map<string, number>();
    for (const r of [...sentRows, ...draftedRows]) {
      const pid = (r.payload as { personaId?: unknown } | null)?.personaId;
      if (typeof pid === 'number') personaOf.set(r.subject_id, pid);
    }
    const decisionForPersona = new Map<number, string>();
    for (const r of sentRows) {
      const pid = personaOf.get(r.subject_id);
      if (pid !== undefined && !decisionForPersona.has(pid)) decisionForPersona.set(pid, r.subject_id);
    }
    const pairs = items
      .map((i) => [i, typeof i.persona.id === 'number' ? decisionForPersona.get(i.persona.id) : undefined] as const)
      .filter((p): p is readonly [QueueItem, string] => typeof p[1] === 'string')
      .slice(0, MAX_TOUCH_EVALUATIONS);
    const now = new Date();
    for (const [item, id] of pairs) {
      try {
        const t = await computeNextTouch(prisma, id, now);
        if (t.state === 'not_started') continue;
        item.touch = {
          state: t.state,
          sentCount: t.sent.length,
          ...(t.state === 'waiting' || t.state === 'due' ? { stepIndex: t.stepIndex, dueAt: t.dueAt } : {}),
          ...(t.state === 'stopped' ? { reason: t.reason, detail: t.detail } : {}),
          ...(t.state === 'unknown' ? { detail: t.detail } : {}),
        };
      } catch {
        // leave touch unset
      }
    }
  } catch {
    // leave every touch unset
  }
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
