import { mockCompany, mockContact } from '../mocks/hubspot';
import { mockApolloPerson, mockApolloSearchResponse } from '../mocks/apollo';

type FixtureSeed = {
  seed: number;
};

function stableSuffix(seed: number): string {
  return String(seed).padStart(4, '0');
}

export function buildHubSpotContactFixture({ seed }: FixtureSeed = { seed: 1 }) {
  const suffix = stableSuffix(seed);
  return {
    ...mockContact,
    id: `hs-contact-${suffix}`,
    properties: {
      ...mockContact.properties,
      email: `contact${suffix}@example.com`,
      firstname: `First${suffix}`,
      lastname: `Last${suffix}`,
    },
  };
}

export function buildHubSpotCompanyFixture({ seed }: FixtureSeed = { seed: 1 }) {
  const suffix = stableSuffix(seed);
  return {
    ...mockCompany,
    id: `hs-company-${suffix}`,
    properties: {
      ...mockCompany.properties,
      name: `Example Company ${suffix}`,
      domain: `example${suffix}.com`,
    },
  };
}

export function buildApolloPersonFixture({ seed }: FixtureSeed = { seed: 1 }) {
  const suffix = stableSuffix(seed);
  return {
    ...mockApolloPerson,
    id: `apollo-person-${suffix}`,
    first_name: `Apollo${suffix}`,
    last_name: 'Prospect',
    email: `apollo${suffix}@example.com`,
    organization: {
      ...mockApolloPerson.organization,
      name: `Apollo Org ${suffix}`,
      website_url: `https://apollo${suffix}.example.com`,
    },
  };
}

export function buildApolloSearchResponseFixture({ seed }: FixtureSeed = { seed: 1 }) {
  return {
    ...mockApolloSearchResponse,
    people: [buildApolloPersonFixture({ seed })],
  };
}
