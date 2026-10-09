/**
 * HUBSPOT ENGAGEMENTS ON THE ACCOUNT STORY (GAP knowledge program, B2, 2026-10-09). Read-only.
 *
 * The story read HubSpot for deals and people only; the notes, calls, meetings and logged emails on the company
 * record (what Casey and the deal team wrote down) never reached "what has happened between us". This reads them for
 * ONE company: the four engagement objects through the CRM v3 objects search (a POST, read-only, as the replies
 * poller already does), filtered by the company association, newest first, last ENGAGEMENT_WINDOW_DAYS, at most
 * `limit` each, one bounded timeout for the whole read, and a SystemConfig cache per company (the in-deals shape) so
 * the account page costs HubSpot four calls every half hour, never per view. Nothing here writes to HubSpot. Absent
 * token: not read, said. Pinned by tests/unit/gap/kn-engagements-*.test.ts.
 */

export type EngagementKind = 'note' | 'call' | 'meeting' | 'email';

export interface CompanyEngagement {
  kind: EngagementKind;
  /** ISO instant (hs_timestamp). */
  at: string;
  /** The call or meeting title, the email subject; null for a note. */
  title: string | null;
  /** The note body, the call body, the meeting outcome, the email text: plain text, bounded to ENGAGEMENT_BODY_MAX. */
  body: string;
  id: string;
  /** An email: whose it was (the from address, lowercased) and which way it went; null for the other kinds. */
  from?: string | null;
  to?: string | null;
  direction?: 'incoming' | 'outgoing' | null;
}

export interface CompanyEngagements {
  items: CompanyEngagement[];
  /** Every kind was read in full. False with `detail` when the token is absent or a read failed (the items read stand). */
  read: boolean;
  detail: string | null;
  checkedAt: string;
}

export const ENGAGEMENT_WINDOW_DAYS = 365;
export const ENGAGEMENT_MAX = 50;
export const ENGAGEMENT_BODY_MAX = 600;
export const ENGAGEMENT_TIMEOUT_MS = 8_000;
/** How long one company's read answers the page before HubSpot is read again; a failed read is retried sooner. */
export const ENGAGEMENT_CACHE_MS = 30 * 60_000;
export const ENGAGEMENT_FAILURE_CACHE_MS = 60_000;
export const engagementCacheKey = (companyId: string) => `gap:company-engagements:${companyId}`;

const HUBSPOT_API = 'https://api.hubapi.com';
const OBJECTS: Record<EngagementKind, { object: string; properties: string[] }> = {
  note: { object: 'notes', properties: ['hs_timestamp', 'hs_note_body'] },
  call: { object: 'calls', properties: ['hs_timestamp', 'hs_call_title', 'hs_call_body', 'hs_call_direction'] },
  meeting: { object: 'meetings', properties: ['hs_timestamp', 'hs_meeting_title', 'hs_meeting_outcome', 'hs_meeting_body'] },
  email: { object: 'emails', properties: ['hs_timestamp', 'hs_email_subject', 'hs_email_text', 'hs_email_direction', 'hs_email_from_email', 'hs_email_to_email'] },
};
const KINDS: EngagementKind[] = ['note', 'call', 'meeting', 'email'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface EngagementReadDeps {
  /** The HubSpot private-app token; absent means not read (never read from the environment here). */
  token: string | null | undefined;
  now?: Date;
  /** Newest per kind (default ENGAGEMENT_MAX, never above it). */
  limit?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** A client with systemConfig: the per-company cache; without one every call reads HubSpot. */
  prisma?: PrismaLike;
  /** Read HubSpot now, whatever the cache holds. */
  fresh?: boolean;
  /** The gap between the four searches (default 300 ms; the search API allows four a second) and the wait before the one retry of a 429 (default 1500 ms). Tests pass 0. */
  pacingMs?: number;
  retryDelayMs?: number;
}

/** HTML to one line of text (a HubSpot note body is HTML); entities decoded for the few that matter in prose. */
export function engagementText(raw: string | null | undefined, max = ENGAGEMENT_BODY_MAX): string {
  if (!raw) return '';
  const text = raw
    .replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
}

type SearchRow = { id: string; properties?: Record<string, string | null | undefined> };

function toEngagement(kind: EngagementKind, row: SearchRow): CompanyEngagement | null {
  const p = row.properties ?? {};
  const at = p.hs_timestamp ? new Date(/^\d+$/.test(String(p.hs_timestamp)) ? Number(p.hs_timestamp) : String(p.hs_timestamp)) : null;
  if (!at || Number.isNaN(at.getTime())) return null;
  const base = { kind, at: at.toISOString(), id: String(row.id) };
  if (kind === 'note') return { ...base, title: null, body: engagementText(p.hs_note_body) };
  if (kind === 'call') return { ...base, title: engagementText(p.hs_call_title, 200) || null, body: engagementText(p.hs_call_body) };
  if (kind === 'meeting') return { ...base, title: engagementText(p.hs_meeting_title, 200) || null, body: engagementText(p.hs_meeting_outcome ? `${p.hs_meeting_outcome}${p.hs_meeting_body ? `: ${p.hs_meeting_body}` : ''}` : p.hs_meeting_body) };
  const dir = String(p.hs_email_direction ?? '').toUpperCase();
  return { ...base, title: engagementText(p.hs_email_subject, 200) || null, body: engagementText(p.hs_email_text), from: p.hs_email_from_email ? String(p.hs_email_from_email).trim().toLowerCase() : null, to: p.hs_email_to_email ? String(p.hs_email_to_email).split(/[,;]/)[0].trim().toLowerCase() : null, direction: dir === 'INCOMING_EMAIL' ? 'incoming' : dir ? 'outgoing' : null };
}

/** One kind for one company: the search POST (read-only), newest first, within the window; throws on a failed read. */
async function searchKind(kind: EngagementKind, companyId: string, x: { token: string; since: Date; limit: number; signal: AbortSignal; fetchImpl: typeof fetch; retried?: boolean; retryDelayMs?: number }): Promise<CompanyEngagement[]> {
  const { object, properties } = OBJECTS[kind];
  const res = await x.fetchImpl(`${HUBSPOT_API}/crm/v3/objects/${object}/search`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${x.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName: 'associations.company', operator: 'EQ', value: companyId }, { propertyName: 'hs_timestamp', operator: 'GTE', value: String(x.since.getTime()) }] }],
      sorts: [{ propertyName: 'hs_timestamp', direction: 'DESCENDING' }],
      properties,
      limit: x.limit,
    }),
    signal: x.signal,
  });
  if (res.status === 429 && !x.retried) {
    // The search API is rate limited (four a second): wait once and try again, then say the failure.
    const wait = x.retryDelayMs ?? 1500;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    return searchKind(kind, companyId, { ...x, retried: true });
  }
  if (!res.ok) throw new Error(`HubSpot ${object} read failed (${res.status})`);
  const data = (await res.json()) as { results?: SearchRow[] };
  return (data.results ?? []).map((r) => toEngagement(kind, r)).filter((e): e is CompanyEngagement => !!e).slice(0, x.limit);
}

/** The read itself (no cache): four parallel searches under one timeout; a failed kind is said, the others stand. */
export async function readCompanyEngagements(companyId: string, deps: EngagementReadDeps): Promise<CompanyEngagements> {
  const now = deps.now ?? new Date();
  const checkedAt = now.toISOString();
  const token = deps.token?.trim();
  if (!token) return { items: [], read: false, detail: 'HubSpot is not configured', checkedAt };
  if (!/^\d+$/.test(companyId)) return { items: [], read: false, detail: 'no HubSpot company id', checkedAt };
  const limit = Math.max(1, Math.min(deps.limit ?? ENGAGEMENT_MAX, ENGAGEMENT_MAX));
  const since = new Date(now.getTime() - ENGAGEMENT_WINDOW_DAYS * 86_400_000);
  const signal = AbortSignal.timeout(deps.timeoutMs ?? ENGAGEMENT_TIMEOUT_MS);
  const fetchImpl = deps.fetchImpl ?? fetch;
  // One search at a time with a short gap (the search API allows four a second; a burst of four per account tripped 429s on the audit).
  const results: Array<{ kind: EngagementKind; items: CompanyEngagement[]; error: string | null }> = [];
  for (const kind of KINDS) {
    if (results.length && (deps.pacingMs ?? 300) > 0) await new Promise((r) => setTimeout(r, deps.pacingMs ?? 300));
    // The one timeout covers all four: once it has fired, the kinds not yet read are said as timed out without a call.
    if (signal.aborted) { results.push({ kind, items: [], error: `HubSpot ${OBJECTS[kind].object} read timed out` }); continue; }
    results.push(await searchKind(kind, companyId, { token, since, limit, signal, fetchImpl, retryDelayMs: deps.retryDelayMs }).then((items) => ({ kind, items, error: null as string | null }), (e: unknown) => ({ kind, items: [] as CompanyEngagement[], error: e instanceof Error ? (e.name === 'TimeoutError' || e.name === 'AbortError' ? `HubSpot ${OBJECTS[kind].object} read timed out` : e.message) : String(e) })));
  }
  const items = results.flatMap((r) => r.items).sort((a, b) => b.at.localeCompare(a.at));
  const failures = results.filter((r) => r.error).map((r) => r.error!);
  return { items, read: failures.length === 0, detail: failures.length ? failures.join('; ').slice(0, 300) : null, checkedAt };
}

/**
 * The company's engagements for the page: the cache first (ENGAGEMENT_CACHE_MS for a full read,
 * ENGAGEMENT_FAILURE_CACHE_MS for a failed one), else the read, then the cache written (soft). Never throws.
 */
export async function loadCompanyEngagements(companyId: string, deps: EngagementReadDeps): Promise<CompanyEngagements> {
  const now = deps.now ?? new Date();
  const prisma = deps.prisma;
  const canCache = typeof prisma?.systemConfig?.findUnique === 'function';
  const key = engagementCacheKey(companyId);
  if (canCache && !deps.fresh) {
    try {
      const row = await prisma.systemConfig.findUnique({ where: { key } });
      const cached = row?.value ? (JSON.parse(String(row.value)) as CompanyEngagements) : null;
      const age = cached?.checkedAt ? now.getTime() - new Date(cached.checkedAt).getTime() : Infinity;
      if (cached && Array.isArray(cached.items) && age >= 0 && age < (cached.read ? ENGAGEMENT_CACHE_MS : ENGAGEMENT_FAILURE_CACHE_MS)) return cached;
    } catch {
      // an unreadable cache is a cache miss
    }
  }
  let result: CompanyEngagements;
  try {
    result = await readCompanyEngagements(companyId, deps);
  } catch (e) {
    result = { items: [], read: false, detail: e instanceof Error ? e.message : String(e), checkedAt: now.toISOString() };
  }
  // The absence of a token is configuration, not a read: nothing is cached, so the first view after it is set reads.
  if (canCache && typeof prisma?.systemConfig?.upsert === 'function' && !/not configured|no HubSpot company id/.test(result.detail ?? '')) {
    try {
      const value = JSON.stringify(result);
      await prisma.systemConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
    } catch {
      // the read stands without the cache
    }
  }
  return result;
}
