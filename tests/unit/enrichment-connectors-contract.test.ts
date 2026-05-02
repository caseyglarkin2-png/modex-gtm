import { describe, expect, it } from 'vitest';
import {
  ApolloSearchResponseFixtureSchema,
  HubSpotCompanyFixtureSchema,
  HubSpotContactFixtureSchema,
} from '@/lib/enrichment/contracts';
import { mockCompany, mockContact } from '../mocks/hubspot';
import { mockApolloSearchResponse } from '../mocks/apollo';

describe('enrichment connector mock contracts', () => {
  it('validates HubSpot contact mock shape', () => {
    expect(() => HubSpotContactFixtureSchema.parse(mockContact)).not.toThrow();
  });

  it('validates HubSpot company mock shape', () => {
    expect(() => HubSpotCompanyFixtureSchema.parse(mockCompany)).not.toThrow();
  });

  it('validates Apollo search mock shape', () => {
    expect(() => ApolloSearchResponseFixtureSchema.parse(mockApolloSearchResponse)).not.toThrow();
  });
});
