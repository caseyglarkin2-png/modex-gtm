/**
 * READ-ONLY golden person check (V2 person prior). For each named account: the people on record (personas, contact
 * candidates, work-source members), read through the person prior; the best first person, why, region, lane, the
 * alternate. Writes nothing; contacts nobody.
 * Usage: npx tsx scripts/gap/who-golden.ts "Sub-Zero" "World Market" ...
 */
import { PrismaClient } from '@prisma/client';
import { rankWho, isDefaultWhoLane, LANE_LABEL } from '../../src/lib/gap/people/person-prior';
import { restrictionForName } from '../../src/lib/gap/policy/restriction';
import { typeFromVertical } from '../../src/lib/gap/account-intel/build';

const p = new PrismaClient();
(async () => {
  for (const q of process.argv.slice(2)) {
    const accounts = await p.account.findMany({ where: { name: { contains: q, mode: 'insensitive' } }, select: { name: true, vertical: true } });
    if (!accounts.length) {
      console.log(`\n## ${q}: no account on record`);
      continue;
    }
    for (const a of accounts.slice(0, 3)) {
      const [personas, cands, members] = await Promise.all([
        p.persona.findMany({ where: { account_name: a.name }, select: { id: true, name: true, title: true, email: true, do_not_contact: true } }),
        p.accountContactCandidate.findMany({ where: { account_name: a.name }, select: { id: true, full_name: true, title: true, promoted_persona_id: true } }).catch(() => []),
        p.gapWorkSourceMember.findMany({ where: { account_name: a.name }, select: { id: true, name: true, title: true, persona_id: true, relationship_context: true } }).catch(() => []),
      ]);
      // Explicit links only: a candidate promoted to a persona, or a member linked to a persona, is that persona.
      const linked = new Map(members.filter((m: { persona_id: number | null }) => m.persona_id).map((m: { persona_id: number | null; relationship_context: string | null }) => [m.persona_id!, m.relationship_context]));
      const people = [
        ...personas.map((x) => ({ key: `persona:${x.id}`, name: x.name ?? '(no name)', title: x.title, reachable: !!x.email && !x.do_not_contact, doNotContact: x.do_not_contact, relationship: linked.get(x.id) ?? null, src: 'persona' })),
        ...cands.filter((c: { promoted_persona_id: number | null }) => !c.promoted_persona_id).map((c: { id: number; full_name: string; title: string | null }) => ({ key: `candidate:${c.id}`, name: c.full_name ?? '(no name)', title: c.title, reachable: false, src: 'candidate (not a contact yet)' })),
        ...members.filter((m: { persona_id: number | null }) => !m.persona_id).map((m: { id: string; name: string | null; title: string | null; relationship_context: string | null }) => ({ key: `member:${m.id}`, name: m.name ?? '(no name)', title: m.title, reachable: false, relationship: m.relationship_context, src: 'work-source member' })),
      ];
      const entityType = typeFromVertical(a.vertical);
      const ranked = rankWho(people, { entityType });
      const operating = ranked.filter((r) => isDefaultWhoLane(r.read.lane) && !r.candidate.doNotContact);
      const best = operating[0] ?? null;
      const alt = operating[1] ?? ranked.find((r) => r !== best && !['NON_OPERATING', 'NEEDS_REVIEW', 'PROCUREMENT_COMMERCIAL'].includes(r.read.lane)) ?? null;
      const r = restrictionForName(a.name);
      console.log(`\n## ${a.name} (${a.vertical ?? 'vertical unknown'}${entityType ? `, ${entityType}` : ''}): ${personas.length} personas, ${cands.length} candidates, ${members.length} work-source members${r ? ` · RESTRICTED: ${r.reason}` : ''}`);
      const lanes = new Map<string, number>();
      for (const x of ranked) lanes.set(LANE_LABEL[x.read.lane], (lanes.get(LANE_LABEL[x.read.lane]) ?? 0) + 1);
      console.log(`  lanes: ${[...lanes].map(([k, v]) => `${k} ${v}`).join(' · ') || 'nobody'}`);
      console.log(`  BEST: ${best ? `${best.candidate.name}, ${best.candidate.title} [${best.candidate.src}${best.candidate.reachable ? ', reachable' : ''}] · ${best.read.region} · ${best.why}` : 'nobody in an operating lane'}`);
      console.log(`  ALT:  ${alt ? `${alt.candidate.name}, ${alt.candidate.title} [${alt.candidate.src}] · ${alt.read.region} · ${LANE_LABEL[alt.read.lane]}` : 'none'}`);
      for (const x of ranked.slice(0, 6)) console.log(`    - ${LANE_LABEL[x.read.lane].padEnd(28)} ${x.read.region.padEnd(12)} ${x.candidate.title ?? '(no title)'} [${x.candidate.src}]`);
    }
  }
  await p.$disconnect();
})();
