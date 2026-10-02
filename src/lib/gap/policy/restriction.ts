/**
 * ACCOUNT RESTRICTIONS, owned in ONE place (V2, 2026-10-02). A restricted account is never contacted cold: the only
 * way in is the named introduction. Every outbound writer reads this module (GAP motion, the GAP action-time check,
 * the legacy send guards, the Outbox writers, the campaign drip, Studio); `studio/guardrails.ts` delegates here.
 *
 * The list is a reviewed code constant on purpose: a restriction is an owner decision, git review is its audit trail,
 * and no owner surface exists to set one in production. Account.best_intro_path, outreach_status, warm_intro,
 * Persona.intro_route and the microsite data ECHO the rule for display; none of them is the policy.
 *
 * Matching fails closed: whole words of the account name or any of its aliases, and the recipient's email domain
 * (subdomains included). Replies in an existing thread are not gated here (the buyer wrote to us).
 */
import { normalizeCompanyName } from '../identity/normalize';

export interface AccountRestriction {
  kind: 'WARM_INTRO_ONLY';
  /** The canonical account the rule is about. */
  account: string;
  /** Who holds the introduction (a relationship, never a buyer row). */
  introducer: string;
  /** Where the introduction leads. */
  route: string;
  /** The seller-facing sentence. */
  reason: string;
}

interface RestrictionRule extends AccountRestriction {
  /** Whole name words that identify the account (lower case). */
  names: readonly string[];
  /** Email domains owned by the account. */
  domains: readonly string[];
}

const RULES: readonly RestrictionRule[] = [
  {
    kind: 'WARM_INTRO_ONLY',
    account: 'Dannon',
    names: ['dannon', 'danone'],
    domains: ['danone.com', 'dannon.com'],
    introducer: 'Mark Shaughnessy',
    route: 'the Danone CSCO office',
    reason: 'Warm intro only: Dannon is reached only through Mark Shaughnessy\'s introduction to the Danone CSCO office. No cold outreach.',
  },
];

const words = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(Boolean);

const view = (r: RestrictionRule): AccountRestriction => ({ kind: r.kind, account: r.account, introducer: r.introducer, route: r.route, reason: r.reason });

/** The restriction on an account name (whole words), else null. */
export function restrictionForName(name: string | null | undefined): AccountRestriction | null {
  const w = new Set(words(String(name ?? '')));
  const hit = RULES.find((r) => r.names.some((n) => w.has(n)));
  return hit ? view(hit) : null;
}

/** The restriction on an email recipient's domain (subdomains included), else null. */
export function restrictionForEmail(email: string | null | undefined): AccountRestriction | null {
  const domain = String(email ?? '').toLowerCase().trim().split('@')[1] ?? '';
  if (!domain) return null;
  const hit = RULES.find((r) => r.domains.some((d) => domain === d || domain.endsWith(`.${d}`)));
  return hit ? view(hit) : null;
}

/** The restriction on an account, its aliases, its domains or a recipient, else null. */
export function restrictionFor(x: { name?: string | null; aliases?: readonly string[]; domains?: readonly string[]; email?: string | null }): AccountRestriction | null {
  for (const n of [x.name, ...(x.aliases ?? [])]) {
    const r = restrictionForName(n);
    if (r) return r;
  }
  for (const d of x.domains ?? []) {
    const r = restrictionForEmail(`x@${d}`);
    if (r) return r;
  }
  return restrictionForEmail(x.email);
}

type AliasDb = { gapAccountAlias?: { findMany: (q: unknown) => Promise<Array<{ alias: string; account_name: string }>> } };

/**
 * The restriction for an account, read with its GAP aliases both ways (an alias that names a restricted account, or
 * a restricted alias recorded on this account). Throws when the alias read fails; callers fail closed.
 */
export async function restrictionForAccount(db: AliasDb, accountName: string, email?: string | null): Promise<AccountRestriction | null> {
  const direct = restrictionFor({ name: accountName, email });
  if (direct) return direct;
  // A client with no alias table (a narrow test double) has no aliases to read; a real read that fails throws.
  if (typeof db.gapAccountAlias?.findMany !== 'function') return null;
  const norm = normalizeCompanyName(accountName);
  const rows = await db.gapAccountAlias.findMany({ where: { OR: [{ account_name: accountName }, { normalized_alias: norm }] }, select: { alias: true, account_name: true } });
  return restrictionFor({ aliases: rows.flatMap((r) => [r.alias, r.account_name]) });
}
