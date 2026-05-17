/**
 * One-off admin endpoint — backfills historical sent emails into Gmail
 * threads so old conversations appear in the in-app inbox.
 *
 * Resumable: pass `?after=<lastId>` to continue from a cursor. Each call
 * runs within a time budget and reports `done` once no rows remain.
 *
 * This route is temporary and is removed once the backfill completes.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Ephemeral gate — this route is deleted after the one-time backfill.
const BACKFILL_TOKEN = '241dbe1d25522cf168b45b92392381b92c65aa987cf761b9';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';

async function getGmailAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Gmail not configured: missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
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

  const data = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description ?? 'Failed to get Gmail access token');
  }
  return data.access_token;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== BACKFILL_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const after = Number.parseInt(url.searchParams.get('after') ?? '0', 10) || 0;
  const userEmail = process.env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com';
  const deadlineMs = Date.now() + 210_000;

  let accessToken: string;
  try {
    accessToken = await getGmailAccessToken();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'gmail auth failed' },
      { status: 500 },
    );
  }

  const rows = await prisma.emailLog.findMany({
    where: { id: { gt: after }, thread_id: null, provider_message_id: { not: null } },
    select: { id: true, provider_message_id: true, account_name: true, subject: true, sent_at: true },
    orderBy: { id: 'asc' },
    take: 800,
  });

  let linked = 0;
  let skipped = 0;
  let lastId = after;
  const ensuredThreads = new Set<string>();

  for (const row of rows) {
    if (Date.now() > deadlineMs) break;
    lastId = row.id;
    if (!row.provider_message_id) {
      skipped += 1;
      continue;
    }

    try {
      const res = await fetch(
        `${GMAIL_API}/users/${encodeURIComponent(userEmail)}/messages/${encodeURIComponent(row.provider_message_id)}?format=minimal`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!res.ok) {
        skipped += 1;
        continue;
      }
      const data = (await res.json()) as { threadId?: string };
      const threadId = data.threadId;
      if (!threadId) {
        skipped += 1;
        continue;
      }

      await prisma.emailLog.update({ where: { id: row.id }, data: { thread_id: threadId } });
      if (!ensuredThreads.has(threadId)) {
        ensuredThreads.add(threadId);
        await prisma.emailThread.upsert({
          where: { id: threadId },
          create: {
            id: threadId,
            account_name: row.account_name,
            subject: row.subject,
            last_message_at: row.sent_at,
          },
          update: {},
        });
      }
      linked += 1;
    } catch {
      skipped += 1;
    }
  }

  const remaining = await prisma.emailLog.count({
    where: { id: { gt: lastId }, thread_id: null, provider_message_id: { not: null } },
  });

  return NextResponse.json({
    after,
    lastId,
    linked,
    skipped,
    threadsEnsured: ensuredThreads.size,
    remaining,
    done: remaining === 0,
  });
}
