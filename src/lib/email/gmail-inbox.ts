/**
 * Gmail Inbox Polling Module — Detects prospect replies to casey@freightroll.com.
 * Used by /api/cron/check-inbox to create Notifications and update email status.
 */
import * as Sentry from '@sentry/nextjs';

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
      });
    } catch (err) {
      Sentry.captureException(err, { extra: { messageId: msg.id } });
    }
  }

  return replies;
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

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
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
