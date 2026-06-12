/**
 * Recipient domains we never import or write contacts for: live customers,
 * partners, and ourselves. Single source of truth for src/lib intake paths
 * (extracted from external-contact-import.ts so the clawd queue intake can
 * enforce the same trust boundary).
 */
import { parseDomainFromEmail } from '@/lib/contact-standard';

export const BLOCKED_DOMAINS = new Set([
  'dannon.com',
  'danone.com',
  'bluetriton.com',
  'yardflow.ai',
  'niagarawater.com',
  'lpcorp.com',
  'xpo.com',
  'kraftheinz.com',
  'freightroll.com',
]);

/** Whether this email's domain is on the do-not-import list. */
export function isBlockedRecipientDomain(email?: string | null): boolean {
  const domain = parseDomainFromEmail(email);
  return Boolean(domain && BLOCKED_DOMAINS.has(domain));
}
