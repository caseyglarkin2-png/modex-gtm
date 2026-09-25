/**
 * Call pack (Seller Action Center, dogfood fix, 2026-09-25).
 *
 * A tiny, deterministic call script built from the SAME hypothesis fields
 * the email copy comes from -- no second copy-generation system, no new
 * evidence, just a different rendering of the observation/hypothesis/
 * falsification question already on the hypothesis row. Pure: no Prisma, no
 * fetch, no LLM call.
 */

export interface CallPackInput {
  firstName: string;
  senderFirstName: string;
  accountName: string;
  /** The hypothesis observation, WITHOUT its [S:id] citation tokens (strip before calling). */
  observationPlain: string;
  problemHypothesis: string;
  /** hypothesis.falsification_questions[0], if any. */
  diagnosticQuestion: string | null;
}

export interface CallPack {
  opener: string;
  diagnostic1: string;
  diagnostic2: string;
  voicemail: string;
}

/** Strip `[S:id]` citation tokens for a spoken/plain rendering (the compiler-facing text keeps them; this does not need them). */
export function stripObservationCitations(observation: string): string {
  return observation.replace(/\s*\[S:[A-Za-z0-9_-]+\]/g, '').trim();
}

export function buildCallPack(input: CallPackInput): CallPack {
  const opener = `${input.firstName}, ${input.senderFirstName} with YardFlow. You weren't expecting me. Give me 30 seconds and tell me if I'm completely off: ${input.observationPlain}`;
  const diagnostic1 = input.diagnosticQuestion ?? `Is that actually how it plays out at ${input.accountName} today, or am I missing something?`;
  const diagnostic2 = `If that's real, what does it cost you when it happens, in hours or in trucks waiting?`;
  const voicemail = `${input.firstName}, ${input.senderFirstName} with YardFlow. ${input.observationPlain} If that sounds right, call me back, otherwise tell me what I'm missing.`;
  return { opener, diagnostic1, diagnostic2, voicemail };
}
