#!/usr/bin/env npx tsx
/**
 * seed-test-data.ts — Idempotent test data seeder for dev/CI environments.
 * Creates synthetic accounts + personas for integration testing.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts               # default: 5 contacts
 *   npx tsx scripts/seed-test-data.ts --contacts 20  # custom count
 *   npx tsx scripts/seed-test-data.ts --clean        # remove test data first
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_PREFIX = '__test__';

function parseArgs() {
  const args = process.argv.slice(2);
  let contacts = 5;
  let clean = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--contacts' && args[i + 1]) {
      contacts = parseInt(args[i + 1], 10);
      if (isNaN(contacts) || contacts < 1) contacts = 5;
    }
    if (args[i] === '--clean') clean = true;
  }

  return { contacts, clean };
}

const VERTICALS = ['Food & Beverage', 'Retail', 'Manufacturing', 'Automotive', 'Logistics'];
const TITLES = ['VP Supply Chain', 'Director of Operations', 'Head of Logistics', 'SVP Distribution', 'Plant Manager'];

function testAccountName(i: number): string {
  return `${TEST_PREFIX}Account_${i}`;
}

function testPersonaEmail(i: number): string {
  return `${TEST_PREFIX}person${i}@example.com`;
}

async function cleanTestData() {
  console.log('Cleaning test data...');
  await prisma.persona.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await prisma.account.deleteMany({ where: { name: { startsWith: TEST_PREFIX } } });
  console.log('  Done.');
}

async function seedTestData(count: number) {
  console.log(`Seeding ${count} test contacts...`);

  for (let i = 1; i <= count; i++) {
    const accountName = testAccountName(i);
    const account = await prisma.account.upsert({
      where: { name: accountName },
      update: {},
      create: {
        name: accountName,
        vertical: VERTICALS[i % VERTICALS.length],
        signal_type: 'test',
        why_now: 'Integration test data',
        primo_angle: 'Test angle',
        best_intro_path: 'direct',
        source: 'test-seed',
        icp_fit: 70 + (i % 30),
        modex_signal: 50,
        primo_story_fit: 50,
        warm_intro: 50,
        strategic_value: 50,
        meeting_ease: 50,
        priority_score: 60,
        priority_band: 'C',
        tier: 3,
        rank: i,
        owner: 'casey',
        research_status: 'done',
        outreach_status: 'not_started',
        meeting_status: 'none',
        current_motion: 'test',
        next_action: 'test seed',
      },
    });

    await prisma.persona.upsert({
      where: { email: testPersonaEmail(i) },
      update: {},
      create: {
        account_name: account.name,
        full_name: `Test Person ${i}`,
        title: TITLES[i % TITLES.length],
        email: testPersonaEmail(i),
        linkedin_url: `https://linkedin.com/in/test-person-${i}`,
        seniority: 'VP',
        department: 'Operations',
        quality_band: 'B',
        source: 'test-seed',
      },
    });
  }

  console.log(`  Created ${count} accounts + ${count} personas (prefix: ${TEST_PREFIX})`);
}

async function main() {
  const { contacts, clean } = parseArgs();

  if (clean) {
    await cleanTestData();
  }

  await seedTestData(contacts);
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
