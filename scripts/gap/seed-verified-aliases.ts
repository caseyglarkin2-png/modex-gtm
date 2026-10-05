/**
 * Seed the VERIFIED banner and subsidiary aliases the owner-resolution dogfood found missing (enterprise graph,
 * 2026-10-05). Each row carries the public source that proves the relationship; nothing here is inferred.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/seed-verified-aliases.ts            # dry run (default): prints what would happen
 *   npx tsx --env-file=<.env.local> scripts/gap/seed-verified-aliases.ts --apply    # writes through confirmAlias
 *
 * Idempotent: a row that already exists answers ALREADY_MATCHED and writes nothing. Refuses to run when any named
 * account row is missing (the alias table has a foreign key to the account; a typo must not create a stray row
 * elsewhere). Writes go through confirmAlias only: source 'manual', created_by the actor below, one
 * account.alias_confirmed audit row per created alias with the evidence URL. No HubSpot write, no Apollo, no
 * account created. HUBSPOT_ACCESS_TOKEN is removed from the environment before anything loads.
 */
delete process.env.HUBSPOT_ACCESS_TOKEN;

import { PrismaClient } from '@prisma/client';
import { confirmAlias } from '../../src/lib/gap/people/alias-review';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';

const ACTOR = 'who-truth:seed-verified-aliases';

interface SeedRow {
  alias: string;
  accountName: string;
  evidence: string[];
}

/** Verified 2026-10-05. The URL is the evidence; the sentence says what it proves. */
export const VERIFIED_ALIASES: readonly SeedRow[] = [
  { alias: 'Central Market', accountName: 'H-E-B', evidence: ['Central Market is an H-E-B-owned banner: https://en.wikipedia.org/wiki/Central_Market_(Texas)'] },
  { alias: 'King Soopers', accountName: 'Kroger', evidence: ["King Soopers is Kroger's Colorado division since the 1999 Dillon merger: https://en.wikipedia.org/wiki/King_Soopers"] },
  { alias: 'City Market', accountName: 'Kroger', evidence: ["City Market is Kroger's Colorado division since the 1999 Dillon merger: https://en.wikipedia.org/wiki/City_Market_(US_grocery_store_chain)"] },
  { alias: 'SDR Distribution', accountName: 'NFI Industries', evidence: ['NFI acquired SDR Distribution Services in 2023: https://www.fleetowner.com/news/article/21264191/nfi-acquires-canadian-3pl-provider-sdr-distribution-services'] },
  { alias: 'SDR Distribution Services', accountName: 'NFI Industries', evidence: ['NFI acquired SDR Distribution Services in 2023: https://www.fleetowner.com/news/article/21264191/nfi-acquires-canadian-3pl-provider-sdr-distribution-services'] },
  { alias: 'NFI SDR Distribution Services', accountName: 'NFI Industries', evidence: ['NFI acquired SDR Distribution Services in 2023: https://www.fleetowner.com/news/article/21264191/nfi-acquires-canadian-3pl-provider-sdr-distribution-services'] },
];

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log(`seed-verified-aliases: ${apply ? 'APPLY' : 'DRY RUN'} (${VERIFIED_ALIASES.length} rows, actor ${ACTOR})`);

  // Every account row must exist before a single write: a missing row is a refusal, not a skip.
  const names = [...new Set(VERIFIED_ALIASES.map((r) => r.accountName))];
  const present = new Set(((await prisma.account.findMany({ where: { name: { in: names } }, select: { name: true } })) as Array<{ name: string }>).map((a) => a.name));
  const missing = names.filter((n) => !present.has(n));
  if (missing.length) {
    console.error(`REFUSED: account row missing for ${missing.map((m) => `"${m}"`).join(', ')}. Nothing written.`);
    process.exitCode = 1;
    return;
  }

  let failed = 0;
  for (const row of VERIFIED_ALIASES) {
    const key = normalizeCompanyName(row.alias);
    const existing = (await prisma.gapAccountAlias.findUnique({ where: { normalized_alias: key }, select: { account_name: true, source: true, created_by: true } })) as { account_name: string; source: string; created_by: string } | null;
    const state = !existing ? 'would create' : existing.account_name === row.accountName ? `already an alias (${existing.source}, ${existing.created_by})` : `CONFLICT: already maps to ${existing.account_name}`;
    if (!apply) {
      console.log(`  ${row.alias} -> ${row.accountName}: ${state}`);
      continue;
    }
    const r = await confirmAlias(prisma, { accountName: row.accountName, alias: row.alias, actor: ACTOR, now, evidence: row.evidence });
    if (r.ok) console.log(`  ${row.alias} -> ${row.accountName}: ${r.status}${r.status === 'CREATED' ? ` (alias ${r.id}, audit ${r.auditId})` : ' (nothing written)'}`);
    else {
      failed += 1;
      console.log(`  ${row.alias} -> ${row.accountName}: REFUSED ${r.reason}${r.detail ? ` (${r.detail})` : ''}`);
    }
  }
  if (failed) process.exitCode = 1;
  console.log(apply ? `done: ${VERIFIED_ALIASES.length - failed} ok, ${failed} refused. HubSpot not written; no account created.` : 'dry run: nothing written. Re-run with --apply to write.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
