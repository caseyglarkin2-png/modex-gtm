/**
 * Disposition pure model (GAP Prospecting OS, Sprint 4, S4-T2).
 *
 * What a human-confirmed disposition DOES, as a table over the eighteen
 * response classes in `taxonomy.ts`, plus the lane-key mapping and the input
 * validator the disposition service runs before it writes a row. Nothing here
 * touches Prisma, the clock or the network; the service (S4-T3) reads the
 * effects and applies them in the section 7 order.
 *
 * Two invariants this module owns:
 *   1. An UNCONFIRMED row has no effects, whatever its class (`NO_EFFECTS`).
 *      AI suggestions are stored, never acted on, until a human confirms.
 *   2. Exactly one class writes do-not-contact. `writesDnc` is the only flag
 *      the unsubscribe path keys on, and `do_not_contact` is the only row
 *      that sets it (spec section 7: "the ONLY GAP path that touches
 *      do_not_contact, table-driven invariant across every class").
 *
 * Voice: no em dashes, "yards" plural.
 */

import {
  CHANNELS,
  NON_STOPPING_RESPONSE_CLASSES,
  REPLY_HANDLING_KEYS,
  REPLY_HANDLING_TO_RESPONSE_CLASS,
  RESPONSE_CLASSES,
  isResponseClass,
  type Channel,
  type ReplyHandlingKey,
  type ResponseClass,
  type RoutingAction,
} from '../taxonomy';
import { DISPOSITION_OUTCOMES, type ResolutionOutcome } from '../hypothesis/machine';

// ---------------------------------------------------------------------------
// Effects table
// ---------------------------------------------------------------------------

export interface DispositionEffects {
  /** Unsent steps of the persona's runs stop immediately (`stopRunsForRecipient`, HubSpot stop_pending). */
  stopsRun: boolean;
  /** The hypothesis outcome this class decides, when it is the newest confirmed problem_* row. */
  resolves: ResolutionOutcome | null;
  /** Goes through `recordUnsubscribe` (UnsubscribedEmail + Persona.do_not_contact + hs_email_optout). */
  writesDnc: boolean;
  /** What the router should do with the persona next. `'none'` means nothing is queued. */
  nextAction: RoutingAction | 'none';
  /** The sequence keeps running. Always the complement of `stopsRun`; kept explicit so the table reads as the spec does. */
  keepsSequence: boolean;
  /** Why the row is what it is. Documentation, never read by code. */
  why: string;
}

/** The effects of a row that has not been human-confirmed, or whose class is unknown: nothing. */
export const NO_EFFECTS: Readonly<DispositionEffects> = Object.freeze({
  stopsRun: false,
  resolves: null,
  writesDnc: false,
  nextAction: 'none',
  keepsSequence: true,
  why: 'Unconfirmed or unknown: an AI suggestion is stored, never acted on, until a human confirms it.',
});

const stop = (
  resolves: ResolutionOutcome | null,
  nextAction: RoutingAction | 'none',
  why: string,
): Readonly<DispositionEffects> =>
  Object.freeze({ stopsRun: true, resolves, writesDnc: false, nextAction, keepsSequence: false, why });

const keep = (why: string): Readonly<DispositionEffects> =>
  Object.freeze({
    stopsRun: false,
    resolves: null,
    writesDnc: false,
    nextAction: 'none',
    keepsSequence: true,
    why,
  });

/**
 * One row per response class, in `RESPONSE_CLASSES` order. Spec section 7:
 * every class stops the run except no_answer, voicemail, gatekeeper and
 * out_of_office; only the three problem_* classes resolve; only
 * do_not_contact writes DNC.
 */
export const DISPOSITION_EFFECTS: Readonly<Record<ResponseClass, Readonly<DispositionEffects>>> = Object.freeze({
  problem_confirmed: stop(
    'confirmed',
    'call_now',
    'The buyer confirmed the problem in their words. The sequence has done its job; the seller calls while it is warm.',
  ),
  problem_partially_confirmed: stop(
    'partially_confirmed',
    'call_now',
    'Part of the hypothesis held. Stop the scripted touches and have the conversation that finds which part.',
  ),
  problem_rejected: stop(
    'rejected',
    'nurture',
    'A substantive no. The hypothesis resolves rejected; the account stays on a slow nurture, never re-pitched on the same guess.',
  ),
  wrong_person: stop(
    null,
    'research_required',
    'Right account, wrong desk. Stop mailing this person; research who owns the yards and re-target the hypothesis.',
  ),
  referral: stop(
    null,
    'research_required',
    'They named someone. Stop this run and research the referred person before any touch; the referral is a lead event, not an enrollment.',
  ),
  not_priority: stop(
    null,
    'nurture',
    'Real, but not on their list. Park on nurture with no fixed resume date.',
  ),
  timing: stop(
    null,
    'nurture',
    'Not now, with a when. Park on nurture and resume at the date the buyer gave (resumeAt from the disposition metadata).',
  ),
  existing_solution: stop(
    null,
    'nurture',
    'They run a YMS or a 3PL runs the yards. Record the objection, stop, and nurture; the next touch needs a different hypothesis.',
  ),
  request_information: stop(
    null,
    'one_off_email',
    'They asked for something specific. Stop the sequence and answer by hand, once.',
  ),
  meeting_accepted: stop(
    null,
    'none',
    'A meeting is on the calendar. Nothing to route; the meeting is the next step and its disposition comes later.',
  ),
  meeting_declined: stop(
    null,
    'nurture',
    'They declined the meeting without rejecting the problem. Stop and nurture.',
  ),
  do_not_contact: Object.freeze({
    stopsRun: true,
    resolves: null,
    writesDnc: true,
    nextAction: 'do_not_contact',
    keepsSequence: false,
    why: 'Opt-out. The ONLY class that writes do_not_contact, through recordUnsubscribe, so clawd and the Top100 lane stop too.',
  }),
  bounce: stop(
    null,
    'none',
    'The address is dead. Stop the run (bounced); nothing to route until a new address is found by ordinary enrichment.',
  ),
  out_of_office: keep(
    'An autoresponder. No engagement inferred; the sequence keeps running on its own schedule.',
  ),
  no_signal: stop(
    null,
    'one_off_email',
    'A reply with nothing in it ("Received."). They replied, so the run stops; a human writes back once to earn a real signal.',
  ),
  no_answer: keep('Call-only. Nobody picked up; the sequence keeps running.'),
  voicemail: keep('Call-only. Left a voicemail; the sequence keeps running.'),
  gatekeeper: keep('Call-only. Reached a gatekeeper, not the persona; the sequence keeps running.'),
});

/** Classes a disposition may carry only when the channel is `call`. */
export const CALL_ONLY_RESPONSE_CLASSES = ['no_answer', 'voicemail', 'gatekeeper'] as const satisfies readonly ResponseClass[];

/** The three classes that resolve a hypothesis. Derived from the machine's map so the two cannot drift. */
export const RESOLVING_RESPONSE_CLASSES = RESPONSE_CLASSES.filter(
  (c): c is ResponseClass => c in DISPOSITION_OUTCOMES,
);

/** Classes that carry a buyer quote by definition: a confirmation must quote the buyer. */
export const QUOTE_REQUIRED_RESPONSE_CLASSES = ['problem_confirmed', 'problem_partially_confirmed'] as const satisfies readonly ResponseClass[];

/** Classes that name what the buyer already has; the objection field is mandatory. */
export const OBJECTION_REQUIRED_RESPONSE_CLASSES = ['existing_solution'] as const satisfies readonly ResponseClass[];

export function isCallOnlyClass(value: string): value is (typeof CALL_ONLY_RESPONSE_CLASSES)[number] {
  return (CALL_ONLY_RESPONSE_CLASSES as readonly string[]).includes(value);
}

export function isResolvingClass(value: string): boolean {
  return value in DISPOSITION_OUTCOMES;
}

export function isNonStoppingClass(value: string): boolean {
  return (NON_STOPPING_RESPONSE_CLASSES as readonly string[]).includes(value);
}

/**
 * Effects for a stored row. A row that is not human-confirmed has none,
 * whatever its class. An unknown class (a row written before a taxonomy
 * change, or a corrupted one) also has none: fail closed.
 */
export function dispositionEffects(row: { responseClass: string; humanConfirmed: boolean }): Readonly<DispositionEffects> {
  if (!row.humanConfirmed) return NO_EFFECTS;
  if (!isResponseClass(row.responseClass)) return NO_EFFECTS;
  return DISPOSITION_EFFECTS[row.responseClass];
}

// ---------------------------------------------------------------------------
// Lane key map
// ---------------------------------------------------------------------------

export interface LaneKeyMapping {
  /** The classes this lane bucket can become. More than one means the human picks. */
  classes: readonly ResponseClass[];
  /** True when the bucket fans out to more than one class. */
  humanPicks: boolean;
  /** A canned objection the form pre-fills; the human may edit it. Only the existing_solution buckets carry one. */
  objection: string | null;
}

/**
 * The Top100 lane's ten `reply_handling` keys to response classes, on top of
 * the taxonomy's `REPLY_HANDLING_TO_RESPONSE_CLASS` (a parity test pins the
 * class lists equal). Section 7: positive_interest is problem_confirmed or
 * request_information and the human picks; already_have_yms and 3pl_runs_it
 * are existing_solution with an objection; not_now is timing or not_priority;
 * out_of_office infers no engagement; the rest map one to one.
 */
function laneKeyMapping(key: ReplyHandlingKey): Readonly<LaneKeyMapping> {
  const classes = REPLY_HANDLING_TO_RESPONSE_CLASS[key];
  const objection =
    key === 'already_have_yms'
      ? 'Already runs a yard management system'
      : key === '3pl_runs_it'
        ? 'A 3PL runs the yards'
        : null;
  return Object.freeze({ classes, humanPicks: classes.length > 1, objection });
}

export const LANE_KEY_MAP: Readonly<Record<ReplyHandlingKey, Readonly<LaneKeyMapping>>> = Object.freeze(
  REPLY_HANDLING_KEYS.reduce(
    (map, key) => {
      map[key] = laneKeyMapping(key);
      return map;
    },
    {} as Record<ReplyHandlingKey, Readonly<LaneKeyMapping>>,
  ),
);

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface DispositionInput {
  contactEmail: string;
  channel: string;
  responseClass: string;
  rootCauseClass?: string | null;
  impactClass?: string | null;
  objection?: string | null;
  buyerLanguage?: string | null;
}

/** The input after validation: the email lowercased and trimmed, the optional strings trimmed or null. */
export interface ValidDisposition {
  contactEmail: string;
  channel: Channel;
  responseClass: ResponseClass;
  rootCauseClass: string | null;
  impactClass: string | null;
  objection: string | null;
  buyerLanguage: string | null;
}

export type DispositionValidation =
  | { ok: true; value: ValidDisposition }
  | { ok: false; field: keyof DispositionInput; reason: DispositionRefusal };

export type DispositionRefusal =
  | 'unknown_response_class'
  | 'unknown_channel'
  | 'call_only_class'
  | 'empty_contact_email'
  | 'invalid_contact_email'
  | 'requires_problem_class'
  | 'quote_required'
  | 'objection_required';

function trimmedOrNull(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/**
 * Validate a disposition against the taxonomy. Refusals name the field so the
 * route can answer 400 `{ error: 'invalid_body', field }`. The email comes
 * back lowercased and trimmed (the column is ALWAYS lowercased on write).
 * Root cause and impact classes are free text here: the taxonomy carries no
 * closed list for them, so the rule is only that they accompany a problem_*
 * class. A confirmation (full or partial) must quote the buyer.
 */
export function validateDisposition(input: DispositionInput): DispositionValidation {
  const responseClass = input.responseClass;
  if (!isResponseClass(responseClass)) {
    return { ok: false, field: 'responseClass', reason: 'unknown_response_class' };
  }
  if (!(CHANNELS as readonly string[]).includes(input.channel)) {
    return { ok: false, field: 'channel', reason: 'unknown_channel' };
  }
  const channel = input.channel as Channel;
  if (isCallOnlyClass(responseClass) && channel !== 'call') {
    return { ok: false, field: 'responseClass', reason: 'call_only_class' };
  }

  const contactEmail = typeof input.contactEmail === 'string' ? input.contactEmail.trim().toLowerCase() : '';
  if (contactEmail.length === 0) return { ok: false, field: 'contactEmail', reason: 'empty_contact_email' };
  if (!contactEmail.includes('@') || contactEmail.startsWith('@') || contactEmail.endsWith('@')) {
    return { ok: false, field: 'contactEmail', reason: 'invalid_contact_email' };
  }

  const rootCauseClass = trimmedOrNull(input.rootCauseClass);
  const impactClass = trimmedOrNull(input.impactClass);
  if (!isResolvingClass(responseClass)) {
    if (rootCauseClass !== null) return { ok: false, field: 'rootCauseClass', reason: 'requires_problem_class' };
    if (impactClass !== null) return { ok: false, field: 'impactClass', reason: 'requires_problem_class' };
  }

  const buyerLanguage = trimmedOrNull(input.buyerLanguage);
  if ((QUOTE_REQUIRED_RESPONSE_CLASSES as readonly string[]).includes(responseClass) && buyerLanguage === null) {
    return { ok: false, field: 'buyerLanguage', reason: 'quote_required' };
  }

  const objection = trimmedOrNull(input.objection);
  if ((OBJECTION_REQUIRED_RESPONSE_CLASSES as readonly string[]).includes(responseClass) && objection === null) {
    return { ok: false, field: 'objection', reason: 'objection_required' };
  }

  return {
    ok: true,
    value: { contactEmail, channel, responseClass, rootCauseClass, impactClass, objection, buyerLanguage },
  };
}
