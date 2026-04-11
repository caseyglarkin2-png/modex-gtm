#!/usr/bin/env npx tsx
/**
 * push-db-to-hubspot.ts — Push local Personas → HubSpot Contacts, Accounts → Companies.
 * Only pushes records that don't already have a hubspot_*_id linked.
 *
 * Usage:
 *   npx tsx scripts/push-db-to-hubspot.ts           # push unlinked records
 *   npx tsx scripts/push-db-to-hubspot.ts --dry-run  # preview only
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Client } from '@hubspot/api-client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function getClient(): Client {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  return new Client({ accessToken: token });
}

async function pushContacts(client: Client) {
  console.log('\n--- Pushing Personas → HubSpot Contacts ---');
  const unlinked = await prisma.persona.findMany({
    where: {
      hubspot_contact_id: null,
      email: { not: null },
      do_not_contact: false,
    },
    include: { account: true },
  });

  console.log(`  Found ${unlinked.length} unlinked personas with email`);
  let created = 0;
  let linked = 0;
  let errors = 0;

  for (const persona of unlinked) {
    if (!persona.email) continue;

    try {
      // Check if contact already exists in HubSpot by email
      const search = await client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{ propertyName: 'email', operator: 'EQ', value: persona.email.toLowerCase() }],
        }],
        properties: ['email'],
        limit: 1,
        after: '0',
        sorts: [],
      });

      let hubspotId: string;

      if (search.results.length > 0) {
        // Already exists — just link it
        hubspotId = search.results[0].id;
        if (dryRun) {
          console.log(`  [DRY] Would link "${persona.name}" <${persona.email}> → existing HS ${hubspotId}`);
        }
        linked++;
      } else {
        // Create new contact
        const nameParts = persona.name?.split(' ') || [];
        const properties: Record<string, string> = {
          email: persona.email.toLowerCase(),
          firstname: persona.first_name || nameParts[0] || '',
          lastname: persona.last_name || nameParts.slice(1).join(' ') || '',
          company: persona.account_name,
        };
        if (persona.title) properties.jobtitle = persona.title;
        if (persona.phone) properties.phone = persona.phone;

        if (dryRun) {
          console.log(`  [DRY] Would create HS contact for "${persona.name}" <${persona.email}>`);
          continue;
        }

        const result = await client.crm.contacts.basicApi.create({
          properties,
          associations: [],
        });
        hubspotId = result.id;
        created++;
        console.log(`  Created HS contact ${hubspotId} for "${persona.name}" <${persona.email}>`);
      }

      if (!dryRun) {
        await prisma.persona.update({
          where: { id: persona.id },
          data: { hubspot_contact_id: hubspotId },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Error pushing "${persona.name}" <${persona.email}>: ${msg}`);
      errors++;
    }
  }

  console.log(`  Contacts: ${created} created, ${linked} linked, ${errors} errors`);
}

async function pushCompanies(client: Client) {
  console.log('\n--- Pushing Accounts → HubSpot Companies ---');
  const unlinked = await prisma.account.findMany({
    where: { hubspot_company_id: null },
  });

  console.log(`  Found ${unlinked.length} unlinked accounts`);
  let created = 0;
  let linked = 0;
  let errors = 0;

  for (const account of unlinked) {
    try {
      // Check if company exists in HubSpot by name
      const search = await client.crm.companies.searchApi.doSearch({
        filterGroups: [{
          filters: [{ propertyName: 'name', operator: 'EQ', value: account.name }],
        }],
        properties: ['name', 'domain'],
        limit: 1,
        after: '0',
        sorts: [],
      });

      let hubspotId: string;

      if (search.results.length > 0) {
        hubspotId = search.results[0].id;
        if (dryRun) {
          console.log(`  [DRY] Would link "${account.name}" → existing HS ${hubspotId}`);
        }
        linked++;
      } else {
        const properties: Record<string, string> = {
          name: account.name,
        };
        if (account.vertical) properties.industry = account.vertical;

        if (dryRun) {
          console.log(`  [DRY] Would create HS company for "${account.name}"`);
          continue;
        }

        const result = await client.crm.companies.basicApi.create({
          properties,
          associations: [],
        });
        hubspotId = result.id;
        created++;
        console.log(`  Created HS company ${hubspotId} for "${account.name}"`);
      }

      if (!dryRun) {
        await prisma.account.update({
          where: { id: account.id },
          data: { hubspot_company_id: hubspotId },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Error pushing "${account.name}": ${msg}`);
      errors++;
    }
  }

  console.log(`  Companies: ${created} created, ${linked} linked, ${errors} errors`);
}

async function main() {
  if (dryRun) console.log('=== DRY RUN MODE ===\n');
  console.log('Starting DB → HubSpot push...');

  const client = getClient();

  await pushCompanies(client);
  await pushContacts(client);

  console.log('\nPush complete.');
}

main()
  .catch((err) => {
    console.error('Push error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
