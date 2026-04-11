/**
 * HubSpot API mock helper — builds a mock HubSpot client for unit tests.
 * Usage:
 *   const mock = createMockHubSpotClient();
 *   vi.mock('@hubspot/api-client', () => ({ Client: vi.fn(() => mock.client) }));
 */
import { vi } from 'vitest';
import {
  mockContact,
  mockContactSearchResult,
  mockCompany,
  mockCompanySearchResult,
  mockEmailObject,
  mockAssociation,
} from '../mocks/hubspot';

export function createMockHubSpotClient() {
  const contactsApi = {
    basicApi: {
      getById: vi.fn().mockResolvedValue(mockContact),
      create: vi.fn().mockResolvedValue(mockContact),
      update: vi.fn().mockResolvedValue(mockContact),
      getPage: vi.fn().mockResolvedValue({ results: [mockContact], paging: undefined }),
    },
    searchApi: {
      doSearch: vi.fn().mockResolvedValue(mockContactSearchResult),
    },
    batchApi: {
      create: vi.fn().mockResolvedValue({ results: [mockContact] }),
      update: vi.fn().mockResolvedValue({ results: [mockContact] }),
    },
  };

  const companiesApi = {
    basicApi: {
      getById: vi.fn().mockResolvedValue(mockCompany),
      create: vi.fn().mockResolvedValue(mockCompany),
      update: vi.fn().mockResolvedValue(mockCompany),
    },
    searchApi: {
      doSearch: vi.fn().mockResolvedValue(mockCompanySearchResult),
    },
  };

  const emailsApi = {
    basicApi: {
      create: vi.fn().mockResolvedValue(mockEmailObject),
      getById: vi.fn().mockResolvedValue(mockEmailObject),
    },
  };

  const associationsApi = {
    batchApi: {
      create: vi.fn().mockResolvedValue({ results: [mockAssociation] }),
    },
  };

  const client = {
    crm: {
      contacts: contactsApi,
      companies: companiesApi,
      objects: {
        emails: emailsApi,
      },
      associations: {
        v4: associationsApi,
      },
    },
  };

  return {
    client,
    contactsApi,
    companiesApi,
    emailsApi,
    associationsApi,
  };
}
