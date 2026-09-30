/**
 * RESEARCH BATCH: the same focused run DEEPEN starts (runEvidenceResearch, tagged as a deepen of one section), for a
 * list of accounts, sequentially. Writes only research artifacts (ResearchRun, verified EvidenceRecord, evidence
 * fact signals for Casey's judgment). Never a draft, a send, an approval or an account.
 *
 *   npx tsx scripts/gap/research-batch.ts "PepsiCo|General Mills" [--section catalysts] [--apply]
 *
 * Without --apply it lists what it would run (dry). Providers come from the environment (the paid Gemini key first).
 */
import { PrismaClient } from '@prisma/client';
import { runEvidenceResearch, failureClass } from '../../src/lib/gap/research/run';
import { DEEPEN_FOCUS } from '../../src/lib/gap/account-intel/orchestrate';

async function main() {
  const names = (process.argv[2] ?? '').split('|').filter(Boolean);
  const si = process.argv.indexOf('--section');
  const section = (si >= 0 ? process.argv[si + 1] : 'catalysts') as keyof typeof DEEPEN_FOCUS;
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  const total = { runs: 0, facts: 0, rejected: {} as Record<string, number> };
  try {
    for (const accountName of names) {
      const exists = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true } });
      if (!exists) {
        console.log(`- ${accountName}: not a GAP account (skipped)`);
        continue;
      }
      if (!apply) {
        console.log(`- would research ${accountName} (${section})`);
        continue;
      }
      const t = Date.now();
      const r = await runEvidenceResearch(prisma, { accountName, personaId: null, hypothesisId: null, problemFamily: null, decisionId: null, actor: 'gap-closeout-research', now: new Date(), focus: DEEPEN_FOCUS[section], context: { orchestrator: 'deepen', section }, seekCurrentness: false }).catch((e) => ({ error: String(e).slice(0, 160) }) as const);
      if ('error' in r) {
        console.log(`- ${accountName}: ERROR ${r.error}`);
        continue;
      }
      total.runs += 1;
      total.facts += r.facts.length;
      for (const x of r.rejected) total.rejected[failureClass(x.reason)] = (total.rejected[failureClass(x.reason)] ?? 0) + 1;
      console.log(`- ${accountName}: ${r.outcome}, ${r.facts.length} facts, ${r.rejected.length} rejected (${Math.round((Date.now() - t) / 1000)}s) | ${r.notes.filter((n) => /^(web|sources|alternate)/.test(n)).join(' ; ')}`);
      for (const f of r.facts) console.log(`    FACT: ${f.excerpt.slice(0, 170)} <${new URL(f.url).hostname.replace(/^www\./, '')}>`);
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`\nTOTAL: ${total.runs} runs, ${total.facts} verified facts; rejected ${JSON.stringify(total.rejected)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
