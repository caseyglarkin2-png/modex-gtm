/**
 * PIC chart importer, planning half (GAP Prospecting OS, Sprint 1, S1-T10).
 *
 * Pure. Takes one Problem Identification Chart (war-room `data/pics/<slug>.json`)
 * and returns a plan: one DRAFT hypothesis per row, the signal inputs its
 * citations project to, and a BID plan only for rows the buyer said on tape
 * (`buyerLanguage.predicted === false`). Nothing here touches the database;
 * `./apply` turns a plan into rows through injected dependencies.
 *
 * A PIC row is a seller inference, so the observation is left EMPTY and the
 * plan says so (`needsObservation`). An operator cites signals before the
 * hypothesis can be submitted; the machine refuses an empty observation and it
 * refuses an unmapped family, both by design.
 *
 * The shared plan shape (`HypothesisPlan`, `ImportPlan`) is declared here and
 * reused by the Top100 research planner and by `./apply`.
 *
 * Voice: no em dashes, "yards" plural.
 */

import {
  HEDGE_TOKENS,
  PIC_BUYING_CENTER_TO_PERSONA,
  UNMAPPED_FAMILY,
  classifyFamilies,
  type Persona,
  type PicBuyingCenter,
  type ProblemFamily,
} from '../taxonomy';
import {
  fromPicCitation,
  type PicCitationConfidence,
  type ProspectingSignalInput,
} from '../signals/projection';

// ---------------------------------------------------------------------------
// Input shapes (the subset of war-room's Pic / PicRow this planner reads)
// ---------------------------------------------------------------------------

export interface PicCitationLike {
  ref: string;
  at: string;
  speaker?: string;
  verbatim?: string;
}

export interface PicRowLike {
  problem: string;
  rootCause: string;
  businessImpact: string;
  derivation?: unknown;
  personalImpact: string;
  buyingCenter: PicBuyingCenter;
  buyerLanguage: { text: string; predicted: boolean };
  howWeDetect: string;
  whatANoMeans: string;
  confidence: PicCitationConfidence;
  citations: PicCitationLike[];
  accountSpecific: boolean;
  incumbentContext?: string | null;
  lastVerified: string;
}

export interface PicLike {
  slug: string;
  displayName: string;
  rows: PicRowLike[];
}

// ---------------------------------------------------------------------------
// Plan shapes (shared with top100-research.ts and apply.ts)
// ---------------------------------------------------------------------------

/** A buyer-input-data row to create once the hypothesis exists. Never confirmed by an importer. */
export interface BidPlan {
  type: 'business_problem';
  rawBuyerLanguage: string;
  source: 'call';
  capturedAt: Date;
  capturedBy: 'pic-import';
  aiExtracted: true;
  humanConfirmed: false;
  metadata: { transcriptRef: string; speaker?: string };
}

/** One sentence of the observation, cited by a signal whose id is unknown until registration. */
export interface ObservationTemplateLine {
  /** The source-side id (a research evidence id or a citation ref) the line came from. */
  evidenceId: string;
  /** Matches `ProspectingSignalInput.sourceId` of the signal that cites it. */
  signalSourceId: string;
  /** The sentence body without terminator or citation token, at most 160 characters. */
  text: string;
}

export interface SignalRefusal {
  /** The citation ref or evidence id that was refused. */
  ref: string;
  reason: string;
}

export interface PredictedBuyerLanguage {
  text: string;
  predicted: boolean;
  sourceRef: string;
}

export interface HypothesisPlan {
  sourceRef: string;
  accountName: string;
  hubspotCompanyId: string | null;
  persona: Persona;
  problemFamily: ProblemFamily | typeof UNMAPPED_FAMILY;
  familyUnmapped: boolean;
  secondaryFamilies: ProblemFamily[];
  observation: string;
  /** True when a human must cite signals before this can be submitted. */
  needsObservation: boolean;
  observationTemplate: ObservationTemplateLine[];
  problemHypothesis: string;
  rootCauseHypotheses: string[];
  impactHypotheses: string[];
  whyNow: string | null;
  falsificationQuestions: string[];
  whatANoMeans: string | null;
  contraryEvidence: string | null;
  predictedBuyerLanguage: PredictedBuyerLanguage | null;
  buyingCenter: string | null;
  confidence: number;
  metadata: Record<string, unknown>;
  signals: ProspectingSignalInput[];
  signalRefusals: SignalRefusal[];
  bids: BidPlan[];
}

export interface ImportPlanSummary {
  rows: number;
  hypotheses: number;
  bids: number;
  signals: number;
  signalRefusals: Record<string, number>;
  unmapped: number;
}

export interface ImportPlan {
  kind: 'pic' | 'top100_research';
  hypotheses: HypothesisPlan[];
  summary: ImportPlanSummary;
}

export type PicPlan = ImportPlan & { kind: 'pic'; slug: string };

export interface PicPlanOptions {
  accountName: string;
  hubspotCompanyId?: string | null;
  now: Date;
  registeredBy: string;
}

// ---------------------------------------------------------------------------
// Shared helpers (also used by the research planner)
// ---------------------------------------------------------------------------

const PIC_CONFIDENCE: Record<PicCitationConfidence, number> = {
  BUYER_CONFIRMED: 90,
  STRONG: 75,
  MODERATE: 50,
  SPECULATIVE: 25,
};

/** Prefix "I suspect " unless the text already carries a hedge token. */
export function hedge(text: string): string {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  if (HEDGE_TOKENS.some((token) => lower.includes(token))) return trimmed;
  return `I suspect ${trimmed}`;
}

export function summarize(kind: ImportPlan['kind'], hypotheses: HypothesisPlan[], rows: number): ImportPlanSummary {
  const signalRefusals: Record<string, number> = {};
  let bids = 0;
  let signals = 0;
  let unmapped = 0;
  for (const h of hypotheses) {
    bids += h.bids.length;
    signals += h.signals.length;
    if (h.familyUnmapped) unmapped += 1;
    for (const refusal of h.signalRefusals) {
      signalRefusals[refusal.reason] = (signalRefusals[refusal.reason] ?? 0) + 1;
    }
  }
  void kind;
  return { rows, hypotheses: hypotheses.length, bids, signals, signalRefusals, unmapped };
}

// ---------------------------------------------------------------------------
// Planner
// ---------------------------------------------------------------------------

function bidFor(row: PicRowLike, sourceRef: string): BidPlan[] {
  if (row.buyerLanguage.predicted !== false) return [];
  const onTape = row.citations.find((c) => typeof c.verbatim === 'string' && c.verbatim.trim().length > 0);
  const anchor = onTape ?? row.citations[0];
  const metadata: BidPlan['metadata'] = { transcriptRef: anchor ? anchor.ref : sourceRef };
  const speaker = anchor?.speaker?.trim();
  if (speaker) metadata.speaker = speaker;
  return [
    {
      type: 'business_problem',
      rawBuyerLanguage: row.buyerLanguage.text,
      source: 'call',
      capturedAt: new Date(row.lastVerified),
      capturedBy: 'pic-import',
      aiExtracted: true,
      humanConfirmed: false,
      metadata,
    },
  ];
}

function planRow(pic: PicLike, row: PicRowLike, index: number, opts: PicPlanOptions): HypothesisPlan {
  const slug = pic.slug.trim();
  const sourceRef = `pic:${slug}#${index}`;
  const hubspotCompanyId = opts.hubspotCompanyId ?? null;
  const families = classifyFamilies(`${row.problem} ${row.rootCause} ${row.businessImpact}`);

  const signals: ProspectingSignalInput[] = [];
  const signalRefusals: SignalRefusal[] = [];
  for (const citation of row.citations) {
    const projected = fromPicCitation(
      {
        slug,
        rowIndex: index,
        ref: citation.ref,
        at: citation.at,
        speaker: citation.speaker,
        verbatim: citation.verbatim,
        confidence: row.confidence,
        problem: row.problem,
        accountName: opts.accountName,
      },
      { registeredBy: opts.registeredBy, now: opts.now },
    );
    if (projected.ok) {
      signals.push({ ...projected.signal, hubspotCompanyId });
    } else {
      signalRefusals.push({ ref: citation.ref, reason: projected.reason });
    }
  }

  return {
    sourceRef,
    accountName: opts.accountName,
    hubspotCompanyId,
    persona: PIC_BUYING_CENTER_TO_PERSONA[row.buyingCenter],
    problemFamily: families.primary,
    familyUnmapped: families.primary === UNMAPPED_FAMILY,
    secondaryFamilies: families.secondary,
    observation: '',
    needsObservation: true,
    observationTemplate: [],
    problemHypothesis: hedge(row.problem),
    rootCauseHypotheses: [row.rootCause],
    impactHypotheses: [row.businessImpact, row.personalImpact],
    whyNow: null,
    falsificationQuestions: [row.howWeDetect],
    whatANoMeans: row.whatANoMeans,
    contraryEvidence: null,
    predictedBuyerLanguage: {
      text: row.buyerLanguage.text,
      predicted: row.buyerLanguage.predicted,
      sourceRef,
    },
    buyingCenter: row.buyingCenter,
    confidence: PIC_CONFIDENCE[row.confidence],
    metadata: {
      picConfidence: row.confidence,
      incumbentContext: row.incumbentContext ?? null,
      accountSpecific: row.accountSpecific,
      lastVerified: row.lastVerified,
      derivation: row.derivation ?? null,
    },
    signals,
    signalRefusals,
    bids: bidFor(row, sourceRef),
  };
}

export function planPicImport(pic: PicLike, opts: PicPlanOptions): PicPlan {
  const hypotheses = pic.rows.map((row, index) => planRow(pic, row, index, opts));
  return {
    kind: 'pic',
    slug: pic.slug.trim(),
    hypotheses,
    summary: summarize('pic', hypotheses, pic.rows.length),
  };
}
