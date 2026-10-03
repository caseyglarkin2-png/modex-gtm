/**
 * APOLLO CREDIT POLICY (Casey, 2026-10-03): zero autonomous spend. Casey controls Apollo credits.
 *
 *   automation  crons, agents, dogfood, golden-account runs: refused unless Casey sets APOLLO_AUTOMATED_CREDITS_PER_RUN
 *               (default 0), and then capped at that many per run. A refused run calls nothing and says why.
 *   human       an action a signed-in person starts (a click that says "enrich"): allowed; the actor is that session.
 *   tests       never: under the test runner every live call is refused, whoever asks and whatever env a caller
 *               injects, unless fetch itself is a test mock (then nothing can reach the network anyway).
 *
 * Every credit-capable Apollo call (people search, the enrichment built on it) takes an initiator and asks here first.
 * Reading Casey's own saved Apollo lists (labels, saved contacts and accounts) costs no credits and is not gated.
 */
export type ApolloInitiator = { kind: 'human'; actor: string } | { kind: 'automation'; job: string };

type Env = Record<string, string | undefined>;

/** How many credits Casey lets automation spend in ONE run (0 unless set to a positive whole number). */
export function automatedApolloCreditsPerRun(env: Env = process.env): number {
  const n = Number(env.APOLLO_AUTOMATED_CREDITS_PER_RUN ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

const underTestRunner = (env: Env) => !!(process.env.VITEST || process.env.NODE_ENV === 'test' || env.VITEST || env.NODE_ENV === 'test');
/** A vitest mock (vi.fn / vi.spyOn) carries `.mock`: with it, no call can leave the process. */
const fetchIsMocked = () => typeof (globalThis.fetch as unknown as { mock?: unknown } | undefined)?.mock === 'object';

export function apolloLiveDecision(initiator: ApolloInitiator, env: Env = process.env): { allowed: boolean; reason: string } {
  // Under the test runner: refused unless a test injected its own env AND fetch is a mock (review SF5).
  if (underTestRunner(env) && (env === process.env || env.VITEST || env.NODE_ENV === 'test' || !fetchIsMocked())) return { allowed: false, reason: 'Tests never call Apollo: no credits are spent in tests.' };
  if (initiator.kind === 'human') return { allowed: true, reason: `Initiated by ${initiator.actor}.` };
  const cap = automatedApolloCreditsPerRun(env);
  if (cap <= 0) return { allowed: false, reason: `Automated Apollo credits per run is 0: Casey controls Apollo spend, so ${initiator.job} did not call Apollo.` };
  return { allowed: true, reason: `Automation inside the ${cap}-credit per-run cap Casey set.` };
}
