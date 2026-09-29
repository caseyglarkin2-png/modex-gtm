/**
 * MMYQB RECOVERY (GAP Account Intelligence, Release G): Scout the companies a work source brought in that GAP
 * does not know yet, and report the potential YardFlow buyers (fit from operations, never the label). Company-level only; nothing is created,
 * mapped, drafted or sent (ADD / MAP stay Casey's clicks on /gap/candidates).
 *
 *   npx tsx scripts/gap/scout-cohort.ts --source <workSourceId> [--limit 40] [--apply] [--report docs/gap/mmyqb-recovery-latest.md]
 *
 * Without --apply it lists what it WOULD scout (no web calls, no writes). With --apply it runs Scout on the
 * open, unjudged companies (a genuinely obvious name-rule NOT FIT costs nothing; a 3PL or carrier name IS checked), most people
 * first, within Scout's own daily cap, then writes the report: companies and counts only, never people.
 * --report without --apply writes the report from what is already known (read only).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadCandidateQueue, scoutCandidate, type QueueItem } from '../../src/lib/gap/entity/candidates';
import { ENTITY_LABEL, FIT_LABEL } from '../../src/lib/gap/entity/fit';

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const sourceId = arg('source');
const limit = Number(arg('limit') ?? 40);
const apply = process.argv.includes('--apply');
const reportPath = arg('report');
if (!sourceId) {
  console.error('usage: --source <workSourceId> [--limit N] [--apply] [--report path]');
  process.exit(2);
}

const TYPE: Record<string, string> = ENTITY_LABEL;

function line(c: QueueItem): string {
  return [
    `### ${c.company}`,
    `- COMPANY: ${c.company}${c.domain ? ` (${c.domain})` : ''}${c.entityType ? `, ${TYPE[c.entityType] ?? c.entityType}` : ''}${c.what ? `: ${c.what}` : ''}`,
    `- YARDFLOW FIT: ${c.verdict ? FIT_LABEL[c.verdict as keyof typeof FIT_LABEL] : 'not judged'}: ${c.why ?? 'not scouted'}`,
    `- NETWORK EVIDENCE: ${c.network.length ? c.network.map((n) => `${n.claim} (${n.url})`).join('; ') : 'none cited'}`,
    `- FREIGHT EVIDENCE: ${c.freight.length ? c.freight.map((n) => `${n.claim} (${n.url})`).join('; ') : 'none cited'}`,
    `- RELATIONSHIP SOURCE: ${c.people} ${c.people === 1 ? 'person' : 'people'} via ${c.sources.join(', ')} (context, never evidence or consent)`,
    `- WHAT WE DON'T KNOW: ${c.unknowns.length ? c.unknowns.slice(0, 4).join('; ') : 'who runs yard operations; the yard process; the current system'}`,
    `- DECISION: ADD / MAP / RESEARCH MORE / IGNORE on /gap/candidates (Casey's click; nothing was created)`,
  ].join('\n');
}

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();
  try {
    const before = await loadCandidateQueue(prisma, { workSourceId: sourceId, limit: 500 });
    const toScout = before.filter((c) => (!c.scouted || (process.argv.includes('--retry-empty') && !c.verdict)) && !(c.verdict === 'NOT_FIT' && !c.scouted)).sort((a, b) => b.people - a.people).slice(0, limit);
    console.log(`${before.length} open companies; ${before.filter((c) => c.verdict === 'NOT_FIT' && !c.scouted).length} not a fit by name (free); ${toScout.length} to scout${apply ? '' : ' (dry run: nothing called or written)'}`);
    let done = 0;
    if (!apply && !reportPath) {
      for (const c of toScout) console.log(`  would scout: ${c.company} (${c.people})`);
      return;
    }
    // With --report and no --apply: report what is already known (no web calls, no candidate writes).
    for (const c of apply ? toScout : []) {
      const r = await scoutCandidate(prisma, { company: c.company, actor: 'gap-cohort-scout', now: new Date(), force: c.scouted, hint: c.titles.length ? `people there: ${c.titles.join(', ')}` : undefined });
      if ('refused' in r) {
        console.log(`  ${r.refused}: ${c.company}${r.why ? ` (${r.why})` : ''}`);
        if (r.refused === 'daily_cap' || r.refused === 'attempt_cap') break;
        // The web quota is per minute: wait it out and move on (this company stays unscouted).
        if (r.refused === 'web_failed') await new Promise((ok) => setTimeout(ok, 30_000));
        continue;
      }
      done += 1;
      // Stay under the web search quota (5 a minute on the current key).
      await new Promise((ok) => setTimeout(ok, 13_000));
      console.log(`  ${r.verdict.padEnd(12)} ${c.company}${r.entityType ? ` (${r.entityType})` : ''}`);
    }
    const after = await loadCandidateQueue(prisma, { workSourceId: sourceId, limit: 500 });
    const count = (v: string) => after.filter((c) => c.verdict === v).length;
    const summary = `Scouted ${done} this run. Open companies: ${after.length}. DIRECT BUYER ${count('DIRECT_BUYER')}, POTENTIAL ${count('POTENTIAL_DIRECT_BUYER')}, UNKNOWN ${count('UNKNOWN')} (of which ambiguous identity ${after.filter((c) => c.ambiguous).length}), PARTNER ${count('PARTNER')}, NOT FIT ${count('NOT_FIT')}, not judged yet ${after.filter((c) => !c.verdict).length}.`;
    console.log(summary);
    if (reportPath) {
      const byType = new Map<string, number>();
      for (const c of after) byType.set(c.entityType ? TYPE[c.entityType] ?? c.entityType : c.ambiguous ? 'ambiguous' : 'unknown', (byType.get(c.entityType ? TYPE[c.entityType] ?? c.entityType : c.ambiguous ? 'ambiguous' : 'unknown') ?? 0) + 1);
      const icp = after.filter((c) => c.verdict === 'DIRECT_BUYER' || c.verdict === 'POTENTIAL_DIRECT_BUYER');
      const out = [
        '# MMYQB recovery: potential YardFlow buyers',
        '',
        `<!-- verified:${now.toISOString().slice(0, 10)} -->`,
        '',
        `Run ${now.toISOString()} over work source ${sourceId}. ${summary}`,
        '',
        `Classified: ${[...byType.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}.`,
        '',
        'Company-level only (no people named). Nothing was created, mapped, drafted or sent: every ADD / MAP / RESEARCH MORE / IGNORE is Casey\'s click on /gap/candidates, and ADD runs the duplicate check first. Scout claims are cited leads, never verified facts.',
        '',
        ...icp.map(line),
        '',
      ].join('\n');
      const p = path.join(process.cwd(), reportPath);
      mkdirSync(path.dirname(p), { recursive: true });
      writeFileSync(p, out);
      console.log(`report: ${reportPath}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
