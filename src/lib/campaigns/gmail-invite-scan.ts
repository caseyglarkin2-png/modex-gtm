/**
 * Gmail invite-truth scan (Phase 5c).
 *
 * Casey invites tour prospects manually from his own Gmail (casey@freightroll.com),
 * so the modex Outbox / DraftQueueItem ledger is an incomplete picture of who has
 * ACTUALLY been invited. This module reads the real mailbox to recover the truth:
 * for each watched account domain, did an invite go out, and did anyone reply.
 *
 * Read-only. Never labels, modifies, or sends anything. Reuses the existing
 * Gmail OAuth client (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
 * + GMAIL_USER_EMAIL) - no new auth. Headers only (From / To / Subject / Date);
 * message bodies are never fetched.
 *
 * FAIL-SOFT + CACHED: the whole scan is wrapped so any Gmail error yields an empty
 * map (the command center must never break if Gmail is down), and the result is
 * cached server-side with a 300s TTL so the page is fast and we do not hammer the
 * Gmail API on every request.
 *
 * Provenance: every truth carries source 'gmail'.
 */

import { unstable_cache } from 'next/cache';
import * as Sentry from '@sentry/nextjs';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

/** The mailbox identity. Defaults to casey@freightroll.com (the send-from address). */
function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}

/* ─── Public shapes ──────────────────────────────────────────────────────── */

export type InviteDirection = 'out' | 'in';

export interface InviteContact {
  email: string;
  name?: string;
  /** Most recent direction we saw for this address. */
  lastDirection: InviteDirection;
  /** ISO timestamp of that most-recent message. */
  at: string;
}

export interface InviteTruth {
  domain: string;
  /** True if any outbound OR inbound was seen for the domain (we have engaged). */
  invited: boolean;
  /** ISO timestamp of the first outbound to the domain (the invite), if any. */
  invitedAt?: string;
  /** ISO timestamp of the most recent inbound from the domain (their reply), if any. */
  repliedAt?: string;
  /** The subject of the most recent matched message, for context. */
  lastSubject?: string;
  /** Per-address direction summary, newest-first. */
  contacts: InviteContact[];
  /** Always 'gmail' - the provenance of this truth. */
  source: 'gmail';
}

/* ─── Gmail header plumbing (headers only, never bodies) ──────────────────── */

interface GmailListMessage {
  id: string;
  threadId: string;
}
interface GmailHeader {
  name: string;
  value: string;
}
interface GmailMetaMessage {
  id: string;
  internalDate?: string;
  payload?: { headers?: GmailHeader[] };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail not configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to get Gmail access token');
  }
  return data.access_token;
}

function header(msg: GmailMetaMessage, name: string): string {
  return (
    msg.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ''
  );
}

/** Pull the bare email out of a "Name <email>" header value, lowercased. */
function extractEmail(value: string): string {
  const m = value.match(/<([^>]+)>/);
  return (m ? m[1] : value).toLowerCase().trim();
}

/** Pull the display name out of a "Name <email>" header value, if present. */
function extractName(value: string): string | undefined {
  const name = value.replace(/<[^>]*>/, '').replace(/["']/g, '').trim();
  return name && name.indexOf('@') < 0 ? name : undefined;
}

/** All comma-separated addresses in a header (To/Cc may carry several). */
function extractAllEmails(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => extractEmail(part))
    .filter((e) => e.indexOf('@') > 0);
}

/* ─── The Gmail client surface (injectable so tests can mock it) ──────────── */

export interface GmailMessageFetcher {
  /** List recent message ids whose to/from touches the domain. */
  listForDomain(domain: string): Promise<GmailListMessage[]>;
  /** Fetch the From/To/Cc/Subject/Date headers + internalDate for a message id. */
  getMetadata(id: string): Promise<GmailMetaMessage>;
}

/** The real Gmail-backed fetcher. Headers-only metadata, 120-day window. */
function liveFetcher(accessToken: string): GmailMessageFetcher {
  const { userEmail } = getGmailConfig();
  const user = encodeURIComponent(userEmail);
  return {
    async listForDomain(domain: string): Promise<GmailListMessage[]> {
      const q = `(to:${domain} OR from:${domain}) newer_than:120d`;
      const url = new URL(`${GMAIL_API}/users/${user}/messages`);
      url.searchParams.set('q', q);
      url.searchParams.set('maxResults', '100');
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gmail list failed for ${domain} (${res.status}): ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as { messages?: GmailListMessage[] };
      return data.messages ?? [];
    },
    async getMetadata(id: string): Promise<GmailMetaMessage> {
      // format=metadata + explicit headers keeps this header-only: no body fetch.
      const url = new URL(`${GMAIL_API}/users/${user}/messages/${id}`);
      url.searchParams.set('format', 'metadata');
      for (const h of ['From', 'To', 'Cc', 'Subject', 'Date']) {
        url.searchParams.append('metadataHeaders', h);
      }
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gmail metadata failed for ${id} (${res.status}): ${body.slice(0, 200)}`);
      }
      return (await res.json()) as GmailMetaMessage;
    },
  };
}

/* ─── Classification (pure, unit-tested) ─────────────────────────────────── */

interface RawMatch {
  /** out = from Casey to the domain (an invite); in = from the domain (a reply). */
  direction: InviteDirection;
  /** The counterparty address at the watched domain. */
  email: string;
  name?: string;
  subject: string;
  at: number; // epoch ms
}

function msToIso(ms: number): string {
  return new Date(ms).toISOString();
}

/**
 * Reduce the raw matched messages for ONE domain into its invite truth.
 *
 * Rules:
 *   - replied  : any inbound from the domain  (repliedAt set, invited true)
 *   - invited  : any outbound to the domain, no inbound  (invitedAt set)
 *   - neither  : no matches  -> invited:false, empty contacts
 *
 * invitedAt is the FIRST outbound (when the invite went out); repliedAt is the
 * MOST RECENT inbound (their latest reply). Replied implies invited.
 */
export function classifyDomain(domain: string, matches: RawMatch[]): InviteTruth {
  const base: InviteTruth = { domain, invited: false, contacts: [], source: 'gmail' };
  if (matches.length === 0) return base;

  const outbound = matches.filter((m) => m.direction === 'out');
  const inbound = matches.filter((m) => m.direction === 'in');

  // invitedAt = first outbound; repliedAt = newest inbound.
  if (outbound.length > 0) {
    const firstOut = outbound.reduce((a, b) => (a.at <= b.at ? a : b));
    base.invitedAt = msToIso(firstOut.at);
  }
  if (inbound.length > 0) {
    const newestIn = inbound.reduce((a, b) => (a.at >= b.at ? a : b));
    base.repliedAt = msToIso(newestIn.at);
  }

  // invited if anything at all was seen (out or in - an inbound means we engaged).
  base.invited = matches.length > 0;

  // lastSubject = subject of the single most-recent matched message.
  const newest = matches.reduce((a, b) => (a.at >= b.at ? a : b));
  base.lastSubject = newest.subject || undefined;

  // Per-address summary: keep the newest message per address, newest-first.
  const byEmail = new Map<string, RawMatch>();
  for (const m of matches) {
    const prev = byEmail.get(m.email);
    if (!prev || m.at > prev.at) byEmail.set(m.email, m);
  }
  base.contacts = [...byEmail.values()]
    .sort((a, b) => b.at - a.at)
    .map((m) => ({
      email: m.email,
      ...(m.name ? { name: m.name } : {}),
      lastDirection: m.direction,
      at: msToIso(m.at),
    }));

  return base;
}

/**
 * Turn one Gmail metadata message into a RawMatch for a domain, or null if it
 * does not actually touch the domain (Gmail's `to:/from:` query can over-match).
 *
 * Direction:
 *   - from Casey (the mailbox owner) AND the domain appears in To/Cc -> 'out'
 *   - from the domain -> 'in'
 */
export function matchMessageToDomain(
  msg: GmailMetaMessage,
  domain: string,
  selfEmail: string,
): RawMatch | null {
  const dom = domain.toLowerCase();
  const self = selfEmail.toLowerCase();
  const fromHeader = header(msg, 'From');
  const fromEmail = extractEmail(fromHeader);
  const at = msg.internalDate ? parseInt(msg.internalDate, 10) : Date.now();
  const subject = header(msg, 'Subject');

  const atDomain = (e: string) => e.endsWith(`@${dom}`) || e.endsWith(`.${dom}`);

  // Inbound: the message is FROM someone at the domain.
  if (atDomain(fromEmail)) {
    return { direction: 'in', email: fromEmail, name: extractName(fromHeader), subject, at };
  }

  // Outbound: from Casey, addressed to someone at the domain.
  if (fromEmail === self) {
    const recipients = [
      ...extractAllEmails(header(msg, 'To')),
      ...extractAllEmails(header(msg, 'Cc')),
    ];
    const toDomain = recipients.find((e) => atDomain(e));
    if (toDomain) {
      return { direction: 'out', email: toDomain, subject, at };
    }
  }

  return null;
}

/* ─── The scan (fail-soft, header-only, injectable fetcher) ──────────────── */

/**
 * Core scan against an injected fetcher (the live one in production, a mock in
 * tests). Resolves a map of domain -> InviteTruth. Per-domain failures are
 * isolated (a bad domain yields its empty truth, the rest still resolve).
 */
export async function scanInviteTruthWith(
  domains: string[],
  fetcher: GmailMessageFetcher,
  selfEmail: string,
): Promise<Map<string, InviteTruth>> {
  const out = new Map<string, InviteTruth>();
  const wanted = [...new Set(domains.map((d) => d.trim().toLowerCase()).filter(Boolean))];

  await Promise.all(
    wanted.map(async (domain) => {
      try {
        const list = await fetcher.listForDomain(domain);
        const metas = await Promise.all(
          list.map((m) => fetcher.getMetadata(m.id).catch(() => null)),
        );
        const matches: RawMatch[] = [];
        for (const meta of metas) {
          if (!meta) continue;
          const m = matchMessageToDomain(meta, domain, selfEmail);
          if (m) matches.push(m);
        }
        out.set(domain, classifyDomain(domain, matches));
      } catch (err) {
        Sentry.captureException(err, { extra: { context: 'scanInviteTruth', domain } });
        out.set(domain, { domain, invited: false, contacts: [], source: 'gmail' });
      }
    }),
  );

  return out;
}

/** The uncached live scan. Any top-level Gmail/auth failure yields an empty map. */
async function runLiveScan(domains: string[]): Promise<Map<string, InviteTruth>> {
  if (domains.length === 0) return new Map();
  try {
    const { userEmail } = getGmailConfig();
    const accessToken = await getAccessToken();
    return await scanInviteTruthWith(domains, liveFetcher(accessToken), userEmail);
  } catch (err) {
    Sentry.captureException(err, { extra: { context: 'scanInviteTruth.auth' } });
    return new Map();
  }
}

/**
 * unstable_cache returns plain JSON, so a Map cannot survive the boundary. We
 * cache an array of [domain, truth] entries and rehydrate the Map on the way out.
 */
const cachedScanEntries = unstable_cache(
  async (domains: string[]): Promise<Array<[string, InviteTruth]>> => {
    const map = await runLiveScan(domains);
    return [...map.entries()];
  },
  ['campaign-gmail-invite-scan'],
  { revalidate: 300 },
);

/**
 * Scan the mailbox for invite truth across the watched domains.
 *
 * Returns domain -> InviteTruth. Fail-soft (empty map on any Gmail error) and
 * cached server-side with a 300s TTL. Read-only; provenance 'gmail'.
 */
export async function scanInviteTruth(domains: string[]): Promise<Map<string, InviteTruth>> {
  const wanted = [...new Set(domains.map((d) => d.trim().toLowerCase()).filter(Boolean))];
  if (wanted.length === 0) return new Map();
  try {
    // Sort so the cache key is order-independent.
    const entries = await cachedScanEntries([...wanted].sort());
    return new Map(entries);
  } catch (err) {
    Sentry.captureException(err, { extra: { context: 'scanInviteTruth.cache' } });
    return new Map();
  }
}
