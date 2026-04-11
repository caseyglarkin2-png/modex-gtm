#!/usr/bin/env npx tsx
/**
 * sync-hubspot-to-db.ts — Pull HubSpot contacts + companies → local DB.
 * Matches by email (contacts) and domain/name (companies).
 * Links HubSpot IDs to existing Persona and Account records.
 *
 * Usage:
 *   npx tsx scripts/sync-hubspot-to-db.ts           # full sync
 *   npx tsx scripts/sync-hubspot-to-db.ts --dry-run  # preview only
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Client } from '@hubspot/api-client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const CONTACT_PROPERTIES = [
  'email', 'firstname', 'lastname', 'company', 'jobtitle', 'phone',
  'hs_lead_status', 'lifecyclestage',
];

const COMPANY_PROPERTIES = [
  'name', 'domain', 'industry', 'city', 'state', 'numberofemployees',
];

function getClient(): Client {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  return new Client({ accessToken: token });
}

async function syncContacts(client: Client) {
  console.log('\n--- Syncing Contacts ---');
  let after: string | undefined;
  let synced = 0;
  let skipped = 0;
  let total = 0;

  do {
    const page = await client.crm.contacts.basicApi.getPage(100, after, CONTACT_PROPERTIES);
    total += page.results.length;

    for (const contact of page.results) {
      const email = contact.properties?.email?.toLowerCase().trim();
      if (!email) { skipped++; continue; }

      // Find matching persona by email
      const persona = await prisma.persona.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (persona) {
        if (persona.hubspot_contact_id === contact.id) {
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`  [DRY] Would link persona "${persona.name}" (${email}) → HS contact ${contact.id}`);
        } else {
          await prisma.persona.update({
            where: { id: persona.id },
            data: { hubspot_contact_id: contact.id },
          });
          console.log(`  Linked persona "${persona.name}" (${email}) → HS contact ${contact.id}`);
        }
        synced++;
      } else {
        skipped++;
      }
    }

    after = page.paging?.next?.after;
  } while (after);

  console.log(`  Contacts: ${total} fetched, ${synced} linked, ${skipped} skipped`);
}

async function syncCompanies(client: Client) {
  console.log('\n--- Syncing Companies ---');
  let after: string | undefined;
  let synced = 0;
  let skipped = 0;
  let total = 0;

  do {
    const page = await client.crm.companies.basicApi.getPage(100, after, COMPANY_PROPERTIES);
    total += page.results.length;

    for (const company of page.results) {
      const name = company.properties?.name?.trim();
      const domain = company.properties?.domain?.toLowerCase().trim();
      if (!name) { skipped++; continue; }

      // Try matching by name first (our Account.name is the canonical key)
      const account = await prisma.account.findFirst({
        where: {
          OR: [
            { name: { equals: name, mode: 'insensitive' } },
            ...(domain ? [{ name: { contains: domain.split('.')[0], mode: 'insensitive' as const } }] : []),
          ],
        },
      });

      if (account) {
        if (account.hubspot_company_id === company.id) {
          skipped++;
          continue;
        }

        if (dryRun) {
          console.log(`  [DRY] Would link account "${account.name}" → HS company ${company.id} (${name})`);
        } else {
          await prisma.account.update({
            where: { id: account.id },
            data: { hubspot_company_id: company.id },
          });
          console.log(`  Linked account "${account.name}" → HS company ${company.id} (${name})`);
        }
        synced++;
      } else {
        skipped++;
      }
    }

    after = page.paging?.next?.after;
  } while (after);

  console.log(`  Companies: ${total} fetched, ${synced} linked, ${skipped} skipped`);
}

async function main() {
  if (dryRun) console.log('=== DRY RUN MODE ===\n');
  console.log('Starting HubSpot → DB sync...');

  const client = getClient();

  await syncContacts(client);
  await syncCompanies(client);

  console.log('\nSync complete.');
}

main()
  .catch((err) => {
    console.error('Sync error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
