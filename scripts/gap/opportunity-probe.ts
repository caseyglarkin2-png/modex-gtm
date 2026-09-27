/**
 * READ-ONLY probe of the active-opportunity resolver against a live database
 * and HubSpot (final Monday blocker, 2026-09-27).
 *
 *   npx tsx scripts/gap/opportunity-probe.ts "Kroger" "GXO Logistics" ...
 *
 * Reads only: the Prisma client is wrapped so any method other than
 * findUnique / findMany / findFirst throws, and the resolver's HubSpot reads
 * are GET/search/batch-read calls. Prints each account's CLEAR / ACTIVE /
 * UNKNOWN with the open deal names. Needs DATABASE_URL and HUBSPOT_ACCESS_TOKEN.
 */
import { PrismaClient } from '@prisma/client';
import { resolveAccountOpportunity } from '../../src/lib/gap/opportunity/active-opportunity';

const READS = new Set(['findUnique', 'findMany', 'findFirst']);

function readOnly(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, model: string) {
      const m = (target as unknown as Record<string, unknown>)[model];
      if (!m || typeof m !== 'object') return m;
      return new Proxy(m as object, {
        get(t, method: string) {
          if (!READS.has(method)) throw new Error(`read-only probe: ${model}.${method} refused`);
          return (t as Record<string, unknown>)[method];
        },
      });
    },
  }) as PrismaClient;
}

async function main() {
  const names = process.argv.slice(2);
  if (names.length === 0) throw new Error('usage: opportunity-probe.ts <account name>...');
  const prisma = new PrismaClient();
  try {
    const ro = readOnly(prisma);
    for (const name of names) {
      const t = await resolveAccountOpportunity(ro, name);
      const line =
        t.status === 'ACTIVE'
          ? `ACTIVE  ${t.deals.map((d) => `"${d.name}" [${d.stage}] contacts=${d.contactIds.length}`).join('; ')} (companies ${t.companyIds.join(',')})`
          : t.status === 'CLEAR'
            ? `CLEAR   (companies ${t.companyIds.join(',')})`
            : `UNKNOWN ${t.reason}${t.detail ? `: ${t.detail}` : ''}`;
      console.log(`${name.padEnd(34)} ${line}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
