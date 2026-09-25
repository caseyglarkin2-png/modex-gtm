/**
 * The Gmail identity GAP seller drafts use (closeout 2026-09-25).
 *
 * GAP drafts go out from casey@yardflow.ai: yardflow.ai publishes a Google
 * DKIM key, freightroll.com does not, and Casey chose not to configure
 * freightroll DKIM. This is GAP-only configuration; every other modex sender
 * keeps its env identity.
 *
 *   GAP_GMAIL_USER_EMAIL        the mailbox (e.g. casey@yardflow.ai)
 *   GAP_GOOGLE_DWD_SA_JSON      a Workspace domain-wide delegation service
 *                               account allowed gmail.modify for that mailbox
 *   GAP_GOOGLE_REFRESH_TOKEN    or: that user's refresh token for the app's
 *                               GOOGLE_CLIENT_ID/SECRET
 *   GAP_GMAIL_DISPLAY_NAME      optional From display name (default Casey Larkin)
 *
 * One function answers for BOTH draft creation and draft reconciliation, so a
 * draft is always read back from the mailbox it was created in. Unset means
 * `null`: callers fall back to the env identity and say so.
 */
import type { GmailSender } from '@/lib/email/gmail-sender';

export function gapGmailSender(env: Record<string, string | undefined> = process.env): GmailSender | null {
  const userEmail = env.GAP_GMAIL_USER_EMAIL?.trim().toLowerCase();
  if (!userEmail) return null;
  const displayName = env.GAP_GMAIL_DISPLAY_NAME?.trim() || 'Casey Larkin';
  const sa = env.GAP_GOOGLE_DWD_SA_JSON?.trim();
  if (sa) return { serviceAccountJson: sa, userEmail, displayName };
  const refreshToken = env.GAP_GOOGLE_REFRESH_TOKEN?.trim();
  if (refreshToken) return { refreshToken, userEmail, displayName };
  return null;
}
