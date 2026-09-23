import { describe, expect, it } from 'vitest';

import { checkHypothesisAsFact, checkProspectRoiPredicted } from '@/lib/gap/compiler/checks/c02-hedge';
import {
  GROUP_B_CHECKS,
  checkPrivateIntentExposed,
  checkProductLeads,
} from '@/lib/gap/compiler/checks/c04-product';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

function ctx(stepIndex: number): CompileContext {
  return {
    stepIndex,
    hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'gate_congestion' },
    evidence: [],
    priorStepBodies: [],
    contract: null,
  };
}

function draft(body: string, subject = 'Ohio gate'): CompileDraft {
  return { subject, body };
}

const SIGNATURE = '\n\nCasey Larkin, YardFlow by FreightRoll';

describe('C04 PRODUCT_LEADS', () => {
  it('fails at step 0 when the first sentence names the product', () => {
    const body = `YardFlow helps yards recover slots. Your DC posted roles [[SRC:e1]].${SIGNATURE}`;
    const r = checkProductLeads(draft(body), ctx(0));
    expect(r).toMatchObject({ code: 'C04', passed: false, severity: 'reject' });
    expect(r.detail).toContain('YardFlow');
    expect(r.span?.text).toBe('YardFlow helps yards recover slots.');
    expect(body.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
  });

  it('passes the same draft at step 1 with detail not step 0', () => {
    const r = checkProductLeads(draft(`YardFlow helps yards recover slots.${SIGNATURE}`), ctx(1));
    expect(r).toMatchObject({ code: 'C04', passed: true, detail: 'not step 0' });
  });

  it('skips the greeting line and still catches the product in the real first sentence', () => {
    const r = checkProductLeads(draft(`Hi Kara,\n\nWe help plants like yours. More.${SIGNATURE}`), ctx(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/we help/i);
  });

  it('passes an observation-first body whose only product mention is the signature', () => {
    const r = checkProductLeads(
      draft(`Hi Kara,\n\nYour Ohio DC posted three gate-clerk roles [[SRC:e1]]. My guess is the gate.${SIGNATURE}`),
      ctx(0),
    );
    expect(r.passed).toBe(true);
  });

  it('passes when the product appears in the second sentence at step 0', () => {
    const r = checkProductLeads(draft('Your DC posted roles [[SRC:e1]]. YardFlow measured it elsewhere.'), ctx(0));
    expect(r.passed).toBe(true);
  });

  it('catches every suite name and the soft product openers', () => {
    const openers = [
      'flowYMS orchestrates docks.',
      'FreightRoll ID verifies drivers.',
      'Our platform maps the yard.',
      'We built a gate protocol.',
      'Our software runs it.',
      'Our system tracks dwell.',
      'flowGATE admits trucks.',
      'flowVISION maps it.',
      'flowDRIVER checks them in.',
    ];
    for (const opener of openers) {
      expect(checkProductLeads(draft(`${opener} Second sentence.`), ctx(0)).passed, opener).toBe(false);
    }
  });
});

describe('C06 PRIVATE_INTENT_EXPOSED', () => {
  const cases: Array<[string, RegExp]> = [
    ['I noticed you visited our page last week.', /noticed you visited/i],
    ['Saw you opened the deck yesterday.', /saw you/i],
    ['Your intent score jumped.', /intent score/i],
    ['See yardflow.ai/for/acme for the numbers.', /spear page/i],
    ['Your colleagues viewed the proposal.', /colleague/i],
    ['You are a hot lead this week.', /hot lead/i],
    ['We tracked your engagement score.', /engagement score/i],
    ['You downloaded the whitepaper.', /you downloaded/i],
    ['Great to see you on our website.', /on our site/i],
    ['Check the /demo/acme walkthrough.', /demo/i],
  ];

  for (const [body, label] of cases) {
    it(`fails on: ${body}`, () => {
      const r = checkPrivateIntentExposed(draft(body), ctx(0));
      expect(r).toMatchObject({ code: 'C06', passed: false, severity: 'reject' });
      expect(r.detail).toMatch(label);
      expect(r.span).not.toBeNull();
      expect(body.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
    });
  }

  it('checks the subject line', () => {
    const r = checkPrivateIntentExposed(draft('Plain body.', 'Saw you on the microsite'), ctx(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/subject/i);
  });

  it('passes ordinary language', () => {
    for (const body of [
      'The plant opened in 2024 and doubled trailer counts.',
      'With the intention of cutting dwell, they added a lane.',
      'We downloaded the 10-K and read the segment note.',
      'You mentioned the Ohio expansion at the conference.',
      'The plant opened a second gate.',
      'We saw the earnings call transcript.',
    ]) {
      expect(checkPrivateIntentExposed(draft(body), ctx(0)).passed, body).toBe(true);
    }
  });
});

describe('GROUP_B_CHECKS', () => {
  it('exposes C02, C03, C04 and C06 in order', () => {
    expect(GROUP_B_CHECKS).toEqual([
      checkHypothesisAsFact,
      checkProspectRoiPredicted,
      checkProductLeads,
      checkPrivateIntentExposed,
    ]);
    const r = GROUP_B_CHECKS.map((c) => c(draft('Your DC posted roles [[SRC:e1]].\n\nMy guess is the gate.'), ctx(0)));
    expect(r.map((x) => x.code)).toEqual(['C02', 'C03', 'C04', 'C06']);
    expect(r.every((x) => x.passed)).toBe(true);
  });
});
