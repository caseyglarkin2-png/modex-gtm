/**
 * Call pack (Seller Action Center, dogfood fix, 2026-09-25; honest posture,
 * red team T7, 2026-09-26).
 *
 * A tiny, deterministic call script built from the SAME hypothesis fields
 * the email copy comes from: no second copy-generation system, no new
 * evidence. Pure: no Prisma, no fetch, no LLM call.
 *
 * Posture (T7): VERIFIED FACT -> the hypothesis as a QUESTION -> listen.
 *   - the opener carries the one verified fact the hypothesis was approved
 *     on, then asks whether the pattern is real there; it never diagnoses
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
  problemHypothesis: string;
  /** hypothesis.falsification_questions[0], if any. */
  diagnosticQuestion: string | null;
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

export function buildCallPack(input: CallPackInput): CallPack {
  const fact = input.observationPlain.trim();
  const hypothesisQuestion = `When that happens, the yards are often the part that has to catch up. Is that true at ${input.accountName}, or am I off?`;
  const opener = `${input.firstName}, ${input.senderFirstName} with YardFlow. You weren't expecting me, so tell me if this is off. ${fact} ${hypothesisQuestion}`;
  const diagnostic1 = input.diagnosticQuestion ?? `How does that work at ${input.accountName} today?`;
  const impactIfAcknowledged = `If they said it is real: when it happens, what does it cost you, in hours or in trucks waiting?`;
  const voicemail = `${input.firstName}, ${input.senderFirstName} with YardFlow. ${fact} I have one question about how the yards are handling it, not a pitch. Call me back if it is worth two minutes.`;
  return { opener, diagnostic1, impactIfAcknowledged, voicemail };
}
