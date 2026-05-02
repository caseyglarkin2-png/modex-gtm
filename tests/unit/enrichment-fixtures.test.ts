import { describe, expect, it } from 'vitest';
import {
  buildApolloPersonFixture,
  buildApolloSearchResponseFixture,
  buildHubSpotCompanyFixture,
  buildHubSpotContactFixture,
} from '../fixtures/enrichment';

describe('enrichment fixtures', () => {
  it('builds deterministic HubSpot contact fixtures by seed', () => {
    const a = buildHubSpotContactFixture({ seed: 7 });
    const b = buildHubSpotContactFixture({ seed: 7 });
    const c = buildHubSpotContactFixture({ seed: 8 });

    expect(a).toEqual(b);
    expect(a.id).toBe('hs-contact-0007');
    expect(c.id).toBe('hs-contact-0008');
  });

  it('builds deterministic HubSpot company fixtures by seed', () => {
    const a = buildHubSpotCompanyFixture({ seed: 11 });
    const b = buildHubSpotCompanyFixture({ seed: 11 });

    expect(a).toEqual(b);
    expect(a.properties.domain).toBe('example0011.com');
  });

  it('builds deterministic Apollo fixtures by seed', () => {
    const person = buildApolloPersonFixture({ seed: 13 });
    const search = buildApolloSearchResponseFixture({ seed: 13 });

    expect(person.id).toBe('apollo-person-0013');
    expect(search.people[0]).toEqual(person);
  });
});
