/**
 * SCALE DOGFOOD (2026-09-29), READ ONLY against production: the canonical Account Intelligence Brief for a
 * portfolio of accounts, every section's status and lead statement, the discovery plan, the wedge, the research
 * plan, and, where a thesis exists, the six-line card (KNOW / THINK / LEARN / WHY YOU / HISTORY / WRONG IF) the
 * action pack would show. No writes, no drafts, no sends (HubSpot and the ledgers are reads).
 *
 *   npx tsx scripts/gap/dogfood-scale.ts "PepsiCo|General Mills|Kroger" > out.md
 */
import { PrismaClient } from '@prisma/client';
import { loadAccountInputs } from '../../src/lib/gap/account-intel/load';
import { buildAccountBrief } from '../../src/lib/gap/account-intel/build';
import { loadResearchHistory, planResearch } from '../../src/lib/gap/account-intel/orchestrate';
import { getHypothesis } from '../../src/lib/gap/hypothesis/service';
import { buildBrief, loadBriefHistory } from '../../src/lib/gap/execution/six-line-brief';
import { contradictedFactIds } from '../../src/lib/gap/research/conflicts';
import { loadAngles, suggestAngle } from '../../src/lib/gap/motion/persona-angle';
import { loadRelationshipContext } from '../../src/lib/gap/intake/context';
import { firstNameOf } from '../../src/lib/gap/sequence/render';

const clip = (s: string | null | undefined, n = 240) => (s ? (s.length > n ? `${s.slice(0, n - 1)}…` : s) : 'none');

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();
  const names = (process.argv[2] ?? '').split('|').filter(Boolean);
  try {
    for (const name of names) {
      const i = await loadAccountInputs(prisma, name, now, { live: true }).catch((e) => (console.log(`\n## ${name}\nLOAD ERROR ${String(e).slice(0, 200)}`), null));
      if (!i) {
        console.log(`\n## ${name}\nNOT FOUND`);
        continue;
      }
      const b = buildAccountBrief(i, now);
      const plan = planResearch(b, await loadResearchHistory(prisma, b.accountName, now).catch(() => []), now);
      const g = b.glance;
      console.log(`\n## ${b.accountName}`);
      console.log(`- IDENTITY/FIT: ${g.fit} | family: ${g.family}`);
      console.log(`- MOTION: ${g.motion}`);
      console.log(`- NEXT ACTION: ${g.nextAction}`);
      console.log(`- DEAL: ${b.dealState} | COMMERCIAL: ${clip(g.commercialState, 160)} | RELATIONSHIP: ${clip(g.relationship, 160)}`);
      console.log(`- NETWORK: ${clip(g.network, 200)}`);
      console.log(`- FREIGHT: ${clip(g.freight, 200)}`);
      console.log(`- WHY NOW: ${clip(g.whyNow)}`);
      console.log(`- BEST FACT: ${clip(g.bestFact)}`);
      console.log(`- TOP HYPOTHESIS: ${clip(g.topHypothesis)}`);
      console.log(`- CURRENT TECH: ${clip(g.currentTech, 160)}`);
      console.log(`- OWNER: ${clip(g.likelyOwner, 160)}`);
      console.log(`- BIGGEST UNKNOWN: ${clip(g.biggestUnknown, 160)}`);
      console.log(`- THESIS: ${b.thesis.status}; wrong if: ${clip(b.thesis.wrongIf, 160)}`);
      console.log(`- WHY NOT: ${b.thesis.whyNotPursue.join(' | ') || 'none'}`);
      for (const s of Object.values(b.sections)) {
        const lead = s.statements[0];
        console.log(`  - [${s.key}] ${s.status}${lead ? `: ${clip(lead.text, 170)} (${lead.truth})` : ''}${s.statements.length > 1 ? ` (+${s.statements.length - 1})` : ''}${s.unknowns.length ? ` | unknown: ${clip(s.unknowns.join('; '), 120)}` : ''}`);
      }
      console.log(`- DISCOVERY: ${b.discovery.slice(0, 3).map((q) => `${q.type}: ${q.question}`).join(' || ') || 'none'}`);
      console.log(`- WEDGE: ${b.wedge.archetype ?? 'unknown'}${b.wedge.candidates[0] ? `; start ${b.wedge.candidates[0].name}: ${clip(b.wedge.candidates[0].whyPilot, 140)}` : `; ${clip(b.wedge.note, 140)}`}`);
      console.log(`- PLAN: ${plan.tasks.map((t) => `${t.section}:${t.provider}`).join(', ') || 'nothing'}`);
      const truth: Record<string, number> = {};
      for (const s of Object.values(b.sections)) for (const st of s.statements) truth[st.truth] = (truth[st.truth] ?? 0) + 1;
      const refused = Object.values(b.sections).flatMap((s) => s.refused);
      console.log(`- TRUTH MIX: ${JSON.stringify(truth)}${refused.length ? ` | REFUSED ${refused.length}` : ''}`);

      // The six-line card for the lead thesis, as the action pack builds it.
      const top = b.hypotheses.find((h) => h.grounded) ?? b.hypotheses[0];
      if (!top) continue;
      const h = await getHypothesis(prisma, top.id).catch(() => null);
      if (!h) continue;
      const persona = h.primary_persona_id ? await prisma.persona.findUnique({ where: { id: h.primary_persona_id }, select: { id: true, name: true, title: true, email: true } }) : null;
      const [angles, history, contradicted, context] = await Promise.all([
        persona ? loadAngles(prisma, [persona.id]).catch(() => new Map()) : Promise.resolve(new Map()),
        loadBriefHistory(prisma, { accountName: h.account_name, personaId: persona?.id ?? null, email: persona?.email ?? null, sent: [], now }),
        contradictedFactIds(prisma, h.account_name, now).catch(() => null),
        loadRelationshipContext(prisma, { personaId: persona?.id ?? null, accountName: h.account_name }).catch(() => []),
      ]);
      const six = buildBrief({
        hypothesis: h,
        firstName: firstNameOf(persona?.name ?? null),
        angle: persona ? ((angles as Map<number, { text: string }>).get(persona.id)?.text ?? null) : null,
        suggestedAngle: persona ? suggestAngle({ title: persona.title ?? null, personaKey: null, accountName: h.account_name }) : null,
        history,
        now,
        contradicted,
        context,
        account: { accountName: b.accountName, motion: b.motion, motionLine: g.motion, firstDiscoveryQuestion: b.discovery[0]?.question ?? null },
      });
      console.log(`- SIX-LINE (${h.status}, ${persona ? `${persona.name}, ${persona.title ?? 'no title'}` : 'no primary person'}):`);
      console.log(`  KNOW: ${six.know.fact ? clip(six.know.fact.quote, 200) : `none: ${six.know.reason}`}`);
      console.log(`  THINK: ${clip(six.think, 200)}`);
      console.log(`  LEARN: ${clip(six.learn, 200)}`);
      console.log(`  WHY YOU: ${six.whyYou ? `${six.whyYou.owned ? 'owned' : 'suggested'}: ${clip(six.whyYou.text, 160)}` : 'none'}`);
      console.log(`  HISTORY (${six.historyState}): ${clip(six.history.join(' / '), 240)}`);
      console.log(`  WRONG IF: ${clip(six.wrongIf, 200)}`);
      if (six.context.length) console.log(`  CONTEXT: ${clip(six.context.join(' / '), 200)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
