/**
 * Recalibrates ICP scoring for high-value D-band accounts that deserve B/C band.
 * These accounts were backfilled from email CSV with default scores — this corrects them.
 *
 * Score formula: (icp_fit*30 + modex_signal*20 + primo_story_fit*20 + warm_intro*15 + strategic_value*10 + meeting_ease*5) / 5
 * Dimensions: 1-5 scale
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function score(icp: number, modex: number, primo: number, warm: number, strategic: number, ease: number): number {
  return Math.round((icp * 30 + modex * 20 + primo * 20 + warm * 15 + strategic * 10 + ease * 5) / 5);
}

function band(s: number): 'A' | 'B' | 'C' | 'D' {
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 70) return 'C';
  return 'D';
}

function tier(s: number): string {
  if (s >= 85) return 'Tier 1';
  if (s >= 70) return 'Tier 2';
  return 'Tier 3';
}

// Each row: [account_name, icp, modex, primo, warm, strategic, ease, rationale]
const recalibrations: [string, number, number, number, number, number, number, string][] = [
  // B-band targets — clear ICP fit + active distribution networks at scale
  ['Coca-Cola',           5, 4, 4, 2, 5, 3, 'Mega CPG, 200+ owned bottlers, massive inbound ingredient logistics + outbound DC network. Primo angle: standardize yard ops across the franchise system.'],
  ['AB InBev',            5, 4, 4, 2, 5, 3, 'Brewery logistics intensive: inbound ingredient staging, outbound loading, co-packer yards. Multiple US plants = network standardization story.'],
  ['Mondelez International', 4, 4, 4, 2, 5, 3, 'Global snack manufacturer, high-velocity trailer movement, seasonal surges at biscuit/chocolate plants. Exact YardFlow use case.'],
  ['Keurig Dr Pepper',    4, 4, 4, 2, 5, 3, 'Beverage + coffee DSD distribution, large DC footprint, high-cadence outbound to retail. Yard is the constraint during peak.'],
  ['Refresco',            4, 4, 4, 2, 5, 3, 'Co-packer for 50+ brands at multi-site US plants. Drop & hook intensive. Exact ICP for yard standardization across a co-packer network.'],

  // C-band targets — strong ICP fit, less direct signal
  ['Campbell\'s',         4, 3, 4, 2, 4, 3, 'Soup/snack CPG, complex DC and plant yard ops. Multiple facilities. MODEX attendee profile.'],
  ['Caterpillar',         3, 5, 4, 2, 4, 3, 'MODEX 2026 major exhibitor. Heavy manufacturing, inbound parts logistics and finished goods yards. High MODEX signal.'],
  ['Del Monte Foods',     4, 3, 4, 2, 4, 3, 'Canned F&B, seasonal packing surges, multi-DC network. Was in original 20 — score was corrupted.'],
  ['Dollar General',      4, 3, 3, 2, 5, 2, '19,000+ stores fed by 30+ DCs. Inbound trailer velocity is extreme. Yard is clearly the constraint at this scale.'],
  ['Dollar Tree',         4, 3, 3, 2, 4, 2, 'Dollar Tree + Family Dollar merged network, large DC footprint, high-velocity inbound replenishment.'],
  ['FedEx',               3, 3, 3, 2, 4, 2, 'Logistics giant, heavy yard complexity at hub facilities. Harder sell (not CPG) but strategic value high.'],
];

async function run() {
  console.log('\nRecalibrating scores for high-value D-band accounts...\n');

  for (const [name, icp, modex, primo, warm, strategic, ease, rationale] of recalibrations) {
    const s = score(icp, modex, primo, warm, strategic, ease);
    const b = band(s);
    const t = tier(s);

    const existing = await prisma.account.findUnique({ where: { name }, select: { priority_score: true, priority_band: true } });
    if (!existing) {
      console.log(`  SKIP: ${name} not found in DB`);
      continue;
    }

    await prisma.account.update({
      where: { name },
      data: {
        icp_fit: icp,
        modex_signal: modex,
        primo_story_fit: primo,
        warm_intro: warm,
        strategic_value: strategic,
        meeting_ease: ease,
        priority_score: s,
        priority_band: b,
        tier: t,
      },
    });

    const arrow = `${existing.priority_score ?? 0} → ${s}`;
    const bandArrow = `${existing.priority_band ?? 'D'} → ${b}`;
    console.log(`  ✓ ${name.padEnd(26)} score: ${arrow.padEnd(12)} band: ${bandArrow}`);
    console.log(`    ${rationale}\n`);
  }

  // Summary
  const bandCounts = await prisma.account.groupBy({ by: ['priority_band'], _count: { _all: true }, orderBy: { priority_band: 'asc' } });
  console.log('Updated band distribution:');
  for (const b of bandCounts) console.log(`  ${b.priority_band}: ${b._count._all}`);

  await prisma.$disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
