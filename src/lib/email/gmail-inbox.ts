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

export interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
}

export interface ReplyMetadata {
  messageId: string;
  threadId: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
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

      replies.push({
        messageId: detail.id,
        threadId: detail.threadId,
        from,
        fromEmail,
        subject: getHeader(detail, 'Subject'),
        snippet: detail.snippet || '',
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
 * Fetch full message metadata from Gmail.
 */
async function getMessageDetail(
  accessToken: string,
  userEmail: string,
  messageId: string,
): Promise<GmailMessageDetail> {
  const url = `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=In-Reply-To&metadataHeaders=References`;

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
