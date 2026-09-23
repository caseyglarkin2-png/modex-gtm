/**
 * Top100 lane compile adapter (GAP Prospecting OS, Sprint 3, S3-T10). Pure.
 *
 * Turns one lane sequence file (`data/sequences/<key>.json`, schema
 * `sequences.v1`) plus its research file (`data/research/<key>.json`, schema
 * `research.v1`) into one `CompileInput` per person per touch, so the S3-T9
 * compiler can judge the lane's copy exactly as it stands. Nothing here reads
 * the filesystem or the clock: the CLI hands in parsed JSON and `now`.
 *
 * Lane field names read (verified against the lane on 2026-09-23):
 *   sequence file   key, account, sequences[] {person, hubspot_contact_id,
 *                   preferred_sender, touches[] {step, purpose, day, condition,
 *                   subject, body, cta, evidence_ids[], claims_used[], next_step}},
 *                   archived_sequences[] (skipped, counted in a warning)
 *   research file   evidence[] {evidence_id, claim, source_url, source_type,
 *                   published, event_date, retrieved, excerpt, confidence,
 *                   class, external_ok, contradiction}
 * Private research fields (skeptic_objection, unknowns, contrary_evidence,
 * confidence_note, causal_chain, dims and the rest) are never read and never
 * reach a contract; the test asserts that structurally on the serialized
 * output.
 *
 * Evidence refs reuse the S1-T5 projection (`fromTop100Evidence`): the date
 * is event_date, then published, then retrieved (the retrieved fallback is
 * flagged `freshness_from_retrieved:<id>` because it dates the lookup, not
 * the fact); `fresh` is the projection's type TTL against `now`; `superseded`
 * is a non-empty `contradiction`; `externalOk` is the row's `external_ok`. A
 * row the projection refuses (not_a_fact for INFERENCE, UNKNOWN, FIRST_PERSON
 * and DIRECT; no_source_url; bad_date) becomes no ref at all, so a marker
 * that cites it fails C01 as unresolved, and the refusal is a warning.
 *
 * The lane cites evidence outside the copy (`evidence_ids` on the touch)
 * rather than with `[[SRC:id]]` markers in the body. This adapter prepends
 * nothing: an unmarked body is passed as written, `evidenceIds` travels on
 * the contract for the record, and `unmarked_body:<personKey>:<step>` is a
 * warning, so C01 and C10 judge the text the way a buyer would read it.
 *
 * The journey stage is left to the compiler (step 0 = sequence_step_1, later
 * = sequence_step_2_plus), which is what the lane's DRAFT_CONTRACT step rules
 * map to; the report labels the journey `cold`.
 */

import type { CompileInput, CompileResult } from '../compiler/compile';
import type { ClaimsValidator } from '../compiler/checks/c07-structure';
import { hasMarker } from '../compiler/text';
import type { CompileEvidenceRef } from '../compiler/types';
import { isFresh } from '../signals/freshness';
import { fromTop100Evidence, type Top100EvidenceRow } from '../signals/projection';

// ---------------------------------------------------------------------------
// Lane shapes (the subset this adapter reads)
// ---------------------------------------------------------------------------

export interface LaneTouch {
  step: number;
  purpose?: string;
  day?: number;
  condition?: string;
  subject: string;
  body: string;
  cta?: string;
  evidence_ids?: string[];
  claims_used?: string[];
  next_step?: string;
  /** Not present in the lane today; read when a future revision lists proof refs per touch. */
  proof_refs?: string[];
}

export interface LanePersonSequence {
  person: string;
  hubspot_contact_id?: string;
  preferred_sender?: string;
  touches: LaneTouch[];
}

export interface LaneSequenceFile {
  schema?: string;
  key: string;
  account: string;
  sequences: LanePersonSequence[];
  archived_sequences?: unknown[];
  /** Not present in the lane today; read when a future revision lists them at file level. */
  proof_refs?: string[];
  word_range?: { min: number; max: number };
}

export interface LaneResearchEvidence {
  evidence_id: string;
  claim: string;
  source_url: string;
  source_type: string;
  published: string;
  event_date?: string;
  retrieved: string;
  excerpt?: string;
  confidence: string;
  class: string;
  external_ok: boolean;
  contradiction?: string;
}

/** Only `key` and `evidence` are read. Every other research field stays private. */
export interface LaneResearchFile {
  key: string;
  evidence: LaneResearchEvidence[];
}

// ---------------------------------------------------------------------------
// Output shapes
// ---------------------------------------------------------------------------

export interface Top100CompileEntry {
  personKey: string;
  person: string;
  hubspotContactId: string | null;
  /** 0-based index into the person's touches sorted by `step`. */
  stepIndex: number;
  /** The lane's 1-based `step`. */
  step: number;
  input: CompileInput;
}

export interface ToCompileInputsOptions {
  now: Date;
  claimsValidator: ClaimsValidator | null;
  /** The lane's `data/pipeline_names.json` names, when the CLI found the file. */
  namedPipeline?: string[];
  createdBy?: string;
}

export interface ToCompileInputsResult {
  key: string;
  account: string;
  inputs: Top100CompileEntry[];
  warnings: string[];
}

export const TOP100_COMPILE_CREATED_BY = 'compile-top100';
export const TOP100_JOURNEY = 'cold';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** A stable per-person key: the HubSpot contact id when the lane has one, else a slug of the name. */
export function personKeyFor(seq: Pick<LanePersonSequence, 'person' | 'hubspot_contact_id'>): string {
  const id = str(seq.hubspot_contact_id).trim();
  if (id.length > 0) return id;
  return seq.person
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unnamed';
}

/**
 * Project the research ledger onto compiler evidence refs. Returns the refs
 * plus warnings for refused rows and for refs whose freshness came from the
 * `retrieved` date. Deterministic given `now`.
 */
export function evidenceRefsFromResearch(
  research: LaneResearchFile,
  now: Date,
): { refs: CompileEvidenceRef[]; warnings: string[]; refused: Record<string, string> } {
  const refs: CompileEvidenceRef[] = [];
  const warnings: string[] = [];
  const refused: Record<string, string> = {};
  const rows = Array.isArray(research.evidence) ? research.evidence : [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.evidence_id !== 'string' || row.evidence_id.length === 0) continue;
    const projected = fromTop100Evidence(
      {
        run_id: 'compile',
        key: research.key,
        account: '',
        evidence_id: row.evidence_id,
        claim: str(row.claim),
        source_url: str(row.source_url),
        source_type: str(row.source_type),
        published: str(row.published),
        event_date: str(row.event_date),
        retrieved: str(row.retrieved),
        excerpt: str(row.excerpt),
        confidence: (row.confidence as Top100EvidenceRow['confidence']) ?? 'low',
        class: row.class as Top100EvidenceRow['class'],
        external_ok: row.external_ok === true,
        contradiction: str(row.contradiction),
      },
      { registeredBy: TOP100_COMPILE_CREATED_BY, now },
    );
    if (!projected.ok) {
      refused[row.evidence_id] = projected.reason;
      warnings.push(`evidence_refused:${row.evidence_id}:${projected.reason}`);
      continue;
    }
    const { signal } = projected;
    const observedAtSource = isRecord(signal.metadata) ? signal.metadata.observedAtSource : undefined;
    if (observedAtSource === 'retrieved') warnings.push(`freshness_from_retrieved:${row.evidence_id}`);
    refs.push({
      id: row.evidence_id,
      title: str(row.claim),
      url: signal.evidenceUrl ?? null,
      externalOk: signal.externalOk === true,
      fresh: isFresh(signal.freshnessExpiresAt, now),
      superseded: str(row.contradiction).trim().length > 0,
      firstParty: signal.sourceType === 'first_party',
    });
  }
  return { refs, warnings, refused };
}

// ---------------------------------------------------------------------------
// toCompileInputs
// ---------------------------------------------------------------------------

export function toCompileInputs(
  sequenceFile: LaneSequenceFile,
  researchFile: LaneResearchFile,
  opts: ToCompileInputsOptions,
): ToCompileInputsResult {
  const warnings: string[] = [];
  const key = str(sequenceFile.key) || str(researchFile.key);
  const account = str(sequenceFile.account);
  const createdBy = opts.createdBy ?? TOP100_COMPILE_CREATED_BY;

  const evidence = evidenceRefsFromResearch(researchFile, opts.now);
  warnings.push(...evidence.warnings);
  const knownIds = new Set<string>([...evidence.refs.map((r) => r.id), ...Object.keys(evidence.refused)]);

  const fileProofRefs = stringList(sequenceFile.proof_refs);
  const namedPipeline = stringList(opts.namedPipeline);
  const wordRange = isRecord(sequenceFile.word_range) ? sequenceFile.word_range : undefined;

  const archived = Array.isArray(sequenceFile.archived_sequences) ? sequenceFile.archived_sequences.length : 0;
  if (archived > 0) warnings.push(`archived_skipped:${archived}`);

  const inputs: Top100CompileEntry[] = [];
  const people = Array.isArray(sequenceFile.sequences) ? sequenceFile.sequences : [];
  for (const seq of people) {
    if (!isRecord(seq) || typeof seq.person !== 'string') continue;
    const personKey = personKeyFor(seq);
    const touches = (Array.isArray(seq.touches) ? seq.touches : [])
      .filter((t): t is LaneTouch => isRecord(t) && typeof t.body === 'string')
      .slice()
      .sort((a, b) => (Number(a.step) || 0) - (Number(b.step) || 0));
    if (touches.length !== 4) warnings.push(`touch_count:${personKey}:${touches.length}`);

    const priorBodies: string[] = [];
    touches.forEach((touch, stepIndex) => {
      const step = Number.isFinite(Number(touch.step)) ? Number(touch.step) : stepIndex + 1;
      const body = str(touch.body);
      const evidenceIds = stringList(touch.evidence_ids);
      const claimsUsed = stringList(touch.claims_used);

      if (!hasMarker(body) && evidenceIds.length > 0) warnings.push(`unmarked_body:${personKey}:${step}`);
      for (const id of evidenceIds) {
        if (!knownIds.has(id)) warnings.push(`unknown_evidence_id:${personKey}:${step}:${id}`);
      }

      const contract: Record<string, unknown> = {
        evidence: evidence.refs,
        evidenceIds,
        proofRefs: [...stringList(touch.proof_refs), ...fileProofRefs],
        namedPipeline,
        claimsUsed,
        stepCount: touches.length,
        journey: TOP100_JOURNEY,
      };
      if (wordRange) contract.wordRange = { min: wordRange.min, max: wordRange.max };

      inputs.push({
        personKey,
        person: seq.person,
        hubspotContactId: str(seq.hubspot_contact_id) || null,
        stepIndex,
        step,
        input: {
          hypothesisId: null,
          sequenceVersionId: null,
          draftQueueItemId: null,
          stepIndex,
          subject: str(touch.subject),
          body,
          priorBodies: [...priorBodies],
          contract,
          createdBy,
        },
      });
      priorBodies.push(body);
    });
  }

  return { key, account, inputs, warnings };
}

// ---------------------------------------------------------------------------
// Report reducer
// ---------------------------------------------------------------------------

export interface CompiledStep {
  account: string;
  personKey: string;
  person: string;
  stepIndex: number;
  step: number;
  subject: string;
  result: CompileResult;
}

export interface VerdictCounts {
  pass: number;
  review: number;
  reject: number;
}

export interface WorstEntry {
  account: string;
  person: string;
  step: number;
  verdict: CompileResult['verdict'];
  /** Failed checks on this step, reject severity first. */
  failed: number;
  code: string;
  detail: string;
}

export interface CompileReportSummary {
  perCheck: Record<string, VerdictCounts>;
  perAccount: Record<string, VerdictCounts>;
  totals: VerdictCounts & { steps: number; accounts: number };
  worst: WorstEntry[];
}

export const WORST_LIMIT = 10;

function zero(): VerdictCounts {
  return { pass: 0, review: 0, reject: 0 };
}

function verdictBucket(verdict: CompileResult['verdict']): keyof VerdictCounts {
  if (verdict === 'pass') return 'pass';
  if (verdict === 'reject') return 'reject';
  return 'review';
}

/** Severity rank for ordering: reject verdict first, then review, then pass. */
const VERDICT_RANK: Record<CompileResult['verdict'], number> = { reject: 0, review_required: 1, pass: 2 };

/**
 * Fold compiled steps into per-check, per-account and total counts, plus the
 * ten worst steps. Per check, `pass` counts steps where the check passed,
 * `reject` and `review` count failures by the check's severity. Ordering is
 * deterministic: worst first (verdict rank, then more reject failures, then
 * more review failures), ties by account, person key and step ascending.
 */
export function reduceReport(results: readonly CompiledStep[]): CompileReportSummary {
  const perCheck: Record<string, VerdictCounts> = {};
  const perAccount: Record<string, VerdictCounts> = {};
  const totals = { ...zero(), steps: 0, accounts: 0 };

  const ranked: Array<WorstEntry & { personKey: string; rejects: number; reviews: number }> = [];

  for (const r of results) {
    totals.steps += 1;
    const bucket = verdictBucket(r.result.verdict);
    totals[bucket] += 1;
    (perAccount[r.account] ??= zero())[bucket] += 1;

    let rejects = 0;
    let reviews = 0;
    let firstReject: { code: string; detail: string } | null = null;
    let firstReview: { code: string; detail: string } | null = null;
    for (const check of r.result.checks) {
      const row = (perCheck[check.code] ??= zero());
      if (check.passed) {
        row.pass += 1;
        continue;
      }
      if (check.severity === 'reject') {
        row.reject += 1;
        rejects += 1;
        firstReject ??= { code: check.code, detail: check.detail };
      } else {
        row.review += 1;
        reviews += 1;
        firstReview ??= { code: check.code, detail: check.detail };
      }
    }
    // Headline: the first failed reject check in code order, else the first
    // failed review check, else whatever the critic said.
    let first = firstReject ?? firstReview;
    if (!first && r.result.critic.ok === true && r.result.critic.verdict !== 'pass') {
      first = {
        code: 'critic',
        detail: r.result.critic.findings.map((f) => `${f.rule}: ${f.message}`).join('; ') || r.result.critic.verdict,
      };
    }
    if (!first && r.result.critic.ok === false) {
      first = { code: 'critic', detail: r.result.critic.reason };
    }
    if (r.result.verdict === 'pass') continue;
    ranked.push({
      account: r.account,
      person: r.person,
      personKey: r.personKey,
      step: r.step,
      verdict: r.result.verdict,
      failed: rejects + reviews,
      code: first?.code ?? 'none',
      detail: first?.detail ?? '',
      rejects,
      reviews,
    });
  }
  totals.accounts = Object.keys(perAccount).length;

  ranked.sort(
    (a, b) =>
      VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] ||
      b.rejects - a.rejects ||
      b.reviews - a.reviews ||
      a.account.localeCompare(b.account) ||
      a.personKey.localeCompare(b.personKey) ||
      a.step - b.step,
  );

  const worst: WorstEntry[] = ranked.slice(0, WORST_LIMIT).map(({ personKey: _pk, rejects: _rj, reviews: _rv, ...rest }) => {
    void _pk;
    void _rj;
    void _rv;
    return rest;
  });

  const sortedPerCheck: Record<string, VerdictCounts> = {};
  for (const code of Object.keys(perCheck).sort()) sortedPerCheck[code] = perCheck[code];
  const sortedPerAccount: Record<string, VerdictCounts> = {};
  for (const account of Object.keys(perAccount).sort()) sortedPerAccount[account] = perAccount[account];

  return { perCheck: sortedPerCheck, perAccount: sortedPerAccount, totals, worst };
}

// ---------------------------------------------------------------------------
// Per-account report shape (what the CLI writes to <outDir>/<key>.json)
// ---------------------------------------------------------------------------

export interface AccountCompileReport {
  schema: 'gap-compile-top100.v1';
  key: string;
  account: string;
  journey: typeof TOP100_JOURNEY;
  compiledAt: string;
  compilerVersion: string;
  critic: 'stub' | 'clawd';
  warnings: string[];
  people: Array<{
    personKey: string;
    person: string;
    hubspotContactId: string | null;
    steps: Array<{
      stepIndex: number;
      step: number;
      subject: string;
      verdict: CompileResult['verdict'];
      wordCount: number;
      ctaFamily: CompileResult['ctaFamily'];
      allowedCtaFamily: CompileResult['allowedCtaFamily'];
      evidenceIdsUsed: string[];
      evidenceIds: string[];
      claimsUsed: string[];
      checks: CompileResult['checks'];
      critic: CompileResult['critic'];
      compileId?: string;
      persistError?: string;
    }>;
  }>;
}

/**
 * Assemble the per-account report from the entries and their results. Bodies
 * are never copied in; only what a check detail quotes appears. Deterministic
 * given the same inputs, results and `now`.
 */
export function buildAccountReport(
  prepared: ToCompileInputsResult,
  results: ReadonlyMap<Top100CompileEntry, CompileResult>,
  meta: { now: Date; compilerVersion: string; critic: 'stub' | 'clawd' },
): AccountCompileReport {
  const byPerson = new Map<string, AccountCompileReport['people'][number]>();
  for (const entry of prepared.inputs) {
    const result = results.get(entry);
    if (!result) continue;
    let person = byPerson.get(entry.personKey);
    if (!person) {
      person = { personKey: entry.personKey, person: entry.person, hubspotContactId: entry.hubspotContactId, steps: [] };
      byPerson.set(entry.personKey, person);
    }
    const contract = isRecord(entry.input.contract) ? entry.input.contract : {};
    person.steps.push({
      stepIndex: entry.stepIndex,
      step: entry.step,
      subject: entry.input.subject,
      verdict: result.verdict,
      wordCount: result.wordCount,
      ctaFamily: result.ctaFamily,
      allowedCtaFamily: result.allowedCtaFamily,
      evidenceIdsUsed: result.evidenceIdsUsed,
      evidenceIds: stringList(contract.evidenceIds),
      claimsUsed: stringList(contract.claimsUsed),
      checks: result.checks,
      critic: result.critic,
      ...(result.id ? { compileId: result.id } : {}),
      ...(result.persistError ? { persistError: result.persistError } : {}),
    });
  }
  return {
    schema: 'gap-compile-top100.v1',
    key: prepared.key,
    account: prepared.account,
    journey: TOP100_JOURNEY,
    compiledAt: meta.now.toISOString(),
    compilerVersion: meta.compilerVersion,
    critic: meta.critic,
    warnings: [...prepared.warnings],
    people: [...byPerson.values()],
  };
}

/** The steps of one account report flattened for `reduceReport`. */
export function compiledSteps(
  prepared: ToCompileInputsResult,
  results: ReadonlyMap<Top100CompileEntry, CompileResult>,
): CompiledStep[] {
  const out: CompiledStep[] = [];
  for (const entry of prepared.inputs) {
    const result = results.get(entry);
    if (!result) continue;
    out.push({
      account: prepared.key,
      personKey: entry.personKey,
      person: entry.person,
      stepIndex: entry.stepIndex,
      step: entry.step,
      subject: entry.input.subject,
      result,
    });
  }
  return out;
}
