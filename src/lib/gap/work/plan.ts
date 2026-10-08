/**
 * THE DAY SNAPSHOT (X04, GAP OS sales execution engine, 2026-10-08). Server only.
 *
 * One `work.day_planned` row in the append-only ledger per New York day (subject `work_day` / the day): the ordered
 * items the morning briefing mails and the assignments (X06) work from, each with a stable key and an unguessable
 * token, plus the day's counts. It is a SNAPSHOT of what `workDay` built (work/list.ts, through the one day builder
 * work/load-day.ts), never a second state engine: an item's state lives with its owner (a commitment in
 * work/commitments.ts, an account outcome in work/outcome.ts, a send in the execution ledger); the plan records only
 * what the day held, then START, the assignments and the revisions (X06+).
 *
 * Invariants (pinned by tests/unit/gap/day-plan.test.ts):
 *   - a key is bound to its OBJECT where one exists (`reply:<messageId>`, `commitment:<id>`, `first_touch:<decisionId>`,
 *     `meeting:<key>`) and carries the DAY otherwise (`follow_up:<account>:<day>`, `deal:<account>:<day>`,
 *     `review:<account>:<day>`, ...), so yesterday's record never hides today's new work at the same account
 *   - every obligation due today is its own item (two due commitments at one account stay two: R41)
 *   - parked cards (research, holds, the seller's set-asides) are never items, only counted
 *   - the first claim of a day wins: a second plan the same day (another instance, the cron after the page) writes
 *     nothing and returns the stored plan, so every consumer reads the same tokens; a new New York day is a new plan
 *   - a token is 16 random bytes; a lookup scans the last PLAN_LOOKBACK_DAYS of plans and finds nothing for a forged
 *     or an older token
 */
import { randomBytes } from 'node:crypto';
import { PARKED_TIERS, type WorkCard, type WorkDay, type WorkObligation, type WorkStateKind, type WorkTier } from './list';
import { nyDay } from './dates';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DAY_PLANNED = 'work.day_planned' as const;
export const PLAN_SUBJECT_TYPE = 'work_day' as const;
/** A token older than this (by the plan's day) finds nothing: an assignment link or email outlives its day by a week. */
export const PLAN_LOOKBACK_DAYS = 7;
const DAY_MS = 86_400_000;

export interface PlanItemRefs {
  decisionId?: string;
  commitmentId?: string;
  replyMessageId?: string;
  meetingKey?: string;
}

export interface PlanItem {
  key: string;
  rank: number;
  accountName: string;
  /** The Work tier that placed it (commitment, reply, meeting, deal, follow_up, ready, review, admin). */
  kind: WorkTier;
  stateKind: WorkStateKind;
  /** The seller words: the card's state line, or the obligation's title. */
  title: string;
  /** Why it is on the day: the card's why (or rankWhy), or the obligation's phase line. */
  why: string;
  /** Where the work runs (the card's next, the obligation's href, else the account). */
  href: string;
  person: { name: string; title: string | null } | null;
  refs: PlanItemRefs;
  token: string;
  /** X18: the day of the newest earlier plan that held this work (the same object, or the same account and kind). */
  carriedFrom?: string;
}

export interface DayPlan {
  day: string;
  plannedAt: string;
  items: PlanItem[];
  counts: WorkDay['counts'];
  /** Written by this call (true) or read back from an earlier claim the same day (false). */
  fresh: boolean;
}

const DECISION_HREF = /^\/gap\/pack\/([^/?#]+)/;

/**
 * X12 demo finding: a pursuit-sourced ready card's action is the account page (the send card lives in the outreach
 * anchor), not the pack link, so the card itself names no routing decision. The NEXT UP candidates do (their href is
 * the pack link): the ready lane's decision id per account, read off them.
 */
export function decisionIdsFromCandidates(candidates: ReadonlyArray<{ accountName: string | null; lane: string; href: string }>): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of candidates) {
    if (!c.accountName || (c.lane !== 'ready' && c.lane !== 'follow_up')) continue;
    const m = DECISION_HREF.exec(c.href);
    if (m && !out.has(c.accountName)) out.set(c.accountName, decodeURIComponent(m[1]));
  }
  return out;
}

/** Pure: the stable key of a card's own move (null when the card's only work is its obligations). */
function cardKey(c: WorkCard, day: string, decisionIds?: ReadonlyMap<string, string>): { key: string; refs: PlanItemRefs } | null {
  const tier = c.tier ?? 'ready';
  switch (c.stateKind) {
    case 'replied':
    case 'opted_out':
    case 'bounced': {
      const id = c.reply?.messageId;
      return id ? { key: `reply:${id}`, refs: { replyMessageId: id } } : { key: `reply:${c.accountName}:${day}`, refs: {} };
    }
    case 'ready': {
      const m = c.next?.href ? DECISION_HREF.exec(c.next.href) : null;
      const decisionId = m ? decodeURIComponent(m[1]) : decisionIds?.get(c.accountName) ?? null;
      return decisionId ? { key: `first_touch:${decisionId}`, refs: { decisionId } } : { key: `first_touch:${c.accountName}:${day}`, refs: {} };
    }
    case 'follow_up': {
      const m = c.next?.href ? DECISION_HREF.exec(c.next.href) : null;
      const decisionId = m ? decodeURIComponent(m[1]) : decisionIds?.get(c.accountName) ?? null;
      return { key: `follow_up:${c.accountName}:${day}`, refs: decisionId ? { decisionId } : {} };
    }
    case 'decide':
      return { key: `review:${c.accountName}:${day}`, refs: {} };
    case 'in_deal':
    case 'unknown_deal':
      // A deal card's own move exists only when the deal is stalled or the tier says deal work; obligations are their own items.
      return tier === 'deal' || (c.stalled?.length ?? 0) > 0 ? { key: `deal:${c.accountName}:${day}`, refs: {} } : null;
    case 'meeting':
    case 'committed':
      return null;
    case 'research':
    case 'held':
      return null;
    default:
      return { key: `${tier}:${c.accountName}:${day}`, refs: {} };
  }
}

function obligationItem(c: WorkCard, o: WorkObligation): Omit<PlanItem, 'rank' | 'token'> {
  // A meeting obligation's key already reads `meeting:<account>:<at>` (work/list.ts); a commitment's is its id.
  const key = o.kind === 'meeting' ? (o.key.startsWith('meeting:') ? o.key : `meeting:${o.key}`) : `commitment:${o.commitmentId ?? o.key}`;
  const refs: PlanItemRefs = o.kind === 'meeting' ? { meetingKey: o.key } : { commitmentId: o.commitmentId ?? o.key };
  return {
    key,
    accountName: c.accountName,
    kind: o.tier,
    stateKind: c.stateKind,
    title: o.title,
    why: o.line,
    href: o.href ?? c.href,
    person: o.person?.name ? { name: o.person.name, title: null } : c.person,
    refs,
  };
}

/** Pure: the day's items in Work's order. Parked cards are not items; every obligation due today is one. */
export function itemsForDay(day: WorkDay, nyDate: string, opts: { decisionIds?: ReadonlyMap<string, string> } = {}): PlanItem[] {
  const out: PlanItem[] = [];
  const seen = new Set<string>();
  const push = (it: Omit<PlanItem, 'rank' | 'token'>) => {
    if (seen.has(it.key)) return;
    seen.add(it.key);
    out.push({ ...it, rank: out.length, token: randomBytes(16).toString('hex') });
  };
  for (const c of day.cards) {
    const tier = c.tier ?? 'ready';
    if (PARKED_TIERS.has(tier)) continue;
    const own = cardKey(c, nyDate, opts.decisionIds);
    const obligations = c.obligations ?? [];
    // The card's own move first when the tier is its own; the obligations in their order (R41: each its own row).
    if (own && (obligations.length === 0 || !obligations.some((o) => o.tier === tier))) {
      push({ key: own.key, accountName: c.accountName, kind: tier, stateKind: c.stateKind, title: c.move ?? c.state, why: c.rankWhy ?? c.why, href: c.next?.href ?? c.href, person: c.person, refs: own.refs });
    }
    for (const o of obligations) push(obligationItem(c, o));
    if (own && obligations.length > 0 && obligations.some((o) => o.tier === tier) && !seen.has(own.key)) {
      push({ key: own.key, accountName: c.accountName, kind: tier, stateKind: c.stateKind, title: c.move ?? c.state, why: c.rankWhy ?? c.why, href: c.next?.href ?? c.href, person: c.person, refs: own.refs });
    }
  }
  return out;
}

async function locked<T>(prisma: PrismaLike, key: string, fn: (tx: PrismaLike) => Promise<T>): Promise<T> {
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return fn(prisma);
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_day_plan:${key}`}))`;
    return fn(tx);
  });
}

function rowToPlan(row: { payload: Record<string, unknown> | null; created_at: Date | string; subject_id: string }, fresh: boolean): DayPlan {
  const p = (row.payload ?? {}) as { items?: PlanItem[]; counts?: WorkDay['counts'] };
  return { day: row.subject_id, plannedAt: new Date(row.created_at).toISOString(), items: Array.isArray(p.items) ? p.items : [], counts: p.counts ?? { needsYou: 0, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 }, fresh };
}

const OBJECT_KEY = /^(reply|commitment|first_touch|meeting):/;
const dayKeyed = (key: string) => key.replace(/:\d{4}-\d{2}-\d{2}$/, ':');

/**
 * X18: work carried over. An item carried when the previous plan held the same object (reply, commitment, first touch,
 * meeting: the key is the object) or, for a day-keyed item (follow_up, deal, review, ready, admin: `<kind>:<account>:<day>`),
 * the same kind at the same account. Pure; `carriedFrom` is the previous plan's day.
 */
export function markCarried(items: readonly PlanItem[], previous: DayPlan | null): PlanItem[] {
  if (!previous) return items.map((i) => ({ ...i }));
  const objects = new Set(previous.items.filter((i) => OBJECT_KEY.test(i.key)).map((i) => i.key));
  const days = new Set(previous.items.filter((i) => !OBJECT_KEY.test(i.key)).map((i) => dayKeyed(i.key)));
  return items.map((i) => {
    const { carriedFrom: _old, ...rest } = i;
    void _old;
    const carried = OBJECT_KEY.test(i.key) ? objects.has(i.key) : days.has(dayKeyed(i.key));
    return carried ? { ...rest, carriedFrom: previous.day } : rest;
  });
}

/** The newest stored plan for a day before `day` within the lookback, or null. */
export async function loadPreviousPlan(prisma: PrismaLike, day: string, opts: { now: Date }): Promise<DayPlan | null> {
  const since = new Date(opts.now.getTime() - PLAN_LOOKBACK_DAYS * DAY_MS);
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date | string; subject_id: string }> = await prisma.gapAuditEvent.findMany({
    where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, created_at: { gte: since } },
    orderBy: [{ created_at: 'desc' }],
    take: PLAN_LOOKBACK_DAYS + 2,
  });
  const earlier = rows.filter((r) => r.subject_id < day).sort((a, b) => (a.subject_id < b.subject_id ? 1 : -1));
  return earlier.length ? rowToPlan(earlier[0], false) : null;
}

/** The stored plan for a New York day, or null. */
export async function loadDayPlan(prisma: PrismaLike, day: string): Promise<DayPlan | null> {
  const row = await prisma.gapAuditEvent.findFirst({ where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, subject_id: day }, orderBy: [{ created_at: 'asc' }] });
  return row ? rowToPlan(row, false) : null;
}

/**
 * The plan for `now`'s New York day: the stored one when a claim exists, else built from `load` (the one day builder)
 * and written ONCE under an advisory lock. `load` runs only when no plan exists yet.
 */
export type PlanLoad = WorkDay | { day: WorkDay; decisionIds?: ReadonlyMap<string, string> };

export async function planDay(prisma: PrismaLike, input: { now: Date; load: () => Promise<PlanLoad> }, actor: string): Promise<DayPlan> {
  const day = nyDay(input.now);
  const existing = await loadDayPlan(prisma, day);
  if (existing) return existing;
  // X21 (production 2026-10-08, the first briefing): the day builder (HubSpot reads, the whole cockpit read) runs
  // OUTSIDE the advisory-lock transaction, which has a short timeout; the lock guards only the re-check and the one
  // write. A plan written by another instance meanwhile wins and the day built here is dropped.
  const loaded = await input.load();
  const built = 'cards' in loaded ? loaded : loaded.day;
  const decisionIds = 'cards' in loaded ? undefined : loaded.decisionIds;
  const previous = await loadPreviousPlan(prisma, day, { now: input.now }).catch(() => null);
  const items = markCarried(itemsForDay(built, day, { decisionIds }), previous);
  return locked(prisma, day, async (tx) => {
    const again = await loadDayPlan(tx, day);
    if (again) return again;
    const row = await tx.gapAuditEvent.create({
      data: { kind: DAY_PLANNED, actor, subject_type: PLAN_SUBJECT_TYPE, subject_id: day, payload: JSON.parse(JSON.stringify({ items, counts: built.counts, waiting: built.waiting.length, snoozed: built.snoozed.length })) },
    });
    return rowToPlan({ payload: row.payload ?? { items, counts: built.counts }, created_at: row.created_at ?? input.now, subject_id: day }, true);
  });
}

/** The item a token names, with its day, within the lookback; null for a forged or an older token. */
export async function findPlanItemByToken(prisma: PrismaLike, token: string, opts: { now: Date }): Promise<{ day: string; item: PlanItem; plan: DayPlan } | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const since = new Date(opts.now.getTime() - PLAN_LOOKBACK_DAYS * DAY_MS);
  const rows: Array<{ payload: Record<string, unknown> | null; created_at: Date | string; subject_id: string }> = await prisma.gapAuditEvent.findMany({
    where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, created_at: { gte: since } },
    orderBy: [{ created_at: 'desc' }],
    take: PLAN_LOOKBACK_DAYS + 2,
  });
  for (const row of rows) {
    const plan = rowToPlan(row, false);
    const item = plan.items.find((i) => i.token === token);
    if (item) return { day: plan.day, item, plan };
  }
  return null;
}
