/**
 * GAP SEMANTIC DOGFOOD (read-only): each account on the truth vocabulary's levels.
 *
 *   npx tsx scripts/gap/source-aperture-dogfood.ts [--out docs/gap/semantic-dogfood-latest.md] [Account ...]
 *
 * Per account: SOURCES / SIGNALS, CLAIMS checked, VERIFIED FACTS (claims verified at their source), OUTREACH
 * EVIDENCE (the eligible subset), HYPOTHESES (never facts), BUYER TRUTH (human-confirmed buyer words) and the
 * CURRENT MOTION, plus every source with its two axes. Nothing is written to the database.
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { loadAccountSources } from '../../src/lib/gap/sources/account-sources';
import { ageLabel, claimLine } from '../../src/lib/gap/sources/source-copy';
import { loadAccountInputs } from '../../src/lib/gap/account-intel/load';
import { buildAccountBrief } from '../../src/lib/gap/account-intel/build';

const DEFAULT = ['PepsiCo', 'General Mills', 'Walmart Inc.', 'Tyson Foods', 'Kroger', 'FedEx', 'NFI Industries', 'Hormel Foods', 'GXO Logistics', 'Crowley'];

async function main() {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  const out = outAt >= 0 ? args[outAt + 1] : null;
  const wanted = args.filter((a, i) => !a.startsWith('--') && (outAt < 0 || i !== outAt + 1));
  const prisma = new PrismaClient();
  const now = new Date();
  const lines: string[] = [`# GAP semantic dogfood (${now.toISOString().slice(0, 16)}Z, read-only)`, ''];
  lines.push('| Account | Sources / signals | Claims checked (verified / could not / contradicted) | Verified facts | Outreach evidence | Hypotheses (not facts) | Buyer truth (confirmed) | Current motion |');
  lines.push('|---|---|---|---|---|---|---|---|');
  const details: string[] = [];
  for (const name of wanted.length ? wanted : DEFAULT) {
    // A Scout candidate (not an account yet) still has sources: its Scout citations and verdict.
    const exists = await prisma.account.findFirst({ where: { name }, select: { name: true } });
    const candidate = exists ? null : await prisma.gapAccountCandidate.findFirst({ where: { company: name }, select: { verdict: true, decision: true, entity_type: true } });
    if (!exists && !candidate) {
      lines.push(`| ${name} | not an account or candidate | | | | | | |`);
      continue;
    }
    const [s, inputs] = await Promise.all([loadAccountSources(prisma, name, { now }), exists ? loadAccountInputs(prisma, name, now, { live: true }).catch(() => null) : Promise.resolve(null)]);
    const brief = inputs ? buildAccountBrief(inputs, now) : null;
    const claims = s.items.flatMap((i) => [{ v: i.verification }, ...(i.alsoOnPage ?? []).map((a) => ({ v: a.verification }))]);
    const checked = claims.filter((c) => c.v !== 'UNCHECKED' && c.v !== 'VERIFYING');
    const count = (v: string) => checked.filter((c) => c.v === v).length;
    const hyps = inputs?.hypotheses ?? [];
    const bids = inputs?.bids ?? [];
    lines.push(
      `| ${name} | ${s.sourcesFound} | ${checked.length} (${count('VERIFIED_AT_SOURCE')} / ${count('COULD_NOT_VERIFY')} / ${count('CONTRADICTED')}) | ${s.claimsVerified} | ${s.outreachEligible} | ${hyps.length} | ${bids.length} | ${candidate ? `candidate: Scout ${candidate.verdict ?? 'no verdict'} (${candidate.entity_type ?? 'type unknown'}), decision ${candidate.decision}` : (brief?.glance.motion ?? 'unknown').slice(0, 80)} |`,
    );
    details.push(`## ${name}`, '', `Sources / signals: ${s.sourcesFound} · Verified at source: ${s.claimsVerified} claims · Eligible as outreach evidence: ${s.outreachEligible}${s.setAside ? ` · set aside ${s.setAside}` : ''}${s.dropped ? ` · not shown ${s.dropped}` : ''}`, '');
    for (const i of s.items) {
      details.push(`- **${i.publisher}** · ${ageLabel(i.publishedAt, i.ageDays)}${i.publishedAt && !i.freshTrigger ? ' · NOT A FRESH TRIGGER' : ''} · ${claimLine(i)}${i.attribution ? ` · claim made by ${i.attribution}` : ''} · ${i.origin}`);
      details.push(`  ${i.title ?? '(no title)'} <${i.link}>${i.excerpt && i.excerptKind === 'verbatim' ? `\n  > ${i.excerpt.slice(0, 220)}` : ''}`);
      for (const a of i.alsoOnPage ?? []) details.push(`  - also on this page: ${claimLine(a)}${a.attribution ? ` · claim made by ${a.attribution}` : ''}: "${a.excerpt.slice(0, 160)}"`);
    }
    details.push('');
  }
  await prisma.$disconnect();
  const text = [...lines, '', ...details].join('\n');
  if (out) writeFileSync(out, text);
  process.stdout.write(text + '\n');
}

main().catch((e) => {
  process.stderr.write(`${e instanceof Error ? e.message.split('\n')[0] : String(e)}\n`);
  process.exit(1);
});
