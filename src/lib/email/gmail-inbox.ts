/**
 * Gmail Inbox Polling Module — Detects prospect replies to casey@freightroll.com.
 * Used by /api/cron/check-inbox to create Notifications and update email status.
 */
import * as Sentry from '@sentry/nextjs';
import { accessTokenForSender, type GmailSender } from './gmail-sender';
import { sinkConfig, sinkSentTo } from './transport-sink';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}

export function isGmailInboxConfigured(): boolean {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  return !!(clientId && clientSecret && refreshToken);
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail inbox not configured: missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
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

  interface TokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
  }
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to get Gmail access token');
  }
  return data.access_token;
}

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailMessagePart {
  mimeType?: string;
  filename?: string;
  headers?: Array<{ name: string; value: string }>;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
}

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: GmailMessagePart;
  internalDate?: string;
}

export interface ReplyMetadata {
  messageId: string;
  threadId: string;
  rfcMessageId: string | null;
  from: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  bodyHtml: string;
  bodyText: string;
  receivedAt: Date;
  /**
   * Raw RFC-822 headers, keyed by the header name as Gmail returned it. Consumed by
   * `classifyInboundReply` (src/lib/email/reply-precision.ts) to detect autoresponders
   * via Auto-Submitted / X-Autoreply / Precedence / List-Unsubscribe. Lookups there are
   * case-insensitive, so no normalization is needed here.
   */
  headers: Record<string, string>;
}

/** Flattens Gmail's header array into a plain object (last value wins on duplicates). */
function collectHeaders(msg: GmailMessageDetail): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of msg.payload?.headers ?? []) {
    if (h?.name) out[h.name] = h.value ?? '';
  }
  return out;
}

function getHeader(msg: GmailMessageDetail, name: string): string {
  return msg.payload?.headers?.find(
    (h) => h.name.toLowerCase() === name.toLowerCase()
  )?.value || '';
}

function extractEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : fromHeader.toLowerCase().trim();
}

function extractName(fromHeader: string): string {
  const name = fromHeader.replace(/<[^>]*>/, '').replace(/["']/g, '').trim();
  return name || extractEmail(fromHeader);
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

/** Walks a Gmail payload tree, returning the first html + plain bodies. */
function extractBodies(part: GmailMessagePart | undefined): { html: string; text: string } {
  let html = '';
  let text = '';
  const walk = (node?: GmailMessagePart) => {
    if (!node) return;
    const mime = (node.mimeType ?? '').toLowerCase();
    const data = node.body?.data;
    if (data && mime === 'text/html' && !html) html = decodeBase64Url(data);
    else if (data && mime === 'text/plain' && !text) text = decodeBase64Url(data);
    node.parts?.forEach(walk);
  };
  walk(part);
  return { html, text };
}

/**
 * Strips quoted history from a plain-text reply — the Gmail "On … wrote:"
 * attribution and everything after it, Outlook-style separators, and a
 * trailing run of `>` quote lines. Heuristic; keeps the operator's text.
 */
export function stripQuotedReply(body: string): string {
  if (!body) return '';
  const lines = body.split(/\r?\n/);
  const kept: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (/^On\b.*\bwrote:$/.test(trimmed)) break;
    if (/^On\b.+\bat\b.+/.test(trimmed) && /wrote:\s*$/.test(`${trimmed} ${(lines[i + 1] ?? '').trim()}`)) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(trimmed)) break;
    if (/^_{10,}$/.test(trimmed)) break;
    if (/^From:\s.+/.test(trimmed) && kept.some((line) => line.trim().length > 0)) break;
    kept.push(lines[i]);
  }
  return kept.join('\n').replace(/(?:\n>.*)+\s*$/, '').trim();
}

/**
 * Fetch recent unread replies from Gmail inbox.
 * @param sinceTimestamp  ISO date string or epoch seconds. Defaults to 24h ago.
 */
export async function getRecentReplies(sinceTimestamp?: string | number): Promise<ReplyMetadata[]> {
  const config = getGmailConfig();
  const accessToken = await getAccessToken();

  let afterEpoch: number;
  if (!sinceTimestamp) {
    afterEpoch = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
  } else if (typeof sinceTimestamp === 'number') {
    afterEpoch = sinceTimestamp;
  } else {
    afterEpoch = Math.floor(new Date(sinceTimestamp).getTime() / 1000);
  }

  // Query unread inbox messages after timestamp
  const query = `is:unread in:inbox after:${afterEpoch}`;
  const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(config.userEmail)}/messages`);
  listUrl.searchParams.set('q', query);
  listUrl.searchParams.set('maxResults', '50');

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listRes.ok) {
    const body = await listRes.text();
    Sentry.captureMessage(`Gmail inbox list failed: ${listRes.status}`, {
      extra: { body: body.slice(0, 500) },
    });
    throw new Error(`Gmail inbox list failed (${listRes.status})`);
  }

  const listData = (await listRes.json()) as { messages?: GmailMessage[] };
  if (!listData.messages || listData.messages.length === 0) {
    return [];
  }

  // Fetch details for each message
  const replies: ReplyMetadata[] = [];
  for (const msg of listData.messages) {
    try {
      const detail = await getMessageDetail(accessToken, config.userEmail, msg.id);
      const from = getHeader(detail, 'From');
      const fromEmail = extractEmail(from);

      // Skip messages from Casey (not replies FROM prospects)
      if (fromEmail === 'casey@freightroll.com') continue;

      const { html, text } = extractBodies(detail.payload);

      replies.push({
        messageId: detail.id,
        threadId: detail.threadId,
        rfcMessageId: getHeader(detail, 'Message-ID') || null,
        from,
        fromName: extractName(from),
        fromEmail,
        subject: getHeader(detail, 'Subject'),
        snippet: detail.snippet || '',
        bodyHtml: html,
        bodyText: stripQuotedReply(text),
        receivedAt: detail.internalDate
          ? new Date(parseInt(detail.internalDate, 10))
          : new Date(),
        headers: collectHeaders(detail),
      });
    } catch (err) {
      Sentry.captureException(err, { extra: { messageId: msg.id } });
    }
  }

  return replies;
}

/** Lowercase + strip a `+tag` from the local part: `foo+bar@x` → `foo@x`. */
function baseAddress(email: string): string {
  const addr = email.trim().toLowerCase();
  const at = addr.indexOf('@');
  if (at < 0) return addr;
  const local = addr.slice(0, at).split('+')[0];
  return `${local}${addr.slice(at)}`;
}

/**
 * Has Casey ever exchanged email with this address? Ground truth for dedup —
 * catches manual + agent sends that never reach our EmailLog. Best-effort:
 * returns { exists:false } on any API error (never block an add on a transient).
 */
export async function threadExistsWith(email: string): Promise<{ exists: boolean; lastAt: Date | null }> {
  try {
    const config = getGmailConfig();
    const accessToken = await getAccessToken();

    const addr = baseAddress(email);
    const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(config.userEmail)}/messages`);
    listUrl.searchParams.set('q', `(to:${addr} OR from:${addr})`);
    listUrl.searchParams.set('maxResults', '1');

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const body = await listRes.text();
      Sentry.captureMessage(`Gmail threadExistsWith list failed: ${listRes.status}`, {
        extra: { body: body.slice(0, 500) },
      });
      return { exists: false, lastAt: null };
    }

    const listData = (await listRes.json()) as { messages?: GmailMessage[] };
    const exists = (listData.messages?.length ?? 0) > 0;
    return { exists, lastAt: null };
  } catch (err) {
    Sentry.captureException(err, { extra: { context: 'threadExistsWith' } });
    return { exists: false, lastAt: null };
  }
}

/**
 * Newest INBOUND message timestamp from this address (their replies only — not
 * Casey's own sends). Used for reply-pause. Best-effort: null on error, never
 * throws.
 *
 * `from:THEM` is inherently inbound — it can only match mail the recipient sent
 * us, so Casey's own outbound (and a sequence follow-up's own outbound thread)
 * can never trip it.
 */
export async function newestInboundFrom(email: string): Promise<Date | null> {
  try {
    const config = getGmailConfig();
    const accessToken = await getAccessToken();

    const addr = baseAddress(email);
    const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(config.userEmail)}/messages`);
    listUrl.searchParams.set('q', `from:${addr}`);
    listUrl.searchParams.set('maxResults', '1');

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listRes.ok) {
      const body = await listRes.text();
      Sentry.captureMessage(`Gmail newestInboundFrom list failed: ${listRes.status}`, {
        extra: { body: body.slice(0, 500) },
      });
      return null;
    }

    const listData = (await listRes.json()) as { messages?: GmailMessage[] };
    const first = listData.messages?.[0];
    if (!first) return null;

    const detail = await getMessageDetail(accessToken, config.userEmail, first.id);
    if (!detail.internalDate) return null;
    return new Date(parseInt(detail.internalDate, 10));
  } catch (err) {
    Sentry.captureException(err, { extra: { context: 'newestInboundFrom' } });
    return null;
  }
}

/**
 * Resolves just the Gmail threadId for a message id — used by the
 * one-shot thread-linkage backfill to thread historical sends.
 */
export async function getMessageThreadId(messageId: string): Promise<string | null> {
  const config = getGmailConfig();
  const accessToken = await getAccessToken();
  const url = `${GMAIL_API}/users/${encodeURIComponent(config.userEmail)}/messages/${messageId}?format=minimal`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const data = (await res.json()) as { threadId?: string };
  return data.threadId ?? null;
}

/**
 * Fetch full message metadata from Gmail.
 */
async function getMessageDetail(
  accessToken: string,
  userEmail: string,
  messageId: string,
): Promise<GmailMessageDetail> {
  // format=full returns the MIME body parts so the full reply can be
  // captured, not just the snippet.
  const url = `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/messages/${messageId}?format=full`;

  // Ops closeout 13C: bounded, so one hung read cannot hold the cron to maxDuration.
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail get failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<GmailMessageDetail>;
}

/**
 * Add a label to a message (mark as processed).
 * Creates the label if it doesn't exist.
 */
export async function markAsProcessed(messageId: string): Promise<void> {
  const config = getGmailConfig();
  const accessToken = await getAccessToken();

  // Get or create "RevOps-Processed" label
  const labelId = await getOrCreateLabel(accessToken, config.userEmail, 'RevOps-Processed');
  if (!labelId) return;

  const url = `${GMAIL_API}/users/${encodeURIComponent(config.userEmail)}/messages/${messageId}/modify`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addLabelIds: [labelId] }),
  });

  if (!res.ok) {
    Sentry.captureMessage(`Failed to label message ${messageId}`, {
      extra: { status: res.status },
    });
  }
}

async function getOrCreateLabel(
  accessToken: string,
  userEmail: string,
  labelName: string,
): Promise<string | null> {
  try {
    // List existing labels
    const listRes = await fetch(
      `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/labels`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!listRes.ok) return null;

    interface GmailLabel { id: string; name: string; }
    const listData = (await listRes.json()) as { labels?: GmailLabel[] };
    const existing = listData.labels?.find((l) => l.name === labelName);
    if (existing) return existing.id;

    // Create label
    const createRes = await fetch(
      `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/labels`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        }),
      },
    );
    if (!createRes.ok) return null;

    const created = (await createRes.json()) as GmailLabel;
    return created.id;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GAP draft -> sent reconciliation reads (final pass, 2026-09-25). Read-only:
// drafts.get and threads.get (metadata). Nothing here creates, sends, labels
// or deletes. An explicit `sender` reads THAT mailbox (the GAP draft mailbox);
// without one, the env identity, as every read above.
// ---------------------------------------------------------------------------

export type GmailDraftState = { exists: true; messageId: string | null } | { exists: false };

/** Does this draft still exist? 404 means Gmail no longer has it (sent or deleted); any other failure throws. */
export async function getGmailDraftState(draftId: string, sender?: GmailSender): Promise<GmailDraftState> {
  const mailbox = sender?.userEmail ?? getGmailConfig().userEmail;
  const accessToken = sender ? await accessTokenForSender(sender) : await getAccessToken();
  const url = `${GMAIL_API}/users/${encodeURIComponent(mailbox)}/drafts/${encodeURIComponent(draftId)}?format=minimal`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 404) return { exists: false };
  if (!res.ok) throw new Error(`Gmail drafts.get failed (${res.status})`);
  const data = (await res.json()) as { message?: { id?: string } };
  return { exists: true, messageId: data.message?.id ?? null };
}

/**
 * Delete one draft (ops closeout: an unsubscribe invalidates GAP drafts).
 * 'not_found' means Gmail no longer has it, which may mean it was SENT, so the
 * caller must not read it as discarded. Any other failure throws. Bounded.
 */
export async function deleteGmailDraft(draftId: string, sender?: GmailSender): Promise<'deleted' | 'not_found'> {
  const mailbox = sender?.userEmail ?? getGmailConfig().userEmail;
  const accessToken = sender ? await accessTokenForSender(sender) : await getAccessToken();
  const url = `${GMAIL_API}/users/${encodeURIComponent(mailbox)}/drafts/${encodeURIComponent(draftId)}`;
  const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return 'not_found';
  if (!res.ok) throw new Error(`Gmail drafts.delete failed (${res.status})`);
  return 'deleted';
}

export interface GmailThreadMessageMeta {
  id: string;
  labelIds: string[];
  internalDate: Date;
  to: string;
  from: string;
  subject?: string;
}

/**
 * Ops closeout 13D: Gmail no longer has this thread (deleted, or the wrong
 * mailbox). That is UNKNOWN reply truth, never "nobody replied".
 */
export class GmailThreadMissingError extends Error {
  constructor(readonly threadId: string) {
    super(`Gmail thread ${threadId} not found`);
    this.name = 'GmailThreadMissingError';
  }
}

/** Message metadata for one thread (To/From/labels/date). A missing thread throws GmailThreadMissingError. */
export async function getGmailThreadMessages(threadId: string, sender?: GmailSender): Promise<GmailThreadMessageMeta[]> {
  const mailbox = sender?.userEmail ?? getGmailConfig().userEmail;
  const accessToken = sender ? await accessTokenForSender(sender) : await getAccessToken();
  const url = `${GMAIL_API}/users/${encodeURIComponent(mailbox)}/threads/${encodeURIComponent(threadId)}?format=metadata&metadataHeaders=To&metadataHeaders=From&metadataHeaders=Subject`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (res.status === 404) throw new GmailThreadMissingError(threadId);
  if (!res.ok) throw new Error(`Gmail threads.get failed (${res.status})`);
  const data = (await res.json()) as {
    messages?: Array<{ id?: string; labelIds?: string[]; internalDate?: string; payload?: { headers?: Array<{ name?: string; value?: string }> } }>;
  };
  return (data.messages ?? []).map((m) => {
    const headers = m.payload?.headers ?? [];
    const h = (name: string) => headers.find((x) => (x.name ?? '').toLowerCase() === name.toLowerCase())?.value ?? '';
    return {
      id: m.id ?? '',
      labelIds: m.labelIds ?? [],
      internalDate: new Date(Number(m.internalDate ?? 0)),
      to: h('To'),
      from: h('From'),
      subject: h('Subject'),
    };
  });
}

/** The RFC 822 Message-ID and Subject of one message (for threading a follow-up). Null when unreadable. */
export async function getGmailMessageHeaders(messageId: string, sender?: GmailSender): Promise<{ messageIdHeader: string | null; subject: string | null } | null> {
  try {
    const mailbox = sender?.userEmail ?? getGmailConfig().userEmail;
    const accessToken = sender ? await accessTokenForSender(sender) : await getAccessToken();
    const url = `${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=Subject`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    const data = (await res.json()) as { payload?: { headers?: Array<{ name?: string; value?: string }> } };
    const h = (name: string) => data.payload?.headers?.find((x) => (x.name ?? '').toLowerCase() === name.toLowerCase())?.value ?? null;
    return { messageIdHeader: h('Message-ID'), subject: h('Subject') };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// The GAP mailbox (red team T9): read EVERY recent inbox message of one
// delegated mailbox (casey@yardflow.ai), read or unread, with its labels, its
// full text and any delivery-status report, so replies AND bounces to GAP
// sends are consumed as execution feedback. Read-only: nothing is marked,
// labeled or moved.
// ---------------------------------------------------------------------------

export interface MailboxMessage {
  id: string;
  threadId: string;
  rfcMessageId: string | null;
  fromEmail: string;
  fromName: string;
  subject: string;
  snippet: string;
  /** The plain body with quoted history stripped (what the buyer typed). */
  bodyText: string;
  /** The plain body as sent, quoted history included (DSN bodies carry the failed address here). */
  rawText: string;
  bodyHtml: string;
  /** The `message/delivery-status` part of a DSN, decoded, or null. */
  deliveryStatus: string | null;
  labelIds: string[];
  receivedAt: Date;
  headers: Record<string, string>;
}

function extractDeliveryStatus(part: GmailMessagePart | undefined): string | null {
  let found: string | null = null;
  const walk = (node?: GmailMessagePart) => {
    if (!node || found !== null) return;
    const mime = (node.mimeType ?? '').toLowerCase();
    if (mime === 'message/delivery-status' && node.body?.data) found = decodeBase64Url(node.body.data);
    node.parts?.forEach(walk);
  };
  walk(part);
  return found;
}

/** How many message ids one run may list (ids only; cheap). Past this the listing is truncated. */
export const MAILBOX_LIST_CAP = 5000;

/**
 * The ids of `sender`'s inbox messages received after `afterEpoch`
 * (seconds), OLDEST FIRST, as one COMPLETE window (Release C re-review B1/S1).
 *
 * Gmail lists newest first, so a window holding more than MAILBOX_LIST_CAP
 * ids would silently drop its OLDEST mail. Instead the upper bound (`before:`)
 * is halved until the window is complete: the result is every id in
 * [afterEpoch, windowEnd), and the caller drains the rest on later runs.
 * `windowEnd` is null when the window runs to now. Throws on a list failure
 * (the caller must not advance its watermark on an unreadable mailbox).
 */
export async function listMailboxIds(
  sender: GmailSender,
  afterEpoch: number,
  nowEpoch: number = Math.floor(Date.now() / 1000),
): Promise<{ ids: string[]; windowEnd: number | null }> {
  const accessToken = await accessTokenForSender(sender);
  const mailbox = sender.userEmail.toLowerCase();
  const listWindow = async (before: number | null): Promise<{ ids: string[]; complete: boolean }> => {
    const listed: string[] = [];
    let pageToken: string | undefined;
    do {
      const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages`);
      // Final red team: every RECEIVED message, not only the inbox. A bounce or reply that a
      // filter archived or Gmail sent to spam before the poll is still a bounce or a reply.
      listUrl.searchParams.set('q', `-in:sent -in:drafts -in:chats after:${afterEpoch}${before !== null ? ` before:${before}` : ''}`);
      listUrl.searchParams.set('includeSpamTrash', 'true');
      listUrl.searchParams.set('maxResults', '500');
      if (pageToken) listUrl.searchParams.set('pageToken', pageToken);
      const res = await fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`Gmail mailbox list failed (${res.status})`);
      const data = (await res.json()) as { messages?: GmailMessage[]; nextPageToken?: string };
      for (const m of data.messages ?? []) listed.push(m.id);
      pageToken = data.nextPageToken;
    } while (pageToken && listed.length < MAILBOX_LIST_CAP);
    return { ids: listed, complete: !pageToken };
  };
  let before: number | null = null;
  for (let i = 0; i < 32; i += 1) {
    const w = await listWindow(before);
    // Newest first from Gmail: reverse for oldest first.
    if (w.complete) return { ids: w.ids.reverse(), windowEnd: before };
    const hi: number = before ?? nowEpoch;
    const mid: number = afterEpoch + Math.floor((hi - afterEpoch) / 2);
    if (mid <= afterEpoch) break;
    before = mid;
  }
  throw new Error(`Gmail mailbox window after ${afterEpoch} cannot be narrowed below ${MAILBOX_LIST_CAP} messages`);
}

/**
 * Delivery failure notices for one address in this mailbox (the legacy suppression review, 2026-10-05): Gmail's
 * mailer-daemon bounces that name the address, metadata only, at most `max`. Read only; throws on a read failure
 * (the caller reports the plane as not read).
 */
export async function countDeliveryFailures(sender: GmailSender, address: string, max = 5): Promise<{ found: number; newestAt: string | null }> {
  const accessToken = await accessTokenForSender(sender);
  const mailbox = sender.userEmail.toLowerCase();
  const email = address.trim().toLowerCase();
  const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages`);
  listUrl.searchParams.set('q', `from:mailer-daemon "${email}"`);
  listUrl.searchParams.set('includeSpamTrash', 'true');
  listUrl.searchParams.set('maxResults', String(max));
  const res = await fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Gmail delivery-failure list failed (${res.status})`);
  const data = (await res.json()) as { messages?: GmailMessage[]; resultSizeEstimate?: number };
  const ids = (data.messages ?? []).map((m) => m.id);
  if (!ids.length) return { found: 0, newestAt: null };
  const first = await fetch(`${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(ids[0])}?format=minimal`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!first.ok) throw new Error(`Gmail delivery-failure read failed (${first.status})`);
  const m = (await first.json()) as { internalDate?: string };
  const newestAt = m.internalDate ? new Date(Number(m.internalDate)).toISOString() : null;
  return { found: ids.length, newestAt };
}

/**
 * Ops closeout 13B: messages in this mailbox's Sent addressed to `recipient`
 * between two epochs (at most 10, metadata only). Used to reconcile a direct
 * send whose Gmail answer was lost. Throws on any read failure.
 */
export async function listSentTo(
  sender: GmailSender,
  recipient: string,
  afterEpoch: number,
  beforeEpoch: number,
): Promise<Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }>> {
  // The transport sink (./transport-sink.ts, GAP_SEND_TRANSPORT=sink, unset in production) is the harness mailbox:
  // its Sent folder is what it wrote. Real Gmail is never read under it.
  const sink = sinkConfig();
  if (sink) return sinkSentTo(sink, recipient, afterEpoch, beforeEpoch);
  const accessToken = await accessTokenForSender(sender);
  const mailbox = sender.userEmail.toLowerCase();
  const listUrl = new URL(`${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages`);
  listUrl.searchParams.set('q', `in:sent to:${recipient} after:${afterEpoch} before:${beforeEpoch}`);
  // Closeout review: a first touch sent and then trashed is still a first touch.
  listUrl.searchParams.set('includeSpamTrash', 'true');
  listUrl.searchParams.set('maxResults', '10');
  const res = await fetch(listUrl.toString(), { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Gmail sent list failed (${res.status})`);
  const data = (await res.json()) as { messages?: Array<{ id: string }> };
  const out: Array<{ id: string; threadId: string | null; internalDate: Date; to: string; subject: string }> = [];
  for (const { id } of data.messages ?? []) {
    const url = `${GMAIL_API}/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=To&metadataHeaders=Subject`;
    const m = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
    if (!m.ok) throw new Error(`Gmail sent get failed (${m.status})`);
    const d = (await m.json()) as { id: string; threadId?: string; internalDate?: string; payload?: { headers?: Array<{ name: string; value: string }> } };
    const header = (n: string) => d.payload?.headers?.find((h) => h.name.toLowerCase() === n)?.value ?? '';
    out.push({ id: d.id, threadId: d.threadId ?? null, internalDate: new Date(Number(d.internalDate ?? 0)), to: header('to'), subject: header('subject') });
  }
  return out;
}

/** One inbox message, read in full. */
export async function getMailboxMessage(sender: GmailSender, id: string): Promise<MailboxMessage> {
  const accessToken = await accessTokenForSender(sender);
  const mailbox = sender.userEmail.toLowerCase();
  const detail = await getMessageDetail(accessToken, mailbox, id);
  const from = getHeader(detail, 'From');
  const { html, text } = extractBodies(detail.payload);
  return {
    id: detail.id,
    threadId: detail.threadId,
    rfcMessageId: getHeader(detail, 'Message-ID') || null,
    fromEmail: extractEmail(from),
    fromName: extractName(from),
    subject: getHeader(detail, 'Subject'),
    snippet: detail.snippet || '',
    bodyText: stripQuotedReply(text),
    rawText: text,
    bodyHtml: html,
    deliveryStatus: extractDeliveryStatus(detail.payload),
    labelIds: detail.labelIds ?? [],
    receivedAt: detail.internalDate ? new Date(parseInt(detail.internalDate, 10)) : new Date(),
    headers: collectHeaders(detail),
  };
}
