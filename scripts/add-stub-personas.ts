import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

const stubs = [
  // Dawn Foods — specialty bakery ingredients, perishable inputs, regional DCs
  {
    persona_id: 'dawn-foods-stub-001',
    account_name: 'Dawn Foods',
    name: 'Research Needed',
    first_name: 'Research',
    last_name: 'Needed',
    title: 'VP Supply Chain',
    email: 'research-needed@dawnfoods.com',
    function: 'Supply Chain',
    seniority: 'VP',
    priority: 'P2',
    notes: 'STUB — find real contact via LinkedIn Sales Nav search. Role: VP Supply Chain or Director Logistics Operations.',
  },
  // Dollar General — 3,000+ DCs, highest DC-ops density of any retailer
  {
    persona_id: 'dollar-general-stub-001',
    account_name: 'Dollar General',
    name: 'Research Needed',
    first_name: 'Research',
    last_name: 'Needed',
    title: 'SVP Supply Chain',
    email: 'research-needed@dollargeneral.com',
    function: 'Supply Chain',
    seniority: 'SVP',
    priority: 'P2',
    notes: 'STUB — find real contact via LinkedIn Sales Nav search. Role: SVP Supply Chain or VP Distribution Operations.',
  },
  // IKEA — large-format DC ops, complex inbound freight coordination
  {
    persona_id: 'ikea-stub-001',
    account_name: 'IKEA',
    name: 'Research Needed',
    first_name: 'Research',
    last_name: 'Needed',
    title: 'Distribution Operations Director',
    email: 'research-needed@ikea.com',
    function: 'Operations',
    seniority: 'Director',
    priority: 'P2',
    notes: 'STUB — find real contact via LinkedIn Sales Nav search. Role: Supply Chain Development Manager or DC Network Operations Director.',
  },
];

async function run() {
  for (const s of stubs) {
    await p.persona.upsert({
      where: { persona_id: s.persona_id },
      update: {},
      create: s,
    });
    console.log(`  + ${s.account_name}: ${s.title}`);
  }
  console.log('\nDone. All 3 stub personas created.');
  await p.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
