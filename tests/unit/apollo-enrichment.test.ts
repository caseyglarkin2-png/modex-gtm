import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  persona: { findFirst: vi.fn() },
  contactEnrichment: { upsert: vi.fn() },
  contactEnrichmentField: { upsert: vi.fn() },
};
const mockedSearchApolloPeople = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: mockedPrisma }));
vi.mock('@/lib/enrichment/apollo-client', () => ({ searchApolloPeople: mockedSearchApolloPeople }));

describe('apollo enrichment persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores matched enrichment and upserts fields', async () => {
    mockedPrisma.persona.findFirst.mockResolvedValue({
      id: 11,
      name: 'Alex Rivera',
      title: 'VP Operations',
      email: 'alex@example.com',
      account_name: 'Example Co',
    });
    mockedSearchApolloPeople.mockResolvedValue([
      {
        id: 'apollo-1',
        first_name: 'Alex',
        last_name: 'Rivera',
        email: 'alex@example.com',
        title: 'VP Operations',
        organization: { name: 'Example Co', website_url: 'https://example.com', industry: 'Manufacturing' },
      },
    ]);
    mockedPrisma.contactEnrichment.upsert.mockResolvedValue({ id: 22 });
    mockedPrisma.contactEnrichmentField.upsert.mockResolvedValue({});

    const { enrichPersonaFromHubSpotContact } = await import('@/lib/enrichment/apollo-enrichment');
    const result = await enrichPersonaFromHubSpotContact({
      id: 'hs-1',
      email: 'alex@example.com',
      firstname: 'Alex',
      lastname: 'Rivera',
      company: 'Example Co',
      jobtitle: 'VP Operations',
      phone: '',
      hs_lead_status: '',
      lifecyclestage: '',
      hs_email_optout: false,
    });

    expect(result.status).toBe('matched');
    expect(mockedPrisma.contactEnrichment.upsert).toHaveBeenCalled();
    expect(mockedPrisma.contactEnrichmentField.upsert).toHaveBeenCalled();
  });

  it('is retry-safe via upsert and handles no-match', async () => {
    mockedPrisma.persona.findFirst.mockResolvedValue({
      id: 11,
      name: 'Alex Rivera',
      title: 'VP Operations',
      email: 'alex@example.com',
      account_name: 'Example Co',
    });
    mockedSearchApolloPeople.mockResolvedValue([]);
    mockedPrisma.contactEnrichment.upsert.mockResolvedValue({ id: 22 });

    const { enrichPersonaFromHubSpotContact } = await import('@/lib/enrichment/apollo-enrichment');
    const contact = {
      id: 'hs-1',
      email: 'alex@example.com',
      firstname: 'Alex',
      lastname: 'Rivera',
      company: 'Example Co',
      jobtitle: 'VP Operations',
      phone: '',
      hs_lead_status: '',
      lifecyclestage: '',
      hs_email_optout: false,
    };

    const first = await enrichPersonaFromHubSpotContact(contact);
    const second = await enrichPersonaFromHubSpotContact(contact);

    expect(first.status).toBe('no_match');
    expect(second.status).toBe('no_match');
    expect(mockedPrisma.contactEnrichment.upsert).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.contactEnrichmentField.upsert).not.toHaveBeenCalled();
  });
});
