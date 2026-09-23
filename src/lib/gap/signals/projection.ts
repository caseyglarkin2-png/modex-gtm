/**
 * GAP Prospecting OS signal adapters (Sprint 1, S1-T5).
 *
 * Every existing fact source (pounce triggers, research evidence records,
 * Top100 research evidence, PIC citations, operator knowledge) is projected
 * onto ONE row shape, `ProspectingSignalInput`, which the registry writes to
 * `prospecting_signals`. Every adapter is pure: no I/O, no clock reads (the
 * caller passes `now`), no imports from modules with side effects.
 *
 * An adapter either returns `{ ok: true, signal }` or refuses with a named
 * reason. Refusal reasons are part of the contract and are asserted by tests;
 * add new ones deliberately.
 *
 * Voice: no em dashes, "yards" plural.
 */

import { createHash } from 'node:crypto';
import type { SignalSourceKind, SignalSourceType, SignalType } from '../taxonomy';
import { freshnessExpiresAt } from './freshness';

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

/** The row the registry writes. Mirrors `ProspectingSignal` in camelCase. */
export interface ProspectingSignalInput {
  accountName: string;
  hubspotCompanyId?: string | null;
  personaId?: number | null;
  sourceKind: SignalSourceKind;
  sourceId: string;
  type: SignalType;
  title: string;
  summary?: string | null;
  sourceType: SignalSourceType;
  evidenceUrl?: string | null;
  evidenceText?: string | null;
  claimClass?: string | null;
  /** false means the fact may inform a hypothesis but never appear in outbound copy. */
  externalOk?: boolean | null;
  observedAt: Date;
  /** 0..100 */
  confidence: number;
  freshnessExpiresAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  registeredBy: string;
}

export type ProjectionResult =
  | { ok: true; signal: ProspectingSignalInput }
  | { ok: false; reason: string };

export interface ProjectionContext {
  registeredBy: string;
  now: Date;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const TITLE_MAX = 120;

/** Trim and cut a string to at most `n` characters. */
export function clip(text: string, n: number): string {
  const trimmed = text.trim();
  return trimmed.length <= n ? trimmed : trimmed.slice(0, n);
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function refuse(reason: string): ProjectionResult {
  return { ok: false, reason };
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

// ---------------------------------------------------------------------------
// Pounce triggers
// ---------------------------------------------------------------------------

/** The subset of `PounceTrigger` the adapter reads. */
export interface PounceTriggerRow {
  id: number;
  url_hash: string;
  account_slug: string;
  account_name: string;
  title: string;
  url: string;
  source: string;
  score: number;
  categories: string[];
  published_at: Date | null;
  first_seen_at: Date;
  hubspot_company_id?: string | null;
  dismissed: boolean;
}

/** Pounce category (taxonomy theme) to signal type. Unknown categories are news. */
const POUNCE_CATEGORY_TO_TYPE: Record<string, SignalType> = {
  autonomy: 'automation_program',
  yard_direct: 'technology_signal',
  network_capex: 'site_expansion',
  expansion: 'new_site',
  cost_restructure: 'news',
  leadership: 'news',
  digital_ops: 'technology_signal',
  freight: 'news',
};

/**
 * Pounce scores arrive on a 0..10 scale from the news/X taxonomy; some
 * producers (clawd) already emit 0..100. Anything above 10 is treated as
 * already normalized. Either way the result is clamped to 0..100.
 * Local, pure copy of the semantics in `src/lib/pounce/fit.ts`; that module
 * reads pack files from disk so it is not imported here.
 */
function pounceConfidence(score: number): number {
  const scaled = score <= 10 ? score * 10 : score;
  return clamp(Math.round(scaled), 0, 100);
}

export function fromPounceTrigger(t: PounceTriggerRow, ctx: ProjectionContext): ProjectionResult {
  if (t.dismissed) return refuse('dismissed_trigger');
  const url = trimOrNull(t.url);
  if (!url) return refuse('no_url');

  const type: SignalType = POUNCE_CATEGORY_TO_TYPE[t.categories[0] ?? ''] ?? 'news';
  const observedAt = t.published_at ?? t.first_seen_at;

  return {
    ok: true,
    signal: {
      accountName: t.account_name.trim(),
      hubspotCompanyId: trimOrNull(t.hubspot_company_id),
      personaId: null,
      sourceKind: 'pounce_trigger',
      sourceId: String(t.id),
      type,
      title: clip(t.title, TITLE_MAX),
      summary: null,
      sourceType: 'public_secondary',
      evidenceUrl: url,
      evidenceText: null,
      claimClass: null,
      externalOk: null,
      observedAt,
      confidence: pounceConfidence(t.score),
      freshnessExpiresAt: freshnessExpiresAt(type, observedAt),
      metadata: {
        categories: [...t.categories],
        source: t.source,
        accountSlug: t.account_slug,
        rawScore: t.score,
      },
      registeredBy: ctx.registeredBy,
    },
  };
}

// ---------------------------------------------------------------------------
// Evidence records (research runs)
// ---------------------------------------------------------------------------

/** The subset of `EvidenceRecord` the adapter reads. */
export interface EvidenceRecordRow {
  id: string;
  account_name: string;
  persona_id: number | null;
  claim: string;
  source_url: string;
  source_title: string | null;
  source_type: string;
  provider: string;
  observed_at: Date;
  freshness_status: string;
  fresh_until: Date | null;
  is_superseded: boolean;
}

const EVIDENCE_SOURCE_TYPE_MAP: Record<string, SignalSourceType> = {
  proof: 'first_party',
  signal: 'public_secondary',
  contact: 'crm',
  manual: 'manual',
  local: 'first_party',
};

export function fromEvidenceRecord(e: EvidenceRecordRow, ctx: ProjectionContext): ProjectionResult {
  if (e.is_superseded) return refuse('superseded_evidence');
  if (e.freshness_status === 'stale') return refuse('stale_evidence');

  const type: SignalType = 'manual_research';
  const claim = e.claim.trim();

  return {
    ok: true,
    signal: {
      accountName: e.account_name.trim(),
      hubspotCompanyId: null,
      personaId: e.persona_id ?? null,
      sourceKind: 'evidence_record',
      sourceId: e.id,
      type,
      title: trimOrNull(e.source_title) ?? clip(claim, TITLE_MAX),
      summary: claim,
      sourceType: EVIDENCE_SOURCE_TYPE_MAP[e.source_type] ?? 'public_secondary',
      evidenceUrl: trimOrNull(e.source_url),
      evidenceText: null,
      claimClass: null,
      externalOk: null,
      observedAt: e.observed_at,
      confidence: 70,
      freshnessExpiresAt: freshnessExpiresAt(type, e.observed_at, e.fresh_until),
      metadata: { provider: e.provider, evidenceSourceType: e.source_type },
      registeredBy: ctx.registeredBy,
    },
  };
}

// ---------------------------------------------------------------------------
// Top100 research evidence
// ---------------------------------------------------------------------------

/** One row of a Top100 research run's evidence ledger. */
export interface Top100EvidenceRow {
  run_id: string;
  key: string;
  account: string;
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

const TOP100_SOURCE_TYPE_MAP: Record<string, SignalSourceType> = {
  filing: 'public_primary',
  earnings: 'public_primary',
  investor_deck: 'public_primary',
  leadership_page: 'public_primary',
  newsroom: 'public_primary',
  trade_press: 'public_secondary',
  other: 'public_secondary',
  crm: 'crm',
  vault: 'manual',
  job_posting: 'public_secondary',
};

const TOP100_CONFIDENCE: Record<Top100EvidenceRow['confidence'], number> = {
  high: 80,
  medium: 55,
  low: 30,
};

/** Keyword classification for a FACT claim. First match wins, order matters. */
const CLAIM_KEYWORD_RULES: Array<{ type: SignalType; pattern: RegExp }> = [
  { type: 'acquisition', pattern: /\bacqui(?:sition|re[sd]?|ring)\b/i },
  { type: 'new_site', pattern: /\bnew (?:plant|facility)\b|\bopens\b/i },
  { type: 'site_expansion', pattern: /\bexpan(?:sion|d(?:s|ed|ing)?)\b|\bcapex\b/i },
  { type: 'automation_program', pattern: /\brobot|\bautonomous\b|\bautomation\b/i },
];

function classifyTop100Type(sourceType: string, claim: string): SignalType {
  if (sourceType === 'job_posting') return 'job_posting';
  if (sourceType === 'crm') return 'intent';
  for (const rule of CLAIM_KEYWORD_RULES) {
    if (rule.pattern.test(claim)) return rule.type;
  }
  return 'news';
}

type Top100DateField = 'event_date' | 'published' | 'retrieved';

/** The first of event_date, published, retrieved that parses and is not the literal 'unknown'. */
function pickObservedAt(row: Top100EvidenceRow): { at: Date; field: Top100DateField } | null {
  const candidates: Array<[Top100DateField, string]> = [
    ['event_date', row.event_date],
    ['published', row.published],
    ['retrieved', row.retrieved],
  ];
  for (const [field, raw] of candidates) {
    const value = (raw ?? '').trim();
    if (!value || value.toLowerCase() === 'unknown') continue;
    const at = new Date(value);
    if (isValidDate(at)) return { at, field };
  }
  return null;
}

export function fromTop100Evidence(row: Top100EvidenceRow, ctx: ProjectionContext): ProjectionResult {
  if (row.class !== 'FACT') return refuse('not_a_fact');
  const sourceUrl = trimOrNull(row.source_url);
  if (!sourceUrl && row.external_ok) return refuse('no_source_url');
  const observed = pickObservedAt(row);
  if (!observed) return refuse('bad_date');

  const claim = row.claim.trim();
  const type = classifyTop100Type(row.source_type, claim);
  const metadata: Record<string, unknown> = {
    observedAtSource: observed.field,
    runId: row.run_id,
    key: row.key,
    evidenceId: row.evidence_id,
    top100SourceType: row.source_type,
  };
  const contradiction = trimOrNull(row.contradiction);
  if (contradiction) metadata.contradiction = contradiction;

  return {
    ok: true,
    signal: {
      accountName: row.account.trim(),
      hubspotCompanyId: null,
      personaId: null,
      sourceKind: 'top100_evidence',
      sourceId: `${row.run_id}:${row.key}:${row.evidence_id}`,
      type,
      title: clip(claim, TITLE_MAX),
      summary: claim,
      sourceType: TOP100_SOURCE_TYPE_MAP[row.source_type] ?? 'public_secondary',
      evidenceUrl: sourceUrl,
      evidenceText: trimOrNull(row.excerpt),
      claimClass: 'FACT',
      externalOk: row.external_ok,
      observedAt: observed.at,
      confidence: TOP100_CONFIDENCE[row.confidence],
      freshnessExpiresAt: freshnessExpiresAt(type, observed.at),
      metadata,
      registeredBy: ctx.registeredBy,
    },
  };
}

// ---------------------------------------------------------------------------
// PIC citations
// ---------------------------------------------------------------------------

export type PicCitationConfidence = 'BUYER_CONFIRMED' | 'STRONG' | 'MODERATE' | 'SPECULATIVE';

/** One citation row from a PIC (problem, impact, cause) sheet. */
export interface PicCitationRow {
  slug: string;
  rowIndex: number;
  ref: string;
  at: string;
  speaker?: string;
  verbatim?: string;
  confidence: PicCitationConfidence;
  problem: string;
  accountName: string;
}

const PIC_REF_PREFIXES = [
  'for-pack:',
  'dossier:',
  'transcript:',
  'call-intel:',
  'vault:',
  'http://',
  'https://',
] as const;

const PIC_CONFIDENCE: Record<PicCitationConfidence, number> = {
  BUYER_CONFIRMED: 90,
  STRONG: 75,
  MODERATE: 50,
  SPECULATIVE: 25,
};

function isHttpRef(ref: string): boolean {
  return ref.startsWith('http://') || ref.startsWith('https://');
}

function picSourceType(ref: string): SignalSourceType {
  if (isHttpRef(ref)) return 'public_secondary';
  if (ref.startsWith('transcript:') || ref.startsWith('vault:')) return 'first_party';
  return 'manual';
}

/**
 * Refs whose verbatim is the buyer's or the world's own words: a call
 * transcript, call intel, or a public page. Only these may carry the
 * verbatim as `evidenceText`.
 */
const PIC_BUYER_WORDS_PREFIXES = ['transcript:', 'call-intel:'] as const;

function picVerbatimIsEvidence(ref: string): boolean {
  return isHttpRef(ref) || PIC_BUYER_WORDS_PREFIXES.some((prefix) => ref.startsWith(prefix));
}

/**
 * A PIC citation's verbatim becomes `evidenceText` ONLY when the ref points
 * at something the buyer said or a public source (`transcript:`,
 * `call-intel:`, http(s)). For `for-pack:`, `dossier:` and `vault:` refs the
 * verbatim is a seller document quoting itself, so it goes to `summary` and
 * `evidenceText` stays null: a seller document must never satisfy the
 * evidence guard that gates a hypothesis on buyer-sourced evidence.
 */
export function fromPicCitation(c: PicCitationRow, ctx: ProjectionContext): ProjectionResult {
  const ref = c.ref.trim();
  if (!PIC_REF_PREFIXES.some((prefix) => ref.startsWith(prefix))) return refuse('unresolvable_ref');
  const observedAt = new Date(c.at);
  if (!isValidDate(observedAt)) return refuse('bad_date');

  const type: SignalType = 'manual_research';
  const refHash = createHash('sha1').update(ref).digest('hex');
  const verbatim = trimOrNull(c.verbatim);
  const verbatimIsEvidence = picVerbatimIsEvidence(ref);

  return {
    ok: true,
    signal: {
      accountName: c.accountName.trim(),
      hubspotCompanyId: null,
      personaId: null,
      sourceKind: 'pic_citation',
      sourceId: `${c.slug.trim()}:${refHash}`,
      type,
      title: clip(c.problem, TITLE_MAX),
      summary: verbatimIsEvidence ? null : verbatim,
      sourceType: picSourceType(ref),
      evidenceUrl: isHttpRef(ref) ? ref : null,
      evidenceText: verbatimIsEvidence ? verbatim : null,
      claimClass: null,
      externalOk: null,
      observedAt,
      confidence: PIC_CONFIDENCE[c.confidence],
      freshnessExpiresAt: freshnessExpiresAt(type, observedAt),
      metadata: {
        ref,
        speaker: trimOrNull(c.speaker),
        rowIndex: c.rowIndex,
        picConfidence: c.confidence,
      },
      registeredBy: ctx.registeredBy,
    },
  };
}

// ---------------------------------------------------------------------------
// Operator knowledge
// ---------------------------------------------------------------------------

/** Something Casey (or another operator) knows first-hand and typed in. */
export interface OperatorKnowledgeInput {
  accountName: string;
  hubspotCompanyId?: string | null;
  personaId?: number | null;
  text: string;
  title?: string;
  at: Date;
  sourceId: string;
  by: string;
}

/**
 * Operator knowledge is a first-party fact. It is the highest-trust input we
 * have for shaping a hypothesis, and it is NEVER quotable as public evidence:
 * `externalOk` is hard-wired to false so the compiler cannot put a private
 * conversation into outbound copy.
 */
export function fromOperatorKnowledge(k: OperatorKnowledgeInput, ctx: ProjectionContext): ProjectionResult {
  const text = trimOrNull(k.text);
  if (!text) return refuse('no_evidence_text');

  const type: SignalType = 'manual_research';

  return {
    ok: true,
    signal: {
      accountName: k.accountName.trim(),
      hubspotCompanyId: trimOrNull(k.hubspotCompanyId),
      personaId: k.personaId ?? null,
      sourceKind: 'operator_knowledge',
      sourceId: k.sourceId.trim(),
      type,
      title: trimOrNull(k.title) ?? clip(text, TITLE_MAX),
      summary: null,
      sourceType: 'first_party',
      evidenceUrl: null,
      evidenceText: text,
      claimClass: null,
      externalOk: false,
      observedAt: k.at,
      confidence: 85,
      freshnessExpiresAt: freshnessExpiresAt(type, k.at),
      metadata: { by: k.by.trim() },
      registeredBy: ctx.registeredBy,
    },
  };
}
