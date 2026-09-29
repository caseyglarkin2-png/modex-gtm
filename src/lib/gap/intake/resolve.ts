/**
 * UNIVERSAL WORK INTAKE: conservative identity for a supplied row (2026-09-28).
 *
 *   resolved        exactly one existing Persona (by email, LinkedIn profile,
 *                   or exact name at the resolved account), or one Account
 *   new_candidate   the account is known, the person is not: staged as an
 *                   AccountContactCandidate by the caller, never a Persona
 *   ambiguous       more than one possibility (two people with the name, an
 *                   ambiguous company, or an email at one account while the
 *                   stated company is another): never merged, Casey decides
 *   unresolved      no company, or a company GAP does not know: GAP never
 *                   creates an Account from a list
 *
 * Company resolution is the canonical gap/identity resolver (hubspot id,
 * verified domain, alias, normalized name; no fuzzy match). Pure.
 */
import { resolveIdentity, normalizeDomain, type IdentityContext } from '../identity/resolve';
import { normalizeCompanyName } from '../identity/normalize';
import { CREDENTIAL, type IntakeRow } from './parse';

export type IntakeResolution = 'resolved' | 'new_candidate' | 'ambiguous' | 'unresolved';

export interface IntakePersona {
  id: number;
  name: string;
  account_name: string;
  email: string | null;
  linkedin_url: string | null;
}

export interface IntakeContext {
  identity: IdentityContext;
  personas: readonly IntakePersona[];
}

export interface ResolvedRow {
  resolution: IntakeResolution;
  basis: string;
  accountName: string | null;
  personaId: number | null;
  candidates: Array<{ personaId: number | null; accountName: string; why: string }>;
}

const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.ca', 'ymail.com', 'rocketmail.com', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.net', 'gmx.de', 'mail.com', 'zoho.com', 'yandex.com', 'qq.com', '163.com', '126.com', 'comcast.net', 'att.net', 'sbcglobal.net', 'bellsouth.net', 'verizon.net', 'cox.net', 'charter.net', 'earthlink.net', 'optonline.net', 'frontier.com', 'windstream.net', 'fastmail.com', 'hey.com']);

/** Letters and digits in any script, lower case (a non-Latin name never becomes an empty key). */
const textKey = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();

/** A person's name for matching: credentials after a comma dropped ("Lee Placeholder, MBA"); "Doe, Jane" stays that person. */
export function personKey(name: string): string {
  const parts = name.split(',').map((p) => p.trim()).filter(Boolean);
  while (parts.length > 1 && CREDENTIAL.test(parts[parts.length - 1])) parts.pop();
  return textKey(parts.join(' '));
}

/** The /in/<slug> of a LinkedIn profile URL, or null. */
export function linkedinSlug(url: string | null | undefined): string | null {
  const m = url ? /linkedin\.com\/in\/([^/?#\s]+)/i.exec(url) : null;
  return m ? decodeURIComponent(m[1]).toLowerCase() : null;
}

function emailDomain(email: string | undefined): string | null {
  const d = email?.split('@')[1]?.trim().toLowerCase();
  return d && !FREE_MAIL.has(d) ? d : null;
}

/** The one key that makes a member unique within its source (a re-import never duplicates). */
export function memberKey(row: IntakeRow): string {
  if (row.kind === 'account') {
    if (row.company) return `account:${normalizeCompanyName(row.company)}`;
    return `domain:${normalizeDomain(row.companyDomain ?? '')}`;
  }
  if (row.email) return `email:${row.email.trim().toLowerCase()}`;
  const slug = linkedinSlug(row.linkedinUrl);
  if (slug) return `linkedin:${slug}`;
  if (row.sourceId) return `source:${row.sourceId.trim().toLowerCase()}`;
  // Name + company + title: two different people with one name at one company stay two members.
  const title = textKey(row.title ?? '');
  const where = row.company ? `${normalizeCompanyName(row.company)}${title ? `|${title}` : ''}` : title;
  return `name:${personKey(row.name ?? '')}|${where}`;
}

function resolveCompany(ctx: IntakeContext, row: IntakeRow): { accountName: string | null; basis: string; ambiguous: boolean } {
  // A stated company is resolved on its own words (an email's domain is the EMAIL's evidence, used only when no company is given).
  const domain = row.companyDomain ?? (row.company ? null : emailDomain(row.email)) ?? null;
  if (!row.company && !domain) return { accountName: null, basis: 'no_company', ambiguous: false };
  const r = resolveIdentity(ctx.identity, { rawName: row.company ?? null, domain });
  if (r.ok) return { accountName: r.accountName, basis: `company:${r.via}`, ambiguous: false };
  if (r.reason === 'ambiguous_identity') return { accountName: null, basis: 'company_ambiguous', ambiguous: true };
  return { accountName: null, basis: row.company ? 'company_not_in_gap' : 'no_company', ambiguous: false };
}

const none = (resolution: IntakeResolution, basis: string, accountName: string | null = null): ResolvedRow => ({ resolution, basis, accountName, personaId: null, candidates: [] });

export function resolveIntakeRow(ctx: IntakeContext, row: IntakeRow): ResolvedRow {
  const company = resolveCompany(ctx, row);
  if (row.kind === 'account') {
    if (company.accountName) return none('resolved', company.basis, company.accountName);
    return none(company.ambiguous ? 'ambiguous' : 'unresolved', company.basis);
  }

  // Strongest first: an email, then a LinkedIn profile.
  const email = row.email?.trim().toLowerCase();
  const byEmail = email ? ctx.personas.filter((p) => p.email?.trim().toLowerCase() === email) : [];
  const slug = linkedinSlug(row.linkedinUrl);
  const byLinkedin = !byEmail.length && slug ? ctx.personas.filter((p) => linkedinSlug(p.linkedin_url) === slug) : [];
  const direct = byEmail.length ? { hits: byEmail, via: 'email' } : byLinkedin.length ? { hits: byLinkedin, via: 'linkedin' } : null;
  if (direct) {
    if (direct.hits.length > 1) return { ...none('ambiguous', `${direct.via}_multiple`), candidates: direct.hits.map((p) => ({ personaId: p.id, accountName: p.account_name, why: direct.via })) };
    const p = direct.hits[0];
    // The person may have moved: a stated company that resolves elsewhere, or that GAP does not know, is for Casey to judge.
    if (row.company && company.accountName !== p.account_name) {
      const stated = company.accountName ?? `${row.company} (not in GAP)`;
      return { ...none('ambiguous', `${direct.via}_company_conflict`), candidates: [{ personaId: p.id, accountName: p.account_name, why: direct.via }, { personaId: null, accountName: stated, why: 'stated company' }] };
    }
    return { resolution: 'resolved', basis: direct.via, accountName: p.account_name, personaId: p.id, candidates: [] };
  }

  if (!company.accountName) return none(company.ambiguous ? 'ambiguous' : 'unresolved', company.basis);
  const key = row.name ? personKey(row.name) : '';
  const sameName = key ? ctx.personas.filter((p) => p.account_name === company.accountName && personKey(p.name) === key) : [];
  if (sameName.length === 1) return { resolution: 'resolved', basis: 'name_at_account', accountName: company.accountName, personaId: sameName[0].id, candidates: [] };
  if (sameName.length > 1) return { ...none('ambiguous', 'name_multiple', company.accountName), candidates: sameName.map((p) => ({ personaId: p.id, accountName: p.account_name, why: 'same name' })) };
  return none('new_candidate', company.basis, company.accountName);
}
