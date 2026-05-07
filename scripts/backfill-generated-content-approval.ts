import { prisma } from '@/lib/prisma';
import { backfillGeneratedContentApprovals } from '@/lib/revops/generated-content-approval-backfill';

function readFlag(name: string) {
  return process.argv.includes(name);
}

function readIntFlag(name: string, fallback: number) {
  const index = process.argv.findIndex((value) => value === name);
  if (index < 0) return fallback;
  const raw = process.argv[index + 1];
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function main() {
  const dryRun = readFlag('--dry-run');
  const limit = readIntFlag('--limit', 500);
  const actorFlagIndex = process.argv.findIndex((value) => value === '--actor');
  const actor = actorFlagIndex > -1 ? process.argv[actorFlagIndex + 1] : 'system-backfill';

  const result = await backfillGeneratedContentApprovals(prisma, {
    dryRun,
    limit,
    actor,
  });

  const mode = dryRun ? 'DRY RUN' : 'LIVE';
  // eslint-disable-next-line no-console
  console.log(`[generated-content-approval-backfill] ${mode}`);
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[generated-content-approval-backfill] failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
