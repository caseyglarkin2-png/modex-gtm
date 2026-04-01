/**
 * Generate one-pagers for all accounts that don't have one yet.
 * Usage: npx tsx scripts/generate-all-one-pagers.ts
 */

import { prisma } from '../src/lib/prisma';
import { generateText } from '../src/lib/ai/client';
import { buildOnePagerPrompt } from '../src/lib/ai/prompts';
import type { OnePagerContext } from '../src/lib/ai/prompts';

const DELAY_MS = 3000; // Rate limit: 3s between generations

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const accounts = await prisma.account.findMany({
    orderBy: { rank: 'asc' },
  });

  console.log(`Found ${accounts.length} accounts`);

  // Check which already have one-pagers
  const existing = await prisma.generatedContent.findMany({
    where: { content_type: 'one_pager' },
    select: { account_name: true },
    distinct: ['account_name'],
  });
  const existingSet = new Set(existing.map((e) => e.account_name));

  const toGenerate = accounts.filter((a) => !existingSet.has(a.name));
  console.log(`${existingSet.size} already have one-pagers. Generating for ${toGenerate.length} remaining.\n`);

  let success = 0;
  let failed = 0;

  for (const account of toGenerate) {
    console.log(`Generating one-pager for: ${account.name}...`);

    const meetingBrief = await prisma.meetingBrief.findFirst({
      where: { account_name: account.name },
    });

    const ctx: OnePagerContext = {
      accountName: account.name,
      parentBrand: account.parent_brand ?? account.name,
      vertical: account.vertical,
      whyNow: account.why_now ?? 'MODEX 2026 attendance signal',
      primoAngle: account.primo_angle ?? '',
      bestIntroPath: account.best_intro_path ?? '',
      likelyPainPoints:
        meetingBrief?.likely_pain ??
        account.why_now ??
        account.primo_angle ??
        'Trailer queue variability, gate/dock congestion, inconsistent driver journey',
      primoRelevance: meetingBrief?.primo_relevance ?? account.primo_angle ?? '',
      suggestedAttendees: meetingBrief?.suggested_attendees ?? '',
      score: account.priority_score,
      tier: account.tier,
      band: account.priority_band,
    };

    const prompt = buildOnePagerPrompt(ctx);

    try {
      const raw = await generateText(prompt, 1200);
      const jsonStr = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const content = JSON.parse(jsonStr);

      await prisma.generatedContent.create({
        data: {
          account_name: account.name,
          content_type: 'one_pager',
          tone: 'professional',
          content: JSON.stringify(content),
        },
      });

      success++;
      console.log(`  OK: ${account.name}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL: ${account.name} -`, err instanceof Error ? err.message : err);
    }

    if (toGenerate.indexOf(account) < toGenerate.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}, Skipped: ${existingSet.size}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
