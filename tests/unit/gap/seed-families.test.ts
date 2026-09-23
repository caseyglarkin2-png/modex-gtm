/**
 * S3-T11: the four seed families compile. Every step of every family runs
 * through the S3-T9 orchestrator `compile()` with a stub critic that passes,
 * against the fixture evidence in tests/fixtures/gap/seed-evidence.json and
 * the committed claims snapshot validator. Every one of the sixteen checks
 * (groups A, B and C, review checks included) must pass on the stored body
 * AND on a rendered body (placeholders filled), because the greeting line
 * only strips once `{{first_name}}` is a name and C04 / C07 must hold there.
 *
 * Voice invariants (no em dash, no "throughput", no singular "yard" outside
 * the accepted compounds) are scanned across every subject and body.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { compile, type CompileResult } from '@/lib/gap/compiler/compile';
import { GROUP_A_CHECKS } from '@/lib/gap/compiler/checks/c01-evidence';
import { GROUP_B_CHECKS } from '@/lib/gap/compiler/checks/c04-product';
import { GROUP_C_CHECKS } from '@/lib/gap/compiler/checks/c13-claims';
import { SINGULAR_YARD_RE } from '@/lib/gap/compiler/checks/c11-banned';
import { LATER_WORD_RANGE, STEP0_WORD_RANGE, classifyCtaFamily, findCtaSentences } from '@/lib/gap/compiler/checks/c07-structure';
import { markerIds } from '@/lib/gap/compiler/checks/c12-newinfo';
import { CHECK_CODES } from '@/lib/gap/compiler';
import { stripGreetingAndSignature, wordCount } from '@/lib/gap/compiler/text';
import type { CriticClient } from '@/lib/gap/critic-client';
import { parseSteps, stepsHash, validateStepsForVersion } from '@/lib/gap/sequence/steps';
import {
  SEED_DELAYS_BUSINESS_DAYS,
  SEED_FAMILIES,
  SEED_FAMILY_KEYS,
  renderSeedPlaceholders,
  type SeedFamily,
} from '@/lib/gap/sequences/families';
import { PERSONAS, PROBLEM_FAMILIES } from '@/lib/gap/taxonomy';

interface FixtureRef {
  id: string;
  signalType: string;
  title: string;
  url: string;
  externalOk: boolean;
  fresh: boolean;
  superseded: boolean;
  firstParty: boolean;
}

interface Fixture {
  schema: string;
  namedPipeline: string[];
  families: Record<string, { hypothesis: { observation: string; problemHypothesis: string; problemFamily: string }; evidence: FixtureRef[] }>;
}

const FIXTURE: Fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../fixtures/gap/seed-evidence.json'), 'utf8'),
) as Fixture;

const CRITIC_PASS: CriticClient = { score: vi.fn(async () => ({ ok: true as const, verdict: 'pass' as const, score: 100, findings: [] })) };

const RENDER = { firstName: 'Kara', account: 'Acme Logistics' };

function contractFor(fam: SeedFamily, stepIndex: number) {
  const fx = FIXTURE.families[fam.key];
  return {
    hypothesis: fx.hypothesis,
    evidence: fx.evidence,
    proofRefs: [],
    namedPipeline: FIXTURE.namedPipeline,
    claimsUsed: fam.steps.steps[stepIndex].claimsUsed,
    stepCount: fam.steps.steps.length,
  };
}

function stepCopy(fam: SeedFamily, i: number, rendered: boolean): { subject: string; body: string } {
  const t = fam.steps.steps[i].templates!;
  const subject = t.subjectTemplate ?? '';
  const body = t.bodyTemplate ?? '';
  return rendered
    ? { subject: renderSeedPlaceholders(subject, RENDER), body: renderSeedPlaceholders(body, RENDER) }
    : { subject, body };
}

async function compileStep(fam: SeedFamily, i: number, rendered: boolean): Promise<CompileResult> {
  const { subject, body } = stepCopy(fam, i, rendered);
  const priorBodies = fam.steps.steps.slice(0, i).map((_, j) => stepCopy(fam, j, rendered).body);
  return compile(
    {
      hypothesisId: null,
      sequenceVersionId: null,
      stepIndex: i,
      subject,
      body,
      priorBodies,
      contract: contractFor(fam, i),
      createdBy: 'seed-families.test',
    },
    { critic: CRITIC_PASS, validateClaims: validateClaimsUsed },
  );
}

function failures(result: CompileResult): string {
  return result.checks
    .filter((c) => !c.passed)
    .map((c) => `${c.code}: ${c.detail}`)
    .join('\n');
}

const EM_DASH = String.fromCharCode(0x2014);

describe('seed families: shape', () => {
  it('has exactly the four families in the ticket, keyed and named', () => {
    expect(SEED_FAMILY_KEYS).toEqual(['network_standardization', 'hidden_capacity', 'automation_readiness', 'new_sites_acquisitions']);
    expect(SEED_FAMILIES.map((f) => f.name)).toEqual([
      'Network Standardization',
      'Hidden Capacity',
      'Automation Readiness',
      'New Sites and Acquisitions',
    ]);
  });

  it('every problem family and persona is a taxonomy key', () => {
    for (const fam of SEED_FAMILIES) {
      expect(PROBLEM_FAMILIES, `${fam.key} problemFamily`).toContain(fam.problemFamily);
      expect(PERSONAS, `${fam.key} persona`).toContain(fam.persona);
      expect(FIXTURE.families[fam.key].hypothesis.problemFamily).toBe(fam.problemFamily);
    }
    expect(SEED_FAMILIES.map((f) => f.problemFamily)).toEqual([
      'network_standardization',
      'hidden_capacity',
      'automation_readiness',
      'network_standardization',
    ]);
  });

  it('every family parses as steps.v2 with four steps at 0/4/5/6 business days and no step-0 proof', () => {
    for (const fam of SEED_FAMILIES) {
      const parsed = parseSteps(fam.steps);
      expect(parsed.ok, `${fam.key}: ${parsed.ok ? '' : parsed.reason}`).toBe(true);
      const validated = validateStepsForVersion(fam.steps, {
        claims: (ids, q) => {
          const r = validateClaimsUsed(ids, { stepIsQuestion: q, surface: 'sales_email' });
          return r.ok ? { ok: true } : { ok: false, reason: r.reason };
        },
      });
      expect(validated.ok, `${fam.key}: ${validated.ok ? '' : validated.reason}`).toBe(true);
      expect(fam.steps.steps).toHaveLength(4);
      expect(fam.steps.steps.map((s) => s.delay.value)).toEqual([...SEED_DELAYS_BUSINESS_DAYS]);
      expect(fam.steps.steps.every((s) => s.delay.unit === 'business_days')).toBe(true);
      expect(fam.steps.steps.map((s) => s.purpose)).toEqual(['intrigue', 'root_cause', 'value_offer', 'close_loop']);
      expect(fam.steps.steps[0].productProofAllowed).toBe(false);
      expect(fam.evidence).toHaveLength(4);
      expect(stepsHash(fam.steps)).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('every step cites exactly the fixture refs its evidence list names, and each follow-up cites a new one', () => {
    for (const fam of SEED_FAMILIES) {
      const known = new Set(FIXTURE.families[fam.key].evidence.map((e) => e.id));
      const seen = new Set<string>();
      fam.steps.steps.forEach((step, i) => {
        const ids = markerIds(step.templates?.bodyTemplate ?? '');
        expect(ids, `${fam.key} step ${i} markers`).toEqual(fam.evidence[i]);
        for (const id of ids) {
          expect(known.has(id), `${fam.key} step ${i} cites unknown fixture ${id}`).toBe(true);
          expect(seen.has(id), `${fam.key} step ${i} reuses ${id}`).toBe(false);
          seen.add(id);
        }
      });
    }
  });
});

describe('seed families: every step passes every compiler check', () => {
  const cases = SEED_FAMILIES.flatMap((fam) =>
    fam.steps.steps.flatMap((_, i) => [
      { fam, i, rendered: false },
      { fam, i, rendered: true },
    ]),
  );

  it.each(cases)('$fam.key step $i (rendered=$rendered) compiles pass', async ({ fam, i, rendered }) => {
    const result = await compileStep(fam, i, rendered);
    const detail = failures(result);
    expect(result.checks.map((c) => c.code)).toEqual([...CHECK_CODES]);
    const failedCodes = result.checks.filter((c) => !c.passed).map((c) => c.code);
    expect(failedCodes, `${fam.key} step ${i} failed ${failedCodes.join(', ')}:\n${detail}`).toEqual([]);
    expect(result.verdict, `${fam.key} step ${i}: ${detail}`).toBe('pass');
  });

  it('the three group arrays cover the sixteen codes the orchestrator ran', () => {
    expect(GROUP_A_CHECKS.length + GROUP_B_CHECKS.length + GROUP_C_CHECKS.length).toBe(CHECK_CODES.length);
  });
});

describe('seed families: word counts and CTA families', () => {
  it('rendered word counts sit inside the lane ranges and each step has one CTA in the allowed family', () => {
    for (const fam of SEED_FAMILIES) {
      fam.steps.steps.forEach((_, i) => {
        const { body } = stepCopy(fam, i, true);
        const words = wordCount(body);
        const range = i === 0 ? STEP0_WORD_RANGE : LATER_WORD_RANGE;
        expect(words, `${fam.key} step ${i} words=${words}`).toBeGreaterThanOrEqual(range.min);
        expect(words, `${fam.key} step ${i} words=${words}`).toBeLessThanOrEqual(range.max);
        const ctas = findCtaSentences(body);
        expect(ctas, `${fam.key} step ${i} ctas`).toHaveLength(1);
        const family = classifyCtaFamily(ctas[0].sentence);
        expect(family).not.toBe('meeting_request');
        if (i === 0) expect(family, `${fam.key} step 0 cta`).toBe('scorecard_reply');
        else expect(['asset_offer', 'scorecard_reply'], `${fam.key} step ${i} cta`).toContain(family);
      });
    }
  });
});

describe('seed families: voice scan', () => {
  it('no em dash, no throughput, no standardize paper, no singular yard, in any subject or body', () => {
    for (const fam of SEED_FAMILIES) {
      fam.steps.steps.forEach((step, i) => {
        const subject = step.templates?.subjectTemplate ?? '';
        const body = step.templates?.bodyTemplate ?? '';
        for (const [where, text] of [
          ['subject', subject],
          ['body', body],
        ] as const) {
          const label = `${fam.key} step ${i} ${where}`;
          expect(text.includes(EM_DASH), `${label}: em dash`).toBe(false);
          expect(/\bthroughput\b/i.test(text), `${label}: throughput`).toBe(false);
          expect(/standardi[sz]\w* (?:the )?(?:paper|paperwork|clipboard|forms)/i.test(text), `${label}: standardize paper`).toBe(false);
          const yard = SINGULAR_YARD_RE.exec(where === 'body' ? stripGreetingAndSignature(text) : text);
          expect(yard, `${label}: singular yard "${yard?.[0]}"`).toBeNull();
        }
      });
    }
  });
});
