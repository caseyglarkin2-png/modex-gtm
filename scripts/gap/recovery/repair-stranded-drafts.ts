/**
 * STRANDED-DRAFT REPAIR, DRY RUN ONLY (GAP OS execution recovery, R65 for the R64 repair, 2026-10-07).
 *
 *   DATABASE_URL=<database> npx tsx scripts/gap/recovery/repair-stranded-drafts.ts --dry-run [--json]
 *
 * Lists every stranded draft (a thesis left in draft with no story key, never superseded) and what the R11 proposal
 * service (src/lib/gap/story/draft-from-fact.ts) would do with it when the seller drafts from its fact: ADOPT it
 * (stamp the story key and continue the draft) or not, and why (the fact fails the service's checks now, another
 * thesis already holds the key, a newer unkeyed thesis for the same fact and person, no fact at all).
 *
 * It refuses to write, twice over: without --dry-run it exits 2 before reading anything, and the database client is
 * wrapped read-only (src/lib/gap/recovery/read-only.ts) so any write, raw SQL or transaction throws. It may read
 * production for the R64 release step; it prints the host and database name, never credentials. The adoption
 * itself runs through the service, never here.
 */
import { PrismaClient } from '@prisma/client';
import { planStrandedRepair } from '../../../src/lib/gap/recovery/stranded-drafts';
import { databaseLabel, readOnlyPrisma, strandedRepairCommand } from '../../../src/lib/gap/recovery/read-only';

async function main(): Promise<number> {
  const cmd = strandedRepairCommand(process.argv.slice(2));
  if (!cmd.ok) {
    console.error(cmd.message);
    return cmd.code;
  }
  const client = new PrismaClient();
  try {
    const plan = await planStrandedRepair(readOnlyPrisma(client), new Date());
    if (cmd.json) {
      console.log(JSON.stringify({ database: databaseLabel(process.env.DATABASE_URL), ...plan }, null, 2));
      return 0;
    }
    console.log(`Stranded-draft repair, DRY RUN (read only) on ${databaseLabel(process.env.DATABASE_URL)} at ${plan.checkedAt}`);
    console.log(`${plan.counts.stranded} stranded draft(s): ${plan.counts.adopt} the service would adopt, ${plan.counts.notAdopted} it would not.${plan.truncated ? ' More exist than this run reads (the oldest are listed).' : ''}`);
    for (const i of plan.items) {
      console.log('');
      console.log(`${i.verdict === 'adopt' ? 'ADOPT' : 'NOT ADOPTED'}  ${i.hypothesisId}  ${i.accountName}  ${i.person ?? `person ${i.personaId ?? 'none'}`}  family ${i.family}  ${i.ageDays} day(s) old`);
      if (i.factId) console.log(`  fact ${i.factId} (${i.factRole})${i.key ? `  key ${i.key}` : ''}`);
      console.log(`  ${i.why}`);
    }
    console.log('');
    console.log('Nothing was written. The adoption runs through the R11 proposal service (story/draft-from-fact.ts).');
    return 0;
  } finally {
    await client.$disconnect();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
