import { describe, expect, it } from 'vitest';

import {
  checkHypothesisAsFact,
  checkProspectRoiPredicted,
} from '@/lib/gap/compiler/checks/c02-hedge';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

const ctx: CompileContext = {
  stepIndex: 0,
  hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'gate_congestion' },
  evidence: [],
  priorStepBodies: [],
  contract: null,
};

const OBS = 'Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]].';

function draft(body: string, subject = 'Ohio gate'): CompileDraft {
  return { subject, body };
}

describe('C02 HYPOTHESIS_AS_FACT', () => {
  it('passes a hedged hypothesis paragraph after a cited observation', () => {
    const r = checkHypothesisAsFact(
      draft(`Hi Kara,\n\n${OBS}\n\nMy guess is the gate is where the slot goes. Is that close?\n\nCasey Larkin`),
      ctx,
    );
    expect(r).toMatchObject({ code: 'C02', passed: true, severity: 'reject' });
  });

  it('fails an unhedged assertion and names the sentence', () => {
    const body = `${OBS}\n\nYour yards are losing capacity. Worth a look.`;
    const r = checkHypothesisAsFact(draft(body), ctx);
    expect(r.passed).toBe(false);
    expect(r.code).toBe('C02');
    expect(r.detail).toContain('Your yards are losing capacity.');
    expect(r.span?.text).toBe('Your yards are losing capacity.');
    expect(body.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
  });

  it('fails an assertion even when the paragraph carries a hedge elsewhere', () => {
    const r = checkHypothesisAsFact(draft(`${OBS}\n\nYou are losing a slot a day. My guess is the gate.`), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('You are losing a slot a day.');
  });

  it('fails a paragraph with no hedge token at all', () => {
    const r = checkHypothesisAsFact(draft(`${OBS}\n\nThe gate is the constraint at every plant.`), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/hedge/i);
  });

  it('allows an assertive pattern inside a question (the paragraph still needs a real hedge; the "?" is not one)', () => {
    const r = checkHypothesisAsFact(draft(`${OBS}\n\nMy guess is the gate. Are your yards losing capacity at the gate?`), ctx);
    expect(r.passed).toBe(true);
    const bare = checkHypothesisAsFact(draft(`${OBS}\n\nAre your yards losing capacity at the gate?`), ctx);
    expect(bare.passed).toBe(false);
    expect(bare.detail).toMatch(/carries no hedge token/);
  });

  it('uses the first paragraph as the hypothesis when nothing is cited', () => {
    const r = checkHypothesisAsFact(draft('Your yards are losing capacity.\n\nMore text here.'), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('Your yards are losing capacity.');
  });

  it('fails when the cited observation is the last paragraph', () => {
    const r = checkHypothesisAsFact(draft(`Hi Kara,\n\n${OBS}\n\nCasey Larkin`), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/no hypothesis paragraph/i);
  });

  it('fails an empty body', () => {
    const r = checkHypothesisAsFact(draft(''), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/no hypothesis paragraph/i);
  });

  // R3-6: a question mark or a bare "if " no longer counts as a hedge, and a
  // second-person declarative sentence about the prospect must carry its own
  // hedge token. The reviewer's probe passed on the strength of "Which door
  // do you trust least?" alone.
  describe('R3-6: certainty about the prospect', () => {
    const PROBE =
      'You lose two hours per truck every shift because nobody can say where the trailer is. ' +
      'Your dock office spends the morning on radio calls. Which door do you trust least?';

    it("rejects the reviewer's probe and names the assertive sentence", () => {
      const body = `${OBS}\n\n${PROBE}`;
      const r = checkHypothesisAsFact(draft(body), ctx);
      expect(r).toMatchObject({ code: 'C02', passed: false, severity: 'reject' });
      expect(r.detail).toContain('You lose two hours per truck every shift because nobody can say where the trailer is.');
      expect(r.detail).toMatch(/assertive pattern/);
      expect(r.span?.text).toBe('You lose two hours per truck every shift because nobody can say where the trailer is.');
      expect(body.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
    });

    it('a question mark alone is not a hedge', () => {
      const r = checkHypothesisAsFact(draft(`${OBS}\n\nThe gate is where the slot goes. Is that close?`), ctx);
      expect(r.passed).toBe(false);
      expect(r.detail).toMatch(/carries no hedge token/);
      expect(r.detail).not.toContain('?');
    });

    it('a bare "if " is not a hedge', () => {
      const r = checkHypothesisAsFact(draft(`${OBS}\n\nIf the gate is the constraint, the slot goes there.`), ctx);
      expect(r.passed).toBe(false);
      expect(r.detail).toMatch(/carries no hedge token/);
    });

    it('a second-person declarative sentence needs its own hedge even when the paragraph is hedged elsewhere', () => {
      const body = `${OBS}\n\nMy guess is the gate. Your dock office runs on radio calls.`;
      const r = checkHypothesisAsFact(draft(body), ctx);
      expect(r.passed).toBe(false);
      expect(r.detail).toBe(
        'second-person claim without a hedge: "Your dock office runs on radio calls." states something about the prospect as fact; hedge it (one of: my guess, i suspect, likely, usually, tends to, might, may be, could be) or ask it',
      );
      expect(r.span?.text).toBe('Your dock office runs on radio calls.');
    });

    it('passes a second-person declarative that carries a hedge, and a second-person question', () => {
      expect(checkHypothesisAsFact(draft(`${OBS}\n\nYour dock office likely runs on radio calls.`), ctx).passed).toBe(true);
      expect(checkHypothesisAsFact(draft(`${OBS}\n\nMy guess is the gate. Does your dock office run on radio calls?`), ctx).passed).toBe(true);
    });

    it('the certainty patterns each reject outside a question', () => {
      for (const sentence of [
        'You lose a slot a day.',
        'Your dock office spends the morning on radio calls.',
        'Your gate is sitting idle between waves.',
        'Your clerks are chasing trailers by radio.',
        'Nobody can say where the trailer is.',
        'Every shift starts with a lot walk.',
      ]) {
        const r = checkHypothesisAsFact(draft(`${OBS}\n\nMy guess is the gate. ${sentence}`), ctx);
        expect(r.passed, sentence).toBe(false);
        expect(r.detail, sentence).toContain(sentence);
      }
    });
  });
});

describe('C03 PROSPECT_ROI_PREDICTED', () => {
  it('fails a second-person money sentence with the span', () => {
    const body = `${OBS}\n\nMy guess is the gate. You would save $400K a year on detention.`;
    const r = checkProspectRoiPredicted(draft(body), ctx);
    expect(r).toMatchObject({ code: 'C03', passed: false, severity: 'reject' });
    expect(r.span?.text).toBe('You would save $400K a year on detention.');
    expect(body.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
  });

  it('fails second person plus percent and second person plus payback', () => {
    expect(checkProspectRoiPredicted(draft(`${OBS}\n\nYour yards likely gain 5% capacity.`), ctx).passed).toBe(false);
    expect(checkProspectRoiPredicted(draft(`${OBS}\n\nYou'd see payback in a quarter.`), ctx).passed).toBe(false);
    expect(checkProspectRoiPredicted(draft(`${OBS}\n\nYour ROI is real.`), ctx).passed).toBe(false);
  });

  it('passes the canon Primo proof when the sentence is not second person', () => {
    const body = `${OBS}\n\nPrimo measured 48 to 24 minutes, about 5% observed, and $1M+ per site modeled. My guess is the gate.`;
    expect(checkProspectRoiPredicted(draft(body), ctx).passed).toBe(true);
  });

  it('passes a second-person money question', () => {
    const body = `${OBS}\n\nMy guess is the gate. How much would you save if the slot came back?`;
    expect(checkProspectRoiPredicted(draft(body), ctx).passed).toBe(true);
  });

  it('passes second person without a money token and money without second person', () => {
    const body = `${OBS}\n\nMy guess is your gate is the constraint. Detention ran $400K there last year.`;
    expect(checkProspectRoiPredicted(draft(body), ctx).passed).toBe(true);
  });

  it('checks the subject line too', () => {
    const r = checkProspectRoiPredicted(draft(`${OBS}\n\nMy guess is the gate.`, 'Your $2M payback'), ctx);
    expect(r.passed).toBe(false);
    expect(r.detail).toMatch(/subject/i);
  });
});
