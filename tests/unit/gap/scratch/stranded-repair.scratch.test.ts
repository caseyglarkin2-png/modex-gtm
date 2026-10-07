/**
 * R65 (for the R64 repair), on the scratch database with the real services: the stranded-draft dry run predicts
 * exactly what the R11 proposal service does. Stranded drafts made by the older path (no story key, never submitted)
 * on the corpus PepsiCo: one on the Tulsa closure for Tom (the production case), one on the Maryland layoffs (a
 * sensitive fact; the service refuses a draft that cites no fact, so that case is the unit test's). The plan, read through the read-only client, says ADOPT for the first and why
 * not for the others; the real service then adopts that same draft (same id, the key stamped) and refuses the
 * sensitive one for the same reason. The read-only client refuses every write against the real database.
 *
 *   GAP_SCRATCH_DATABASE_URL=postgresql://postgres:...@127.0.0.1:55432/gap_finish_e2e npx vitest run tests/unit/gap/scratch --maxWorkers=1
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const URL_ = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
const RUN = SCRATCH_URL.test(URL_);
const NOW = new Date();

describe.skipIf(!RUN)('R65: the stranded-draft dry run predicts the R11 service (scratch database)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let account = '';
  let tomId = 0;
  const ids: Record<string, string> = {};
  const facts: Record<string, string> = {};

  beforeAll(async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_HYPOTHESIS_ENABLED = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({ datasourceUrl: URL_ });
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    const corpus = await seedCorpus(prisma, { tag: `r65-${Date.now().toString(36)}` });
    const pepsi = corpus.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    account = pepsi.name;
    tomId = pepsi.people.find((p) => p.name.startsWith('Tom'))!.id;
    for (const f of pepsi.facts) facts[f.label] = f.id;
    const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const legacy = async (label: string | null) => {
      const s = label ? await prisma.prospectingSignal.findUnique({ where: { id: facts[label] }, select: { id: true, title: true, evidence_text: true } }) : null;
      const r = await proposeHypothesis(prisma, {
        accountName: account,
        primaryPersonaId: tomId,
        persona: 'transportation',
        problemFamily: 'unmapped',
        observation: s ? citedQuote(s.title ?? '', s.evidence_text ?? '', s.id, account) : 'Something is changing in their network.',
        problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.',
        rootCauseHypotheses: [],
        impactHypotheses: [],
        falsificationQuestions: ['How do trailers move through the site today?'],
        confidence: 40,
        signalIds: s ? [s.id] : [],
        createdBy: 'the older anchor (scratch)',
      } as never);
      if (!r.ok) throw new Error(JSON.stringify(r));
      return r.id;
    };
    ids.tulsa = await legacy('tulsa');
    ids.maryland = await legacy('maryland');
  }, 300_000);
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('the plan, read only, says ADOPT for the Tulsa draft with its key, and why not for the others', async () => {
    const { planStrandedRepair } = await import('@/lib/gap/recovery/stranded-drafts');
    const { readOnlyPrisma } = await import('@/lib/gap/recovery/read-only');
    const plan = await planStrandedRepair(readOnlyPrisma(prisma), NOW);
    const mine = new Map(plan.items.filter((i) => i.accountName === account).map((i) => [i.hypothesisId, i]));
    expect(mine.get(ids.tulsa)).toMatchObject({ verdict: 'adopt', factId: facts.tulsa, key: `anchor:${facts.tulsa}:p${tomId}`, person: 'Tom Scratch' });
    expect(mine.get(ids.maryland)).toMatchObject({ verdict: 'not_adopted', why: expect.stringMatching(/fails the service's checks now \(sensitive:/) });
  });

  it('the real service then adopts that same draft and refuses the sensitive one for the same reason', async () => {
    const { draftThesisFromFact } = await import('@/lib/gap/story/draft-from-fact');
    const base = { accountName: account, personaId: tomId, persona: 'transportation', observation: 'x', problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.', falsificationQuestions: ['How do trailers move through the site today?'], whatANoMeans: null, actor: 'casey@freightroll.com', now: NOW };
    const adopted = await draftThesisFromFact(prisma, { ...base, factId: facts.tulsa });
    expect(adopted).toMatchObject({ ok: true, hypothesisId: ids.tulsa, existing: true, existingVia: 'same_fact' });
    expect((await prisma.prospectingHypothesis.findUnique({ where: { id: ids.tulsa }, select: { source_ref: true } }))?.source_ref).toBe(`anchor:${facts.tulsa}:p${tomId}`);
    const refused = await draftThesisFromFact(prisma, { ...base, factId: facts.maryland });
    expect(refused).toMatchObject({ ok: false, reason: 'fact_not_outreach_evidence', detail: expect.stringMatching(/^sensitive:/) });
  });

  it('the read-only client refuses every write against the real database', async () => {
    const { readOnlyPrisma, ReadOnlyRefusal } = await import('@/lib/gap/recovery/read-only');
    const ro = readOnlyPrisma(prisma);
    expect(() => ro.prospectingHypothesis.update({ where: { id: ids.maryland }, data: { source_ref: 'x' } })).toThrow(ReadOnlyRefusal);
    expect(() => ro.prospectingHypothesis.deleteMany({ where: { id: ids.maryland } })).toThrow(/read-only: prospectingHypothesis.deleteMany refused/);
    expect(() => ro.$executeRawUnsafe('UPDATE prospecting_hypotheses SET source_ref = NULL')).toThrow(/read-only: \$executeRawUnsafe refused/);
    expect(() => ro.$transaction([])).toThrow(ReadOnlyRefusal);
    expect(await ro.prospectingHypothesis.count({ where: { id: ids.maryland } })).toBe(1);
    expect((await prisma.prospectingHypothesis.findUnique({ where: { id: ids.maryland }, select: { source_ref: true } }))?.source_ref).toBeNull();
  });
});
