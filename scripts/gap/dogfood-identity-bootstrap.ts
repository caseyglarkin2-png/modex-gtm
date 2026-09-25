/**
 * GAP OS dogfood, Phase 2: identity bootstrap writes against production.
 *
 * Every write here is deterministic: one real HubSpot company (confirmed by
 * hand via HubSpot MCP search, see docs/gap/dogfood-identity-after.md) maps
 * to exactly one existing Account row, with no near-duplicate Account row
 * for the same normalized name. Anything with more than one candidate on
 * either side (HubSpot or Account) is skipped and logged, never guessed.
 *
 * Two write kinds:
 *   1. Account.hubspot_company_id backfill (tier A becomes reachable for
 *      that account going forward).
 *   2. GapAccountAlias (ticker symbol -> existing canonical account name),
 *      via the real registerAlias() so CONFLICT reporting (D0) applies.
 *
 * No Account created, merged, or deleted. No HubSpot write. No deal touched.
 */
import { PrismaClient } from '@prisma/client';
import { registerAlias } from '../../src/lib/gap/identity/service';

const prisma = new PrismaClient();

// account name (exact, as it exists in production) -> confirmed HubSpot company id
const HUBSPOT_ID_BACKFILL: Array<{ accountName: string; hubspotCompanyId: string }> = [
  { accountName: 'Unfi', hubspotCompanyId: '54174684591' },
  { accountName: 'Niagara Bottling', hubspotCompanyId: '54697231119' },
  { accountName: 'Amazon', hubspotCompanyId: '8981959027' },
  { accountName: 'PepsiCo', hubspotCompanyId: '56630459299' },
  { accountName: 'John Deere', hubspotCompanyId: '57227349549' },
  { accountName: 'The Home Depot', hubspotCompanyId: '56632255130' },
  { accountName: 'Odfl', hubspotCompanyId: '55554494372' },
  { accountName: 'UPS', hubspotCompanyId: '55554493820' },
  { accountName: 'Kraft Heinz', hubspotCompanyId: '55354356550' },
  { accountName: 'XPO', hubspotCompanyId: '56632192123' },
  { accountName: 'General Mills', hubspotCompanyId: '45015289875' },
  { accountName: 'Kroger', hubspotCompanyId: '8536615981' },
];

// ticker symbol (the raw Pounce account_name) -> existing, unambiguous canonical Account name
const TICKER_ALIASES: Array<{ ticker: string; accountName: string }> = [
  { ticker: 'LOW', accountName: "Lowe's" },
  { ticker: 'GXO', accountName: 'GXO Logistics' },
  { ticker: 'PG', accountName: 'Procter & Gamble' },
  { ticker: 'MATX', accountName: 'Matson, Inc.' },
  { ticker: 'ARCB', accountName: 'ArcBest' },
  { ticker: 'JBHT', accountName: 'J.B. Hunt' },
  { ticker: 'CAG', accountName: 'Conagra Brands Inc.' },
];

async function main() {
  console.log('--- Account.hubspot_company_id backfill ---');
  for (const { accountName, hubspotCompanyId } of HUBSPOT_ID_BACKFILL) {
    const existing = await prisma.account.findUnique({ where: { name: accountName }, select: { hubspot_company_id: true } });
    if (!existing) {
      console.log(`SKIP ${accountName}: no Account row found (was this name renamed since the audit?)`);
      continue;
    }
    if (existing.hubspot_company_id) {
      console.log(`SKIP ${accountName}: already has hubspot_company_id=${existing.hubspot_company_id}`);
      continue;
    }
    await prisma.account.update({ where: { name: accountName }, data: { hubspot_company_id: hubspotCompanyId } });
    console.log(`WROTE ${accountName} -> hubspot_company_id=${hubspotCompanyId}`);
  }

  console.log('\n--- GapAccountAlias (ticker -> canonical account) ---');
  for (const { ticker, accountName } of TICKER_ALIASES) {
    const account = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } });
    if (!account) {
      console.log(`SKIP ${ticker} -> ${accountName}: target Account row not found`);
      continue;
    }
    const result = await registerAlias(prisma, {
      alias: ticker,
      accountName,
      source: 'manual',
      createdBy: 'gap-dogfood-overnight',
    });
    console.log(`${ticker} -> ${accountName}: ${result.status} (id=${result.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
