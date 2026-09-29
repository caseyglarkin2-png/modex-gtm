/**
 * ACCOUNT INTELLIGENCE DOGFOOD (Release H), READ ONLY against production: the brief, the motion and the
 * research plan for real accounts, plus the candidate card and the creation check for a company GAP does not
 * know yet. No writes, no drafts, no sends (the creation check and HubSpot are reads).
 *
 *   npx tsx scripts/gap/dogfood-intel.ts "PepsiCo|General Mills|Kroger" [--candidate "Harbor Foods Group"]
 */
import { PrismaClient } from '@prisma/client';
import { loadAccountInputs } from '../../src/lib/gap/account-intel/load';
import { buildAccountBrief } from '../../src/lib/gap/account-intel/build';
import { loadResearchHistory, planResearch } from '../../src/lib/gap/account-intel/orchestrate';
import { accountCreationCheck, loadCandidateQueue } from '../../src/lib/gap/entity/candidates';
import { normalizeCompanyName } from '../../src/lib/gap/identity/normalize';

const clip = (s: string | null | undefined, n = 220) => (s ? (s.length > n ? `${s.slice(0, n - 1)}…` : s) : 'none');

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();
  const names = (process.argv[2] ?? '').split('|').filter(Boolean);
  const ci = process.argv.indexOf('--candidate');
  const candidate = ci >= 0 ? process.argv[ci + 1] : null;
  try {
    for (const name of names) {
      const i = await loadAccountInputs(prisma, name, now, { live: true });
      if (!i) {
        console.log(`\n## ${name}\nNOT FOUND`);
        continue;
      }
      const b = buildAccountBrief(i, now);
      const plan = planResearch(b, await loadResearchHistory(prisma, b.accountName, now).catch(() => []), now);
      const g = b.glance;
      console.log(`\n## ${b.accountName}`);
      console.log(`- MOTION: ${g.motion}`);
      console.log(`- NEXT ACTION: ${g.nextAction}`);
      console.log(`- STATE: ${g.icpState} | deal ${b.dealState}`);
      console.log(`- WHY NOW: ${clip(g.whyNow)}`);
      console.log(`- BEST FACT: ${clip(g.bestFact)}`);
      console.log(`- TOP HYPOTHESIS: ${clip(g.topHypothesis)}`);
      console.log(`- CURRENT TECH: ${clip(g.currentTech, 140)}`);
      console.log(`- WHO PROBABLY OWNS IT: ${g.likelyOwner}`);
      console.log(`- BIGGEST UNKNOWN: ${g.biggestUnknown}`);
      console.log(`- NEXT QUESTION: ${g.nextQuestion ?? 'none'}`);
      console.log(`- THESIS: ${b.thesis.status}; wrong if: ${b.thesis.wrongIf ?? 'not stated'}`);
      console.log(`- WHY NOT PURSUE: ${b.thesis.whyNotPursue.join(' | ') || 'none'}`);
      console.log(`- SECTIONS: ${Object.values(b.sections).map((s) => `${s.key}=${s.status}`).join(' ')}`);
      console.log(`- WEDGE: ${b.wedge.archetype ?? 'unknown'}${b.wedge.candidates[0] ? `; start ${b.wedge.candidates[0].name}` : ''}`);
      console.log(`- PLAN: ${plan.tasks.map((t) => `${t.section}:${t.provider}`).join(', ') || 'nothing'}; skipped ${plan.skipped.length}`);
      const refused = Object.values(b.sections).flatMap((s) => s.refused);
      if (refused.length) console.log(`- REFUSED STATEMENTS: ${refused.join(' | ')}`);
    }
    if (candidate) {
      const q = await loadCandidateQueue(prisma, { limit: 500, includeDecided: true });
      const c = q.find((x) => x.companyKey === normalizeCompanyName(candidate));
      console.log(`\n## Candidate: ${candidate}`);
      if (!c) console.log('not in the queue');
      else {
        console.log(`- VERDICT: ${c.verdict ?? 'not scouted'} (${c.entityType ?? '?'}) ${c.decision}`);
        console.log(`- WHY: ${c.why ?? 'none'} ${c.what ?? ''}`);
        console.log(`- NETWORK: ${c.network.map((n) => n.claim).join(' | ') || 'none cited'}`);
        console.log(`- FREIGHT: ${c.freight.map((n) => n.claim).join(' | ') || 'none cited'}`);
        console.log(`- RELATIONSHIP: ${c.people} via ${c.sources.join(', ')}`);
        console.log(`- UNKNOWN: ${c.unknowns.join('; ') || 'none listed'}`);
        const check = await accountCreationCheck(prisma, { name: c.company, company: c.company, domain: c.domain });
        console.log(`- CREATION CHECK (read only): ${JSON.stringify(check)}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
