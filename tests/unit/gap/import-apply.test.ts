import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyPlan, createBid, type ApplyDeps } from '@/lib/gap/import/apply';
import { planPicImport, type PicLike, type PicRowLike } from '@/lib/gap/import/pic';
import { planTop100ResearchImport, type ResearchV1Like } from '@/lib/gap/import/top100-research';
import picHonda from '../../fixtures/gap/pic-honda.json';
import researchHonda from '../../fixtures/gap/top100-research-honda.json';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const PRISMA = { tag: 'prisma-stub' };

function stubDeps(overrides: Partial<ApplyDeps> = {}): ApplyDeps {
  let seq = 0;
  return {
    registerSignal: vi.fn(async (_prisma, input) => ({ created: true, id: `sig_${++seq}_${input.sourceId}` })),
    proposeHypothesis: vi.fn(async (_prisma, input) => ({ ok: true as const, id: `hyp_${input.sourceRef}`, status: 'draft' as const })),
    createBid: vi.fn(async (_prisma, input) => ({ id: `bid_${input.hypothesisId}` })),
    ...overrides,
  };
}

function researchPlan() {
  return planTop100ResearchImport(researchHonda as unknown as ResearchV1Like, {
    runId: 'top100-2026-09-12',
    accountName: 'Honda',
    hubspotCompanyId: '55554513979',
    now: NOW,
    registeredBy: 'test-suite',
  });
}

function picPlanWithBid() {
  const pic = picHonda as unknown as PicLike;
  const onTape: PicRowLike = {
    ...pic.rows[0],
    buyerLanguage: { text: 'We lose trailers at Greensburg every shift', predicted: false },
    citations: [
      { ref: 'transcript:honda/2026-08-20.txt', at: '2026-08-20', speaker: 'Plant logistics manager', verbatim: 'We lose trailers at Greensburg every shift' },
    ],
  };
  return planPicImport({ ...pic, rows: [onTape, pic.rows[1]] }, {
    accountName: 'Honda North America',
    hubspotCompanyId: null,
    now: NOW,
    registeredBy: 'test-suite',
  });
}

describe('applyPlan: research plan through stub deps', () => {
  let deps: ApplyDeps;
  beforeEach(() => {
    deps = stubDeps();
  });

  it('registers every signal, proposes with the substituted observation, and reports creates', async () => {
    const plan = researchPlan();
    const [h] = plan.hypotheses;
    const report = await applyPlan(PRISMA, plan, deps, { dryRun: false, createdBy: 'test-suite' });

    expect(deps.registerSignal).toHaveBeenCalledTimes(h.signals.length);
    for (const signal of h.signals) {
      expect(deps.registerSignal).toHaveBeenCalledWith(PRISMA, signal);
    }

    expect(deps.proposeHypothesis).toHaveBeenCalledTimes(1);
    const proposed = vi.mocked(deps.proposeHypothesis).mock.calls[0][1];
    expect(proposed.sourceRef).toBe('research:top100-2026-09-12:honda-com');
    expect(proposed.createdBy).toBe('test-suite');
    expect(proposed.signalIds).toHaveLength(h.signals.length);
    // The template only cites E3 (the FACT among why_now.evidence_ids); E4 is an INFERENCE.
    const e3Id = proposed.signalIds.find((id) => id.endsWith(':E3'));
    expect(e3Id).toBeDefined();
    expect(proposed.observation).toContain(`[S:${e3Id}]`);
    expect(proposed.observation).not.toContain('E4');
    expect(proposed.primarySignalId).toBe(e3Id);
    expect(proposed.predictedBuyerLanguage).toBeNull();
    expect(proposed.persona).toBe('supply_chain');
    expect(proposed.confidence).toBe(75);
    expect((proposed.metadata as Record<string, unknown>).needsObservation).toBe(false);

    expect(deps.createBid).not.toHaveBeenCalled();
    expect(report).toEqual({
      dryRun: false,
      hypotheses: { created: 1, existing: 0, wouldCreate: 0, refused: {} },
      signals: { created: h.signals.length, existing: 0, wouldCreate: 0, refused: { not_a_fact: 1 } },
      bids: { created: 0, wouldCreate: 0 },
    });
  });

  it('is idempotent: existing signals and duplicate_source_ref produce zero creates', async () => {
    const plan = researchPlan();
    const second = stubDeps({
      registerSignal: vi.fn(async (_prisma, input) => ({ created: false, id: `sig_${input.sourceId}` })),
      proposeHypothesis: vi.fn(async () => ({ ok: false as const, reason: 'duplicate_source_ref', existingId: 'hyp_old' })),
    });
    const report = await applyPlan(PRISMA, plan, second, { dryRun: false, createdBy: 'test-suite' });
    expect(report.hypotheses).toEqual({ created: 0, existing: 1, wouldCreate: 0, refused: {} });
    expect(report.signals.created).toBe(0);
    expect(report.signals.existing).toBe(plan.hypotheses[0].signals.length);
    expect(report.bids).toEqual({ created: 0, wouldCreate: 0 });
    expect(second.createBid).not.toHaveBeenCalled();
  });

  it('counts other propose refusals by their reason', async () => {
    const plan = researchPlan();
    const refusing = stubDeps({
      proposeHypothesis: vi.fn(async () => ({ ok: false as const, reason: 'empty_observation' })),
    });
    const report = await applyPlan(PRISMA, plan, refusing, { dryRun: false, createdBy: 'test-suite' });
    expect(report.hypotheses).toEqual({ created: 0, existing: 0, wouldCreate: 0, refused: { empty_observation: 1 } });
  });
});

describe('applyPlan: PIC plan with a BID', () => {
  it('creates the BID once, unconfirmed, against the new hypothesis id', async () => {
    const deps = stubDeps();
    const plan = picPlanWithBid();
    const report = await applyPlan(PRISMA, plan, deps, { dryRun: false, createdBy: 'test-suite' });

    expect(deps.proposeHypothesis).toHaveBeenCalledTimes(2);
    const first = vi.mocked(deps.proposeHypothesis).mock.calls[0][1];
    expect(first.observation).toBe('');
    expect(first.signalIds).toHaveLength(1);
    expect((first.metadata as Record<string, unknown>).needsObservation).toBe(true);
    expect((first.metadata as Record<string, unknown>).picConfidence).toBe('MODERATE');
    expect(first.predictedBuyerLanguage).toBe(
      JSON.stringify({ text: 'We lose trailers at Greensburg every shift', predicted: false, sourceRef: 'pic:honda#0' }),
    );

    expect(deps.createBid).toHaveBeenCalledTimes(1);
    const bid = vi.mocked(deps.createBid).mock.calls[0][1];
    expect(bid.hypothesisId).toBe('hyp_pic:honda#0');
    expect(bid.accountName).toBe('Honda North America');
    expect(bid.humanConfirmed).toBe(false);
    expect(bid.aiExtracted).toBe(true);
    expect(bid.capturedBy).toBe('pic-import');
    expect(bid.metadata).toEqual({ transcriptRef: 'transcript:honda/2026-08-20.txt', speaker: 'Plant logistics manager' });
    expect(report.bids).toEqual({ created: 1, wouldCreate: 0 });
    expect(report.hypotheses.created).toBe(2);
  });

  it('skips the BID when the hypothesis already exists (second apply)', async () => {
    const deps = stubDeps({
      registerSignal: vi.fn(async (_prisma, input) => ({ created: false, id: `sig_${input.sourceId}` })),
      proposeHypothesis: vi.fn(async () => ({ ok: false as const, reason: 'duplicate_source_ref', existingId: 'hyp_old' })),
    });
    const report = await applyPlan(PRISMA, picPlanWithBid(), deps, { dryRun: false, createdBy: 'test-suite' });
    expect(deps.createBid).not.toHaveBeenCalled();
    expect(report.hypotheses).toEqual({ created: 0, existing: 2, wouldCreate: 0, refused: {} });
    expect(report.bids).toEqual({ created: 0, wouldCreate: 0 });
  });
});

describe('applyPlan: dry run', () => {
  it('touches no dependency and reports wouldCreate counts', async () => {
    const deps = stubDeps();
    const plan = picPlanWithBid();
    const totalSignals = plan.hypotheses.reduce((n, h) => n + h.signals.length, 0);
    const report = await applyPlan(null, plan, deps, { dryRun: true, createdBy: 'test-suite' });
    expect(deps.registerSignal).not.toHaveBeenCalled();
    expect(deps.proposeHypothesis).not.toHaveBeenCalled();
    expect(deps.createBid).not.toHaveBeenCalled();
    expect(report).toEqual({
      dryRun: true,
      hypotheses: { created: 0, existing: 0, wouldCreate: 2, refused: {} },
      signals: { created: 0, existing: 0, wouldCreate: totalSignals, refused: {} },
      bids: { created: 0, wouldCreate: 1 },
    });
  });
});

describe('createBid', () => {
  it('inserts an unconfirmed buyer_input_data row with the raw language write-once', async () => {
    const prisma = { buyerInputData: { create: vi.fn(async () => ({ id: 'bid_1' })) } };
    const out = await createBid(prisma, {
      hypothesisId: 'hyp_1',
      accountName: 'Honda North America',
      type: 'business_problem',
      rawBuyerLanguage: 'We lose trailers',
      source: 'call',
      capturedAt: new Date('2026-08-23'),
      capturedBy: 'pic-import',
      aiExtracted: true,
      humanConfirmed: false,
      metadata: { transcriptRef: 'transcript:x' },
    });
    expect(out).toEqual({ id: 'bid_1' });
    expect(prisma.buyerInputData.create).toHaveBeenCalledWith({
      data: {
        hypothesis_id: 'hyp_1',
        account_name: 'Honda North America',
        persona_id: null,
        contact_email: '',
        type: 'business_problem',
        raw_buyer_language: 'We lose trailers',
        source: 'call',
        captured_at: new Date('2026-08-23'),
        captured_by: 'pic-import',
        ai_extracted: true,
        human_confirmed: false,
        metadata: { transcriptRef: 'transcript:x' },
      },
      select: { id: true },
    });
  });

  it('refuses to write a confirmed BID no matter what the caller passes', async () => {
    const prisma = { buyerInputData: { create: vi.fn() } };
    await expect(
      createBid(prisma, {
        hypothesisId: 'hyp_1',
        accountName: 'Honda North America',
        type: 'business_problem',
        rawBuyerLanguage: 'We lose trailers',
        source: 'call',
        capturedAt: new Date('2026-08-23'),
        capturedBy: 'pic-import',
        aiExtracted: true,
        humanConfirmed: true as unknown as false,
        metadata: { transcriptRef: 'transcript:x' },
      }),
    ).rejects.toThrow('human_confirmed');
    expect(prisma.buyerInputData.create).not.toHaveBeenCalled();
  });
});
