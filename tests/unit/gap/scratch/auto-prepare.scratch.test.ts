// @vitest-environment node
/**
 * Batch item 5, R33 (2026-10-07; Casey's approved policy) through the REAL draft service, hypothesis machine, routes
 * and Postgres (the embedded scratch database). Only the session is mocked; research itself is not run (its output,
 * a fresh verified claim, is registered here the way research registers it). Skipped without GAP_SCRATCH_DATABASE_URL.
 *
 * Proves: a verified claim no thesis cites becomes a review_required proposal with NO Draft press (the research
 * closeout's own call), account-level, read off the fact, audited; nothing beyond review (no approve, no activate, no
 * routing decision, no email); a rerun makes no twin; NOT THIS STORY parks it and a later run never prepares it again.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const URL_ = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
const RUN = SCRATCH_URL.test(URL_);

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!RUN)('R33: automatic reversible preparation (scratch database, the real draft service)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let pepsi: import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  const tag = `r33-${Date.now().toString(36)}`;
  let factId = '';
  let hypothesisId = '';
  const runStart = new Date();

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    const corpus = await seedCorpus(prisma, { tag });
    pepsi = corpus.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    const { registerSignal } = await import('@/lib/gap/signals/registry');
    const { VERIFIED_EXCERPT } = await import('@/lib/gap/research/evidence-gate');
    const r = await registerSignal(prisma, { accountName: pepsi.name, sourceKind: 'evidence_record', sourceId: `corpus:${pepsi.slug}:charlotte`, type: 'site_expansion' as never, title: `${pepsi.name} to expand Charlotte distribution center`, sourceType: 'public_secondary', evidenceUrl: `https://news.example.com/${pepsi.slug}/charlotte`, evidenceText: `${pepsi.name} is expanding its Charlotte, North Carolina distribution center with 20 new dock doors.`, externalOk: true, observedAt: new Date(Date.now() - 2 * 86_400_000), confidence: 80, metadata: { verified: VERIFIED_EXCERPT }, registeredBy: 'gap-background-research' });
    factId = r.id;
  }, 180_000);
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const closeout = async () => {
    const { prepareProposalsFromResearch } = await import('@/lib/gap/research/auto-prepare');
    return prepareProposalsFromResearch(prisma, { accountName: pepsi.name, facts: [{ signalId: factId, fresh: true }], actor: 'gap-background-research', now: new Date() });
  };

  it('the research closeout prepares a review_required proposal with no Draft press: account-level, read off the fact, audited, nothing beyond review', async () => {
    const out = await closeout();
    expect(out).toEqual([expect.objectContaining({ factId, outcome: 'prepared', preparation: 'submitted', approach: 'event_led' })]);
    hypothesisId = (out[0] as { hypothesisId: string }).hypothesisId;
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesisId }, select: { status: true, primary_persona_id: true, source_ref: true, problem_family: true, problem_hypothesis: true, metadata: true } });
    expect(row).toMatchObject({ status: 'review_required', primary_persona_id: null, source_ref: `anchor:${factId}:p0`, problem_family: 'hidden_capacity' });
    expect(row!.problem_hypothesis).toMatch(/the expansion at the Charlotte, North Carolina distribution center adds trailers/);
    expect((row!.metadata as { approach?: string }).approach).toBe('event_led');
    const events = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: hypothesisId }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(events.map((e) => e.action)).toEqual(['propose', 'submit']);
    expect(await prisma.gapAuditEvent.count({ where: { kind: 'research.proposal_prepared', subject_id: hypothesisId } })).toBe(1);
    // Reversible: nothing beyond review happened.
    expect(await prisma.routingDecision.count({ where: { account_name: pepsi.name, created_at: { gte: runStart } } })).toBe(0);
    expect(await prisma.emailLog.count({ where: { created_at: { gte: runStart } } })).toBe(0);
  }, 180_000);

  it('a rerun answers the same proposal: no twin, no second audit row', async () => {
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    expect(await closeout()).toEqual([{ factId, outcome: 'cited' }]);
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
    expect(await prisma.gapAuditEvent.count({ where: { kind: 'research.proposal_prepared', subject_id: hypothesisId } })).toBe(1);
  }, 120_000);

  it('NOT THIS STORY parks it: the next closeout never prepares it again', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${hypothesisId}`, 'PATCH', { action: 'withdraw', reason: 'not this story: prepared automatically, not for us' }), ctx(hypothesisId));
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    expect(await closeout()).toEqual([{ factId, outcome: 'set_aside' }]);
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
  }, 120_000);
});
