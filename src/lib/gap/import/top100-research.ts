/**
 * Top100 research importer, planning half (GAP Prospecting OS, Sprint 1, S1-T10).
 *
 * Pure. Takes one `research.v1` file (yardflow-hubspot `top100/data/research/
 * <key>.json`) and returns a plan: every FACT evidence row as a signal input,
 * INFERENCE and UNKNOWN rows refused by name, and ONE draft hypothesis whose
 * observation is a template over the why_now FACT evidence. Signal ids are
 * not known until registration, so the template carries the signal SOURCE id
 * and `./apply` substitutes the registered id into `[S:<id>]` tokens.
 *
 * Voice: no em dashes, "yards" plural.
 */

import { classifyFamilies, UNMAPPED_FAMILY, type Persona } from '../taxonomy';
import { splitSentences } from '../hypothesis/observation';
import {
  clip,
  fromTop100Evidence,
  type ProspectingSignalInput,
  type Top100EvidenceRow,
} from '../signals/projection';
import {
  hedge,
  summarize,
  type HypothesisPlan,
  type ImportPlan,
  type ObservationTemplateLine,
  type SignalRefusal,
} from './pic';

// ---------------------------------------------------------------------------
// Input shape (the subset of research.v1 this planner reads)
// ---------------------------------------------------------------------------

export interface ResearchEvidenceLike {
  evidence_id: string;
  claim: string;
  source_url: string;
  source_type: string;
  published: string;
  event_date: string;
  retrieved: string;
  excerpt: string;
  confidence: 'high' | 'medium' | 'low';
  class: 'FACT' | 'INFERENCE' | 'UNKNOWN';
  external_ok: boolean;
  contradiction?: string;
}

export interface ResearchV1Like {
  key: string;
  name: string;
  domain?: string;
  company_id?: string;
  researched_at?: string;
  value_hypothesis: string;
  causal_chain: {
    observed_change: string;
    yard_dependency: string;
    affected_kpi: string;
    decision_owner: string;
    capability: string;
    first_conversation: string;
    disproof: string;
  };
  structural_problem: string;
  skeptic_objection?: string;
  contrary_evidence?: string;
  why_now: { trigger: string; event_date?: string; evidence_ids: string[]; strength?: string };
  confidence: 'high' | 'medium' | 'low';
  initial_use_case?: string;
  unknowns?: string[];
  evidence: ResearchEvidenceLike[];
}

export type ResearchPlan = ImportPlan & { kind: 'top100_research'; runId: string; key: string };

export interface ResearchPlanOptions {
  runId: string;
  accountName: string;
  hubspotCompanyId?: string | null;
  now: Date;
  registeredBy: string;
}

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

const RESEARCH_CONFIDENCE: Record<ResearchV1Like['confidence'], number> = {
  high: 75,
  medium: 50,
  low: 30,
};

const OBSERVATION_CLIP = 160;

/** Lowercase substrings, first match wins, order matters. */
const TITLE_PHRASES: Array<[Persona, string[]]> = [
  ['supply_chain', ['supply chain']],
  ['transportation', ['logistics', 'transportation']],
  ['site_ops', ['plant', 'site', 'operations']],
  ['automation', ['automation', 'engineering']],
  ['technology', ['technology']],
  ['finance_procurement', ['procurement', 'finance']],
  ['distribution', ['distribution', 'warehouse']],
  ['security', ['security']],
];

/** Acronyms need word boundaries so "fitness" is not IT and "cfo" inside a word is not CFO. */
const TITLE_ACRONYMS: Array<[Persona, RegExp]> = [
  ['technology', /\b(?:CIO|IT)\b/],
  ['finance_procurement', /\bCFO\b/],
];

export function personaFromDecisionOwner(title: string): Persona {
  const lower = title.toLowerCase();
  for (const [persona, phrases] of TITLE_PHRASES) {
    if (phrases.some((phrase) => lower.includes(phrase))) return persona;
    for (const [acronymPersona, pattern] of TITLE_ACRONYMS) {
      if (acronymPersona === persona && pattern.test(title)) return persona;
    }
  }
  return 'executive_ops';
}

/** The first sentence of a claim, clipped, with its terminator removed so the citation token sits inside it. */
function templateText(claim: string): string {
  const first = splitSentences(claim)[0] ?? claim;
  return clip(first, OBSERVATION_CLIP).replace(/[.!?\s]+$/, '');
}

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

export function planTop100ResearchImport(research: ResearchV1Like, opts: ResearchPlanOptions): ResearchPlan {
  const runId = opts.runId.trim();
  const key = research.key.trim();
  const hubspotCompanyId = opts.hubspotCompanyId ?? null;
  const ctx = { registeredBy: opts.registeredBy, now: opts.now };

  const signals: ProspectingSignalInput[] = [];
  const signalRefusals: SignalRefusal[] = [];
  const signalSourceIdByEvidence = new Map<string, string>();
  const claimByEvidence = new Map<string, string>();

  for (const row of research.evidence) {
    const projected = fromTop100Evidence(
      { ...row, run_id: runId, key, account: opts.accountName } as Top100EvidenceRow,
      ctx,
    );
    if (projected.ok) {
      const signal = { ...projected.signal, hubspotCompanyId };
      signals.push(signal);
      signalSourceIdByEvidence.set(row.evidence_id, signal.sourceId);
      claimByEvidence.set(row.evidence_id, row.claim);
    } else {
      signalRefusals.push({ ref: row.evidence_id, reason: projected.reason });
    }
  }

  const observationTemplate: ObservationTemplateLine[] = [];
  for (const evidenceId of research.why_now.evidence_ids) {
    const signalSourceId = signalSourceIdByEvidence.get(evidenceId);
    if (!signalSourceId) continue;
    observationTemplate.push({
      evidenceId,
      signalSourceId,
      text: templateText(claimByEvidence.get(evidenceId) ?? ''),
    });
  }

  const chain = research.causal_chain;
  const families = classifyFamilies(
    `${research.structural_problem} ${chain.yard_dependency} ${research.value_hypothesis}`,
  );

  const hypothesis: HypothesisPlan = {
    sourceRef: `research:${runId}:${key}`,
    accountName: opts.accountName,
    hubspotCompanyId,
    persona: personaFromDecisionOwner(chain.decision_owner ?? ''),
    problemFamily: families.primary,
    familyUnmapped: families.primary === UNMAPPED_FAMILY,
    secondaryFamilies: families.secondary,
    observation: '',
    needsObservation: observationTemplate.length === 0,
    observationTemplate,
    problemHypothesis: hedge(research.structural_problem),
    rootCauseHypotheses: [chain.yard_dependency],
    impactHypotheses: [chain.affected_kpi, research.value_hypothesis],
    whyNow: research.why_now.trigger?.trim() ? research.why_now.trigger : null,
    falsificationQuestions: [chain.first_conversation],
    whatANoMeans: chain.disproof ?? null,
    contraryEvidence: research.contrary_evidence ?? null,
    predictedBuyerLanguage: null,
    buyingCenter: null,
    confidence: RESEARCH_CONFIDENCE[research.confidence],
    metadata: {
      skepticObjection: research.skeptic_objection ?? null,
      initialUseCase: research.initial_use_case ?? null,
      unknowns: research.unknowns ?? [],
      researchedAt: research.researched_at ?? null,
      domain: research.domain ?? null,
    },
    signals,
    signalRefusals,
    bids: [],
  };

  return {
    kind: 'top100_research',
    runId,
    key,
    hypotheses: [hypothesis],
    summary: summarize('top100_research', [hypothesis], research.evidence.length),
  };
}
