/**
 * OPERATOR CONTACT AUDIT (seller dogfood correction, 2026-10-04). READ ONLY by default, against production: for each
 * account, the direct freight operator GAP would lead with, the transportation tech / transformation contact, the
 * sponsor, the site operator, what is missing, and whether an Apollo credit could change the decision. Built from the
 * SAME loader and buyer map the account page uses (people/operator-audit.ts): a view, never a second authority.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/operator-contact-audit.ts "PepsiCo" "World Market" "Sub-Zero"
 *     --research   for an account with no direct operator, run the existing grounded contact research (Gemini +
 *                  Google Search; no Apollo) and print the source-backed finds. Still writes nothing.
 *     --stage      with --research: stage each sourced, unknown DIRECT operator as an AccountContactCandidate
 *                  (state 'staged') for Casey to review and promote. Never a Persona, a HubSpot contact, a send or
 *                  an enrollment.
 *     --json       print the audits as JSON.
 */
import { PrismaClient } from '@prisma/client';
import { loadAccountView, accountSlug } from '../../src/lib/gap/account-intel/load';
import { operatorAudit, stageableResearch, type AuditPerson, type OperatorAudit } from '../../src/lib/gap/people/operator-audit';
import { normalizeName, normalizeTitle } from '../../src/lib/contact-standard';
import type { ResearchedContact } from '../../src/lib/discovery/research';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const names = args.filter((a) => !a.startsWith('--'));
const line = (label: string, p: AuditPerson | null) => console.log(`  ${label.padEnd(24)} ${p ? `${p.name} | ${p.title ?? '(no title)'} | ${p.geo}${p.division ? ` | ${p.division}` : ''} | ${p.source}` : 'none'}`);

async function resolve(prisma: PrismaClient, q: string): Promise<string | null> {
  const exact = await prisma.account.findFirst({ where: { name: { equals: q, mode: 'insensitive' } }, select: { name: true } });
  if (exact) return exact.name;
  const like = await prisma.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true }, take: 5 });
  if (like.length > 1) console.log(`  (${q}: ${like.length} matches: ${like.map((x) => x.name).join(', ')}; using the first)`);
  return like[0]?.name ?? null;
}

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();
  const out: OperatorAudit[] = [];
  try {
    for (const q of names) {
      const name = await resolve(prisma, q);
      if (!name) {
        console.log(`\n## ${q}: no account on record`);
        continue;
      }
      const v = await loadAccountView(prisma, accountSlug(name), now, { live: true, name });
      if (!v || !('brief' in v)) {
        console.log(`\n## ${name}: could not load (${v && 'collision' in v ? `slug collision: ${v.collision.join(', ')}` : 'not found'})`);
        continue;
      }
      const a = operatorAudit(v.brief, v.inputs);
      out.push(a);
      if (flags.has('--json')) continue;
      console.log(`\n## ${a.account}`);
      console.log(`  people read: GAP ${a.counts.gap} · HubSpot ${a.counts.hubspot}${a.counts.hubspotTruncated ? ' (TRUNCATED at the cap)' : ''} · staged candidates ${a.counts.staged}`);
      line('DIRECT OPERATOR', a.direct);
      if (a.direct) console.log(`  ${''.padEnd(24)} why: ${a.direct.why}`);
      line('ALTERNATE', a.alternate);
      line('TECH / TRANSFORMATION', a.tech);
      line('SPONSOR', a.sponsor);
      line('SITE OPERATOR', a.site);
      console.log(`  direct-operator candidates (${a.operators.length}): ${a.operators.slice(0, 8).map((o) => `${o.name} (${o.title}; ${o.geo})`).join(' · ') || 'none'}`);
      console.log('  top relevant:');
      for (const t of a.top) console.log(`    ${t.lane.padEnd(28)} ${t.name} | ${t.title ?? ''} | ${t.geo} | ${t.source}`);
      console.log(`  MISSING: ${a.missing.join('; ') || 'nothing for a cold first touch'}`);
      if (a.stagedOperator) console.log(`  STAGED OPERATOR: ${a.stagedOperator} (review before any credit)`);
      console.log(`  APOLLO: ${a.apollo.map((x) => `${x.kind}: ${x.target} (${x.why})`).join(' | ') || `none${a.apolloNote ? ` (${a.apolloNote})` : ''}`}`);

      if (flags.has('--research') && !a.direct && !a.stagedOperator) {
        const { researchDecisionMakers } = await import('../../src/lib/discovery/research');
        const found: ResearchedContact[] = await researchDecisionMakers(a.account);
        // Research never becomes WHO: a find is at most a STAGED candidate (with --stage), promoted only by Casey.
        console.log(`  WEB RESEARCH (source-backed, ${found.length}; verify each source before promoting):`);
        for (const f of found) console.log(`    ${String(f.slot).padEnd(20)} ${f.name} | ${f.title ?? ''} | ${f.location ?? 'location not stated'}${f.division ? ` | ${f.division}` : ''} | ${f.sourceUrl}${f.sourceDate ? ` (date as the model reported it, unverified: ${f.sourceDate})` : ''} | ${f.confidence ?? 'confidence not stated'}`);
        const known = [...v.inputs.personas.map((p) => p.name), ...(v.inputs.hubspotPeople?.people ?? []).map((p) => p.name), ...v.inputs.candidates.map((c) => c.name)];
        const stage = stageableResearch(found, known);
        if (flags.has('--stage')) {
          for (const f of stage) {
            const key = `${normalizeName(f.name)}::${normalizeTitle(f.title ?? '')}`;
            await prisma.accountContactCandidate.upsert({
              where: { account_name_candidate_key: { account_name: a.account, candidate_key: key } },
              update: { last_seen_at: new Date(), source_payload: { ...f } as never },
              create: {
                account_name: a.account, candidate_key: key, full_name: f.name, normalized_name: normalizeName(f.name), title: f.title ?? null,
                email: f.email ?? null, email_valid: false, linkedin_url: f.linkedinUrl ?? null, source: 'web_research', source_action: 'operator_contact_audit',
                source_provider: 'gemini_grounded_search', source_payload: { ...f } as never, recommended: true,
                recommendation_reason: `Direct operator from public research (${f.sourceUrl}); verify the current role before promoting.`, state: 'staged',
              },
            });
            console.log(`    STAGED for review: ${f.name} (${f.title})`);
          }
        } else if (stage.length) console.log(`    stageable (pass --stage to stage for Casey's review): ${stage.map((f) => f.name).join(', ')}`);
      }
    }
    if (flags.has('--json')) console.log(JSON.stringify(out, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
