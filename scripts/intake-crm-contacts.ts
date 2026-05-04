#!/usr/bin/env npx tsx
/**
 * Intake CRM contacts into the RevOps OS database.
 *
 * Examples:
 *   npx tsx scripts/intake-crm-contacts.ts --source hubspot --env .env.production.local --limit 500
 *   npx tsx scripts/intake-crm-contacts.ts --source apollo --label-id <apollo_label_id> --env .env.production.local --limit 1000
 *   npx tsx scripts/intake-crm-contacts.ts --source hubspot --dry-run
 */
import dotenv from 'dotenv';
import { Client } from '@hubspot/api-client';
import { PrismaClient } from '@prisma/client';
import { importExternalContact, summarizeImportResults, type ExternalContactImportResult } from '../src/lib/contacts/external-contact-import';
import { searchApolloSavedContacts } from '../src/lib/enrichment/apollo-client';

type Source = 'hubspot' | 'apollo';

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const envPath = argValue('env');
dotenv.config(envPath ? { path: envPath } : undefined);

const source = (argValue('source') ?? 'hubspot') as Source;
const dryRun = process.argv.includes('--dry-run');
const limit = Number(argValue('limit') ?? 500);
const labelIds = (argValue('label-id') ?? argValue('label-ids') ?? process.env.APOLLO_CONTACT_LABEL_IDS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const prisma = new PrismaClient();

async function importHubSpotContacts(): Promise<ExternalContactImportResult[]> {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN is not configured');
  const client = new Client({ accessToken: token });
  const outcomes: ExternalContactImportResult[] = [];
  let after: string | undefined;

  while (outcomes.length < limit) {
    const page = await client.crm.contacts.basicApi.getPage(100, after, [
      'email',
      'firstname',
      'lastname',
      'company',
      'jobtitle',
      'phone',
      'hs_email_optout',
    ]);

    for (const contact of page.results) {
      if (outcomes.length >= limit) break;
      const properties = contact.properties ?? {};
      const input = {
        source: 'hubspot' as const,
        sourceContactId: contact.id,
        email: properties.email ?? null,
        firstName: properties.firstname ?? null,
        lastName: properties.lastname ?? null,
        title: properties.jobtitle ?? null,
        phone: properties.phone ?? null,
        companyName: properties.company ?? null,
        optedOut: properties.hs_email_optout === 'true',
      };
      outcomes.push(dryRun ? { status: 'skipped', reason: 'dry-run' } : await importExternalContact(input));
    }

    after = page.paging?.next?.after;
    if (!after) break;
  }

  return outcomes;
}

async function importApolloContacts(): Promise<ExternalContactImportResult[]> {
  const outcomes: ExternalContactImportResult[] = [];
  let page = Number(argValue('page') ?? 1);

  while (outcomes.length < limit) {
    const result = await searchApolloSavedContacts({
      contactLabelIds: labelIds,
      page,
      perPage: Math.min(100, limit - outcomes.length),
    });
    if (result.contacts.length === 0) break;

    for (const contact of result.contacts) {
      const phone = contact.phone_numbers?.[0]?.sanitized_number ?? contact.phone_numbers?.[0]?.raw_number ?? null;
      const input = {
        source: 'apollo' as const,
        sourceContactId: contact.contact_id ?? contact.id,
        email: contact.email ?? null,
        firstName: contact.first_name,
        lastName: contact.last_name,
        title: contact.title ?? null,
        phone,
        companyName: contact.organization?.name ?? contact.organization_name ?? contact.company ?? null,
        companyDomain: contact.organization?.website_url ?? null,
        companyIndustry: contact.organization?.industry ?? null,
        linkedinUrl: contact.linkedin_url ?? null,
        confidence: contact.confidence ?? null,
      };
      outcomes.push(dryRun ? { status: 'skipped', reason: 'dry-run' } : await importExternalContact(input));
    }

    page += 1;
    if (outcomes.length >= result.totalEntries) break;
  }

  return outcomes;
}

async function main() {
  if (source === 'apollo' && labelIds.length === 0) {
    console.warn('[intake] No Apollo label IDs provided; importing from all saved Apollo contacts visible to the API key.');
  }

  const before = await Promise.all([
    prisma.account.count(),
    prisma.persona.count(),
    prisma.persona.count({ where: { hubspot_contact_id: { not: null } } }),
    prisma.contactEnrichment.count({ where: { apollo_person_id: { not: null } } }),
  ]);

  const outcomes = source === 'hubspot'
    ? await importHubSpotContacts()
    : await importApolloContacts();
  const summary = summarizeImportResults(outcomes);

  const after = await Promise.all([
    prisma.account.count(),
    prisma.persona.count(),
    prisma.persona.count({ where: { hubspot_contact_id: { not: null } } }),
    prisma.contactEnrichment.count({ where: { apollo_person_id: { not: null } } }),
  ]);

  console.log(JSON.stringify({
    source,
    dryRun,
    requestedLimit: limit,
    processed: outcomes.length,
    summary,
    before: { accounts: before[0], contacts: before[1], hubspotLinked: before[2], apolloLinked: before[3] },
    after: { accounts: after[0], contacts: after[1], hubspotLinked: after[2], apolloLinked: after[3] },
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
