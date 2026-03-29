import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const special = await prisma.account.findMany({
    where: { name: { in: ['DCSG', 'DB Schenker'] } },
    select: { name: true, outreach_status: true }
  });
  special.forEach((a: { name: string; outreach_status: string }) => console.log(a.name, '|', a.outreach_status));

  const existing = await prisma.account.findUnique({ where: { name: 'Whirlpool' } });
  if (!existing) {
    const count = await prisma.account.count();
    await prisma.account.create({
      data: {
        rank: count + 1, name: 'Whirlpool', vertical: 'Manufacturing',
        icp_fit: 18, modex_signal: 10, primo_story_fit: 10, warm_intro: 0,
        strategic_value: 6, meeting_ease: 3, priority_score: 47, priority_band: 'D',
        tier: 'Tier 3', outreach_status: 'Contacted', research_status: 'Not started',
        meeting_status: 'No meeting', owner: 'Casey', source: 'email-campaign-backfill',
      }
    });
    await prisma.persona.create({
      data: {
        persona_id: 'whirlpool-thomas.mcnulty',
        account_name: 'Whirlpool', name: 'Thomas McNulty',
        first_name: 'Thomas', last_name: 'McNulty',
        normalized_name: 'thomas mcnulty',
        email: 'thomas_mcnulty@whirlpool.com',
        email_status: 'unknown', company_domain: 'whirlpool.com',
        priority: 'P3', seniority: 'Unknown', persona_status: 'Found',
        source_type: 'email-campaign-backfill', account_score: 47,
        quality_score: 55, quality_band: 'D', contact_standard_version: '2026-03-29',
      }
    });
    console.log('[+] Added Whirlpool + Thomas McNulty');
  } else {
    console.log('[skip] Whirlpool already exists');
  }

  const total = await prisma.account.count();
  const personas = await prisma.persona.count();
  console.log('Final DB: ' + total + ' accounts, ' + personas + ' personas');
  await prisma.$disconnect();
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
