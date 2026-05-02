export type CanonicalFieldType = 'string' | 'number' | 'boolean' | 'datetime' | 'enum';
export type OverwritePolicy = 'never' | 'if_empty' | 'if_higher_confidence' | 'always';
export type SourceOfTruth = 'hubspot' | 'apollo' | 'derived' | 'manual';

export type CanonicalFieldDefinition = {
  field: string;
  type: CanonicalFieldType;
  nullable: boolean;
  sourceOfTruth: SourceOfTruth;
  overwritePolicy: OverwritePolicy;
};

export const CONTACT_ENRICHMENT_FIELD_CATALOG: CanonicalFieldDefinition[] = [
  { field: 'email', type: 'string', nullable: false, sourceOfTruth: 'hubspot', overwritePolicy: 'never' },
  { field: 'first_name', type: 'string', nullable: true, sourceOfTruth: 'hubspot', overwritePolicy: 'if_empty' },
  { field: 'last_name', type: 'string', nullable: true, sourceOfTruth: 'hubspot', overwritePolicy: 'if_empty' },
  { field: 'job_title', type: 'string', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'seniority', type: 'enum', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'department', type: 'string', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'company_name', type: 'string', nullable: true, sourceOfTruth: 'hubspot', overwritePolicy: 'if_empty' },
  { field: 'company_domain', type: 'string', nullable: true, sourceOfTruth: 'hubspot', overwritePolicy: 'if_empty' },
  { field: 'company_industry', type: 'string', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'employee_count', type: 'number', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'phone', type: 'string', nullable: true, sourceOfTruth: 'hubspot', overwritePolicy: 'if_empty' },
  { field: 'linkedin_url', type: 'string', nullable: true, sourceOfTruth: 'apollo', overwritePolicy: 'if_higher_confidence' },
  { field: 'last_enriched_at', type: 'datetime', nullable: true, sourceOfTruth: 'derived', overwritePolicy: 'always' },
  { field: 'enrichment_confidence', type: 'number', nullable: true, sourceOfTruth: 'derived', overwritePolicy: 'always' },
];
