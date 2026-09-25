/**
 * GAP OS dogfood, Phase 4: build a real, bounded hypothesis cohort from live
 * Pounce signals against production. Uses the REAL runHypothesize (the same
 * function the cron calls), NOT dryRun, so it registers real signals and
 * proposes real draft hypotheses -- but capped to a small maxAccounts so the
 * cohort stays small and reviewable, per the overnight directive's "10-20
 * recent real signals" instruction. Never enrolls, never sends. Every
 * hypothesis this creates lands in `draft` status (human review required
 * before it can move anywhere).
 */
import { PrismaClient } from '@prisma/client';
import { runHypothesize } from '../../src/lib/gap/hypothesis/hypothesize';

const prisma = new PrismaClient();

async function main() {
  const report = await runHypothesize(
    prisma,
    { now: new Date(), lookbackDays: 90, maxAccounts: 50, dryRun: false, actor: 'gap-dogfood-overnight' },
  );
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
