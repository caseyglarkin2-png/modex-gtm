/**
 * GAP message compiler check (Sprint 3, S3-T8): C13 CLAIMS. Spec section 8.
 * Pure: no I/O. The S3-T1 validator for DECLARED ids is injected through the
 * contract:
 *
 *   ctx.contract.claimsUsed: string[]
 *   ctx.contract.validateClaims: (ids, { stepIsQuestion, surface: 'sales_email' })
 *       -> { ok: true; unnamedOnly?: string[] } | { ok: false; reason: string }
 *
 * `stepIsQuestion` is whether the body's CTA sentence (C09's finder) is a
 * question. A refusal rejects with the validator's reason. `unnamedOnly` ids are
 * attached to the detail; C05 enforces the innuendo rule for them. No claims used
 * passes. Claims used with no validator, or a validator that throws, is a review
 * (never a pass, never a reject): the ids are unverified, not wrong.
 *
 * Forbidden text (N1, 2026-09-23): declared ids are the caller's word, so
 * before any of that the subject and body are scanned for the text of every
 * DO_NOT_USE and INTERNAL_ONLY row in the committed claims snapshot: the
 * row's `claim_text` plus every quoted alternative in `forbidden_phrasing`
 * (the whole field when it quotes nothing). A hit rejects
 * `claim_text_forbidden:<id>` naming the phrase and the surface. Matching is
 * whole-phrase, case-insensitive, whitespace-collapsed, curly quotes read as
 * straight, and a single-word phrase also matches its s/es/ed/ing form
 * ("coexists" is CR-029). This scan reads the snapshot directly (the one
 * import from the claims module) because it is a floor no caller may leave
 * out; the declared-id validator stays injectable.
 */

import { loadClaims } from '../../claims/validate-claims';
import { isQuestion } from '../text';
import type { Check, CheckSpan } from '../types';
import {
  checkOneCta,
  checkOneProblem,
  checkStepLinks,
  checkSubjectForm,
  checkWordCount,
  findCtaSentences,
  readGroupCContract,
} from './c07-structure';
import { checkBannedPhrases, checkVoiceWarn } from './c11-banned';
import { checkFollowupNewInfo } from './c12-newinfo';

export const C13_CODE = 'C13';

export function stepIsQuestion(body: string): boolean {
  const [cta] = findCtaSentences(body);
  return cta ? isQuestion(cta.sentence) : false;
}

// ---------------------------------------------------------------------------
// Forbidden claim text (N1)
// ---------------------------------------------------------------------------

export interface ForbiddenClaimPhrases {
  id: string;
  status: 'DO_NOT_USE' | 'INTERNAL_ONLY';
  /** The canonical claim_text first, then each forbidden_phrasing alternative. */
  phrases: string[];
}

let forbiddenCache: ForbiddenClaimPhrases[] | null = null;

/** Every DO_NOT_USE and INTERNAL_ONLY row of the committed snapshot with the text C13 scans for. */
export function forbiddenClaimPhrases(): readonly ForbiddenClaimPhrases[] {
  if (!forbiddenCache) {
    forbiddenCache = loadClaims()
      .filter((r) => r.status === 'DO_NOT_USE' || r.status === 'INTERNAL_ONLY')
      .map((r) => {
        const phrases = new Set<string>();
        const add = (p: string) => {
          const t = p.trim();
          if (t.length >= 3) phrases.add(t);
        };
        add(r.claim_text);
        // Every quoted alternative in forbidden_phrasing, even when prose
        // follows it ("'$70,363' or 'costOfInactionPerMonth' in any
        // customer-facing copy" is two phrases, not one sentence); a field
        // with no quotes is one phrase.
        const forbidden = r.forbidden_phrasing ?? '';
        const quoted = [...forbidden.matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);
        if (quoted.length > 0) quoted.forEach(add);
        else add(forbidden);
        return { id: r.claim_id, status: r.status as 'DO_NOT_USE' | 'INTERNAL_ONLY', phrases: [...phrases] };
      });
  }
  return forbiddenCache;
}

/** Curly quotes to straight, one for one, so offsets into the original text hold. */
function straightQuotes(text: string): string {
  return text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-phrase, case-insensitive, whitespace-collapsed; single words also match their s/es/ed/ing form. */
export function forbiddenPhraseRe(phrase: string): RegExp {
  const normalized = straightQuotes(phrase).trim().replace(/\s+/g, ' ');
  const body = normalized.split(' ').map(escapeRe).join('\\s+');
  const singleWord = /^[A-Za-z]+$/.test(normalized);
  const suffix = singleWord ? '(?:s|es|ed|ing)?' : '';
  return new RegExp(`(?<![A-Za-z0-9])${body}${suffix}(?![A-Za-z0-9])`, 'i');
}

interface ForbiddenHit {
  id: string;
  status: ForbiddenClaimPhrases['status'];
  phrase: string;
  span: CheckSpan;
}

function findForbiddenClaimText(text: string): ForbiddenHit | null {
  const haystack = straightQuotes(text);
  for (const entry of forbiddenClaimPhrases()) {
    for (const phrase of entry.phrases) {
      const m = forbiddenPhraseRe(phrase).exec(haystack);
      if (m) {
        return { id: entry.id, status: entry.status, phrase, span: { start: m.index, end: m.index + m[0].length, text: text.slice(m.index, m.index + m[0].length) } };
      }
    }
  }
  return null;
}

export const checkClaims: Check = (draft, ctx) => {
  for (const [where, text] of [
    ['subject', draft.subject],
    ['body', draft.body],
  ] as const) {
    const hit = findForbiddenClaimText(text);
    if (hit) {
      return {
        code: C13_CODE,
        passed: false,
        severity: 'reject',
        detail: `claim_text_forbidden:${hit.id} (${hit.status} phrasing "${hit.phrase}" in the ${where})`,
        span: hit.span,
      };
    }
  }

  const contract = readGroupCContract(ctx);
  const ids = contract.claimsUsed ?? [];

  if (ids.length === 0) {
    return { code: C13_CODE, passed: true, severity: 'reject', detail: 'no claims used', span: null };
  }
  if (!contract.validateClaims) {
    return {
      code: C13_CODE,
      passed: false,
      severity: 'review',
      detail: `no validator: ${ids.length} claim id(s) unverified (${ids.join(', ')})`,
      span: null,
    };
  }

  const question = stepIsQuestion(draft.body);
  let result;
  try {
    result = contract.validateClaims(ids, { stepIsQuestion: question, surface: 'sales_email' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      code: C13_CODE,
      passed: false,
      severity: 'review',
      detail: `validator threw: ${message} (${ids.join(', ')})`,
      span: null,
    };
  }

  if (!result.ok) {
    return {
      code: C13_CODE,
      passed: false,
      severity: 'reject',
      detail: `claim refused: ${result.reason} (claims ${ids.join(', ')}; stepIsQuestion=${question})`,
      span: null,
    };
  }

  const unnamed = result.unnamedOnly ?? [];
  const suffix = unnamed.length > 0 ? `; unnamedOnly: ${unnamed.join(', ')} (C05 enforces the innuendo)` : '';
  return {
    code: C13_CODE,
    passed: true,
    severity: 'reject',
    detail: `${ids.length} claim(s) validated (stepIsQuestion=${question})${suffix}`,
    span: null,
  };
};

/** Group C in check-code order: C07, C08, C09, C11, C12, C13, C14, C15, C16. */
export const GROUP_C_CHECKS: Check[] = [
  checkWordCount,
  checkOneProblem,
  checkOneCta,
  checkBannedPhrases,
  checkFollowupNewInfo,
  checkClaims,
  checkVoiceWarn,
  checkSubjectForm,
  checkStepLinks,
];
