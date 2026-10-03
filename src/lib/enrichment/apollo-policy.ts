/**
 * APOLLO CREDIT POLICY (Casey, 2026-10-03): zero autonomous spend. Casey controls Apollo credits.
 *
 *   automation  crons, agents, dogfood, golden-account runs: refused unless Casey sets APOLLO_AUTOMATED_CREDIT_BUDGET
 *               (default 0). A run that is refused calls nothing and says why.
 *   human       an action Casey initiates (a click that says "enrich"): allowed.
 *   tests       never: under the test runner every live call is refused, whoever the initiator, so a test that forgets
 *               to mock the network still spends nothing.
 *
 * Every credit-capable Apollo call (people search, the enrichment built on it) takes an initiator and asks here first.
 * Reading Casey's own saved Apollo lists (labels, saved contacts and accounts) costs no credits and is not gated.
 */
export type ApolloInitiator = { kind: 'human'; actor: string } | { kind: 'automation'; job: string };

type Env = Record<string, string | undefined>;

/** The credit budget Casey set for automation (0 unless set to a positive whole number). */
export function automatedApolloCreditBudget(env: Env = process.env): number {
  const n = Number(env.APOLLO_AUTOMATED_CREDIT_BUDGET ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function apolloLiveDecision(initiator: ApolloInitiator, env: Env = process.env): { allowed: boolean; reason: string } {
  if (env.VITEST || env.NODE_ENV === 'test') return { allowed: false, reason: 'Tests never call Apollo: no credits are spent in tests.' };
  if (initiator.kind === 'human') return { allowed: true, reason: `Initiated by ${initiator.actor}.` };
  const budget = automatedApolloCreditBudget(env);
  if (budget <= 0) return { allowed: false, reason: `Automated Apollo credit budget is 0: Casey controls Apollo spend, so ${initiator.job} did not call Apollo.` };
  return { allowed: true, reason: `Automation inside the ${budget}-credit budget Casey set.` };
}
