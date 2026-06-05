/**
 * Draft Queue shared types + status constants.
 * Status/source are free Strings in the DB (matches EmailLog/SendJobRecipient),
 * but always referenced via STATUS here — never inline literals — so a typo
 * cannot silently break the claim updateMany or due-selection.
 */
export const STATUS = {
  draft: 'draft',
  approved: 'approved',
  sending: 'sending',
  sent: 'sent',
  failed: 'failed',
  skipped: 'skipped',
} as const;
export type QueueStatus = (typeof STATUS)[keyof typeof STATUS];

export type QueueSource = 'casey' | 'clawd';

/** Result of attempting to send one queued item. */
export type SendOutcome =
  | { status: 'sent'; emailLogId?: number; providerMessageId: string | null; threadId: string | null }
  | { status: 'skipped'; skippedReason: string }
  | { status: 'failed'; errorMessage: string; alreadySent: boolean };
