/**
 * Recipient domains we never import or write contacts for. Single source of
 * truth for src/lib intake paths (extracted from external-contact-import.ts
 * so the clawd queue intake can enforce the same trust boundary).
 *
 * Two distinct reasons live in this list. Do not collapse them, and do not
 * remove a domain without knowing which bucket it is in.
 */
import { parseDomainFromEmail } from '@/lib/contact-standard';

/** Live customers, partners, active deals, and ourselves. */
const RELATIONSHIP_DOMAINS = [
  'dannon.com',
  'danone.com',
  'bluetriton.com',
  'lpcorp.com',
  'xpo.com',
  'kraftheinz.com',
  'yardflow.ai',
  'freightroll.com',
];

/**
 * Competitors of our reference customer (Primo Brands / BlueTriton).
 *
 * These are PROSPECTS, not off-limits accounts. Per the standing rule,
 * a competitor is among our most qualified prospects. They are blocked from
 * AUTOMATED intake and drip only, because generated copy inherits the Primo
 * proof point by default and naming Primo to a competitor is a hard
 * violation. That failure is not hypothetical: between 2026-05-01 and
 * 2026-06-10, five automated or templated messages named Primo Brands to
 * Niagara contacts, including a subject line reading "Primo is 2.7 miles
 * from Upper Macungie and already running this."
 *
 * Casey's manual 1:1 outreach to these accounts is unaffected by this list
 * and remains correct. Before removing a domain here, make sure the sending
 * path anonymizes the reference to "a national bottled water producer".
 */
const PRIMO_COMPETITOR_DOMAINS = ['niagarawater.com'];

export const BLOCKED_DOMAINS = new Set([
  ...RELATIONSHIP_DOMAINS,
  ...PRIMO_COMPETITOR_DOMAINS,
]);

/** Whether this email's domain is on the do-not-import list. */
export function isBlockedRecipientDomain(email?: string | null): boolean {
  const domain = parseDomainFromEmail(email);
  return Boolean(domain && BLOCKED_DOMAINS.has(domain));
}
