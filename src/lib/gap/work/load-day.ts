/**
 * ONE DAY BUILDER (X01, GAP OS sales execution engine, 2026-10-08). The Work page and the briefing cron call this
 * same function, so a briefing can never describe a second, inconsistent list (the mandate's section 5). The body is
 * the page's second wave moved out verbatim (R15, R41, R45, R51, R55, R60, R63 comments kept where they were). The
 * day is built over the cockpit read (`./cockpit-read.ts`, remembered two minutes per instance unless `fresh`), the
 * live pursuit summaries, the outcomes, the obligations (after the bounded follow-up sweep), the meetings, the
 * priorities, the follow-up plans and the closures. A preview (`?day=tomorrow`) reads tomorrow 8 am New York for
 * everything time-dependent while every write (the sweeps, the closure reconcile) stays at the real time, and under a
 * lane or a preview nothing is swept. Server only; nothing here renders.
 */
import { addDays, isDay, nyDay, nyDayAt } from './dates';
import { workDay, type AccountKnowledge, type WorkCard, type WorkDay } from './list';
import { mapLimit } from './map-limit';
import { todaySummary, type TodaySummary } from './today';
import { buyerMoves } from './commitment-model';
import { loadCompletedToday, loadMeetingRows, loadMeetingStartingPoints, loadWorkCommitments, resolveMeetingDeals } from './day-load';
import { loadAccountPriorities } from './priority';
import { loadFollowUpPlans } from '../execution/follow-up-load';
import { loadWorkOutcomes, loadPreparedMeetings } from './outcome';
import { loadPursuitSummaries, type PursuitSummary } from '../pursuit/summary';
import { ANSWERED_FACTS_MAX_MS, PURSUIT_SUMMARY_TTL_MS } from '../pursuit/summary-ttl';
import { loadRecordedClosures, sweepClosedDeals } from '../deals/closure';
import { loadRecordedReplyIds, withoutRecordedReplies, loadAnswersOwed } from './recorded-replies';
import { resolveAccountOpportunity } from '../opportunity/active-opportunity';
import { cachedRead, type CachedRead } from './cache';
import { loadCockpit, type CockpitData } from './cockpit-read';
import { loadPursued, type PursuedItem } from './intel';
import { dealCoverageFrom } from './deal-coverage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface LoadWorkDayOptions {
  /** An analyst lane is open: the lanes are read fresh and nothing is swept or counted as the day. */
  lane: boolean;
  /** `?day=tomorrow`: the day as it will stand tomorrow at 8 am New York, read only. */
  preview: boolean;
  /** Bypass the two-minute cockpit cache (Refresh). */
  fresh: boolean;
  /** The real time (tests and crons pass it; the page lets it default). */
  now?: Date;
}

/**
 * Knowledge program C2 (2026-10-09): the shape of one vault note as Builder A's table holds it (`GapKnowledgeNote`;
 * only the fields the day reads). The reader is injected (`LoadWorkDayDeps.knowledge`, the shape of
 * `knowledgeForAccount(prisma, accountName, { limit })`: the account's notes newest first); with none injected the
 * day reads no knowledge.
 */
export interface KnowledgeNoteLike {
  path: string;
  kind: 'account' | 'person' | 'deal' | 'meeting' | 'raw' | 'other';
  account_name?: string | null;
  note_date: Date | string | null;
  title?: string | null;
  frontmatter?: Record<string, unknown> | null;
  source?: 'fireflies' | 'calendar-prep' | 'librarian' | null;
  people?: readonly string[] | null;
}
export type KnowledgeReader = (prisma: PrismaLike, accountName: string, opts: { limit?: number; domains?: readonly string[] }) => Promise<readonly KnowledgeNoteLike[]>;

export interface LoadWorkDayDeps {
  /** C2: Builder A's knowledge reader (the lead wires the real one). Soft: a reader that throws reads as no knowledge. */
  knowledge?: KnowledgeReader;
}

/** How many notes per account the day reads (the newest first; the account note and the recent meetings are among them). */
export const KNOWLEDGE_NOTES_LIMIT = 40;
const KNOWLEDGE_CONCURRENCY = 4;

const noteAt = (n: KnowledgeNoteLike): number => {
  const t = n.note_date ? new Date(n.note_date).getTime() : NaN;
  return Number.isFinite(t) ? t : NaN;
};
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);
/** A frontmatter day: a Date, an ISO day, or a datetime string, as a New York day; anything else is none. */
function frontmatterDay(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : nyDay(v);
  const t = str(v);
  if (!t) return null;
  if (isDay(t)) return t;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : nyDay(d);
}
function frontmatterAt(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  const t = str(v);
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * C2: fold an account's notes into the day's summary. A conversation is a meeting note or a raw Fireflies capture whose
 * date is not after `now` (a prep note for a meeting ahead is not a conversation held); the next action, its due day
 * and the last touch come from the newest account note's frontmatter (next_action, next_action_due, last_touched).
 * No notes at all is null (the card carries nothing).
 */
export function accountKnowledgeOf(notes: readonly KnowledgeNoteLike[], now: Date): AccountKnowledge | null {
  if (!notes.length) return null;
  const held = notes.filter((n) => (n.kind === 'meeting' || (n.kind === 'raw' && n.source === 'fireflies')) && Number.isFinite(noteAt(n)) && noteAt(n) <= now.getTime());
  const newestHeld = held.map(noteAt).sort((a, b) => b - a)[0];
  const account = notes.filter((n) => n.kind === 'account').sort((a, b) => (noteAt(b) || 0) - (noteAt(a) || 0))[0] ?? null;
  const fm = (account?.frontmatter ?? {}) as Record<string, unknown>;
  return {
    lastConversationAt: newestHeld !== undefined ? new Date(newestHeld).toISOString() : null,
    conversations: held.length,
    nextAction: str(fm.next_action),
    nextActionDue: frontmatterDay(fm.next_action_due),
    lastTouched: frontmatterAt(fm.last_touched),
  };
}

/** C2: the summaries for the day's accounts, a few reads at a time; an account whose read fails has none. */
/** The production knowledge reader: the vault table's notes for the account, newest first (soft: unreadable is none). */
export const defaultKnowledgeReader: KnowledgeReader = async (prisma, accountName, opts) => {
  if (!prisma?.gapKnowledgeNote || typeof prisma.gapKnowledgeNote.findMany !== 'function') return [];
  const { knowledgeForAccount } = await import('../knowledge/vault-table-adapter');
  const set = await knowledgeForAccount(prisma, accountName, { limit: opts?.limit, ...(opts?.domains ? { domains: opts.domains } : {}) });
  return set.all as unknown as Awaited<ReturnType<KnowledgeReader>>;
};

export async function knowledgeByAccount(prisma: PrismaLike, accounts: readonly string[], reader: KnowledgeReader, now: Date): Promise<Map<string, AccountKnowledge>> {
  const out = new Map<string, AccountKnowledge>();
  const names = [...new Set(accounts)];
  const results = await mapLimit(names, KNOWLEDGE_CONCURRENCY, (name) => reader(prisma, name, { limit: KNOWLEDGE_NOTES_LIMIT }));
  results.forEach((r, k) => {
    if (r.status !== 'fulfilled' || !Array.isArray(r.value)) return;
    const k2 = accountKnowledgeOf(r.value, now);
    if (k2) out.set(names[k], k2);
  });
  return out;
}

/**
 * The walk fix (2026-10-10): the summaries read past the TTL, split. `fresh` (within PURSUIT_SUMMARY_TTL_MS) speak for
 * the cards as before; `answered` gathers every summary's answered replies, whatever its age: once a send of ours
 * followed a reply it stays answered. Pure.
 */
export function splitSummaries(all: ReadonlyMap<string, PursuitSummary>, now: Date): { fresh: Map<string, PursuitSummary>; answered: Array<{ accountName: string; from: string; at: string; answeredAt: string; id?: string | null }> } {
  const fresh = new Map<string, PursuitSummary>();
  const answered: Array<{ accountName: string; from: string; at: string; answeredAt: string; id?: string | null }> = [];
  for (const [name, s] of all) {
    const age = now.getTime() - new Date(s.at).getTime();
    if (age >= 0 && age <= PURSUIT_SUMMARY_TTL_MS) fresh.set(name, s);
    for (const a of s.answered ?? []) answered.push({ accountName: name, ...a });
  }
  return { fresh, answered };
}

export interface WorkDayLoad {
  read: CachedRead<CockpitData>;
  data: CockpitData;
  /** The clock everything time-dependent read (the preview's tomorrow 8 am, else the real time). */
  now: Date;
  realNow: Date;
  preview: boolean;
  day: WorkDay;
  cards: WorkCard[];
  commitments: Awaited<ReturnType<typeof loadWorkCommitments>>;
  meetings: Array<{ accountName: string; at: string; what: string; meetingId: number | null; dealId: string | null }>;
  today: TodaySummary;
}

/**
 * Seller acceptance follow-up (2026-10-09): the angles GAP has already prepared, by account, as evidence for the day's
 * ranking (work/list.ts evidenceRank). A pursued item counts when its angle is ready and the person is placed at an
 * account (the placement is read-time, through the identity machinery in work/intel.ts); the newest decision wins.
 */
export function preparedAnglesByAccount(pursued: readonly PursuedItem[]): Map<string, { who: string; line: string }> {
  const out = new Map<string, { who: string; line: string }>();
  for (const p of pursued) {
    if (p.status !== 'ready' || !p.angle || !p.accountName || out.has(p.accountName)) continue;
    const who = p.writer?.name ?? p.writer?.email ?? p.title;
    out.set(p.accountName, { who, line: `GAP prepared an angle for ${who}: ${p.angle.whyItMatters.replace(/\s+/g, ' ').trim().slice(0, 140)}` });
  }
  return out;
}

export async function loadWorkDay(prisma: PrismaLike, opts: LoadWorkDayOptions, deps: LoadWorkDayDeps = {}): Promise<WorkDayLoad> {
  const { fresh } = opts;
  const read = await cachedRead('cockpit', () => loadCockpit(prisma), { fresh });
  const data = read.value;
  const realNow = opts.now ?? new Date();
  // R45: `?day=tomorrow` previews Work as it will stand tomorrow at 8 am New York (read only: every write still happens
  // at the real time, every gate re-runs at the click). Everything time-dependent below reads `now`.
  const { lane, preview } = opts;
  const now = preview ? nyDayAt(addDays(nyDay(realNow), 1), 8) : realNow;
  // R55: work scoped to a deal that left the portal's open deals is reconciled with HubSpot's closure (bounded: five
  // accounts at most, every five minutes per instance; never when the open-deal read is unavailable; real time only).
  if (!lane && !preview) {
    const openDealIds = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => d.id).filter((x): x is string => !!x))) : null;
    const openDealNames = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => (d.name ?? '').trim().toLowerCase()).filter(Boolean))) : null;
    await sweepClosedDeals(prisma, { now: realNow, openDealIds, openDealNames, resolve: (a) => resolveAccountOpportunity(prisma, a, {}, { timeoutMs: 8_000 }) }).catch(() => null);
  }
  // R15: the summaries come from this instance's memory, then the durable rows (one read), so a cold instance says
  // what the last workspace read said instead of falling back to the lanes.
  // R41: the obligations (after the bounded follow-up sweep), the next day's meetings and the seller's priorities are
  // read on every render, never cached with the lanes, so a write shows on the next load.
  // R60 capture once: which remembered replies were recorded since the read (one live read, in this same wave).
  const [summariesAnyAge, outcomes, commitments, meetingRowsRaw, recordedReplies, answersOwed, preparedMeetings] = await Promise.all([
    // R63-A B3: the preview starts from what the workspace says NOW (a summary read at tomorrow's time aged out and the
    // preview fell back to cards that knew nothing of a reply, a do not contact or a hold).
    // The walk fix (2026-10-10): ONE read past the TTL; only the fresh summaries speak for the cards, while the answered
    // replies an older summary recorded still stand (a reply answered stays answered).
    loadPursuitSummaries(prisma, data.workAccounts, realNow, ANSWERED_FACTS_MAX_MS),
    loadWorkOutcomes(prisma, data.workAccounts, now).catch(() => new Map()),
    // The sweep writes at the real time only; the phases are read at `now`.
    lane ? Promise.resolve([]) : loadWorkCommitments(prisma, realNow, { replies: data.workInput.replies }).catch(() => []),
    // R51: every meeting row in the window, canceled ones included (Work says so and stops asking to prepare them).
    lane ? Promise.resolve([]) : loadMeetingRows(prisma, now).catch(() => []),
    loadRecordedReplyIds(prisma, data.workInput.replies.map((r) => r.id ?? '')).catch(() => new Set<string>()),
    // R63-A S4: the recorded replies still owed an answer (never forgotten the moment they are recorded).
    lane ? Promise.resolve([]) : loadAnswersOwed(prisma, realNow).catch(() => []),
    // R63-A S11: the meetings marked prepared (they leave what needs you).
    loadPreparedMeetings(prisma, data.workAccounts, realNow).catch(() => new Set<string>()),
  ]);
  const { fresh: summariesRead, answered } = splitSummaries(summariesAnyAge, realNow);
  // R63-A S1: the list is complete when the reply read had no further page (then a remembered "replied" with no reply
  // waiting is stale, recorded since).
  const liveRead = withoutRecordedReplies(data.workInput.replies, summariesRead, recordedReplies, { complete: !data.counts.replies.atLeast });
  const live = { ...liveRead, replies: [...liveRead.replies, ...answersOwed.filter((a) => !liveRead.replies.some((r) => r.id === a.id))] };
  const summaries = live.summaries ?? summariesRead;
  // Batch item 8: an untagged meeting belongs to the deal whose contacts it names (the brief's own rule), so its
  // preparation and its rebooking never read another deal's work.
  const meetingRows = await resolveMeetingDeals(prisma, meetingRowsRaw, data.workInput.inDeals).catch(() => meetingRowsRaw);
  const mailbox = process.env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || null;
  const meetings = meetingRows.filter((m) => !m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
  const canceledMeetings = meetingRows.filter((m) => m.canceled).map((m) => ({ accountName: m.accountName, at: m.at, what: m.what, meetingId: m.meetingId, dealId: m.dealId }));
  // Sprint 5 review: a meeting or an obligation on a deal that is not open here is named from GAP's own closure record
  // (its name, outcome and date), read in this same wave and only for the accounts that hold one.
  const openIds = data.workInput.inDeals.status === 'complete' ? new Set(data.workInput.inDeals.accounts.flatMap((a) => a.deals.map((d) => d.id).filter((x): x is string => !!x))) : null;
  const closureAccounts = [...new Set([...meetingRows, ...commitments].filter((x) => !!x.dealId && /^\d+$/.test(x.dealId) && !openIds?.has(x.dealId)).map((x) => x.accountName))];
  // Seller acceptance follow-up: the prepared angles ride as ranking evidence (never under a lane; soft: unread is none).
  // The day's own in-deals read rides along so a person two accounts claim is placed by the family's deal (C5), as the intelligence does.
  const pursued: PursuedItem[] = lane ? [] : await loadPursued(prisma, realNow, { coverage: dealCoverageFrom(data.workInput.inDeals) }).catch(() => []);
  const preparedAngles = preparedAnglesByAccount(pursued);
  // C2: the vault's account summaries ride as ranking evidence (never under a lane; soft: no reader, or a reader that
  // throws, is no knowledge). The windows are read at `now` (the preview's tomorrow reads tomorrow's windows).
  // The lead's wiring (knowledge program, 2026-10-09): with no reader injected, the production reader is the vault table
  // (builder A's knowledgeForAccount, its `.all` list); a client without the table reads as no knowledge (soft).
  const reader: KnowledgeReader | undefined = deps.knowledge ?? defaultKnowledgeReader;
  const knowledge = lane || !reader ? new Map<string, AccountKnowledge>() : await knowledgeByAccount(prisma, [...new Set([...data.workAccounts, ...commitments.map((c) => c.accountName)])], reader, now).catch(() => new Map<string, AccountKnowledge>());
  const [priorities, followUpPlans, meetingPreps, closedDeals] = await Promise.all([
    loadAccountPriorities(prisma, [...new Set([...data.workAccounts, ...commitments.map((c) => c.accountName)])]).catch(() => new Map()),
    // R43: each follow-up due today, read off the person's own history (prepare, by hand, a saved draft, unknown, held).
    loadFollowUpPlans(prisma, commitments, { now, mailbox, held: data.workInput.held, dealAccounts: new Set(data.workInput.inDeals.status === 'complete' ? data.workInput.inDeals.accounts.map((a) => a.accountName) : []) }).catch(() => new Map()),
    // R51: each meeting's prepared starting point (objective, first thing to learn, last commitment).
    loadMeetingStartingPoints(prisma, meetingRows.filter((m) => new Date(m.at).getTime() <= now.getTime() + 24 * 3_600_000), commitments, now).catch(() => new Map()),
    closureAccounts.length ? loadRecordedClosures(prisma, closureAccounts).catch(() => new Map()) : Promise.resolve(new Map()),
  ]);
  const day = workDay({ ...data.workInput, replies: live.replies, now, summaries, answered, outcomes, commitments, meetings, canceledMeetings, meetingPreps, priorities, followUpPlans, closedDeals, preparedMeetings, preparedAngles, knowledge });
  // R45: close the day and keep tomorrow, derived from actual state (no new storage).
  const doneToday = lane || preview ? [] : await loadCompletedToday(prisma, now).catch(() => []);
  const today = todaySummary({ now, commitments, done: doneToday, waiting: day.waiting, meetings, moved: buyerMoves(data.workInput.replies) });
  return { read, data, now, realNow, preview, day, cards: day.cards, commitments, meetings, today };
}
