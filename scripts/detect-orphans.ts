#!/usr/bin/env npx tsx
/**
 * detect-orphans.ts — Find HubSpot contacts/companies with no matching DB record.
 * Also finds DB personas/accounts with no HubSpot link.
 * Reports both directions for reconciliation.
 *
 * Usage:
 *   npx tsx scripts/detect-orphans.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Client } from '@hubspot/api-client';

const prisma = new PrismaClient();

function getClient(): Client {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) throw new Error('HUBSPOT_ACCESS_TOKEN not set');
  return new Client({ accessToken: token });
}

async function detectContactOrphans(client: Client) {
  console.log('\n--- HubSpot Contacts with no DB Persona ---');
  let after: string | undefined;
  const orphans: Array<{ id: string; email: string; name: string }> = [];

  do {
    const page = await client.crm.contacts.basicApi.getPage(100, after, ['email', 'firstname', 'lastname']);

    for (const contact of page.results) {
      const email = contact.properties?.email?.toLowerCase().trim();
      if (!email) continue;

      const persona = await prisma.persona.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });

      if (!persona) {
        orphans.push({
          id: contact.id,
          email,
          name: `${contact.properties?.firstname || ''} ${contact.properties?.lastname || ''}`.trim(),
        });
      }
    }

    after = page.paging?.next?.after;
  } while (after);

  if (orphans.length === 0) {
    console.log('  None found.');
  } else {
    for (const o of orphans) {
      console.log(`  HS ${o.id}: ${o.name} <${o.email}>`);
    }
    console.log(`  Total: ${orphans.length} orphan contacts in HubSpot`);
  }
}

async function detectUnlinkedPersonas() {
  console.log('\n--- DB Personas with no HubSpot Link ---');
  const unlinked = await prisma.persona.findMany({
    where: {
      hubspot_contact_id: null,
      email: { not: null },
    },
    select: { name: true, email: true, account_name: true },
    orderBy: { account_name: 'asc' },
  });

  if (unlinked.length === 0) {
    console.log('  None found.');
  } else {
    for (const p of unlinked) {
      console.log(`  ${p.account_name}: ${p.name} <${p.email}>`);
    }
    console.log(`  Total: ${unlinked.length} unlinked personas`);
  }
}

async function detectUnlinkedAccounts() {
  console.log('\n--- DB Accounts with no HubSpot Link ---');
  const unlinked = await prisma.account.findMany({
    where: { hubspot_company_id: null },
    select: { name: true, priority_band: true },
    orderBy: { priority_score: 'desc' },
  });

  if (unlinked.length === 0) {
    console.log('  None found.');
  } else {
    for (const a of unlinked) {
      console.log(`  [${a.priority_band}] ${a.name}`);
    }
    console.log(`  Total: ${unlinked.length} unlinked accounts`);
  }
}

async function main() {
  console.log('Orphan Detection Report');
  console.log('=======================');

  const client = getClient();

  await detectContactOrphans(client);
  await detectUnlinkedPersonas();
  await detectUnlinkedAccounts();

  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
