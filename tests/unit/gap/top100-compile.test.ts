/**
 * Top100 compile adapter (GAP Prospecting OS, Sprint 3, S3-T10).
 *
 * Fixture: one invented account (example.com), two people, four touches each,
 * research with three FACT rows (E1 fresh, E2 stale, E3 with a contradiction
 * and dated only by `retrieved`) and one INFERENCE row (E4). The private
 * research fields carry sentinel strings so the leak assertion is structural.
 *
 * Every verdict below is the real compiler's (ALL_CHECKS, the committed
 * claims snapshot, a stub critic that always passes), so the counts pin what
 * the adapter hands the compiler, not a stubbed check.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { COMPILER_VERSION } from '@/lib/gap/compiler';
import { compile, type CompileResult } from '@/lib/gap/compiler/compile';
import type { CompileEvidenceRef } from '@/lib/gap/compiler/types';
import type { CriticClient } from '@/lib/gap/critic-client';
import {
  buildAccountReport,
  compiledSteps,
  evidenceRefsFromResearch,
  personKeyFor,
  reduceReport,
  toCompileInputs,
  type CompiledStep,
  type LaneResearchFile,
  type LaneSequenceFile,
  type Top100CompileEntry,
} from '@/lib/gap/import/top100-compile';

const FIXTURES = path.join(__dirname, '..', '..', 'fixtures', 'gap', 'top100-compile');
const NOW = new Date('2026-09-23T12:00:00.000Z');

function loadLane(): { sequence: LaneSequenceFile; research: LaneResearchFile } {
  return {
    sequence: JSON.parse(readFileSync(path.join(FIXTURES, 'sequences', 'acme-example-com.json'), 'utf8')),
    research: JSON.parse(readFileSync(path.join(FIXTURES, 'research', 'acme-example-com.json'), 'utf8')),
  };
}

const STUB_CRITIC: CriticClient = { score: async () => ({ ok: true, verdict: 'pass', score: 100, findings: [] }) };

const JORDAN = '100000000001';
const RILEY = '100000000002';

async function compileFixture(now = NOW) {
  const { sequence, research } = loadLane();
  const prepared = toCompileInputs(sequence, research, { now, claimsValidator: validateClaimsUsed });
  const results = new Map<Top100CompileEntry, CompileResult>();
  for (const entry of prepared.inputs) {
    results.set(entry, await compile(entry.input, { critic: STUB_CRITIC, validateClaims: validateClaimsUsed, now: () => now }));
  }
  const steps = compiledSteps(prepared, results);
  const summary = reduceReport(steps);
  const report = buildAccountReport(prepared, results, { now, compilerVersion: COMPILER_VERSION, critic: 'stub' });
  return { prepared, results, steps, summary, report };
}

function stepOf(steps: CompiledStep[], personKey: string, step: number): CompiledStep {
  const found = steps.find((s) => s.personKey === personKey && s.step === step);
  if (!found) throw new Error(`no step ${step} for ${personKey}`);
  return found;
}

function check(s: CompiledStep, code: string) {
  const c = s.result.checks.find((x) => x.code === code);
  if (!c) throw new Error(`no ${code} on ${s.personKey} step ${s.step}`);
  return c;
}

// ---------------------------------------------------------------------------
// toCompileInputs
// ---------------------------------------------------------------------------

describe('toCompileInputs', () => {
  const { sequence, research } = loadLane();
  const prepared = toCompileInputs(sequence, research, { now: NOW, claimsValidator: validateClaimsUsed });

  it('emits one CompileInput per person per touch, keyed by the HubSpot contact id, in step order', () => {
    expect(prepared.key).toBe('acme-example-com');
    expect(prepared.account).toBe('Acme Foods');
    expect(prepared.inputs).toHaveLength(8);
    expect(prepared.inputs.map((e) => [e.personKey, e.stepIndex, e.step])).toEqual([
      [JORDAN, 0, 1], [JORDAN, 1, 2], [JORDAN, 2, 3], [JORDAN, 3, 4],
      [RILEY, 0, 1], [RILEY, 1, 2], [RILEY, 2, 3], [RILEY, 3, 4],
    ]);
    for (const e of prepared.inputs) {
      expect(e.input.stepIndex).toBe(e.stepIndex);
      expect(e.input.hypothesisId).toBeNull();
      expect(e.input.sequenceVersionId).toBeNull();
      expect(e.input.draftQueueItemId).toBeNull();
      expect(e.input.createdBy).toBe('compile-top100');
    }
  });

  it('priorBodies are the same person\'s earlier touches only', () => {
    const jordan = prepared.inputs.filter((e) => e.personKey === JORDAN);
    expect(jordan.map((e) => e.input.priorBodies.length)).toEqual([0, 1, 2, 3]);
    expect(jordan[3].input.priorBodies).toEqual(jordan.slice(0, 3).map((e) => e.input.body));
    const riley = prepared.inputs.filter((e) => e.personKey === RILEY);
    expect(riley[0].input.priorBodies).toEqual([]);
    expect(riley[1].input.priorBodies).toEqual([riley[0].input.body]);
  });

  it('builds evidence refs from the research ledger: E1 fresh, E2 stale, E3 superseded, E4 refused as not a fact', () => {
    const contract = prepared.inputs[0].input.contract as { evidence: CompileEvidenceRef[] };
    expect(contract.evidence.map((r) => [r.id, r.fresh, r.superseded, r.externalOk, r.firstParty])).toEqual([
      ['E1', true, false, true, false],
      ['E2', false, false, true, false],
      ['E3', true, true, true, false],
    ]);
    expect(contract.evidence.find((r) => r.id === 'E1')).toEqual({
      id: 'E1',
      title: 'Acme Foods posted three gate-clerk roles at its Ohio distribution center in August 2026.',
      url: 'https://example.com/careers/ohio-gate-clerk',
      externalOk: true,
      fresh: true,
      superseded: false,
      firstParty: false,
    });
    const refs = evidenceRefsFromResearch(research, NOW);
    expect(refs.refused).toEqual({ E4: 'not_a_fact' });
  });

  it('reports the exact warnings: retrieved-date fallback, refused row, archived people, unmarked bodies', () => {
    expect(prepared.warnings).toEqual([
      'freshness_from_retrieved:E3',
      'evidence_refused:E4:not_a_fact',
      'archived_skipped:1',
      `unmarked_body:${RILEY}:2`,
      `unmarked_body:${RILEY}:4`,
    ]);
  });

  it('passes the lane contract fields: evidenceIds, claimsUsed, stepCount 4, empty proofRefs and namedPipeline, journey cold, no journeyStage override', () => {
    const riley3 = prepared.inputs.find((e) => e.personKey === RILEY && e.step === 3)!;
    expect(riley3.input.contract).toMatchObject({
      evidenceIds: ['E1'],
      claimsUsed: ['INF-007'],
      stepCount: 4,
      proofRefs: [],
      namedPipeline: [],
      journey: 'cold',
    });
    expect(riley3.input.contract).toHaveProperty('top100Compile', {
      laneKey: 'acme-example-com',
      hubspotContactId: RILEY,
      personKey: RILEY,
      step: 3,
      stepIndex: 2,
    });
    expect(riley3.input.contract).not.toHaveProperty('journeyStage');
    expect(riley3.input.contract).not.toHaveProperty('wordRange');
    expect(riley3.input.contract).not.toHaveProperty('validateClaims');
  });

  it('carries the CLI\'s pipeline names onto namedPipeline when given', () => {
    const withNames = toCompileInputs(sequence, research, {
      now: NOW,
      claimsValidator: validateClaimsUsed,
      namedPipeline: ['Example Motors'],
    });
    expect((withNames.inputs[0].input.contract as { namedPipeline: string[] }).namedPipeline).toEqual(['Example Motors']);
  });

  it('personKeyFor falls back to a name slug without a contact id', () => {
    expect(personKeyFor({ person: 'Jordan Vale', hubspot_contact_id: '42' })).toBe('42');
    expect(personKeyFor({ person: "Riley O'Kafor Jr." })).toBe('riley-o-kafor-jr');
    expect(personKeyFor({ person: '   ' })).toBe('unnamed');
  });
});

// ---------------------------------------------------------------------------
// Compile outcomes through the real checks
// ---------------------------------------------------------------------------

describe('compile outcomes on the fixture lane', () => {
  it('the clean step passes every check', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, JORDAN, 1);
    expect(s.result.verdict).toBe('pass');
    expect(s.result.checks.every((c) => c.passed)).toBe(true);
    expect(s.result.evidenceIdsUsed).toEqual(['E1']);
  });

  it('C01 rejects the touch citing the stale ref with the stale reason', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, JORDAN, 2);
    expect(s.result.verdict).toBe('reject');
    expect(check(s, 'C01')).toMatchObject({ passed: false, severity: 'reject', detail: 'marker [[SRC:E2]] cites stale evidence E2' });
  });

  it('C01 rejects the touch citing the INFERENCE row as unresolved (the row never became a ref)', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, JORDAN, 3);
    expect(s.result.verdict).toBe('reject');
    expect(check(s, 'C01')).toMatchObject({
      passed: false,
      severity: 'reject',
      detail: 'marker [[SRC:E4]] resolves to no evidence ref (id E4)',
    });
  });

  it('C01 rejects the touch citing the contradicted ref as superseded', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, JORDAN, 4);
    expect(check(s, 'C01')).toMatchObject({ passed: false, detail: 'marker [[SRC:E3]] cites superseded evidence E3' });
  });

  it('C09 rejects the meeting ask at step 1', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, RILEY, 1);
    expect(s.result.verdict).toBe('reject');
    expect(s.result.ctaFamily).toBe('meeting_request');
    expect(check(s, 'C09')).toMatchObject({
      passed: false,
      severity: 'reject',
      detail: 'CTA family meeting_request is disallowed before a meeting (step 0, sequence_step_1): "Open to a quick call on it?"',
    });
    expect(s.result.checks.filter((c) => !c.passed).map((c) => c.code)).toEqual(['C09']);
  });

  it('an unmarked body is judged as written: C01 fails the uncited number, C12 finds no evidence id', async () => {
    const { steps } = await compileFixture();
    const s = stepOf(steps, RILEY, 2);
    expect(s.result.evidenceIdsUsed).toEqual([]);
    expect(check(s, 'C01').detail).toMatch(/^number "110 dock doors" is neither in a cited evidence title nor a canon figure/);
    expect(check(s, 'C12').detail).toBe('no evidence id: a follow-up cites at least one marker unused in prior steps (prior ids: E1)');
  });

  it('C13 refuses the question-only claim outside a question and the DO_NOT_USE claim by id', async () => {
    const { steps } = await compileFixture();
    expect(check(stepOf(steps, RILEY, 3), 'C13').detail).toBe(
      'claim refused: claim_needs_question:INF-007 (claims INF-007; stepIsQuestion=false)',
    );
    expect(check(stepOf(steps, RILEY, 4), 'C13').detail).toBe(
      'claim refused: claim_forbidden:CR-021 (claims CR-021; stepIsQuestion=true)',
    );
  });

  it('reduceReport pins the exact per-check counts, totals and worst order', async () => {
    const { summary } = await compileFixture();
    expect(summary.perCheck).toEqual({
      C01: { pass: 4, review: 0, reject: 4 },
      C02: { pass: 8, review: 0, reject: 0 },
      C03: { pass: 8, review: 0, reject: 0 },
      C04: { pass: 8, review: 0, reject: 0 },
      C05: { pass: 8, review: 0, reject: 0 },
      C06: { pass: 8, review: 0, reject: 0 },
      C07: { pass: 8, review: 0, reject: 0 },
      C08: { pass: 8, review: 0, reject: 0 },
      C09: { pass: 7, review: 0, reject: 1 },
      C10: { pass: 8, review: 0, reject: 0 },
      C11: { pass: 8, review: 0, reject: 0 },
      C12: { pass: 5, review: 0, reject: 3 },
      C13: { pass: 6, review: 0, reject: 2 },
      C14: { pass: 4, review: 4, reject: 0 },
      C15: { pass: 7, review: 1, reject: 0 },
      C16: { pass: 8, review: 0, reject: 0 },
    });
    expect(summary.totals).toEqual({ pass: 1, review: 0, reject: 7, steps: 8, accounts: 1 });
    expect(summary.perAccount).toEqual({ 'acme-example-com': { pass: 1, review: 0, reject: 7 } });
    expect(summary.worst.map((w) => [w.person, w.step, w.verdict, w.failed, w.code])).toEqual([
      ['Riley Okafor', 4, 'reject', 4, 'C12'],
      ['Riley Okafor', 2, 'reject', 3, 'C01'],
      ['Riley Okafor', 3, 'reject', 2, 'C12'],
      ['Jordan Vale', 2, 'reject', 2, 'C01'],
      ['Jordan Vale', 4, 'reject', 2, 'C01'],
      ['Jordan Vale', 3, 'reject', 1, 'C01'],
      ['Riley Okafor', 1, 'reject', 1, 'C09'],
    ]);
    expect(summary.worst[0]).toMatchObject({ account: 'acme-example-com', detail: expect.stringContaining('no evidence id') });
  });
});

// ---------------------------------------------------------------------------
// Privacy and determinism
// ---------------------------------------------------------------------------

describe('report privacy and determinism', () => {
  it('never carries a private research field into a contract or the report', async () => {
    const { prepared, report, summary } = await compileFixture();
    const serializedInputs = JSON.stringify(prepared.inputs);
    const serializedReport = JSON.stringify(report);
    const serializedSummary = JSON.stringify(summary);
    for (const sentinel of ['SKEPTIC-OBJECTION-SENTINEL', 'UNKNOWNS-SENTINEL', 'CONTRARY-EVIDENCE-SENTINEL', 'CONFIDENCE-NOTE-SENTINEL']) {
      expect(serializedInputs, sentinel).not.toContain(sentinel);
      expect(serializedReport, sentinel).not.toContain(sentinel);
      expect(serializedSummary, sentinel).not.toContain(sentinel);
    }
    for (const key of ['skeptic_objection', 'skepticObjection', 'unknowns', 'contrary_evidence']) {
      expect(serializedInputs, key).not.toContain(`"${key}"`);
      expect(serializedReport, key).not.toContain(`"${key}"`);
    }
  });

  it('the report carries no body field and no duplicated body text', async () => {
    const { report } = await compileFixture();
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain('"body"');
    expect(serialized).not.toContain('"priorBodies"');
    expect(serialized).not.toContain('Two of them are night shift');
    expect(report.people.map((p) => [p.personKey, p.steps.length])).toEqual([[JORDAN, 4], [RILEY, 4]]);
    expect(report.people[1].steps[2]).toMatchObject({
      step: 3,
      subject: 'Half the turn is waiting',
      verdict: 'reject',
      evidenceIds: ['E1'],
      claimsUsed: ['INF-007'],
      evidenceIdsUsed: ['E1'],
    });
    expect(report).toMatchObject({
      schema: 'gap-compile-top100.v1',
      journey: 'cold',
      compiledAt: NOW.toISOString(),
      compilerVersion: COMPILER_VERSION,
      critic: 'stub',
    });
  });

  it('two runs with the same now are byte-identical', async () => {
    const a = await compileFixture();
    const b = await compileFixture();
    expect(JSON.stringify(a.report)).toBe(JSON.stringify(b.report));
    expect(JSON.stringify(a.summary)).toBe(JSON.stringify(b.summary));
    expect(JSON.stringify(a.prepared.inputs)).toBe(JSON.stringify(b.prepared.inputs));
  });

  it('a later now turns the fresh ref stale (freshness is a function of the injected clock)', () => {
    const { research } = loadLane();
    const later = evidenceRefsFromResearch(research, new Date('2027-06-01T00:00:00.000Z'));
    expect(later.refs.map((r) => [r.id, r.fresh])).toEqual([['E1', false], ['E2', false], ['E3', false]]);
  });
});

// ---------------------------------------------------------------------------
// reduceReport on synthetic results
// ---------------------------------------------------------------------------

describe('reduceReport', () => {
  function synthetic(
    account: string,
    person: string,
    step: number,
    verdict: CompileResult['verdict'],
    checks: Array<[string, boolean, 'reject' | 'review']>,
    critic: CompileResult['critic'] = { ok: true, verdict: 'pass', score: 100, findings: [] },
  ): CompiledStep {
    return {
      account,
      personKey: person.toLowerCase(),
      person,
      stepIndex: step - 1,
      step,
      subject: 's',
      result: {
        verdict,
        checks: checks.map(([code, passed, severity]) => ({ code, passed, severity, detail: `${code} detail`, span: null })),
        critic,
        wordCount: 50,
        ctaFamily: null,
        allowedCtaFamily: 'scorecard_reply',
        evidenceIdsUsed: [],
        compilerVersion: COMPILER_VERSION,
        hypothesisId: null,
        stepIndex: step - 1,
      },
    };
  }

  it('buckets review_required verdicts, headlines a review check when no reject failed, and names the critic when only it failed', () => {
    const steps = [
      synthetic('b-com', 'Bea', 1, 'review_required', [['C01', true, 'reject'], ['C15', false, 'review']]),
      synthetic('a-com', 'Al', 1, 'pass', [['C01', true, 'reject'], ['C15', true, 'review']]),
      synthetic('a-com', 'Al', 2, 'review_required', [['C01', true, 'reject'], ['C15', true, 'review']], { ok: false, reason: 'critic_unreachable' }),
      synthetic('a-com', 'Al', 3, 'reject', [['C01', false, 'reject'], ['C15', false, 'review']]),
    ];
    const summary = reduceReport(steps);
    expect(summary.perCheck).toEqual({ C01: { pass: 3, review: 0, reject: 1 }, C15: { pass: 2, review: 2, reject: 0 } });
    expect(summary.perAccount).toEqual({ 'a-com': { pass: 1, review: 1, reject: 1 }, 'b-com': { pass: 0, review: 1, reject: 0 } });
    expect(summary.totals).toEqual({ pass: 1, review: 2, reject: 1, steps: 4, accounts: 2 });
    expect(summary.worst).toEqual([
      { account: 'a-com', person: 'Al', step: 3, verdict: 'reject', failed: 2, code: 'C01', detail: 'C01 detail' },
      { account: 'b-com', person: 'Bea', step: 1, verdict: 'review_required', failed: 1, code: 'C15', detail: 'C15 detail' },
      { account: 'a-com', person: 'Al', step: 2, verdict: 'review_required', failed: 0, code: 'critic', detail: 'critic_unreachable' },
    ]);
  });

  it('caps worst at ten and keeps a deterministic tie order', () => {
    const steps: CompiledStep[] = [];
    for (let i = 12; i >= 1; i -= 1) {
      steps.push(synthetic('z-com', `P${String(i).padStart(2, '0')}`, 1, 'reject', [['C01', false, 'reject']]));
    }
    const summary = reduceReport(steps);
    expect(summary.worst).toHaveLength(10);
    expect(summary.worst.map((w) => w.person)).toEqual(['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10']);
  });

  it('is empty on no results', () => {
    expect(reduceReport([])).toEqual({ perCheck: {}, perAccount: {}, totals: { pass: 0, review: 0, reject: 0, steps: 0, accounts: 0 }, worst: [] });
  });
});
