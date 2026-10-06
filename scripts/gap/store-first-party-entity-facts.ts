/**
 * Store the FIRST-PARTY facts behind the FedEx entity boundaries (UX-06, 2026-10-06) through the one research
 * contract that mints a verified fact (research/manual-fact.ts verifyPublicFact: re-fetch the page, find the exact
 * quote, dated, page names the account). Re-runnable: a source already registered is "created: false".
 *
 *   npx tsx scripts/gap/store-first-party-entity-facts.ts            # dry run: show what would be stored
 *   npx tsx scripts/gap/store-first-party-entity-facts.ts --apply    # verify at the source and store
 *
 * The entity-boundary rule itself (people/entity-boundary.ts) carries the same sources as a reviewed constant, so the
 * story and the stack say "verified" from the constant even when the research contract refuses the quote as a
 * non-physical-network fact (a corporate sale is not a yard change; it is provenance for a boundary, not outreach).
 */
import { PrismaClient } from '@prisma/client';
import { verifyPublicFact } from '../../src/lib/gap/research/manual-fact';
import { FIRST_PARTY_ENTITY_FACTS } from '../../src/lib/gap/people/entity-boundary';

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    for (const f of FIRST_PARTY_ENTITY_FACTS) {
      console.log(`${f.accountName} | ${f.publishedAt} | ${f.url}\n  "${f.quote}"`);
      if (!apply) continue;
      const r = await verifyPublicFact(prisma, { accountName: f.accountName, personaId: null, url: f.url, title: f.title, excerpt: f.quote, publishedAt: new Date(f.publishedAt), actor: 'ux-06 first-party entity facts', now: new Date() });
      console.log(`  -> ${r.verified ? 'VERIFIED' : `not verified (${r.reason})`} signal ${r.signalId} created=${r.created} run=${r.runId}`);
    }
    if (!apply) console.log('dry run: nothing written (pass --apply)');
  } finally {
    await prisma.$disconnect();
  }
}

main();
