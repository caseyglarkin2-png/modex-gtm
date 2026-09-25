/**
 * GAP OS dogfood follow-up: create the Walmart enterprise Account row.
 *
 * Owner decision (Casey, 2026-09-24): "Walmart Distribution Center" is NOT
 * the canonical enterprise account. The canonical account is "Walmart Inc."
 * (domain walmart.com). HubSpot search confirmed exactly one deterministic
 * company for that domain (id 8536615003, name "Walmart"; the only other
 * candidate, "Walmart eCommerce Mexico", is walmart.com.mx, a different
 * domain -- not a match).
 *
 * This creates a NEW Account row (minimal, honest fields, following the
 * existing "Unknown vertical" auto-triage convention used elsewhere in this
 * table) and links it deterministically. It does NOT touch, merge, or
 * delete "Walmart Distribution Center" (id 674) -- that stays a separate,
 * untouched operational/site-style account.
 */
import { PrismaClient } from '@prisma/client';
import { registerAlias } from '../../src/lib/gap/identity/service';

const prisma = new PrismaClient();

const WALMART_INC_NAME = 'Walmart Inc.';
const HUBSPOT_COMPANY_ID = '8536615003';
const DOMAIN = 'walmart.com';

async function main() {
  const existing = await prisma.account.findUnique({ where: { name: WALMART_INC_NAME } });
  if (existing) {
    console.log(`SKIP: ${WALMART_INC_NAME} already exists (id ${existing.id})`);
    return;
  }
  const distCenter = await prisma.account.findUnique({ where: { name: 'Walmart Distribution Center' } });
  if (!distCenter) {
    console.log('ABORT: "Walmart Distribution Center" not found; refusing (this script assumes it exists and is left untouched)');
    return;
  }

  const account = await prisma.account.create({
    data: {
      name: WALMART_INC_NAME,
      rank: 1000,
      vertical: 'Retail',
      hubspot_company_id: HUBSPOT_COMPANY_ID,
      source: 'gap_dogfood_identity_bootstrap',
      notes: `Created for GAP OS identity resolution (2026-09-24). HubSpot company ${HUBSPOT_COMPANY_ID}, domain ${DOMAIN}. Distinct from "Walmart Distribution Center" (id ${distCenter.id}), which is untouched.`,
    },
  });
  console.log(`CREATED Account ${WALMART_INC_NAME} (id ${account.id}), hubspot_company_id=${HUBSPOT_COMPANY_ID}`);

  const canonicalCompany = await prisma.canonicalCompany.upsert({
    where: { company_key: `domain:${DOMAIN}` },
    update: {},
    create: {
      id: `cc_walmart_${DOMAIN.replace(/\./g, '_')}`,
      company_key: `domain:${DOMAIN}`,
      source: 'gap_dogfood_identity_bootstrap',
      hubspot_company_id: HUBSPOT_COMPANY_ID,
      domain: DOMAIN,
      primary_account_name: WALMART_INC_NAME,
      status: 'resolved',
    },
  });
  console.log(`CanonicalCompany upserted: ${canonicalCompany.id}`);

  const link = await prisma.canonicalAccountLink.upsert({
    where: { account_name: WALMART_INC_NAME },
    update: { canonical_company_id: canonicalCompany.id, status: 'resolved' },
    create: { account_name: WALMART_INC_NAME, canonical_company_id: canonicalCompany.id, status: 'resolved' },
  });
  console.log(`CanonicalAccountLink upserted: account_name=${link.account_name} -> ${link.canonical_company_id}`);

  const alias = await registerAlias(prisma, {
    alias: 'Walmart',
    accountName: WALMART_INC_NAME,
    source: 'manual',
    createdBy: 'gap-dogfood-overnight',
  });
  console.log(`Alias "Walmart" -> ${WALMART_INC_NAME}: ${alias.status} (id=${alias.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
