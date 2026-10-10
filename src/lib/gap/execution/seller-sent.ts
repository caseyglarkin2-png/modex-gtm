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
 *
 * The account page's Sent coverage (Casey, 2026-10-10: "Reuse the canonical authorized mailbox/history reader rather
 * than a separate GAP-mailbox-only implementation. Respect sender identity and mailbox boundaries. Show which sources
 * were read and when; missing access means unknown, never 'nothing sent.'"): `sellerMailboxSlots` names every seller
 * mailbox, configured or not (a missing one is said, never skipped); every row carries the mailbox it came from; an
 * error names its mailbox. account-intel/sent.ts reads through these, the assignment's relationship through
 * `unionListSent`: one mailbox set, one per-mailbox reader, one merge.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';
import { gapGmailSender } from './gap-sender';

/** One Sent row (gmail-inbox.ts listSentTo's shape); `mailbox`: the seller mailbox it was read from. */
export type SellerSentRow = { id: string; threadId: string | null; internalDate: Date; to: string; subject: string; snippet?: string; mailbox?: string };
export type ListSentFrom = (sender: GmailSender, recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SellerSentRow[]>;

/** The GAP mailbox named when GAP_GMAIL_USER_EMAIL is not set (its address is then not known). */
export const GAP_MAILBOX_WORDS = 'the GAP mailbox';

/** One seller mailbox: its address and its sender, null when it is not configured (said, never skipped). */
export interface SellerMailboxSlot {
  address: string;
  sender: GmailSender | null;
}

/** The env identity's mailbox (the one check-inbox reads the inbound from), when its refresh token is set. */
export function envGmailSender(env: Record<string, string | undefined> = process.env): GmailSender | null {
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!refreshToken) return null;
  return { refreshToken, userEmail: (env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com').toLowerCase() };
}

/**
 * Every mailbox whose Sent is the seller's, configured or not: the GAP mailbox (casey@yardflow.ai), then the env mailbox
 * (casey@freightroll.com) when it is another address. A slot with no sender is a mailbox GAP cannot read.
 */
export function sellerMailboxSlots(env: Record<string, string | undefined> = process.env): SellerMailboxSlot[] {
  const gap = gapGmailSender(env);
  const own = envGmailSender(env);
  const gapAddress = gap?.userEmail ?? (env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase() || GAP_MAILBOX_WORDS);
  const ownAddress = own?.userEmail ?? (env.GMAIL_USER_EMAIL?.trim() || 'casey@freightroll.com').toLowerCase();
  if (ownAddress === gapAddress) return [{ address: gapAddress, sender: gap ?? own }];
  return [{ address: gapAddress, sender: gap }, { address: ownAddress, sender: own }];
}

/** The mailboxes whose Sent is the seller's and that GAP can read: the GAP mailbox, then the env mailbox when it is a different address. */
export function sellerMailboxes(env: Record<string, string | undefined> = process.env): GmailSender[] {
  return sellerMailboxSlots(env).map((s) => s.sender).filter((s): s is GmailSender => !!s);
}

/** The rows of every mailbox as one list: merged by message id (the first read wins), newest first. */
export function mergeSellerSent(rows: readonly SellerSentRow[]): SellerSentRow[] {
  const byId = new Map<string, SellerSentRow>();
  for (const r of rows) if (!byId.has(r.id)) byId.set(r.id, r);
  return [...byId.values()].sort((a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime());
}

/** One mailbox's Sent to one recipient, each row stamped with the mailbox it came from; a failure names the mailbox. */
export async function readMailboxSent(sender: GmailSender, read: ListSentFrom, recipient: string, afterEpoch: number, beforeEpoch: number): Promise<SellerSentRow[]> {
  const mailbox = sender.userEmail.toLowerCase();
  try {
    return (await read(sender, recipient, afterEpoch, beforeEpoch)).map((r) => ({ ...r, mailbox: r.mailbox ?? mailbox }));
  } catch (e) {
    throw new Error(`${mailbox}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** One Sent reader over every mailbox: each is asked; the rows merge by id, newest first; any failure fails the read. */
export function unionListSent(senders: readonly GmailSender[], read: ListSentFrom): (recipient: string, afterEpoch: number, beforeEpoch: number) => Promise<SellerSentRow[]> {
  return async (recipient, afterEpoch, beforeEpoch) => mergeSellerSent((await Promise.all(senders.map((s) => readMailboxSent(s, read, recipient, afterEpoch, beforeEpoch)))).flat());
}
