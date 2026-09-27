/**
 * Commercial-email compliance constants and URLs, shared by the app templates
 * (templates.ts) and the GAP seller email (gap/execution/seller-draft.ts) so
 * the two can never disagree (red team T5).
 */
import { generateToken } from './unsubscribe-token';

/** The sender's physical postal address (CAN-SPAM). The address the app footer already carried. */
export const COMPANY_POSTAL_ADDRESS = 'FreightRoll Inc. · 330 E. Liberty St, Ann Arbor, MI 48104';

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app').replace(/\/+$/, '');
}

const signed = (email: string) => `email=${encodeURIComponent(email)}&token=${generateToken(email)}`;

/**
 * The RFC 8058 one-click target: the API route, with the signed identity in the
 * URL. A mailbox provider POSTs `List-Unsubscribe=One-Click` to exactly this.
 * The trailing slash is load-bearing: the app runs trailingSlash: true, so the
 * bare path answers a 308, and a provider is not obliged to follow a redirect
 * on a POST (measured 2026-09-26: POST /api/unsubscribe?... -> 308).
 */
export function oneClickUnsubscribeUrl(email: string): string {
  return `${appBaseUrl()}/api/unsubscribe/?${signed(email)}`;
}

/** The human-facing page a recipient lands on from the visible link. */
export function unsubscribePageUrl(email: string, emailLogId?: number | null): string {
  return `${appBaseUrl()}/unsubscribe/?${signed(email)}${emailLogId ? `&id=${emailLogId}` : ''}`;
}

/** RFC 8058 List-Unsubscribe headers (Gmail/Yahoo bulk-sender mandate). */
export function listUnsubscribeHeaders(email: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${oneClickUnsubscribeUrl(email)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
