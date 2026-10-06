/**
 * PURSUIT SUMMARY (account-first UX, UX-08 parity): the one canonical pursuit state, remembered per account in this
 * server instance's memory for a short while, so the Work card can say what the workspace says (FedEx read
 * "Research" on its card while NOW said "Ready for a first touch: Glen Chaffee").
 *
 * Nothing is written anywhere: the cache is process memory (Fluid compute reuses instances; a cold start is empty
 * and the Work list falls back to the cockpit's lanes, saying so). The workspace fills it when it renders; the Work
 * page warms a few accounts after its response is sent (`after()`), bounded, serial, never blocking a render.
 */
import { loadAccountInputs } from '../account-intel/load';
import { buildAccountBrief } from '../account-intel/build';
import { loadAccountContext } from '../context/load';
import { loadPursuit } from './load';
import type { PursuitState } from './state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const PURSUIT_SUMMARY_TTL_MS = 15 * 60_000;
export const WARM_PER_REQUEST = 3;
export const WARM_TIMEOUT_MS = 40_000;

export interface PursuitSummary {
  accountName: string;
  state: PursuitState['state'];
  stateLine: string;
  person: { name: string; title: string | null } | null;
  blocker: string | null;
  coldTouchAllowed: boolean;
  /** When this read happened (ISO). */
  at: string;
}

const cache = new Map<string, PursuitSummary>();

export function rememberPursuitSummary(s: PursuitState, now: Date = new Date()): PursuitSummary {
  const out: PursuitSummary = {
    accountName: s.accountName,
    state: s.state,
    stateLine: s.stateLine,
    person: s.person ? { name: s.person.name, title: s.person.title } : null,
    blocker: s.blocker,
    coldTouchAllowed: s.coldTouchAllowed,
    at: now.toISOString(),
  };
  cache.set(s.accountName, out);
  return out;
}

/** The fresh summaries for these accounts (older than the TTL read as absent). */
export function readPursuitSummaries(accountNames: readonly string[], now: Date = new Date()): Map<string, PursuitSummary> {
  const out = new Map<string, PursuitSummary>();
  for (const name of accountNames) {
    const s = cache.get(name);
    if (!s) continue;
    if (now.getTime() - new Date(s.at).getTime() > PURSUIT_SUMMARY_TTL_MS) {
      cache.delete(name);
      continue;
    }
    out.set(name, s);
  }
  return out;
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
    return rememberPursuitSummary(p.state, now);
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

/** Warm the first few accounts that have no fresh summary, one after another (never in parallel: one heavy read at a time). */
export async function warmPursuitSummaries(prisma: PrismaLike, accountNames: readonly string[], now: Date = new Date(), limit = WARM_PER_REQUEST): Promise<string[]> {
  const fresh = readPursuitSummaries(accountNames, now);
  const todo = accountNames.filter((n) => !fresh.has(n)).slice(0, limit);
  const done: string[] = [];
  for (const name of todo) {
    const s = await summarizePursuit(prisma, name, now);
    if (s) done.push(name);
  }
  return done;
}
