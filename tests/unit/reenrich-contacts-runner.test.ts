import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  persona: {
    findMany: vi.fn(),
  },
};

const mockedMarkCronStarted = vi.fn();
const mockedMarkCronSkipped = vi.fn();
const mockedMarkCronSuccess = vi.fn();
const mockedMarkCronFailure = vi.fn();
const mockedIsApolloConfigured = vi.fn();
const mockedGetEnrichmentThresholds = vi.fn();
const mockedGetContactById = vi.fn();
const mockedEnrichPersonaFromHubSpotContact = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/cron-monitor', () => ({
  markCronStarted: mockedMarkCronStarted,
  markCronSkipped: mockedMarkCronSkipped,
  markCronSuccess: mockedMarkCronSuccess,
  markCronFailure: mockedMarkCronFailure,
}));
vi.mock('@/lib/enrichment/apollo-client', () => ({ isApolloConfigured: mockedIsApolloConfigured }));
vi.mock('@/lib/enrichment/config', () => ({ getEnrichmentThresholds: mockedGetEnrichmentThresholds }));
vi.mock('@/lib/hubspot/contacts', () => ({ getContactById: mockedGetContactById }));
vi.mock('@/lib/enrichment/apollo-enrichment', () => ({ enrichPersonaFromHubSpotContact: mockedEnrichPersonaFromHubSpotContact }));

describe('reenrich contacts runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedMarkCronStarted.mockResolvedValue(undefined);
    mockedMarkCronSkipped.mockResolvedValue(undefined);
    mockedMarkCronSuccess.mockResolvedValue(undefined);
    mockedMarkCronFailure.mockResolvedValue(undefined);
    mockedGetEnrichmentThresholds.mockReturnValue({ staleDaysPerson: 30, staleDaysCompany: 45, minConfidenceForOverwrite: 0.8 });
  });

  it('returns skipped when Apollo is not configured', async () => {
    mockedIsApolloConfigured.mockReturnValue(false);

    const { runReenrichContactsCron } = await import('@/lib/cron/reenrich-contacts');
    const result = await runReenrichContactsCron();

    expect(result).toEqual({ status: 'skipped', reason: 'Apollo is not configured' });
    expect(mockedMarkCronSkipped).toHaveBeenCalled();
  });

  it('processes stale contacts and reports stats', async () => {
    mockedIsApolloConfigured.mockReturnValue(true);
    const now = Date.now();
    mockedPrisma.persona.findMany.mockResolvedValue([
      {
        hubspot_contact_id: 'stale-known',
        updated_at: new Date(now),
        enrichment: { last_enriched_at: new Date(now - 35 * 24 * 60 * 60 * 1000) },
        account: { research_status: 'Ready', vertical: 'Manufacturing' },
      },
      {
        hubspot_contact_id: 'fresh-known',
        updated_at: new Date(now),
        enrichment: { last_enriched_at: new Date(now - 5 * 24 * 60 * 60 * 1000) },
        account: { research_status: 'Ready', vertical: 'Manufacturing' },
      },
      {
        hubspot_contact_id: 'stale-newco',
        updated_at: new Date(now),
        enrichment: { last_enriched_at: new Date(now - 20 * 24 * 60 * 60 * 1000) },
        account: { research_status: 'Needs Review', vertical: 'Unknown' },
      },
    ]);
    mockedGetContactById.mockResolvedValue({ id: 'x' });
    mockedEnrichPersonaFromHubSpotContact
      .mockResolvedValueOnce({ status: 'matched' })
      .mockResolvedValueOnce({ status: 'no_match' });

    const { runReenrichContactsCron } = await import('@/lib/cron/reenrich-contacts');
    const result = await runReenrichContactsCron();

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.stats).toEqual({
        considered: 3,
        stale: 2,
        matched: 1,
        noMatch: 1,
        noLocal: 0,
        errors: 0,
      });
    }
    expect(mockedGetContactById).toHaveBeenCalledTimes(2);
    expect(mockedMarkCronSuccess).toHaveBeenCalled();
  });

  it('returns error and records failure telemetry on exception', async () => {
    mockedIsApolloConfigured.mockReturnValue(true);
    mockedPrisma.persona.findMany.mockRejectedValue(new Error('db offline'));

    const { runReenrichContactsCron } = await import('@/lib/cron/reenrich-contacts');
    const result = await runReenrichContactsCron();

    expect(result.status).toBe('error');
    expect(mockedMarkCronFailure).toHaveBeenCalled();
  });
});
