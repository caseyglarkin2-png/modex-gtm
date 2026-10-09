/**
 * THREAD CONTEXT (C07, C08 and the read side of C47 of the commercial-context audit, 2026-10-08).
 *
 * One reusable adapter over what GAP already stores and reads: the InboundMessage rows (Gmail replies landed by
 * check-inbox and the GAP mailbox, HubSpot INCOMING_EMAIL engagements landed by the poller) and, when a Gmail reader
 * is injected, the seller's Sent and Drafts. It answers a bounded, typed timeline (TimelineEvent from the packet
 * contract) with the COVERAGE of every source said as what it is: complete, partial (a truncated read, an unread
 * Sent) or unknown (the store could not be read). It never calls the network by itself: no reader given means
 * "not read", never "no activity".
 *
 * C07  the excerpt is the author's own text: quoted earlier messages below an "On ... wrote:" or Outlook boundary
 *      are cut (quotedBelow says so), so a buyer's quote of our words is never a new buyer statement.
 * C08  a DRAFT is never a contact (type draft, isDraft, outbound); calendar invitations, updates, RSVPs and
 *      cancellations are typed calendar events with the meeting they belong to; duplicate RSVP copies for one
 *      meeting response collapse to one event; every provider id is kept (gmail:<id>, hubspot:<engagement>,
 *      rfc:<Message-ID>).
 * C47  one email seen through Gmail and HubSpot is ONE event with both provenance ids: merged by RFC Message-ID,
 *      then by a shared provider id, never by subject alone.
 */
import { stripQuotedReply } from '@/lib/email/gmail-inbox';
import type { SourceCoverage, TimelineEvent, TimelineType } from './commercial-context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type CalendarKind = 'invitation' | 'update' | 'accepted' | 'declined' | 'tentative' | 'cancelled';

export interface CalendarFacts {
  kind: CalendarKind;
  /** The meeting this message is about (title and the date text), so RSVP copies collapse on it. */
  meetingKey: string;
  startsAt: string | null;
}

export interface ThreadEvent extends TimelineEvent {
  threadId: string | null;
  calendar: CalendarFacts | null;
}

/** An InboundMessage row as stored (the fields this adapter reads). */
export interface StoredInbound {
  id: string;
  thread_id: string | null;
  rfc_message_id?: string | null;
  from_email: string;
  from_name?: string | null;
  subject?: string | null;
  body_text?: string | null;
  snippet?: string | null;
  received_at: Date | string;
  source?: string | null;
  hubspot_engagement_id?: string | null;
  /** The recipients when the store carries them (the mailbox keeps the headers; the poller keeps hs_email_to_email). */
  to?: string[] | null;
}

/** A Sent or Drafts message from an injected Gmail reader (SentMatch from unknown-send-reconcile is this shape). */
export interface OutboundMail {
  id: string;
  threadId: string | null;
  internalDate: Date;
  to: string;
  subject: string;
  text?: string | null;
  isDraft?: boolean;
  rfcMessageId?: string | null;
}

export interface ThreadContextQuery {
  email?: string | null;
  threadId?: string | null;
  accountName?: string | null;
  now: Date;
  /** Newest stored rows read; one more is asked for so a cut is reported as partial. Default 50. */
  limit?: number;
}

export interface ThreadContextDeps {
  /** The seller's Sent to one recipient in an epoch-seconds window (the same wiring briefing-send and copies-reconcile use). */
  listSent?: (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<OutboundMail[]>;
  /** The seller's Drafts to one recipient; each is typed draft and never counts as contact. */
  listDrafts?: (recipient: string) => Promise<OutboundMail[]>;
  /** The seller's own addresses; a message from one of them is outbound even when it was stored as inbound. */
  ownAddresses?: ReadonlySet<string>;
  /** How far back the Sent read looks. Default 120 days. */
  lookbackDays?: number;
  /** How many participants the Sent read is run for when the query names no address. Default 5. */
  maxSentRecipients?: number;
}

export interface ThreadContext {
  events: ThreadEvent[];
  participants: string[];
  coverage: SourceCoverage[];
}

export const EXCERPT_MAX = 1500;
const DAY_MS = 86_400_000;
const DEFAULT_LIMIT = 50;

/** Audit kind written when a message already stored under one provider is seen again through another (C47). */
export const PROVENANCE_LINKED_KIND = 'inbound.provenance_linked';
export const PROVENANCE_SUBJECT_TYPE = 'inbound_message';

export const lowerAddress = (s: string | null | undefined): string => (s ?? '').trim().toLowerCase();
export const addressOf = (s: string | null | undefined): string => lowerAddress((s ?? '').match(/[^\s<>,;"']+@[^\s<>,;"']+/)?.[0] ?? s);
export const addressesOf = (s: string | string[] | null | undefined): string[] => {
  const raw = Array.isArray(s) ? s : (s ?? '').split(/[,;]/);
  return [...new Set(raw.map((x) => addressOf(x)).filter((x) => x.includes('@')))];
};

const iso = (d: Date | string): string => new Date(d).toISOString();

// ---------------------------------------------------------------------------
// C07: the author's own text
// ---------------------------------------------------------------------------

/** A quote boundary the Gmail stripper does not cut: a bare "> " run in the middle, a mail client's "Sent from" tail. */
const QUOTE_LINE = /^\s*>/;
const SIGNATURE_TAIL = /^(?:--\s*$|sent from my \w+|get outlook for \w+)/i;

/**
 * The author's own words from a stored body: everything above the first quote boundary ("On ... wrote:", the Outlook
 * "-----Original Message-----" or "From:" block, a "> " run), bounded to EXCERPT_MAX. quotedBelow is true when anything
 * was cut, so a reader knows an earlier message sat under it and was NOT the author's statement.
 */
export function excerptOf(body: string | null | undefined, snippet?: string | null): { excerpt: string | null; quotedBelow: boolean } {
  const raw = (body ?? '').replace(/\r\n/g, '\n');
  if (!raw.trim()) {
    const s = (snippet ?? '').trim();
    return { excerpt: s ? s.slice(0, EXCERPT_MAX) : null, quotedBelow: false };
  }
  let own = stripQuotedReply(raw);
  let lines = own.split('\n');
  // A bottom-posted answer: the message opens with the quote; the author's words are what follows it.
  const firstText = lines.findIndex((l) => l.trim().length > 0);
  if (firstText >= 0 && QUOTE_LINE.test(lines[firstText])) {
    let i = firstText;
    while (i < lines.length && (QUOTE_LINE.test(lines[i]) || !lines[i].trim())) i += 1;
    lines = lines.slice(i);
  }
  const cut = lines.findIndex((l) => QUOTE_LINE.test(l));
  own = (cut >= 0 ? lines.slice(0, cut) : lines).join('\n');
  const tail = own.split('\n').findIndex((l) => SIGNATURE_TAIL.test(l.trim()));
  if (tail > 0) own = own.split('\n').slice(0, tail).join('\n');
  own = own.trim();
  const quotedBelow = own.length < raw.trim().length;
  if (!own) return { excerpt: null, quotedBelow };
  return { excerpt: own.length > EXCERPT_MAX ? `${own.slice(0, EXCERPT_MAX).trimEnd()}...` : own, quotedBelow };
}

// ---------------------------------------------------------------------------
// C08: draft, sent, received and calendar mail
// ---------------------------------------------------------------------------

const CALENDAR_RESPONSE = /^\s*(accepted|declined|tentatively accepted|tentative|canceled event|cancelled event|cancellation|canceled|cancelled)\s*:\s*/i;
const CALENDAR_INVITE = /^\s*(invitation|updated invitation|invitación|einladung|invite)\s*:?\s*/i;
const CALENDAR_SENDER = /calendar-notification|calendar-server|calendar@|invitations@|noreply-calendar/i;
const CALENDAR_HEADER = /text\/calendar|application\/ics/i;

function calendarKind(subject: string, from: string, headers: Record<string, string> | null | undefined): CalendarKind | null {
  const resp = subject.match(CALENDAR_RESPONSE);
  if (resp) {
    const w = resp[1].toLowerCase();
    if (w.startsWith('accepted')) return 'accepted';
    if (w.startsWith('declined')) return 'declined';
    if (w.startsWith('tentative')) return 'tentative';
    return 'cancelled';
  }
  const inv = subject.match(CALENDAR_INVITE);
  if (inv) return /^updated/i.test(inv[1]) ? 'update' : 'invitation';
  const ct = headers ? Object.entries(headers).find(([k]) => k.toLowerCase() === 'content-type')?.[1] ?? '' : '';
  if (CALENDAR_HEADER.test(ct)) return 'invitation';
  if (CALENDAR_SENDER.test(from) && /\b(invitation|invited|meeting|event)\b/i.test(subject)) return 'invitation';
  return null;
}

const TZ_OFFSET_MIN: Record<string, number> = { EDT: -240, EST: -300, CDT: -300, CST: -360, MDT: -360, MST: -420, PDT: -420, PST: -480, UTC: 0, GMT: 0, BST: 60, CET: 60, CEST: 120 };
const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

/** "Tue Oct 14, 2026 2pm - 3pm (EDT)" (Google's subject date) to an ISO instant; null when it does not parse. */
export function parseCalendarStart(dateText: string): string | null {
  const m = dateText.match(/(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+([a-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})(?:\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/i);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (month === undefined) return null;
  let hour = m[4] ? Number(m[4]) : 0;
  const minute = m[5] ? Number(m[5]) : 0;
  if (m[6]) {
    const pm = m[6].toLowerCase() === 'pm';
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  const tz = dateText.match(/\(([A-Z]{3,4})\)/)?.[1];
  const offset = tz && tz in TZ_OFFSET_MIN ? TZ_OFFSET_MIN[tz] : m[4] ? -240 : 0;
  const utc = Date.UTC(Number(m[3]), month, Number(m[2]), hour, minute) - offset * 60_000;
  return Number.isNaN(utc) ? null : new Date(utc).toISOString();
}

/** The meeting a calendar subject is about: the title and the date text, normalized, so two RSVP copies share it. */
export function meetingKeyOf(subject: string): { meetingKey: string; startsAt: string | null } {
  const stripped = subject.replace(CALENDAR_RESPONSE, '').replace(CALENDAR_INVITE, '').trim();
  const at = stripped.indexOf(' @ ');
  const title = (at >= 0 ? stripped.slice(0, at) : stripped).replace(/\s+/g, ' ').trim().toLowerCase();
  const dateText = at >= 0 ? stripped.slice(at + 3).replace(/\s*\([^)]*@[^)]*\)\s*$/, '').trim() : '';
  return { meetingKey: dateText ? `${title}|${dateText.replace(/\s+/g, ' ').toLowerCase()}` : title, startsAt: dateText ? parseCalendarStart(dateText) : null };
}

export interface MailTypeInput {
  subject: string | null | undefined;
  from: string | null | undefined;
  headers?: Record<string, string> | null;
  isDraft?: boolean;
}

/** C08: what kind of mail this is. A draft is a draft whatever its subject; calendar mail is typed with its meeting. */
export function classifyMailType(input: MailTypeInput): { type: TimelineType; isDraft: boolean; calendar: CalendarFacts | null } {
  if (input.isDraft) return { type: 'draft', isDraft: true, calendar: null };
  const subject = (input.subject ?? '').trim();
  const kind = calendarKind(subject, lowerAddress(input.from), input.headers);
  if (!kind) return { type: 'email', isDraft: false, calendar: null };
  const { meetingKey, startsAt } = meetingKeyOf(subject);
  return { type: 'calendar', isDraft: false, calendar: { kind, meetingKey, startsAt } };
}

// ---------------------------------------------------------------------------
// The RFC Message-ID as a key (C47, C57 F16)
// ---------------------------------------------------------------------------

/**
 * One form of an RFC 2822 Message-ID for matching: trimmed, the angle brackets dropped, lowercased. Gmail reports
 * `<abc@host>`, HubSpot's hs_email_message_id may report `abc@host`; a stored row may hold either. Null for nothing.
 */
export function normalizeRfcId(raw: string | null | undefined): string | null {
  const core = (raw ?? '').trim().replace(/^<+/, '').replace(/>+$/, '').trim().toLowerCase();
  return core ? core : null;
}

/** The stored spellings one Message-ID may have: with and without brackets (a lookup uses them case-insensitively). */
export function rfcVariants(raw: string | null | undefined): string[] {
  const core = normalizeRfcId(raw);
  if (!core) return [];
  const given = (raw ?? '').trim();
  return [...new Set([core, `<${core}>`, given].filter(Boolean))];
}

/** A Prisma `where` on rfc_message_id that matches any spelling of the id, case-insensitively; null for nothing. */
export function rfcWhere(raw: string | null | undefined): { in: string[]; mode: 'insensitive' } | null {
  const v = rfcVariants(raw);
  return v.length ? { in: v, mode: 'insensitive' } : null;
}

/**
 * Record that a stored message was seen again through another provider id (`gmail:<id>` or `hubspot:<id>`), once
 * per provider id. Soft: a store without the audit delegate records nothing and reports false.
 */
export async function linkProvenance(prisma: PrismaLike, input: { storedId: string; providerId: string; actor: string; rfcMessageId?: string | null; extra?: Record<string, unknown> }): Promise<boolean> {
  if (typeof prisma?.gapAuditEvent?.findFirst !== 'function' || typeof prisma?.gapAuditEvent?.create !== 'function') return false;
  const linked = await prisma.gapAuditEvent.findFirst({ where: { kind: PROVENANCE_LINKED_KIND, subject_type: PROVENANCE_SUBJECT_TYPE, subject_id: input.storedId, payload: { path: ['providerId'], equals: input.providerId } }, select: { id: true } });
  if (linked) return false;
  await prisma.gapAuditEvent.create({ data: { kind: PROVENANCE_LINKED_KIND, actor: input.actor, subject_type: PROVENANCE_SUBJECT_TYPE, subject_id: input.storedId, payload: { providerId: input.providerId, rfcMessageId: input.rfcMessageId ?? null, ...(input.extra ?? {}) } } });
  return true;
}

// ---------------------------------------------------------------------------
// Rows to events
// ---------------------------------------------------------------------------

export function providerIdsOf(row: Pick<StoredInbound, 'id' | 'rfc_message_id' | 'source' | 'hubspot_engagement_id'>): string[] {
  const ids: string[] = [];
  const source = row.source ?? (row.id.startsWith('hs:') ? 'hubspot' : 'gmail');
  if (source === 'hubspot') ids.push(`hubspot:${row.hubspot_engagement_id ?? row.id.replace(/^hs:/, '')}`);
  else {
    ids.push(`gmail:${row.id}`);
    if (row.hubspot_engagement_id) ids.push(`hubspot:${row.hubspot_engagement_id}`);
  }
  const rfc = normalizeRfcId(row.rfc_message_id);
  if (rfc) ids.push(`rfc:${rfc}`);
  return ids;
}

export function inboundToEvent(row: StoredInbound, opts: { ownAddresses?: ReadonlySet<string>; headers?: Record<string, string> | null } = {}): ThreadEvent {
  const from = lowerAddress(row.from_email);
  const own = !!opts.ownAddresses?.has(from);
  const typed = classifyMailType({ subject: row.subject, from, headers: opts.headers });
  const { excerpt, quotedBelow } = excerptOf(row.body_text, row.snippet);
  const source = row.source ?? (row.id.startsWith('hs:') ? 'hubspot' : 'gmail');
  return {
    id: row.id,
    at: iso(row.received_at),
    direction: own ? 'outbound' : 'inbound',
    type: typed.type,
    provider: source === 'hubspot' ? 'hubspot' : 'gmail',
    providerIds: providerIdsOf(row),
    from,
    to: addressesOf(row.to ?? null),
    subject: row.subject ?? null,
    excerpt,
    isDraft: false,
    purpose: null,
    quotedBelow,
    threadId: row.thread_id ?? null,
    calendar: typed.calendar,
  };
}

export function outboundToEvent(m: OutboundMail, opts: { from?: string | null } = {}): ThreadEvent {
  const typed = classifyMailType({ subject: m.subject, from: opts.from ?? null, isDraft: m.isDraft === true });
  const { excerpt, quotedBelow } = excerptOf(m.text ?? null);
  const ids = [`gmail:${m.id}`];
  const rfc = normalizeRfcId(m.rfcMessageId);
  if (rfc) ids.push(`rfc:${rfc}`);
  return {
    id: m.id,
    at: iso(m.internalDate),
    direction: 'outbound',
    type: typed.type,
    provider: 'gmail',
    providerIds: ids,
    from: lowerAddress(opts.from) || null,
    to: addressesOf(m.to),
    subject: m.subject || null,
    excerpt,
    isDraft: typed.isDraft,
    purpose: null,
    quotedBelow,
    threadId: m.threadId,
    calendar: typed.calendar,
  };
}

// ---------------------------------------------------------------------------
// C47 (read side) and C08: one event per message, one event per RSVP
// ---------------------------------------------------------------------------

/**
 * One event per message: two events that share an rfc: id, or any provider id, are the same message and become one
 * with the union of their provider ids (the Gmail-stored row wins the id; the earliest time stands). Subject alone
 * never merges anything.
 */
export function mergeProvenance(events: readonly ThreadEvent[]): ThreadEvent[] {
  const out: ThreadEvent[] = [];
  const byKey = new Map<string, ThreadEvent>();
  for (const e of events) {
    const keys = e.providerIds.filter((p) => p.startsWith('rfc:') || p.startsWith('gmail:') || p.startsWith('hubspot:'));
    const hit = keys.map((k) => byKey.get(k)).find((x): x is ThreadEvent => !!x);
    if (!hit) {
      const copy = { ...e, providerIds: [...e.providerIds] };
      out.push(copy);
      for (const k of keys) byKey.set(k, copy);
      continue;
    }
    for (const p of e.providerIds) if (!hit.providerIds.includes(p)) hit.providerIds.push(p);
    if (e.at < hit.at) hit.at = e.at;
    if (!hit.excerpt && e.excerpt) {
      hit.excerpt = e.excerpt;
      hit.quotedBelow = e.quotedBelow;
    }
    if (hit.provider === 'hubspot' && e.provider === 'gmail') {
      hit.id = e.id;
      hit.provider = 'gmail';
    }
    for (const k of keys) byKey.set(k, hit);
  }
  return out;
}

/** C08: duplicate copies of one calendar response (the same sender, the same meeting, the same answer) are one event. */
export function collapseCalendarResponses(events: readonly ThreadEvent[]): ThreadEvent[] {
  const out: ThreadEvent[] = [];
  const seen = new Map<string, ThreadEvent>();
  for (const e of events) {
    if (e.type !== 'calendar' || !e.calendar) {
      out.push(e);
      continue;
    }
    const key = `${e.from ?? ''}|${e.calendar.kind}|${e.calendar.meetingKey}`;
    const hit = seen.get(key);
    if (!hit) {
      const copy = { ...e, providerIds: [...e.providerIds] };
      seen.set(key, copy);
      out.push(copy);
      continue;
    }
    for (const p of e.providerIds) if (!hit.providerIds.includes(p)) hit.providerIds.push(p);
    if (e.at < hit.at) hit.at = e.at;
  }
  return out;
}

/** The pure composition: inbound rows and outbound mail to one typed, merged, time-ordered timeline. */
export function buildTimeline(inbound: readonly StoredInbound[], outbound: readonly OutboundMail[], opts: { ownAddresses?: ReadonlySet<string>; sellerAddress?: string | null; provenance?: ReadonlyMap<string, string[]> } = {}): ThreadEvent[] {
  const events = [
    ...inbound.map((r) => {
      const e = inboundToEvent(r, { ownAddresses: opts.ownAddresses });
      for (const p of opts.provenance?.get(r.id) ?? []) if (!e.providerIds.includes(p)) e.providerIds.push(p);
      return e;
    }),
    ...outbound.map((m) => outboundToEvent(m, { from: opts.sellerAddress ?? null })),
  ];
  // Oldest first before merging, so the first copy seen is the one that keeps the id and the earliest time.
  const byTime = (a: ThreadEvent, b: ThreadEvent) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.id.localeCompare(b.id));
  return collapseCalendarResponses(mergeProvenance(events.sort(byTime))).sort(byTime);
}

// ---------------------------------------------------------------------------
// The stored read
// ---------------------------------------------------------------------------

function coverage(source: SourceCoverage['source'], c: Partial<SourceCoverage>): SourceCoverage {
  return { source, configured: true, reachable: true, completeness: 'complete', watermark: null, indexedAt: null, query: null, omittedReason: null, ...c };
}

const newestAt = (events: readonly ThreadEvent[]): string | null => events.reduce<string | null>((m, e) => (m === null || e.at > m ? e.at : m), null);

/**
 * The bounded thread context for one address, one thread or one account, from the store (and Sent and Drafts when a
 * reader is injected). A store that cannot be read answers no events and coverage unknown; a read cut at the limit
 * answers partial; an unread Sent answers partial for Gmail with the reason. Never a network call of its own.
 */
export async function loadThreadContext(prisma: PrismaLike, q: ThreadContextQuery, deps: ThreadContextDeps = {}): Promise<ThreadContext> {
  const limit = Math.max(1, q.limit ?? DEFAULT_LIMIT);
  const email = lowerAddress(q.email);
  const queryText = email ? `address ${email}` : q.threadId ? `thread ${q.threadId}` : q.accountName ? `account ${q.accountName}` : 'nothing';
  const own = new Set([...(deps.ownAddresses ?? [])].map(lowerAddress));

  let rows: StoredInbound[] = [];
  let readError: string | null = null;
  try {
    if (!email && !q.threadId && !q.accountName) throw new Error('no address, thread or account to read');
    if (typeof prisma?.inboundMessage?.findMany !== 'function') throw new Error('inbound store not readable');
    let where: Record<string, unknown>;
    if (q.threadId) where = { thread_id: q.threadId };
    else if (email) where = { from_email: { equals: email, mode: 'insensitive' } };
    else {
      const threads: Array<{ id: string }> = await prisma.emailThread.findMany({ where: { account_name: q.accountName }, select: { id: true } });
      where = { thread_id: { in: threads.map((t) => t.id) } };
    }
    rows = await prisma.inboundMessage.findMany({
      where,
      orderBy: { received_at: 'desc' },
      take: limit + 1,
      select: { id: true, thread_id: true, rfc_message_id: true, from_email: true, from_name: true, subject: true, body_text: true, snippet: true, received_at: true, source: true, hubspot_engagement_id: true },
    });
  } catch (e) {
    readError = e instanceof Error ? e.message : String(e);
  }
  const truncated = rows.length > limit;
  if (truncated) rows = rows.slice(0, limit);

  // C47: provenance links recorded when a stored message was seen again through the other provider.
  const provenance = new Map<string, string[]>();
  if (rows.length && typeof prisma?.gapAuditEvent?.findMany === 'function') {
    try {
      const links: Array<{ subject_id: string; payload: unknown }> = await prisma.gapAuditEvent.findMany({ where: { kind: PROVENANCE_LINKED_KIND, subject_type: PROVENANCE_SUBJECT_TYPE, subject_id: { in: rows.map((r) => r.id) } }, select: { subject_id: true, payload: true } });
      for (const l of links) {
        const p = l.payload && typeof l.payload === 'object' ? (l.payload as { providerId?: unknown }) : {};
        if (typeof p.providerId === 'string') provenance.set(l.subject_id, [...(provenance.get(l.subject_id) ?? []), p.providerId]);
      }
    } catch {
      // The links are an enrichment; the rows stand without them.
    }
  }

  // Participants: the query address, every sender, every recipient the store knows.
  const participants = new Set<string>();
  if (email) participants.add(email);
  for (const r of rows) {
    const f = lowerAddress(r.from_email);
    if (f && !own.has(f)) participants.add(f);
    for (const t of addressesOf(r.to ?? null)) if (!own.has(t)) participants.add(t);
  }

  // Sent and Drafts, only through an injected reader, per participant, bounded.
  const outbound: OutboundMail[] = [];
  let sentReason: string | null = null;
  const recipients = [...participants].slice(0, deps.maxSentRecipients ?? 5);
  if (deps.listSent && recipients.length) {
    const after = Math.floor((q.now.getTime() - (deps.lookbackDays ?? 120) * DAY_MS) / 1000);
    const before = Math.ceil(q.now.getTime() / 1000) + 60;
    for (const r of recipients) {
      try {
        outbound.push(...(await deps.listSent(r, after, before)).map((m) => ({ ...m, isDraft: false })));
      } catch (e) {
        sentReason = `sent read failed for ${r}: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  } else if (!deps.listSent) sentReason = 'sent not read: no Gmail reader given';
  if (deps.listDrafts && recipients.length) {
    for (const r of recipients) {
      try {
        outbound.push(...(await deps.listDrafts(r)).map((m) => ({ ...m, isDraft: true })));
      } catch (e) {
        sentReason = sentReason ?? `drafts read failed for ${r}: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  }

  const sellerAddress = [...own][0] ?? null;
  const events = readError ? [] : buildTimeline(rows, outbound, { ownAddresses: own, sellerAddress, provenance });
  const gmailEvents = events.filter((e) => e.provider === 'gmail');
  const hubspotEvents = events.filter((e) => e.provider === 'hubspot');
  const storeQuery = `stored inbound for ${queryText}, newest ${limit}`;

  const gmail = readError
    ? coverage('gmail', { reachable: false, completeness: 'unknown', query: storeQuery, omittedReason: readError })
    : coverage('gmail', { completeness: truncated || sentReason ? 'partial' : 'complete', watermark: newestAt(gmailEvents), query: deps.listSent ? `${storeQuery}; sent to ${recipients.join(', ') || 'nobody'} over ${deps.lookbackDays ?? 120} days` : storeQuery, omittedReason: truncated ? `read cut at ${limit} newest rows${sentReason ? `; ${sentReason}` : ''}` : sentReason });
  const hubspot = readError
    ? coverage('hubspot_engagement', { reachable: false, completeness: 'unknown', query: storeQuery, omittedReason: readError })
    : coverage('hubspot_engagement', { completeness: truncated ? 'partial' : 'complete', watermark: newestAt(hubspotEvents), query: storeQuery, omittedReason: truncated ? `read cut at ${limit} newest rows` : null });

  return { events, participants: [...participants], coverage: [gmail, hubspot] };
}
