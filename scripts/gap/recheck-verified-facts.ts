/**
 * Re-check stored verified facts against the CURRENT fact rules (Signal
 * Intelligence quality review, 2026-09-28).
 *
 *   npx tsx scripts/gap/recheck-verified-facts.ts            # dry run: report only
 *   npx tsx scripts/gap/recheck-verified-facts.ts --apply    # move failing facts' stamp
 *
 * The verification contract only gets stricter. A fact stored under an older
 * rule that the current rules refuse (filing boilerplate, a past-year event
 * restated, a page-menu run-on) keeps its row and its text; only its
 * `metadata.verified` stamp moves from `excerpt_found_at_source` to
 * `failed_recheck` (with the reason and the previous value), so every gate that
 * requires the stamp refuses it from now on. Nothing else is written; fact
 * columns are frozen by GAP_SIGNAL_FROZEN. The full-name page rule needs the
 * page and is not re-run here (it applies to every new verification).
 */
import { PrismaClient } from '@prisma/client';
import { describesPastEvent, isPhysicalOpsFact } from '../../src/lib/gap/research/facts';

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();
  try {
    const facts: Array<{ id: string; account_name: string; evidence_text: string | null; observed_at: Date; metadata: Record<string, unknown> | null }> = await prisma.prospectingSignal.findMany({
      where: { source_kind: 'evidence_record', metadata: { path: ['verified'], equals: 'excerpt_found_at_source' } },
      select: { id: true, account_name: true, evidence_text: true, observed_at: true, metadata: true },
    });
    const failing: Array<{ id: string; account: string; reason: string; text: string }> = [];
    for (const f of facts) {
      const text = String(f.evidence_text ?? '');
      const reason = !isPhysicalOpsFact(text) ? 'not_a_physical_operations_fact' : describesPastEvent(text, new Date(f.observed_at)) ? 'describes_past_event' : null;
      if (reason) failing.push({ id: f.id, account: f.account_name, reason, text: text.slice(0, 140) });
    }
    const linked: Array<{ signal_id: string; hypothesis: { id: string; status: string; account_name: string } }> = failing.length
      ? await prisma.hypothesisSignal.findMany({ where: { signal_id: { in: failing.map((x) => x.id) } }, select: { signal_id: true, hypothesis: { select: { id: true, status: true, account_name: true } } } })
      : [];
    console.log(JSON.stringify({ checked: facts.length, failing: failing.length, byReason: failing.reduce<Record<string, number>>((a, x) => ((a[x.reason] = (a[x.reason] ?? 0) + 1), a), {}), linkedToTheses: linked.map((l) => ({ fact: l.signal_id, thesis: l.hypothesis.id, status: l.hypothesis.status, account: l.hypothesis.account_name })) }, null, 1));
    for (const x of failing.slice(0, 60)) console.log(`${x.reason} | ${x.account} | ${x.text}`);
    if (!apply) {
      console.log('dry run: nothing written (pass --apply)');
      return;
    }
    const now = new Date().toISOString();
    let moved = 0;
    for (const x of failing) {
      const f = facts.find((y) => y.id === x.id)!;
      await prisma.prospectingSignal.update({ where: { id: x.id }, data: { metadata: { ...(f.metadata ?? {}), verified: 'failed_recheck', recheck: { at: now, reason: x.reason, previous: 'excerpt_found_at_source', rule: 'signal-intelligence quality review 2026-09-28' } } } });
      moved += 1;
    }
    console.log(`applied: ${moved} fact stamps moved to failed_recheck`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
