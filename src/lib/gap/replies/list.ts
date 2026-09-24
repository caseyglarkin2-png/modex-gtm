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
}

export interface ListRepliesInput {
  state?: ReplyState;
  cursor?: string | null;
  limit?: number;
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

// ---------------------------------------------------------------------------
// listReplies
// ---------------------------------------------------------------------------

interface InboundRow {
  id: string;
  source?: string | null;
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

export async function listReplies(prisma: any, input: ListRepliesInput = {}): Promise<RepliesPage> {
  const state: ReplyState = input.state ?? 'undispositioned';
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const known = await loadKnownAddresses(prisma);
  if (known.size === 0) return { items: [], nextCursor: null };
  const emails = Array.from(known.keys());

  const items: ReplyItem[] = [];
  let cursor: string | null = input.cursor ?? null;
  let nextCursor: string | null = null;

  for (let page = 0; page < MAX_PAGES && items.length < limit; page += 1) {
    const take = limit - items.length + 1;
    const query: Record<string, unknown> = {
      where: { from_email: { in: emails, mode: 'insensitive' } },
      orderBy: [{ received_at: 'desc' }, { id: 'desc' }],
      take,
      select: { id: true, source: true, from_email: true, subject: true, body_text: true, body_html: true, snippet: true, received_at: true },
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

    let consumedThrough: string | null = null;
    for (const row of pageRows) {
      consumedThrough = row.id;
      const dispositionId = confirmedBySource.get(row.id) ?? null;
      if (state === 'undispositioned' && dispositionId) continue;
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

  return { items, nextCursor };
}
