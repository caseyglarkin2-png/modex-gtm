/**
 * PURSUIT SUMMARY (account-first UX, UX-08 parity; execution recovery R10/R15, 2026-10-06): the one canonical
 * pursuit state per account, as the ACTIONABLE RESULT every surface renders (pursuit/actionable.ts), remembered in
 * two layers so the Work card says what the workspace says, on any instance:
 *
 *   process memory   the instance's own last read (fast; empty on a cold start)
 *   system_config    one row per account (`gap:pursuit:<account>`, the existing key/value table in-deals.ts already
 *                    uses), written through by the workspace render and the warmer, read on a miss. A durable,
 *                    shared projection of the one read; its source is the account page's own pursuit read, its
 *                    rebuild is any visit or the warmer, its owner is this module.
 *
 * A summary is DISPLAY state with a timestamp: Work uses it within PURSUIT_SUMMARY_TTL_MS; the account shell may
 * show an older one labeled with its age; no send, draft or enroll path reads it (every gate re-runs at the click).
 * `forgetPursuitSummary` drops both layers after a write that changes the account (an outcome, a decision, a
 * choice), so a stale READY never outlives the change on the next load.
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { loadPursuit } from './load';
import { nextFromPursuit } from './next';
import { actionableFromPursuit, type ActionableResult } from './actionable';
import { accountHref } from '../account-intel/href';
import type { PursuitState } from './state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const PURSUIT_SUMMARY_TTL_MS = 15 * 60_000;
/** The shell may show a last-known state this old, labeled with its age; Work never ranks by one older than the TTL. */
export const PURSUIT_SUMMARY_SHELL_MAX_MS = 24 * 60 * 60_000;
export const WARM_PER_REQUEST = 3;
/** Warming hits HubSpot: never more often than this per instance (a burst of Work loads must not throttle the reads). */
export const WARM_MIN_INTERVAL_MS = 60_000;
let lastWarmAt = 0;
export const WARM_TIMEOUT_MS = 70_000;
export const SUMMARY_KEY_PREFIX = 'gap:pursuit:';

export interface PursuitSummary {
  accountName: string;
  state: PursuitState['state'];
  stateLine: string;
  person: { name: string; title: string | null } | null;
  blocker: string | null;
  coldTouchAllowed: boolean;
  /** NEXT as the workspace says it (the card's why now), when known. */
  nextText: string | null;
  /** R10: the actionable result the workspace rendered (intent, the one allowed action, preparation, completion). */
  actionable?: Pick<ActionableResult, 'intent' | 'allowed' | 'preparation' | 'completion' | 'hypothesisId'> | null;
  /** When this read happened (ISO). */
  at: string;
}

const cache = new Map<string, PursuitSummary>();
const keyOf = (accountName: string) => `${SUMMARY_KEY_PREFIX}${accountName}`;

function persist(prisma: PrismaLike | undefined, s: PursuitSummary): void {
  if (!prisma || typeof prisma.systemConfig?.upsert !== 'function') return;
  const value = JSON.stringify(s);
  void Promise.resolve(prisma.systemConfig.upsert({ where: { key: keyOf(s.accountName) }, create: { key: keyOf(s.accountName), value }, update: { value } })).catch(() => undefined);
}

export function rememberPursuitSummary(s: PursuitState, now: Date = new Date(), nextText: string | null = null, opts: { prisma?: PrismaLike; actionable?: ActionableResult | null } = {}): PursuitSummary {
  const a = opts.actionable ?? null;
  const out: PursuitSummary = {
    accountName: s.accountName,
    state: s.state,
    stateLine: s.stateLine,
    person: s.person ? { name: s.person.name, title: s.person.title } : null,
    blocker: s.blocker,
    coldTouchAllowed: s.coldTouchAllowed,
    nextText: nextText ?? a?.recommendation ?? null,
    actionable: a ? { intent: a.intent, allowed: a.allowed, preparation: a.preparation, completion: a.completion, hypothesisId: a.hypothesisId } : null,
    at: now.toISOString(),
  };
  cache.set(s.accountName, out);
  persist(opts.prisma, out);
  return out;
}

const ageOk = (s: PursuitSummary, now: Date, maxAgeMs: number) => {
  const age = now.getTime() - new Date(s.at).getTime();
  return age >= 0 && age <= maxAgeMs;
};

/** The fresh summaries for these accounts from THIS instance's memory (older than the TTL read as absent). */
export function readPursuitSummaries(accountNames: readonly string[], now: Date = new Date(), maxAgeMs = PURSUIT_SUMMARY_TTL_MS): Map<string, PursuitSummary> {
  const out = new Map<string, PursuitSummary>();
  for (const name of accountNames) {
    const s = cache.get(name);
    if (!s) continue;
    if (!ageOk(s, now, maxAgeMs)) {
      cache.delete(name);
      continue;
    }
    out.set(name, s);
  }
  return out;
}

/**
 * The summaries from memory, then from the durable rows for the rest (one read), each no older than `maxAgeMs`. A
 * row read from the database is remembered in memory too. An unreadable store is a miss, never an error.
 */
export async function loadPursuitSummaries(prisma: PrismaLike, accountNames: readonly string[], now: Date = new Date(), maxAgeMs = PURSUIT_SUMMARY_TTL_MS): Promise<Map<string, PursuitSummary>> {
  const out = readPursuitSummaries(accountNames, now, maxAgeMs);
  const missing = accountNames.filter((n) => !out.has(n));
  if (missing.length === 0 || typeof prisma?.systemConfig?.findMany !== 'function') return out;
  try {
    const rows: Array<{ key: string; value: string }> = await prisma.systemConfig.findMany({ where: { key: { in: missing.map(keyOf) } }, select: { key: true, value: true } });
    for (const r of rows) {
      let s: PursuitSummary | null = null;
      try {
        s = JSON.parse(r.value) as PursuitSummary;
      } catch {
        s = null;
      }
      if (!s || typeof s.accountName !== 'string' || typeof s.at !== 'string' || !ageOk(s, now, maxAgeMs)) continue;
      out.set(s.accountName, s);
      // Memory keeps the row only while it is within the Work TTL; an older row serves the shell on request.
      if (ageOk(s, now, PURSUIT_SUMMARY_TTL_MS)) cache.set(s.accountName, s);
    }
  } catch {
    /* an unreadable store is a miss */
  }
  return out;
}

/** Drop both layers for an account after a write that changed it (an outcome, a decision, a choice). */
export async function forgetPursuitSummary(prisma: PrismaLike | undefined, accountName: string): Promise<void> {
  cache.delete(accountName);
  if (!prisma || typeof prisma.systemConfig?.deleteMany !== 'function') return;
  try {
    await prisma.systemConfig.deleteMany({ where: { key: keyOf(accountName) } });
  } catch {
    /* the row ages out */
  }
}

/** Test seam. */
export function clearPursuitSummaries(): void {
  cache.clear();
}

/** The full read for one account, remembered; null when it fails or times out (then nothing is claimed). */
export async function summarizePursuit(prisma: PrismaLike, accountName: string, now: Date = new Date(), timeoutMs = WARM_TIMEOUT_MS): Promise<PursuitSummary | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const read = (async () => {
    const inputs = await loadAccountInputs(prisma, accountName, now, { live: true });
    if (!inputs) return null;
    const brief = buildAccountBrief(inputs, now);
    const ctx = await loadAccountContext(prisma, inputs, now);
    const p = await loadPursuit(prisma, { brief, inputs, ctx, now });
    const href = accountHref(accountName);
    const next = nextFromPursuit(p.state, { hypothesisId: p.hypothesisId, accountSlugHref: (view) => `${href}?view=${view}`, replyThreadHref: null, captureHref: `/gap/capture?account=${encodeURIComponent(accountName)}` });
    const pending = inputs.hypotheses.filter((h) => h.status === 'draft' || h.status === 'review_required');
    const actionable = actionableFromPursuit(p.state, next, { hypothesisId: p.hypothesisId, usableTheses: p.usableTheses, pendingProposals: pending.length, incompleteProposals: pending.filter((h) => !h.problemFamily || h.problemFamily === 'unmapped').length });
    return rememberPursuitSummary(p.state, now, next.text, { prisma, actionable });
  })();
  const cap = new Promise<null>((r) => {
    timer = setTimeout(() => r(null), timeoutMs);
  });
  return Promise.race([read, cap])
    .catch(() => null)
    .finally(() => {
      if (timer) clearTimeout(timer);
    });
}

/** Warm the first few accounts that have no fresh summary anywhere, one after another (never in parallel: one heavy read at a time). */
export async function warmPursuitSummaries(prisma: PrismaLike, accountNames: readonly string[], now: Date = new Date(), limit = WARM_PER_REQUEST): Promise<string[]> {
  if (now.getTime() - lastWarmAt < WARM_MIN_INTERVAL_MS) return [];
  lastWarmAt = now.getTime();
  const fresh = await loadPursuitSummaries(prisma, accountNames, now);
  const todo = accountNames.filter((n) => !fresh.has(n)).slice(0, limit);
  const done: string[] = [];
  for (const name of todo) {
    const s = await summarizePursuit(prisma, name, now);
    if (s) done.push(name);
  }
  return done;
}
