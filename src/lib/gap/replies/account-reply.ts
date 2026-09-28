/**
 * Release C review S5 (red team T9): after someone at an account writes in
 * (a reply to a colleague's GAP email, an assistant, a forward), a cold first
 * touch to ANOTHER person there is a human's call, not the queue's. The
 * send gate refuses step 0 to anyone at a domain with a recent human inbound
 * message until a human has read it and recorded a disposition on it (the
 * hold clears then; re-review S7). A shared consumer domain, or our own, says
 * nothing about the account. Enforced at the send gate (step 0) and at live
 * enrollment.
 */
import { AUTO_REPLY_SUBJECT, FREEMAIL_DOMAINS, OWN_DOMAINS } from './domains';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** How far back an account's inbound message holds first touches to its people. */
export const ACCOUNT_REPLY_WINDOW_DAYS = 30;

export interface AccountReply {
  id: string;
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
    select: { id: true, from_email: true, subject: true, received_at: true },
    orderBy: { received_at: 'desc' },
    take: 20,
  });
  const human = rows.filter((r) => !AUTO_REPLY_SUBJECT.test(r.subject ?? ''));
  if (human.length === 0) return null;
  // A message a human has already read and dispositioned no longer holds anyone.
  const read: Array<{ source_id: string }> = prisma.conversationDisposition?.findMany
    ? await prisma.conversationDisposition.findMany({
        // Phase 2 D6: a reply that arrived through HubSpot is dispositioned as source_kind
        // hubspot_engagement (same inbound id); either kind of human disposition clears the hold.
        where: { source_kind: { in: ['inbound_message', 'hubspot_engagement'] }, source_id: { in: human.map((r) => r.id) }, human_confirmed: true },
        select: { source_id: true },
      })
    : [];
  const done = new Set(read.map((r) => r.source_id));
  return human.find((r) => !done.has(r.id)) ?? null;
}
