/**
 * GAP message compiler checks (Sprint 3, S3-T6): C01 OBSERVATION_UNSUPPORTED,
 * C05 PROOF_UNSUPPORTED and C10 OBSERVATION_FIRST. Spec section 8. Pure: no I/O.
 *
 * C01: the citation set is the body's `[[SRC:id]]` / `[S:id]` markers UNION
 * the step's `contract.evidenceIds` (the lane cites beside the body because
 * HubSpot-native copy reaches the prospect verbatim, S3-T13). Every cited id
 * resolves to an evidence ref that is fresh, not superseded and either
 * external_ok or first-party, with the same detail wording for both forms
 * ("marker [[SRC:id]]" or "evidence_ids id" as the source). Observation-first:
 * a body with no marker must carry at least one resolved evidence_ids entry
 * to support its first sentence whenever the hypothesis has an observation
 * (any step) or, at step 0 only, whenever the contract carries an evidenceIds
 * list at all (a later step citing nothing is C12's reject, not C01's), else
 * `observation_unsupported` quoting that sentence. A first-party ref is never
 * quoted as public. Every number token is either in the title or excerpt of
 * a cited ref (same digits) or inside a canon figure. Canon PHRASING
 * (measured, observed, modeled, committed) is C05's job, so "48 to 24 minutes
 * proved" passes C01 and fails C05. Marker-carrying bodies behave exactly as
 * before the lane convention was accepted.
 *
 * C05: a named organization followed by a result verb is proof. It is allowed
 * only for PUBLIC_REFERENCE_CUSTOMERS or when the sentence cites a marker
 * whose id is in `contract.proofRefs`. Every name in `contract.namedPipeline`
 * is innuendo, never named (label `named_pipeline`), in subject or body. Canon
 * figures must travel with their required qualifier (nearest qualifier wins).
 *
 * Organization detection is deliberately simple: the lane's `namedPipeline`
 * list (whole word, case- and diacritic-insensitive, our own names excluded)
 * plus capitalized multi-word runs such as "Acme Foods". A single capitalized
 * word (e.g. "Kroger") is only caught through the pipeline list.
 *
 * C10: when the body carries a marker, paragraph 1 (after the greeting) must
 * carry one; when it carries none, paragraph 1 must carry a hedge token.
 *
 * Expected `ctx.contract` shape for C05 (all fields optional; missing = []):
 *   { proofRefs: string[]; unnamedOnlyClaimIds: string[]; namedPipeline: string[]; claimsUsed: string[] }
 */

import { HEDGE_TOKENS } from '../../taxonomy';
import {
  CANON_NUMBERS,
  NUMBER_TOKEN_RE,
  OWN_NAMES,
  PUBLIC_REFERENCE_CUSTOMERS,
  tokenDigits,
  type CanonNumber,
} from '../canon';
import {
  bodyParagraphs,
  hasMarker,
  readCitationContract,
  sentenceSpans,
  spanOf,
  splitSentences,
  stripGreetingAndSignature,
} from '../text';
import type { Check, CheckResult, CheckSpan, CompileContext, CompileEvidenceRef } from '../types';

export const C01_CODE = 'C01';
export const C05_CODE = 'C05';
export const C10_CODE = 'C10';

/** Marker with its id captured: group 1 for `[[SRC:id]]`, group 2 for `[S:id]`. */
const MARKER_ID_RE = /\[\[SRC:([A-Za-z0-9_-]+)\]\]|\[S:([A-Za-z0-9_-]+)\]/g;

/** Language that presents a citation as public. */
const PUBLIC_QUOTE_RE = /\bpublicly\b|\breported(?:ly)?\b/i;

/** Result verbs that turn a named organization into a proof claim. */
const RESULT_VERB_SRC =
  '(?:cut|cuts|reduced|reduces|saved|saves|moved|moves|added|adds|went from|goes from|grew|grows|recovered|recovers|measured|measures)';
/** A capitalized multi-word run (2+ words) followed within two words by a result verb. */
const ORG_RESULT_RE = new RegExp(
  `\\b([A-Z][A-Za-z&'.-]+(?:\\s+[A-Z][A-Za-z&'.-]+)+)(?:'s)?\\s+(?:[a-z-]+\\s+){0,2}?${RESULT_VERB_SRC}\\b`,
  'g',
);

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

interface MarkerHit {
  id: string;
  text: string;
  index: number;
}

function markersIn(text: string): MarkerHit[] {
  const hits: MarkerHit[] = [];
  for (const m of text.matchAll(MARKER_ID_RE)) {
    hits.push({ id: m[1] ?? m[2], text: m[0], index: m.index ?? 0 });
  }
  return hits;
}

function refById(ctx: CompileContext): Map<string, CompileEvidenceRef> {
  return new Map(ctx.evidence.map((r) => [r.id, r]));
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasHedge(text: string): boolean {
  const lower = text.toLowerCase();
  return HEDGE_TOKENS.some((token) => lower.includes(token));
}

interface ProofContract {
  proofRefs: string[];
  unnamedOnlyClaimIds: string[];
  namedPipeline: string[];
  claimsUsed: string[];
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

/** Read the C05 contract fields; anything missing or malformed reads as empty. */
export function readProofContract(ctx: CompileContext): ProofContract {
  const c = ctx.contract && typeof ctx.contract === 'object' ? (ctx.contract as Record<string, unknown>) : {};
  return {
    proofRefs: stringList(c.proofRefs),
    unnamedOnlyClaimIds: stringList(c.unnamedOnlyClaimIds),
    namedPipeline: stringList(c.namedPipeline),
    claimsUsed: stringList(c.claimsUsed),
  };
}

/**
 * Normalise a lane pipeline entry into matchable names: split on `/`, drop
 * parentheticals, trim, drop our own names and anything under two characters.
 */
function pipelineNames(raw: string[]): string[] {
  const own = new Set(OWN_NAMES.map(fold));
  const out = new Set<string>();
  for (const entry of raw) {
    for (const part of entry.split('/')) {
      const name = part.replace(/\([^)]*\)/g, '').trim();
      if (name.length < 2 || own.has(fold(name))) continue;
      out.add(name);
    }
  }
  return Array.from(out);
}

/** Distance in characters between two spans; 0 when they overlap. */
function distance(aStart: number, aEnd: number, bStart: number, bEnd: number): number {
  if (bStart >= aEnd) return bStart - aEnd;
  if (bEnd <= aStart) return aStart - bEnd;
  return 0;
}

function nearest(sentence: string, re: RegExp, start: number, end: number): number | null {
  const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  let best: number | null = null;
  for (const m of sentence.matchAll(global)) {
    const d = distance(start, end, m.index ?? 0, (m.index ?? 0) + m[0].length);
    if (best === null || d < best) best = d;
  }
  return best;
}

/** Canon figure matches in a sentence, as [start, end) offsets with their rule. */
function canonMatches(sentence: string): Array<{ canon: CanonNumber; start: number; end: number; text: string }> {
  const out: Array<{ canon: CanonNumber; start: number; end: number; text: string }> = [];
  for (const canon of CANON_NUMBERS) {
    const re = new RegExp(canon.pattern.source, canon.pattern.flags);
    for (const m of sentence.matchAll(re)) {
      const start = m.index ?? 0;
      out.push({ canon, start, end: start + m[0].length, text: m[0] });
    }
  }
  return out;
}

/** The phrasing violation for one canon figure in one sentence, or null. */
function canonPhrasingViolation(sentence: string, hit: { canon: CanonNumber; start: number; end: number }): string | null {
  const required = nearest(sentence, hit.canon.requiredPhrasing, hit.start, hit.end);
  const forbidden = nearest(sentence, hit.canon.forbiddenPhrasing, hit.start, hit.end);
  if (required === null) {
    return `must appear with "${hit.canon.requiredLabel}"`;
  }
  if (forbidden !== null && forbidden < required) {
    return `must appear with "${hit.canon.requiredLabel}", not the closer qualifier`;
  }
  return null;
}

function fail(code: string, detail: string, span: CheckSpan | null): CheckResult {
  return { code, passed: false, severity: 'reject', detail, span };
}

function pass(code: string, detail: string): CheckResult {
  return { code, passed: true, severity: 'reject', detail, span: null };
}

// ---------------------------------------------------------------------------
// C01 OBSERVATION_UNSUPPORTED
// ---------------------------------------------------------------------------

/**
 * The reason a cited id is not usable, in the shared wording; `source` is the
 * citation form ("marker [[SRC:id]]" or "evidence_ids id"). Null when the ref
 * is fresh, not superseded and external_ok or first-party.
 */
function citationFault(source: string, id: string, ref: CompileEvidenceRef | undefined): string | null {
  if (!ref) return `${source} resolves to no evidence ref (id ${id})`;
  if (ref.superseded) return `${source} cites superseded evidence ${id}`;
  if (!ref.fresh) return `${source} cites stale evidence ${id}`;
  if (!ref.externalOk && !ref.firstParty) return `${source} cites evidence ${id} that is neither external_ok nor first-party`;
  return null;
}

export const checkObservationUnsupported: Check = (draft, ctx) => {
  const refs = refById(ctx);
  const markers = markersIn(draft.body);
  const citation = readCitationContract(ctx.contract);

  for (const marker of markers) {
    const span: CheckSpan = { start: marker.index, end: marker.index + marker.text.length, text: marker.text };
    const fault = citationFault(`marker ${marker.text}`, marker.id, refs.get(marker.id));
    if (fault) return fail(C01_CODE, fault, span);
  }

  // The lane's beside-the-body citations: same rules, no span (nothing in the text to point at).
  const markerIdSet = new Set(markers.map((m) => m.id));
  const extraIds = citation.evidenceIds.filter((id) => !markerIdSet.has(id));
  for (const id of extraIds) {
    const fault = citationFault(`evidence_ids ${id}`, id, refs.get(id));
    if (fault) return fail(C01_CODE, fault, null);
  }

  // Observation-first: with no marker in the body, the first sentence must be
  // supported by at least one resolved beside-the-body id. The rule fires
  // when there is an observation to support (the hypothesis has one, any
  // step) or, at step 0 only, when the lane convention is in play (the
  // contract carries an evidenceIds list: a cold open citing nothing is
  // unsupported). A later step citing nothing is C12's "no evidence id"
  // reject and is not double-counted here; an uncited transparent-hypothesis
  // body with no observation stays C10's business.
  const paragraphs = bodyParagraphs(draft.body);
  const hasObservation = ctx.hypothesis.observation.trim().length > 0;
  const coldOpenUncited = citation.laneConvention && ctx.stepIndex === 0;
  if ((hasObservation || coldOpenUncited) && !paragraphs.some(hasMarker) && extraIds.length === 0) {
    const first = splitSentences(paragraphs[0] ?? '')[0] ?? '';
    return fail(
      C01_CODE,
      `observation_unsupported: the body carries no marker and no resolved evidence id supports the first sentence "${first}"`,
      spanOf(draft.body, first),
    );
  }

  const content = stripGreetingAndSignature(draft.body);
  const sentences = sentenceSpans(draft.body, content);

  for (const { sentence, span } of sentences) {
    if (!PUBLIC_QUOTE_RE.test(sentence)) continue;
    const firstParty = markersIn(sentence).find((m) => refs.get(m.id)?.firstParty);
    if (firstParty) {
      return fail(
        C01_CODE,
        `first-party evidence ${firstParty.id} is quoted as public in "${sentence}"; first-party refs support a sentence but are never "publicly" or "reported"`,
        span,
      );
    }
  }

  // Number coverage text: the title and excerpt of every resolved cited ref.
  const citedIds = [...markerIdSet, ...extraIds];
  const coverage = citedIds
    .flatMap((id) => {
      const ref = refs.get(id);
      return ref ? [ref.title, ref.excerpt ?? ''] : [];
    })
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/,/g, ''));

  for (const { sentence, span } of sentences) {
    const canon = canonMatches(sentence);
    const tokenRe = new RegExp(NUMBER_TOKEN_RE.source, NUMBER_TOKEN_RE.flags);
    for (const m of sentence.matchAll(tokenRe)) {
      const token = m[0];
      const start = m.index ?? 0;
      const inCanon = canon.some((c) => start >= c.start && start < c.end);
      if (inCanon) continue;
      const digits = tokenDigits(token);
      const digitsRe = new RegExp(`(?<![\\d.])${escapeRe(digits)}(?![\\d.])`);
      if (digits.length > 0 && coverage.some((t) => digitsRe.test(t))) continue;
      const tokenSpan = span ? spanOf(draft.body, token, span.start) : spanOf(draft.body, token);
      return fail(
        C01_CODE,
        `number "${token}" is neither in a cited evidence title or excerpt nor a canon figure: "${sentence}"`,
        tokenSpan,
      );
    }
  }

  return pass(
    C01_CODE,
    `${markers.length} marker(s) + ${extraIds.length} evidence_ids resolve to fresh evidence; every number is cited or canon`,
  );
};

// ---------------------------------------------------------------------------
// C05 PROOF_UNSUPPORTED
// ---------------------------------------------------------------------------

function findName(haystack: string, name: string): { index: number; text: string } | null {
  const folded = fold(haystack);
  const re = new RegExp(`(?<![A-Za-z0-9])${escapeRe(fold(name))}(?![A-Za-z0-9])`);
  const m = re.exec(folded);
  if (!m) return null;
  // NFD folding keeps base characters at the same offsets only when the
  // haystack has no combining marks; fall back to a case-insensitive search
  // on the raw text for the span, and to the folded offset otherwise.
  const raw = new RegExp(`(?<![A-Za-z0-9])${escapeRe(name)}(?![A-Za-z0-9])`, 'i').exec(haystack);
  if (raw) return { index: raw.index, text: raw[0] };
  return { index: m.index, text: haystack.slice(m.index, m.index + m[0].length) };
}

export const checkProofUnsupported: Check = (draft, ctx) => {
  const contract = readProofContract(ctx);
  const refs = refById(ctx);
  const proofRefs = new Set(contract.proofRefs);
  const innuendoClaims = contract.claimsUsed.filter((id) => contract.unnamedOnlyClaimIds.includes(id));
  const innuendoNote = innuendoClaims.length > 0
    ? `; claim ${innuendoClaims.join(', ')} is approved as unnamed innuendo only`
    : '';

  for (const name of pipelineNames(contract.namedPipeline)) {
    const inSubject = findName(draft.subject, name);
    if (inSubject) {
      return fail(
        C05_CODE,
        `named_pipeline: "${name}" appears in the subject; pipeline accounts are innuendo, never names${innuendoNote}`,
        { start: inSubject.index, end: inSubject.index + inSubject.text.length, text: inSubject.text },
      );
    }
    const inBody = findName(draft.body, name);
    if (inBody) {
      return fail(
        C05_CODE,
        `named_pipeline: "${name}" appears in the body; pipeline accounts are innuendo, never names${innuendoNote}`,
        { start: inBody.index, end: inBody.index + inBody.text.length, text: inBody.text },
      );
    }
  }

  const publicRefs = new Set(PUBLIC_REFERENCE_CUSTOMERS.map(fold));
  const isPublicReference = (org: string): boolean => {
    const f = fold(org.replace(/'s$/, ''));
    if (publicRefs.has(f)) return true;
    return PUBLIC_REFERENCE_CUSTOMERS.some((p) => f.startsWith(`${fold(p)} `) || f.endsWith(` ${fold(p)}`));
  };

  const subjectSentences = splitSentences(draft.subject).map((sentence) => ({
    sentence,
    span: spanOf(draft.subject, sentence),
    where: 'subject',
  }));
  const bodySentences = sentenceSpans(draft.body, stripGreetingAndSignature(draft.body)).map((s) => ({
    ...s,
    where: 'body',
  }));

  for (const { sentence, span, where } of [...subjectSentences, ...bodySentences]) {
    const cited = markersIn(sentence).some((m) => proofRefs.has(m.id) && refs.has(m.id) ? true : proofRefs.has(m.id));
    const orgRe = new RegExp(ORG_RESULT_RE.source, ORG_RESULT_RE.flags);
    for (const m of sentence.matchAll(orgRe)) {
      const org = m[1];
      if (isPublicReference(org)) continue;
      if (cited) continue;
      return fail(
        C05_CODE,
        `"${org}" is credited with a result in the ${where} without a proof ref: "${sentence}"; only ${PUBLIC_REFERENCE_CUSTOMERS.join(' / ')} may be named, other proof needs a [[SRC:id]] in contract.proofRefs`,
        span,
      );
    }

    for (const hit of canonMatches(sentence)) {
      const violation = canonPhrasingViolation(sentence, hit);
      if (violation) {
        return fail(
          C05_CODE,
          `canon figure "${hit.text}" (${hit.canon.label}) ${violation}: "${sentence}"`,
          span ? spanOf(where === 'subject' ? draft.subject : draft.body, hit.text, span.start) : null,
        );
      }
    }
  }

  return pass(
    C05_CODE,
    `no named pipeline account, proof only from ${PUBLIC_REFERENCE_CUSTOMERS[1]} or proof refs, canon phrasing intact${innuendoNote}`,
  );
};

// ---------------------------------------------------------------------------
// C10 OBSERVATION_FIRST
// ---------------------------------------------------------------------------

export const checkObservationFirst: Check = (draft) => {
  const paragraphs = bodyParagraphs(draft.body);
  const first = paragraphs[0];
  if (first === undefined) {
    return fail(C10_CODE, 'empty body: no paragraph after the greeting', null);
  }
  const firstSentence = splitSentences(first)[0] ?? first;
  const span = spanOf(draft.body, firstSentence);

  if (paragraphs.some(hasMarker)) {
    if (!hasMarker(first)) {
      return fail(C10_CODE, 'paragraph 1 carries no marker; the cited observation must come first', span);
    }
    return pass(C10_CODE, 'paragraph 1 carries the observation marker');
  }

  if (!hasHedge(first)) {
    return fail(
      C10_CODE,
      `uncited body: paragraph 1 must be a transparent hypothesis with a hedge token (one of: ${HEDGE_TOKENS.map((t) => t.trim()).join(', ')})`,
      span,
    );
  }
  return pass(C10_CODE, 'uncited body opens with a hedged hypothesis');
};

export const GROUP_A_CHECKS: Check[] = [checkObservationUnsupported, checkProofUnsupported, checkObservationFirst];
