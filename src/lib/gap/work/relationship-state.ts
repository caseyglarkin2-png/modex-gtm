/**
 * THE RELATIONSHIP STATE (the Gmail action UI audit, GUI-05 and GUI-06, 2026-10-10). Server only; nothing here writes.
 *
 * One person at one account, reconciled across BOTH sides of the mail and the records GAP already holds, so an
 * assignment never treats an old request as outstanding without checking the later correspondence (the Boston Beer
 * packet of October 10 put Phil Savastano's request for four documents under "why now" with no word on whether they
 * went). The inputs are the ones the people state already reads (work/people-state.ts): the synced inbox, our Sent
 * and Drafts when the GAP mailbox is configured (context/thread-context.ts), the HubSpot company's engagements, the
 * vault's held calls and meetings, the commitments ledger, the in-deals summary and the suppression rows.
 *
 * What it answers (pinned by tests/unit/gap/gui-relationship-state.test.ts):
 *   lastInbound / lastOutbound   the newest meaningful message each way, with its date, subject and purpose
 *   request                      the newest message of theirs that asks for something, and whether it was met:
 *                                FULFILLED when we wrote after it in its thread or under its subject; "a draft exists,
 *                                unsent" when only a draft followed; UNFULFILLED when nothing followed and Sent was
 *                                read; UNKNOWN when Sent was not read (said so). No repeat send is ever inferred from
 *                                the old reply alone.
 *   meetings, deals, promises, drafts, optOut, the links, and `searched`: what was read and when, so an absence used
 *                                as evidence names the search it rests on.
 *   purpose / purposeWord         GUI-06: the relationship word every person line carries (buyer, customer, partner,
 *                                vendor pitching us, media, administrative, calendar or automated, unknown), from the
 *                                existing purpose classifier (context/purpose.ts) over their messages.
 */
import type { Purpose } from '../context/commercial-context';
import { classifyPurpose } from '../context/purpose';
import { classifyReply } from '../replies/classify';
import { loadThreadContext, type CalendarFacts, type ThreadContextDeps } from '../context/thread-context';
import { peopleState, type StateEvent } from './people-state';
import { gmailThreadHref } from '../account-intel/href';
import { findPersonaContact, hubspotRecordUrl } from '../people/contact-packet';
import { gapGmailSender } from '../execution/gap-sender';
import { listDraftsTo, listSentTo } from '@/lib/email/gmail-inbox';
import { loadCompanyEngagements } from '../hubspot/engagements';
import { loadCommitments } from './commitments';
import { conversationEvents } from './intel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** One message or conversation the reconciliation reads (the thread context's event, typed). */
export interface RelationshipEvent {
  id: string;
  at: string;
  direction: 'inbound' | 'outbound';
  type: string;
  isDraft: boolean;
  from: string | null;
  to: string[];
  subject: string | null;
  excerpt: string | null;
  purpose: Purpose | null;
  threadId: string | null;
  calendar?: CalendarFacts | null;
  providerIds?: string[];
  /** A held conversation (a vault call or meeting note naming the person). */
  conversation?: { kind: 'call' | 'meeting'; title: string | null; source: string } | null;
  /** The Gmail draft id, for a draft. */
  draftId?: string | null;
  /** The source, for the words ("GAP's synced inbox", "Gmail Sent", "HubSpot"). */
  source: string;
}

export interface RelationshipReads {
  inbox: { read: boolean; count: number; detail: string | null };
  sent: { read: boolean; count: number; detail: string | null };
  drafts: { read: boolean; count: number; detail: string | null };
  engagements: { read: boolean; count: number; detail: string | null };
  commitments: { read: boolean; count: number };
  deals: { read: boolean; detail: string | null };
  conversations: { read: boolean; count: number };
}

export interface RelationshipInputs {
  person: { email: string | null; name: string | null };
  accountName: string;
  now: Date;
  events: RelationshipEvent[];
  /** The HubSpot company's notes, calls and meetings (its emails are already events). */
  engagements: Array<{ kind: 'note' | 'call' | 'meeting'; at: string; title: string | null; body: string; id: string }>;
  commitments: Array<{ title: string; owner: string; dueAt: string | null; status: string; basis: string | null; person: { email: string | null; name: string | null } | null; proof?: { at: string; note: string | null } | null }>;
  deals: Array<{ id?: string | null; name: string | null; stage: string | null; nextStep?: string | null; closeDate?: string | null; lastActivityAt?: string | null }>;
  suppression: { unsubscribed: { at: string | null; reason: string | null } | null; doNotContact: boolean };
  reads: RelationshipReads;
  /** The GAP mailbox (for the thread link), when configured. */
  mailbox: string | null;
  hubspotContactId: string | null;
  hubspotCompanyId: string | null;
  /** The account's people (name and address), so a referral in their words ("reach out to Brian Kellog") resolves to a known person. */
  people?: Array<{ name: string | null; email: string | null }>;
  /** Our emails to OTHER people at the account (HubSpot's logged emails, our Sent), so a referral can be followed to the person they named. */
  othersWritten?: Array<{ at: string; to: string; toName: string | null; subject: string | null; source: string }>;
  /** Other people at the account who wrote us (HubSpot's logged emails), with their addresses, so a name in the correspondence resolves. */
  othersWrote?: Array<{ at: string; from: string; fromName: string | null; subject: string | null; source: string }>;
}

/** 'redirected': they pointed to someone else after asking (Phil Savastano, Jun 3: "reach out to Brian Kellog"); the request follows that person. */
export type RequestState = 'fulfilled' | 'unfulfilled' | 'unknown' | 'redirected';

/** A referral in their own words: the person they named, resolved to the account's people when possible, and whether we wrote that person after. */
export interface Referral {
  at: string;
  subject: string | null;
  name: string;
  email: string | null;
  writtenAfter: { at: string; subject: string | null; source: string } | null;
}

/**
 * A message of theirs that points US to someone else ("feel free to reach out to Brian Kellog", "please loop in Dave",
 * "you can contact Jane"): a second-person frame before the verb, never their own next step ("let me check with Dave",
 * "I will ask Legal"), which stays theirs. The review of October 10 found both read as referrals.
 */
const REFERRAL = /(?:^|[.;!?]\s*|\b(?:[Pp]lease|[Ff]eel free to|[Yy]ou (?:can|could|should|may|might want to)|[Bb]est to|[Bb]etter to|[Aa]nd)\s+)(?:reach out to|reach out directly to|contact|talk to|talk with|speak to|speak with|loop in|connect with|work with|check with|coordinate with|go through|try|ask|ping|email|cc|copy)\s+(?:my colleague\s+|our\s+)?([A-Z][a-z]+(?:\s+(?:[A-Z]\.?\s+)?[A-Z][a-zA-Z'-]+)?)\b/;
const FIRST_PERSON_BEFORE = /\b(?:I|I'll|I will|I'd|I can|let me|we'll|we will|we can|we'd|I'm going to|we're going to)\s+(?:also\s+|just\s+)?$/i;
/** The seller's own names: never a referral. */
export const OWN_NAME_KEYS: ReadonlySet<string> = new Set(['casey', 'larkin', 'casey larkin']);

/** The referral's name against the account's people: the whole name, or a first name that only one person carries. */
/** The words a person is known by: their name, else the words of their address ("brian.kellogg@x.com" is "brian kellogg"). */
export const personWords = (p: { name: string | null; email: string | null }): string[] => (p.name ? lower(p.name).replace(/,/g, ' ') : lower(p.email).split('@')[0].replace(/\d+/g, ' ').replace(/[._-]+/g, ' ')).split(/\s+/).filter(Boolean);
/** A display name for a person known only by address ("brian.kellogg" -> "Brian Kellogg"). */
export const nameFromAddress = (email: string): string => personWords({ name: null, email }).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function resolveReferralName(name: string, people: ReadonlyArray<{ name: string | null; email: string | null }>): { name: string; email: string | null } {
  const want = nameKeyOf(name);
  const whole = people.find((p) => personWords(p).slice().sort().join(' ') === want);
  if (whole) return { name: whole.name ?? nameFromAddress(whole.email as string), email: lower(whole.email) || null };
  const parts = name.trim().split(/\s+/);
  const first = lower(parts[0]);
  const last = parts.length > 1 ? lower(parts[parts.length - 1]) : null;
  // "Brian Kellog" against "Brian Kellogg" (a name, or an address's words): the first name and the first four letters of the last name.
  const near = people.filter((p) => {
    const ps = personWords(p);
    if (!ps.includes(first)) return false;
    if (!last) return true;
    return ps.some((x) => x !== first && x.slice(0, 4) === last.slice(0, 4));
  });
  // The same person known twice (a persona row and a correspondent address) is one candidate.
  const uniq = [...new Map(near.map((p) => [lower(p.email) || nameKeyOf(p.name), p] as const)).values()];
  if (uniq.length === 1) return { name: uniq[0].name ?? nameFromAddress(uniq[0].email as string), email: lower(uniq[0].email) || null };
  return { name: name.trim(), email: null };
}

const nameKeyOf = (s: string | null | undefined) => lower(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

export interface RelationshipState {
  person: { email: string | null; name: string | null };
  purpose: Purpose | null;
  /** GUI-06: the word on the person line. */
  purposeWord: string;
  lastInbound: { at: string; subject: string | null; purpose: Purpose | null; excerpt: string | null; threadId: string | null } | null;
  lastOutbound: { at: string; subject: string | null; threadId: string | null; source: string } | null;
  /** Their newest message after our last send (they answered), or null. */
  laterResponse: { at: string; subject: string | null } | null;
  /** `known` is false when our outbound history was not read (Sent and HubSpot both unread): then nothing is owed or not owed, it is not known. */
  answerOwed: { owed: boolean; basis: string; known: boolean };
  quiet: { quiet: boolean; days: number | null; basis: string };
  request: { at: string; subject: string | null; excerpt: string | null; state: RequestState; basis: string; fulfilledBy: { at: string; subject: string | null } | null; draft: { at: string; subject: string | null } | null; redirectedTo: Referral | null } | null;
  /** `request.state`, or 'none' when nothing of theirs asks for something. */
  requestState: RequestState | 'none';
  /** The newest referral in their words, whether or not it followed a request. */
  referral: Referral | null;
  /** Whether what we sent was read (our Sent, or HubSpot's logged emails), and on what basis; an absence of ours is only evidence when this is true. */
  outboundRead: { read: boolean; basis: string };
  reads: RelationshipReads;
  /** The other people at the account the correspondence names, with their addresses (we wrote them, or they wrote us), newest first. */
  correspondents: Array<{ name: string | null; email: string; lastAt: string }>;
  /** The HubSpot company the relationship was read against (the account's, else the one the deals resolve), for the contact packet's company link. */
  hubspotCompanyId: string | null;
  meetings: Array<{ at: string; title: string | null; kind: 'meeting' | 'call'; outcome: string | null; source: string }>;
  nextMeetingAt: string | null;
  deals: Array<{ id: string | null; name: string; stage: string | null; nextStep: string | null; closeDate: string | null; lastActivityAt: string | null; url: string | null }>;
  promises: Array<{ title: string; owner: string; dueAt: string | null; status: string; basis: string | null; theirs: boolean }>;
  drafts: Array<{ at: string; subject: string | null; to: string | null; threadId: string | null; draftId: string | null }>;
  optOut: { at: string | null; words: string | null; source: string } | null;
  /** `threadKind`: 'thread' links the specific Gmail thread of their newest message; 'search' is a Gmail search for their address (said as such). */
  links: { thread: string | null; threadKind: 'thread' | 'search' | null; hubspotContact: string | null; hubspotCompany: string | null };
  /** What was read and when, in words; an absence above rests on this. */
  searched: string;
}

/** A Gmail thread id (hex) as the synced inbox stores it for a Gmail-sourced message; a HubSpot-sourced row's id is not one. */
const GMAIL_THREAD_ID = /^[0-9a-f]{12,20}$/i;

/** The link to one specific Gmail thread in the seller's own mailbox. */
export function gmailThreadLink(threadId: string, mailbox: string | null | undefined): string {
  return `https://mail.google.com/mail/u/0/${mailbox ? `?authuser=${encodeURIComponent(mailbox)}` : ''}#all/${encodeURIComponent(threadId)}`;
}

const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const MEANINGFUL: ReadonlySet<Purpose> = new Set(['buyer_conversation', 'customer_support', 'partner_referral', 'vendor_solicitation', 'media', 'unknown', 'suspicious']);
const ANSWERABLE: ReadonlySet<Purpose> = new Set(['buyer_conversation', 'customer_support']);
/** A message that asks for something: a question, or a send/share/forward ask. */
const ASKS = /\?|\b(?:please|can|could|would|will) (?:you )?(?:send|share|forward|provide|get|give|pass|attach|email|resend|re-send)\b|\bfeel free to (?:send|share|forward|pass)\b|\bsend (?:me|us|over|along|through|some|any|the|a|an)\b|\b(?:need|want|looking for|require|interested in) (?:the|a|an|your|some|more|those|these)\b|\bwhat (?:is|are|would)\b|\bhow (?:much|many|does|do|would)\b|\bwhen (?:can|could|would)\b/i;
const normSubject = (s: string | null | undefined) => lower(s).replace(/^(?:(?:re|fwd?|fw|aw|sv)\s*:\s*)+/i, '').replace(/\s+/g, ' ').trim();
/** Their own words only: a quoted header left in a stored snippet ("stop From: Casey Larkin Sent: ...") is cut first. */
const ownWordsOf = (e: Pick<RelationshipEvent, 'excerpt'>) => (e.excerpt ?? '').replace(/\s+/g, ' ').split(/\s(?:From|Sent|To):\s|\sOn .{5,80}? wrote:/)[0].trim();

export const PURPOSE_WORDS: Record<Purpose, string> = {
  buyer_conversation: 'buyer',
  customer_support: 'customer',
  partner_referral: 'partner',
  vendor_solicitation: 'vendor pitching us',
  media: 'media',
  internal: 'administrative (internal)',
  calendar: 'calendar or automated',
  automated: 'calendar or automated',
  suspicious: 'suspicious (review before anything)',
  unknown: 'unknown',
};

/** The relationship word for a person from their messages: the newest meaningful one decides; nothing from them is said as such. */
export function purposeWordOf(inbound: ReadonlyArray<Pick<RelationshipEvent, 'purpose' | 'at'>>): { purpose: Purpose | null; word: string } {
  const real = inbound.filter((e) => e.purpose && MEANINGFUL.has(e.purpose)).sort((a, b) => b.at.localeCompare(a.at));
  if (!real.length) {
    const any = inbound.slice().sort((a, b) => b.at.localeCompare(a.at))[0];
    if (!any) return { purpose: null, word: 'prospect, no message from them on record' };
    return { purpose: any.purpose ?? 'unknown', word: `${PURPOSE_WORDS[any.purpose ?? 'unknown']}; no message from them in their own words` };
  }
  const p = real[0].purpose as Purpose;
  return { purpose: p, word: PURPOSE_WORDS[p] };
}

/** The purposes set on the thread context's events (which leave them null), the way work/intel.ts types them. */
export function typeEvents(events: ReadonlyArray<Omit<RelationshipEvent, 'purpose'> & { purpose?: Purpose | null }>, opts: { knownPerson: boolean }): RelationshipEvent[] {
  return events.map((e) => {
    if (e.purpose) return { ...e, purpose: e.purpose };
    if (e.conversation) return { ...e, purpose: 'buyer_conversation' as Purpose };
    const purpose = classifyPurpose({ from: e.from, subject: e.subject, excerpt: e.excerpt, direction: e.direction, isDraft: e.isDraft, type: e.type, calendar: e.calendar ?? null }, { knownPerson: opts.knownPerson }).purpose;
    return { ...e, purpose };
  });
}

function toStateEvent(e: RelationshipEvent): StateEvent {
  return { id: e.id, at: e.at, direction: e.direction, type: e.type, isDraft: e.isDraft, from: e.from, to: e.to, purpose: e.purpose, providerIds: e.providerIds, calendar: e.calendar ?? null, conversation: e.conversation ?? null };
}

const clock = (d: Date) => `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })} New York`;

/** The pure reconciliation. */
export function relationshipStateFrom(i: RelationshipInputs): RelationshipState {
  const email = lower(i.person.email) || null;
  const events = [...i.events].sort((a, b) => a.at.localeCompare(b.at));
  const inbound = events.filter((e) => e.direction === 'inbound' && !e.conversation && e.type !== 'calendar' && e.purpose !== 'calendar' && e.purpose !== 'automated' && e.purpose !== 'internal');
  const sends = events.filter((e) => e.direction === 'outbound' && !e.isDraft && e.type !== 'draft' && e.type !== 'calendar');
  const drafts = events.filter((e) => e.direction === 'outbound' && (e.isDraft || e.type === 'draft'));
  const { purpose, word } = purposeWordOf(inbound);

  const lastIn = inbound.at(-1) ?? null;
  const lastOut = sends.at(-1) ?? null;
  const laterResponse = lastOut ? inbound.filter((e) => e.at > lastOut.at).at(-1) ?? null : null;

  // The people state answers answer-owed and quiet the way Work does (one reader, never a second rule).
  const states = peopleState(events.map(toStateEvent), i.now);
  const st = email ? states.get(email) ?? null : null;

  // Whether what WE sent was read at all: our Sent, else HubSpot's logged emails at the company. Without either, an
  // absence of ours is not evidence ("nothing sent since" is never said; "not known" is).
  const sentDetail = i.reads.sent.detail ?? 'no GAP sender configured';
  const outboundRead: RelationshipState['outboundRead'] = i.reads.sent.read
    ? { read: true, basis: `our Sent was read (${i.reads.sent.count} message${i.reads.sent.count === 1 ? '' : 's'} to them)${i.reads.engagements.read ? `; HubSpot's logged emails at ${i.accountName} were read` : ''}` }
    : i.reads.engagements.read
      ? { read: true, basis: `our Sent was not read (${sentDetail}); HubSpot's logged emails at ${i.accountName} were read (${i.reads.engagements.count} engagements), which is our outbound record here` }
      : { read: false, basis: `our Sent was not read (${sentDetail}) and HubSpot engagements at ${i.accountName} were not read (${i.reads.engagements.detail ?? 'not configured'}), so what we sent is not known` };

  // The other people the correspondence names, with their addresses, newest first (one entry per address).
  const corr = new Map<string, { name: string | null; email: string; lastAt: string }>();
  for (const w of [...(i.othersWritten ?? []).map((w) => ({ email: lower(w.to), name: w.toName, at: w.at })), ...(i.othersWrote ?? []).map((w) => ({ email: lower(w.from), name: w.fromName, at: w.at }))]) {
    if (!w.email.includes('@')) continue;
    const prev = corr.get(w.email);
    if (!prev || prev.lastAt < w.at) corr.set(w.email, { name: w.name ?? prev?.name ?? null, email: w.email, lastAt: w.at });
    else if (!prev.name && w.name) prev.name = w.name;
  }
  const correspondents = [...corr.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
  const knownPeople = [...(i.people ?? []), ...correspondents.map((c) => ({ name: c.name, email: c.email }))];

  // A referral in their words: the newest message of theirs that points us to someone else, resolved to the account's people.
  let referral: Referral | null = null;
  for (const e of inbound.slice().reverse()) {
    if (!e.purpose || !ANSWERABLE.has(e.purpose)) continue;
    const words = ownWordsOf(e);
    const m = REFERRAL.exec(words);
    if (!m) continue;
    // Their own next step ("let me check with Dave") is theirs, not a referral to us.
    if (FIRST_PERSON_BEFORE.test(words.slice(0, (m.index ?? 0) + m[0].length - m[1].length))) continue;
    const who = resolveReferralName(m[1], knownPeople);
    // A lone first name that no known person carries is not a referral ("ask Legal", "try Monday").
    if (!who.email && !m[1].trim().includes(' ')) continue;
    // Their own name, or ours, is not a referral.
    if (i.person.name && nameKeyOf(who.name) === nameKeyOf(i.person.name)) continue;
    if (who.email && email && who.email === email) continue;
    if (OWN_NAME_KEYS.has(nameKeyOf(who.name)) || (who.email && /@(yardflow\.ai|freightroll\.com)$/i.test(who.email))) continue;
    const written = (i.othersWritten ?? []).filter((w) => w.at > e.at && ((who.email && lower(w.to) === who.email) || (w.toName && nameKeyOf(w.toName) === nameKeyOf(who.name)))).sort((a, b) => a.at.localeCompare(b.at))[0] ?? null;
    referral = { at: e.at, subject: e.subject, name: who.name, email: who.email, writtenAfter: written ? { at: written.at, subject: written.subject, source: written.source } : null };
    break;
  }

  // The request: their newest answerable message that asks for something; met only by what followed it.
  let request: RelationshipState['request'] = null;
  const asking = inbound.filter((e) => e.purpose && ANSWERABLE.has(e.purpose) && ASKS.test(`${e.subject ?? ''}\n${e.excerpt ?? ''}`)).at(-1) ?? null;
  if (asking) {
    const after = sends.filter((e) => e.at > asking.at);
    const matches = (e: RelationshipEvent) => (asking.threadId && e.threadId && e.threadId === asking.threadId) || (!!normSubject(asking.subject) && normSubject(e.subject) === normSubject(asking.subject));
    const met = after.find(matches) ?? null;
    const draftAfter = drafts.filter((e) => e.at > asking.at).find((e) => matches(e) || !e.threadId) ?? null;
    const sentRead = i.reads.sent.read;
    const redirected = referral && referral.at >= asking.at ? referral : null;
    let state: RequestState;
    let basis: string;
    if (met) {
      state = 'fulfilled';
      basis = `we wrote ${dateWords(met.at)}${met.subject ? ` under "${met.subject}"` : ''} (${met.source}), after their message of ${dateWords(asking.at)}`;
    } else if (redirected) {
      // They pointed to someone else after asking: the request follows that person; nothing is owed to the asker from it.
      state = 'redirected';
      basis = `on ${dateWords(redirected.at)} they pointed to ${redirected.name}${redirected.writtenAfter ? `; we wrote ${redirected.name} ${dateWords(redirected.writtenAfter.at)}${redirected.writtenAfter.subject ? ` under "${redirected.writtenAfter.subject}"` : ''} (${redirected.writtenAfter.source})` : outboundRead.read ? `; nothing to ${redirected.name} on record after that (${outboundRead.basis})` : `; whether we wrote ${redirected.name} is not known (${outboundRead.basis})`}`;
    } else if (after.length && !sentRead) {
      state = 'unknown';
      basis = `we wrote ${dateWords(after[after.length - 1].at)}${after[after.length - 1].subject ? ` under "${after[after.length - 1].subject}"` : ''}, not in the request's thread; our Sent was not read (${i.reads.sent.detail ?? 'no GAP sender configured'}), so whether the request was met is not known`;
    } else if (after.length) {
      state = 'unknown';
      basis = `we wrote ${dateWords(after[after.length - 1].at)}${after[after.length - 1].subject ? ` under "${after[after.length - 1].subject}"` : ''} after it, not in the request's thread; whether that met the request is your call`;
    } else if (draftAfter && sentRead) {
      state = 'unfulfilled';
      basis = `a draft exists, unsent (${dateWords(draftAfter.at)}${draftAfter.subject ? `, "${draftAfter.subject}"` : ''}); nothing went to them after their message of ${dateWords(asking.at)}`;
    } else if (draftAfter) {
      // The review of October 10: a draft is not evidence that nothing was sent when Sent itself was not read.
      state = 'unknown';
      basis = `a draft exists, unsent (${dateWords(draftAfter.at)}${draftAfter.subject ? `, "${draftAfter.subject}"` : ''}); whether anything went to them after their message of ${dateWords(asking.at)} is not known: our Sent was not read (${sentDetail})`;
    } else if (sentRead) {
      state = 'unfulfilled';
      basis = `nothing from us after their message of ${dateWords(asking.at)}: our Sent was read (${i.reads.sent.count} message${i.reads.sent.count === 1 ? '' : 's'} to them)${i.reads.engagements.read ? ', HubSpot engagements read' : ''}`;
    } else {
      state = 'unknown';
      basis = `nothing from us after their message of ${dateWords(asking.at)} in what was read${i.reads.engagements.read ? ` (HubSpot's logged emails at ${i.accountName} were read)` : ''}, but our Sent was not read (${sentDetail}), so this is not known`;
    }
    request = { at: asking.at, subject: asking.subject, excerpt: asking.excerpt ? asking.excerpt.replace(/\s+/g, ' ').trim().slice(0, 240) : null, state, basis, fulfilledBy: met ? { at: met.at, subject: met.subject } : null, draft: draftAfter ? { at: draftAfter.at, subject: draftAfter.subject } : null, redirectedTo: state === 'redirected' ? redirected : null };
  }

  // Meetings and calls: held conversations, accepted calendar events that have started, HubSpot meetings and calls (the outcome is what the team wrote).
  // A HubSpot meeting or call dated after now has not been held: it is excluded here and is the next meeting (the
  // earliest one ahead) when the people state names none (the morning audit of 2026-10-10: Kenco's Oct 14 "Next
  // Steps" meeting read as a held one four days before it).
  const meetings: RelationshipState['meetings'] = [];
  for (const e of events) {
    if (e.conversation) meetings.push({ at: e.at, title: e.conversation.title, kind: e.conversation.kind, outcome: null, source: e.conversation.source === 'fireflies' ? "the vault's Fireflies capture" : "the vault's meeting note" });
    else if (e.calendar?.kind === 'accepted' && e.calendar.startsAt && new Date(e.calendar.startsAt).getTime() <= i.now.getTime()) meetings.push({ at: e.calendar.startsAt, title: e.calendar.meetingKey.split('|')[0] || e.subject, kind: 'meeting', outcome: null, source: 'the calendar (accepted; held by its date)' });
  }
  let hubspotAhead: string | null = null;
  for (const g of i.engagements) {
    if (g.kind !== 'meeting' && g.kind !== 'call') continue;
    const at = new Date(g.at).getTime();
    if (at > i.now.getTime()) {
      if (!hubspotAhead || at < new Date(hubspotAhead).getTime()) hubspotAhead = g.at;
      continue;
    }
    meetings.push({ at: g.at, title: g.title, kind: g.kind, outcome: g.body ? g.body.replace(/\s+/g, ' ').trim().slice(0, 240) : null, source: 'HubSpot' });
  }
  meetings.sort((a, b) => b.at.localeCompare(a.at));
  const seen = new Set<string>();
  const uniqueMeetings = meetings.filter((m) => { const k = `${m.kind}|${m.at.slice(0, 13)}`; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 5);

  const deals = i.deals.map((d) => ({ id: d.id ?? null, name: d.name ?? 'an unnamed deal', stage: d.stage ?? null, nextStep: d.nextStep ?? null, closeDate: d.closeDate ?? null, lastActivityAt: d.lastActivityAt ?? null, url: d.id ? hubspotRecordUrl('deal', String(d.id)) : null }));

  const promises = i.commitments
    .filter((c) => c.status !== 'skipped')
    .map((c) => ({ title: c.title, owner: c.owner, dueAt: c.dueAt, status: c.status, basis: c.basis, theirs: !!c.person && ((!!email && lower(c.person.email) === email) || (!!i.person.name && !!c.person.name && lower(c.person.name) === lower(i.person.name))) }))
    .sort((a, b) => Number(b.theirs) - Number(a.theirs) || (a.dueAt ?? '').localeCompare(b.dueAt ?? ''))
    .slice(0, 6);

  // The opt-out: the suppression rows are the authority; an opt-out in their own words is read beside them.
  // Their own words only: a quoted header left in a stored snippet ("stop From: Casey Larkin Sent: ...") is cut first.
  const optOutMsg = inbound.filter((e) => classifyReply({ snippet: ownWordsOf(e), subject: e.subject, from: e.from }).kind === 'opt_out').at(-1) ?? null;
  let optOut: RelationshipState['optOut'] = null;
  if (optOutMsg) optOut = { at: optOutMsg.at, words: ownWordsOf(optOutMsg).slice(0, 80) || null, source: `their message of ${dateWords(optOutMsg.at)}${i.suppression.unsubscribed ? '; on the suppression list' : i.suppression.doNotContact ? '; the GAP record says do not contact' : '; NOT yet on the suppression list'}` };
  else if (i.suppression.unsubscribed) optOut = { at: i.suppression.unsubscribed.at, words: i.suppression.unsubscribed.reason, source: 'the suppression list' };
  else if (i.suppression.doNotContact) optOut = { at: null, words: null, source: 'the GAP contact record (do not contact)' };

  const r = i.reads;
  const searched = [
    email ? `GAP's synced inbox for ${email} (${r.inbox.read ? `${r.inbox.count} message${r.inbox.count === 1 ? '' : 's'} from them` : `not readable: ${r.inbox.detail ?? 'unknown'}`})` : `no address on record for ${i.person.name ?? 'this person'}: the inbox was not searched`,
    email ? `our Sent to them (${r.sent.read ? `${r.sent.count} message${r.sent.count === 1 ? '' : 's'}` : `not read: ${r.sent.detail ?? 'no GAP sender configured'}`})` : null,
    email ? `Gmail drafts to them (${r.drafts.read ? `${r.drafts.count}` : `not read: ${r.drafts.detail ?? 'no GAP sender configured'}`})` : null,
    `HubSpot engagements at ${i.accountName} (${r.engagements.read ? `${r.engagements.count}` : `not read: ${r.engagements.detail ?? 'not configured'}`})`,
    `the commitments ledger (${r.commitments.count})`,
    `open deals (${r.deals.read ? deals.length : `not read: ${r.deals.detail ?? 'unknown'}`})`,
    `the vault's calls and meetings (${r.conversations.read ? r.conversations.count : 'not read'})`,
    `the suppression list`,
  ].filter((x): x is string => !!x).join('; ');

  return {
    person: { email, name: i.person.name },
    purpose,
    purposeWord: word,
    lastInbound: lastIn ? { at: lastIn.at, subject: lastIn.subject, purpose: lastIn.purpose, excerpt: lastIn.excerpt ? lastIn.excerpt.replace(/\s+/g, ' ').trim().slice(0, 160) : null, threadId: lastIn.threadId } : null,
    lastOutbound: lastOut ? { at: lastOut.at, subject: lastOut.subject, threadId: lastOut.threadId, source: lastOut.source } : null,
    laterResponse: laterResponse ? { at: laterResponse.at, subject: laterResponse.subject } : null,
    // An answer is owed only when our outbound history was read; otherwise it is not known, said as such.
    answerOwed: st
      ? st.answerOwed.owed && !outboundRead.read
        ? { owed: false, known: false, basis: `whether an answer went is not known: ${outboundRead.basis}` }
        : { owed: st.answerOwed.owed, known: true, basis: st.answerOwed.basis }
      : { owed: false, known: !!email, basis: email ? 'no message either way on record' : 'no address on record' },
    quiet: st ? { quiet: st.quiet.quiet, days: st.quiet.days, basis: st.quiet.basis } : { quiet: false, days: null, basis: 'no exchange on record either way' },
    request,
    requestState: request ? request.state : 'none',
    referral,
    outboundRead,
    reads: i.reads,
    correspondents,
    hubspotCompanyId: i.hubspotCompanyId,
    meetings: uniqueMeetings,
    nextMeetingAt: st?.nextMeetingAt ?? hubspotAhead,
    deals,
    promises,
    drafts: drafts.slice().reverse().slice(0, 3).map((d) => ({ at: d.at, subject: d.subject, to: d.to[0] ?? null, threadId: d.threadId, draftId: d.draftId ?? null })),
    optOut,
    links: { thread: lastIn?.threadId && GMAIL_THREAD_ID.test(lastIn.threadId) ? gmailThreadLink(lastIn.threadId, i.mailbox) : email ? gmailThreadHref(email, i.mailbox) : null, threadKind: lastIn?.threadId && GMAIL_THREAD_ID.test(lastIn.threadId) ? 'thread' : email ? 'search' : null, hubspotContact: i.hubspotContactId ? hubspotRecordUrl('contact', i.hubspotContactId) : null, hubspotCompany: i.hubspotCompanyId ? hubspotRecordUrl('company', i.hubspotCompanyId) : null },
    searched: `${searched}; read ${clock(i.now)}`,
  };
}

/** "Oct 5, 2026" on the seller's clock. */
export function dateWords(at: string | Date | null | undefined): string {
  if (!at) return 'an unknown date';
  // A date-only value ("2026-09-30") is that day, never shifted by the clock.
  if (typeof at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(at)) {
    const [y, m, d] = at.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  }
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? 'an unknown date' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
}

// ---------------------------------------------------------------------------
// The loader: the existing readers, each soft, each said in `searched`
// ---------------------------------------------------------------------------

export interface RelationshipQuery {
  accountName: string;
  email?: string | null;
  name?: string | null;
  personaId?: number | null;
  now: Date;
}

export interface RelationshipDeps {
  /** The thread context's readers (Sent, Drafts, own addresses); absent means the GAP mailbox when configured (promote-angle's mailboxThreadDeps). */
  thread?: ThreadContextDeps | null;
  /** The HubSpot company's engagements; absent means hubspot/engagements.ts with its cache and the env token. */
  engagements?: (companyId: string, now: Date) => Promise<{ items: Array<{ kind: 'note' | 'call' | 'meeting' | 'email'; at: string; title: string | null; body: string; id: string; from?: string | null; to?: string | null; direction?: 'incoming' | 'outgoing' | null }>; read: boolean; detail: string | null }>;
  /** The account's open deals; absent means not read (said). The assignment hands down dealsFromSummary over the summary it already read. */
  deals?: (accountName: string) => Promise<{ deals: RelationshipInputs['deals']; read: boolean; detail: string | null }>;
  /** The account's commitments; absent means work/commitments.ts loadCommitments. */
  commitments?: (accountName: string) => Promise<RelationshipInputs['commitments']>;
  /** The vault's held calls and meetings naming the person; absent means work/intel.ts conversationEvents. */
  conversations?: (email: string, now: Date) => Promise<StateEvent[]>;
  /** The HubSpot company for an account with none on its record (the opportunity identity the story uses); absent means opportunity/active-opportunity.ts. */
  companyFor?: (accountName: string) => Promise<string | null>;
  env?: Record<string, string | undefined>;
}

/** The HubSpot company the deals resolve for the account (the story's rule, B2 in account-intel/load.ts), soft. */
async function defaultCompanyFor(prisma: PrismaLike, accountName: string): Promise<string | null> {
  try {
    const { resolveAccountOpportunity } = await import('../opportunity/active-opportunity');
    const o = await resolveAccountOpportunity(prisma, accountName);
    return 'companyIds' in o ? o.companyIds[0] ?? null : null;
  } catch {
    return null;
  }
}

function defaultThreadDeps(env: Record<string, string | undefined>): ThreadContextDeps | null {
  const sender = gapGmailSender(env);
  if (!sender) return null;
  return { listSent: (recipient, afterEpoch, beforeEpoch) => listSentTo(sender, recipient, afterEpoch, beforeEpoch, { max: 50 }), listDrafts: (recipient) => listDraftsTo(sender, recipient), ownAddresses: new Set([sender.userEmail.toLowerCase()]), maxSentRecipients: 1 };
}

/**
 * The account's open deals from an in-deals summary the caller already holds (the assignment reads it once for the
 * deal coverage and hands it down; nothing here reads HubSpot). Null means not read, said.
 */
export function dealsFromSummary(summary: { status: string; error?: string; accounts: Array<{ accountName: string; alsoRecordedAs: string[]; deals: RelationshipInputs['deals'] }> } | null | undefined, accountName: string): { deals: RelationshipInputs['deals']; read: boolean; detail: string | null } {
  if (!summary) return { deals: [], read: false, detail: 'the in-deals summary was not read this time' };
  if (summary.status !== 'complete') return { deals: [], read: false, detail: summary.error ?? 'the HubSpot deal read was not complete' };
  const want = lower(accountName);
  const acct = summary.accounts.find((a) => lower(a.accountName) === want || a.alsoRecordedAs.some((n) => lower(n) === want)) ?? null;
  return { deals: acct?.deals ?? [], read: true, detail: null };
}

async function defaultCommitments(prisma: PrismaLike, accountName: string): Promise<RelationshipInputs['commitments']> {
  const rows = await loadCommitments(prisma, { accountNames: [accountName] });
  return rows.map((c) => ({ title: c.title, owner: c.owner, dueAt: c.dueAt, status: c.status, basis: c.basis, person: c.person ? { email: c.person.email, name: c.person.name } : null, proof: c.proof ? { at: c.proof.at, note: c.proof.note } : null }));
}

/**
 * The relationship state for one person at one account from the readers GAP already has. Every read is soft and
 * named in `searched`; a failed or unconfigured read is said, never counted as "nothing".
 */
export async function relationshipStateFor(prisma: PrismaLike, q: RelationshipQuery, deps: RelationshipDeps = {}): Promise<RelationshipState> {
  const env = deps.env ?? process.env;
  const persona = await findPersonaContact(prisma, { personaId: q.personaId ?? null, email: q.email ?? null, name: q.name ?? null, accountName: q.accountName, now: q.now }).catch(() => null);
  const email = lower(q.email) || lower(persona?.email) || null;
  const name = q.name ?? persona?.name ?? null;
  const account = typeof prisma?.account?.findUnique === 'function' ? ((await prisma.account.findUnique({ where: { name: q.accountName }, select: { hubspot_company_id: true } }).catch(() => null)) as { hubspot_company_id: string | null } | null) : null;

  const threadDeps = deps.thread === undefined ? defaultThreadDeps(env) : deps.thread;
  const mailbox = threadDeps?.ownAddresses ? [...threadDeps.ownAddresses][0] ?? null : null;
  const reads: RelationshipReads = {
    inbox: { read: false, count: 0, detail: email ? null : 'no address' },
    sent: { read: false, count: 0, detail: threadDeps?.listSent ? null : 'no GAP sender configured' },
    drafts: { read: false, count: 0, detail: threadDeps?.listDrafts ? null : 'no GAP sender configured' },
    engagements: { read: false, count: 0, detail: null },
    commitments: { read: false, count: 0 },
    deals: { read: false, detail: null },
    conversations: { read: false, count: 0 },
  };
  const events: RelationshipEvent[] = [];
  if (email) {
    try {
      const ctx = await loadThreadContext(prisma, { email, now: q.now }, threadDeps ?? {});
      const gmail = ctx.coverage.find((c) => c.source === 'gmail');
      const storeFailed = gmail?.reachable === false;
      const inboundCount = ctx.events.filter((e) => e.direction === 'inbound').length;
      reads.inbox = { read: !storeFailed, count: inboundCount, detail: storeFailed ? gmail?.omittedReason ?? 'could not be read' : null };
      const sentRows = ctx.events.filter((e) => e.direction === 'outbound' && !e.isDraft);
      const draftRows = ctx.events.filter((e) => e.direction === 'outbound' && e.isDraft);
      const reason = gmail?.omittedReason ?? '';
      reads.sent = threadDeps?.listSent ? { read: !/sent read failed/.test(reason), count: sentRows.length, detail: /sent read failed/.test(reason) ? reason : null } : reads.sent;
      reads.drafts = threadDeps?.listDrafts ? { read: !/drafts read failed/.test(reason), count: draftRows.length, detail: /drafts read failed/.test(reason) ? reason : null } : reads.drafts;
      for (const e of ctx.events) {
        if (e.direction === 'internal') continue;
        events.push({ id: e.id, at: e.at, direction: e.direction, type: e.type, isDraft: e.isDraft, from: e.from, to: e.to, subject: e.subject, excerpt: e.excerpt, purpose: e.purpose, threadId: e.threadId ?? null, calendar: e.calendar, providerIds: e.providerIds, source: e.isDraft ? 'Gmail drafts' : e.direction === 'outbound' ? 'Gmail Sent' : e.provider === 'hubspot' ? 'HubSpot (synced)' : "GAP's synced inbox" });
      }
    } catch (e) {
      reads.inbox = { read: false, count: 0, detail: e instanceof Error ? e.message : String(e) };
    }
  }
  // The account's people (name and address), for a referral in their words and for naming whom we wrote.
  const people: NonNullable<RelationshipInputs['people']> = typeof prisma?.persona?.findMany === 'function'
    ? ((await prisma.persona.findMany({ where: { account_name: q.accountName }, select: { name: true, email: true }, take: 200 }).catch(() => [])) as Array<{ name: string | null; email: string | null }>)
    : [];
  const nameOf = (address: string | null | undefined): string | null => (address ? people.find((p) => lower(p.email) === lower(address))?.name ?? null : null);
  const othersWritten: NonNullable<RelationshipInputs['othersWritten']> = [];
  const othersWrote: NonNullable<RelationshipInputs['othersWrote']> = [];
  // HubSpot engagements: the company's logged emails to or from the person are events; notes, calls and meetings ride
  // apart; the logged emails to and from OTHER people at the company are kept so a referral can be followed and a
  // name in the correspondence resolves to an address. The company: the account's own, else the one the deals resolve
  // (the story's rule; Kenco's record carries none while its deal does).
  const engagements: RelationshipInputs['engagements'] = [];
  let companyId = account?.hubspot_company_id ?? null;
  let companyVia = 'the account record';
  if (!companyId) {
    companyId = await (deps.companyFor ? deps.companyFor(q.accountName) : defaultCompanyFor(prisma, q.accountName)).catch(() => null);
    if (companyId) companyVia = 'the deals';
  }
  if (companyId) {
    try {
      const r = await (deps.engagements ? deps.engagements(companyId, q.now) : loadCompanyEngagements(companyId, { token: env.HUBSPOT_ACCESS_TOKEN, prisma, now: q.now }));
      reads.engagements = { read: r.read, count: r.items.length, detail: r.detail ?? (companyVia === 'the deals' ? 'the company resolved from the deals' : null) };
      const known = new Set(events.flatMap((e) => [e.id, ...(e.providerIds ?? [])]));
      for (const g of r.items) {
        if (g.kind === 'email') {
          const incoming = !!email && g.direction === 'incoming' && lower(g.from) === email;
          const outgoing = !!email && g.direction !== 'incoming' && lower(g.to) === email;
          if (!incoming && !outgoing) {
            if (g.direction !== 'incoming' && g.to && lower(g.to) !== email) othersWritten.push({ at: g.at, to: lower(g.to), toName: nameOf(g.to), subject: g.title, source: 'HubSpot (logged email)' });
            else if (g.direction === 'incoming' && g.from && lower(g.from) !== email && !/@(yardflow\.ai|freightroll\.com)$/i.test(g.from)) othersWrote.push({ at: g.at, from: lower(g.from), fromName: nameOf(g.from), subject: g.title, source: 'HubSpot (logged email)' });
            continue;
          }
          if (known.has(`hs:${g.id}`) || known.has(`hubspot:${g.id}`)) continue;
          events.push({ id: `hs:${g.id}`, at: g.at, direction: incoming ? 'inbound' : 'outbound', type: 'email', isDraft: false, from: incoming ? email : null, to: outgoing && email ? [email] : [], subject: g.title, excerpt: g.body || null, purpose: null, threadId: null, providerIds: [`hubspot:${g.id}`], source: 'HubSpot (logged email)' });
        } else engagements.push({ kind: g.kind, at: g.at, title: g.title, body: g.body, id: g.id });
      }
    } catch (e) {
      reads.engagements = { read: false, count: 0, detail: e instanceof Error ? e.message : String(e) };
    }
  } else reads.engagements = { read: false, count: 0, detail: 'no HubSpot company on the account record and none resolved from the deals' };

  if (email) {
    try {
      const conv = await (deps.conversations ? deps.conversations(email, q.now) : conversationEvents(prisma, [email], q.now));
      reads.conversations = { read: true, count: conv.length };
      for (const c of conv) events.push({ id: c.id, at: c.at, direction: 'inbound', type: c.type, isDraft: false, from: c.from, to: [...c.to], subject: c.conversation?.title ?? null, excerpt: null, purpose: 'buyer_conversation', threadId: null, conversation: c.conversation ?? null, source: 'the vault' });
    } catch {
      reads.conversations = { read: false, count: 0 };
    }
  }

  let commitments: RelationshipInputs['commitments'] = [];
  try {
    commitments = await (deps.commitments ? deps.commitments(q.accountName) : defaultCommitments(prisma, q.accountName));
    reads.commitments = { read: true, count: commitments.length };
  } catch {
    reads.commitments = { read: false, count: 0 };
  }
  const dealsRead = await (deps.deals ? deps.deals(q.accountName) : Promise.resolve(dealsFromSummary(null, q.accountName))).catch((e) => ({ deals: [] as RelationshipInputs['deals'], read: false, detail: e instanceof Error ? e.message : String(e) }));
  reads.deals = { read: dealsRead.read, detail: dealsRead.detail };

  let unsubscribed: RelationshipInputs['suppression']['unsubscribed'] = null;
  if (email && typeof prisma?.unsubscribedEmail?.findFirst === 'function') {
    const row = (await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { unsubscribed_at: true, reason: true } }).catch(() => null)) as { unsubscribed_at: Date | string | null; reason: string | null } | null;
    if (row) unsubscribed = { at: row.unsubscribed_at ? new Date(row.unsubscribed_at).toISOString() : null, reason: row.reason };
  }

  const typed = typeEvents(events, { knownPerson: !!persona });
  return relationshipStateFrom({
    person: { email, name },
    accountName: q.accountName,
    now: q.now,
    events: typed,
    engagements,
    commitments,
    deals: dealsRead.deals,
    suppression: { unsubscribed, doNotContact: !!persona?.do_not_contact },
    reads,
    mailbox,
    hubspotContactId: persona?.hubspot_contact_id ?? null,
    hubspotCompanyId: companyId,
    people,
    othersWritten,
    othersWrote,
  });
}
