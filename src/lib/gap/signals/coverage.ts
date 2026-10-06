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
 * The rotation order (discoveryOrder) is also decided here, pure: priority accounts first, each least-recently
 * asked, with STARVATION PROTECTION: an account whose last turn failed within the backoff window goes behind every
 * account that has not failed, so one hard account never takes a slot run after run. Pinned by
 * tests/unit/gap/coverage.test.ts.
 */
import { GROUNDED_ACCOUNTS_PER_RUN, GROUNDED_DISCOVERY_AUDIT, SOURCE_CLASS_BUNDLES, SOURCE_CLASS_COVERAGE } from './grounded-discovery';
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
/** After a failed turn an account waits this long before it may take a slot ahead of accounts that have not failed. */
export const FAILURE_BACKOFF_MS = 6 * 60 * 60_000;
export const NEWS_AUDIT = 'signal.discovery';

export type ClassState = 'covered' | 'stale' | 'never' | 'failed';

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
}

export interface CapacityStatement {
  accounts: number;
  priorityAccounts: number;
  bundles: number;
  accountsPerRun: number;
  runsPerDay: number;
  turnsPerDay: number;
  fullRotationDays: number;
  /** Turns per day the seven-day objective needs for every bundle of every account. */
  requiredTurnsPerDay: number;
  meetsSevenDayTarget: boolean;
  /** The daily pass for priority accounts leaves this many turns a day for the rotation (negative: the priorities alone exceed the allowance). */
  rotationTurnsPerDay: number;
  meetsPriorityDailyTarget: boolean;
  /** The one quantified choice when an objective is not met (never applied here). */
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
  profiles: ReadonlyArray<Pick<WatchProfile, 'accountName' | 'reasons'>>;
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
}

const bundleIndexOf = (classes: readonly string[]): number => {
  const first = classes[0];
  const i = SOURCE_CLASS_BUNDLES.findIndex((b) => b.includes(first));
  return i >= 0 ? i : -1;
};

const newer = (a: string | null, b: string | null): string | null => (!a ? b : !b ? a : a > b ? a : b);

export function coverageReport(i: CoverageInput): CoverageReport {
  const now = i.now.getTime();
  const perRun = i.accountsPerRun ?? GROUNDED_ACCOUNTS_PER_RUN;
  const runsPerDay = i.runsPerDay ?? GROUNDED_RUNS_PER_DAY;
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
    };
  });
  const counts = { covered: 0, stale: 0, never: 0, failed: 0, priority: 0 };
  for (const a of accounts) {
    counts[a.state] += 1;
    if (a.priority) counts.priority += 1;
  }
  const turnsPerDay = perRun * runsPerDay;
  const bundles = SOURCE_CLASS_BUNDLES.length;
  const fullRotationDays = accounts.length ? (accounts.length * bundles) / turnsPerDay : 0;
  const requiredTurnsPerDay = Math.ceil((accounts.length * bundles) / 7);
  const rotationTurnsPerDay = turnsPerDay - counts.priority;
  const meetsPriorityDailyTarget = counts.priority <= turnsPerDay;
  const meetsSevenDayTarget = accounts.length === 0 || fullRotationDays <= 7;
  const choice =
    meetsSevenDayTarget && meetsPriorityDailyTarget
      ? null
      : `At ${perRun} accounts a run and ${runsPerDay} runs a day (${turnsPerDay} turns a day), ${accounts.length} watched accounts x ${bundles} bundles take ${fullRotationDays.toFixed(1)} days per full rotation${counts.priority ? `, and ${counts.priority} priority accounts need ${counts.priority} of those turns every day` : ''}. The seven-day objective needs ${requiredTurnsPerDay} turns a day: either the grounded cron runs hourly (${perRun * 24} turns a day, about ${Math.round(((perRun * 24) / turnsPerDay) * 100 - 100)}% more grounded-search calls), or the watched population is cut to about ${Math.max(0, Math.floor((turnsPerDay * 7) / bundles) - counts.priority)} rotating accounts beside the priorities. Nothing is changed here; this is the choice.`;
  return {
    at: i.now.toISOString(),
    accounts,
    counts,
    capacity: { accounts: accounts.length, priorityAccounts: counts.priority, bundles, accountsPerRun: perRun, runsPerDay, turnsPerDay, fullRotationDays: Number(fullRotationDays.toFixed(2)), requiredTurnsPerDay, meetsSevenDayTarget, rotationTurnsPerDay, meetsPriorityDailyTarget, choice },
    classes: SOURCE_CLASS_COVERAGE,
  };
}

/**
 * The grounded rotation order: priority accounts first, then the rest, each least-recently asked first; an account
 * whose last turn FAILED within the backoff window goes behind every account that has not failed (starvation
 * protection: one hard account never holds a slot run after run). Deterministic (name as the final key). Pure.
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
  const tier = (name: string) => (i.priority?.has(name) ? 0 : 1);
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
