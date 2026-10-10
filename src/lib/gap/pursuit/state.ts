/**
 * PURSUIT STATE (account-first UX, UX-03, 2026-10-05): ONE read per account that every seller surface renders from.
 *
 * Why: on 2026-10-05 the cockpit, the Ready lane, NOW and the action pack each computed their own account state, and
 * disagreed on the accounts that mattered: Walmart NOW said "Ready for a first touch" while the cockpit was paused on a
 * reply whose body was "stop"; FedEx NOW named a CFO on a June out-of-office while Casey had chosen Glen Chaffee that
 * afternoon; PepsiCo NOW named Karen while the pack drafted to Shawn. This projection is the one place that decides:
 *
 *   state            replied | opted_out | in_deal | held | follow_up_due | in_motion | ready | choose_person | research | idle
 *   person           the newest audited human choice (motion choice or an active hypothesis's assigned person), else
 *                    the resolver's single eligible person, else null (CHOOSE PERSON names nobody)
 *   blocker          one sentence on what stops a cold touch right now, or null
 *   unlock           what moves the account to the next state
 *   coldTouchAllowed never true under a reply, a deal, a hold or unknown opportunity truth
 *
 * Replies are classified BEFORE they rank (replies/classify.ts): only a human reply makes the account REPLIED; an
 * opt-out is OPTED OUT; an out-of-office or a bounce never reads as a conversation. Priority is fixed and never
 * re-ordered by a surface: reply > deal / hold > follow up > in motion > ready > choose > research. Pure: the loader
 * (pursuit/load.ts) gathers; this only decides. Pinned by tests/unit/gap/pursuit-state.test.ts.
 *
 * The walk fix (Casey, 2026-10-10, "yes, change the command. optimize!"): a human reply WE ANSWERED is not a waiting
 * reply. Casey answered Craig Morrison (Kenco) six minutes after his Sep 24 reply, from Gmail, and the account said
 * "Someone replied" every day after. A reply is answered when one of our sends (`sends`: the story's touches, account
 * history, GAP first touches, Gmail Sent, HubSpot outgoing email) went to that address, or into its thread, after it
 * (answerOf). An answered reply never makes the account REPLIED; it is carried as `answered` (Work drops its card) and on
 * `lastInbound.answeredAt` (the story says "they wrote; we answered" once). An opt-out is never answered: it stays an
 * opt-out until it is recorded. Pinned by tests/unit/gap/walk-answered-reply.test.ts.
 */
import { cutWords } from '../story/touches';
import { classifyReply, type ReplyClass } from '../replies/classify';
import type { MotionType } from '../account-intel/build';
import { identityHold, unknownReasonWords, unknownUnlock } from '../opportunity/unknown-words';

export type PursuitStateKind = 'replied' | 'opted_out' | 'in_deal' | 'held' | 'follow_up_due' | 'in_motion' | 'ready' | 'choose_person' | 'research' | 'idle';

export interface PursuitPerson {
  key: string;
  personaId: number | null;
  hubspotContactId?: string | null;
  name: string;
  title: string | null;
  /** "you, Oct 5" when a human chose; null when GAP names the only eligible person or the motion's person. */
  chosenBy: string | null;
}

export interface PursuitReply {
  from: string;
  name: string | null;
  at: string;
  subject: string | null;
  snippet: string;
  /** A human recorded the disposition already. */
  triaged: boolean;
  /** C6: how the message reached the account when it came from the placed inbound read (null: the reply list or the history). */
  placedVia?: 'thread' | 'persona' | 'crm_contact' | 'alias' | 'domain' | 'family_deal' | null;
  /** The walk fix: the inbound message id, when the reader knows it (the reply list, the placed inbound read). */
  id?: string | null;
  /** The walk fix: the Gmail thread the message is in, when known (a send of ours in it after the message answers it). */
  threadId?: string | null;
}

/** The walk fix: one send of ours (the story's touches): to whom, when, from which record, and its thread when known. */
export interface OurSend {
  to: string;
  at: string;
  source: string;
  threadId?: string | null;
}

/**
 * The walk fix (2026-10-10): the send of ours that answered a reply: the EARLIEST send after the reply's time that went
 * to the reply's address, or into the reply's own thread. Null when none did, when the reply carries no address and
 * no thread (a name alone never matches), or when a time cannot be read.
 */
export function answerOf(reply: { from: string; at: string; threadId?: string | null }, sends: readonly OurSend[] | null | undefined): OurSend | null {
  if (!sends?.length) return null;
  const from = reply.from.trim().toLowerCase();
  const address = from.includes('@') ? from : null;
  const thread = reply.threadId?.trim() || null;
  if (!address && !thread) return null;
  const t = new Date(reply.at).getTime();
  if (!Number.isFinite(t)) return null;
  let best: { s: OurSend; at: number } | null = null;
  for (const s of sends) {
    const at = new Date(s.at).getTime();
    if (!Number.isFinite(at) || at <= t) continue;
    const sameAddress = !!address && s.to.trim().toLowerCase() === address;
    const sameThread = !!thread && !!s.threadId && s.threadId === thread;
    if (!sameAddress && !sameThread) continue;
    if (!best || at < best.at) best = { s, at };
  }
  return best?.s ?? null;
}

export interface PursuitInput {
  accountName: string;
  now: Date;
  /** The brief's motion type (account-intel/build.ts). */
  motionType: MotionType;
  opportunity: { status: 'CLEAR' | 'OPEN' | 'UNKNOWN' | string; detail: string; deals: Array<{ name: string | null; stage: string | null }>; closure?: { kind: 'customer' | 'parked'; why: string } | null };
  restriction: { kind: string; introducer: string; route: string } | null;
  familyHold: { detail: string } | null;
  /** The cockpit's account motion for this account, when one exists (motion/account-motion.ts). */
  motion: { state: string; primary: { personaId: number; name: string; title: string | null } | null; next: { personaId: number; name: string; title: string | null; unlock: string } | null; headline: string } | null;
  /** The newest recorded motion choice (account.motion audit row). */
  choice: { personaId: number; by: string; at: string; source: 'motion' | 'owner_resolution' } | null;
  /** The newest active hypothesis whose person a human assigned (hypothesis.persona_assigned / activate rows). */
  activePersona: { personaId: number; at: string; by: string } | null;
  /** Replies at the account, newest first, with their triage state. */
  replies: PursuitReply[];
  lastOutbound: { to: string; at: string; what: string; source: string } | null;
  /** The walk fix: our sends at the account (the story's touches), so a reply we answered is not waiting. Absent: none read. */
  sends?: readonly OurSend[] | null;
  outstandingDraft: { recipient: string; name: string | null; decisionId: string } | null;
  followUpDue: { personaId: number | null; name: string; dueAt: string; cardHref: string } | null;
  /** The resolver's eligible people for the cold first touch, in its order. */
  eligible: Array<{ key: string; personaId: number | null; hubspotContactId?: string | null; name: string; title: string | null }>;
  /** A relationship-led motion's person (met at an event, an introducer, a referral), from the brief's motion. */
  relationship?: { name: string; title: string | null; why: string } | null;
  /** The brief's own next-action sentence, used when the angle, not the person, is what blocks (research). */
  briefNext?: string | null;
}

export interface PursuitState {
  accountName: string;
  state: PursuitStateKind;
  /** The seller line: "Ready for a first touch", "Someone replied", "Opted out", "In a deal", ... */
  stateLine: string;
  person: PursuitPerson | null;
  blocker: string | null;
  unlock: string | null;
  coldTouchAllowed: boolean;
  /** May the seller choose or re-order people right now (never under a reply, an opt-out, a deal or a hold)? */
  chooseAllowed: boolean;
  replyClass: ReplyClass | null;
  lastInbound: { who: string; at: string; kind: ReplyClass['kind']; label: string; /** The reply's first words (for the story's between-us row). */ snippet: string; /** R63-A B4: the address it came from (the story names its sender by it). */ from?: string; /** C6: the identity path that placed the sender here, when the message came from the placed read. */ placedVia?: PursuitReply['placedVia']; /** The walk fix: the message id, when known. */ id?: string | null; /** The walk fix: when we answered it (a human reply only), else absent. */ answeredAt?: string | null } | null;
  /** The walk fix: the human replies at the account we answered (a send of ours after each), for Work to drop their cards. */
  answered?: Array<{ from: string; at: string; answeredAt: string; source: string; id?: string | null }>;
  lastOutbound: PursuitInput['lastOutbound'];
  chosenMissing: string | null;
  /** The next person after the chosen one, when the motion names one, with what unlocks them. */
  next: { name: string; title: string | null; unlock: string } | null;
  followUp: PursuitInput['followUpDue'];
  deals: PursuitInput['opportunity']['deals'];
}

/**
 * A relationship is real when you met them, were introduced or referred (a conference, an event, a meeting, a call, a
 * referral, a customer or partner). A newsletter subscriber, a list member, a follower or a page visitor is a signal
 * (contract 5.3), never a relationship that leads the account.
 */
export function isRealRelationship(sourceType: string | null | undefined, source: string | null | undefined): boolean {
  const text = `${sourceType ?? ''} ${source ?? ''}`;
  return /conference|event|meeting|referral|intro|customer|partner|call/i.test(text) && !/newsletter|subscriber|subscription|follower|list\b|visitor|webinar/i.test(text);
}

export const STATE_LINE: Record<PursuitStateKind, string> = {
  replied: 'Someone replied',
  opted_out: 'Opted out',
  in_deal: 'In a deal',
  held: 'Held',
  follow_up_due: 'Follow up due',
  in_motion: 'First touch in motion',
  ready: 'Ready for a first touch',
  choose_person: 'Choose who hears this first',
  research: 'Research: find the operator',
  idle: 'Nothing to do yet',
};

/** R55: the held line for a closed deal, one wording for the workspace and Work (R63-B S12). */
export function closureStateLine(kind: 'customer' | 'parked'): string {
  return kind === 'customer' ? `${STATE_LINE.held}: a customer (closed won)` : `${STATE_LINE.held}: parked after a lost deal`;
}

/**
 * 2026-10-08 (PepsiCo, production): coldTouchAllowed is false under RESEARCH because no thesis is usable YET, and a
 * proposal under review is exactly how one becomes usable. The approve control must not read that as a hold. Only a
 * reply, an opt-out, a deal or a held account stops approval for use, and the hold is the state's own blocker sentence.
 */
export const APPROVAL_HOLD_STATES: ReadonlySet<PursuitStateKind> = new Set(['replied', 'opted_out', 'in_deal', 'held']);
export function approvalHoldFor(state: Pick<PursuitState, 'state' | 'blocker'>): string | null {
  if (!APPROVAL_HOLD_STATES.has(state.state)) return null;
  return state.blocker ?? 'A hold on the account stops approval for use.';
}

const day = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });
const who = (by: string) => (/^casey@|^caseyglarkin/i.test(by) ? 'you' : by.replace(/@.*/, ''));

export function projectPursuitState(i: PursuitInput): PursuitState {
  const newestReply = [...i.replies].sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
  const replyClass = newestReply ? classifyReply({ snippet: newestReply.snippet, subject: newestReply.subject, from: newestReply.from }) : null;
  // The walk fix: a HUMAN reply a send of ours followed (to them, or in their thread) is answered; an opt-out, an
  // automatic notice and a bounce never are.
  const answered: NonNullable<PursuitState['answered']> = [];
  for (const r of i.replies) {
    if (classifyReply({ snippet: r.snippet, subject: r.subject, from: r.from }).kind !== 'human') continue;
    const a = answerOf(r, i.sends);
    if (a) answered.push({ from: r.from, at: r.at, answeredAt: a.at, source: a.source, ...(r.id ? { id: r.id } : {}) });
  }
  const newestAnswer = newestReply && replyClass?.kind === 'human' ? answerOf(newestReply, i.sends) : null;
  const lastInbound = newestReply && replyClass ? { who: newestReply.name ?? newestReply.from, at: newestReply.at, kind: replyClass.kind, label: replyClass.label, snippet: cutWords(newestReply.snippet), from: newestReply.from, ...(newestReply.placedVia ? { placedVia: newestReply.placedVia } : {}), ...(newestReply.id ? { id: newestReply.id } : {}), ...(newestAnswer ? { answeredAt: newestAnswer.at } : {}) } : null;

  // The newest human choice wins; a choice that is no longer eligible is said, never silently dropped.
  const choices = [
    ...(i.choice ? [{ personaId: i.choice.personaId, at: i.choice.at, by: i.choice.by }] : []),
    ...(i.activePersona ? [{ personaId: i.activePersona.personaId, at: i.activePersona.at, by: i.activePersona.by }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const newest = choices[0] ?? null;
  const chosenRow = newest ? i.eligible.find((e) => e.personaId === newest.personaId) ?? null : null;
  const chosenMissing = newest && !chosenRow ? `Your chosen person is no longer among the eligible people at ${i.accountName} (set aside, left, or not yet a GAP contact). Choose again.` : null;
  const toPerson = (e: PursuitInput['eligible'][number], chosenBy: string | null): PursuitPerson => ({ key: e.key, personaId: e.personaId, hubspotContactId: e.hubspotContactId ?? null, name: e.name, title: e.title, chosenBy });
  const chosen = chosenRow && newest ? toPerson(chosenRow, `${who(newest.by)}, ${day(newest.at)}`) : null;
  const only = !chosen && i.eligible.length === 1 ? toPerson(i.eligible[0], null) : null;

  const base = (state: PursuitStateKind, over: Partial<PursuitState> = {}): PursuitState => ({
    accountName: i.accountName,
    state,
    stateLine: STATE_LINE[state],
    person: chosen ?? only,
    blocker: null,
    unlock: null,
    coldTouchAllowed: false,
    chooseAllowed: false,
    replyClass,
    lastInbound,
    answered,
    lastOutbound: i.lastOutbound,
    chosenMissing,
    next: i.motion?.next ? { name: i.motion.next.name, title: i.motion.next.title, unlock: i.motion.next.unlock } : null,
    followUp: i.followUpDue,
    deals: i.opportunity.deals,
    ...over,
  });

  // 1. A reply nobody has recorded, by its class. The walk fix: a human reply we answered is not waiting (an opt-out
  // never counts as answered: it stays until it is recorded).
  if (newestReply && replyClass && !newestReply.triaged) {
    if (replyClass.kind === 'human' && !newestAnswer) {
      return base('replied', {
        person: { key: `reply:${newestReply.from}`, personaId: null, name: newestReply.name ?? newestReply.from, title: null, chosenBy: null },
        stateLine: `${STATE_LINE.replied}: ${newestReply.name ?? newestReply.from}, ${day(newestReply.at)}`,
        blocker: `${newestReply.name ?? newestReply.from} wrote on ${day(newestReply.at)}; the reply is not recorded yet.`,
        unlock: 'Read the reply and record what they said; the next person unlocks after that.',
      });
    }
    if (replyClass.kind === 'opt_out') {
      return base('opted_out', {
        stateLine: `${STATE_LINE.opted_out}: ${newestReply.name ?? newestReply.from}, ${day(newestReply.at)}`,
        blocker: `${newestReply.name ?? newestReply.from} replied "${newestReply.snippet.slice(0, 40)}" on ${day(newestReply.at)}: record it as do not contact. No reply goes back.`,
        unlock: 'Record the opt-out; GAP then sets that person aside. Anyone else here is your call afterwards, not the queue\'s.',
      });
    }
    // out_of_office and bounce: noted on the inbound line, never a state of their own.
  }

  // 1b. The cockpit's own motion already knows a conversation or an untriaged reply at the account (its readers see
  // addresses the reply list may not): the same hold, never a surface that recomputes it away.
  if (i.motion?.state === 'in_conversation' || i.motion?.state === 'paused_reply') {
    const who = i.motion.headline.match(/^(?:In a conversation|Paused): (.+?) (?:answered|at )/)?.[1] ?? 'someone at the account';
    return base('replied', {
      person: { key: `reply:${who}`, personaId: null, name: who, title: null, chosenBy: null },
      stateLine: `${STATE_LINE.replied}: ${who}`,
      blocker: i.motion.headline,
      unlock: i.motion.state === 'paused_reply' ? 'Read the reply and record what they said; the next person unlocks after that.' : 'Work it from that conversation; a cold email to anyone else here is your call, not the queue\'s.',
    });
  }

  // 2. Holds: a deal, unknown opportunity truth, a restriction, a family hold, an outstanding draft.
  if (i.motionType === 'IN_DEAL' || i.opportunity.status === 'OPEN' || i.opportunity.status === 'ACTIVE') {
    const d = i.opportunity.deals[0];
    return base('in_deal', {
      // R50: two opportunities are named as two, never as the first one's.
      stateLine: i.opportunity.deals.length > 1 ? `In ${i.opportunity.deals.length} open deals: ${i.opportunity.deals.map((x) => x.name ?? 'an unnamed deal').join('; ')}` : `${STATE_LINE.in_deal}${d?.name ? `: ${d.name}` : ''}${d?.stage ? ` (${d.stage})` : ''}`,
      blocker: `An open HubSpot deal: work it from the deal, never a cold first touch.`,
      unlock: 'The deal closes or the opportunity read changes.',
    });
  }
  // R55: a customer (closed won) or parked after a lost deal: held, said plainly; post-sale expansion is context only.
  if (i.opportunity.status === 'CLEAR' && i.opportunity.closure) {
    const c = i.opportunity.closure;
    return base('held', { stateLine: closureStateLine(c.kind), blocker: c.why, unlock: c.kind === 'customer' ? 'Your explicit decision to work an expansion with the customer.' : 'A material change: a newer verified fact, a buyer reply, or a new open deal.' });
  }
  if (i.opportunity.status === 'UNKNOWN') {
    // R60: the reason in words (never "identity_unresolved"), and what unlocks it for that reason.
    // R63-A S13: no HubSpot company linked is said as that, with the step that lifts it (never an outage).
    const identity = identityHold(i.opportunity.detail);
    return base('held', { stateLine: `${STATE_LINE.held}: ${identity?.state ?? 'HubSpot could not be checked'}`, blocker: identity?.why ?? `HubSpot could not be checked: ${unknownReasonWords(i.opportunity.detail)}. No cold touch until it can.`, unlock: unknownUnlock(i.opportunity.detail) });
  }
  if (i.restriction) {
    return base('held', {
      stateLine: `${STATE_LINE.held}: warm intro only`,
      person: { key: `intro:${i.restriction.introducer}`, personaId: null, name: i.restriction.introducer, title: null, chosenBy: null },
      blocker: `This account is reached only through ${i.restriction.introducer} (${i.restriction.route}). No cold touch.`,
      unlock: 'Ask for the introduction and log it.',
    });
  }
  if (i.familyHold) {
    return base('held', { stateLine: `${STATE_LINE.held}: family hold`, blocker: i.familyHold.detail, unlock: 'The family hold is lifted.' });
  }
  if (i.outstandingDraft) {
    return base('held', {
      stateLine: `${STATE_LINE.held}: a draft is outstanding`,
      blocker: `A GAP first-touch draft to ${i.outstandingDraft.name ?? i.outstandingDraft.recipient} is still outstanding; it holds the account until it is sent or discarded.`,
      unlock: 'Send or discard the draft.',
    });
  }

  // 3. A due follow-up.
  if (i.followUpDue) {
    return base('follow_up_due', {
      person: { key: `persona:${i.followUpDue.personaId ?? i.followUpDue.name}`, personaId: i.followUpDue.personaId, name: i.followUpDue.name, title: null, chosenBy: null },
      stateLine: `${STATE_LINE.follow_up_due}: ${i.followUpDue.name}, due ${day(i.followUpDue.dueAt)}`,
      unlock: 'Send the next touch from the follow-up card.',
    });
  }

  // 4. The motion in flight.
  if (i.motion?.state === 'needs_owner' && !chosen) {
    return base('choose_person', {
      person: null,
      stateLine: `${STATE_LINE.choose_person}${i.eligible.length ? ` (${i.eligible.length} eligible)` : ''}`,
      coldTouchAllowed: i.eligible.length > 0,
      chooseAllowed: true,
      blocker: i.eligible.length ? null : i.motion.headline,
      unlock: 'Choose one person; the first touch is prepared for them.',
    });
  }
  if (i.motion?.state === 'in_motion' && i.motion.primary) {
    return base('in_motion', {
      person: { key: `persona:${i.motion.primary.personaId}`, personaId: i.motion.primary.personaId, name: i.motion.primary.name, title: i.motion.primary.title, chosenBy: null },
      stateLine: `${STATE_LINE.in_motion}: ${i.motion.primary.name}`,
      chooseAllowed: true,
      unlock: i.motion.next ? `${i.motion.next.name} unlocks ${i.motion.next.unlock}.` : 'The next person unlocks when this one answers or the window passes.',
    });
  }

  // 5. A relationship-led account: the person you met or the introducer leads; no cold email, a warm touch instead.
  if ((i.motionType === 'RELATIONSHIP_LED' || i.motionType === 'REFERRAL_LED') && i.relationship) {
    return base('ready', {
      person: { key: `relationship:${i.relationship.name}`, personaId: null, name: i.relationship.name, title: i.relationship.title, chosenBy: null },
      stateLine: `Relationship-led: ${i.relationship.name}`,
      blocker: null,
      chooseAllowed: true,
      unlock: 'Log the warm touch; a cold email to anyone else waits for their answer.',
    });
  }

  // 6. Research: nobody eligible, or no angle grounds a first touch yet (the people may be fine).
  if (i.eligible.length === 0) {
    return base('research', { person: null, blocker: `Nobody on record runs transportation, logistics, freight or the fleet at ${i.accountName}. Find the operator.`, unlock: 'A source-backed operator is added to GAP.' });
  }
  if (i.motionType === 'NO_GOOD_MOTION') {
    const why = i.briefNext?.trim() ?? '';
    return base('research', {
      stateLine: /needs review/i.test(why) ? 'Research: the angle needs your review before it is used' : /no thesis grounded|draft and review/i.test(why) ? 'Research: a verified fact, no angle grounded on it yet' : 'Research: no angle to open on yet',
      blocker: why || `No approved angle grounds a first touch at ${i.accountName} yet. The people below stand; the angle is what is missing.`,
      chooseAllowed: true,
      unlock: 'A verified fact and an approved angle.',
    });
  }

  // 7. Ready or choose.
  if (chosen || only) {
    return base('ready', {
      person: chosen ?? only,
      stateLine: `${STATE_LINE.ready}: ${(chosen ?? only)!.name}`,
      coldTouchAllowed: true,
      chooseAllowed: true,
      unlock: i.motion?.next ? `${i.motion.next.name} unlocks ${i.motion.next.unlock}.` : null,
    });
  }
  return base('choose_person', {
    person: null,
    stateLine: `${STATE_LINE.choose_person} (${i.eligible.length} eligible)`,
    coldTouchAllowed: true,
    chooseAllowed: true,
    unlock: 'Choose one person; the first touch is prepared for them.',
  });
}
