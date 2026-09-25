/**
 * GAP Prospecting OS: pure canonical-identity resolver (Sprint 6A).
 *
 * Every fact source names a company by whatever it happened to have on hand
 * (a Pounce trigger's scraped name, a HubSpot company id, a persona's email
 * domain, an operator's typed alias). This resolves any of those to exactly
 * one `accounts.name`, or refuses with a typed reason. It never creates an
 * Account and it never guesses: an unresolved or ambiguous input is refused,
 * not defaulted.
 *
 * Precedence (owner ruling, 2026-09-24, GAP_RUNTIME_HANDOFF addendum):
 *   A. an associated HubSpot company id (`accounts.hubspot_company_id`, unique)
 *   B. a verified normalized domain (revops canonical company -> account link)
 *   C. an explicit, previously registered alias (GapAccountAlias)
 *   D. the normalized legal/display name -- a FALLBACK candidate only
 *
 * Deterministic string identity, never fuzzy/edit-distance matching: the goal
 * is exact identity, not a best guess. Within tier D, an exact raw-string
 * match against an account name is preferred over a merely-normalized one
 * (confidence 100 vs a lower score) and can never itself be ambiguous, since
 * account names are unique; a normalized-only collision across two different
 * accounts refuses `ambiguous_identity` rather than picking one.
 *
 * A higher tier ALWAYS wins over a lower one that disagrees; when that
 * happens the disagreement is not swallowed, it is returned as `conflict` so
 * the caller can audit it (see hypothesis/hypothesize.ts and
 * src/lib/gap/audit.ts). A tier with more than one candidate (an ambiguous
 * domain shared by two accounts, or two accounts that normalize to the same
 * name) never wins on its own; resolution simply falls through to the next
 * tier, and if NO tier resolves to exactly one candidate the result is
 * `ambiguous_identity` when some tier had candidates, else `unresolved_company`.
 *
 * Pure: the caller loads the `IdentityContext` snapshot (see service.ts);
 * this module does no I/O and reads no clock.
 */

import { normalizeCompanyName } from './normalize';

export type IdentityVia = 'hubspot_company_id' | 'domain' | 'alias' | 'normalized';

export interface IdentityContext {
  /** accounts.hubspot_company_id -> accounts.name. Unique by construction (DB unique index). */
  accountsByHubspotCompanyId: ReadonlyMap<string, string>;
  /** normalized domain -> the account name(s) a "verified"/resolved canonical link points at. */
  verifiedDomainToAccounts: ReadonlyMap<string, readonly string[]>;
  /** normalized alias key -> the account name(s) explicitly registered under it. */
  aliasToAccounts: ReadonlyMap<string, readonly string[]>;
  /** every known account name, for the normalized-name fallback tier. */
  accountNames: readonly string[];
}

export interface IdentityInput {
  rawName?: string | null;
  domain?: string | null;
  hubspotCompanyId?: string | null;
}

export interface IdentityConflict {
  via: IdentityVia;
  accountName: string;
}

export type ResolveIdentityResult =
  | { ok: true; accountName: string; via: IdentityVia; confidence: number; conflict?: IdentityConflict }
  | { ok: false; reason: 'no_input' | 'unresolved_company' | 'ambiguous_identity' };

interface TierResult {
  via: IdentityVia;
  /** distinct account names this tier matched. 0 = no match, >1 = ambiguous within this tier. */
  accounts: string[];
  /** tier D only: true when the match was an exact raw-string equality, not merely a normalized one. */
  exact?: boolean;
}

function dedupe(names: readonly string[]): string[] {
  return Array.from(new Set(names));
}

export function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, '');
}

function tierHubspotCompanyId(ctx: IdentityContext, input: IdentityInput): TierResult {
  if (!input.hubspotCompanyId) return { via: 'hubspot_company_id', accounts: [] };
  const name = ctx.accountsByHubspotCompanyId.get(input.hubspotCompanyId.trim());
  return { via: 'hubspot_company_id', accounts: name ? [name] : [] };
}

function tierDomain(ctx: IdentityContext, input: IdentityInput): TierResult {
  if (!input.domain) return { via: 'domain', accounts: [] };
  const names = ctx.verifiedDomainToAccounts.get(normalizeDomain(input.domain)) ?? [];
  return { via: 'domain', accounts: dedupe(names) };
}

function tierAlias(ctx: IdentityContext, input: IdentityInput): TierResult {
  if (!input.rawName) return { via: 'alias', accounts: [] };
  const names = ctx.aliasToAccounts.get(normalizeCompanyName(input.rawName)) ?? [];
  return { via: 'alias', accounts: dedupe(names) };
}

function tierNormalized(ctx: IdentityContext, input: IdentityInput): TierResult {
  if (!input.rawName) return { via: 'normalized', accounts: [] };
  const raw = input.rawName.trim();
  const exactMatches = ctx.accountNames.filter((n) => n === raw);
  if (exactMatches.length > 0) {
    return { via: 'normalized', accounts: dedupe(exactMatches), exact: true };
  }
  const key = normalizeCompanyName(raw);
  const names = ctx.accountNames.filter((n) => normalizeCompanyName(n) === key);
  return { via: 'normalized', accounts: dedupe(names), exact: false };
}

const TIER_CONFIDENCE: Record<IdentityVia, number> = {
  hubspot_company_id: 100,
  domain: 95,
  alias: 90,
  normalized: 70,
};

/** Precedence order, highest first. */
const TIERS: Array<(ctx: IdentityContext, input: IdentityInput) => TierResult> = [
  tierHubspotCompanyId,
  tierDomain,
  tierAlias,
  tierNormalized,
];

export function resolveIdentity(ctx: IdentityContext, input: IdentityInput): ResolveIdentityResult {
  if (!input.rawName && !input.domain && !input.hubspotCompanyId) {
    return { ok: false, reason: 'no_input' };
  }

  const tiers = TIERS.map((tier) => tier(ctx, input));
  const resolved = tiers.find((t) => t.accounts.length === 1);

  if (!resolved) {
    const anyCandidates = tiers.some((t) => t.accounts.length > 0);
    return { ok: false, reason: anyCandidates ? 'ambiguous_identity' : 'unresolved_company' };
  }

  const accountName = resolved.accounts[0];
  const confidence = resolved.via === 'normalized' && resolved.exact ? 100 : TIER_CONFIDENCE[resolved.via];

  let conflict: IdentityConflict | undefined;
  for (const t of tiers) {
    if (t === resolved) continue;
    if (t.accounts.length === 1 && t.accounts[0] !== accountName) {
      conflict = { via: t.via, accountName: t.accounts[0] };
      break;
    }
  }

  return conflict ? { ok: true, accountName, via: resolved.via, confidence, conflict } : { ok: true, accountName, via: resolved.via, confidence };
}
