import { describe, expect, it } from 'vitest';
import {
  personaFromDecisionOwner,
  planTop100ResearchImport,
  type ResearchV1Like,
} from '@/lib/gap/import/top100-research';
import { validateObservation } from '@/lib/gap/hypothesis/observation';
import honda from '../../fixtures/gap/top100-research-honda.json';

const NOW = new Date('2026-09-23T12:00:00.000Z');
const OPTS = {
  runId: 'top100-2026-09-12',
  accountName: 'Honda',
  hubspotCompanyId: '55554513979',
  now: NOW,
  registeredBy: 'test-suite',
};

const research = honda as unknown as ResearchV1Like;
const facts = research.evidence.filter((e) => e.class === 'FACT');
const inferences = research.evidence.filter((e) => e.class !== 'FACT');

describe('planTop100ResearchImport: signals', () => {
  const plan = planTop100ResearchImport(research, OPTS);
  const [h] = plan.hypotheses;

  it('emits exactly one hypothesis plan with sourceRef research:<runId>:<key>', () => {
    expect(plan.hypotheses).toHaveLength(1);
    expect(h.sourceRef).toBe('research:top100-2026-09-12:honda-com');
    expect(plan.summary.hypotheses).toBe(1);
    expect(plan.summary.bids).toBe(0);
    expect(h.bids).toEqual([]);
  });

  it('turns every FACT row into a signal input with sourceId <runId>:<key>:<evidence_id>', () => {
    expect(facts.length).toBeGreaterThan(0);
    expect(h.signals.map((s) => s.sourceId)).toEqual(
      facts.map((e) => `top100-2026-09-12:honda-com:${e.evidence_id}`),
    );
    for (const s of h.signals) {
      expect(s.sourceKind).toBe('top100_evidence');
      expect(s.claimClass).toBe('FACT');
      expect(s.accountName).toBe('Honda');
      expect(s.hubspotCompanyId).toBe('55554513979');
      expect(s.registeredBy).toBe('test-suite');
    }
  });

  it('refuses INFERENCE and UNKNOWN rows as not_a_fact', () => {
    expect(inferences.length).toBeGreaterThan(0);
    expect(h.signalRefusals).toEqual(inferences.map((e) => ({ ref: e.evidence_id, reason: 'not_a_fact' })));
    expect(plan.summary.signalRefusals).toEqual({ not_a_fact: inferences.length });
  });
});

describe('planTop100ResearchImport: hypothesis fields', () => {
  const plan = planTop100ResearchImport(research, OPTS);
  const [h] = plan.hypotheses;

  it('maps the causal chain and research fields onto the plan', () => {
    expect(h.accountName).toBe('Honda');
    expect(h.hubspotCompanyId).toBe('55554513979');
    expect(h.persona).toBe('supply_chain');
    expect(h.problemHypothesis).toBe(`I suspect ${research.structural_problem}`);
    expect(h.rootCauseHypotheses).toEqual([research.causal_chain.yard_dependency]);
    expect(h.impactHypotheses).toEqual([research.causal_chain.affected_kpi, research.value_hypothesis]);
    expect(h.whyNow).toBe(research.why_now.trigger);
    expect(h.falsificationQuestions).toEqual([research.causal_chain.first_conversation]);
    expect(h.whatANoMeans).toBe(research.causal_chain.disproof);
    expect(h.contraryEvidence).toBe(research.contrary_evidence);
    expect(h.predictedBuyerLanguage).toBeNull();
    expect(h.buyingCenter).toBeNull();
    expect(h.confidence).toBe(75);
    expect(h.metadata).toEqual({
      skepticObjection: research.skeptic_objection,
      initialUseCase: research.initial_use_case,
      unknowns: research.unknowns,
      researchedAt: research.researched_at,
      domain: research.domain,
    });
    expect(h.problemFamily).not.toBe('unmapped');
    expect(h.familyUnmapped).toBe(false);
  });

  it('maps research confidence high 75 / medium 50 / low 30', () => {
    for (const [grade, expected] of [['high', 75], ['medium', 50], ['low', 30]] as const) {
      const one = planTop100ResearchImport({ ...research, confidence: grade }, OPTS);
      expect(one.hypotheses[0].confidence).toBe(expected);
    }
  });

  it('keeps a hedged structural problem as is', () => {
    const one = planTop100ResearchImport({ ...research, structural_problem: 'The gate is likely the constraint' }, OPTS);
    expect(one.hypotheses[0].problemHypothesis).toBe('The gate is likely the constraint');
  });

  it('references only why_now FACT evidence ids in the observation template, and no observation text yet', () => {
    expect(h.observation).toBe('');
    expect(h.needsObservation).toBe(false);
    const whyNowFacts = research.why_now.evidence_ids.filter((id) => facts.some((e) => e.evidence_id === id));
    const whyNowInferences = research.why_now.evidence_ids.filter((id) => !facts.some((e) => e.evidence_id === id));
    expect(whyNowFacts.length).toBeGreaterThan(0);
    expect(whyNowInferences.length).toBeGreaterThan(0);
    expect(h.observationTemplate.map((line) => line.evidenceId)).toEqual(whyNowFacts);
    for (const line of h.observationTemplate) {
      expect(line.signalSourceId).toBe(`top100-2026-09-12:honda-com:${line.evidenceId}`);
      expect(line.text.length).toBeLessThanOrEqual(160);
      expect(line.text.length).toBeGreaterThan(0);
    }
  });

  it('renders template lines that validate as cited sentences once ids are substituted', () => {
    const rendered = h.observationTemplate.map((line) => `${line.text} [S:sig_${line.evidenceId}].`).join(' ');
    const ids = h.observationTemplate.map((line) => `sig_${line.evidenceId}`);
    const check = validateObservation(rendered, ids);
    expect(check).toEqual({ ok: true, sentences: h.observationTemplate.length, citedIds: ids });
  });
});

describe('personaFromDecisionOwner', () => {
  it('maps titles onto personas by keyword, defaulting to executive_ops', () => {
    expect(personaFromDecisionOwner('SVP, Purchasing & Supply Chain')).toBe('supply_chain');
    expect(personaFromDecisionOwner('VP Logistics')).toBe('transportation');
    expect(personaFromDecisionOwner('Director of Transportation')).toBe('transportation');
    expect(personaFromDecisionOwner('Plant Manager, Anna')).toBe('site_ops');
    expect(personaFromDecisionOwner('VP Operations')).toBe('site_ops');
    expect(personaFromDecisionOwner('Head of Automation Engineering')).toBe('automation');
    expect(personaFromDecisionOwner('CIO')).toBe('technology');
    expect(personaFromDecisionOwner('VP IT Infrastructure')).toBe('technology');
    expect(personaFromDecisionOwner('CFO')).toBe('finance_procurement');
    expect(personaFromDecisionOwner('Chief Procurement Officer')).toBe('finance_procurement');
    expect(personaFromDecisionOwner('VP Distribution')).toBe('distribution');
    expect(personaFromDecisionOwner('Warehouse Director')).toBe('distribution');
    expect(personaFromDecisionOwner('Director of Security')).toBe('security');
    expect(personaFromDecisionOwner('Chief Executive Officer')).toBe('executive_ops');
    expect(personaFromDecisionOwner('')).toBe('executive_ops');
  });

  it('does not read the letters "it" inside a word as the IT function', () => {
    expect(personaFromDecisionOwner('Chief Editor of Fitness')).toBe('executive_ops');
  });
});

describe('planTop100ResearchImport: determinism', () => {
  it('produces identical plans for identical inputs', () => {
    const a = planTop100ResearchImport(research, OPTS);
    const b = planTop100ResearchImport(research, OPTS);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
