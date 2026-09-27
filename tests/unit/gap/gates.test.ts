import { describe, expect, it } from 'vitest';
import { allGatesEarned, buildG1Inputs, evaluateGates, type GateInputs } from '@/lib/gap/automation/gates';

/** Every threshold met. Each test below mutates ONE field below its threshold. */
function earnedInputs(): GateInputs {
  return {
    shadowAgreementRate: 0.85,
    shadowDecisionCount: 250,
    shadowWeeksOfData: 5,
    peopleSentTo: 150,
    positiveOutcomeLowerBound: 0.05,
    optOutUpperBound: 0.02,
    compilerRejectViolations: 0,
    compilerAuditSampleSize: 100,
    suppressionUnknownVerdicts7d: 0,
    suppressionDncViolationsEver: 0,
    replyClassificationAgreementRate: 0.95,
    replyClassificationSampleSize: 120,
    hypothesisResolutionRate: 0.3,
    hypothesisSampleSize: 60,
    canaryAllowlistSize: 8,
    canaryPerRuleCap: 3,
    canaryDailyCap: 5,
    canaryWeeksRun: 2,
    canaryIncidents: 0,
    killSwitchDrillLogged: true,
    autonomyHaltReversed: true,
  };
}

describe('evaluateGates: every gate earned', () => {
  it('reports all seven gates (G0-G6) passed when every threshold is met', () => {
    const results = evaluateGates(earnedInputs());
    expect(results.map((r) => r.gate)).toEqual(['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6']);
    expect(results.every((r) => r.passed)).toBe(true);
    expect(allGatesEarned(results)).toBe(true);
  });
});

describe('evaluateGates: G0, the owner-only halt reversal', () => {
  it('G0 fails whenever autonomyHaltReversed is false, and this module never claims otherwise', () => {
    const results = evaluateGates({ ...earnedInputs(), autonomyHaltReversed: false });
    expect(results.find((r) => r.gate === 'G0')?.passed).toBe(false);
    expect(allGatesEarned(results)).toBe(false);
  });
});

describe('evaluateGates: G1 shadow agreement', () => {
  it('fails under the decision-count floor even with a perfect agreement rate', () => {
    const results = evaluateGates({ ...earnedInputs(), shadowDecisionCount: 199 });
    expect(results.find((r) => r.gate === 'G1')?.passed).toBe(false);
  });
  it('fails under the 4-week floor', () => {
    const results = evaluateGates({ ...earnedInputs(), shadowWeeksOfData: 3 });
    expect(results.find((r) => r.gate === 'G1')?.passed).toBe(false);
  });
  it('fails under 80% agreement', () => {
    const results = evaluateGates({ ...earnedInputs(), shadowAgreementRate: 0.79 });
    expect(results.find((r) => r.gate === 'G1')?.passed).toBe(false);
  });
});

describe('evaluateGates: G2 compiler precision', () => {
  it('a single violation in the audit sample fails the gate, zero tolerance', () => {
    const results = evaluateGates({ ...earnedInputs(), compilerRejectViolations: 1 });
    expect(results.find((r) => r.gate === 'G2')?.passed).toBe(false);
  });
  it('fails under the 100-sample floor even with zero violations', () => {
    const results = evaluateGates({ ...earnedInputs(), compilerAuditSampleSize: 99 });
    expect(results.find((r) => r.gate === 'G2')?.passed).toBe(false);
  });
});

describe('evaluateGates: G3 suppression health', () => {
  it('any unknown verdict in the last 7 days fails the gate', () => {
    const results = evaluateGates({ ...earnedInputs(), suppressionUnknownVerdicts7d: 1 });
    expect(results.find((r) => r.gate === 'G3')?.passed).toBe(false);
  });
  it('a single DNC violation ever fails the gate, no expiry', () => {
    const results = evaluateGates({ ...earnedInputs(), suppressionDncViolationsEver: 1 });
    expect(results.find((r) => r.gate === 'G3')?.passed).toBe(false);
  });
});

describe('evaluateGates: G4 reply classification', () => {
  it('fails under 90% agreement', () => {
    const results = evaluateGates({ ...earnedInputs(), replyClassificationAgreementRate: 0.89 });
    expect(results.find((r) => r.gate === 'G4')?.passed).toBe(false);
  });
  it('fails under the 100-sample floor', () => {
    const results = evaluateGates({ ...earnedInputs(), replyClassificationSampleSize: 99 });
    expect(results.find((r) => r.gate === 'G4')?.passed).toBe(false);
  });
});

describe('evaluateGates: G5 truth yield', () => {
  it('fails under 20% resolution', () => {
    const results = evaluateGates({ ...earnedInputs(), hypothesisResolutionRate: 0.19 });
    expect(results.find((r) => r.gate === 'G5')?.passed).toBe(false);
  });
  it('fails under the 50-hypothesis floor', () => {
    const results = evaluateGates({ ...earnedInputs(), hypothesisSampleSize: 49 });
    expect(results.find((r) => r.gate === 'G5')?.passed).toBe(false);
  });
});

describe('evaluateGates: G6 canary', () => {
  it('fails an allowlist over 10 accounts', () => {
    const results = evaluateGates({ ...earnedInputs(), canaryAllowlistSize: 11 });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
  it('fails an empty allowlist too (0 is not a valid canary)', () => {
    const results = evaluateGates({ ...earnedInputs(), canaryAllowlistSize: 0 });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
  it('fails a daily cap over 5', () => {
    const results = evaluateGates({ ...earnedInputs(), canaryDailyCap: 6 });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
  it('fails under 2 weeks run', () => {
    const results = evaluateGates({ ...earnedInputs(), canaryWeeksRun: 1 });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
  it('any incident at all fails the gate', () => {
    const results = evaluateGates({ ...earnedInputs(), canaryIncidents: 1 });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
  it('no logged kill-switch drill fails the gate', () => {
    const results = evaluateGates({ ...earnedInputs(), killSwitchDrillLogged: false });
    expect(results.find((r) => r.gate === 'G6')?.passed).toBe(false);
  });
});

describe('allGatesEarned', () => {
  it('is false if even one gate among seven fails', () => {
    const results = evaluateGates({ ...earnedInputs(), suppressionDncViolationsEver: 1 });
    expect(allGatesEarned(results)).toBe(false);
  });
});

describe('red team T10: G1 never unlocks on conformity alone', () => {
  const g1 = (over: Partial<GateInputs>) => evaluateGates({ ...earnedInputs(), ...over }).find((r) => r.gate === 'G1')!;

  it('PROOF: 100% agreement over 1000 decisions and many weeks, with no real sends, does NOT earn G1', () => {
    const r = g1({ shadowAgreementRate: 1, shadowDecisionCount: 1000, shadowWeeksOfData: 20, peopleSentTo: 0, positiveOutcomeLowerBound: 0 });
    expect(r.passed).toBe(false);
    expect(r.detail).toContain('people sent to=0 (need 100)');
  });

  it('perfect conformity with sends that draw no replies does not earn G1', () => {
    expect(g1({ shadowAgreementRate: 1, peopleSentTo: 500, positiveOutcomeLowerBound: 0 }).passed).toBe(false);
  });

  it('real sends with replies still need the agreement bar', () => {
    expect(g1({ shadowAgreementRate: 0.5 }).passed).toBe(false);
    expect(g1({}).passed).toBe(true);
  });
});

describe('Release D review S6: G1 inputs are built in one place', () => {
  const rate = (low: number, high: number) => ({ interval: { low, high } });
  it('conformity is the ENROLL recommendation only; clicks on other cards never count', () => {
    const g = buildG1Inputs({
      agreement: { byAction: [{ key: 'nurture', rate: { rate: 1, n: 900 } }, { key: 'enroll_gap_sequence', rate: { rate: 0.4, n: 50 } }] },
      execution: { overall: { peopleMatured: 150, positivePerSend: rate(0.05, 0.12), optOutPerSend: rate(0, 0.02) } },
      weeksOfData: 6,
    });
    expect(g).toMatchObject({ shadowAgreementRate: 0.4, shadowDecisionCount: 50, peopleSentTo: 150, positiveOutcomeLowerBound: 0.05, optOutUpperBound: 0.02 });
    expect(evaluateGates({ ...earnedInputs(), ...g }).find((r) => r.gate === 'G1')!.passed).toBe(false);
  });

  it('missing data reads as failing, never passing', () => {
    const g = buildG1Inputs({ agreement: { byAction: [] }, execution: null, weeksOfData: 0 });
    expect(g).toMatchObject({ shadowAgreementRate: 0, shadowDecisionCount: 0, peopleSentTo: 0, positiveOutcomeLowerBound: 0, optOutUpperBound: 1 });
  });

  it('too many opt-outs fail G1 even with conformity and positive outcomes', () => {
    expect(evaluateGates({ ...earnedInputs(), optOutUpperBound: 0.09 }).find((r) => r.gate === 'G1')!.passed).toBe(false);
  });
});
