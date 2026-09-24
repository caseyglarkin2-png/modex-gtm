/**
 * GAP message compiler checks (Sprint 3, S3-T8): C07 WORD_COUNT, C08 ONE_PROBLEM,
 * C09 ONE_CTA, C15 SUBJECT_FORM and C16 STEP_LINKS. Spec section 8. Pure: no I/O.
 *
 * This file also owns the loose group C contract reader (`readGroupCContract`)
 * that C11, C12 and C13 share. `CompileContext.contract` is typed `unknown`;
 * group C reads these optional fields from it and ignores anything else:
 *
 *   wordRange      { min, max }   C07 override of the per-step defaults
 *   stepCount      number         C16 and C11 derive "is this the last step"
 *   isLastStep     boolean        same, explicit
 *   journeyStage   JourneyStage   C09 override of the step-derived stage
 *   claimsUsed     string[]       C13 ids to validate
 *   validateClaims function       C13 validator (S3-T1 shape, documented in c13-claims.ts)
 *
 * C09 CTA finder: a question, a CTA phrase ("would you", "let me know", ...),
 * a policy scorecard_reply phrase, or the lane's conditional-offer form (an
 * "If ..." sentence whose main clause is a first-person offer;
 * `CONDITIONAL_OFFER_RE`, S3-T13).
 *
 * C09 CTA classification (documented patterns, first match wins):
 *   meeting_request  calendar, 15/20/30 minutes, hop or jump on a call, book time,
 *                    "next week?", schedule a, a quick/short call or meeting, demo,
 *                    walkthrough, walk you through, benchmark call, set the time,
 *                    working session
 *   scorecard_reply  a phrase cold-outbound-policy lists as scorecard_reply language
 *                    ("Worth sending over the yard-network scorecard?", "Reply and
 *                    I'll send the short version.", "If useful, I can send the
 *                    1-page scorecard."), checked before the asset heuristic
 *   asset_offer      an offer verb (send, share, forward, worth a look, put together,
 *                    pull together, draft, show) in the same sentence as an approved
 *                    asset noun (scorecard, short version, 1-page, two-page,
 *                    one-pager, proof page, order of operations, ROI model,
 *                    comparison, summary, yard read, a yardflow.ai path)
 *   scorecard_reply  any other question: the diagnostic the buyer answers with a fact
 *   light_reaction   a CTA phrase that is none of the above ("let me know")
 * Acceptance: the family equals `getCtaPolicy('outreach_sequence', stage)
 * .allowedFamily` (step 0 = sequence_step_1 = scorecard_reply; later =
 * sequence_step_2_plus = asset_offer), OR it is scorecard_reply at any
 * pre-meeting stage (a gap question is always a valid ask before a meeting).
 * A meeting request fails at every pre-meeting stage; an asset offer at step 0
 * fails.
 */

import { getCtaPolicy, type CtaFamily, type JourneyStage } from '../../../revops/cold-outbound-policy';
import { PROBLEM_FAMILIES, classifyFamilies, type ProblemFamily } from '../../taxonomy';
import { isQuestion, sentenceSpans, spanOf, stripGreetingAndSignature, stripMarkers, wordCount } from '../text';
import type { Check, CheckSpan, CompileContext } from '../types';

export const C07_CODE = 'C07';
export const C08_CODE = 'C08';
export const C09_CODE = 'C09';
export const C15_CODE = 'C15';
export const C16_CODE = 'C16';

// ---------------------------------------------------------------------------
// Group C contract reader
// ---------------------------------------------------------------------------

export interface ClaimsValidationContext {
  stepIsQuestion: boolean;
  surface: 'sales_email';
}

export type ClaimsValidationResult = { ok: true; unnamedOnly?: string[] } | { ok: false; reason: string };

/** The S3-T1 `validateClaimsUsed` shape, injected through the contract so this file never imports it. */
export type ClaimsValidator = (ids: string[], ctx: ClaimsValidationContext) => ClaimsValidationResult;

export interface WordRange {
  min: number;
  max: number;
}

export interface GroupCContract {
  wordRange?: WordRange;
  stepCount?: number;
  isLastStep?: boolean;
  journeyStage?: JourneyStage;
  claimsUsed?: string[];
  validateClaims?: ClaimsValidator;
}

const JOURNEY_STAGES: ReadonlySet<string> = new Set<JourneyStage>([
  'cold_email',
  'sequence_step_1',
  'sequence_step_2_plus',
  'one_pager',
  'microsite',
  'follow_up',
  'meeting_prep',
]);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Narrow the untyped contract to the fields group C reads. Junk is ignored, never thrown on. */
export function readGroupCContract(ctx: CompileContext): GroupCContract {
  const raw = ctx.contract;
  if (raw == null || typeof raw !== 'object') return {};
  const c = raw as Record<string, unknown>;
  const out: GroupCContract = {};

  const wr = c.wordRange as Record<string, unknown> | undefined;
  if (wr && typeof wr === 'object' && isFiniteNumber(wr.min) && isFiniteNumber(wr.max) && wr.min <= wr.max) {
    out.wordRange = { min: wr.min, max: wr.max };
  }
  if (isFiniteNumber(c.stepCount) && Number.isInteger(c.stepCount) && c.stepCount > 0) {
    out.stepCount = c.stepCount;
  }
  if (typeof c.isLastStep === 'boolean') out.isLastStep = c.isLastStep;
  if (typeof c.journeyStage === 'string' && JOURNEY_STAGES.has(c.journeyStage)) {
    out.journeyStage = c.journeyStage as JourneyStage;
  }
  if (Array.isArray(c.claimsUsed)) {
    out.claimsUsed = c.claimsUsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof c.validateClaims === 'function') out.validateClaims = c.validateClaims as ClaimsValidator;
  return out;
}

/** true / false when the contract settles it, null when the step position is unknown. */
export function isLastStep(ctx: CompileContext): boolean | null {
  const c = readGroupCContract(ctx);
  if (typeof c.isLastStep === 'boolean') return c.isLastStep;
  if (typeof c.stepCount === 'number') return ctx.stepIndex === c.stepCount - 1;
  return null;
}

// ---------------------------------------------------------------------------
// C07 WORD_COUNT
// ---------------------------------------------------------------------------

/** The lane's step 1 range (DRAFT_CONTRACT: 45-80 words). */
export const STEP0_WORD_RANGE: WordRange = { min: 45, max: 80 };
/** The lane's later-step range (DRAFT_CONTRACT: 40-100 words). */
export const LATER_WORD_RANGE: WordRange = { min: 40, max: 100 };
/** The spec's outer bound; a contract override must stay inside it to mean anything. */
export const SPEC_WORD_RANGE: WordRange = { min: 45, max: 120 };

export function wordRangeFor(ctx: CompileContext): WordRange {
  const c = readGroupCContract(ctx);
  if (c.wordRange) return c.wordRange;
  return ctx.stepIndex === 0 ? STEP0_WORD_RANGE : LATER_WORD_RANGE;
}

export const checkWordCount: Check = (draft, ctx) => {
  const count = wordCount(draft.body);
  const { min, max } = wordRangeFor(ctx);
  const passed = count >= min && count <= max;
  return {
    code: C07_CODE,
    passed,
    severity: 'reject',
    detail: `${count} words, ${passed ? 'within' : 'outside'} ${min}..${max} for step ${ctx.stepIndex}`,
    span: null,
  };
};

// ---------------------------------------------------------------------------
// C08 ONE_PROBLEM
// ---------------------------------------------------------------------------

/** A second family needs at least this many cue hits to count as a second problem. */
export const ONE_PROBLEM_MIN_HITS = 2;

export const checkOneProblem: Check = (draft) => {
  const text = stripMarkers(stripGreetingAndSignature(draft.body));
  const { primary, hits } = classifyFamilies(text);
  const contenders: ProblemFamily[] = PROBLEM_FAMILIES.filter((f) => hits[f] >= ONE_PROBLEM_MIN_HITS).sort(
    (a, b) => hits[b] - hits[a] || PROBLEM_FAMILIES.indexOf(a) - PROBLEM_FAMILIES.indexOf(b),
  );
  if (contenders.length >= 2) {
    const [first, second] = contenders;
    return {
      code: C08_CODE,
      passed: false,
      severity: 'reject',
      detail: `two problem families in one body: ${first} (${hits[first]} hits) and ${second} (${hits[second]} hits)`,
      span: null,
    };
  }
  const detail = primary === 'unmapped' ? 'no family cues' : `one problem family: ${primary} (${hits[primary]} hits)`;
  return { code: C08_CODE, passed: true, severity: 'reject', detail, span: null };
};

// ---------------------------------------------------------------------------
// C09 ONE_CTA
// ---------------------------------------------------------------------------

/** Non-question sentences that still ask for something. */
export const CTA_PHRASE_RE =
  /\b(?:would you|could you|are you open to|let me know|worth a look|happy to|can i send|i can send|reply and|want me to)\b/i;

/** Scheduling asks; forbidden at every pre-meeting stage. */
export const MEETING_REQUEST_RE =
  /\bcalendar\b|\b(?:15|20|30|fifteen|twenty|thirty) minutes\b|\b(?:hop|jump) on a call\b|\bbook (?:some |a )?time\b|\bnext week\?|\bschedule (?:a|some|time)\b|\ba (?:quick|short|brief) (?:call|chat|meeting)\b|\bgrab (?:time|a slot)\b|\bmeet (?:for|next|this|on)\b|\bdemo\b|\bwalkthrough\b|\bwalk you through\b|\bbenchmark call\b|\bset (?:the|a|up a|up some) time\b|\bworking session\b/i;

/** An offer to send something, when paired with an approved asset noun. */
export const OFFER_VERB_RE =
  /\b(?:send|sending|share|sharing|forward|pass along|worth a look|put together|pull together|draft|show)\b/i;

/** The assets the lane may offer (DRAFT_CONTRACT step 4 plus the policy's scorecard language). */
export const ASSET_NOUN_RE =
  /\bscorecard\b|\bshort version\b|\b(?:1|one|2|two)[- ]page\b|\bone[- ]pager\b|\bproof page\b|\border of operations\b|\bROI (?:model|page|calculator)\b|\bcomparison\b|\bsummary\b|\byard read\b|\byardflow\.ai\//i;

/**
 * The lane's conditional-offer form (S3-T13): a sentence opening with "If"
 * whose main clause is a first-person offer ("If useful, I can pull together
 * ...", "If a working session would help, I'll set the time."). A "worth"
 * conditional counts only as a question, which the question rule already
 * finds; a bare "worth" clause ("If it's already covered, this isn't worth
 * pursuing.") is an opt-out hedge, not a CTA, and the real-lane run proved
 * it (37 false double-CTAs). A conditional with no first-person offer ("If
 * Dayton checks drivers in on paper, the two sites will disagree") is not a
 * CTA either.
 */
export const CONDITIONAL_OFFER_RE =
  /^if\b[^.!?]*?(?:\b(?:i|we)(?:(?:'|’)(?:ll|d)| will| can| could| would)?\s+(?:send|share|show|draft|put together|pull together|walk you through|set (?:the|a|up a|up some) time|grab (?:time|a slot)|find (?:15|20|30|fifteen|twenty|thirty) minutes)\b|\bhappy to (?:send|share|show|draft|put together|pull together|walk you through)\b)/i;

/**
 * The phrases `buildColdOutboundPolicyNotes` lists as preferred scorecard_reply
 * language. Straight or curly apostrophe, optional comma after "If useful".
 */
export const SCORECARD_REPLY_PHRASE_RE =
  /\bworth sending over the yard[- ]network scorecard\b|\breply and i(?:'|’)ll send the short version\b|\bif useful,? i can send the 1-page scorecard\b/i;

export function classifyCtaFamily(sentence: string): CtaFamily {
  const s = stripMarkers(sentence);
  if (MEETING_REQUEST_RE.test(s)) return 'meeting_request';
  if (SCORECARD_REPLY_PHRASE_RE.test(s)) return 'scorecard_reply';
  if (OFFER_VERB_RE.test(s) && ASSET_NOUN_RE.test(s)) return 'asset_offer';
  if (isQuestion(s)) return 'scorecard_reply';
  return 'light_reaction';
}

export interface CtaSentence {
  sentence: string;
  span: CheckSpan | null;
  family: CtaFamily;
}

/** Every CTA sentence of the body (greeting and signature excluded), in order. */
export function findCtaSentences(body: string): CtaSentence[] {
  const content = stripGreetingAndSignature(body);
  const out: CtaSentence[] = [];
  for (const { sentence, span } of sentenceSpans(body, content)) {
    const plain = stripMarkers(sentence);
    if (
      isQuestion(plain) ||
      CTA_PHRASE_RE.test(plain) ||
      SCORECARD_REPLY_PHRASE_RE.test(plain) ||
      CONDITIONAL_OFFER_RE.test(plain.trim())
    ) {
      out.push({ sentence, span, family: classifyCtaFamily(plain) });
    }
  }
  return out;
}

export function journeyStageFor(ctx: CompileContext): JourneyStage {
  const c = readGroupCContract(ctx);
  if (c.journeyStage) return c.journeyStage;
  return ctx.stepIndex === 0 ? 'sequence_step_1' : 'sequence_step_2_plus';
}

export const checkOneCta: Check = (draft, ctx) => {
  const stage = journeyStageFor(ctx);
  const policy = getCtaPolicy('outreach_sequence', stage);
  const allowed = policy.allowedFamily;
  const ctas = findCtaSentences(draft.body);

  if (ctas.length === 0) {
    return {
      code: C09_CODE,
      passed: false,
      severity: 'reject',
      detail: `no CTA: expected exactly one ${allowed} sentence for step ${ctx.stepIndex} (${stage})`,
      span: null,
    };
  }
  if (ctas.length > 1) {
    return {
      code: C09_CODE,
      passed: false,
      severity: 'reject',
      detail: `${ctas.length} CTAs, expected one: ${ctas.map((c) => `"${c.sentence}"`).join(' | ')}`,
      span: ctas[1].span,
    };
  }

  const [cta] = ctas;
  if (policy.disallowedFamilies.includes(cta.family)) {
    return {
      code: C09_CODE,
      passed: false,
      severity: 'reject',
      detail: `CTA family ${cta.family} is disallowed before a meeting (step ${ctx.stepIndex}, ${stage}): "${cta.sentence}"`,
      span: cta.span,
    };
  }
  const preMeeting = allowed !== 'meeting_request';
  const gapQuestionAccepted = preMeeting && cta.family === 'scorecard_reply';
  if (cta.family !== allowed && !gapQuestionAccepted) {
    return {
      code: C09_CODE,
      passed: false,
      severity: 'reject',
      detail: `CTA family ${cta.family} is not the allowed ${allowed} for step ${ctx.stepIndex} (${stage}): "${cta.sentence}"`,
      span: cta.span,
    };
  }
  const how = cta.family === allowed ? '' : ', a gap question is accepted at any pre-meeting stage';
  return {
    code: C09_CODE,
    passed: true,
    severity: 'reject',
    detail: `one CTA (${cta.family}${how}): "${cta.sentence}"`,
    span: cta.span,
  };
};

// ---------------------------------------------------------------------------
// C15 SUBJECT_FORM (review)
// ---------------------------------------------------------------------------

export const SUBJECT_MIN_WORDS = 2;
/** Audit row 18 allows up to seven; the lane's lint used five. */
export const SUBJECT_MAX_WORDS = 7;

const EM_DASH = String.fromCharCode(0x2014);
const REPLY_PREFIX_RE = /^(?:re|fwd?)\s*:/i;

/** The lane's rule: three or more words and at least 75% of the rest capitalised. */
export function isTitleCase(words: readonly string[]): boolean {
  if (words.length < 3) return false;
  const rest = words.slice(1);
  const caps = rest.filter((w) => /^[A-Z][a-z]/.test(w)).length;
  return caps >= Math.ceil(rest.length * 0.75);
}

/**
 * The lane's `stray_capital_subject`: a capitalised mid-subject word that the body
 * uses in lowercase and never capitalises mid-sentence (so it is not a proper noun).
 */
export function strayCapitals(words: readonly string[], body: string): string[] {
  const lower = body.toLowerCase();
  return words.slice(1).filter((w) => {
    if (!/^[A-Z][a-z]{2,}$/.test(w)) return false;
    const inBody = new RegExp(`\\b${w.toLowerCase()}\\b`).test(lower);
    const properNoun = new RegExp(`[a-z.,;] ${w}\\b`).test(body);
    return inBody && !properNoun;
  });
}

export const checkSubjectForm: Check = (draft) => {
  const subject = draft.subject.trim();
  const words = subject.split(/\s+/).filter((w) => w.length > 0);
  const problems: string[] = [];

  if (words.length < SUBJECT_MIN_WORDS || words.length > SUBJECT_MAX_WORDS) {
    problems.push(`${words.length} words, expected ${SUBJECT_MIN_WORDS}..${SUBJECT_MAX_WORDS}`);
  }
  if (REPLY_PREFIX_RE.test(subject)) problems.push('reply or forward prefix');
  if (subject.includes(EM_DASH)) problems.push('em dash');
  if (subject.length > 0 && !/^[A-Z0-9]/.test(subject)) problems.push('first character is not a capital');
  if (isTitleCase(words)) problems.push('Title Case');
  const stray = strayCapitals(words, draft.body);
  if (stray.length > 0) problems.push(`stray capital: ${stray.join(', ')}`);

  if (problems.length > 0) {
    return {
      code: C15_CODE,
      passed: false,
      severity: 'review',
      detail: `subject form: ${problems.join('; ')}: "${subject}"`,
      span: { start: 0, end: subject.length, text: subject },
    };
  }
  return { code: C15_CODE, passed: true, severity: 'review', detail: 'subject is sentence case, 2..7 words', span: null };
};

// ---------------------------------------------------------------------------
// C16 STEP_LINKS
// ---------------------------------------------------------------------------

const URL_RE = /https?:\/\/[^\s<>()[\]"']+|\bwww\.[^\s<>()[\]"']+/gi;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)|<img\b|\.(?:png|jpe?g|gif|webp|svg)\b/i;
/** DRAFT_CONTRACT step 4: only these three yardflow.ai pages, trailing slash optional. */
export const LAST_STEP_URL_ALLOWLIST_RE =
  /^https?:\/\/(?:www\.)?yardflow\.ai\/(?:proof|order-of-operations|roi)\/?(?:[?#]\S*)?$/i;

function trimUrl(raw: string): string {
  return raw.replace(/[.,;:!?)]+$/, '');
}

export function findLinks(text: string): Array<{ url: string; span: CheckSpan }> {
  const out: Array<{ url: string; span: CheckSpan }> = [];
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const url = trimUrl(m[0]);
    out.push({ url, span: { start: m.index, end: m.index + url.length, text: url } });
  }
  return out;
}

export const checkStepLinks: Check = (draft, ctx) => {
  const image = IMAGE_RE.exec(draft.body);
  if (image) {
    return {
      code: C16_CODE,
      passed: false,
      severity: 'reject',
      detail: `image reference in the body: "${image[0]}"`,
      span: { start: image.index, end: image.index + image[0].length, text: image[0] },
    };
  }

  const links = findLinks(draft.body);
  const last = isLastStep(ctx);

  if (links.length > 0) {
    const [first] = links;
    if (ctx.stepIndex === 0) {
      return {
        code: C16_CODE,
        passed: false,
        severity: 'reject',
        detail: `link in step 0: ${first.url}`,
        span: first.span,
      };
    }
    if (last === false) {
      return {
        code: C16_CODE,
        passed: false,
        severity: 'reject',
        detail: `link outside the last step (step ${ctx.stepIndex}): ${first.url}`,
        span: first.span,
      };
    }
    const off = links.find((l) => !LAST_STEP_URL_ALLOWLIST_RE.test(l.url));
    if (off) {
      const where = last === null ? 'step position unknown, allowlist applied' : 'last step';
      return {
        code: C16_CODE,
        passed: false,
        severity: 'reject',
        detail: `link off the allowlist (${where}): ${off.url}; allowed yardflow.ai/proof/, /order-of-operations/, /roi/`,
        span: off.span,
      };
    }
  }

  const content = stripGreetingAndSignature(draft.body);
  const lastToken = content.split(/\s+/).filter((t) => t.length > 0).pop() ?? '';
  if (/^https?:\/\/\S+[.)]?$/i.test(lastToken)) {
    return {
      code: C16_CODE,
      passed: false,
      severity: 'reject',
      detail: `bare URL as the last token: ${trimUrl(lastToken)}`,
      span: spanOf(draft.body, lastToken),
    };
  }

  const detail = links.length === 0 ? 'no links' : `${links.length} allowlisted link(s) at the last step`;
  return { code: C16_CODE, passed: true, severity: 'reject', detail, span: null };
};
