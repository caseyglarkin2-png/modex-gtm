import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedListRecentContacts = vi.fn();
const mockedPrisma = {
  systemConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/hubspot/contacts', () => ({
  listRecentContacts: mockedListRecentContacts,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockedPrisma,
}));

describe('hubspot ingestion checkpointing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resumes from saved checkpoint and updates new checkpoint', async () => {
    mockedPrisma.systemConfig.findUnique.mockResolvedValue({ key: 'enrichment_hubspot_contacts_after', value: '150' });
    mockedListRecentContacts.mockResolvedValue({
      contacts: [{ id: '1', email: 'a@example.com' }],
      nextAfter: '200',
    });
    mockedPrisma.systemConfig.upsert.mockResolvedValue({});

    const { ingestHubSpotContactsPage } = await import('@/lib/enrichment/hubspot-ingestion');
    const result = await ingestHubSpotContactsPage(50);

    expect(mockedListRecentContacts).toHaveBeenCalledWith('150', 50);
    expect(mockedPrisma.systemConfig.upsert).toHaveBeenCalledWith({
      where: { key: 'enrichment_hubspot_contacts_after' },
      update: { value: '200' },
      create: { key: 'enrichment_hubspot_contacts_after', value: '200' },
    });
    expect(result.usedAfter).toBe('150');
    expect(result.nextAfter).toBe('200');
  });

  it('starts from null checkpoint and skips upsert when no next cursor', async () => {
    mockedPrisma.systemConfig.findUnique.mockResolvedValue(null);
    mockedListRecentContacts.mockResolvedValue({
      contacts: [{ id: '1', email: 'a@example.com' }],
      nextAfter: undefined,
    });

    const { ingestHubSpotContactsPage } = await import('@/lib/enrichment/hubspot-ingestion');
    const result = await ingestHubSpotContactsPage();

    expect(mockedListRecentContacts).toHaveBeenCalledWith(undefined, 100);
    expect(mockedPrisma.systemConfig.upsert).not.toHaveBeenCalled();
    expect(result.usedAfter).toBeNull();
    expect(result.nextAfter).toBeNull();
  });
});
