import { describe, expect, it } from 'vitest';

import { checkFollowupNewInfo, contentWords, jaccard, markerIds } from '@/lib/gap/compiler/checks/c12-newinfo';
import { readCitationContract } from '@/lib/gap/compiler/text';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

function ctxAt(stepIndex: number, priorStepBodies: string[], contract: unknown = null): CompileContext {
  return {
    stepIndex,
    hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'hidden_capacity' },
    evidence: [],
    priorStepBodies,
    contract,
  };
}

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';

const STEP0 = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where. The lot usually loses that argument, and the clerk becomes the reconciliation.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

const STEP1 = `Kara,

Your Q2 call flagged a second Ohio building coming online next spring [[SRC:ev_2]]. Same carriers, same gate design, twice the inbound.

My guess is the clerk model does not scale to two lots; the reconciliation cost doubles with the doors.

Worth sending over the short version of how a peer network handled the second building?

${SIGN}`;

function draft(body: string): CompileDraft {
  return { subject: 'Ohio gate roles', body };
}

describe('C12 FOLLOWUP_NEW_INFO', () => {
  it('passes step 0 without looking at anything', () => {
    expect(checkFollowupNewInfo(draft(STEP0), ctxAt(0, []))).toMatchObject({
      code: 'C12',
      passed: true,
      severity: 'reject',
      detail: 'step 0',
    });
  });

  it('rejects a step 1 body that reuses every marker from step 0', () => {
    const body = STEP1.replace('[[SRC:ev_2]]', '[[SRC:ev_1]]');
    const r = checkFollowupNewInfo(draft(body), ctxAt(1, [STEP0]));
    expect(r).toMatchObject({ code: 'C12', passed: false, severity: 'reject' });
    expect(r.detail).toBe('no new evidence id: every cited id is reused from a prior step (reused ids: ev_1)');
  });

  it('rejects a follow-up with no marker and no evidence_ids at all', () => {
    const body = STEP1.replace(' [[SRC:ev_2]]', '');
    const r = checkFollowupNewInfo(draft(body), ctxAt(1, [STEP0]));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'no evidence id: a follow-up cites at least one evidence id unused in prior steps, as a marker or in evidence_ids (prior ids: ev_1)',
    );
  });

  describe('lane citation convention (contract.evidenceIds and contract.priorEvidenceIds)', () => {
    const UNMARKED0 = STEP0.replace(' [[SRC:ev_1]]', '');
    const UNMARKED1 = STEP1.replace(' [[SRC:ev_2]]', '');

    it('takes contract.evidenceIds as the citation set for an unmarked follow-up and names the new id', () => {
      const r = checkFollowupNewInfo(draft(UNMARKED1), ctxAt(1, [UNMARKED0], { evidenceIds: ['ev_2'], priorEvidenceIds: [['ev_1']] }));
      expect(r.passed).toBe(true);
      expect(r.detail).toBe('new evidence ids: ev_2; reused ids: none; max similarity 0.12');
    });

    it('counts a prior step evidence id from contract.priorEvidenceIds as used', () => {
      const r = checkFollowupNewInfo(draft(UNMARKED1), ctxAt(1, [UNMARKED0], { evidenceIds: ['ev_1'], priorEvidenceIds: [['ev_1']] }));
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('no new evidence id: every cited id is reused from a prior step (reused ids: ev_1)');
    });

    it('counts a prior step marker as used against the current evidence_ids too', () => {
      const r = checkFollowupNewInfo(draft(UNMARKED1), ctxAt(1, [STEP0], { evidenceIds: ['ev_1'] }));
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('no new evidence id: every cited id is reused from a prior step (reused ids: ev_1)');
    });

    it('unions markers with evidence_ids on both sides', () => {
      const step2 = `Kara,

The Ohio building added 110 dock doors this spring [[SRC:ev_1]]. Same lot, more doors.

My guess is the lot decides the door schedule, not the other way around.

Worth sending over the yard-network scorecard?

${SIGN}`;
      const r = checkFollowupNewInfo(draft(step2), ctxAt(2, [UNMARKED0, UNMARKED1], { evidenceIds: ['ev_3'], priorEvidenceIds: [['ev_1'], ['ev_2']] }));
      expect(r.passed).toBe(true);
      expect(r.detail).toMatch(/^new evidence ids: ev_3; reused ids: ev_1; max similarity 0\.[0-5]\d$/);
    });

    it('lists prior evidence_ids in the no-evidence detail', () => {
      const r = checkFollowupNewInfo(draft(UNMARKED1), ctxAt(1, [UNMARKED0], { evidenceIds: [], priorEvidenceIds: [['ev_1']] }));
      expect(r.passed).toBe(false);
      expect(r.detail).toBe(
        'no evidence id: a follow-up cites at least one evidence id unused in prior steps, as a marker or in evidence_ids (prior ids: ev_1)',
      );
    });

    it('still applies the Jaccard rule to an unmarked follow-up with a new evidence id', () => {
      const near = UNMARKED0.replace('normal Tuesday', 'typical Tuesday');
      const r = checkFollowupNewInfo(draft(near), ctxAt(1, [UNMARKED0], { evidenceIds: ['ev_9'], priorEvidenceIds: [['ev_1']] }));
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('content similarity 0.93 to prior step 0 is at or above 0.60 (new ids: ev_9; reused ids: none)');
    });

    it('readCitationContract reads the ids leniently and reports whether the lane convention is in play', () => {
      expect(readCitationContract(null)).toEqual({ evidenceIds: [], priorEvidenceIds: [], laneConvention: false });
      expect(readCitationContract({ evidenceIds: 'x' })).toEqual({ evidenceIds: [], priorEvidenceIds: [], laneConvention: false });
      expect(readCitationContract({ evidenceIds: [], priorEvidenceIds: 'junk' })).toEqual({
        evidenceIds: [],
        priorEvidenceIds: [],
        laneConvention: true,
      });
      expect(readCitationContract({ evidenceIds: ['a', 3, '', 'a'], priorEvidenceIds: [['b'], 'junk', [1, 'c', 'c']] })).toEqual({
        evidenceIds: ['a'],
        priorEvidenceIds: [['b'], [], ['c']],
        laneConvention: true,
      });
    });
  });

  it('passes a body with one new marker and low similarity, reporting both', () => {
    const r = checkFollowupNewInfo(draft(STEP1), ctxAt(1, [STEP0]));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('new evidence ids: ev_2; reused ids: none; max similarity 0.12');
  });

  it('counts an [S:id] observation citation as a marker and reports reused ids alongside', () => {
    const body = STEP1.replace('[[SRC:ev_2]]', '[S:obs_7] [[SRC:ev_1]]');
    const r = checkFollowupNewInfo(draft(body), ctxAt(1, [STEP0]));
    expect(r.passed).toBe(true);
    expect(r.detail).toBe('new evidence ids: obs_7; reused ids: ev_1; max similarity 0.12');
  });

  it('rejects a near-copy on similarity even with a new marker', () => {
    const body = STEP0.replace('[[SRC:ev_1]]', '[[SRC:ev_1]] [[SRC:ev_9]]').replace('normal Tuesday', 'typical Tuesday');
    const r = checkFollowupNewInfo(draft(body), ctxAt(1, [STEP0]));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'content similarity 0.93 to prior step 0 is at or above 0.60 (new ids: ev_9; reused ids: ev_1)',
    );
  });

  it('checks similarity against every prior step, not only the last', () => {
    const near = STEP0.replace('[[SRC:ev_1]]', '[[SRC:ev_9]]');
    const r = checkFollowupNewInfo(draft(near), ctxAt(2, [STEP0, STEP1]));
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('to prior step 0');
  });

  it('exposes the helpers: marker ids, content words and Jaccard', () => {
    expect(markerIds('a [[SRC:ev_1]] b [S:obs_2] c [[SRC:ev_1]]')).toEqual(['ev_1', 'obs_2']);
    const words = contentWords('Hi Kara,\n\nThe gate waits with your trailers [[SRC:x]].\n\nCasey Larkin');
    expect([...words].sort()).toEqual(['gate', 'trailers', 'waits']);
    expect(jaccard(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3);
    expect(jaccard(new Set(), new Set())).toBe(1);
  });
});
