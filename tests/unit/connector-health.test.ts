import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/enrichment/apollo-client', () => ({
  isApolloConfigured: vi.fn(() => true),
}));

vi.mock('@/lib/hubspot/client', () => ({
  isHubSpotConfigured: vi.fn(() => false),
}));

vi.mock('@/lib/feature-flags', () => ({
  HUBSPOT_SYNC_ENABLED: false,
}));

describe('connector runtime statuses', () => {
  it('returns connector health metadata with ownership fields', async () => {
    const { getConnectorRuntimeStatuses } = await import('@/lib/revops/connector-health');
    const rows = getConnectorRuntimeStatuses();
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      key: 'apollo',
      configured: true,
      enabled: true,
    });
    expect(rows[1]).toMatchObject({
      key: 'hubspot',
      configured: false,
      enabled: false,
    });
    for (const row of rows) {
      expect(row.owner.length).toBeGreaterThan(0);
      expect(row.escalationChannel.length).toBeGreaterThan(0);
      expect(row.runbookLink.length).toBeGreaterThan(0);
      expect(row.lastRotationDate.length).toBeGreaterThan(0);
    }
  });
});
