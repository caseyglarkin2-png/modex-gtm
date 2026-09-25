import { describe, expect, it } from 'vitest';

import { CANON_NUMBERS, NUMBER_TOKEN_RE, PUBLIC_REFERENCE_CUSTOMERS } from '@/lib/gap/compiler/canon';
import {
  GROUP_A_CHECKS,
  checkObservationFirst,
  checkObservationUnsupported,
  checkProofUnsupported,
} from '@/lib/gap/compiler/checks/c01-evidence';
import type { CompileContext, CompileDraft, CompileEvidenceRef } from '@/lib/gap/compiler/types';

function ref(id: string, over: Partial<CompileEvidenceRef> = {}): CompileEvidenceRef {
  return {
    id,
    title: `Evidence ${id}`,
    url: `https://example.com/${id}`,
    externalOk: true,
    fresh: true,
    superseded: false,
    firstParty: false,
    ...over,
  };
}

function ctx(over: Partial<CompileContext> = {}): CompileContext {
  return {
    stepIndex: 0,
    hypothesis: {
      observation: 'Ohio DC posted three gate-clerk roles [S:ev_1]',
      problemHypothesis: 'hyp',
      problemFamily: 'gate_congestion',
    },
    evidence: [ref('ev_1', { title: 'Ohio DC posts three gate-clerk roles' })],
    priorStepBodies: [],
    contract: null,
    ...over,
  };
}

function draft(body: string, subject = 'Ohio gate'): CompileDraft {
  return { subject, body };
}

const OBS = 'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]].';
const HYP = 'My guess is the gate is where the slot goes. Is that close?';
const SIG = '\n\nCasey Larkin';

function body(...paragraphs: string[]): string {
  return `Hi Kara,\n\n${paragraphs.join('\n\n')}${SIG}`;
}

describe('canon data', () => {
  it('names Primo as the only public reference customer', () => {
    expect(PUBLIC_REFERENCE_CUSTOMERS).toEqual(['Primo', 'Primo Brands']);
  });

  it('tokenises money, percent, unit counts and bare counts but not years', () => {
    const text = 'Add $1M+ and 5% across 110 dock doors and 3,000 trailers by 2026, plus 48 more.';
    const tokens = Array.from(text.matchAll(NUMBER_TOKEN_RE)).map((m) => m[0]);
    expect(tokens).toEqual(['$1M+', '5%', '110 dock doors', '3,000 trailers', '48']);
  });

  it('carries the five canon figures in ladder order', () => {
    const labels = CANON_NUMBERS.map((c) => c.label);
    expect(labels).toEqual(['turn_time', 'volume_lift', 'sites_live', 'committed_network', 'modeled_per_site']);
  });
});

describe('C01 OBSERVATION_UNSUPPORTED', () => {
  it('passes a cited fresh public ref', () => {
    const r = checkObservationUnsupported(draft(body(OBS, HYP)), ctx());
    expect(r).toMatchObject({ code: 'C01', passed: true, severity: 'reject' });
  });

  it('rejects a subject naming a place the body never mentions (the "Fontana" seed subject sent to Kroger, final pass)', () => {
    const r = checkObservationUnsupported(draft(body(OBS, HYP), 'Doors versus spots at Fontana'), ctx());
    expect(r).toMatchObject({ code: 'C01', passed: false, severity: 'reject' });
    expect(r.detail).toContain('"Fontana"');
    expect(r.detail).toContain('subject');
  });

  it('rejects a subject count the body never states ("Six plants", "Three regions")', () => {
    expect(checkObservationUnsupported(draft(body(OBS, HYP), 'Six plants and the forks'), ctx()).detail).toContain('"Six"');
    expect(checkObservationUnsupported(draft(body(OBS, HYP), 'Three regions, one number'), ctx()).passed).toBe(true);
    const noCount = 'Your Ohio DC posted gate-clerk roles in August [[SRC:ev_1]].';
    const r = checkObservationUnsupported(draft(body(noCount, HYP), 'Three regions, one number'), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('"Three"');
  });

  it('passes a subject whose specifics come from the cited body ("Ohio gate")', () => {
    expect(checkObservationUnsupported(draft(body(OBS, HYP), 'Ohio gate'), ctx()).passed).toBe(true);
    expect(checkObservationUnsupported(draft(body(OBS, HYP), 'Doors versus spots'), ctx()).passed).toBe(true);
  });

  it('fails a superseded ref and names the id', () => {
    const r = checkObservationUnsupported(
      draft(body(OBS, HYP)),
      ctx({ evidence: [ref('ev_1', { superseded: true })] }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('ev_1');
    expect(r.detail).toMatch(/superseded/);
    expect(r.span?.text).toBe('[[SRC:ev_1]]');
  });

  it('fails a stale ref and names the id', () => {
    const r = checkObservationUnsupported(
      draft(body(OBS, HYP)),
      ctx({ evidence: [ref('ev_1', { fresh: false })] }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('ev_1');
    expect(r.detail).toMatch(/stale/);
  });

  it('fails a ref that is neither external_ok nor first-party', () => {
    const r = checkObservationUnsupported(
      draft(body(OBS, HYP)),
      ctx({ evidence: [ref('ev_1', { externalOk: false, firstParty: false })] }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('ev_1');
    expect(r.detail).toMatch(/external_ok/);
  });

  it('accepts a first-party ref that is not external_ok', () => {
    const r = checkObservationUnsupported(
      draft(body(OBS, HYP)),
      ctx({ evidence: [ref('ev_1', { externalOk: false, firstParty: true })] }),
    );
    expect(r.passed).toBe(true);
  });

  it('fails an unknown marker and names it, for both marker forms', () => {
    const r1 = checkObservationUnsupported(draft(body('Your DC posted roles [[SRC:nope]].', HYP)), ctx());
    expect(r1.passed).toBe(false);
    expect(r1.detail).toContain('nope');
    const r2 = checkObservationUnsupported(draft(body('Your DC posted roles [S:nope2].', HYP)), ctx());
    expect(r2.passed).toBe(false);
    expect(r2.detail).toContain('nope2');
  });

  it('fails when the hypothesis has an observation but the body cites nothing, quoting the first sentence', () => {
    const r = checkObservationUnsupported(draft(body('Your DC posted roles.', HYP)), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'observation_unsupported: the body carries no marker and no resolved evidence id supports the first sentence "Your DC posted roles."',
    );
    expect(r.span?.text).toBe('Your DC posted roles.');
  });

  it('allows an uncited body when the hypothesis observation is empty and the contract carries no evidenceIds', () => {
    const r = checkObservationUnsupported(
      draft(body('Gate clerks usually carry the slot.', HYP)),
      ctx({ hypothesis: { observation: '', problemHypothesis: 'hyp', problemFamily: 'gate_congestion' } }),
    );
    expect(r.passed).toBe(true);
  });

  it('passes a number present in the cited title', () => {
    const r = checkObservationUnsupported(
      draft(body('Your Ohio DC added 110 dock doors this spring [[SRC:ev_1]].', HYP)),
      ctx({ evidence: [ref('ev_1', { title: 'Ohio DC expansion adds 110 dock doors' })] }),
    );
    expect(r.passed).toBe(true);
  });

  it('passes a number present only in the cited excerpt', () => {
    const r = checkObservationUnsupported(
      draft(body('Your Ohio DC added 110 dock doors this spring [[SRC:ev_1]].', HYP)),
      ctx({ evidence: [ref('ev_1', { title: 'Ohio DC expansion', excerpt: 'The expansion adds 110 dock doors.' })] }),
    );
    expect(r.passed).toBe(true);
  });

  it('fails a number absent from every cited title and excerpt and names the token', () => {
    const r = checkObservationUnsupported(
      draft(body('Your Ohio DC turns 3,000 trailers a week [[SRC:ev_1]].', HYP)),
      ctx({ evidence: [ref('ev_1', { title: 'Ohio DC expansion adds 110 dock doors', excerpt: 'Adds 110 doors.' })] }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toBe(
      'number "3,000 trailers" is neither in a cited evidence title or excerpt nor a canon figure: "Your Ohio DC turns 3,000 trailers a week [[SRC:ev_1]]."',
    );
    expect(r.span?.text).toBe('3,000 trailers');
  });

  describe('lane citation convention (contract.evidenceIds beside an unmarked body)', () => {
    const UNMARKED = 'Your Ohio DC added 110 dock doors this spring.';
    const doors = (over: Partial<CompileEvidenceRef> = {}) => ref('ev_1', { title: 'Ohio DC expansion adds 110 dock doors', ...over });

    it('takes contract.evidenceIds as the citation set: the number is covered and the observation is supported', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors()], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r).toMatchObject({ code: 'C01', passed: true, severity: 'reject' });
      expect(r.detail).toBe('0 marker(s) + 1 evidence_ids resolve to fresh evidence; every number is cited or canon');
    });

    it('covers a number from the excerpt of an evidence_ids ref', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors({ title: 'Ohio DC expansion', excerpt: '110 dock doors added' })], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.passed).toBe(true);
    });

    it('still fails a number no cited ref carries', () => {
      const r = checkObservationUnsupported(
        draft(body('Your Ohio DC turns 3,000 trailers a week.', HYP)),
        ctx({ evidence: [doors()], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toMatch(/^number "3,000 trailers" is neither in a cited evidence title or excerpt nor a canon figure/);
    });

    it('fails a stale evidence_ids entry with the marker wording, naming the source evidence_ids', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors({ fresh: false })], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('evidence_ids ev_1 cites stale evidence ev_1');
      expect(r.span).toBeNull();
    });

    it('fails a superseded evidence_ids entry', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors({ superseded: true })], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('evidence_ids ev_1 cites superseded evidence ev_1');
    });

    it('fails an evidence_ids entry that resolves to no ref (a refused not-a-fact row)', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors()], contract: { evidenceIds: ['ev_1', 'E4'] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('evidence_ids E4 resolves to no evidence ref (id E4)');
    });

    it('fails an evidence_ids entry that is neither external_ok nor first-party', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors({ externalOk: false, firstParty: false })], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe('evidence_ids ev_1 cites evidence ev_1 that is neither external_ok nor first-party');
    });

    it('resolves an id that is both a marker and an evidence_ids entry once, with the marker wording', () => {
      const r = checkObservationUnsupported(
        draft(body('Your Ohio DC added 110 dock doors this spring [[SRC:ev_1]].', HYP)),
        ctx({ evidence: [doors({ fresh: false })], contract: { evidenceIds: ['ev_1'] } }),
      );
      expect(r.detail).toBe('marker [[SRC:ev_1]] cites stale evidence ev_1');
      expect(r.span?.text).toBe('[[SRC:ev_1]]');
    });

    it('applies the observation-first rule under the lane convention at step 0: an empty evidenceIds list with no marker fails even with no hypothesis observation', () => {
      const r = checkObservationUnsupported(
        draft(body('Gate clerks usually carry the slot.', HYP)),
        ctx({
          stepIndex: 0,
          hypothesis: { observation: '', problemHypothesis: 'hyp', problemFamily: 'gate_congestion' },
          contract: { evidenceIds: [] },
        }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe(
        'observation_unsupported: the body carries no marker and no resolved evidence id supports the first sentence "Gate clerks usually carry the slot."',
      );
    });

    it('does not fire the lane-convention term on a later step: an empty evidenceIds list at step 2 is C12\'s "no evidence id", not a C01 reject', () => {
      const r = checkObservationUnsupported(
        draft(body('Gate clerks usually carry the slot.', HYP)),
        ctx({
          stepIndex: 2,
          hypothesis: { observation: '', problemHypothesis: 'hyp', problemFamily: 'gate_congestion' },
          contract: { evidenceIds: [] },
        }),
      );
      expect(r.passed).toBe(true);
      expect(r.detail).toBe('0 marker(s) + 0 evidence_ids resolve to fresh evidence; every number is cited or canon');
    });

    it('keeps the hypothesis-observation gate on every step: a later uncited step with an observation still fails', () => {
      const r = checkObservationUnsupported(
        draft(body('Your DC posted roles.', HYP)),
        ctx({ stepIndex: 2, contract: { evidenceIds: [] } }),
      );
      expect(r.passed).toBe(false);
      expect(r.detail).toBe(
        'observation_unsupported: the body carries no marker and no resolved evidence id supports the first sentence "Your DC posted roles."',
      );
    });

    it('ignores junk in contract.evidenceIds', () => {
      const r = checkObservationUnsupported(
        draft(body(UNMARKED, HYP)),
        ctx({ evidence: [doors()], contract: { evidenceIds: ['ev_1', 7, null, ''] } }),
      );
      expect(r.passed).toBe(true);
    });
  });

  it('passes the canon turn-time figure phrased as measured', () => {
    const r = checkObservationUnsupported(
      draft(body(OBS, HYP, 'Primo Brands cut turns from 48 to 24 minutes, measured in a side-by-side pilot.')),
      ctx(),
    );
    expect(r.passed).toBe(true);
  });

  it('leaves canon phrasing to C05: "48 to 24 minutes proved" passes C01 and fails C05', () => {
    const d = draft(body(OBS, HYP, 'Primo Brands cut turns from 48 to 24 minutes, proved.'));
    expect(checkObservationUnsupported(d, ctx()).passed).toBe(true);
    const r = checkProofUnsupported(d, ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('measured');
  });

  it('fails a first-party ref quoted as public', () => {
    const r = checkObservationUnsupported(
      draft(body('It was reported publicly that your Ohio DC is adding a shift [[SRC:ev_1]].', HYP)),
      ctx({ evidence: [ref('ev_1', { externalOk: false, firstParty: true })] }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('ev_1');
    expect(r.detail).toMatch(/first-party/);
  });
});

describe('C05 PROOF_UNSUPPORTED', () => {
  it('passes the Primo canon proof sentence', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'Primo Brands cut turns 48 to 24, measured in a side-by-side pilot.')),
      ctx(),
    );
    expect(r).toMatchObject({ code: 'C05', passed: true, severity: 'reject' });
  });

  it('fails a named pipeline account with label named_pipeline', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'GM reduced dwell 30% after the gate change.')),
      ctx({ contract: { namedPipeline: ['GM', 'General Motors'] } }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('named_pipeline');
    expect(r.detail).toContain('GM');
    expect(r.span?.text).toBe('GM');
  });

  it('fails a named pipeline account in the subject', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP), 'What GM saw at the gate'),
      ctx({ contract: { namedPipeline: ['GM'] } }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('named_pipeline');
    expect(r.detail).toMatch(/subject/);
  });

  it('matches pipeline names case-insensitively and without diacritics', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'The team at nestle leaned in.')),
      ctx({ contract: { namedPipeline: ['Nestlé'] } }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('named_pipeline');
  });

  it('never treats our own name in the pipeline list as a pipeline account', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'YardFlow is how Primo did it.')),
      ctx({ contract: { namedPipeline: ['YardFlow'] } }),
    );
    expect(r.passed).toBe(true);
  });

  it('names the claim that demanded innuendo when one is in use', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'Ford is evaluating us through an innovation program.')),
      ctx({
        contract: { namedPipeline: ['Ford'], unnamedOnlyClaimIds: ['CR-035'], claimsUsed: ['CR-001', 'CR-035'] },
      }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('named_pipeline');
    expect(r.detail).toContain('CR-035');
  });

  it('fails an unnamed organization result with no proof ref', () => {
    const r = checkProofUnsupported(draft(body(OBS, HYP, 'Acme Foods went from 60 to 40 minutes at the gate.')), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('Acme Foods');
    expect(r.detail).toMatch(/proof ref/);
  });

  it('passes the same sentence when it cites a proof ref', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'Acme Foods went from 60 to 40 minutes at the gate [[SRC:proof1]].')),
      ctx({ evidence: [ref('ev_1'), ref('proof1')], contract: { proofRefs: ['proof1'] } }),
    );
    expect(r.passed).toBe(true);
  });

  it('fails the same sentence when its marker is not a proof ref', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'Acme Foods went from 60 to 40 minutes at the gate [[SRC:ev_1]].')),
      ctx({ contract: { proofRefs: ['proof1'] } }),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('Acme Foods');
  });

  it('fails "260 live" naming the required phrasing', () => {
    const r = checkProofUnsupported(draft(body(OBS, HYP, 'Primo has 260 live.')), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('260');
    expect(r.detail).toMatch(/committed|contracted/);
  });

  it('passes the canonical 260 sentence where "live" belongs to the 24', () => {
    const r = checkProofUnsupported(
      draft(
        body(
          OBS,
          HYP,
          'Primo Brands committed its entire network, 260 sites under contract, with 24 live today and the rest rolling out.',
        ),
      ),
      ctx(),
    );
    expect(r.passed).toBe(true);
  });

  it('fails "5% measured" (must be observed)', () => {
    const r = checkProofUnsupported(draft(body(OBS, HYP, 'Primo shipped about 5% more volume, measured.')), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('5%');
    expect(r.detail).toContain('observed');
  });

  it('passes "about 5% more volume, observed"', () => {
    const r = checkProofUnsupported(
      draft(body(OBS, HYP, 'Primo shipped about 5% more volume on flat headcount, observed.')),
      ctx(),
    );
    expect(r.passed).toBe(true);
  });

  it('fails "$1M+ measured" and passes "$1M+ modeled"', () => {
    const bad = checkProofUnsupported(draft(body(OBS, HYP, 'The floor is $1M+ per site, measured.')), ctx());
    expect(bad.passed).toBe(false);
    expect(bad.detail).toContain('modeled');
    const good = checkProofUnsupported(
      draft(body(OBS, HYP, 'The floor is $1M+ per site, modeled off Primo economics.')),
      ctx(),
    );
    expect(good.passed).toBe(true);
  });

  it('fails a canon figure with no qualifier at all', () => {
    const r = checkProofUnsupported(draft(body(OBS, HYP, 'Primo Brands cut turns 48 to 24.')), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('measured');
  });
});

describe('C10 OBSERVATION_FIRST', () => {
  it('passes a cited body whose first paragraph is cited', () => {
    const r = checkObservationFirst(draft(body(OBS, HYP)), ctx());
    expect(r).toMatchObject({ code: 'C10', passed: true, severity: 'reject' });
  });

  it('fails a cited body whose first paragraph has no marker', () => {
    const r = checkObservationFirst(draft(body(HYP, OBS)), ctx());
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/marker/);
    expect(r.span?.text).toBe('My guess is the gate is where the slot goes.');
  });

  it('passes an uncited body with a hedged first paragraph', () => {
    const r = checkObservationFirst(
      draft(body('Gate clerks usually carry the slot at plants like yours.', 'Worth a look?')),
      ctx(),
    );
    expect(r.passed).toBe(true);
  });

  it('fails an uncited body with an assertive first paragraph', () => {
    const r = checkObservationFirst(
      draft(body('Gate clerks carry the slot at plants like yours.', 'Worth a look?')),
      ctx(),
    );
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/hedge/);
  });

  it('fails an empty body', () => {
    const r = checkObservationFirst(draft(''), ctx());
    expect(r.passed).toBe(false);
  });
});

describe('GROUP_A_CHECKS', () => {
  it('exports the three checks in code order', () => {
    const codes = GROUP_A_CHECKS.map((c) => c(draft(body(OBS, HYP)), ctx()).code);
    expect(codes).toEqual(['C01', 'C05', 'C10']);
  });
});
