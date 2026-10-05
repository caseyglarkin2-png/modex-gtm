/**
 * READ-ONLY owner-resolution dogfood (2026-10-05). For each named account: the one owner resolution the UI reads
 * (people/owner-resolution-load.ts), for the cold first touch or, with --hypothesis <id>, for that hypothesis.
 * Prints the account kind, the eligible owners with their reasons, who was set aside and why, the sponsor / tech /
 * site slots, the HubSpot read and the next step. Writes nothing; contacts nobody; spends nothing.
 *
 *   npx tsx --env-file=<.env.local> scripts/gap/owner-resolution-dogfood.ts "PepsiCo" "FedEx" ...
 *   npx tsx --env-file=<.env.local> scripts/gap/owner-resolution-dogfood.ts --hypothesis cmuuii2n80002l504refjy0od "FedEx"
 *   ... --entity-type 3pl    read the account under that kind (read-only; the row's vertical is unchanged)
 *   ... --json    the raw resolutions
 */
import { PrismaClient } from '@prisma/client';
import { loadOwnerResolution } from '../../src/lib/gap/people/owner-resolution-load';
import type { EntityType } from '../../src/lib/gap/entity/fit';

const prisma = new PrismaClient();

async function resolveName(q: string): Promise<string | null> {
  const exact = await prisma.account.findUnique({ where: { name: q }, select: { name: true } });
  if (exact) return exact.name;
  const near = await prisma.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true, hubspot_company_id: true }, take: 5 });
  // The linked row first, then the shortest name.
  const pick = [...near].sort((a, b) => Number(!!b.hubspot_company_id) - Number(!!a.hubspot_company_id) || a.name.length - b.name.length)[0];
  return pick?.name ?? null;
}

async function main() {
  const argv = process.argv.slice(2);
  const flags = new Set(argv.filter((a) => a.startsWith('--') && a !== '--hypothesis' && a !== '--entity-type'));
  const hi = argv.indexOf('--hypothesis');
  const hypothesisId = hi >= 0 ? argv[hi + 1] : null;
  const ei = argv.indexOf('--entity-type');
  const entityType = ei >= 0 ? (argv[ei + 1] as EntityType) : null;
  const valued = new Set([hi, ei].filter((i) => i >= 0).map((i) => i + 1));
  const names = argv.filter((a, i) => !a.startsWith('--') && !valued.has(i));
  const now = new Date();
  const out: unknown[] = [];
  try {
    for (const q of names) {
      const name = await resolveName(q);
      if (!name) {
        console.log(`\n## ${q}: no account on record`);
        continue;
      }
      const t0 = Date.now();
      const r = await loadOwnerResolution(prisma, { accountName: name, purpose: hypothesisId ? 'HYPOTHESIS_ACTIVATION' : 'COLD_FIRST_TOUCH', hypothesisId, now, entityType });
      if (!r.ok) {
        console.log(`\n## ${name}: ${r.reason}`);
        continue;
      }
      const x = r.resolution;
      out.push({ account: name, hubspot: r.hubspot, resolution: x });
      if (flags.has('--json')) continue;
      console.log(`\n## ${name} (${x.account.kind}${x.account.entityType ? `, ${x.account.entityType}` : ''}${entityType ? ', read under the dogfood override' : ''}) · ${Date.now() - t0}ms`);
      console.log(`  HubSpot: ${r.hubspot.via} (${r.hubspot.detail}); people read ${r.people.length}`);
      console.log(`  checked: ${x.checked.join(' · ')}`);
      if (x.hypothesis) console.log(`  hypothesis ${x.hypothesis.id} (${x.hypothesis.status}, person ${x.hypothesis.primaryPersonaId ?? 'none'}): the fact is ${x.hypothesis.factLabel}`);
      console.log(`  NEXT STEP: ${x.nextStep}${x.preselected ? ` (preselected ${x.preselected})` : ''}`);
      console.log(`  ${x.headline}`);
      console.log(`  eligible (${x.eligible.length}):`);
      for (const c of x.eligible.slice(0, 8)) {
        console.log(`    - ${c.name} | ${c.title ?? '(no title)'} | ${c.location ?? 'location unknown'} | ${c.source}${c.action === 'add_then_use' ? ' (ADD + USE)' : ''}${c.caution ? ' | CAUTION' : ''}`);
        for (const why of c.reasons) console.log(`        ${why}`);
      }
      if (x.eligible.length > 8) console.log(`    ... and ${x.eligible.length - 8} more`);
      if (x.excluded.length) {
        console.log(`  set aside (${x.excluded.length}):`);
        for (const e of x.excluded.slice(0, 8)) console.log(`    - ${e.candidate.name} | ${e.candidate.title ?? ''} | ${e.code}: ${e.reason}`);
      }
      console.log(`  sponsor: ${x.sponsor ? `${x.sponsor.name} (${x.sponsor.title})` : 'none'} · tech: ${x.tech ? `${x.tech.name} (${x.tech.title})` : 'none'} · site: ${x.site ? `${x.site.name} (${x.site.title})` : 'none'}`);
      console.log(`  others: ${x.others.map((o) => `${o.label} ${o.count}`).join(' · ') || 'none'}`);
      if (x.research.needed) console.log(`  RESEARCH: ${x.research.why} Slots: ${x.research.slots.join('; ')}`);
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
