/**
 * MONITORED COVERAGE AND CAPACITY (GAP OS execution recovery, R20, 2026-10-06).
 *
 * "Runs every two hours" does not mean "every account checked across every source class every two hours". This
 * module says what IS covered, from the ledgers the discovery and research jobs already write:
 *
 *   per account      the watch reasons; the last news pass; the last grounded turn per source-class bundle (the
 *                    `signal.grounded_discovery` audit row names the classes it asked); the last background research
 *                    run; whether the last grounded turn FAILED (a provider outage) so failure is never read as "no
 *                    news"; whether the account is a PRIORITY (in motion, chosen, in a deal, a meeting within 14 days)
 *   per class        covered (asked within the target), stale (asked, older than the target), never, failed
 *   capacity         accounts x bundles / (runs per day x accounts per run) = days per full rotation, against the
 *                    declared objectives: a daily pass for priority accounts; every bundle within seven days. When the
 *                    allowance cannot meet them, the report says so with the one quantified choice (never a silent
 *                    change of spend, cadence or cap)
 *
 * The rotation order (discoveryOrder) is also decided here, pure: priority accounts DUE for their daily pass first,
 * then everyone least-recently asked, with STARVATION PROTECTION: an account whose last turn failed within the backoff
 * window goes behind every account that has not failed, so one hard account never takes a slot run after run; and a
 * priority account already asked within its day waits its turn by recency, so the priorities never take every turn.
 *
 * The ROTATING POPULATION is bounded too (R20 follow-up; the lead's decision on 2026-10-06: no spend increase, no
 * cron change): every priority account rotates, and beside them only as many accounts as the rest of the allowance
 * covers in seven days (groundedRotationSlots), chosen by tier, then band, then name (groundedRotation). The others
 * stay watched for NEWS only and the Coverage page says so per account. Pinned by tests/unit/gap/coverage.test.ts.
 */
import { GROUNDED_ACCOUNTS_PER_RUN, GROUNDED_DISCOVERY_AUDIT, SOURCE_CLASS_BUNDLES, SOURCE_CLASS_COVERAGE } from './grounded-discovery';
import { DISCOVERY_ACCOUNTS_PER_RUN } from './discovery';
import { BACKGROUND_AUDIT } from '../research/background';
import { loadWatchProfilesCached, type WatchProfile } from './watch';
import { ACCOUNT_MOTION } from '../motion/account-motion';
import { loadRecentFirstTouchAccounts } from '../motion/load';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** The declared objectives (the mandate's initial service objectives). */
export const COVERAGE_TARGET_MS = 7 * 86_400_000;
export const PRIORITY_TARGET_MS = 1 * 86_400_000;
/** The grounded cron schedule (vercel.json): every two hours at fifteen past. */
export const GROUNDED_RUNS_PER_DAY = 12;
/**
 * Batch item 10: the share of the rotation's turns kept free for a turn that fails (a provider outage, retried next run)
 * or is skipped by the run's time budget. Sized with no margin, the rotation met the seven-day objective with exactly
 * zero slack (21 accounts x 4 bundles / 12 turns a day = 7.0 days): one lost turn and it was missed. The rotation is
 * sized, and "met" is read, against the allowance less this margin.
 */
export const ROTATION_MARGIN = 0.15;
/** After a failed turn an account waits this long before it may take a slot ahead of accounts that have not failed. */
export const FAILURE_BACKOFF_MS = 6 * 60 * 60_000;
export const NEWS_AUDIT = 'signal.discovery';

export type ClassState = 'covered' | 'stale' | 'never' | 'failed';
/** Where an account stands in the grounded rotation: a priority (a daily pass), rotating (every bundle within seven days), or news only. */
export type RotationRole = 'priority' | 'rotating' | 'news_only';
/** The recorded capacity decision (the lead, 2026-10-06): the allowance stays; the rotation is bounded instead. */
export const ROTATION_DECISION = 'Decided 2026-10-06: no spend increase, no cadence change; the rotation is bounded instead.';

export interface AccountCoverage {
  accountName: string;
  reasons: string[];
  priority: boolean;
  priorityWhy: string[];
  lastNewsAt: string | null;
  lastGroundedAt: string | null;
  lastGroundedFailed: boolean;
  lastResearchAt: string | null;
  /** Per bundle (index into SOURCE_CLASS_BUNDLES): when last asked, and its state against the target. */
  bundles: Array<{ classes: string[]; lastAt: string | null; state: ClassState }>;
  /** Against the objective for THIS account (a day for a priority account, the class target otherwise). */
  state: 'covered' | 'stale' | 'never' | 'failed';
  /** R20 follow-up: in the grounded rotation (as a priority or a rotating account) or watched for news only. */
  rotation: RotationRole;
}

export interface CapacityStatement {
  accounts: number;
  priorityAccounts: number;
  bundles: number;
  accountsPerRun: number;
  runsPerDay: number;
  turnsPerDay: number;
  /** The daily pass for priority accounts leaves this many turns a day for the rotation (negative: the priorities alone exceed the allowance). */
  rotationTurnsPerDay: number;
  /** Batch item 10: the share of rotation turns kept for a failed or skipped turn (the rotation is sized without it). */
  margin: number;
  /** Batch item 10: the news pass asks at most this many accounts a run, with the time the grounded turns leave. */
  newsAccountsPerRun: number;
  /** Batch item 10: at that cap and cadence, each watched account's news is asked at best every this many hours. */
  newsHoursPerAccount: number;
  /** How many non-priority accounts the rotation can carry so each gets every bundle within seven days. */
  rotationSlots: number;
  /** Non-priority accounts in the grounded rotation (at most rotationSlots). */
  rotatingAccounts: number;
  /** Watched accounts outside the grounded rotation: the news pass only. */
  newsOnlyAccounts: number;
  /** Days for the BOUNDED rotation to ask every bundle of every rotating account (null: no turns left beside the priorities). */
  fullRotationDays: number | null;
  /** Days the same allowance would take to rotate EVERY watched account (the alternative the decision declined). */
  uncappedRotationDays: number | null;
  /** Turns per day covering every watched account in seven days needs (a daily turn per priority plus every bundle of the rest). */
  requiredTurnsPerDay: number;
  /** The bounded rotation meets the seven-day objective. */
  meetsSevenDayTarget: boolean;
  /** Every watched account is in the grounded rotation. */
  coversAllWatched: boolean;
  meetsPriorityDailyTarget: boolean;
  /** The decision and its quantified alternative, when the allowance cannot cover every watched account (never applied here). */
  choice: string | null;
}

export interface CoverageReport {
  at: string;
  accounts: AccountCoverage[];
  counts: { covered: number; stale: number; never: number; failed: number; priority: number };
  capacity: CapacityStatement;
  classes: ReadonlyArray<{ cls: string; mode: 'automated' | 'manual_only'; via: string }>;
}

export interface GroundedTurn {
  accountName: string;
  at: string;
  classes: string[];
  error: string | null;
}

export interface CoverageInput {
  now: Date;
  profiles: ReadonlyArray<Pick<WatchProfile, 'accountName' | 'reasons'> & Partial<Pick<WatchProfile, 'tier' | 'band'>>>;
  /** Every grounded turn on record (newest first or any order). */
  grounded: readonly GroundedTurn[];
  /** The newest news pass per account. */
  newsAt: ReadonlyMap<string, string>;
  /** The newest background research run that targeted the account. */
  researchAt: ReadonlyMap<string, string>;
  /** Why an account is a priority (in motion, chosen, deal, meeting), when it is. */
  priority: ReadonlyMap<string, string[]>;
  accountsPerRun?: number;
  runsPerDay?: number;
  /** Batch item 10: the margin the rotation is SIZED with (default ROTATION_MARGIN); "met" always requires ROTATION_MARGIN to spare. */
  margin?: number;
}

const bundleIndexOf = (classes: readonly string[]): number => {
  const first = classes[0];
  const i = SOURCE_CLASS_BUNDLES.findIndex((b) => b.includes(first));
  return i >= 0 ? i : -1;
};

const newer = (a: string | null, b: string | null): string | null => (!a ? b : !b ? a : a > b ? a : b);

/**
 * R20 follow-up: how many non-priority accounts the grounded rotation can carry. Each priority account takes one turn
 * a day (its daily pass); what is left over seven days, divided by the bundles each rotating account needs, is the
 * number of accounts that get every bundle within seven days. Never negative. Pure.
 */
export function groundedRotationSlots(i: { turnsPerDay: number; bundles: number; priorityCount: number; margin?: number }): number {
  if (i.bundles <= 0) return 0;
  // Batch item 10: the margin keeps turns free for a failed or skipped one, so "every bundle within seven days" holds.
  const margin = i.margin ?? ROTATION_MARGIN;
  return Math.max(0, Math.floor((7 * (i.turnsPerDay - i.priorityCount) * (1 - margin)) / i.bundles));
}

/** Tier 1 before Tier 2 before Tier 3; no tier last. */
const tierRank = (t: string | null | undefined): number => {
  const m = /(\d+)/.exec(t ?? '');
  return m ? Number(m[1]) : 99;
};
/** Band A before B before C; no band last. */
const bandRank = (b: string | null | undefined): number => {
  const c = (b ?? '').trim().toUpperCase();
  return /^[A-Z]$/.test(c) ? c.charCodeAt(0) - 64 : 99;
};

/**
 * R20 follow-up: the bounded, deterministic rotating population. Every priority account rotates; the rest are ordered
 * by tier, then band, then name, and the first `slots` rotate; everyone else is watched for news only. The input order
 * never changes the choice. Pure.
 */
export function groundedRotation<T extends { accountName: string; tier?: string | null; band?: string | null }>(
  profiles: readonly T[],
  i: { priority: ReadonlySet<string>; slots: number },
): { priority: T[]; rotating: T[]; newsOnly: T[] } {
  const ranked = [...profiles].sort((a, b) => tierRank(a.tier) - tierRank(b.tier) || bandRank(a.band) - bandRank(b.band) || a.accountName.localeCompare(b.accountName));
  const priority = ranked.filter((p) => i.priority.has(p.accountName));
  const rest = ranked.filter((p) => !i.priority.has(p.accountName));
  const slots = Math.max(0, Math.floor(i.slots));
  return { priority, rotating: rest.slice(0, slots), newsOnly: rest.slice(slots) };
}

export function coverageReport(i: CoverageInput): CoverageReport {
  const now = i.now.getTime();
  const perRun = i.accountsPerRun ?? GROUNDED_ACCOUNTS_PER_RUN;
  const runsPerDay = i.runsPerDay ?? GROUNDED_RUNS_PER_DAY;
  const turnsPerDay = perRun * runsPerDay;
  const bundles = SOURCE_CLASS_BUNDLES.length;
  const prioritySet = new Set(i.profiles.filter((p) => (i.priority.get(p.accountName) ?? []).length > 0).map((p) => p.accountName));
  const rotationSlots = groundedRotationSlots({ turnsPerDay, bundles, priorityCount: prioritySet.size, margin: i.margin });
  const rotation = groundedRotation(i.profiles, { priority: prioritySet, slots: rotationSlots });
  const roleOf = new Map<string, RotationRole>([
    ...rotation.priority.map((p) => [p.accountName, 'priority'] as const),
    ...rotation.rotating.map((p) => [p.accountName, 'rotating'] as const),
    ...rotation.newsOnly.map((p) => [p.accountName, 'news_only'] as const),
  ]);
  const byAccount = new Map<string, GroundedTurn[]>();
  for (const t of i.grounded) byAccount.set(t.accountName, [...(byAccount.get(t.accountName) ?? []), t]);
  const accounts: AccountCoverage[] = i.profiles.map((p) => {
    const turns = (byAccount.get(p.accountName) ?? []).sort((a, b) => b.at.localeCompare(a.at));
    const last = turns[0] ?? null;
    const bundles = SOURCE_CLASS_BUNDLES.map((classes, idx) => {
      const mine = turns.filter((t) => bundleIndexOf(t.classes) === idx);
      const ok = mine.find((t) => !t.error) ?? null;
      const lastAt = ok?.at ?? null;
      const failedSince = mine[0] && mine[0].error && (!ok || mine[0].at > ok.at);
      const state: ClassState = failedSince && (!lastAt || now - new Date(lastAt).getTime() > COVERAGE_TARGET_MS) ? 'failed' : !lastAt ? 'never' : now - new Date(lastAt).getTime() <= COVERAGE_TARGET_MS ? 'covered' : 'stale';
      return { classes: [...classes], lastAt, state };
    });
    const why = i.priority.get(p.accountName) ?? [];
    const priority = why.length > 0;
    const lastOk = turns.find((t) => !t.error) ?? null;
    const lastAny = newer(lastOk?.at ?? null, i.newsAt.get(p.accountName) ?? null);
    const target = priority ? PRIORITY_TARGET_MS : COVERAGE_TARGET_MS;
    const state: AccountCoverage['state'] = last?.error && (!lastAny || now - new Date(lastAny).getTime() > target) ? 'failed' : !lastAny ? 'never' : now - new Date(lastAny).getTime() <= target ? 'covered' : 'stale';
    return {
      accountName: p.accountName,
      reasons: [...p.reasons],
      priority,
      priorityWhy: why,
      lastNewsAt: i.newsAt.get(p.accountName) ?? null,
      lastGroundedAt: lastOk?.at ?? null,
      lastGroundedFailed: !!last?.error,
      lastResearchAt: i.researchAt.get(p.accountName) ?? null,
      bundles,
      state,
      rotation: roleOf.get(p.accountName) ?? 'news_only',
    };
  });
  const counts = { covered: 0, stale: 0, never: 0, failed: 0, priority: 0 };
  for (const a of accounts) {
    counts[a.state] += 1;
    if (a.priority) counts.priority += 1;
  }
  const rotationTurnsPerDay = turnsPerDay - counts.priority;
  const meetsPriorityDailyTarget = counts.priority <= turnsPerDay;
  const rotatingAccounts = rotation.rotating.length;
  const newsOnlyAccounts = rotation.newsOnly.length;
  const nonPriority = accounts.length - counts.priority;
  // Days for a rotation: the turns its accounts need over the turns a day left beside the priorities' daily passes.
  const daysFor = (n: number): number | null => (rotationTurnsPerDay <= 0 ? null : n === 0 ? 0 : Number(((n * bundles) / rotationTurnsPerDay).toFixed(2)));
  const fullRotationDays = daysFor(rotatingAccounts);
  const uncappedRotationDays = daysFor(nonPriority);
  const requiredTurnsPerDay = counts.priority + Math.ceil((nonPriority * bundles) / 7);
  // Batch item 10: met only with the margin to spare (a failed or skipped turn never misses the objective).
  const meetsSevenDayTarget = fullRotationDays !== null && fullRotationDays <= 7 * (1 - ROTATION_MARGIN);
  const newsHoursPerAccount = accounts.length ? Math.ceil((accounts.length / (DISCOVERY_ACCOUNTS_PER_RUN * runsPerDay)) * 24) : 0;
  const coversAllWatched = newsOnlyAccounts === 0;
  const hourly = perRun * 24;
  const choice =
    coversAllWatched && meetsPriorityDailyTarget
      ? null
      : [
          `At ${perRun} accounts a run and ${runsPerDay} runs a day (${turnsPerDay} turns a day)`,
          counts.priority ? `, and ${counts.priority} priority accounts need ${counts.priority} turns a day for their daily pass` : '',
          meetsPriorityDailyTarget
            ? `, the grounded rotation is capped at ${rotatingAccounts} accounts beside the ${counts.priority} priority accounts (every bundle within seven days, chosen by tier, then band, then name); the other ${newsOnlyAccounts} watched accounts are checked by the news pass only. `
            : `: the priorities alone exceed the allowance, so no other account rotates and ${newsOnlyAccounts} watched accounts are checked by the news pass only. `,
          uncappedRotationDays !== null ? `Rotating every watched account at this allowance would take ${uncappedRotationDays.toFixed(1)} days per full rotation. ` : '',
          `Covering every watched account within seven days needs ${requiredTurnsPerDay} turns a day (the grounded cron runs hourly (${hourly} turns a day, about ${Math.round((hourly / turnsPerDay) * 100 - 100)}% more grounded-search calls)${requiredTurnsPerDay > hourly ? ', and even that falls short' : ''}). `,
          ROTATION_DECISION,
        ].join('');
  return {
    at: i.now.toISOString(),
    accounts,
    counts,
    capacity: { accounts: accounts.length, priorityAccounts: counts.priority, bundles, accountsPerRun: perRun, runsPerDay, turnsPerDay, rotationTurnsPerDay, margin: ROTATION_MARGIN, newsAccountsPerRun: DISCOVERY_ACCOUNTS_PER_RUN, newsHoursPerAccount, rotationSlots, rotatingAccounts, newsOnlyAccounts, fullRotationDays, uncappedRotationDays, requiredTurnsPerDay, meetsSevenDayTarget, coversAllWatched, meetsPriorityDailyTarget, choice },
    classes: SOURCE_CLASS_COVERAGE,
  };
}

/**
 * The grounded rotation order: priority accounts DUE for their daily pass first, then everyone least-recently asked;
 * an account whose last turn FAILED within the backoff window goes behind every account that has not failed
 * (starvation protection: one hard account never holds a slot run after run). A priority account asked within its
 * daily target is not ahead of the rotation: it waits its turn by recency, so the priorities never take every turn
 * of the day. Deterministic (name as the final key). Pure.
 */
export function discoveryOrder<T extends { accountName: string }>(
  profiles: readonly T[],
  i: { now: Date; lastAt: ReadonlyMap<string, number>; lastFailedAt?: ReadonlyMap<string, number>; priority?: ReadonlySet<string>; backoffMs?: number },
): T[] {
  const backoff = i.backoffMs ?? FAILURE_BACKOFF_MS;
  const now = i.now.getTime();
  const penalized = (name: string) => {
    const f = i.lastFailedAt?.get(name);
    return f !== undefined && now - f < backoff ? 1 : 0;
  };
  const due = (name: string) => {
    const last = i.lastAt.get(name);
    return last === undefined || now - last >= PRIORITY_TARGET_MS;
  };
  const tier = (name: string) => (i.priority?.has(name) && due(name) ? 0 : 1);
  return [...profiles].sort((a, b) => penalized(a.accountName) - penalized(b.accountName) || tier(a.accountName) - tier(b.accountName) || (i.lastAt.get(a.accountName) ?? 0) - (i.lastAt.get(b.accountName) ?? 0) || a.accountName.localeCompare(b.accountName));
}

/** The priority accounts and why: in motion or chosen (the ledger and the choices), in a deal, a meeting within 14 days. Database only. */
export async function loadDiscoveryPriority(prisma: PrismaLike, now: Date): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const add = (name: string | null | undefined, why: string) => {
    if (!name) return;
    out.set(name, [...new Set([...(out.get(name) ?? []), why])]);
  };
  const [touches, choices, meetings, active] = await Promise.all([
    loadRecentFirstTouchAccounts(prisma, now).catch(() => new Map()),
    prisma.gapAuditEvent?.findMany ? prisma.gapAuditEvent.findMany({ where: { kind: ACCOUNT_MOTION, subject_type: 'account', created_at: { gte: new Date(now.getTime() - 30 * 86_400_000) } }, select: { subject_id: true } }).catch(() => []) : [],
    prisma.meeting?.findMany ? prisma.meeting.findMany({ where: { meeting_date: { gte: now, lte: new Date(now.getTime() + 14 * 86_400_000) } }, select: { account_name: true } }).catch(() => []) : [],
    prisma.prospectingHypothesis?.findMany ? prisma.prospectingHypothesis.findMany({ where: { status: 'active' }, select: { account_name: true }, take: 500 }).catch(() => []) : [],
  ]);
  for (const name of (touches as Map<string, unknown>).keys()) add(name, 'a first touch in motion');
  for (const r of choices as Array<{ subject_id: string }>) add(r.subject_id, 'a chosen person');
  for (const r of meetings as Array<{ account_name: string }>) add(r.account_name, 'a meeting within 14 days');
  for (const r of active as Array<{ account_name: string }>) add(r.account_name, 'a thesis in use');
  // Open deals: the In Deals summary row the cockpit keeps (never a HubSpot read here).
  try {
    const row = await prisma.systemConfig?.findUnique?.({ where: { key: 'gap:in-deals-summary' } });
    const summary = row?.value ? (JSON.parse(String(row.value)) as { status?: string; accounts?: Array<{ accountName: string }> }) : null;
    if (summary?.status === 'complete') for (const a of summary.accounts ?? []) add(a.accountName, 'an open deal');
  } catch {
    /* no summary: no deal priority */
  }
  return out;
}

/** The report over the live ledgers. Read only. */
export async function loadCoverage(prisma: PrismaLike, now: Date = new Date()): Promise<CoverageReport> {
  const profiles = await loadWatchProfilesCached(prisma);
  const names = profiles.map((p) => p.accountName);
  const since = new Date(now.getTime() - 30 * 86_400_000);
  const [groundedRows, newsRows, researchRows, priority] = await Promise.all([
    names.length ? prisma.gapAuditEvent.findMany({ where: { kind: GROUNDED_DISCOVERY_AUDIT, subject_type: 'account', subject_id: { in: names }, created_at: { gte: since } }, select: { subject_id: true, payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 5_000 }) : [],
    names.length ? prisma.gapAuditEvent.findMany({ where: { kind: NEWS_AUDIT, subject_type: 'account', subject_id: { in: names }, created_at: { gte: since } }, select: { subject_id: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 5_000 }) : [],
    prisma.gapAuditEvent.findMany({ where: { kind: BACKGROUND_AUDIT, created_at: { gte: since } }, select: { payload: true, created_at: true }, orderBy: { created_at: 'desc' }, take: 500 }),
    loadDiscoveryPriority(prisma, now),
  ]);
  const grounded: GroundedTurn[] = (groundedRows as Array<{ subject_id: string; payload: Record<string, unknown> | null; created_at: Date }>).map((r) => ({
    accountName: r.subject_id,
    at: new Date(r.created_at).toISOString(),
    classes: Array.isArray(r.payload?.classes) ? (r.payload!.classes as string[]) : [],
    error: typeof r.payload?.error === 'string' ? (r.payload!.error as string) : null,
  }));
  const newsAt = new Map<string, string>();
  for (const r of newsRows as Array<{ subject_id: string; created_at: Date }>) if (!newsAt.has(r.subject_id)) newsAt.set(r.subject_id, new Date(r.created_at).toISOString());
  const researchAt = new Map<string, string>();
  for (const r of researchRows as Array<{ payload: Record<string, unknown> | null; created_at: Date }>) {
    const targets = Array.isArray(r.payload?.targets) ? (r.payload!.targets as Array<{ accountName?: string }>) : Array.isArray(r.payload?.results) ? (r.payload!.results as Array<{ accountName?: string }>) : [];
    for (const t of targets) if (t?.accountName && !researchAt.has(t.accountName)) researchAt.set(t.accountName, new Date(r.created_at).toISOString());
  }
  return coverageReport({ now, profiles, grounded, newsAt, researchAt, priority });
}
