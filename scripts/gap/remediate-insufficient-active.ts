/**
 * Red team T6 remediation: ACTIVE hypotheses that the evidence gate
 * (src/lib/gap/research/evidence-gate.ts) rates INSUFFICIENT.
 *
 *   npx tsx scripts/gap/remediate-insufficient-active.ts            dry run (default): list, change nothing
 *   npx tsx scripts/gap/remediate-insufficient-active.ts --apply    close each one
 *
 * The move is the EXISTING, audited `close_unresolved` transition
 * (transitionHypothesis): active -> unresolved, with a reason that says what
 * happened. It is not a resolution and carries no buyer truth; the reason is
 * tagged `evidence_insufficient:` so Learning can exclude these rows. The
 * narrative is not edited (it is frozen); nothing is deleted; no email,
 * draft, HubSpot write or enrollment change is made (the HubSpot mirror is
 * off in production, and transitionHypothesis applies no stop_enrollments
 * effect). Idempotent: a closed row is no longer ACTIVE, so a rerun skips it.
 *
 * Writes docs/gap/t6-insufficient-remediation.md (the receipt).
 */
import { writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { GATE_SIGNAL_SELECT, sendableEvidence } from '../../src/lib/gap/research/evidence-gate';
import { transitionHypothesis } from '../../src/lib/gap/hypothesis/service';

const ACTOR = 'redteam-t6-remediation';
export const REASON_PREFIX = 'evidence_insufficient:';

async function main() {
  const apply = process.argv.includes('--apply');
  const now = new Date();
  const prisma = new PrismaClient();
  try {
    const active = await prisma.prospectingHypothesis.findMany({
      where: { status: 'active' },
      orderBy: [{ account_name: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        account_name: true,
        problem_family: true,
        primary_persona_id: true,
        observation: true,
        signals: { select: { signal: { select: { ...GATE_SIGNAL_SELECT, title: true, freshness_expires_at: true } } } },
      },
    });
    const rows = active.map((h) => {
      const signals = h.signals.map((l) => l.signal).filter(Boolean);
      const live = signals.filter((s) => !s.freshness_expires_at || s.freshness_expires_at.getTime() > now.getTime());
      // The enforced rule (Release C review SF1): the observation cites >= 1
      // signal and every cited signal is a live outreach fact.
      const ev = sendableEvidence(h.observation, live, h.account_name);
      return { h, ev, signals };
    });
    const insufficient = rows.filter((r) => r.ev.tier === 'INSUFFICIENT');
    const results: Array<{ id: string; account: string; outcome: string }> = [];
    for (const { h, ev } of insufficient) {
      const why = [...ev.refused.map((r) => `${r.id}=${r.reason}`), ...ev.nonFactCitations.map((id) => `${id}=cited_but_not_a_fact`)].join(', ') || 'no cited live fact';
      const reason = `${REASON_PREFIX} red team T6 (2026-09-26). No verified, dated, quoted fact about a physical-network change at ${h.account_name}; rested on ${why}. Closed without buyer truth: not a resolution.`;
      if (!apply) {
        results.push({ id: h.id, account: h.account_name, outcome: 'would close_unresolved' });
        continue;
      }
      const out = await transitionHypothesis(prisma, h.id, 'close_unresolved', { now, actor: ACTOR, reason });
      results.push({ id: h.id, account: h.account_name, outcome: out.ok ? `${out.from} -> ${out.to}` : `refused: ${out.reason}` });
    }

    const lines = [
      '# T6 remediation: ACTIVE hypotheses at INSUFFICIENT evidence',
      '',
      `<!-- verified:${now.toISOString().slice(0, 10)} -->`,
      '',
      `Written by \`scripts/gap/remediate-insufficient-active.ts\` (${apply ? 'APPLY' : 'DRY RUN'}) at ${now.toISOString()}.`,
      '',
      `Active before: ${rows.length}. Insufficient: ${insufficient.length}. Kept (verified outreach fact): ${rows.length - insufficient.length}.`,
      '',
      'Transition: the existing audited `close_unresolved` (active -> unresolved), actor',
      `\`${ACTOR}\`, reason tagged \`${REASON_PREFIX}\`. Narrative untouched, nothing deleted, no`,
      'email, draft, HubSpot or enrollment change.',
      '',
      '| hypothesis | account | family | persona | outcome | evidence refused |',
      '| --- | --- | --- | --- | --- | --- |',
      ...insufficient.map(({ h, ev }) => {
        const r = results.find((x) => x.id === h.id)!;
        return `| ${h.id} | ${h.account_name} | ${h.problem_family} | ${h.primary_persona_id ?? ''} | ${r.outcome} | ${ev.refused.map((x) => x.reason).join(', ') || 'none linked'} |`;
      }),
      '',
      'Kept active:',
      '',
      ...rows.filter((r) => r.ev.tier !== 'INSUFFICIENT').map(({ h, ev }) => `- ${h.id} ${h.account_name}: outreach fact ${ev.facts.join(', ')}`),
      '',
    ];
    if (apply) writeFileSync('docs/gap/t6-insufficient-remediation.md', lines.join('\n'));
    console.log(lines.join('\n'));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
