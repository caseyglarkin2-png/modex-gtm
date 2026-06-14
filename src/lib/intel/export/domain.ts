/**
 * account_domain derivation.
 *
 * None of the engagement tables store a canonical account_domain — they store
 * account_name. But in the cold-email model the person's email domain IS the
 * account domain (clawd's alias map then maps kdrp.com -> keurigdrpepper.com).
 * So we ALWAYS emit account_name and DERIVE account_domain from the person email
 * when it is a corporate domain. Free/consumer domains (gmail.com, etc.) are NOT
 * account domains, so we omit account_domain there and let clawd name-resolve.
 */

/** Consumer / free / non-corporate mailbox providers — never an account domain. */
const FREE_DOMAINS = new Set<string>([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'ymail.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'gmx.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'fastmail.com',
  'hey.com',
]);

/** Lowercase, trimmed domain portion of an email, or null if not a valid-looking address. */
export function emailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || domain.indexOf('.') < 0 || domain.indexOf(' ') >= 0) return null;
  return domain;
}

/**
 * The account domain to emit for a person email: the corporate domain, or
 * undefined when the email is free/consumer (or absent/malformed) so the field
 * is omitted from the record and clawd name-resolves.
 */
export function deriveAccountDomain(email: string | null | undefined): string | undefined {
  const domain = emailDomain(email);
  if (!domain) return undefined;
  if (FREE_DOMAINS.has(domain)) return undefined;
  return domain;
}
