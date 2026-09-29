/**
 * BACKGROUND EVIDENCE RESEARCH (Phase 2 B1, 2026-09-28).
 *
 * Casey should not wait for research. A bounded job runs the SAME evidence
 * research RESEARCH THIS runs (research/run.ts runEvidenceResearch: fetch,
 * re-fetch the canonical source, verify the quote verbatim, date it, classify
 * physical-network relevance, detect contradictions, set freshness, reject
 * with a reason) for the accounts where evidence would unblock the most work,
 * BEFORE he opens the app. Its output is an inbox (research/inbox.ts).
 *
 * It NEVER creates, submits, approves or activates a hypothesis, never links
 * evidence to one, never picks a problem family as buyer truth, never routes,
 * drafts, enrolls or sends. runEvidenceResearch writes only ResearchRun,
 * EvidenceRecord, ProspectingSignal and its audit row; this module adds only a
 * summary audit row. Pinned by tests/unit/gap/background-research.test.ts.
 *
 * Deterministic priority, no score (selectBackgroundTargets):
 *   1. a research thesis / research card blocking the most people
 *   2. a fresh Pounce trigger (newest first)
 *   3. an in-use or approved outreach fact nearing expiry (soonest first)
 *   then account tier, then the oldest unresolved research work, then name.
 *
 * Bounded (hard cap per run, a time budget), idempotent (an account researched
 * within the cooldown is skipped unless a newer trigger arrived), retry-safe
 * (each account independent; a failure is recorded, the next account runs),
 * cost-aware (one EDGAR + one web search per account), observable (cron state
 * + a `research.background_run` audit row naming every target and outcome).
 */
import { listAllCurrent } from '../routing/queue';
import { RESEARCHABLE_RULES, sellerLaneOf } from '../routing/card-readiness';
import { loadThesisGroups, splitThesisWork } from '../hypothesis/thesis-groups';
import { runEvidenceResearch, type ResearchDeps, type ResearchResult } from './run';
import { settleSignals, signalCandidates, signalFocus, type ResearchableSignal } from '../signals/research';
import { loadWatchProfiles } from '../signals/watch';
import { heldDealAccounts } from '../deals/in-deals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const BACKGROUND_ACTOR = 'gap-background-research';
export const BACKGROUND_AUDIT = 'research.background_run' as const;
export const BACKGROUND_PURPOSE = 'gap_background_research';
/** Hard cap per run: each account costs one EDGAR pass, one web search and a handful of source fetches. */
export const BACKGROUND_DEFAULT_CAP = 3;
export const BACKGROUND_MAX_CAP = 10;
/** An account researched this recently is skipped unless a newer trigger arrived. */
export const BACKGROUND_COOLDOWN_MS = 3 * 86_400_000;
/** Triggers newer than this are "fresh". */
export const TRIGGER_FRESH_MS = 14 * 86_400_000;
/** An outreach fact expiring within this is "nearing expiry". */
export const EXPIRY_HORIZON_MS = 21 * 86_400_000;
/** Stop starting new accounts after this much of the 300s function budget (one slow account can still run ~150s: EDGAR fetches time out at 15s each). */
export const BACKGROUND_TIME_BUDGET_MS = 120_000;

/**
 * Signal Intelligence B: research priority is (1) research work blocking people, (2) a signal Casey SHARED
 * (he said "follow this up"; it does not make it true), (3) a strong fresh discovered signal or Pounce trigger,
 * (4) evidence nearing expiry.
 */
export type TargetReason = 'research_work' | 'shared_signal' | 'requested_research' | 'fresh_trigger' | 'discovered_signal' | 'expiring_evidence' | 'work_source' | 'priority_backlog';
// Universal Work Intake: Casey pressing RESEARCH MORE on a source member ranks with a story he shared; an account
// a work source brought in (planned `research`) ranks after fresh triggers. Research is per ACCOUNT, never per row.
const REASON_RANK: Record<TargetReason, number> = { research_work: 1, shared_signal: 2, requested_research: 2, fresh_trigger: 3, discovered_signal: 3, expiring_evidence: 4, work_source: 4, priority_backlog: 5 };
/**
 * Signal Intelligence D: the proactive backlog. A watched priority account (signals/watch.ts) not researched
 * in this long is researched proactively, never-researched first, then the oldest. An account routing holds for
 * an open HubSpot deal is left out (its evidence would not be used for cold outreach).
 */
// 3 days (review D): with the 3-day account cooldown the watched universe (74) is covered about every 3 days,
// ~25 distinct accounts a day, the program's target. Day one can take up to 72 runs while never-researched accounts drain.
export const BACKLOG_STALE_MS = 3 * 86_400_000;
/** A queued signal whose research failed this many times is settled no_usable_fact (with the reason). */
export const SIGNAL_RESEARCH_MAX_ATTEMPTS = 3;

export interface BackgroundTarget {
  accountName: string;
  reason: TargetReason;
  peopleBlocked: number;
  triggerAt: string | null;
  triggerTitle: string | null;
  expiresAt: string | null;
  tier: string | null;
  oldestWorkAt: string | null;
  problemFamily: string | null;
  /** Signals (GapSignal ids) this research follows up. */
  signalIds?: string[];
  /** A signal Casey himself shared is among them: his "follow this up" is not held back by the account cooldown. */
  sharedByCasey?: boolean;
  /** Casey pressed RESEARCH MORE on a work-source member here: served (cleared) by this account's next attempt, whatever its reason. */
  workSourceRequested?: boolean;
}

export function tierRank(tier: string | null | undefined): number {
  const m = String(tier ?? '').match(/(\d+)/);
  return m ? Number(m[1]) : 9;
}

/** Deterministic order: reason, then people unblocked, trigger freshness, expiry, tier, oldest work, name. */
export function compareTargets(a: BackgroundTarget, b: BackgroundTarget): number {
  const t = (s: string | null, dflt: number) => (s ? new Date(s).getTime() : dflt);
  return (
    REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
    b.peopleBlocked - a.peopleBlocked ||
    t(b.triggerAt, 0) - t(a.triggerAt, 0) ||
    t(a.expiresAt, Number.MAX_SAFE_INTEGER) - t(b.expiresAt, Number.MAX_SAFE_INTEGER) ||
    tierRank(a.tier) - tierRank(b.tier) ||
    t(a.oldestWorkAt, Number.MAX_SAFE_INTEGER) - t(b.oldestWorkAt, Number.MAX_SAFE_INTEGER) ||
    a.accountName.localeCompare(b.accountName)
  );
}

function merge(map: Map<string, BackgroundTarget>, t: BackgroundTarget) {
  const cur = map.get(t.accountName);
  if (!cur) {
    map.set(t.accountName, t);
    return;
  }
  const better = REASON_RANK[t.reason] < REASON_RANK[cur.reason] ? t : cur;
  const later = (x: string | null, y: string | null) => (!x ? y : !y ? x : x > y ? x : y);
  const earlier = (x: string | null, y: string | null) => (!x ? y : !y ? x : x < y ? x : y);
  map.set(t.accountName, {
    ...better,
    peopleBlocked: Math.max(cur.peopleBlocked, t.peopleBlocked),
    triggerAt: later(cur.triggerAt, t.triggerAt),
    triggerTitle: later(cur.triggerAt, t.triggerAt) === t.triggerAt ? t.triggerTitle ?? cur.triggerTitle : cur.triggerTitle ?? t.triggerTitle,
    expiresAt: earlier(cur.expiresAt, t.expiresAt),
    oldestWorkAt: earlier(cur.oldestWorkAt, t.oldestWorkAt),
    problemFamily: cur.problemFamily ?? t.problemFamily,
    signalIds: [...new Set([...(cur.signalIds ?? []), ...(t.signalIds ?? [])])],
    sharedByCasey: !!(cur.sharedByCasey || t.sharedByCasey),
    workSourceRequested: !!(cur.workSourceRequested || t.workSourceRequested),
  });
}

export interface SelectDeps {
  loadGroups?: typeof loadThesisGroups;
  listQueue?: typeof listAllCurrent;
  /** The watched priority universe (default: signals/watch.ts loadWatchProfiles). */
  watch?: (prisma: PrismaLike) => Promise<Array<{ accountName: string }>>;
}

export async function selectBackgroundTargets(prisma: PrismaLike, now: Date, deps: SelectDeps = {}): Promise<BackgroundTarget[]> {
  const byAccount = new Map<string, BackgroundTarget>();
  const base = (accountName: string, reason: TargetReason): BackgroundTarget => ({ accountName, reason, peopleBlocked: 0, triggerAt: null, triggerTitle: null, expiresAt: null, tier: null, oldestWorkAt: null, problemFamily: null });

  // 1. Research work: theses the evidence gate rates not ready, and research cards whose missing piece is evidence.
  const groups = await (deps.loadGroups ?? loadThesisGroups)(prisma, {}, { singletons: true, now });
  for (const g of splitThesisWork(groups).researchGroups) {
    const blocked = g.members.filter((m) => m.next === 'find_evidence' || m.next === 'revise');
    // Thesis rows carry no creation time here; the research cards below supply the oldest-work tiebreak.
    merge(byAccount, { ...base(g.accountName, 'research_work'), peopleBlocked: blocked.length, problemFamily: g.members[0]?.problem_family ?? null });
  }
  const queue = await (deps.listQueue ?? listAllCurrent)(prisma);
  const cardsByAccount = new Map<string, { n: number; oldest: string }>();
  for (const item of queue.items) {
    if (sellerLaneOf(item) !== 'research' || !RESEARCHABLE_RULES.has(item.ruleId)) continue;
    const cur = cardsByAccount.get(item.account.name);
    const created = new Date(item.createdAt).toISOString();
    cardsByAccount.set(item.account.name, { n: (cur?.n ?? 0) + 1, oldest: cur && cur.oldest < created ? cur.oldest : created });
  }
  for (const [accountName, c] of cardsByAccount) merge(byAccount, { ...base(accountName, 'research_work'), peopleBlocked: c.n, oldestWorkAt: c.oldest });

  // 2. Fresh Pounce triggers on accounts modex actually has (vendor and competitor noise has no account).
  const triggers: Array<{ account_name: string; title: string; first_seen_at: Date; published_at: Date | null }> = await prisma.pounceTrigger.findMany({
    where: { dismissed: false, first_seen_at: { gte: new Date(now.getTime() - TRIGGER_FRESH_MS) } },
    orderBy: [{ first_seen_at: 'desc' }, { id: 'desc' }],
    take: 200,
    select: { account_name: true, title: true, first_seen_at: true, published_at: true },
  });
  for (const t of triggers) {
    const account = await prisma.account.findFirst({ where: { name: { equals: t.account_name, mode: 'insensitive' } }, select: { name: true } });
    if (!account) continue;
    merge(byAccount, { ...base(account.name, 'fresh_trigger'), triggerAt: new Date(t.published_at ?? t.first_seen_at).toISOString(), triggerTitle: t.title });
  }

  // 2b. Signals queued for research (Casey-shared first; strong discovered ones). Resolved + a link only.
  const queued: Array<{ id: string; account_name: string; origin: string; title: string | null; created_at: Date; published_at: Date | null }> = prisma.gapSignal?.findMany
    ? await prisma.gapSignal.findMany({
        where: { research_status: 'queued', resolution: 'resolved', account_name: { not: null }, url: { not: null }, OR: [{ feedback: null }, { feedback: { in: ['use', 'good_context'] } }] },
        select: { id: true, account_name: true, origin: true, title: true, created_at: true, published_at: true },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: 300,
      })
    : [];
  for (const q of queued) {
    merge(byAccount, {
      ...base(q.account_name, q.origin === 'casey_share' || q.origin === 'conference_note' ? 'shared_signal' : 'discovered_signal'),
      triggerAt: new Date(q.published_at ?? q.created_at).toISOString(),
      triggerTitle: q.title,
      signalIds: [q.id],
      sharedByCasey: q.origin === 'casey_share' || q.origin === 'conference_note',
    });
  }

  // 2c. Accounts a work source brought in that the cohort planner marked `research` (a WATCH source never spends
  // research). People waiting at the account order them; Casey's explicit RESEARCH MORE is followed up like a share.
  // Casey's explicit RESEARCH MORE is honored for any member of any active source (even with evidence already,
  // even in a WATCH source), except at an open deal or for someone who must not be contacted.
  const hasMembers = !!prisma.gapWorkSourceMember?.findMany;
  const wsMembers: Array<{ account_name: string | null; status: string; kind: string }> = hasMembers
    ? await prisma.gapWorkSourceMember.findMany({
        where: { qualification: 'research', status: 'active', account_name: { not: null }, work_source: { status: 'active', intent: { not: 'watch' } } },
        select: { account_name: true, status: true, kind: true },
        take: 5_000,
      })
    : [];
  const requested: Array<{ account_name: string | null; status: string; kind: string }> = hasMembers
    ? await prisma.gapWorkSourceMember.findMany({
        where: { status: 'research_requested', qualification: { notIn: ['in_deal', 'do_not_contact'] }, account_name: { not: null }, work_source: { status: 'active' } },
        select: { account_name: true, status: true, kind: true },
        take: 1_000,
      })
    : [];
  const wsByAccount = new Map<string, { people: number; requested: boolean }>();
  for (const w of [...wsMembers, ...requested]) {
    if (!w.account_name) continue;
    const cur = wsByAccount.get(w.account_name) ?? { people: 0, requested: false };
    wsByAccount.set(w.account_name, { people: cur.people + (w.kind === 'person' ? 1 : 0), requested: cur.requested || w.status === 'research_requested' });
  }
  for (const [accountName, w] of wsByAccount) {
    merge(byAccount, { ...base(accountName, w.requested ? 'requested_research' : 'work_source'), peopleBlocked: w.people, sharedByCasey: w.requested, workSourceRequested: w.requested });
  }

  // 3. Outreach facts on approved / in-use hypotheses nearing expiry.
  const expiring: Array<{ account_name: string; problem_family: string; signals: Array<{ signal: { freshness_expires_at: Date | null } | null }> }> = await prisma.prospectingHypothesis.findMany({
    where: { status: { in: ['approved', 'active'] } },
    select: { account_name: true, problem_family: true, signals: { where: { role: 'primary' }, select: { signal: { select: { freshness_expires_at: true } } } } },
    take: 500,
  });
  for (const h of expiring) {
    const exp = h.signals.map((s) => s.signal?.freshness_expires_at).filter((d): d is Date => !!d).map((d) => new Date(d));
    const soon = exp.find((d) => d.getTime() > now.getTime() && d.getTime() - now.getTime() <= EXPIRY_HORIZON_MS);
    if (soon) merge(byAccount, { ...base(h.account_name, 'expiring_evidence'), expiresAt: soon.toISOString(), problemFamily: h.problem_family });
  }

  // 5. Proactive backlog over the watched priority universe (never researched first, then the oldest).
  const profiles = await (deps.watch ?? loadWatchProfiles)(prisma).catch(() => [] as Array<{ accountName: string }>);
  if (profiles.length) {
    // Open deal, or deal state UNKNOWN on a current card: not proactive research (review D P2).
    const inDeal = new Set([...heldDealAccounts(queue.items), ...queue.items.filter((i) => i.ruleId === 'opportunity_unknown').map((i) => i.account.name)]);
    const watched = profiles.map((p) => p.accountName).filter((n) => !inDeal.has(n));
    const lastRuns: Array<{ account_name: string; _max: { created_at: Date | null } }> = watched.length
      ? await prisma.researchRun.groupBy({ by: ['account_name'], where: { account_name: { in: watched }, run_key: { startsWith: 'gap_research:' } }, _max: { created_at: true } }).catch(() => [])
      : [];
    const lastOf = new Map(lastRuns.map((r) => [r.account_name, r._max.created_at ? new Date(r._max.created_at) : null]));
    for (const name of watched) {
      const last = lastOf.get(name) ?? null;
      if (last && now.getTime() - last.getTime() < BACKLOG_STALE_MS) continue;
      // Only an account with no other research reason gets a backlog entry (it never overwrites a real target's tiebreak).
      if (byAccount.has(name)) continue;
      byAccount.set(name, { ...base(name, 'priority_backlog'), oldestWorkAt: last ? last.toISOString() : '1970-01-01T00:00:00.000Z' });
    }
  }

  // Tier for every candidate (one read).
  const names = [...byAccount.keys()];
  const accounts: Array<{ name: string; tier: string | null }> = names.length ? await prisma.account.findMany({ where: { name: { in: names } }, select: { name: true, tier: true } }) : [];
  for (const a of accounts) byAccount.get(a.name)!.tier = a.tier;
  return [...byAccount.values()].sort(compareTargets);
}

export interface BackgroundRunResult {
  runTag: string;
  considered: number;
  researched: Array<{ accountName: string; reason: TargetReason; runId: string; outcome: ResearchResult['outcome']; facts: number; freshFacts: number; rejected: number; conflicts: number }>;
  skipped: Array<{ accountName: string; reason: string }>;
  failed: Array<{ accountName: string; error: string }>;
}

/** Casey's RESEARCH MORE at this account is served by an attempt (success or failure): back to active. */
async function serveWorkSourceRequest(prisma: PrismaLike, t: BackgroundTarget): Promise<void> {
  if (!t.workSourceRequested || !prisma.gapWorkSourceMember?.updateMany) return;
  await prisma.gapWorkSourceMember.updateMany({ where: { account_name: t.accountName, status: 'research_requested' }, data: { status: 'active' } });
}

/** The newest research run for an account (any GAP research purpose). */
async function lastResearchAt(prisma: PrismaLike, accountName: string): Promise<Date | null> {
  const r = await prisma.researchRun.findFirst({ where: { account_name: accountName, run_key: { startsWith: 'gap_research:' } }, orderBy: { created_at: 'desc' }, select: { created_at: true } });
  return r?.created_at ? new Date(r.created_at) : null;
}

export async function runBackgroundResearch(
  prisma: PrismaLike,
  opts: { now: Date; cap?: number; clock?: () => number; timeBudgetMs?: number },
  deps: ResearchDeps & SelectDeps & { research?: typeof runEvidenceResearch; fetchHtml?: import('../signals/intake').FetchHtml } = {},
): Promise<BackgroundRunResult> {
  const cap = Math.max(1, Math.min(BACKGROUND_MAX_CAP, Math.floor(opts.cap ?? BACKGROUND_DEFAULT_CAP)));
  const clock = opts.clock ?? Date.now;
  const started = clock();
  const budget = opts.timeBudgetMs ?? BACKGROUND_TIME_BUDGET_MS;
  const research = deps.research ?? runEvidenceResearch;
  const runTag = `bg-${opts.now.toISOString()}`;
  const targets = await selectBackgroundTargets(prisma, opts.now, deps);
  const result: BackgroundRunResult = { runTag, considered: targets.length, researched: [], skipped: [], failed: [] };

  for (const t of targets) {
    if (result.researched.length + result.failed.length >= cap) {
      result.skipped.push({ accountName: t.accountName, reason: 'cap_reached' });
      continue;
    }
    if (clock() - started > budget) {
      result.skipped.push({ accountName: t.accountName, reason: 'time_budget' });
      continue;
    }
    const last = await lastResearchAt(prisma, t.accountName);
    const newerTrigger = t.triggerAt && last && new Date(t.triggerAt) > last;
    // A story CASEY shared is followed up despite the account cooldown; discovered stories respect it
    // (unless published after the last research, like any newer trigger).
    const followUp = (t.signalIds ?? []).length > 0;
    if (last && opts.now.getTime() - last.getTime() < BACKGROUND_COOLDOWN_MS && !newerTrigger && !t.sharedByCasey) {
      result.skipped.push({ accountName: t.accountName, reason: `researched_recently:${last.toISOString()}` });
      continue;
    }
    const signals: ResearchableSignal[] = followUp
      ? await prisma.gapSignal.findMany({ where: { id: { in: t.signalIds }, research_status: 'queued' }, select: { id: true, url: true, title: true, published_at: true, source_class: true, resolution_basis: true, event_id: true, metadata: true } })
      : [];
    if (signals.length) await prisma.gapSignal.updateMany({ where: { id: { in: signals.map((x) => x.id) }, research_status: 'queued', account_name: t.accountName }, data: { research_status: 'researching' } });
    try {
      const r = await research(
        prisma,
        {
          accountName: t.accountName,
          personaId: null,
          hypothesisId: null,
          problemFamily: t.problemFamily,
          decisionId: null,
          actor: BACKGROUND_ACTOR,
          now: opts.now,
          focus: signals.length ? signalFocus(signals) : t.triggerTitle ? `Recent news to check: "${t.triggerTitle}".` : undefined,
          context: { purpose: BACKGROUND_PURPOSE, backgroundRunTag: runTag, targetReason: t.reason, triggerTitle: t.triggerTitle, peopleBlocked: t.peopleBlocked },
        },
        signals.length ? { ...deps, extra: () => signalCandidates(signals, { fetchHtml: deps.fetchHtml, accountName: t.accountName }) } : deps,
      );
      if (signals.length) await settleSignals(prisma, { signals, accountName: t.accountName, result: r, now: opts.now });
      if (r.outcome !== 'provider_unavailable') await serveWorkSourceRequest(prisma, t);
      result.researched.push({
        accountName: t.accountName,
        reason: t.reason,
        runId: r.runId,
        outcome: r.outcome,
        facts: r.facts.length,
        freshFacts: r.facts.filter((f) => f.fresh).length,
        rejected: r.rejected.length,
        conflicts: r.conflicts.length,
      });
    } catch (e) {
      const error = (e instanceof Error ? e.message : String(e)).slice(0, 200);
      result.failed.push({ accountName: t.accountName, error });
      // A failed attempt still serves the request (Casey can ask again); never an hourly retry forever.
      await serveWorkSourceRequest(prisma, t).catch(() => undefined);
      // A signal never sticks in "researching": back to the queue, or settled no_usable_fact after repeated failures.
      for (const sg of signals) {
        const meta = ((sg as { metadata?: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>;
        const attempts = Number(meta.researchAttempts ?? 0) + 1;
        await prisma.gapSignal
          .update({ where: { id: sg.id }, data: { research_status: attempts >= SIGNAL_RESEARCH_MAX_ATTEMPTS ? 'no_usable_fact' : 'queued', metadata: { ...meta, researchAttempts: attempts, researchError: error } } })
          .catch(() => undefined);
      }
    }
  }

  await prisma.gapAuditEvent
    .create({ data: { kind: BACKGROUND_AUDIT, actor: BACKGROUND_ACTOR, subject_type: 'background_research', subject_id: runTag, payload: JSON.parse(JSON.stringify(result)) } })
    .catch(() => undefined);
  return result;
}
