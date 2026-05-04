import crypto from 'node:crypto';

export type MappingContract = {
  version: string;
  system: 'hubspot' | 'apollo';
  fields: readonly {
    source: string;
    canonical: string;
  }[];
};

const HUBSPOT_MAPPING: MappingContract = {
  version: 'hubspot-v1',
  system: 'hubspot',
  fields: [
    { source: 'email', canonical: 'email' },
    { source: 'firstname', canonical: 'first_name' },
    { source: 'lastname', canonical: 'last_name' },
    { source: 'jobtitle', canonical: 'job_title' },
    { source: 'company', canonical: 'company_name' },
    { source: 'phone', canonical: 'phone' },
  ],
};

const APOLLO_MAPPING: MappingContract = {
  version: 'apollo-v1',
  system: 'apollo',
  fields: [
    { source: 'email', canonical: 'email' },
    { source: 'first_name', canonical: 'first_name' },
    { source: 'last_name', canonical: 'last_name' },
    { source: 'title', canonical: 'job_title' },
    { source: 'organization.name', canonical: 'company_name' },
    { source: 'organization.website_url', canonical: 'company_domain' },
    { source: 'organization.industry', canonical: 'company_industry' },
  ],
};

export function getMappingContracts(): MappingContract[] {
  return [HUBSPOT_MAPPING, APOLLO_MAPPING];
}

export function computeMappingContractChecksum(contract: MappingContract): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(contract))
    .digest('hex');
}
