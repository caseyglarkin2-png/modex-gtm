import { describe, expect, it } from 'vitest';
import { CONTACT_ENRICHMENT_FIELD_CATALOG } from '@/lib/enrichment/field-catalog';

describe('enrichment field catalog', () => {
  it('matches snapshot to prevent contract drift', () => {
    expect(CONTACT_ENRICHMENT_FIELD_CATALOG).toMatchSnapshot();
  });

  it('has unique field names', () => {
    const names = CONTACT_ENRICHMENT_FIELD_CATALOG.map((f) => f.field);
    expect(new Set(names).size).toBe(names.length);
  });
});
