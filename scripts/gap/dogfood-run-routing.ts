/**
 * GAP OS dogfood follow-up: run routing ONCE in production, scoped to the
 * accounts tied to the current active hypotheses (General Mills, Kroger).
 *
 * This calls the exact same `runRouting` function and the exact same real
 * dependencies (createClawdSuppressionReader, createHubSpotSnapshotProvider)
 * that POST /api/gap/routing/run?mode=apply wires up -- the only difference
 * is this script drives it directly against production Postgres instead of
 * over HTTP, which avoids needing a browser session or a secret for a single
 * authorized one-time run. Routing itself only ever creates RoutingDecision
 * rows (mode: shadow) -- it cannot send email or enroll anyone.
 */
import { PrismaClient } from '@prisma/client';
import { DEFAULT_MAX_PAIRS, createHubSpotSnapshotProvider, runRouting } from '../../src/lib/gap/routing/run';
import type { SnapshotReads } from '../../src/lib/gap/routing/run';
import { createClawdSuppressionReader } from '../../src/lib/gap/routing/suppression-read';
import { getHubSpotClient, isHubSpotConfigured, withHubSpotRetry } from '../../src/lib/hubspot/client';

const prisma = new PrismaClient();

const hubspotReads: SnapshotReads = {
  async readCompany(hubspotCompanyId, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () => client.crm.companies.basicApi.getById(hubspotCompanyId, [...properties]),
      `gap-routing company read (${hubspotCompanyId})`,
    );
    return res ? { properties: res.properties ?? {} } : null;
  },
  async readContacts(ids, properties) {
    const client = getHubSpotClient();
    const res = await withHubSpotRetry(
      () =>
        client.crm.contacts.batchApi.read({
          inputs: ids.map((id) => ({ id })),
          properties: [...properties],
          propertiesWithHistory: [],
        }),
      `gap-routing contacts batch read (${ids.length})`,
    );
    return (res.results ?? []).map((r) => ({ id: String(r.id), properties: r.properties ?? {} }));
  },
};

async function main() {
  const report = await runRouting(
    prisma,
    {
      now: new Date(),
      actor: 'gap-dogfood-overnight',
      dryRun: false,
      maxPairs: DEFAULT_MAX_PAIRS,
      accountNames: ['General Mills', 'Kroger'],
    },
    {
      suppression: createClawdSuppressionReader(),
      hubspotSnapshot: createHubSpotSnapshotProvider(prisma, hubspotReads, { configured: isHubSpotConfigured }),
    },
  );
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
