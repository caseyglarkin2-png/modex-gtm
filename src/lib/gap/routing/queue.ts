/**
 * GAP routing queue read + human-action capture (Sprint 2, S2-T7; current
 * decisions since the debt burn, 2026-09-26).
 *
 * `listQueue` pages the CURRENT decisions, highest priority first, with a
 * stable keyset cursor so a page never repeats or skips a row while new runs
 * land. A current decision is the newest row for its routing subject, from
 * whichever run wrote it, whose thesis still stands (see `currentDecisions`).
 * Naming `runId` pages that one run instead (diagnostics, the e2e scripts).
 * `recordHumanAction` stamps what the operator did with a decision, once; the
 * row is the record and a second stamp is refused.
 *
 * Both readers take the house `prisma: any` glue and read the row plus its
 * `inputs_snapshot` (written by run.ts). Nothing here enrolls or sends.
 */

import { revisedByOf } from '../hypothesis/current-revision';
import { audit as auditEvent } from '../audit';
import type { HumanAction } from '../taxonomy';
import { HYPOTHESIS_TERMINAL_STATUSES } from '../taxonomy';
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
  /** Only this account's decisions (the account page's ready card). */
  accountName?: string;
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
  /** `revisedBy`: a newer live thesis supersedes this one (final Monday P1); the card points there, never at RESEARCH THIS. */
  hypothesis: { id: string; status: string; family: string; confidence: number; revisedBy?: string | null } | null;
  /** Provenance class of the suppression the router saw, re-derived from the frozen snapshot (routing only; the send gate still refuses any hit). */
  suppression: { class: SuppressionClass; hits: string[] };
  /** The multi-touch state, only for cards with a Gmail-proven sent touch. */
  touch?: TouchSummary | null;
  /** Batch item 6 (R34): is first-touch copy installed for this card's thesis (email cards only); absent: not read. */
  copy?: { installed: boolean; detail: string | null } | null;
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
  /** The run named by the caller; null for the current-decision view. */
  runId: string | null;
  /** Newest `created_at` among the current decisions (ISO): changes whenever any routing lands. */
  asOf: string | null;
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
// Current decisions
// ---------------------------------------------------------------------------

/**
 * The audit kind run.ts writes once every account of a run is committed. A
 * run without it was killed part way (2026-09-25 13:53: the platform stopped
 * a broad run after 68 rows): its rows are never current, so its people keep
 * their last finished card.
 */
export const ROUTING_RUN_DONE = 'routing.run';

/** A thesis that ended (rejected, expired, resolved) no longer supports a recommendation. */
const ENDED: ReadonlySet<string> = new Set(HYPOTHESIS_TERMINAL_STATUSES);

export interface CurrentDecisions {
  ids: string[];
  /** Live status of every hypothesis a current decision cites. */
  hypothesisStatus: Map<string, string>;
  asOf: string | null;
}

/**
 * The operator queue's rows: for each routing subject, its newest decision
 * from any run, if that decision still applies.
 *
 * ROUTING SUBJECT = one person at one account, (account_name, persona_id).
 * Not the hypothesis: a person routed again after their thesis changed must
 * replace their older card, never sit beside it. So a run that routes only
 * person 2 leaves persons 1 and 3 on their earlier cards.
 *
 * Only decisions from finished runs count (ROUTING_RUN_DONE), so a run killed
 * part way leaves its people on their previous cards.
 *
 * Applicable: the decision cites no hypothesis, or its hypothesis still exists
 * and has not ended. When the newest decision no longer applies the subject
 * shows no card (an older card would be older reasoning, not a fallback); the
 * next routing of that person replaces it. Readiness is still decided per card
 * from the LIVE hypothesis status (card-readiness.ts), so an approved-only
 * thesis stays REVIEW and nothing turns READY because it is merely newest.
 *
 * Volume (2026-09-26): 128 rows, 88 subjects, so the reduction runs in memory
 * over three narrow columns. Past tens of thousands of rows, move it into
 * Postgres as DISTINCT ON (account_name, persona_id).
 */
export async function currentDecisions(prisma: PrismaLike): Promise<CurrentDecisions> {
  const all = (await prisma.routingDecision.findMany({
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: { id: true, run_id: true, account_name: true, persona_id: true, hypothesis_id: true, created_at: true },
  })) as Array<{ id: string; run_id: string; account_name: string; persona_id: number | null; hypothesis_id: string | null; created_at: Date }>;

  // Only finished runs count (ROUTING_RUN_DONE). A reader without the audit
  // table (a test fake) sees every run as finished.
  let rows = all;
  if (typeof prisma?.gapAuditEvent?.findMany === 'function' && all.length > 0) {
    const done = (await prisma.gapAuditEvent.findMany({
      where: { kind: ROUTING_RUN_DONE, subject_type: 'routing_run', subject_id: { in: [...new Set(all.map((r) => r.run_id))] } },
      select: { subject_id: true },
    })) as Array<{ subject_id: string }>;
    const finished = new Set(done.map((d) => d.subject_id));
    rows = all.filter((r) => finished.has(r.run_id));
  }

  const newest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const subject = `${row.account_name}\u0000${row.persona_id ?? ''}`;
    if (!newest.has(subject)) newest.set(subject, row);
  }

  const cited = [...new Set([...newest.values()].map((r) => r.hypothesis_id).filter((id): id is string => typeof id === 'string'))];
  const hypothesisStatus = new Map<string, string>();
  if (cited.length > 0) {
    const hyps = (await prisma.prospectingHypothesis.findMany({
      where: { id: { in: cited } },
      select: { id: true, status: true },
    })) as Array<{ id: string; status: string }>;
    for (const h of hyps) hypothesisStatus.set(h.id, h.status);
  }

  const current = [...newest.values()].filter((r) => {
    if (!r.hypothesis_id) return true;
    const status = hypothesisStatus.get(r.hypothesis_id);
    return status !== undefined && !ENDED.has(status);
  });
  const asOf = current.reduce<Date | null>((max, r) => (!max || r.created_at > max ? r.created_at : max), null);
  return { ids: current.map((r) => r.id), hypothesisStatus, asOf: asOf ? asOf.toISOString() : null };
}

// ---------------------------------------------------------------------------
// listQueue
// ---------------------------------------------------------------------------

export async function listQueue(prisma: PrismaLike, opts: ListQueueOptions = {}): Promise<ListQueueResult> {
  const limit = Math.min(MAX_QUEUE_LIMIT, Math.max(1, Math.trunc(opts.limit ?? DEFAULT_QUEUE_LIMIT)));

  const runId = opts.runId?.trim() || null;
  const current = runId ? null : await currentDecisions(prisma);
  if (current && current.ids.length === 0) return { runId: null, asOf: null, items: [], nextCursor: null };

  const where: Record<string, unknown> = runId ? { run_id: runId } : { id: { in: current!.ids } };
  if (opts.action) where.action = opts.action;
  if (opts.lane) where.lane = opts.lane;
  if (opts.ruleId) where.rule_id = opts.ruleId;
  if (opts.accountName) where.account_name = opts.accountName;
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
  // The thesis may have moved since routing (approved -> active, or back to review): readiness reads today's status.
  if (current) {
    for (const item of items) {
      const live = item.hypothesis ? current.hypothesisStatus.get(item.hypothesis.id) : undefined;
      if (item.hypothesis && live) item.hypothesis = { ...item.hypothesis, status: live };
    }
  }
  // A thesis already revised (frozen row superseded by a draft revision): the card's current work is that revision.
  const revisedBy = await revisedByOf(prisma, [...new Set(items.map((i) => i.hypothesis?.id).filter((id): id is string => !!id))]);
  for (const item of items) {
    const next = item.hypothesis ? revisedBy.get(item.hypothesis.id) : undefined;
    if (item.hypothesis && next) item.hypothesis = { ...item.hypothesis, revisedBy: next };
  }
  await attachTouches(prisma, items);
  // Batch item 6: an email card whose thesis has no installed copy is never READY (cardReadiness says what to seed).
  const emailThesisIds = [...new Set(items.filter((i) => i.hypothesis && (i.action === 'enroll_gap_sequence' || i.action === 'one_off_email')).map((i) => i.hypothesis!.id))];
  if (emailThesisIds.length && typeof prisma?.sequenceFamily?.findMany === 'function') {
    const { copyAvailabilityMap } = await import('../execution/copy-availability');
    const copy = await copyAvailabilityMap(prisma, emailThesisIds).catch(() => null);
    for (const item of items) {
      if (!item.hypothesis || !emailThesisIds.includes(item.hypothesis.id)) continue;
      const c = copy?.get(item.hypothesis.id);
      item.copy = c ? { installed: c.installed, detail: c.detail } : { installed: false, detail: 'Whether first-touch copy is installed could not be read just now. Nothing goes out until it can be.' };
    }
  }
  return { runId, asOf: current?.asOf ?? null, items, nextCursor };
}

/** Page cap for `listAllCurrent`: 10 x 100 cards. */
export const MAX_CURRENT_PAGES = 10;

/**
 * Every current card, page by page. The cockpit's lane counts and lanes are
 * per-card (`sellerLaneOf`), so they must see all cards, not the first
 * priority-ordered page: one page of high-priority READY cards would hide
 * every RESEARCH card behind it.
 */
export async function listAllCurrent(prisma: PrismaLike): Promise<{ asOf: string | null; items: QueueItem[]; truncated: boolean }> {
  const items: QueueItem[] = [];
  let cursor: string | undefined;
  let asOf: string | null = null;
  for (let page = 0; page < MAX_CURRENT_PAGES; page += 1) {
    const r = await listQueue(prisma, { limit: MAX_QUEUE_LIMIT, ...(cursor ? { cursor } : {}) });
    asOf ??= r.asOf;
    items.push(...r.items);
    if (!r.nextCursor) return { asOf, items, truncated: false };
    cursor = r.nextCursor;
  }
  return { asOf, items, truncated: true };
}

/**
 * Next-touch state for cards whose PERSON has GAP execution history (red team
 * T2): a Gmail-proven send, or an unresolved send claim, on ANY routing card
 * for this person or any persona row sharing their address. The history read
 * is complete for the page's people (no row cap, no age window): a person
 * sent 200 days ago, or behind 500 newer rows, is still not a fresh step 0.
 * At most MAX_TOUCH_EVALUATIONS cards per page are evaluated in full (each
 * may read one Gmail thread); a card past that cap with history is marked
 * `unknown`, never left looking like a first email. A failed read marks the
 * card `unknown` too: fail closed, never quiet.
 */
export async function attachTouches(prisma: PrismaLike, items: QueueItem[]): Promise<void> {
  if (items.length === 0 || typeof prisma?.gapAuditEvent?.findMany !== 'function') return;
  const unevaluated = (item: QueueItem, detail: string) => {
    item.touch = { state: 'unknown', sentCount: 0, detail };
  };
  let withHistory: QueueItem[] = [];
  try {
    // Lazy: the queue module must not load the execution layer (Gmail, ledger) at import time.
    const { DIRECT_CLAIMED, DIRECT_SENT, DRAFT_SENT, MANUAL_SENT } = await import('../execution/draft-ledger');
    const pageIds = [...new Set(items.map((i) => i.persona.id).filter((x): x is number => typeof x === 'number'))];
    const pageEmails = [...new Set(items.map((i) => (i.persona.email ?? '').trim().toLowerCase()).filter(Boolean))];
    if (pageIds.length === 0 && pageEmails.length === 0) return;
    const sharing = pageEmails.length
      ? ((await prisma.persona.findMany({ where: { email: { in: pageEmails, mode: 'insensitive' } }, select: { id: true, email: true } })) as Array<{ id: number; email: string | null }>)
      : [];
    const emailOf = new Map<number, string>();
    for (const p of sharing) if (p.email) emailOf.set(p.id, p.email.trim().toLowerCase());
    const allPersonaIds = [...new Set([...pageIds, ...sharing.map((p) => p.id)])];
    const decisions = allPersonaIds.length
      ? ((await prisma.routingDecision.findMany({ where: { persona_id: { in: allPersonaIds } }, select: { id: true, persona_id: true } })) as Array<{ id: string; persona_id: number | null }>)
      : [];
    const personaOfDecision = new Map(decisions.map((d) => [d.id, d.persona_id] as const));
    const executed = new Set<string>();
    const ids = [...personaOfDecision.keys()];
    for (let i = 0; i < ids.length; i += 500) {
      const rows = (await prisma.gapAuditEvent.findMany({
        where: { subject_type: 'routing_decision', subject_id: { in: ids.slice(i, i + 500) }, kind: { in: [DRAFT_SENT, MANUAL_SENT, DIRECT_SENT, DIRECT_CLAIMED] } },
        select: { subject_id: true },
      })) as Array<{ subject_id: string }>;
      for (const r of rows) executed.add(r.subject_id);
    }
    const personaWithHistory = new Set<number>();
    const emailWithHistory = new Set<string>();
    for (const id of executed) {
      const pid = personaOfDecision.get(id);
      if (typeof pid !== 'number') continue;
      personaWithHistory.add(pid);
      const e = emailOf.get(pid);
      if (e) emailWithHistory.add(e);
    }
    withHistory = items.filter(
      (i) =>
        (typeof i.persona.id === 'number' && personaWithHistory.has(i.persona.id)) ||
        emailWithHistory.has((i.persona.email ?? '').trim().toLowerCase()),
    );
  } catch {
    // The history itself could not be read: no card on this page may look like a first email.
    for (const item of items) unevaluated(item, 'Send history could not be read.');
    return;
  }
  const { computeNextTouch } = await import('../execution/next-touch');
  const now = new Date();
  for (const [n, item] of withHistory.entries()) {
    if (n >= MAX_TOUCH_EVALUATIONS) {
      unevaluated(item, 'This person has send history; open the card to evaluate the next touch.');
      continue;
    }
    try {
      const t = await computeNextTouch(prisma, item.id, now);
      if (t.state === 'not_started') {
        // No proven send. An open claim is an unknown outcome; a released one is nothing.
        const { personSendHistoryForDecision } = await import('../execution/person-history');
        const h = await personSendHistoryForDecision(prisma, item.id);
        if (h.unresolvedClaims.length > 0) unevaluated(item, 'A send to this person was started and its outcome is not recorded. Check Gmail Sent.');
        continue;
      }
      item.touch = {
        state: t.state,
        sentCount: t.sent.length,
        ...(t.state === 'waiting' || t.state === 'due' ? { stepIndex: t.stepIndex, dueAt: t.dueAt } : {}),
        ...(t.state === 'stopped' ? { reason: t.reason, detail: t.detail } : {}),
        ...(t.state === 'unknown' ? { detail: t.detail } : {}),
      };
    } catch {
      unevaluated(item, 'Sequence could not be evaluated.');
    }
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
