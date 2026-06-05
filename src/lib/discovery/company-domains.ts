/**
 * Researched fallbacks for the email-pattern waterfall — used ONLY when our own
 * corpus (Persona/EmailLog) has no emails for a company. Most top prospects are
 * already covered by the corpus (jbhunt.com, pepsico.com, ryder.com, gxo.com,
 * nfiindustries.com, …); this seed fills net-new gaps. Extend by research.
 *
 * Keys are normalized company names (lowercase, alphanumerics + single spaces).
 */
import type { EmailPattern } from './email-pattern';

/** normalized company name → corporate email domain. */
export const COMPANY_DOMAIN_SEED: Record<string, string> = {
  'kuehne nagel': 'kuehne-nagel.com',
  'kuehne and nagel': 'kuehne-nagel.com',
  'dhl': 'dhl.com',
  'dhl supply chain': 'dhl.com',
  'sysco': 'sysco.com',
  'ikea': 'ingka.com',
  'kohls': 'kohls.com',
  'newell brands': 'newellco.com',
  'deckers brands': 'deckers.com',
  'us foods': 'usfoods.com',
  'performance food group': 'pfgc.com',
  'mclane': 'mclaneco.com',
};

/** domain → email pattern (only when corpus can't derive it). */
export const EMAIL_PATTERN_SEED: Record<string, EmailPattern> = {
  // Filled by research as needed; corpus detection is preferred over these.
  'kuehne-nagel.com': 'first.last',
  'dhl.com': 'first.last',
  'sysco.com': 'first.last',
};

/** Normalize a company name for seed-map lookups. */
export function companyKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
