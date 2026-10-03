/**
 * APOLLO CREDIT POLICY (Casey, 2026-10-03): zero autonomous spend. Casey controls Apollo credits.
 *   - automation (crons, agents, dogfood) gets a credit budget of 0 unless Casey sets APOLLO_AUTOMATED_CREDIT_BUDGET
 *   - a human-initiated action (Casey clicks "enrich") may call Apollo
 *   - tests never call Apollo, whoever the initiator, even if a test forgets to mock fetch
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apolloLiveDecision, automatedApolloCreditBudget } from '@/lib/enrichment/apollo-policy';

describe('apolloLiveDecision', () => {
  it('automation is refused by default: the budget is 0', () => {
    expect(automatedApolloCreditBudget({})).toBe(0);
    expect(automatedApolloCreditBudget({ APOLLO_AUTOMATED_CREDIT_BUDGET: 'lots' })).toBe(0);
    expect(automatedApolloCreditBudget({ APOLLO_AUTOMATED_CREDIT_BUDGET: '-5' })).toBe(0);
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, {})).toEqual({ allowed: false, reason: 'Automated Apollo credit budget is 0: Casey controls Apollo spend, so reenrich-contacts did not call Apollo.' });
  });
  it('automation runs only inside a budget Casey set', () => {
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, { APOLLO_AUTOMATED_CREDIT_BUDGET: '25' })).toEqual({ allowed: true, reason: 'Automation inside the 25-credit budget Casey set.' });
  });
  it('a human-initiated action may call Apollo', () => {
    expect(apolloLiveDecision({ kind: 'human', actor: 'Casey (contacts: enrich selected)' }, {})).toEqual({ allowed: true, reason: 'Initiated by Casey (contacts: enrich selected).' });
  });
  it('tests never call Apollo, whoever asks', () => {
    for (const env of [{ VITEST: 'true' }, { NODE_ENV: 'test' }]) {
      expect(apolloLiveDecision({ kind: 'human', actor: 'Casey' }, env).allowed).toBe(false);
      expect(apolloLiveDecision({ kind: 'automation', job: 'x' }, { ...env, APOLLO_AUTOMATED_CREDIT_BUDGET: '99' }).allowed).toBe(false);
    }
  });
});

describe('the live call paths obey the policy', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('APOLLO_API_KEY', 'test-key-not-real');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('people search under the test runner never reaches the network, even when a human asked', async () => {
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');
    expect(await searchApolloPeople('logistics', { kind: 'human', actor: 'Casey' })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('people search by automation never reaches the network with the default budget', async () => {
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');
    expect(await searchApolloPeople('logistics', { kind: 'automation', job: 'dogfood' }, {})).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('a human outside the test runner reaches Apollo (the explicit path stays usable)', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ people: [], pagination: { page: 1, per_page: 25, total_entries: 0, total_pages: 0 } }), { status: 200 }));
    const { searchApolloPeople } = await import('@/lib/enrichment/apollo-client');
    await searchApolloPeople('logistics', { kind: 'human', actor: 'Casey' }, {});
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('enrichment and the re-enrich cron', () => {
  afterEach(() => { vi.resetModules(); vi.doUnmock('@/lib/prisma'); vi.doUnmock('@/lib/cron-monitor'); vi.doUnmock('@/lib/enrichment/apollo-enrichment'); vi.doUnmock('@/lib/enrichment/apollo-client'); });

  it('an automated enrichment is refused before any lookup or write', async () => {
    const findFirst = vi.fn();
    vi.doMock('@/lib/prisma', () => ({ prisma: { persona: { findFirst }, contactEnrichment: { upsert: vi.fn() } } }));
    const { enrichPersonaFromHubSpotContact } = await import('@/lib/enrichment/apollo-enrichment');
    const r = await enrichPersonaFromHubSpotContact({ id: 'hs-1', email: 'a@b.com' } as never, { kind: 'automation', job: 'golden-account dogfood' }, {});
    expect(r).toEqual({ status: 'blocked', reason: 'Automated Apollo credit budget is 0: Casey controls Apollo spend, so golden-account dogfood did not call Apollo.' });
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('the re-enrich cron skips with the reason and never enriches, even with Apollo configured', async () => {
    const enrich = vi.fn();
    const skipped = vi.fn().mockResolvedValue(undefined);
    vi.doMock('@/lib/prisma', () => ({ prisma: {} }));
    vi.doMock('@/lib/cron-monitor', () => ({ markCronStarted: vi.fn().mockResolvedValue(undefined), markCronSkipped: skipped, markCronSuccess: vi.fn(), markCronFailure: vi.fn() }));
    vi.doMock('@/lib/enrichment/apollo-client', () => ({ isApolloConfigured: () => true }));
    vi.doMock('@/lib/enrichment/apollo-enrichment', () => ({ enrichPersonaFromHubSpotContact: enrich }));
    const { runReenrichContactsCron } = await import('@/lib/cron/reenrich-contacts');
    const r = await runReenrichContactsCron();
    expect(r).toEqual({ status: 'skipped', reason: 'Tests never call Apollo: no credits are spent in tests.' });
    expect(enrich).not.toHaveBeenCalled();
    expect(skipped.mock.calls[0][1]).toMatchObject({ reason: 'Tests never call Apollo: no credits are spent in tests.' });
  });
});
