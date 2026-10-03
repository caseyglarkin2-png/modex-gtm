/**
 * APOLLO CREDIT POLICY (Casey, 2026-10-03): zero autonomous spend. Casey controls Apollo credits.
 *   - automation (crons, agents, dogfood) gets a credit budget of 0 unless Casey sets APOLLO_AUTOMATED_CREDITS_PER_RUN
 *   - a human-initiated action (Casey clicks "enrich") may call Apollo
 *   - tests never call Apollo, whoever the initiator, even if a test forgets to mock fetch
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apolloLiveDecision, automatedApolloCreditsPerRun } from '@/lib/enrichment/apollo-policy';

describe('apolloLiveDecision', () => {
  // A mocked fetch: the decisions below are the policy's own, not the test-runner refusal.
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => vi.unstubAllGlobals());
  it('automation is refused by default: the budget is 0', () => {
    expect(automatedApolloCreditsPerRun({})).toBe(0);
    expect(automatedApolloCreditsPerRun({ APOLLO_AUTOMATED_CREDITS_PER_RUN: 'lots' })).toBe(0);
    expect(automatedApolloCreditsPerRun({ APOLLO_AUTOMATED_CREDITS_PER_RUN: '-5' })).toBe(0);
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, {})).toEqual({ allowed: false, reason: 'Automated Apollo credits per run is 0: Casey controls Apollo spend, so reenrich-contacts did not call Apollo.' });
  });
  it('automation runs only inside a budget Casey set', () => {
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, { APOLLO_AUTOMATED_CREDITS_PER_RUN: '25' })).toEqual({ allowed: true, reason: 'Automation inside the 25-credit per-run cap Casey set.' });
  });
  it('a human-initiated action may call Apollo', () => {
    expect(apolloLiveDecision({ kind: 'human', actor: 'Casey (contacts: enrich selected)' }, {})).toEqual({ allowed: true, reason: 'Initiated by Casey (contacts: enrich selected).' });
  });
  it('tests never call Apollo, whoever asks', () => {
    for (const env of [{ VITEST: 'true' }, { NODE_ENV: 'test' }]) {
      expect(apolloLiveDecision({ kind: 'human', actor: 'Casey' }, env).allowed).toBe(false);
      expect(apolloLiveDecision({ kind: 'automation', job: 'x' }, { ...env, APOLLO_AUTOMATED_CREDITS_PER_RUN: '99' }).allowed).toBe(false);
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
    vi.stubGlobal('fetch', vi.fn());
    const findFirst = vi.fn();
    vi.doMock('@/lib/prisma', () => ({ prisma: { persona: { findFirst }, contactEnrichment: { upsert: vi.fn() } } }));
    const { enrichPersonaFromHubSpotContact } = await import('@/lib/enrichment/apollo-enrichment');
    const r = await enrichPersonaFromHubSpotContact({ id: 'hs-1', email: 'a@b.com' } as never, { kind: 'automation', job: 'golden-account dogfood' }, {});
    expect(r).toEqual({ status: 'blocked', reason: 'Automated Apollo credits per run is 0: Casey controls Apollo spend, so golden-account dogfood did not call Apollo.' });
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
  }, 20_000);
});

describe('review follow-ups (SF2, SF5, SF6)', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); vi.doUnmock('@/lib/prisma'); });

  it('SF5: under the test runner an injected non-test env cannot bypass the refusal unless fetch is a test mock', () => {
    vi.stubGlobal('fetch', (() => Promise.resolve(new Response('{}'))) as never);
    expect(apolloLiveDecision({ kind: 'human', actor: 'Casey' }, {})).toEqual({ allowed: false, reason: 'Tests never call Apollo: no credits are spent in tests.' });
    vi.stubGlobal('fetch', vi.fn());
    expect(apolloLiveDecision({ kind: 'human', actor: 'Casey' }, {}).allowed).toBe(true);
  });
  it('SF6: the automation number is a per-run cap, said as such', () => {
    vi.stubGlobal('fetch', vi.fn());
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, { APOLLO_AUTOMATED_CREDITS_PER_RUN: '25' })).toEqual({ allowed: true, reason: 'Automation inside the 25-credit per-run cap Casey set.' });
    expect(apolloLiveDecision({ kind: 'automation', job: 'reenrich-contacts' }, {})).toEqual({ allowed: false, reason: 'Automated Apollo credits per run is 0: Casey controls Apollo spend, so reenrich-contacts did not call Apollo.' });
  });
  it('SF2: a person Apollo already enriched is not searched again unless the click forces it', async () => {
    const search = vi.fn();
    vi.doMock('@/lib/enrichment/apollo-client', () => ({ searchApolloPeople: search }));
    vi.doMock('@/lib/prisma', () => ({ prisma: { persona: { findFirst: vi.fn().mockResolvedValue({ id: 5, name: 'Dana Trans', title: 'Director', email: 'd@acme.com', account_name: 'Acme', enrichment: { apollo_person_id: 'ap-1', last_enriched_at: new Date('2026-06-01T00:00:00Z') } }) }, contactEnrichment: { upsert: vi.fn() } } }));
    vi.stubGlobal('fetch', vi.fn());
    const { enrichPersonaFromHubSpotContact } = await import('@/lib/enrichment/apollo-enrichment');
    const r = await enrichPersonaFromHubSpotContact({ id: 'hs-1', email: 'd@acme.com' } as never, { kind: 'human', actor: 'casey@freightroll.com' }, {});
    expect(r).toEqual({ status: 'already_enriched', personaId: 5, at: '2026-06-01T00:00:00.000Z' });
    expect(search).not.toHaveBeenCalled();
    vi.doUnmock('@/lib/enrichment/apollo-client');
  });
});
