import { describe, expect, it } from 'vitest';
import { planPicImport, type PicLike, type PicRowLike } from '@/lib/gap/import/pic';
import { PIC_BUYING_CENTER_TO_PERSONA } from '@/lib/gap/taxonomy';
import honda from '../../fixtures/gap/pic-honda.json';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const OPTS = { accountName: 'Honda North America', hubspotCompanyId: '55554510964', now: NOW, registeredBy: 'test-suite' };

const pic = honda as unknown as PicLike;

function withRows(rows: PicRowLike[]): PicLike {
  return { ...pic, rows };
}

/** A row the buyer said on tape: predicted false, first citation carries verbatim. */
function onTapeRow(): PicRowLike {
  const base = pic.rows[0];
  return {
    ...base,
    buyerLanguage: { text: 'We lose trailers at Greensburg every shift', predicted: false },
    citations: [
      { ref: 'transcript:honda/2026-08-20-greensburg.txt', at: '2026-08-20', speaker: 'Plant logistics manager', verbatim: 'We lose trailers at Greensburg every shift' },
      ...base.citations,
    ],
    lastVerified: '2026-08-23',
  };
}

describe('planPicImport: hypothesis plans', () => {
  const plan = planPicImport(pic, OPTS);

  it('emits one hypothesis plan per row with sourceRef pic:<slug>#<i>', () => {
    expect(plan.hypotheses).toHaveLength(pic.rows.length);
    expect(plan.hypotheses.map((h) => h.sourceRef)).toEqual(
      pic.rows.map((_, i) => `pic:honda#${i}`),
    );
    expect(plan.summary.rows).toBe(pic.rows.length);
    expect(plan.summary.hypotheses).toBe(pic.rows.length);
  });

  it('leaves the observation empty and flags needsObservation (PIC rows are inferences)', () => {
    for (const h of plan.hypotheses) {
      expect(h.observation).toBe('');
      expect(h.needsObservation).toBe(true);
      expect(h.observationTemplate).toEqual([]);
    }
  });

  it('maps persona from the buying center through PIC_BUYING_CENTER_TO_PERSONA', () => {
    pic.rows.forEach((row, i) => {
      expect(plan.hypotheses[i].persona).toBe(PIC_BUYING_CENTER_TO_PERSONA[row.buyingCenter]);
      expect(plan.hypotheses[i].buyingCenter).toBe(row.buyingCenter);
    });
    const centers = { economic: 'executive_ops', champion: 'supply_chain', technical: 'technology', blocker: 'finance_procurement', user: 'site_ops' } as const;
    for (const [center, persona] of Object.entries(centers)) {
      const one = planPicImport(withRows([{ ...pic.rows[0], buyingCenter: center as PicRowLike['buyingCenter'] }]), OPTS);
      expect(one.hypotheses[0].persona).toBe(persona);
    }
  });

  it('maps PIC confidence to BUYER_CONFIRMED 90 / STRONG 75 / MODERATE 50 / SPECULATIVE 25', () => {
    const grades = { BUYER_CONFIRMED: 90, STRONG: 75, MODERATE: 50, SPECULATIVE: 25 } as const;
    for (const [grade, expected] of Object.entries(grades)) {
      const one = planPicImport(withRows([{ ...pic.rows[0], confidence: grade as PicRowLike['confidence'] }]), OPTS);
      expect(one.hypotheses[0].confidence).toBe(expected);
      expect(one.hypotheses[0].metadata.picConfidence).toBe(grade);
    }
  });

  it('hedges the problem with "I suspect" unless the text already carries a hedge token', () => {
    const plain = planPicImport(withRows([{ ...pic.rows[0], problem: 'Greensburg runs one gate' }]), OPTS);
    expect(plain.hypotheses[0].problemHypothesis).toBe('I suspect Greensburg runs one gate');
    const hedged = planPicImport(withRows([{ ...pic.rows[0], problem: 'Greensburg likely runs one gate' }]), OPTS);
    expect(hedged.hypotheses[0].problemHypothesis).toBe('Greensburg likely runs one gate');
  });

  it('carries the row fields into the hypothesis plan verbatim', () => {
    const row = pic.rows[0];
    const h = plan.hypotheses[0];
    expect(h.accountName).toBe('Honda North America');
    expect(h.hubspotCompanyId).toBe('55554510964');
    expect(h.rootCauseHypotheses).toEqual([row.rootCause]);
    expect(h.impactHypotheses).toEqual([row.businessImpact, row.personalImpact]);
    expect(h.whyNow).toBeNull();
    expect(h.falsificationQuestions).toEqual([row.howWeDetect]);
    expect(h.whatANoMeans).toBe(row.whatANoMeans);
    expect(h.contraryEvidence).toBeNull();
    expect(h.predictedBuyerLanguage).toEqual({ text: row.buyerLanguage.text, predicted: true, sourceRef: 'pic:honda#0' });
    expect(h.metadata).toEqual({
      picConfidence: row.confidence,
      incumbentContext: row.incumbentContext ?? null,
      accountSpecific: row.accountSpecific,
      lastVerified: row.lastVerified,
      derivation: row.derivation ?? null,
    });
  });

  it('classifies the problem family from problem + rootCause + businessImpact and records unmapped', () => {
    for (const h of plan.hypotheses) {
      expect(typeof h.problemFamily).toBe('string');
      expect(h.familyUnmapped).toBe(h.problemFamily === 'unmapped');
    }
    const blank = planPicImport(
      withRows([{ ...pic.rows[0], problem: 'zzz', rootCause: 'zzz', businessImpact: 'zzz' }]),
      OPTS,
    );
    expect(blank.hypotheses[0].problemFamily).toBe('unmapped');
    expect(blank.hypotheses[0].familyUnmapped).toBe(true);
    expect(blank.summary.unmapped).toBe(1);
  });
});

describe('planPicImport: signals', () => {
  it('projects every citation with a known ref prefix into a signal input carrying the company id', () => {
    const plan = planPicImport(pic, OPTS);
    const row0 = plan.hypotheses[0];
    expect(row0.signals).toHaveLength(pic.rows[0].citations.length);
    for (const signal of row0.signals) {
      expect(signal.sourceKind).toBe('pic_citation');
      expect(signal.sourceId.startsWith('honda:')).toBe(true);
      expect(signal.accountName).toBe('Honda North America');
      expect(signal.hubspotCompanyId).toBe('55554510964');
      expect(signal.registeredBy).toBe('test-suite');
    }
    expect(row0.signalRefusals).toEqual([]);
  });

  it('refuses citations with an unknown ref prefix as unresolvable_ref and counts them', () => {
    const row = { ...pic.rows[0], citations: [{ ref: 'hubspot:portal-3819073 companies', at: '2026-08-21' }, ...pic.rows[0].citations] };
    const plan = planPicImport(withRows([row]), OPTS);
    expect(plan.hypotheses[0].signals).toHaveLength(pic.rows[0].citations.length);
    expect(plan.hypotheses[0].signalRefusals).toEqual([
      { ref: 'hubspot:portal-3819073 companies', reason: 'unresolvable_ref' },
    ]);
    expect(plan.summary.signalRefusals).toEqual({ unresolvable_ref: 1 });
  });
});

describe('planPicImport: BIDs', () => {
  it('emits ZERO BID plans for rows whose buyer language is predicted (not on tape)', () => {
    const plan = planPicImport(pic, OPTS);
    expect(pic.rows.every((r) => r.buyerLanguage.predicted)).toBe(true);
    for (const h of plan.hypotheses) expect(h.bids).toEqual([]);
    expect(plan.summary.bids).toBe(0);
  });

  it('emits exactly one unconfirmed, ai-extracted BID plan for a predicted:false row', () => {
    const plan = planPicImport(withRows([onTapeRow(), pic.rows[1]]), OPTS);
    expect(plan.hypotheses[0].bids).toHaveLength(1);
    expect(plan.hypotheses[1].bids).toHaveLength(0);
    expect(plan.summary.bids).toBe(1);
    expect(plan.hypotheses[0].bids[0]).toEqual({
      type: 'business_problem',
      rawBuyerLanguage: 'We lose trailers at Greensburg every shift',
      source: 'call',
      capturedAt: new Date('2026-08-23'),
      capturedBy: 'pic-import',
      aiExtracted: true,
      humanConfirmed: false,
      metadata: { transcriptRef: 'transcript:honda/2026-08-20-greensburg.txt', speaker: 'Plant logistics manager' },
    });
  });

  it('falls back to the first citation ref when no citation carries verbatim', () => {
    const row = onTapeRow();
    row.citations = row.citations.map(({ verbatim: _verbatim, ...rest }) => rest);
    const plan = planPicImport(withRows([row]), OPTS);
    expect(plan.hypotheses[0].bids[0].metadata.transcriptRef).toBe('transcript:honda/2026-08-20-greensburg.txt');
  });
});

describe('planPicImport: determinism', () => {
  it('produces identical plans for identical inputs', () => {
    const a = planPicImport(pic, OPTS);
    const b = planPicImport(pic, OPTS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
