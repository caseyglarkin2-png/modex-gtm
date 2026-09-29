/**
 * YARDFLOW FIT RE-EVALUATION (2026-09-29): re-derive every stored candidate under ENTITY TYPE != YARDFLOW FIT,
 * from the evidence already stored on it (no web calls).
 *
 *   npx tsx scripts/gap/refit-candidates.ts            dry run: what would change
 *   npx tsx scripts/gap/refit-candidates.ts --apply    write it (after 2026-09-29-gap-yardflow-fit-1-drop.sql)
 *
 *   - a web-scouted row: fit re-derived from its cited claims (entity/fit.ts deriveFit)
 *   - a row left by a FAILED pass ("returned nothing usable" / "web pass failed"): not a verdict; cleared so it
 *     is retried (an infrastructure failure is never INSUFFICIENT company evidence)
 *   - a name-rule row: kept only if the name rule is still FINAL (genuinely obvious); a logistics, carrier or
 *     broker name is reopened for an operating check
 * Decisions (added, mapped, ignored, research_more) are never touched. Company-level output only.
 */
import { PrismaClient } from '@prisma/client';
import { deriveFit, ENTITY_TYPES, fitFromName, operatingClaims, type EntityType } from '../../src/lib/gap/entity/fit';

const apply = process.argv.includes('--apply');

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.gapAccountCandidate.findMany();
    const tally: Record<string, number> = {};
    const changes: Array<{ id: string; company: string; from: string | null; to: string | null; entity: string | null; why: string; reopen: boolean }> = [];
    for (const r of rows) {
      const s = (r.scout ?? {}) as Record<string, unknown>;
      const why = String(s.why ?? '');
      const failed = s.failed === true || /returned nothing usable|web pass failed/.test(why);
      let to: string | null;
      let entity: string | null = r.entity_type;
      let newWhy: string;
      let reopen = false;
      if (failed || !r.scouted_at) {
        to = null;
        entity = null;
        newWhy = 'A failed web pass: nothing was learned; retry.';
        reopen = true;
      } else if (s.basis === 'name_rules') {
        const n = fitFromName(r.company);
        if (n.final) {
          to = n.fit;
          entity = n.entityType;
          newWhy = n.why;
        } else {
          to = null;
          entity = n.entityType;
          newWhy = n.why;
          reopen = true;
        }
      } else {
        const t = (typeof s.entityType === 'string' && (ENTITY_TYPES as readonly string[]).includes(s.entityType) ? s.entityType : r.entity_type) as EntityType | null;
        const claims = [...(Array.isArray(s.network) ? s.network : []), ...(Array.isArray(s.freight) ? s.freight : [])] as Array<{ claim: string }>;
        const f = deriveFit({ entityType: t, operating: operatingClaims(claims).length, ambiguous: s.ambiguous === true || r.verdict === 'AMBIGUOUS', what: typeof s.what === 'string' ? s.what : null });
        to = f.fit;
        entity = t;
        newWhy = f.why;
      }
      tally[to ?? 'retry'] = (tally[to ?? 'retry'] ?? 0) + 1;
      if (to !== r.verdict || entity !== r.entity_type || reopen) changes.push({ id: r.id, company: r.company, from: r.verdict, to, entity, why: newWhy, reopen });
      if (apply && (to !== r.verdict || entity !== r.entity_type || reopen)) {
        await prisma.gapAccountCandidate.update({
          where: { id: r.id },
          data: {
            verdict: to,
            entity_type: entity,
            ...(reopen ? { scouted_at: null, scout: failed ? undefined : { ...s, verdict: null, why: newWhy } } : { scout: { ...s, verdict: to, why: newWhy, ambiguous: s.ambiguous === true || r.verdict === 'AMBIGUOUS' } }),
          },
        });
      }
    }
    for (const c of changes) console.log(`${String(c.from).padEnd(12)} -> ${String(c.to ?? 'retry').padEnd(22)} ${c.company}${c.entity ? ` (${c.entity})` : ''}: ${c.why.slice(0, 110)}`);
    console.log(`\n${rows.length} candidates; ${changes.length} ${apply ? 'changed' : 'would change'}. After: ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    if (apply) await prisma.gapAuditEvent.create({ data: { kind: 'entity.refit', actor: 'gap-refit-2026-09-29', subject_type: 'account_candidate', subject_id: 'all', payload: { rows: rows.length, changed: changes.length, tally } } });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
