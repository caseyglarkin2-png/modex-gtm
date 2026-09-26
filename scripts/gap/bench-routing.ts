/**
 * Routing latency benchmark (debt burn, 2026-09-26). DRY RUN ONLY.
 *
 * Times `runRouting` over the same account cohort with the real read
 * dependencies (Postgres, HubSpot reads, the Clawd suppression read). It
 * passes `dryRun: true` and a no-op audit, so it writes nothing: no
 * RoutingDecision row, no SystemConfig key, no audit event.
 *
 *   npx tsx scripts/gap/bench-routing.ts "PepsiCo,Kroger" [repeats] [personaIds]
 *
 * `personaIds` (comma separated) times a targeted run, the shape APPROVE + USE
 * routes: exactly those people at the named accounts.
 *
 * Needs DATABASE_URL, HUBSPOT_ACCESS_TOKEN, CLAWD_CONTROL_PLANE_URL/TOKEN in
 * the environment. Prints one JSON line per timing.
 */
import { PrismaClient } from '@prisma/client';
import { createHubSpotSnapshotProvider, runRouting } from '../../src/lib/gap/routing/run';
import { hubspotReads } from '../../src/lib/gap/routing/interactive';
import { createClawdSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { isHubSpotConfigured } from '../../src/lib/hubspot/client';

async function main() {
  const accountNames = (process.argv[2] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const repeats = Math.max(1, Number.parseInt(process.argv[3] ?? '1', 10) || 1);
  const personaIds = (process.argv[4] ?? '').split(',').map((s) => Number.parseInt(s, 10)).filter(Number.isInteger);
  if (accountNames.length === 0) throw new Error('usage: bench-routing.ts "Account A,Account B" [repeats]');
  const prisma = new PrismaClient();
  try {
    for (let i = 0; i < repeats; i += 1) {
      const t0 = Date.now();
      const report = await runRouting(
        prisma,
        { now: new Date(), actor: 'bench', dryRun: true, accountNames, ...(personaIds.length ? { personaIds } : {}) },
        {
          suppression: createClawdSuppressionReader(),
          hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
          audit: async () => ({ stored: false, reviewQueued: false }),
        },
      );
      console.log(JSON.stringify({ accounts: accountNames.length, people: personaIds.length || null, ms: Date.now() - t0, pairs: report.pairs, decisions: report.decisions, skips: report.skips, failed: report.failed }));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
