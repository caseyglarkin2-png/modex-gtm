/**
 * PEOPLE STATE (C10 of the commercial-context audit, 2026-10-08). Pure.
 *
 * Per person, from BOTH sides of the typed timeline (context/thread-context.ts events with their purpose set):
 *   lastInboundAt     the newest message they wrote (a calendar RSVP and an automatic notice are not that)
 *   lastOutboundAt    the newest message we SENT them (a draft is never a send; calendar mail is not a touch)
 *   answerOwed        their newest answerable message (a buyer conversation or a support ask) came after our last send
 *   quiet             no meaningful exchange either way for N days and no accepted meeting ahead; descriptive, never a
 *                     gate: a seller may still write, and the basis says what the days were counted from
 *   nextMeetingAt     an accepted calendar event (either side accepted) or their invitation, in the future, not cancelled
 *   commitments       the outstanding ones (not resolved), attributed to the person whose message they came from
 *   lastConversationAt  knowledge program C1 (2026-10-09): the newest CONVERSATION with them: a held meeting or a call
 *                     (a vault meeting note or a Fireflies capture whose participants include the person, set on the
 *                     event as `conversation` by the caller), or a calendar RSVP they accepted whose meeting has been
 *                     held (its start is past and it was not cancelled). A conversation counts as an exchange: quiet
 *                     counts from the latest of the last exchange either way and the last conversation, and an answer
 *                     is not owed after a conversation later than their message (Kenco: a Sep 16 meeting after a
 *                     Sep 16 inbound means no answer owed and not quiet on Sep 20).
 *
 * The audit's two cases: a September 24 inbound answered the same day is not answer owed; an October 1 send and a
 * future accepted meeting prevent a went-quiet claim built on the inbound date alone. work/intel.ts ranks people on
 * this instead of the inbound timestamp alone (the lead wires it).
 */
import type { ContextCommitment, Purpose } from '../context/commercial-context';
import type { CalendarFacts } from '../context/thread-context';
import { dayLabel, nyDay } from './dates';

export interface StateEvent {
  id: string;
  at: string;
  direction: 'inbound' | 'outbound' | 'internal';
  type: string;
  isDraft: boolean;
  from: string | null;
  to: readonly string[];
  purpose: Purpose | null;
  providerIds?: readonly string[];
  calendar?: CalendarFacts | null;
  /**
   * Seller acceptance A4 (2026-10-09): an out-of-office notice of theirs (purpose automated), with the return day it
   * named when it named one. The reader that builds the timeline sets it; the notice text itself is not carried.
   */
  outOfOffice?: { returnDay: string | null } | null;
  /**
   * Knowledge program C1 (2026-10-09): this event IS a conversation held with the person (a meeting note or a Fireflies
   * capture whose participants include them, by the caller's reading of the knowledge notes; `at` is when it was held).
   * The person is read from `from` (inbound) or `to` (outbound) as for any event. The pure function reads it only.
   */
  conversation?: { kind: 'call' | 'meeting'; title: string | null; source: string } | null;
}

export interface PersonCommitment extends ContextCommitment {
  /** The person the commitment is with, when the source said; otherwise found from the message it came from. */
  person?: string | null;
}

export interface PersonState {
  email: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  lastDraftAt: string | null;
  answerOwed: { owed: boolean; since: string | null; messageId: string | null; basis: string };
  quiet: { quiet: boolean; days: number | null; since: string | null; basis: string };
  nextMeetingAt: string | null;
  /** C1: the newest conversation held with them (a meeting or a call), or null when none is on record. */
  lastConversationAt: string | null;
  commitments: PersonCommitment[];
  /**
   * A4: their newest out-of-office notice, as availability: the day they said they would be back (null when the notice
   * named none) and the basis in words. Descriptive only, never a gate and never an obligation (Casey, 2026-10-09: an
   * expired out-of-office notice is availability information, not evidence of buying intent).
   */
  availability?: { returnedOn: string | null; basis: string };
}

export interface PeopleStateOptions {
  /** Days without a meaningful exchange either way before "quiet" is said. Default 14. */
  quietDays?: number;
  ownAddresses?: ReadonlySet<string>;
  commitments?: readonly PersonCommitment[];
  resolvedCommitmentIds?: ReadonlySet<string>;
}

export const QUIET_DAYS = 14;
const DAY_MS = 86_400_000;

/** A message of theirs that asks for an answer. */
const ANSWERABLE: ReadonlySet<Purpose> = new Set(['buyer_conversation', 'customer_support']);
/** A message of theirs that counts as them talking to us (a person, not a machine and not a calendar). */
const MEANINGFUL_INBOUND: ReadonlySet<Purpose> = new Set(['buyer_conversation', 'customer_support', 'partner_referral', 'unknown']);

const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const short = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

function newest(a: string | null, b: string): string {
  return a === null || b > a ? b : a;
}

/** The future meeting a person's calendar mail settles: accepted by either side or invited by them, not cancelled since. */
function nextMeeting(events: readonly StateEvent[], now: Date): string | null {
  const cancelled = new Map<string, string>();
  for (const e of events) if (e.calendar?.kind === 'cancelled') cancelled.set(e.calendar.meetingKey, newest(cancelled.get(e.calendar.meetingKey) ?? null, e.at));
  const candidates = events
    .filter((e) => e.calendar?.startsAt && new Date(e.calendar.startsAt).getTime() > now.getTime())
    .filter((e) => e.calendar!.kind === 'accepted' || (e.direction === 'inbound' && (e.calendar!.kind === 'invitation' || e.calendar!.kind === 'update')))
    .filter((e) => !(cancelled.get(e.calendar!.meetingKey) && (cancelled.get(e.calendar!.meetingKey) as string) > e.at))
    .map((e) => e.calendar!.startsAt as string)
    .sort();
  return candidates[0] ?? null;
}

/** C1: the meetings a person accepted that have been held (started before `now`, not cancelled since the acceptance), newest first. */
function heldMeetings(events: readonly StateEvent[], now: Date): string[] {
  const cancelled = new Map<string, string>();
  for (const e of events) if (e.calendar?.kind === 'cancelled') cancelled.set(e.calendar.meetingKey, newest(cancelled.get(e.calendar.meetingKey) ?? null, e.at));
  return events
    .filter((e) => e.direction === 'inbound' && e.calendar?.kind === 'accepted' && !!e.calendar.startsAt && new Date(e.calendar.startsAt).getTime() <= now.getTime())
    .filter((e) => !(cancelled.get(e.calendar!.meetingKey) && (cancelled.get(e.calendar!.meetingKey) as string) > e.at))
    .map((e) => e.calendar!.startsAt as string)
    .sort()
    .reverse();
}

export function peopleState(timeline: readonly StateEvent[], now: Date, opts: PeopleStateOptions = {}): Map<string, PersonState> {
  const own = new Set([...(opts.ownAddresses ?? [])].map(lower));
  const quietDays = opts.quietDays ?? QUIET_DAYS;
  const byPerson = new Map<string, StateEvent[]>();
  for (const e of timeline) {
    if (e.direction === 'internal') continue;
    const people = e.direction === 'inbound' ? [lower(e.from)] : e.to.map(lower);
    for (const p of people) {
      if (!p || own.has(p)) continue;
      byPerson.set(p, [...(byPerson.get(p) ?? []), e]);
    }
  }
  const resolved = opts.resolvedCommitmentIds ?? new Set<string>();
  const outstanding = (opts.commitments ?? []).filter((c) => !resolved.has(c.id));

  const out = new Map<string, PersonState>();
  for (const [email, events] of byPerson) {
    let lastInboundAt: string | null = null;
    let lastOutboundAt: string | null = null;
    let lastDraftAt: string | null = null;
    let lastMeaningfulInbound: string | null = null;
    let newestAnswerable: StateEvent | null = null;
    let notice: StateEvent | null = null;
    // C1: a conversation held (a meeting note, a Fireflies capture) is read off the event whatever its direction.
    let lastConversation: { at: string; kind: 'call' | 'meeting' } | null = null;
    for (const e of events) {
      if (e.conversation && (!lastConversation || e.at > lastConversation.at)) lastConversation = { at: e.at, kind: e.conversation.kind };
    }
    const heldAt = heldMeetings(events, now)[0] ?? null;
    if (heldAt && (!lastConversation || heldAt > lastConversation.at)) lastConversation = { at: heldAt, kind: 'meeting' };
    const lastConversationAt = lastConversation?.at ?? null;
    for (const e of events) {
      const purpose = e.purpose ?? 'unknown';
      if (e.conversation) continue;
      if (e.direction === 'outbound') {
        if (e.isDraft || e.type === 'draft') lastDraftAt = newest(lastDraftAt, e.at);
        else if (e.type !== 'calendar') lastOutboundAt = newest(lastOutboundAt, e.at);
        continue;
      }
      // A4: an out-of-office notice is read for availability and nothing else (it is not them writing).
      if (purpose === 'automated' && e.outOfOffice && (!notice || e.at > notice.at)) notice = e;
      if (e.type === 'calendar' || purpose === 'calendar' || purpose === 'automated') continue;
      lastInboundAt = newest(lastInboundAt, e.at);
      if (MEANINGFUL_INBOUND.has(purpose)) lastMeaningfulInbound = newest(lastMeaningfulInbound, e.at);
      if (ANSWERABLE.has(purpose) && (!newestAnswerable || e.at > newestAnswerable.at)) newestAnswerable = e;
    }

    const sentAfter = !!newestAnswerable && lastOutboundAt !== null && lastOutboundAt >= newestAnswerable.at;
    // C1: a conversation later than their message answers it (a meeting held after they wrote is the answer).
    const talkedAfter = !!newestAnswerable && !!lastConversation && lastConversation.at > newestAnswerable.at;
    const owed = !!newestAnswerable && !sentAfter && !talkedAfter;
    const answerOwed = newestAnswerable
      ? owed
        ? { owed: true, since: newestAnswerable.at, messageId: newestAnswerable.id, basis: `they wrote ${short(newestAnswerable.at)}${lastOutboundAt ? `; our last send was ${short(lastOutboundAt)}, before it` : '; nothing sent since'}` }
        : sentAfter
          ? { owed: false, since: null, messageId: null, basis: `they wrote ${short(newestAnswerable.at)} and we sent ${short(lastOutboundAt as string)} after it` }
          : { owed: false, since: null, messageId: null, basis: `they wrote ${short(newestAnswerable.at)} and ${lastConversation!.kind === 'call' ? 'we talked' : 'we met'} ${short(lastConversation!.at)} after it` }
      : { owed: false, since: null, messageId: null, basis: lastInboundAt ? 'nothing of theirs asks for an answer' : 'they have not written' };

    const nextMeetingAt = nextMeeting(events, now);
    // C1: the last exchange is the latest of their message, our send and a conversation held.
    const lastExchange = [lastMeaningfulInbound, lastOutboundAt, lastConversationAt].filter((x): x is string => !!x).sort().at(-1) ?? null;
    let quiet: PersonState['quiet'];
    if (!lastExchange) quiet = { quiet: false, days: null, since: null, basis: 'no exchange on record either way' };
    else {
      const days = Math.floor((now.getTime() - new Date(lastExchange).getTime()) / DAY_MS);
      const who = lastExchange === lastConversationAt ? (lastConversation!.kind === 'call' ? 'a call' : 'a meeting') : lastExchange === lastOutboundAt ? 'we wrote' : 'they wrote';
      if (nextMeetingAt) quiet = { quiet: false, days, since: lastExchange, basis: `last exchange ${short(lastExchange)} (${who}); a meeting is ahead on ${short(nextMeetingAt)}` };
      else if (days >= quietDays) quiet = { quiet: true, days, since: lastExchange, basis: `no exchange either way in ${days} days (last: ${short(lastExchange)}, ${who})` };
      else quiet = { quiet: false, days, since: lastExchange, basis: `last exchange ${short(lastExchange)} (${who}), ${days} days ago` };
    }

    const ids = new Set(events.flatMap((e) => [e.id, ...(e.providerIds ?? [])]));
    const commitments = outstanding.filter((c) => (c.person ? lower(c.person) === email : ids.has(c.sourceId)));

    let availability: PersonState['availability'];
    if (notice) {
      const returnedOn = notice.outOfOffice?.returnDay ?? null;
      const wroteSince = lastMeaningfulInbound && lastMeaningfulInbound > notice.at ? `; they wrote since (${short(lastMeaningfulInbound)})` : '; no message from them since';
      const today = nyDay(now);
      const back = !returnedOn ? 'no return day named' : returnedOn === today ? 'back today' : returnedOn < today ? `back since ${dayLabel(returnedOn, now)}` : `out until ${dayLabel(returnedOn, now)}`;
      availability = { returnedOn, basis: `their out-of-office notice of ${short(notice.at)}: ${back}${wroteSince}` };
    }

    out.set(email, { email, lastInboundAt, lastOutboundAt, lastDraftAt, answerOwed, quiet, nextMeetingAt, lastConversationAt, commitments, ...(availability ? { availability } : {}) });
  }
  return out;
}
