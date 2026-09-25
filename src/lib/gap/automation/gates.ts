/**
 * GAP Prospecting OS, Sprint 7: the G0-G6 earned-gate evaluator (spec
 * section 10).
 *
 * Pure over caller-supplied numbers: this module makes NO prisma calls of
 * its own and owns no query. The caller assembles `GateInputs` from
 * whatever report already computes each number (routing agreement, the
 * learning report, the canary's own incident/drill log) and this module
 * only applies the thresholds. Kept this way so a gate check can never
 * silently drift from the report it reads, and so this ticket touches no
 * file another ticket (learning, replies) owns.
 *
 * `allGatesEarned` is what GAP_AUTO_ENROLL_ENABLED being turned on should
 * require: every gate G1-G6 passed, AND G0 (the owner's own halt reversal)
 * -- which this module can only ever report as NOT met, since nothing here
 * reverses the halt or reads its live state; that is Casey's one POST,
 * never automated (rule 6 of the runtime handoff).
 */

export type GateId = 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6';

export interface GateResult {
  gate: GateId;
  passed: boolean;
  detail: string;
}

export interface GateInputs {
  /** G1: shadow routing-agreement rate for enroll_gap_sequence, decision count, weeks of data. */
  shadowAgreementRate: number;
  shadowDecisionCount: number;
  shadowWeeksOfData: number;
  /** G2: post-hoc reject-class violations found in the audit sample, and the sample size. */
  compilerRejectViolations: number;
  compilerAuditSampleSize: number;
  /** G3: unknown suppression verdicts in the last 7 days, and DNC violations ever recorded. */
  suppressionUnknownVerdicts7d: number;
  suppressionDncViolationsEver: number;
  /** G4: AI suggestion vs human confirmation agreement rate and sample size. */
  replyClassificationAgreementRate: number;
  replyClassificationSampleSize: number;
  /** G5: hypothesis resolution rate (confirmed + partially_confirmed / terminal) and sample size. */
  hypothesisResolutionRate: number;
  hypothesisSampleSize: number;
  /** G6: canary allowlist size, per-rule/daily caps, weeks run, incidents, whether a kill-switch drill was logged. */
  canaryAllowlistSize: number;
  canaryPerRuleCap: number;
  canaryDailyCap: number;
  canaryWeeksRun: number;
  canaryIncidents: number;
  killSwitchDrillLogged: boolean;
  /** G0: has the owner reversed the 2026-08-19 autonomy halt? This module never reads or changes it; the caller supplies the current state. */
  autonomyHaltReversed: boolean;
}

const G1_MIN_DECISIONS = 200;
const G1_MIN_WEEKS = 4;
const G1_MIN_AGREEMENT = 0.8;
const G2_MAX_SAMPLE_VIOLATIONS = 0;
const G2_MIN_SAMPLE = 100;
const G3_MAX_UNKNOWN_7D = 0;
const G3_MAX_DNC_EVER = 0;
const G4_MIN_AGREEMENT = 0.9;
const G4_MIN_SAMPLE = 100;
const G5_MIN_RESOLUTION = 0.2;
const G5_MIN_SAMPLE = 50;
const G6_MAX_ALLOWLIST = 10;
const G6_MAX_DAILY_CAP = 5;
const G6_MIN_WEEKS = 2;

function evaluateG0(inputs: GateInputs): GateResult {
  return {
    gate: 'G0',
    passed: inputs.autonomyHaltReversed,
    detail: inputs.autonomyHaltReversed
      ? 'autonomy halt reversed by the owner'
      : 'autonomy halt intact (2026-08-19); only Casey reverses it, one POST, never automated',
  };
}

function evaluateG1(inputs: GateInputs): GateResult {
  const passed =
    inputs.shadowDecisionCount >= G1_MIN_DECISIONS && inputs.shadowWeeksOfData >= G1_MIN_WEEKS && inputs.shadowAgreementRate >= G1_MIN_AGREEMENT;
  return {
    gate: 'G1',
    passed,
    detail: `n=${inputs.shadowDecisionCount} (need ${G1_MIN_DECISIONS}), weeks=${inputs.shadowWeeksOfData} (need ${G1_MIN_WEEKS}), agreement=${(inputs.shadowAgreementRate * 100).toFixed(1)}% (need ${(G1_MIN_AGREEMENT * 100).toFixed(0)}%)`,
  };
}

function evaluateG2(inputs: GateInputs): GateResult {
  const passed = inputs.compilerAuditSampleSize >= G2_MIN_SAMPLE && inputs.compilerRejectViolations <= G2_MAX_SAMPLE_VIOLATIONS;
  return {
    gate: 'G2',
    passed,
    detail: `${inputs.compilerRejectViolations} violation(s) in a sample of ${inputs.compilerAuditSampleSize} (need sample>=${G2_MIN_SAMPLE}, violations<=${G2_MAX_SAMPLE_VIOLATIONS})`,
  };
}

function evaluateG3(inputs: GateInputs): GateResult {
  const passed = inputs.suppressionUnknownVerdicts7d <= G3_MAX_UNKNOWN_7D && inputs.suppressionDncViolationsEver <= G3_MAX_DNC_EVER;
  return {
    gate: 'G3',
    passed,
    detail: `${inputs.suppressionUnknownVerdicts7d} unknown verdict(s) in 7d, ${inputs.suppressionDncViolationsEver} DNC violation(s) ever (both must be 0)`,
  };
}

function evaluateG4(inputs: GateInputs): GateResult {
  const passed = inputs.replyClassificationSampleSize >= G4_MIN_SAMPLE && inputs.replyClassificationAgreementRate >= G4_MIN_AGREEMENT;
  return {
    gate: 'G4',
    passed,
    detail: `n=${inputs.replyClassificationSampleSize} (need ${G4_MIN_SAMPLE}), agreement=${(inputs.replyClassificationAgreementRate * 100).toFixed(1)}% (need ${(G4_MIN_AGREEMENT * 100).toFixed(0)}%)`,
  };
}

function evaluateG5(inputs: GateInputs): GateResult {
  const passed = inputs.hypothesisSampleSize >= G5_MIN_SAMPLE && inputs.hypothesisResolutionRate >= G5_MIN_RESOLUTION;
  return {
    gate: 'G5',
    passed,
    detail: `n=${inputs.hypothesisSampleSize} (need ${G5_MIN_SAMPLE}), resolution=${(inputs.hypothesisResolutionRate * 100).toFixed(1)}% (need ${(G5_MIN_RESOLUTION * 100).toFixed(0)}%)`,
  };
}

function evaluateG6(inputs: GateInputs): GateResult {
  const passed =
    inputs.canaryAllowlistSize > 0 &&
    inputs.canaryAllowlistSize <= G6_MAX_ALLOWLIST &&
    inputs.canaryDailyCap <= G6_MAX_DAILY_CAP &&
    inputs.canaryWeeksRun >= G6_MIN_WEEKS &&
    inputs.canaryIncidents === 0 &&
    inputs.killSwitchDrillLogged;
  return {
    gate: 'G6',
    passed,
    detail: `allowlist=${inputs.canaryAllowlistSize} (max ${G6_MAX_ALLOWLIST}), dailyCap=${inputs.canaryDailyCap} (max ${G6_MAX_DAILY_CAP}), weeks=${inputs.canaryWeeksRun} (need ${G6_MIN_WEEKS}), incidents=${inputs.canaryIncidents} (need 0), drillLogged=${inputs.killSwitchDrillLogged}`,
  };
}

/** Every gate, G0 through G6, in the order the owner reads them. */
export function evaluateGates(inputs: GateInputs): GateResult[] {
  return [evaluateG0(inputs), evaluateG1(inputs), evaluateG2(inputs), evaluateG3(inputs), evaluateG4(inputs), evaluateG5(inputs), evaluateG6(inputs)];
}

/** True only when every gate, including G0, has passed. */
export function allGatesEarned(results: readonly GateResult[]): boolean {
  return results.every((r) => r.passed);
}
