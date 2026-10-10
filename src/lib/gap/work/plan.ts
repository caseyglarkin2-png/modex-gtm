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
 * Invariants (pinned by tests/unit/gap/day-plan.test.ts and tests/unit/gap/sa-plan-refresh.test.ts):
 *   - a key is bound to its OBJECT where one exists (`reply:<messageId>`, `commitment:<id>`, `first_touch:<decisionId>`,
 *     `meeting:<key>`) and carries the DAY otherwise (`follow_up:<account>:<day>`, `deal:<account>:<day>`,
 *     `review:<account>:<day>`, ...), so yesterday's record never hides today's new work at the same account
 *   - every obligation due today is its own item (two due commitments at one account stay two: R41)
 *   - a card's own move is NOT an item when it is its obligation said again (the seller acceptance follow-up,
 *     2026-10-09: Southern Glazer's held the commitment "follow up with Diego when they are back" AND the card's own
 *     "Reminder: Follow up with Diego Fonseca when they are back" at ranks 0 and 1): the card says so
 *     (`ownMoveIsObligation`), or an obligation on the card has the same tier and the same person as the card's move
 *   - parked cards (research, holds, the seller's set-asides) are never items, only counted; nor is an obligation
 *     whose tier is parked (a "later" follow-up on a deal card that says no follow-up while the deal stands)
 *   - the first claim of a day wins: a second plan the same day (another instance, the cron after the page) writes
 *     nothing and returns the stored plan, so every consumer reads the same tokens; a new New York day is a new plan
 *   - a REFRESH (an explicit resend, never the schedule) builds the day again and, when the change is MATERIAL (the
 *     set of keys differs, or the order of the first five differs), writes a new revision for the same day:
 *     `revision` n+1, `supersedes` the previous row, `changes` (added, removed, moved) and the TOKEN of every item
 *     whose key the day already held (links and assignment bindings stay valid; a new key mints a new token); an
 *     immaterial change writes nothing and the stored plan is returned `unchanged`
 *   - the newest revision is THE plan of the day (`loadDayPlan`); a token is found in any revision within the
 *     lookback and is `retired` when its key is not on the newest revision
 *   - a token is 16 random bytes; a lookup scans the last PLAN_LOOKBACK_DAYS of plans and finds nothing for a forged
 *     or an older token
 */
import { randomBytes } from 'node:crypto';
import { PARKED_TIERS, type WorkCard, type WorkDay, type WorkObligation, type WorkStateKind, type WorkTier } from './list';
import { nyDay } from './dates';
import { properCase } from '../people/contact-packet';
import { pausedReceivedSentence } from './truth-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const DAY_PLANNED = 'work.day_planned' as const;
export const PLAN_SUBJECT_TYPE = 'work_day' as const;
/** A token older than this (by the plan's day) finds nothing: an assignment link or email outlives its day by a week. */
export const PLAN_LOOKBACK_DAYS = 7;
/** X21b: the plan lock's own transaction limits (see `locked`). */
export const PLAN_TX_OPTIONS = { maxWait: 5_000, timeout: 15_000 } as const;
/** A refresh is material when the first this many ranks change order (or any key is added or removed). */
export const PLAN_MATERIAL_RANKS = 5;
const DAY_MS = 86_400_000;

export interface PlanItemRefs {
  decisionId?: string;
  commitmentId?: string;
  replyMessageId?: string;
  meetingKey?: string;
}

/**
 * C32: what a briefing card says beyond the title: the relationship or motion, the last material exchange, the next
 * prepared action (whole), the source and date. Read off the Work card and the obligation; nothing is invented.
 */
export interface PlanItemContext {
  motion: string | null;
  lastExchange: string | null;
  nextAction: string | null;
  source: string | null;
  date: string | null;
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
  /** C32: the card context (motion, last exchange, next action, source and date), when the card carried it. */
  context?: PlanItemContext;
  /** IW15 at plan time: the prepared email names a different person than the card; the title says held and the assignment holds. */
  hold?: { reason: 'recipient_mismatch'; recipient: string };
}

/** The one title a held item carries everywhere (the plan, the digest, the subject, the packet's first line). */
export const heldTitle = (recipientName: string, itemName: string) => `Held: the prepared email names ${recipientName}, not ${itemName}`;

/** A name normalised for a same-person comparison ("Morrison, Craig" is "Craig Morrison"). */
const nameKeyOf = (s: string | null | undefined): string => (s ?? '').toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

/** The pack reader the hold check uses: the decision's action pack persona (name, email); injectable for tests. */
export type PackPersonaReader = (decisionId: string) => Promise<{ name: string | null; email: string | null } | null>;

async function defaultPackPersona(prisma: PrismaLike, decisionId: string): Promise<{ name: string | null; email: string | null } | null> {
  const d = await prisma.routingDecision.findUnique({ where: { id: decisionId }, select: { hypothesis_id: true } });
  if (!d?.hypothesis_id) return null;
  const { loadActionPack } = await import('../execution/action-pack');
  const pack = await loadActionPack(prisma, { hypothesisId: d.hypothesis_id, decisionId });
  const persona = (pack as { persona?: { name?: string | null; email?: string | null } | null } | null)?.persona ?? null;
  return persona ? { name: persona.name ?? null, email: persona.email ?? null } : null;
}

/**
 * IW15 at plan time (Casey, 2026-10-10: "make the subject, plan state, digest and assignment all describe the same
 * held state"): a ready item whose pack's prepared email names a different person than the card is marked held here,
 * so the digest line, the subject and the packet agree before START walks the plan. A read that fails leaves the item
 * as it is (the assignment's own check still holds it). Bounded to the ready items with a decision.
 */
export async function applyRecipientHolds(prisma: PrismaLike, items: PlanItem[], reader?: PackPersonaReader): Promise<PlanItem[]> {
  const read = reader ?? ((id: string) => defaultPackPersona(prisma, id));
  const out: PlanItem[] = [];
  for (const it of items) {
    if (it.kind !== 'ready' || !it.refs.decisionId || !it.person?.name) { out.push(it); continue; }
    let persona: { name: string | null; email: string | null } | null = null;
    try { persona = await read(it.refs.decisionId); } catch { persona = null; }
    const recipient = properCase(persona?.name) ?? null;
    if (recipient && nameKeyOf(recipient) && nameKeyOf(it.person.name) && nameKeyOf(recipient) !== nameKeyOf(it.person.name)) {
      out.push({ ...it, title: heldTitle(recipient, it.person.name), hold: { reason: 'recipient_mismatch', recipient } });
    } else out.push(it);
  }
  return out;
}

/** What a refreshed revision changed against the one it supersedes, by item key. */
export interface PlanChanges {
  added: string[];
  removed: string[];
  /** Items the day kept whose place among the kept items changed (a shift caused only by a removal above is not a move). */
  moved: Array<{ key: string; from: number; to: number }>;
  /** The seller words for every key named above ("Southern Glazer's: Reminder: Follow up ..."), so a line can name them. */
  labels: Record<string, string>;
}

export interface DayPlan {
  day: string;
  plannedAt: string;
  items: PlanItem[];
  counts: WorkDay['counts'];
  /** Written by this call (true) or read back from an earlier claim the same day (false). */
  fresh: boolean;
  /** The ledger row this revision is (null on a hand-built plan). */
  id?: string | null;
  /** 0 for the day's first plan (and for rows written before revisions existed); n+1 for each refresh that changed it. */
  revision?: number;
  /** The row id this revision supersedes (null on the first). */
  supersedes?: string | null;
  /** What this revision changed against the one it supersedes (null on the first). */
  changes?: PlanChanges | null;
  /** A refresh that found nothing material: the stored plan is returned as it stands and nothing was written. */
  unchanged?: boolean;
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
      // The walk fix: a card the summary relabelled "Someone replied" is bound to the reply the summary names.
      const id = c.reply?.messageId ?? c.replyRef?.messageId;
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

const replyDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

/** C32: the context of a card's own move. */
export function cardContext(c: WorkCard): PlanItemContext {
  const r = c.reply ?? null;
  const motion = c.stateKind === 'in_deal' && c.dealNextStep ? `${c.state}; HubSpot next step: ${c.dealNextStep.replace(/\.$/, '')}` : c.state;
  return {
    motion,
    // Paused reply (2026-10-10): with no message panel on the card, the reply the send gate holds on keeps its words here.
    lastExchange: r ? `${r.fromName ?? r.from} wrote ${replyDay(r.at)}${r.subject ? `, "${r.subject}"` : ''}: ${r.snippet.replace(/\s+/g, ' ').trim().slice(0, 160)}` : c.paused ? pausedReceivedSentence(c.paused) : null,
    nextAction: c.dealNextStep ? `Next step on the deal: ${c.dealNextStep.replace(/\.$/, '')}` : c.next?.label ?? null,
    source: r || c.paused ? 'their email in the GAP mailbox' : c.stateKind === 'in_deal' || c.stateKind === 'unknown_deal' ? 'HubSpot deals' : c.source === 'pursuit' ? 'the pursuit record' : 'the Work lanes',
    date: r?.at ?? c.replyRef?.at ?? c.paused?.reply.at ?? null,
  };
}

/** C32: the context of an obligation on a card. */
export function obligationContext(c: WorkCard, o: WorkObligation): PlanItemContext {
  return {
    motion: o.scope ?? (c.stateKind === 'in_deal' ? c.state : null),
    lastExchange: o.basis ?? null,
    nextAction: o.label ?? null,
    source: o.kind === 'meeting' ? 'the calendar' : o.basis ? 'the recorded buyer words' : 'a GAP commitment',
    date: o.dueAt ?? null,
  };
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
    context: obligationContext(c, o),
  };
}

const personKey = (p: { name?: string | null; email?: string | null } | null | undefined): { email: string | null; name: string | null } => ({
  email: p?.email ? p.email.trim().toLowerCase() : null,
  name: p?.name ? p.name.trim().toLowerCase() : null,
});

/**
 * Pure: the same person on a card's own move and on one of its obligations: by email when both carry one, else by
 * name; neither naming anyone is the same (the card's move at that tier is then the obligation's work at the account).
 */
export function samePerson(a: { name?: string | null; email?: string | null } | null | undefined, b: { name?: string | null; email?: string | null } | null | undefined): boolean {
  const x = personKey(a);
  const y = personKey(b);
  if (x.email && y.email) return x.email === y.email;
  if (x.name || y.name) return !!x.name && x.name === y.name;
  return true;
}

/**
 * Pure: whether a card's own move is one of its obligations said again (never its own item). The card says so
 * (`ownMoveIsObligation`, read with optional chaining: the Work builder sets it), or an obligation on the card has the
 * same tier and the same person as the card's move. A deal card with a due commitment (tiers differ) keeps both: R41.
 */
export function ownMoveIsObligation(c: WorkCard): boolean {
  if ((c as WorkCard & { ownMoveIsObligation?: boolean }).ownMoveIsObligation === true) return true;
  const tier = c.tier ?? 'ready';
  return (c.obligations ?? []).some((o) => o.tier === tier && samePerson(o.person, c.person));
}

/** Pure: the day's items in Work's order. Parked cards are not items; every obligation due today is one. */
export function itemsForDay(day: WorkDay, nyDate: string, opts: { decisionIds?: ReadonlyMap<string, string> } = {}): PlanItem[] {
  const out: PlanItem[] = [];
  const seen = new Set<string>();
  // C27: an item is one per durable object as well as per key: the same commitment, meeting or reply reached through
  // two cards (an obligation listed on the account card and again on a deal card) is one item, whatever it is titled.
  const originOf = (it: Omit<PlanItem, 'rank' | 'token'>): string | null =>
    it.refs.commitmentId ? `commitment:${it.refs.commitmentId}` : it.refs.meetingKey ? `meeting:${it.refs.meetingKey}` : it.refs.replyMessageId ? `reply:${it.refs.replyMessageId}` : null;
  const push = (it: Omit<PlanItem, 'rank' | 'token'>) => {
    const origin = originOf(it);
    if (seen.has(it.key) || (origin && seen.has(origin))) return;
    seen.add(it.key);
    if (origin) seen.add(origin);
    out.push({ ...it, rank: out.length, token: randomBytes(16).toString('hex') });
  };
  for (const c of day.cards) {
    const tier = c.tier ?? 'ready';
    if (PARKED_TIERS.has(tier)) continue;
    const own = cardKey(c, nyDate, opts.decisionIds);
    const obligations = c.obligations ?? [];
    // The card's own move is no item when it is an obligation said again (one Southern Glazer's item, never two).
    const ownItem = own && !ownMoveIsObligation(c) ? { key: own.key, accountName: c.accountName, kind: tier, stateKind: c.stateKind, title: c.move ?? c.state, why: c.rankWhy ?? c.why, href: c.next?.href ?? c.href, person: c.person, refs: own.refs, context: cardContext(c) } : null;
    // The card's own move first when the tier is its own; the obligations in their order (R41: each its own row).
    if (ownItem && (obligations.length === 0 || !obligations.some((o) => o.tier === tier))) push(ownItem);
    // An obligation at a parked tier (later, held, research) is never an item, like a parked card: production pushed
    // Kroger's "later" follow-up ("No follow-up while the deal stands") as item 9 of October 9.
    for (const o of obligations) if (!PARKED_TIERS.has(o.tier)) push(obligationItem(c, o));
    if (ownItem && obligations.length > 0 && obligations.some((o) => o.tier === tier) && !seen.has(ownItem.key)) push(ownItem);
  }
  return out;
}

async function locked<T>(prisma: PrismaLike, key: string, fn: (tx: PrismaLike) => Promise<T>): Promise<T> {
  if (typeof prisma.$transaction !== 'function' || typeof prisma.$executeRaw !== 'function') return fn(prisma);
  // X21b: the production transaction timed out at 500 ms (the client runs with defaults, so the limit comes from the
  // deployment); the lock holds three round trips to a database in another region, so it carries its own limits.
  return prisma.$transaction(async (tx: PrismaLike) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`gap_day_plan:${key}`}))`;
    return fn(tx);
  }, PLAN_TX_OPTIONS);
}

type PlanRow = { id?: string; payload: Record<string, unknown> | null; created_at: Date | string; subject_id: string };

function rowToPlan(row: PlanRow, fresh: boolean): DayPlan {
  const p = (row.payload ?? {}) as { items?: PlanItem[]; counts?: WorkDay['counts']; revision?: number; supersedes?: string | null; changes?: PlanChanges | null };
  return {
    day: row.subject_id,
    plannedAt: new Date(row.created_at).toISOString(),
    items: Array.isArray(p.items) ? p.items : [],
    counts: p.counts ?? { needsYou: 0, parked: 0, obligationsDue: 0, waiting: 0, snoozed: 0 },
    fresh,
    id: row.id ?? null,
    revision: typeof p.revision === 'number' ? p.revision : 0,
    supersedes: typeof p.supersedes === 'string' ? p.supersedes : null,
    changes: p.changes && typeof p.changes === 'object' ? p.changes : null,
  };
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

const itemLabel = (i: PlanItem) => `${i.accountName}: ${i.title}`;

/**
 * Pure: what `next` changes against `previous`, or null when the change is not material (the same set of keys in the
 * same order over the first PLAN_MATERIAL_RANKS). `moved` names the kept items whose place AMONG THE KEPT items
 * changed, with their old and new ranks: a removal above an item shifts its rank and is not a move of it.
 */
export function planChanges(previous: readonly PlanItem[], next: readonly PlanItem[]): PlanChanges | null {
  const prevKeys = previous.map((i) => i.key);
  const nextKeys = next.map((i) => i.key);
  const prevSet = new Set(prevKeys);
  const nextSet = new Set(nextKeys);
  const added = nextKeys.filter((k) => !prevSet.has(k));
  const removed = prevKeys.filter((k) => !nextSet.has(k));
  const sameHead = prevKeys.slice(0, PLAN_MATERIAL_RANKS).join('\n') === nextKeys.slice(0, PLAN_MATERIAL_RANKS).join('\n');
  if (!added.length && !removed.length && sameHead) return null;
  const prevKept = prevKeys.filter((k) => nextSet.has(k));
  const nextKept = nextKeys.filter((k) => prevSet.has(k));
  const prevRank = new Map(previous.map((i) => [i.key, i.rank]));
  const nextRank = new Map(next.map((i) => [i.key, i.rank]));
  const moved = nextKept.filter((k, at) => prevKept[at] !== k).map((key) => ({ key, from: prevRank.get(key) ?? 0, to: nextRank.get(key) ?? 0 }));
  const labels: Record<string, string> = {};
  for (const i of previous) if (removed.includes(i.key)) labels[i.key] = itemLabel(i);
  for (const i of next) if (added.includes(i.key) || moved.some((m) => m.key === i.key)) labels[i.key] = itemLabel(i);
  return { added, removed, moved, labels };
}

/** The newest stored plan for a day before `day` within the lookback, or null. */
export async function loadPreviousPlan(prisma: PrismaLike, day: string, opts: { now: Date }): Promise<DayPlan | null> {
  const since = new Date(opts.now.getTime() - PLAN_LOOKBACK_DAYS * DAY_MS);
  const rows: PlanRow[] = await prisma.gapAuditEvent.findMany({
    where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, created_at: { gte: since } },
    orderBy: [{ created_at: 'desc' }],
    take: PLAN_LOOKBACK_DAYS * 4 + 2,
  });
  // The newest row of the newest earlier day (the rows are newest first, so a day's first row is its newest revision).
  const earlier = rows.filter((r) => r.subject_id < day).sort((a, b) => (a.subject_id < b.subject_id ? 1 : a.subject_id > b.subject_id ? -1 : 0));
  return earlier.length ? rowToPlan(earlier[0], false) : null;
}

/** Every stored revision of a New York day, newest first. */
export async function loadDayPlanRevisions(prisma: PrismaLike, day: string): Promise<DayPlan[]> {
  const rows: PlanRow[] = await prisma.gapAuditEvent.findMany({ where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, subject_id: day }, orderBy: [{ created_at: 'desc' }] });
  return rows.map((r) => rowToPlan(r, false));
}

/** The stored plan for a New York day (its NEWEST revision), or null. */
export async function loadDayPlan(prisma: PrismaLike, day: string): Promise<DayPlan | null> {
  const row = await prisma.gapAuditEvent.findFirst({ where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, subject_id: day }, orderBy: [{ created_at: 'desc' }] });
  return row ? rowToPlan(row, false) : null;
}

/**
 * The plan for `now`'s New York day: the stored one when a claim exists, else built from `load` (the one day builder)
 * and written ONCE under an advisory lock. `load` runs only when no plan exists yet, or on a REFRESH (`refresh: true`,
 * an explicit resend; the scheduled cron never refreshes), which writes a new revision only when the change is material.
 */
export type PlanLoad = WorkDay | { day: WorkDay; decisionIds?: ReadonlyMap<string, string> };

export async function planDay(prisma: PrismaLike, input: { now: Date; load: () => Promise<PlanLoad>; refresh?: boolean; packPersona?: PackPersonaReader }, actor: string): Promise<DayPlan> {
  const day = nyDay(input.now);
  const existing = await loadDayPlan(prisma, day);
  if (existing && !input.refresh) return existing;
  // X21 (production 2026-10-08, the first briefing): the day builder (HubSpot reads, the whole cockpit read) runs
  // OUTSIDE the advisory-lock transaction, which has a short timeout; the lock guards only the re-check and the one
  // write. A plan written by another instance meanwhile wins and the day built here is dropped.
  const loaded = await input.load();
  const built = 'cards' in loaded ? loaded : loaded.day;
  const decisionIds = 'cards' in loaded ? undefined : loaded.decisionIds;
  const previous = await loadPreviousPlan(prisma, day, { now: input.now }).catch(() => null);
  let items = markCarried(await applyRecipientHolds(prisma, itemsForDay(built, day, { decisionIds }), input.packPersona), previous);
  const counts = { counts: built.counts, waiting: built.waiting.length, snoozed: built.snoozed.length };

  if (!existing) {
    return locked(prisma, day, async (tx) => {
      const again = await loadDayPlan(tx, day);
      if (again) return again;
      const row = await tx.gapAuditEvent.create({
        data: { kind: DAY_PLANNED, actor, subject_type: PLAN_SUBJECT_TYPE, subject_id: day, payload: JSON.parse(JSON.stringify({ items, ...counts, revision: 0, supersedes: null, changes: null })) },
      });
      return rowToPlan({ id: row.id, payload: row.payload ?? { items, counts: built.counts, revision: 0 }, created_at: row.created_at ?? input.now, subject_id: day }, true);
    });
  }

  // A refresh: the day's tokens are kept for every key the day already held (newest revision first), so the links
  // and the assignment bindings stay valid; only a new key mints a token.
  const tokens = new Map<string, string>();
  for (const rev of await loadDayPlanRevisions(prisma, day)) for (const i of rev.items) if (!tokens.has(i.key)) tokens.set(i.key, i.token);
  items = items.map((i) => (tokens.has(i.key) ? { ...i, token: tokens.get(i.key) as string } : i));
  const changes = planChanges(existing.items, items);
  if (!changes) return { ...existing, fresh: false, unchanged: true };
  return locked(prisma, day, async (tx) => {
    const again = await loadDayPlan(tx, day);
    // Another instance refreshed the day between the build and the lock: its revision wins and this one is dropped.
    if (again && again.id !== existing.id) return again;
    const revision = (existing.revision ?? 0) + 1;
    const row = await tx.gapAuditEvent.create({
      data: { kind: DAY_PLANNED, actor, subject_type: PLAN_SUBJECT_TYPE, subject_id: day, payload: JSON.parse(JSON.stringify({ items, ...counts, revision, supersedes: existing.id ?? null, changes })) },
    });
    return rowToPlan({ id: row.id, payload: row.payload ?? { items, counts: built.counts, revision, supersedes: existing.id ?? null, changes }, created_at: row.created_at ?? input.now, subject_id: day }, true);
  });
}

export interface FoundPlanItem {
  day: string;
  item: PlanItem;
  /** The revision the token was found in. */
  plan: DayPlan;
  /** The item's key is not on the newest revision of its day: the plan was refreshed and this item is off it. */
  retired: boolean;
  /** The newest revision of the day (the plan START and NEXT walk). */
  newest: DayPlan;
}

/** The item a token names, with its day, within the lookback (any revision); null for a forged or an older token. */
export async function findPlanItemByToken(prisma: PrismaLike, token: string, opts: { now: Date }): Promise<FoundPlanItem | null> {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const since = new Date(opts.now.getTime() - PLAN_LOOKBACK_DAYS * DAY_MS);
  const rows: PlanRow[] = await prisma.gapAuditEvent.findMany({
    where: { kind: DAY_PLANNED, subject_type: PLAN_SUBJECT_TYPE, created_at: { gte: since } },
    orderBy: [{ created_at: 'desc' }],
    take: PLAN_LOOKBACK_DAYS * 4 + 2,
  });
  const plans = rows.map((r) => rowToPlan(r, false));
  for (const plan of plans) {
    const item = plan.items.find((i) => i.token === token);
    if (!item) continue;
    // The rows are newest first: the first plan of that day is its newest revision.
    const newest = plans.find((p) => p.day === plan.day) ?? plan;
    return { day: plan.day, item, plan, retired: !newest.items.some((i) => i.key === item.key), newest };
  }
  return null;
}
