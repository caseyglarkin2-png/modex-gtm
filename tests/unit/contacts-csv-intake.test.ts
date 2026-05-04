import { describe, expect, it } from 'vitest';
import { parseContactsCsv } from '@/lib/contacts/csv-intake';

describe('contacts CSV intake', () => {
  it('maps common contact headers to import inputs', () => {
    const contacts = parseContactsCsv(`Email,First Name,Last Name,Job Title,Company Name,Website,Phone,LinkedIn URL
alex@example.com,Alex,Rivera,VP Operations,Example Co,https://example.com,555-0100,https://linkedin.com/in/alex`);

    expect(contacts).toEqual([
      expect.objectContaining({
        source: 'csv',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Rivera',
        title: 'VP Operations',
        companyName: 'Example Co',
        companyDomain: 'https://example.com',
        phone: '555-0100',
        linkedinUrl: 'https://linkedin.com/in/alex',
      }),
    ]);
  });

  it('supports account/name style headers and filters empty rows', () => {
    const contacts = parseContactsCsv(`Full Name,Account,Title
Taylor Ops,Acme Foods,Director Logistics
,,`);

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      name: 'Taylor Ops',
      companyName: 'Acme Foods',
      title: 'Director Logistics',
    });
  });
});
