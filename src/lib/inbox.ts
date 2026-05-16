import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/data';

/** Strips HTML to readable plain text — for rendering email bodies safely. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type ThreadMessage = {
  id: string;
  direction: 'sent' | 'received';
  fromLabel: string;
  bodyText: string;
  at: Date;
  read: boolean;
};

export type ThreadDetail = {
  id: string;
  subject: string | null;
  accountName: string | null;
  accountSlug: string | null;
  personaEmail: string | null;
  messages: ThreadMessage[];
  /** RFC 2822 Message-ID of the most recent inbound message — In-Reply-To. */
  lastInboundRfcId: string | null;
};

/** Loads one conversation — sent emails + inbound replies merged by date. */
export async function loadThread(threadId: string): Promise<ThreadDetail | null> {
  const [thread, inbound, sent] = await Promise.all([
    prisma.emailThread.findUnique({ where: { id: threadId } }),
    prisma.inboundMessage.findMany({
      where: { thread_id: threadId },
      orderBy: { received_at: 'asc' },
    }),
    prisma.emailLog.findMany({
      where: { thread_id: threadId },
      orderBy: { sent_at: 'asc' },
      select: {
        id: true,
        account_name: true,
        subject: true,
        body_html: true,
        sent_at: true,
        to_email: true,
      },
    }),
  ]);

  if (!thread && inbound.length === 0 && sent.length === 0) return null;

  const messages: ThreadMessage[] = [
    ...sent.map((row) => ({
      id: `sent-${row.id}`,
      direction: 'sent' as const,
      fromLabel: 'You',
      bodyText: htmlToText(row.body_html),
      at: row.sent_at,
      read: true,
    })),
    ...inbound.map((row) => ({
      id: row.id,
      direction: 'received' as const,
      fromLabel: row.from_name ?? row.from_email,
      bodyText:
        row.body_text || (row.body_html ? htmlToText(row.body_html) : '') || row.snippet || '',
      at: row.received_at,
      read: row.read,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const lastInbound = inbound[inbound.length - 1] ?? null;
  const accountName = thread?.account_name ?? sent[0]?.account_name ?? null;

  return {
    id: threadId,
    subject: thread?.subject ?? sent[0]?.subject ?? inbound[0]?.subject ?? null,
    accountName,
    accountSlug: accountName ? slugify(accountName) : null,
    personaEmail:
      thread?.persona_email ?? inbound[0]?.from_email ?? sent[0]?.to_email ?? null,
    messages,
    lastInboundRfcId: lastInbound?.rfc_message_id ?? null,
  };
}

/** Marks every unread inbound message in a thread as read. */
export async function markThreadRead(threadId: string): Promise<void> {
  await prisma.inboundMessage.updateMany({
    where: { thread_id: threadId, read: false },
    data: { read: true },
  });
}

export type InboxThreadRow = {
  id: string;
  subject: string | null;
  accountName: string | null;
  accountSlug: string | null;
  personaEmail: string | null;
  snippet: string;
  lastMessageAt: Date;
  unreadCount: number;
};

/** Lists conversations for the Engagement Inbox tab, newest-first. */
export async function loadInboxThreads(limit = 30): Promise<InboxThreadRow[]> {
  const threads = await prisma.emailThread.findMany({
    orderBy: { last_message_at: 'desc' },
    take: limit,
    include: { messages: { orderBy: { received_at: 'desc' } } },
  });

  return threads.map((thread) => {
    const latest = thread.messages[0];
    return {
      id: thread.id,
      subject: thread.subject,
      accountName: thread.account_name,
      accountSlug: thread.account_name ? slugify(thread.account_name) : null,
      personaEmail: thread.persona_email,
      snippet: latest?.snippet ?? latest?.body_text?.slice(0, 160) ?? '',
      lastMessageAt: thread.last_message_at,
      unreadCount: thread.messages.filter((message) => !message.read).length,
    };
  });
}
