import { describe, expect, it } from 'vitest';
import { buildCanonicalWorkspace } from '@/lib/revops/canonical-records';

describe('canonical-records', () => {
  it('marks same-email contacts across different accounts as a multi-account collision', () => {
    const workspace = buildCanonicalWorkspace(
      [
        { name: 'Acme Foods', hubspot_company_id: null },
        { name: 'Beta Foods', hubspot_company_id: null },
      ],
      [
        {
          id: 1,
          account_name: 'Acme Foods',
          name: 'Alex Ops',
          email: 'alex@example.com',
          email_valid: true,
          company_domain: 'acme.com',
          quality_score: 90,
        },
        {
          id: 2,
          account_name: 'Beta Foods',
          name: 'Alex Ops',
          email: 'alex@example.com',
          email_valid: true,
          company_domain: 'beta.com',
          quality_score: 88,
        },
      ],
    );

    const record = workspace.contactsByPersonaId.get(1);
    expect(record?.status).toBe('conflict');
    expect(record?.conflictCodes).toContain('multi_account_collision');
    expect(record?.sendBlocked).toBe(true);
  });

  it('resolves a strong company/contact identity when hubspot and email keys are clean', () => {
    const workspace = buildCanonicalWorkspace(
      [{ name: 'Acme Foods', hubspot_company_id: '123' }],
      [{
        id: 1,
        account_name: 'Acme Foods',
        name: 'Alex Ops',
        email: 'alex@acme.com',
        email_valid: true,
        company_domain: 'acme.com',
        hubspot_contact_id: '999',
        quality_score: 92,
      }],
    );

    const record = workspace.contactsByPersonaId.get(1);
    expect(record?.status).toBe('resolved');
    expect(record?.canonicalContactId).toBe('hubspot-contact:999');
    expect(record?.canonicalCompanyId).toBe('hubspot-company:123');
    expect(record?.sendBlocked).toBe(false);
  });
});
