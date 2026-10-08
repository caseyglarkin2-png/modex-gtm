/**
 * WHAT A REPLY MEANS, as Capture carries it (R60, capture once on a reply, 2026-10-07). Pure and client-safe.
 *
 * A reply is recorded ONCE, in Capture: the buyer's words (candidate statements, each confirmed or rejected) and what
 * the reply means (the disposition class) are reviewed together and confirmed in one pass. The disposition service
 * and the BID human confirmation still do the writes; Capture only carries them. These are the classes a written
 * reply can carry (the call-only classes never apply), each in the seller's words.
 *
 * GAP proposes a class only where the message itself says it (an opt-out, an automatic reply, a failed address, a
 * named referral). A plain reply proposes nothing: the seller chooses. A stored model suggestion is shown as a hint,
 * labeled, and never chosen for them (the disposition form's own rule).
 */
import type { ResponseClass } from '../taxonomy';

export const REPLY_KIND_ITEM = 'reply' as const;

export const REPLY_KIND_CLASSES = [
  'problem_confirmed',
  'problem_partially_confirmed',
  'problem_rejected',
  'request_information',
  'meeting_accepted',
  'meeting_declined',
  'referral',
  'wrong_person',
  'timing',
  'not_priority',
  'existing_solution',
  'do_not_contact',
  'out_of_office',
  'bounce',
  'no_signal',
] as const satisfies readonly ResponseClass[];
export type ReplyKindClass = (typeof REPLY_KIND_CLASSES)[number];

export const REPLY_KIND_WORDS: Record<ReplyKindClass, string> = {
  problem_confirmed: 'They confirmed the problem',
  problem_partially_confirmed: 'They partly confirmed the problem',
  problem_rejected: 'They said it is not their problem',
  request_information: 'They asked for something',
  meeting_accepted: 'They agreed to meet',
  meeting_declined: 'They declined to meet',
  referral: 'They named someone else',
  wrong_person: 'Wrong person',
  timing: 'Not now: come back later',
  not_priority: 'Not a priority for them',
  existing_solution: 'They already have something for it',
  do_not_contact: 'Do not contact them again',
  out_of_office: 'An automatic reply',
  bounce: 'The address failed',
  no_signal: 'Nothing to act on',
};

/** Classes that need the buyer's own words (the first statement kept in the same review carries them). */
export const REPLY_KIND_NEEDS_WORDS: readonly ReplyKindClass[] = ['problem_confirmed', 'problem_partially_confirmed', 'existing_solution'];

export const isReplyKindClass = (v: unknown): v is ReplyKindClass => typeof v === 'string' && (REPLY_KIND_CLASSES as readonly string[]).includes(v);

/** The class the message itself states (replies/classify.ts read it), or null when the seller must choose. */
export function proposedReplyKind(c: { kind: 'human' | 'opt_out' | 'out_of_office' | 'bounce'; human: 'reply' | 'referral' | 'objection' | null }): ReplyKindClass | null {
  if (c.kind === 'opt_out') return 'do_not_contact';
  if (c.kind === 'out_of_office') return 'out_of_office';
  if (c.kind === 'bounce') return 'bounce';
  if (c.human === 'referral') return 'referral';
  return null;
}
