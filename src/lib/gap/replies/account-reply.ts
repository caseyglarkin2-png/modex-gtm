/**
 * Release C review S5 (red team T9): after someone at an account writes in
 * (a reply to a colleague's GAP email, an assistant, a forward), a cold first
 * touch to ANOTHER person there is a human's call, not the queue's. The
 * send gate refuses step 0 to anyone at a domain with a recent human inbound
 * message until it has been read and dispositioned elsewhere. A shared
 * consumer domain, or our own, says nothing about the account.
 */
import { FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** How far back an account's inbound message holds first touches to its people. */
export const ACCOUNT_REPLY_WINDOW_DAYS = 30;
const AUTO_REPLY_SUBJECT = /^\s*(automatic reply|auto[- ]?reply|autoreply|out of (the )?office|ooo\b|auto:)/i;

export interface AccountReply {
  from_email: string;
  subject: string | null;
  received_at: Date;
}

/** The newest human inbound message from the recipient's account domain in the window, or null. */
export async function accountRepliedRecently(prisma: PrismaLike, recipient: string, now: Date): Promise<AccountReply | null> {
  const domain = (recipient.split('@')[1] ?? '').trim().toLowerCase();
  if (!domain || FREEMAIL_DOMAINS.has(domain) || OWN_DOMAINS.has(domain)) return null;
  const rows: AccountReply[] = await prisma.inboundMessage.findMany({
    where: {
      from_email: { endsWith: `@${domain}`, mode: 'insensitive' },
      received_at: { gte: new Date(now.getTime() - ACCOUNT_REPLY_WINDOW_DAYS * 86_400_000) },
    },
    select: { from_email: true, subject: true, received_at: true },
    orderBy: { received_at: 'desc' },
    take: 20,
  });
  return rows.find((r) => !AUTO_REPLY_SUBJECT.test(r.subject ?? '')) ?? null;
}
