import { describe, expect, it } from 'vitest';
import type { HubSpotContact } from '@/lib/hubspot/contacts';
import { buildHubSpotIntakeCandidates } from '@/lib/contacts/hubspot-intake';

const contact: HubSpotContact = {
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

describe('hubspot intake candidate mapping', () => {
  it('marks linked and enriched contacts correctly', () => {
    const candidates = buildHubSpotIntakeCandidates(
      [contact],
      [{ id: 10, hubspot_contact_id: 'hs-1', email: 'alex@example.com' }],
      [{ persona_id: 10, apollo_person_id: 'ap-9', enrichment_confidence: 0.91, last_enriched_at: new Date('2026-05-01T00:00:00Z') }],
    );

    expect(candidates[0]).toMatchObject({
      hasHubSpotLink: true,
      hasEnrichmentRecord: true,
      hasApolloEnrichment: true,
      localPersonaId: 10,
    });
  });

  it('flags high-scoring net-new contacts as recommended', () => {
    const candidates = buildHubSpotIntakeCandidates([contact], [], []);
    expect(candidates[0]?.recommendedImport).toBe(true);
    expect(candidates[0]?.helpfulBand).toBe('B');
  });
});
