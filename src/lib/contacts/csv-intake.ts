import { parse } from 'csv-parse/sync';
import type { ExternalContactInput } from '@/lib/contacts/external-contact-import';

type CsvRecord = Record<string, string | undefined>;

const HEADER_ALIASES = {
  email: ['email', 'email address', 'work email', 'business email'],
  firstName: ['firstname', 'first name', 'first_name'],
  lastName: ['lastname', 'last name', 'last_name'],
  name: ['name', 'full name', 'contact name', 'person'],
  title: ['title', 'job title', 'jobtitle', 'role'],
  phone: ['phone', 'phone number', 'mobile', 'mobile phone'],
  companyName: ['company', 'company name', 'account', 'account name', 'organization', 'organization name'],
  companyDomain: ['domain', 'company domain', 'website', 'company website', 'organization website'],
  companyIndustry: ['industry', 'company industry', 'vertical'],
  linkedinUrl: ['linkedin', 'linkedin url', 'linkedin_url', 'person linkedin url'],
} as const;

function valueFor(record: CsvRecord, aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const key = Object.keys(record).find((candidate) => candidate.trim().toLowerCase() === alias);
    const value = key ? record[key]?.trim() : '';
    if (value) return value;
  }
  return null;
}

export function parseContactsCsv(rawCsv: string): ExternalContactInput[] {
  const records = parse(rawCsv, {
    columns: (headers: string[]) => headers.map((header) => header.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as CsvRecord[];

  return records
    .map((record, index) => ({
      source: 'csv' as const,
      sourceContactId: `csv-row-${index + 1}`,
      email: valueFor(record, HEADER_ALIASES.email),
      firstName: valueFor(record, HEADER_ALIASES.firstName),
      lastName: valueFor(record, HEADER_ALIASES.lastName),
      name: valueFor(record, HEADER_ALIASES.name),
      title: valueFor(record, HEADER_ALIASES.title),
      phone: valueFor(record, HEADER_ALIASES.phone),
      companyName: valueFor(record, HEADER_ALIASES.companyName),
      companyDomain: valueFor(record, HEADER_ALIASES.companyDomain),
      companyIndustry: valueFor(record, HEADER_ALIASES.companyIndustry),
      linkedinUrl: valueFor(record, HEADER_ALIASES.linkedinUrl),
    }))
    .filter((contact) => contact.email || contact.name || contact.companyName);
}
