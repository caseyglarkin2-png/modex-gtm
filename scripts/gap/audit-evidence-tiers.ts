/**
 * READ-ONLY audit: every approved/active hypothesis and the evidence it rests
 * on, classified by the red team T6 evidence rule (src/lib/gap/research/evidence-gate.ts
 * once T6 lands; until then, raw fields only).
 *
 *   npx tsx scripts/gap/audit-evidence-tiers.ts [--json]
 *
 * Every query runs inside a Postgres READ ONLY transaction. Nothing is written.
 */
import { PrismaClient } from '@prisma/client';
import { evidenceDepth } from '../../src/lib/gap/research/depth';

async function main() {
  const asJson = process.argv.includes('--json');
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
        return tx.prospectingHypothesis.findMany({
          where: { status: { in: ['review_required', 'approved', 'active'] } },
          orderBy: [{ status: 'asc' }, { account_name: 'asc' }],
          select: {
            id: true,
            account_name: true,
            status: true,
            problem_family: true,
            observation: true,
            primary_persona_id: true,
            signals: {
              select: {
                role: true,
                signal: {
                  select: {
                    id: true, title: true, summary: true, evidence_url: true, evidence_text: true, source_kind: true,
                    source_type: true, type: true, observed_at: true, external_ok: true, claim_class: true, metadata: true,
                  },
                },
              },
            },
          },
        });
      },
      { timeout: 60_000 },
    );
    const report = rows.map((h) => {
      const signals = h.signals.map((l) => l.signal);
      const depth = evidenceDepth(signals as never);
      return {
        id: h.id,
        account: h.account_name,
        status: h.status,
        family: h.problem_family,
        persona: h.primary_persona_id,
        depth: depth.label,
        keywordOnly: depth.keywordOnly,
        observation: h.observation,
        signals: signals.map((s) => ({
          id: s.id,
          kind: s.source_kind,
          sourceType: s.source_type,
          type: s.type,
          title: s.title,
          observedAt: s.observed_at,
          url: s.evidence_url,
          text: s.evidence_text ? s.evidence_text.slice(0, 400) : null,
          summary: s.summary ? s.summary.slice(0, 200) : null,
          externalOk: s.external_ok,
          verified: (s.metadata as Record<string, unknown> | null)?.verified ?? null,
        })),
      };
    });
    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      const count = (st: string, label?: string) => report.filter((r) => r.status === st && (!label || r.depth === label)).length;
      console.log(`review_required ${count('review_required')} | approved ${count('approved')} (INSUFFICIENT ${count('approved', 'INSUFFICIENT')}) | active ${count('active')} (INSUFFICIENT ${count('active', 'INSUFFICIENT')})`);
      for (const r of report) console.log(`${r.status.padEnd(15)} ${r.depth.padEnd(15)} kw=${r.keywordOnly} ${r.account} ${r.id} :: ${String(r.observation ?? '').slice(0, 110)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
