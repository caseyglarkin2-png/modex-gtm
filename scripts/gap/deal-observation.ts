/**
 * GAP Phase 2 A2: READ-ONLY deal observation after the first GAP touch.
 *
 *   DATABASE_URL=... HUBSPOT_ACCESS_TOKEN=... npx tsx scripts/gap/deal-observation.ts [--account "Kroger"]
 *
 * For every account with a Gmail-proven GAP send, prints whether a HubSpot
 * deal was created within 60 / 120 days of the first send (windows still open
 * are marked open). An observation, not attribution: it never claims GAP
 * caused a deal. Reads only: modex rows via findMany/findUnique, HubSpot via
 * the opportunity reads (search, association and batch reads). No writes.
 */
import { PrismaClient } from '@prisma/client';
import { observeDealsAfterFirstTouch } from '../../src/lib/gap/learning/deal-observation';
import { hubspotOpportunityReads } from '../../src/lib/gap/opportunity/hubspot-reads';

async function main() {
  const i = process.argv.indexOf('--account');
  const accounts = i > 0 && process.argv[i + 1] ? [process.argv[i + 1]] : undefined;
  const prisma = new PrismaClient();
  try {
    const rows = await observeDealsAfterFirstTouch(prisma, hubspotOpportunityReads, { now: new Date(), accounts });
    if (rows.length === 0) console.log('No GAP-touched accounts yet (no Gmail-proven GAP send in the ledger).');
    for (const r of rows) {
      if (r.status === 'unknown') {
        console.log(`${r.accountName}: first touch ${r.firstTouchAt.slice(0, 10)} | UNKNOWN (${r.reason})`);
        continue;
      }
      const w = r.windows.map((x) => `${x.days}d ${x.closed ? 'closed' : 'open'}: ${x.deals.length} deal(s)${x.deals.length ? ` [${x.deals.map((d) => `${d.name ?? d.id} +${d.daysAfterFirstTouch}d`).join('; ')}]` : ''}`).join(' | ');
      console.log(`${r.accountName}: first touch ${r.firstTouchAt.slice(0, 10)} | ${w} | ${r.dealsBeforeFirstTouch} deal(s) existed before`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
