import { describe, expect, it } from 'vitest';

import { BANNED_CLASS_NAMES, checkBannedPhrases, checkVoiceWarn } from '@/lib/gap/compiler/checks/c11-banned';
import type { CompileContext, CompileDraft } from '@/lib/gap/compiler/types';

function ctxAt(stepIndex: number, contract: unknown = null): CompileContext {
  return {
    stepIndex,
    hypothesis: { observation: 'obs', problemHypothesis: 'hyp', problemFamily: 'hidden_capacity' },
    evidence: [],
    priorStepBodies: [],
    contract,
  };
}

const SIGN = 'Casey Larkin, YardFlow by FreightRoll';

const CLEAN = `Hi Kara,

Your Ohio DC posted three gate-clerk roles in August [[SRC:ev_1]]. Two of them are night shift.

My guess is the clerks exist to keep inbound trailers moving when the dock and the lot disagree about what is where. The lot usually loses that argument, and the clerk becomes the reconciliation.

How many trailers sit past their appointment on a normal Tuesday?

${SIGN}`;

function draft(body: string, subject = 'Ohio gate roles'): CompileDraft {
  return { subject, body };
}

/** Swap the second sentence of the clean body for the phrase under test. */
function withSentence(sentence: string): string {
  return CLEAN.replace('Two of them are night shift.', sentence);
}

describe('C11 BANNED_PHRASES', () => {
  it('passes the clean body', () => {
    expect(checkBannedPhrases(draft(CLEAN), ctxAt(0))).toMatchObject({
      code: 'C11',
      passed: true,
      severity: 'reject',
      detail: 'no banned phrases',
    });
  });

  const cases: Array<[string, string, string]> = [
    ['em_dash', `Two of them ${String.fromCharCode(0x2014)} night shift.`, String.fromCharCode(0x2014)],
    ['throughput_word', 'Throughput capacity is the number they watch.', 'Throughput'],
    ['standardize_paper', 'The plan is to standardize the paperwork at every gate.', 'standardize the paperwork'],
    ['because_open', 'Because the gate is the constraint, the clerks stay.', 'Because'],
    ['simulated_reply', 'Fair point on the night shift.', 'Fair point'],
    ['wrote_back', 'When you wrote back about the gate, the shift had changed.', 'wrote back'],
    ['false_reply_history', 'As we discussed, the gate is the constraint.', 'As we discussed'],
    ['bespoke_deliverable', 'Happy to put together a two-page comparison.', 'Happy to put together a'],
    ['false_finality', 'One last note on the gate.', 'One last'],
    ['time_relative', 'The second building opens next week.', 'next week'],
    ['mechanics_exposure', 'This is the third note in our sequence.', 'sequence'],
    ['headcount', 'The clerk roles are where you reduce headcount.', 'reduce headcount'],
    ['filler', 'Quick question on the night shift.', 'Quick question'],
    ['260_as_live', 'The other 259 followed within a year.', 'other 259'],
    ['measured_5pct', 'Primo measured about 5% more volume.', 'measured about 5%'],
    ['observed_48_24', 'Primo observed 48 to 24 minutes at the gate.', 'observed 48 to 24 minutes'],
    ['cr029_family', 'YardFlow is additive to the WMS.', 'additive'],
    ['cr029_paraphrase', 'It runs alongside your WMS without a second system.', 'alongside your WMS'],
    ['invented_primo_integration', 'Primo runs it alongside their WMS.', 'Primo runs it alongside their WMS'],
    ['handful_narrative', 'Primo started with a handful of sites.', 'started with a handful'],
    ['voice_guardrails', 'Circling back on the night shift.', 'Circling back'],
    ['post_pivot', 'YardFlow is not a YMS.', 'not a YMS'],
  ];

  it.each(cases)('rejects class %s and names the phrase', (className, sentence, phrase) => {
    const body = withSentence(sentence);
    const r = checkBannedPhrases(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('reject');
    expect(r.detail).toBe(`banned phrase (${className}) in body: "${phrase}"`);
    expect(body.slice(r.span!.start, r.span!.end)).toBe(phrase);
  });

  it('covers every banned class with a fixture', () => {
    expect(cases.map(([name]) => name).sort()).toEqual([...BANNED_CLASS_NAMES].sort());
  });

  it('scans the subject too', () => {
    const r = checkBannedPhrases(draft(CLEAN, 'Quick question on Ohio'), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('banned phrase (filler) in subject: "Quick question"');
  });

  it('does not flag a mid-sentence "because"', () => {
    expect(checkBannedPhrases(draft(withSentence('The clerks stay because the gate is the constraint.')), ctxAt(0)).passed).toBe(true);
  });

  it('allows "headcount neutral" and forbids bare "headcount"', () => {
    expect(checkBannedPhrases(draft(withSentence('The rollout was headcount neutral.')), ctxAt(0)).passed).toBe(true);
    const r = checkBannedPhrases(draft(withSentence('The rollout cut headcount at the gate.')), ctxAt(0));
    expect(r.detail).toBe('banned phrase (headcount) in body: "headcount"');
  });

  it('allows finality language on the last step only', () => {
    const body = withSentence('Last note from me on the gate.');
    expect(checkBannedPhrases(draft(body), ctxAt(3, { stepCount: 4 })).passed).toBe(true);
    expect(checkBannedPhrases(draft(body), ctxAt(3, { isLastStep: true })).passed).toBe(true);
    const mid = checkBannedPhrases(draft(body), ctxAt(1, { stepCount: 4 }));
    expect(mid.detail).toBe('banned phrase (false_finality) in body: "Last note from me"');
    const unknown = checkBannedPhrases(draft(body), ctxAt(3));
    expect(unknown.passed).toBe(false);
  });

  it('keeps the lane regex literal for measured_5pct in both directions', () => {
    expect(checkBannedPhrases(draft(withSentence('About 5% more volume was measured.')), ctxAt(0)).detail).toContain(
      'measured_5pct',
    );
    expect(checkBannedPhrases(draft(withSentence('About 5% more volume was observed.')), ctxAt(0)).passed).toBe(true);
  });
});

describe('C14 VOICE_WARN', () => {
  it('passes the clean body', () => {
    expect(checkVoiceWarn(draft(CLEAN), ctxAt(0))).toMatchObject({
      code: 'C14',
      passed: true,
      severity: 'review',
      detail: 'no voice warnings',
    });
  });

  it('warns on singular "yard" outside a compound', () => {
    const body = withSentence('The yard is where the trailers wait.');
    const r = checkVoiceWarn(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.severity).toBe('review');
    expect(r.detail).toBe('singular "yard" (yards is plural in the network sense): "yard"');
    expect(body.slice(r.span!.start, r.span!.end)).toBe('yard');
  });

  it('accepts yard network, yard state, yard check, yard truck and YardFlow', () => {
    const body = withSentence('A yard network with clean yard state needs no yard check and fewer yard truck moves; YardFlow runs it.');
    expect(checkVoiceWarn(draft(body), ctxAt(0)).passed).toBe(true);
  });

  it('warns on consecutive sentences opening with the same word', () => {
    const body = withSentence('The clerks are night shift. The lot is full by six.');
    const r = checkVoiceWarn(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('consecutive sentences open with "the": "The lot is full by six."');
  });

  it('warns on a sentence opening with "I"', () => {
    const body = withSentence("I'll guess the clerks exist for the night shift.");
    const r = checkVoiceWarn(draft(body), ctxAt(0));
    expect(r.passed).toBe(false);
    expect(r.detail).toBe('sentence opens with "I": "I\'ll guess the clerks exist for the night shift."');
  });

  it('joins several warnings in one detail', () => {
    const body = withSentence('I walked the yard. I counted twelve trailers.');
    const r = checkVoiceWarn(draft(body), ctxAt(0));
    expect(r.detail).toContain('singular "yard"');
    expect(r.detail).toContain('consecutive sentences open with "i"');
    expect(r.detail.split('; ')).toHaveLength(4);
  });
});
