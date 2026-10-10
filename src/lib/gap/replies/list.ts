/**
 * Reply list (GAP Prospecting OS, Sprint 4, S4-T3): `GET /api/gap/replies`.
 *
 * InboundMessage rows from BOTH sources (Gmail rows and the HubSpot poller's
 * `hs:<engagementId>` rows) for addresses the GAP motion knows: an address
 * with a SequenceEnrollment, or the email of a Persona that carries a
 * ProspectingHypothesis. Each row is left-joined to its disposition by
 * (source_kind, source_id) = (`inbound_message` | `hubspot_engagement`,
 * InboundMessage.id): the source id is ALWAYS the inbound row's id, in the
 * `hs:` form for HubSpot, so the two writers (this list, the suggestion, the
 * human's submit) agree on the key without a lookup.
 *
 * `undispositioned` means no HUMAN-CONFIRMED disposition for the source. An
 * unconfirmed AI suggestion row (created_by `ai`, see ./suggest.ts) is not a
 * disposition: the reply stays in the triage list and its suggestion rides
 * along as `suggestion` with the row id the form sends back as
 * `aiSuggestionId`. (The spec's shorthand "no row" would hide every reply
 * the AI had looked at, which is the opposite of what triage needs.)
 *
 * `snippet` is the first 280 characters of the PLAIN text: body_text, else
 * body_html with tags stripped, else the stored snippet; HTML never reaches
 * the client through this field. Whitespace is collapsed.
 *
 * Paging: newest first by (received_at, id); `cursor` is the last id of the
 * previous page. The undispositioned filter runs after the fetch, so the
 * loop keeps pulling pages (bounded) until `limit` rows or the end.
 *
 * House convention for DB glue is `prisma: any`. Voice: no em dashes.
 */

import { LIVE_ENROLLMENT_STATUSES } from '../sequence/family';
import { AUTO_REPLY_SUBJECT, FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';
import { areTwins, twinGroups, TWIN_WINDOW_MS, type TwinCandidate } from './twins';
import { REPLY_SENT, REPLY_SUBJECT_TYPE } from '../execution/draft-ledger';
import { REPLY_RESOLVED } from '../work/recorded-replies';

export const SNIPPET_LENGTH = 280;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;
/** How many DB pages the undispositioned filter may walk per call before returning short. */
const MAX_PAGES = 6;

export type ReplyState = 'undispositioned' | 'all';
export type ReplySourceKind = 'inbound_message' | 'hubspot_engagement';

export interface ReplySuggestionBid {
  type: string;
  quote: string;
  why: string;
}

export interface StoredSuggestion {
  /** The unconfirmed AI disposition row; the form sends it back as `aiSuggestionId`. */
  id: string;
  responseClass: string;
  bids: ReplySuggestionBid[];
  why: string;
}

export interface ReplyItem {
  id: string;
  source: { kind: ReplySourceKind; id: string };
  contactEmail: string;
  personaId: number | null;
  accountName: string;
  hypothesisId: string;
  hypothesisTitle: string | null;
  subject: string | null;
  snippet: string;
  receivedAt: string;
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  suggestion?: StoredSuggestion | null;
  /** The confirmed disposition, when state=all returns a dispositioned reply. */
  dispositionId?: string | null;
  /**
   * Phase 2 D5: an ACCOUNT-LEVEL / COLLEAGUE reply: from someone at a GAP account's
   * domain who is not a known GAP recipient. Its words belong to its sender
   * (`contactEmail`, no persona), never to the colleague GAP emailed.
   */
  accountLevel?: boolean;
  /** R42: the Gmail thread of the message (Gmail rows), for "answer it in the thread". */
  threadId?: string | null;
  /** R42: the sender's display name, when the mailbox gave one. */
  fromName?: string | null;
  /** R42: the other imports of this same message (a Gmail copy and a HubSpot copy are one reply). */
  twinIds?: string[];
  /** Batch item 8: the sender's HubSpot contact id when GAP holds it (Work binds Capture to their own deal). */
  hubspotContactId?: string | null;
  /** Batch item 8: when GAP sent the answer in their thread (the record of the reply; never asked to be recorded). */
  answeredAt?: string | null;
  /** The walk fix (2026-10-10): when the seller settled it by his word (a DONE on its item); never asked again. */
  resolvedAt?: string | null;
}

export interface ListRepliesInput {
  state?: ReplyState;
  cursor?: string | null;
  limit?: number;
  /** R60: one account's replies (the account page records them where the seller already is). */
  accountName?: string | null;
}

export interface RepliesPage {
  items: ReplyItem[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

/** Tags out (block tags become a space, inline tags nothing), entities decoded for the common few, whitespace collapsed. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|div|li|tr|td|th|ul|ol|table|blockquote|h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** The plain text of an inbound row: body_text, else body_html stripped, else the stored snippet. */
export function plainTextOf(row: { body_text?: string | null; body_html?: string | null; snippet?: string | null }): string {
  if (typeof row.body_text === 'string' && row.body_text.trim().length > 0) return row.body_text.replace(/\s+/g, ' ').trim();
  if (typeof row.body_html === 'string' && row.body_html.trim().length > 0) return htmlToText(row.body_html);
  if (typeof row.snippet === 'string') return htmlToText(row.snippet);
  return '';
}

export function snippetOf(row: { body_text?: string | null; body_html?: string | null; snippet?: string | null }): string {
  return plainTextOf(row).slice(0, SNIPPET_LENGTH);
}

/** The disposition source for an inbound row: kind by the row's source, id ALWAYS the row id. */
export function sourceOfInbound(row: { id: string; source?: string | null }): { kind: ReplySourceKind; id: string } {
  return { kind: row.source === 'hubspot' ? 'hubspot_engagement' : 'inbound_message', id: row.id };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read a stored suggestion off an AI disposition row; null when the JSON is not the shape suggest.ts writes. */
export function suggestionFromRow(row: { id: string; human_confirmed: boolean; created_by: string; ai_suggested: unknown }): StoredSuggestion | null {
  if (row.human_confirmed || row.created_by !== 'ai' || !isPlainObject(row.ai_suggested)) return null;
  const s = row.ai_suggested;
  if (typeof s.responseClass !== 'string') return null;
  const bids = Array.isArray(s.bids)
    ? s.bids
        .filter(isPlainObject)
        .filter((b) => typeof b.type === 'string' && typeof b.quote === 'string')
        .map((b) => ({ type: b.type as string, quote: b.quote as string, why: typeof b.why === 'string' ? b.why : '' }))
    : [];
  return { id: row.id, responseClass: s.responseClass, bids, why: typeof s.why === 'string' ? s.why : '' };
}

// ---------------------------------------------------------------------------
// Address resolution (shared with suggest.ts)
// ---------------------------------------------------------------------------

export interface KnownAddress {
  email: string;
  personaId: number | null;
  accountName: string | null;
  hubspotContactId: string | null;
  /** The live enrollment on the address, else the newest one. */
  enrollmentId: string | null;
  enrollmentStatus: string | null;
  /** The enrollment's hypothesis, else the persona's active hypothesis, else the persona's newest. */
  hypothesisId: string | null;
  hypothesisTitle: string | null;
}

interface EnrollmentRow {
  id: string;
  to_email: string;
  status: string;
  hypothesis_id: string | null;
  persona_id: number | null;
  account_name: string;
  hubspot_contact_id: string | null;
  enrolled_at: Date;
}

interface PersonaRow {
  id: number;
  email: string | null;
  account_name: string;
  hubspot_contact_id: string | null;
  prospecting_hypotheses: Array<{ id: string; status: string; problem_family: string; created_at: Date }>;
}

const HYPOTHESIS_ORDER: Record<string, number> = { active: 0, approved: 1, review_required: 2, draft: 3 };

function pickHypothesis(rows: PersonaRow['prospecting_hypotheses']): { id: string; problem_family: string } | null {
  if (rows.length === 0) return null;
  const sorted = rows.slice().sort((a, b) => {
    const ra = HYPOTHESIS_ORDER[a.status] ?? 9;
    const rb = HYPOTHESIS_ORDER[b.status] ?? 9;
    if (ra !== rb) return ra - rb;
    return b.created_at.getTime() - a.created_at.getTime();
  });
  return sorted[0];
}

/**
 * Every address the GAP motion knows, keyed by lowercased email. One query
 * over enrollments and one over personas with hypotheses; the sets are
 * small (hundreds) in Phase 1.
 */
export async function loadKnownAddresses(prisma: any): Promise<Map<string, KnownAddress>> {
  const enrollments: EnrollmentRow[] = await prisma.sequenceEnrollment.findMany({
    select: {
      id: true,
      to_email: true,
      status: true,
      hypothesis_id: true,
      persona_id: true,
      account_name: true,
      hubspot_contact_id: true,
      enrolled_at: true,
    },
    orderBy: { enrolled_at: 'desc' },
  });
  const personas: PersonaRow[] = await prisma.persona.findMany({
    where: { email: { not: null }, prospecting_hypotheses: { some: {} } },
    // SF8 (Opus adversarial review, 2026-09-24): explicit, deterministic
    // order so duplicate-email resolution below is reproducible rather than
    // whatever order the DB happens to return.
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      account_name: true,
      hubspot_contact_id: true,
      prospecting_hypotheses: { select: { id: true, status: true, problem_family: true, created_at: true } },
    },
  });

  const map = new Map<string, KnownAddress>();
  const hypothesisTitles = new Map<string, string>();
  for (const p of personas) {
    const email = normalizeEmail(p.email);
    if (!email) continue;
    // SF8: when two personas share an email, the lowest-id persona wins,
    // never the last one the query happened to return. This is the SAME
    // rule hubspot-poller.ts's loadScopedPersonas uses to resolve a reply's
    // persona; the two disagreeing let a reply mean one persona/hypothesis
    // to the poller and a different one to reply triage.
    if (map.has(email)) continue;
    const hyp = pickHypothesis(p.prospecting_hypotheses);
    for (const h of p.prospecting_hypotheses) hypothesisTitles.set(h.id, h.problem_family);
    map.set(email, {
      email,
      personaId: p.id,
      accountName: p.account_name,
      hubspotContactId: p.hubspot_contact_id ?? null,
      enrollmentId: null,
      enrollmentStatus: null,
      hypothesisId: hyp?.id ?? null,
      hypothesisTitle: hyp?.problem_family ?? null,
    });
  }
  // Batch item 8 (R62 matrix): a person GAP holds who is a HubSpot contact (an open deal's own contact) is known even
  // with no GAP thesis and no enrollment: their reply is the buyer talking on a live deal, never dropped. The account
  // and the person come from the persona; no thesis is invented.
  const contacts: Array<{ id: number; email: string | null; account_name: string; hubspot_contact_id: string | null }> =
    (await prisma.persona
      .findMany({ where: { email: { not: null }, hubspot_contact_id: { not: null }, prospecting_hypotheses: { none: {} } }, orderBy: { id: 'asc' }, select: { id: true, email: true, account_name: true, hubspot_contact_id: true } })
      .catch(() => [])) ?? [];
  for (const p of contacts) {
    const email = normalizeEmail(p.email);
    if (!email || map.has(email) || !p.hubspot_contact_id) continue;
    map.set(email, { email, personaId: p.id, accountName: p.account_name, hubspotContactId: String(p.hubspot_contact_id), enrollmentId: null, enrollmentStatus: null, hypothesisId: null, hypothesisTitle: null });
  }
  const live = new Set<string>(LIVE_ENROLLMENT_STATUSES);
  for (const e of enrollments) {
    const email = normalizeEmail(e.to_email);
    if (!email) continue;
    const known = map.get(email) ?? {
      email,
      personaId: e.persona_id ?? null,
      accountName: e.account_name,
      hubspotContactId: e.hubspot_contact_id ?? null,
      enrollmentId: null,
      enrollmentStatus: null,
      hypothesisId: null,
      hypothesisTitle: null,
    };
    // Rows arrive newest first; a live enrollment wins over a newer finished one.
    const current = known.enrollmentStatus;
    const take = known.enrollmentId === null || (!live.has(current ?? '') && live.has(e.status));
    if (take) {
      known.enrollmentId = e.id;
      known.enrollmentStatus = e.status;
      if (e.hypothesis_id) {
        known.hypothesisId = e.hypothesis_id;
        known.hypothesisTitle = hypothesisTitles.get(e.hypothesis_id) ?? known.hypothesisTitle;
      }
      if (known.personaId === null && e.persona_id !== null) known.personaId = e.persona_id;
      if (known.accountName === null) known.accountName = e.account_name;
    }
    map.set(email, known);
  }
  return map;
}

/**
 * Batch item 8 (finding 3): the messages GAP already answered in their thread (a REPLY_SENT row), with when. A sent
 * answer is the record of the reply: it is not listed for triage and its account is never asked to record it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- house convention for DB glue
export async function answeredMessages(prisma: any, ids: readonly string[]): Promise<Map<string, string>> {
  if (!ids.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Map();
  const rows: Array<{ kind?: string; subject_type?: string; subject_id: string; created_at: Date }> = await prisma.gapAuditEvent
    .findMany({ where: { kind: REPLY_SENT, subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: [...ids] } }, select: { kind: true, subject_type: true, subject_id: true, created_at: true } })
    .catch(() => []);
  const wanted = new Set(ids);
  return new Map((rows ?? []).filter((r) => r.kind === REPLY_SENT && wanted.has(String(r.subject_id))).map((r) => [String(r.subject_id), new Date(r.created_at).toISOString()]));
}

/**
 * The walk fix (2026-10-10): the messages the seller SETTLED by his word (a DONE on the reply's item writes the C35
 * resolution row, work/recorded-replies.ts REPLY_RESOLVED), with when. Like a sent answer, a settled reply is not
 * listed for triage and never returns as "Someone replied". An opt-out is never settled this way (commands-apply.ts).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- house convention for DB glue
export async function resolvedMessages(prisma: any, ids: readonly string[]): Promise<Map<string, string>> {
  if (!ids.length || typeof prisma?.gapAuditEvent?.findMany !== 'function') return new Map();
  const rows: Array<{ kind?: string; subject_type?: string; subject_id: string; created_at: Date }> = await prisma.gapAuditEvent
    .findMany({ where: { kind: REPLY_RESOLVED, subject_type: REPLY_SUBJECT_TYPE, subject_id: { in: [...ids] } }, select: { kind: true, subject_type: true, subject_id: true, created_at: true } })
    .catch(() => []);
  const wanted = new Set(ids);
  return new Map((rows ?? []).filter((r) => r.kind === REPLY_RESOLVED && wanted.has(String(r.subject_id))).map((r) => [String(r.subject_id), new Date(r.created_at).toISOString()]));
}

// ---------------------------------------------------------------------------
// listReplies
// ---------------------------------------------------------------------------

interface InboundRow {
  id: string;
  source?: string | null;
  thread_id?: string | null;
  from_name?: string | null;
  from_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  snippet: string | null;
  received_at: Date;
}

interface DispositionJoinRow {
  id: string;
  source_kind: string;
  source_id: string;
  human_confirmed: boolean;
  created_by: string;
  ai_suggested: unknown;
}

/** How far back an account-level (colleague) reply is surfaced in triage. */
export const COLLEAGUE_REPLY_WINDOW_DAYS = 60;
const COLLEAGUE_MAX_DOMAINS = 200;

/**
 * Phase 2 D5: replies from someone at a GAP account's domain who is NOT a known
 * GAP recipient (an assistant, a colleague the email was forwarded to). The
 * account and thesis come from the known recipient at that domain; the words
 * stay the sender's. First page only; newest first; auto-replies excluded.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- house convention for DB glue
export async function loadColleagueReplies(prisma: any, known: Map<string, KnownAddress>, state: ReplyState, now: Date = new Date()): Promise<ReplyItem[]> {
  const byDomain = new Map<string, KnownAddress>();
  for (const k of known.values()) {
    const d = (k.email.split('@')[1] ?? '').toLowerCase();
    if (!d || FREEMAIL_DOMAINS.has(d) || OWN_DOMAINS.has(d)) continue;
    const cur = byDomain.get(d);
    if (!cur || (!cur.hypothesisId && k.hypothesisId)) byDomain.set(d, k);
  }
  const domains = [...byDomain.keys()].slice(0, COLLEAGUE_MAX_DOMAINS);
  if (domains.length === 0) return [];
  const rows: InboundRow[] = await prisma.inboundMessage.findMany({
    where: {
      OR: domains.map((d) => ({ from_email: { endsWith: `@${d}`, mode: 'insensitive' } })),
      received_at: { gte: new Date(now.getTime() - COLLEAGUE_REPLY_WINDOW_DAYS * 86_400_000) },
    },
    orderBy: [{ received_at: 'desc' }, { id: 'desc' }],
    take: 100,
    select: { id: true, source: true, thread_id: true, from_email: true, from_name: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true },
  });
  const colleague = rows.filter((r) => !known.has(normalizeEmail(r.from_email)) && !AUTO_REPLY_SUBJECT.test(r.subject ?? ''));
  if (colleague.length === 0) return [];
  const joined: DispositionJoinRow[] = await prisma.conversationDisposition.findMany({
    where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: colleague.map((r) => r.id) } },
    select: { id: true, source_kind: true, source_id: true, human_confirmed: true, created_by: true, ai_suggested: true },
  });
  const confirmed = new Map<string, string>();
  const suggestion = new Map<string, StoredSuggestion>();
  for (const d of joined) {
    if (d.human_confirmed) confirmed.set(d.source_id, d.id);
    else {
      const s = suggestionFromRow(d);
      if (s) suggestion.set(d.source_id, s);
    }
  }
  const answered = await answeredMessages(prisma, colleague.map((r) => r.id));
  const resolved = await resolvedMessages(prisma, colleague.map((r) => r.id));
  const out: ReplyItem[] = [];
  for (const r of colleague) {
    const dispositionId = confirmed.get(r.id) ?? null;
    const answeredAt = answered.get(r.id) ?? null;
    const resolvedAt = resolved.get(r.id) ?? null;
    if (state === 'undispositioned' && (dispositionId || answeredAt || resolvedAt)) continue;
    const via = byDomain.get((normalizeEmail(r.from_email).split('@')[1] ?? '').toLowerCase());
    if (!via?.accountName || !via.hypothesisId) continue;
    const item: ReplyItem = {
      id: r.id,
      source: sourceOfInbound(r),
      contactEmail: normalizeEmail(r.from_email),
      personaId: null,
      accountName: via.accountName,
      hypothesisId: via.hypothesisId,
      hypothesisTitle: via.hypothesisTitle,
      subject: r.subject ?? null,
      snippet: snippetOf(r),
      receivedAt: r.received_at.toISOString(),
      enrollmentId: null,
      enrollmentStatus: null,
      suggestion: suggestion.get(r.id) ?? null,
      accountLevel: true,
      threadId: r.source === 'hubspot' ? null : (r.thread_id ?? null),
      fromName: r.from_name ?? null,
      ...(resolvedAt ? { resolvedAt } : {}),
    };
    if (state === 'all') item.dispositionId = dispositionId;
    out.push(item);
  }
  return out;
}

export async function listReplies(prisma: any, input: ListRepliesInput = {}): Promise<RepliesPage> {
  const state: ReplyState = input.state ?? 'undispositioned';
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const known = await loadKnownAddresses(prisma);
  if (known.size === 0) return { items: [], nextCursor: null };

  const account = input.accountName?.trim() || null;
  const emails = Array.from(known.entries()).filter(([, a]) => !account || a.accountName === account).map(([e]) => e);
  if (emails.length === 0 && !account) return { items: [], nextCursor: null };

  const items: ReplyItem[] = [];
  let cursor: string | null = input.cursor ?? null;
  let nextCursor: string | null = null;

  for (let page = 0; page < MAX_PAGES && items.length < limit; page += 1) {
    const take = limit - items.length + 1;
    const query: Record<string, unknown> = {
      where: { from_email: { in: emails, mode: 'insensitive' } },
      orderBy: [{ received_at: 'desc' }, { id: 'desc' }],
      take,
      select: { id: true, source: true, thread_id: true, from_email: true, from_name: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true },
    };
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }
    const rows: InboundRow[] = await prisma.inboundMessage.findMany(query);
    const hasMore = rows.length === take;
    const pageRows = hasMore ? rows.slice(0, take - 1) : rows;
    if (pageRows.length === 0) {
      nextCursor = null;
      break;
    }

    const ids = pageRows.map((r) => r.id);
    const joined: DispositionJoinRow[] = await prisma.conversationDisposition.findMany({
      where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: ids } },
      select: { id: true, source_kind: true, source_id: true, human_confirmed: true, created_by: true, ai_suggested: true },
    });
    const confirmedBySource = new Map<string, string>();
    const suggestionBySource = new Map<string, StoredSuggestion>();
    for (const d of joined) {
      if (d.human_confirmed) confirmedBySource.set(d.source_id, d.id);
      else {
        const s = suggestionFromRow(d);
        if (s) suggestionBySource.set(d.source_id, s);
      }
    }

    const answered = await answeredMessages(prisma, ids);
    const resolved = await resolvedMessages(prisma, ids);
    let consumedThrough: string | null = null;
    for (const row of pageRows) {
      consumedThrough = row.id;
      const dispositionId = confirmedBySource.get(row.id) ?? null;
      const answeredAt = answered.get(row.id) ?? null;
      const resolvedAt = resolved.get(row.id) ?? null;
      if (state === 'undispositioned' && (dispositionId || answeredAt || resolvedAt)) continue;
      const address = known.get(normalizeEmail(row.from_email));
      if (!address) continue;
      const item: ReplyItem = {
        id: row.id,
        source: sourceOfInbound(row),
        contactEmail: address.email,
        personaId: address.personaId,
        accountName: address.accountName ?? '',
        hypothesisId: address.hypothesisId ?? '',
        hypothesisTitle: address.hypothesisTitle,
        subject: row.subject ?? null,
        snippet: snippetOf(row),
        receivedAt: row.received_at.toISOString(),
        enrollmentId: address.enrollmentId,
        enrollmentStatus: address.enrollmentStatus,
        suggestion: suggestionBySource.get(row.id) ?? null,
        accountLevel: false,
        threadId: row.source === 'hubspot' ? null : (row.thread_id ?? null),
        fromName: row.from_name ?? null,
        hubspotContactId: address.hubspotContactId ?? null,
        ...(answeredAt ? { answeredAt } : {}),
        ...(resolvedAt ? { resolvedAt } : {}),
      };
      if (state === 'all') item.dispositionId = dispositionId;
      items.push(item);
      if (items.length === limit) break;
    }

    const last = pageRows[pageRows.length - 1];
    if (items.length === limit) {
      // Stopped mid-page: resume after the last row we looked at. When that
      // row was the final one and the DB has no more, there is no next page.
      nextCursor = consumedThrough !== last.id || hasMore ? consumedThrough : null;
      break;
    }
    if (!hasMore) {
      nextCursor = null;
      break;
    }
    cursor = last.id;
    nextCursor = last.id;
  }

  // Phase 2 D5: colleague replies join the first page, never lost because a different person was emailed.
  const colleagues = (input.cursor ? [] : await loadColleagueReplies(prisma, known, state).catch(() => [] as ReplyItem[])).filter((c) => !account || c.accountName === account);
  if (colleagues.length === 0) return { items: await collapseTwins(prisma, items, state), nextCursor };
  const merged = [...items, ...colleagues].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt) || b.id.localeCompare(a.id));
  return { items: await collapseTwins(prisma, merged, state), nextCursor };
}

/**
 * R42: one message imported twice (the GAP mailbox's Gmail copy and HubSpot's connected-inbox copy) is ONE reply. The
 * list keeps the Gmail copy and names the others (`twinIds`); a confirmed disposition on ANY copy, on this page or not,
 * settles the whole group, so recording one copy never leaves the other waiting as work. Soft: an unreadable twin read
 * keeps the page as it is.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- house convention for DB glue
async function collapseTwins(prisma: any, items: ReplyItem[], state: ReplyState): Promise<ReplyItem[]> {
  if (items.length === 0) return items;
  const cand = (i: ReplyItem): TwinCandidate => ({ id: i.id, from: i.contactEmail, subject: i.subject, snippet: i.snippet, receivedAt: i.receivedAt, source: i.source.kind === 'hubspot_engagement' ? 'hubspot' : 'gmail' });
  const times = items.map((i) => new Date(i.receivedAt).getTime());
  let outside: InboundRow[] = [];
  try {
    outside = await prisma.inboundMessage.findMany({
      where: {
        from_email: { in: [...new Set(items.map((i) => i.contactEmail))], mode: 'insensitive' },
        received_at: { gte: new Date(Math.min(...times) - TWIN_WINDOW_MS), lte: new Date(Math.max(...times) + TWIN_WINDOW_MS) },
        id: { notIn: items.map((i) => i.id) },
      },
      select: { id: true, source: true, from_email: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true },
      take: 200,
    });
  } catch {
    outside = [];
  }
  const byId = new Map(items.map((i) => [i.id, i]));
  // The window and the exclusion are enforced here too (the read is a hint, never trusted to have filtered).
  const lo = Math.min(...times) - TWIN_WINDOW_MS;
  const hi = Math.max(...times) + TWIN_WINDOW_MS;
  outside = (Array.isArray(outside) ? outside : []).filter((o) => !byId.has(o.id) && new Date(o.received_at).getTime() >= lo && new Date(o.received_at).getTime() <= hi);
  const settled = new Map<string, string>();
  if (outside.length > 0) {
    const rows: Array<{ id: string; source_id: string; human_confirmed?: boolean }> = await prisma.conversationDisposition
      .findMany({ where: { source_id: { in: outside.map((o) => o.id) }, human_confirmed: true }, select: { id: true, source_id: true, human_confirmed: true } })
      .catch(() => []);
    // Only a HUMAN-confirmed disposition settles a reply (an AI suggestion never does).
    for (const r of rows) if (r.human_confirmed === true) settled.set(r.source_id, r.id);
  }
  const outsideCands: TwinCandidate[] = outside.map((o) => ({ id: o.id, from: o.from_email, subject: o.subject, snippet: snippetOf(o), receivedAt: new Date(o.received_at).toISOString(), source: o.source ?? 'gmail' }));
  const out: ReplyItem[] = [];
  for (const g of twinGroups(items.map(cand))) {
    const members = g.members.map((m) => byId.get(m.id)!);
    const repItem = byId.get(g.rep.id)!;
    const outsideTwins = outsideCands.filter((o) => g.members.some((m) => areTwins(m, o)));
    const settledBy = outsideTwins.map((o) => settled.get(o.id)).find((x): x is string => !!x) ?? members.map((m) => m.dispositionId).find((x): x is string => !!x) ?? null;
    if (state === 'undispositioned' && settledBy) continue;
    const twinIds = [...members.filter((m) => m.id !== repItem.id).map((m) => m.id), ...outsideTwins.map((o) => o.id)];
    out.push({ ...repItem, ...(twinIds.length ? { twinIds } : {}), ...(state === 'all' && settledBy ? { dispositionId: settledBy } : {}) });
  }
  return out;
}

/**
 * R60, capture once on a reply: ONE reply as Capture carries it: the message's plain text, who sent it and what GAP
 * holds for them (the account, the thesis, the person, the source the disposition service records against), any
 * stored suggestion, and the confirmed disposition when one already exists. Null when the message is not a reply from
 * a GAP account (a known recipient, or a colleague at a known recipient's domain).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- house convention for DB glue
export async function loadReplyForCapture(prisma: any, replyId: string, now: Date = new Date()): Promise<{ item: ReplyItem; text: string; dispositionId: string | null } | null> {
  const id = replyId.trim();
  if (!id || typeof prisma?.inboundMessage?.findUnique !== 'function') return null;
  const row: InboundRow | null = await prisma.inboundMessage.findUnique({
    where: { id },
    select: { id: true, source: true, thread_id: true, from_email: true, from_name: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true },
  });
  if (!row) return null;
  const known = await loadKnownAddresses(prisma);
  // The DONE unification: a reply the seller settled by DONE by email carries its disposition on inbound_message_id
  // (source email_command), so Capture opened on it says recorded before and never records it twice.
  const joined: DispositionJoinRow[] = await prisma.conversationDisposition.findMany({
    where: { OR: [{ source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: row.id }, { source_kind: 'email_command', inbound_message_id: row.id, human_confirmed: true }] },
    select: { id: true, source_kind: true, source_id: true, human_confirmed: true, created_by: true, ai_suggested: true },
  });
  const dispositionId = joined.find((d) => d.human_confirmed)?.id ?? null;
  const suggestion = joined.filter((d) => !d.human_confirmed).map(suggestionFromRow).find((s): s is StoredSuggestion => !!s) ?? null;
  const address = known.get(normalizeEmail(row.from_email));
  const item: ReplyItem | null = address
    ? {
        id: row.id,
        source: sourceOfInbound(row),
        contactEmail: address.email,
        personaId: address.personaId,
        accountName: address.accountName ?? '',
        hypothesisId: address.hypothesisId ?? '',
        hypothesisTitle: address.hypothesisTitle,
        subject: row.subject ?? null,
        snippet: snippetOf(row),
        receivedAt: row.received_at.toISOString(),
        enrollmentId: address.enrollmentId,
        enrollmentStatus: address.enrollmentStatus,
        suggestion,
        accountLevel: false,
        threadId: row.source === 'hubspot' ? null : (row.thread_id ?? null),
        fromName: row.from_name ?? null,
        hubspotContactId: address.hubspotContactId ?? null,
      }
    : ((await loadColleagueReplies(prisma, known, 'all', now)).find((x) => x.id === row.id) ?? null);
  if (!item || !item.accountName) return null;
  return { item: { ...item, suggestion: item.suggestion ?? suggestion }, text: plainTextOf(row), dispositionId };
}
