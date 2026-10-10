/**
 * THE SELLER'S SENT IN BOTH MAILBOXES (the people fix, 2026-10-10; Lazer). Server only; read only.
 *
 * GAP reads the seller's INBOUND from two mailboxes (the GAP mailbox, casey@yardflow.ai, through the gap-mailbox cron;
 * the env identity, casey@freightroll.com, through check-inbox with GOOGLE_REFRESH_TOKEN), but read his SENT from the
 * GAP mailbox alone. They are two Google mailboxes (a briefing from yardflow.ai lands in the freightroll INBOX; a
 * reply from freightroll carries SENT there). So a reply Casey wrote from casey@freightroll.com was invisible: the
 * October 9 briefing said "No exchange either way in 18 days (last: Sep 21, they wrote)" for Cristian at Lazer
 * Logistics while Casey's reply of 14:38Z on Sep 21 (Gmail 1a0c4673d9d75a75, from casey@freightroll.com) sat in the
 * freightroll Sent.
 *
 * The seller's Sent is every such mailbox: the GAP mailbox first, then the env mailbox when it is another address.
 * One reader asks each; the rows merge by message id, newest first; a mailbox that fails fails the whole read, so a
 * half read is never said as read (the callers then say "our Sent could not be read"). Drafts stay the GAP mailbox's
 * (GAP creates them there). Nothing here writes.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';
import { gapGmailSender } from './gap-sender';

/** One Sent row (gmail-inbox.ts listSentTo's shape). */
export type SellerSentRow = { id: string; threadId: string | null; internalDate: Date; to: string; subject: string; snippet?: string };
export type ListSentFrom = (sender: GmailSender, recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SellerSentRow[]>;

/** The env identity's mailbox (the one check-inbox reads the inbound from), when its refresh token is set. */
export function envGmailSender(env: Record<string, string | undefined> = process.env): GmailSender | null {
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!refreshToken) return null;
  return { refreshToken, userEmail: (env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com').toLowerCase() };
}

/** The mailboxes whose Sent is the seller's: the GAP mailbox, then the env mailbox when it is a different address. */
export function sellerMailboxes(env: Record<string, string | undefined> = process.env): GmailSender[] {
  const out: GmailSender[] = [];
  const gap = gapGmailSender(env);
  if (gap) out.push(gap);
  const own = envGmailSender(env);
  if (own && !out.some((s) => s.userEmail.toLowerCase() === own.userEmail)) out.push(own);
  return out;
}

/** One Sent reader over every mailbox: each is asked; the rows merge by id, newest first; any failure fails the read. */
export function unionListSent(senders: readonly GmailSender[], read: ListSentFrom): (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SellerSentRow[]> {
  return async (recipient, afterEpoch, beforeEpoch) => {
    const rows = await Promise.all(senders.map((s) => read(s, recipient, afterEpoch, beforeEpoch)));
    const byId = new Map<string, SellerSentRow>();
    for (const r of rows.flat()) if (!byId.has(r.id)) byId.set(r.id, r);
    return [...byId.values()].sort((a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime());
  };
}
