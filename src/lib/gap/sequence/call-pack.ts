/**
 * Call pack (Seller Action Center, dogfood fix, 2026-09-25; honest posture,
 * red team T7, 2026-09-26; the approved hypothesis, execution acceptance 2026-10-01).
 *
 * A tiny, deterministic call script built from the SAME hypothesis fields
 * the email copy comes from: no second copy-generation system, no new
 * evidence, no new hypothesis. Pure: no Prisma, no fetch, no LLM call.
 *
 * Posture (T7): VERIFIED FACT -> the APPROVED hypothesis as a guess and a QUESTION -> listen.
 *   - the opener carries the one verified fact the hypothesis was approved
 *     on, then says the hypothesis as "my guess", then asks; it never diagnoses
 *     and never swaps in a stock line (the old "the yards are often the part
 *     that has to catch up" was the same sentence for every account)
 *   - the question fits the person: relevance for an executive, what they see
 *     day to day for a front-line operator
 *   - the business-impact / cost question exists only for AFTER the buyer
 *     has said the problem is real (`impactIfAcknowledged`); it is never part
 *     of the opener or the voicemail
 *   - the caller only builds a pack for a hypothesis that passed the
 *     evidence gate (research/evidence-gate.ts); a keyword hit is never read
 *     aloud as if it were a fact
 */

export interface CallPackInput {
  firstName: string;
  senderFirstName: string;
  accountName: string;
  /** The hypothesis observation (its verified fact), WITHOUT [S:id] tokens. */
  observationPlain: string;
  /** The approved problem hypothesis, as written ("My guess is that ..."). */
  problemHypothesis: string;
  /** hypothesis.falsification_questions[0], if any. */
  diagnosticQuestion: string | null;
  /** The person's title, so the question is one they can answer. */
  title?: string | null;
}

export interface CallPack {
  /** Fact, then the hypothesis as a question. */
  opener: string;
  /** Current state: how it works there today. */
  diagnostic1: string;
  /** ONLY after the buyer acknowledges the problem: what it costs. */
  impactIfAcknowledged: string;
  voicemail: string;
}

/** Strip `[S:id]` citation tokens for a spoken/plain rendering (the compiler-facing text keeps them; this does not need them). */
export function stripObservationCitations(observation: string): string {
  return observation.replace(/\s*\[S:[A-Za-z0-9_-]+\]/g, '').trim();
}

/** A question that asks for a cost, a count or a size: the impact question, never the current-state one. */
export const QUANTIFYING = /\b(cost|costs|costing|spend|how many|how much|how long|how often|dollars?|hours?|minutes?|percent|per (day|week|month|year))\b|[$%]/i;

const EXECUTIVE = /\b(chief|cxo|ceo|coo|cso|csco|president|svp|evp|vice president|vp|head of)\b/i;
const FRONT_LINE = /\b(supervisor|coordinator|specialist|analyst|associate|lead|clerk|planner|dispatcher|operator|foreman)\b/i;

/** The approved hypothesis spoken: "My guess is that ...", read from the email side ("above" dropped). */
function spokenHypothesis(problem: string): string | null {
  const core = problem
    .trim()
    .replace(/^my guess is (that )?/i, '')
    .replace(/\s+above\b/gi, '')
    .replace(/[.\s]+$/, '');
  if (!core) return null;
  return `My guess is that ${core.charAt(0).toLowerCase()}${core.slice(1)}.`;
}

function question(title: string | null | undefined): string {
  const t = title ?? '';
  if (EXECUTIVE.test(t)) return 'Is that on your radar at all, or am I off?';
  if (FRONT_LINE.test(t)) return 'Is that something you see day to day, or am I off?';
  return 'Is that actually an issue for you, or am I off?';
}

export function buildCallPack(input: CallPackInput): CallPack {
  const fact = input.observationPlain.trim();
  const guess = spokenHypothesis(input.problemHypothesis);
  // No approved hypothesis text: ask whether the fact changes anything; never invent a problem in the call layer.
  const hypothesisQuestion = guess ? `${guess} ${question(input.title)}` : 'Is that changing anything for your team, or am I off?';
  const opener = `${input.firstName}, ${input.senderFirstName} with YardFlow. You weren't expecting me, so tell me if this is off. ${fact} ${hypothesisQuestion}`;
  // Release C review SF3: the current-state question asks how it works today.
  // A cost or quantification question is the impact question, which waits
  // until the buyer has said the problem is real.
  const diagnostic = input.diagnosticQuestion?.trim();
  const diagnostic1 = diagnostic && !QUANTIFYING.test(diagnostic) ? diagnostic : `How does that work at ${input.accountName} today?`;
  const impactIfAcknowledged = `If they said it is real: when it happens, what does it cost you, in hours or in trucks waiting?`;
  // The voicemail says the fact and why there is a question; it diagnoses nothing.
  const voicemail = `${input.firstName}, ${input.senderFirstName} with YardFlow. ${fact} I have one question about whether that is changing anything for your team, not a pitch. Call me back if it is worth two minutes.`;
  return { opener, diagnostic1, impactIfAcknowledged, voicemail };
}
