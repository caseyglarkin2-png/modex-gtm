/**
 * GAP message compiler checks (Sprint 3, S3-T8): C11 BANNED_PHRASES (reject) and
 * C14 VOICE_WARN (review). Spec section 8. Pure: no I/O.
 *
 * C11 scans the subject and the body against ordered banned classes. The lane
 * classes are ported by name from `yardflow-hubspot/top100/scripts/lint-copy.mjs`
 * (regex sources kept, then widened where S3-T8 asked for more phrases); the
 * `voice_guardrails` and `post_pivot` classes come from `voice-guardrails.ts`.
 * `lint-parity.ts` maps every lane rule to the class that ports it, and the
 * parity test fails when a lane rule has no entry.
 *
 * The em dash is built with `String.fromCharCode(0x2014)` so the character never
 * appears in source.
 *
 * C14 warns on three habits: singular "yard" outside a compound (yard network,
 * yard management, yard system, yard state, yard check, yard truck, yard move,
 * yard spotting), consecutive sentences opening with the same word, and a
 * sentence opening with "I" (Casey does not start sentences with I).
 */

import { BANNED_PHRASES, POST_PIVOT_BANNED } from '../../../ai/voice-guardrails';
import { splitSentences, stripGreetingAndSignature, stripMarkers } from '../text';
import type { Check, CheckSpan } from '../types';
import { isLastStep } from './c07-structure';

export const C11_CODE = 'C11';
export const C14_CODE = 'C14';

const EM_DASH = String.fromCharCode(0x2014);

export interface BannedClass {
  name: string;
  re: RegExp;
  /** Finality language is true on the last step; the lane skipped step 4 for the same reason. */
  skipOnLastStep?: boolean;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One alternation for a phrase list, word-bounded where the phrase starts or ends on a word character. */
function phraseListRe(phrases: readonly string[]): RegExp {
  const alts = phrases.map((p) => {
    const lead = /^\w/.test(p) ? '\\b' : '';
    const trail = /\w$/.test(p) ? '\\b' : '';
    return `(?:${lead}${escapeRegex(p)}${trail})`;
  });
  return new RegExp(alts.join('|'), 'i');
}

/** Ordered: the lane's classes first (so the detail names the lane rule), then the guardrail lists. */
export const BANNED_CLASSES: readonly BannedClass[] = [
  { name: 'em_dash', re: new RegExp(EM_DASH) },
  { name: 'throughput_word', re: /\bthroughput\b/i },
  { name: 'standardize_paper', re: /standardi[sz]\w* (?:the )?(?:paper|paperwork|clipboard|forms|record|bol)\b/i },
  { name: 'because_open', re: /(?<=^|[.!?]\s+)Because\b/m },
  {
    name: 'simulated_reply',
    re: /\b(?:you asked|fair point|to your question|you mentioned|good question|you raised|thanks for (?:the|your) (?:note|reply|response))\b/i,
  },
  { name: 'wrote_back', re: /\b(?:wrote back|you replied|your reply|you responded|you got back)\b/i },
  {
    name: 'false_reply_history',
    re: /\b(?:we last (?:connected|spoke|talked)|when we (?:spoke|talked|connected)|as promised|as (?:i|we) mentioned (?:last|when)|following up on our (?:call|conversation)|as we discussed)\b/i,
  },
  {
    name: 'bespoke_deliverable',
    re: /\b(?:two-page|one-page|(?:i|we)(?:'ll| will) (?:put together|send over|draft|build you|write up)|(?:happy|glad) to (?:put together|draft|build) (?:a|the)|bespoke|custom analysis|write-up)\b/i,
  },
  {
    name: 'false_finality',
    re: /\b(?:last (?:unprompted )?(?:note|email|message)(?: from me)?|won't (?:write|email) again|final note|one last|closing the loop|close your file|breakup)\b/i,
    skipOnLastStep: true,
  },
  {
    name: 'time_relative',
    re: /\b(?:(?:this|next|last) week|tomorrow|yesterday|today|earlier this month|later this month)\b/i,
  },
  {
    name: 'mechanics_exposure',
    re: /\b(?:drip(?: campaign)?|sequence|hubspot(?: record)?|war[- ]room(?: series)?|on our radar|our (?:email )?series|crm record|our (?:cadence|automation)|been getting our)\b/i,
  },
  {
    name: 'headcount',
    re: /\b(?:headcount(?! neutral)|reduce (?:staff|headcount)|cut staff|fewer (?:people|staff|clerks|guards)|do more with less|ftes?)\b/i,
  },
  {
    name: 'filler',
    re: /\b(?:hope you(?:'re| are) (?:well|doing well)|hope this finds you|quick question|just checking in|just bumping|bumping this|thoughts\?)/i,
  },
  {
    name: '260_as_live',
    re: /other 259|260 (?:live|sites live|yards live)|(?:rolled|roll) out (?:to|across) (?:all )?260|across (?:all )?260 sites/i,
  },
  { name: 'measured_5pct', re: /5%[^.]{0,60}\bmeasured\b|\bmeasured\b[^.]{0,60}5%/i },
  { name: 'observed_48_24', re: /48[^.]{0,40}\bobserved\b|\bobserved\b[^.]{0,40}(?:48 |24 minutes)/i },
  {
    name: 'cr029_family',
    re: /not a (?:rip[- ]and[- ]replace|replacement)|\badditive\b|sits? beside|coexist|layer (?:above|on top)|on top of your (?:wms|tms|yms|stack)|not (?:a )?displac/i,
  },
  {
    name: 'cr029_paraphrase',
    re: /second system of record|whatever (?:you|they) already (?:use|run|have)|(?:system|stack) you already (?:use|run|have)|without (?:replacing|touching|disrupting) (?:your|the|existing) (?:stack|systems?|wms|tms|yms)|not a new system|feeds? whatever|alongside your (?:wms|tms|yms|stack)|in front of your (?:wms|tms) as a layer|not instead of (?:it|them|your)|sits? underneath|not a second (?:automation )?system|(?:doesn't|does not) (?:need to )?compete with|not (?:here )?to replace|(?:nothing|no one) gets replaced|keep (?:what|whatever) you (?:have|run)|not a second platform|independent of whichever system|whichever system sits on top|underneath (?:the|your) (?:tms|wms|yms)|not (?:here )?to displace/i,
  },
  {
    name: 'invented_primo_integration',
    re: /primo[^.]{0,80}(?:without (?:replacing|disrupting|touching)|existing systems? of record|alongside (?:their|its) (?:wms|tms|existing))/i,
  },
  {
    name: 'handful_narrative',
    re: /handful of (?:sites|primo|its sites|locations)|started (?:with|at) a handful|a few sites (?:first|and then)|proved it (?:on|at) a few/i,
  },
  { name: 'voice_guardrails', re: phraseListRe(BANNED_PHRASES) },
  { name: 'post_pivot', re: phraseListRe(POST_PIVOT_BANNED) },
];

export const BANNED_CLASS_NAMES: readonly string[] = BANNED_CLASSES.map((c) => c.name);

export interface BannedHit {
  className: string;
  where: 'subject' | 'body';
  span: CheckSpan;
}

export function findBannedHit(subject: string, body: string, skipLastStepClasses: boolean): BannedHit | null {
  for (const cls of BANNED_CLASSES) {
    if (cls.skipOnLastStep && skipLastStepClasses) continue;
    const re = new RegExp(cls.re.source, cls.re.flags.replace('g', ''));
    const s = re.exec(subject);
    if (s) {
      return { className: cls.name, where: 'subject', span: { start: s.index, end: s.index + s[0].length, text: s[0] } };
    }
    const b = re.exec(body);
    if (b) {
      return { className: cls.name, where: 'body', span: { start: b.index, end: b.index + b[0].length, text: b[0] } };
    }
  }
  return null;
}

export const checkBannedPhrases: Check = (draft, ctx) => {
  const hit = findBannedHit(draft.subject, draft.body, isLastStep(ctx) === true);
  if (hit) {
    return {
      code: C11_CODE,
      passed: false,
      severity: 'reject',
      detail: `banned phrase (${hit.className}) in ${hit.where}: "${hit.span.text}"`,
      span: hit.span,
    };
  }
  return { code: C11_CODE, passed: true, severity: 'reject', detail: 'no banned phrases', span: null };
};

// ---------------------------------------------------------------------------
// C14 VOICE_WARN
// ---------------------------------------------------------------------------

/** Singular "yard" not opening one of the accepted compounds. */
export const SINGULAR_YARD_RE =
  /\byard\b(?!\s+(?:network|management|system|state|check|checks|truck|trucks|move|moves|spotting))/i;

const I_OPENER_RE = /^I(?:'(?:ll|m|ve|d))?\b/;

function firstWord(sentence: string): string {
  const m = /^[A-Za-z']+/.exec(stripMarkers(sentence).trim());
  return m ? m[0].toLowerCase() : '';
}

export function voiceWarnings(body: string): Array<{ warning: string; span: CheckSpan | null }> {
  const out: Array<{ warning: string; span: CheckSpan | null }> = [];
  const content = stripGreetingAndSignature(body);

  const yard = SINGULAR_YARD_RE.exec(content);
  if (yard) {
    const start = body.indexOf(yard[0], Math.max(0, body.indexOf(content)));
    out.push({
      warning: `singular "yard" (yards is plural in the network sense): "${yard[0]}"`,
      span: start === -1 ? null : { start, end: start + yard[0].length, text: yard[0] },
    });
  }

  const sentences = splitSentences(content);
  let previous = '';
  for (const sentence of sentences) {
    const word = firstWord(sentence);
    if (word.length > 0 && word === previous) {
      out.push({ warning: `consecutive sentences open with "${word}": "${sentence}"`, span: null });
    }
    previous = word;
    if (I_OPENER_RE.test(stripMarkers(sentence).trim())) {
      out.push({ warning: `sentence opens with "I": "${sentence}"`, span: null });
    }
  }
  return out;
}

export const checkVoiceWarn: Check = (draft) => {
  const warnings = voiceWarnings(draft.body);
  if (warnings.length > 0) {
    return {
      code: C14_CODE,
      passed: false,
      severity: 'review',
      detail: warnings.map((w) => w.warning).join('; '),
      span: warnings[0].span,
    };
  }
  return { code: C14_CODE, passed: true, severity: 'review', detail: 'no voice warnings', span: null };
};
