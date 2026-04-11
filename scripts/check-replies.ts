#!/usr/bin/env npx tsx
/**
 * check-replies.ts — Bridge script: polls Gmail inbox for unread replies in the past 24h.
 * Prints a summary to stdout. Prepares for Sprint 2 (Reply Detection + Inbox Polling).
 *
 * Usage:
 *   npx tsx scripts/check-replies.ts
 *   npx tsx scripts/check-replies.ts --hours 48
 *
 * Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN in .env
 */
import 'dotenv/config';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

function getGmailConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN?.trim(),
    userEmail: process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com',
  };
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getGmailConfig();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
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

  const data = await res.json() as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to get access token');
  }
  return data.access_token;
}

interface GmailMessage {
  id: string;
  threadId: string;
}

interface GmailMessageDetail {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
  };
  internalDate?: string;
}

async function listReplies(accessToken: string, userEmail: string, hoursBack: number): Promise<GmailMessage[]> {
  const afterEpoch = Math.floor((Date.now() - hoursBack * 60 * 60 * 1000) / 1000);
  const query = `is:unread in:inbox after:${afterEpoch}`;

  const url = new URL(`${GMAIL_API}/users/${encodeURIComponent(userEmail)}/messages`);
  url.searchParams.set('q', query);
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail list failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json() as { messages?: GmailMessage[]; resultSizeEstimate?: number };
  return data.messages || [];
}

async function getMessageDetail(accessToken: string, userEmail: string, messageId: string): Promise<GmailMessageDetail> {
  const url = `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail get failed (${res.status}): ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<GmailMessageDetail>;
}

function getHeader(msg: GmailMessageDetail, name: string): string {
  return msg.payload?.headers?.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

async function main() {
  const hoursArg = process.argv.includes('--hours')
    ? parseInt(process.argv[process.argv.indexOf('--hours') + 1], 10)
    : 24;
  const hours = isNaN(hoursArg) ? 24 : hoursArg;

  console.log(`Checking for unread replies in the past ${hours} hours...\n`);

  const accessToken = await getAccessToken();
  const { userEmail } = getGmailConfig();
  const messages = await listReplies(accessToken, userEmail, hours);

  if (messages.length === 0) {
    console.log('No unread replies found.');
    return;
  }

  console.log(`Found ${messages.length} unread message(s):\n`);
  console.log('From'.padEnd(40) + 'Subject'.padEnd(50) + 'Date');
  console.log('-'.repeat(120));

  for (const msg of messages) {
    const detail = await getMessageDetail(accessToken, userEmail, msg.id);
    const from = getHeader(detail, 'From').slice(0, 38);
    const subject = getHeader(detail, 'Subject').slice(0, 48);
    const date = getHeader(detail, 'Date').slice(0, 30);
    console.log(`${from.padEnd(40)}${subject.padEnd(50)}${date}`);
  }

  console.log(`\nTotal: ${messages.length} unread message(s)`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
