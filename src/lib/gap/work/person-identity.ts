/**
 * PERSON TO ACCOUNT (C02, C03 of the commercial-context audit, 2026-10-08). Pure.
 *
 * A person who wrote to the mailbox is placed at an account through the SAME identity machinery the opportunity
 * resolver uses (identity/resolve.ts: HubSpot company id, verified domain, registered alias, normalized name), in
 * this order: the GAP persona's account, the HubSpot company of the contact (when the CRM read carried it), the
 * thread's account, the sender domain. A competing match stays AMBIGUOUS (said, never guessed); nothing here
 * creates a persona, an account or a CRM record.
 *
 * Seller acceptance C5 (2026-10-09): ambiguity is said WITH ITS NAMES (`candidates`, and `claimed`: the domain or
 * name they claimed), never as "no account yet" (October 9: kencogroup.com is claimed by Kenco and Kenco Logistics
 * Services through conflicted canonical links, an open duplicate since May 5). One general tie-break, no names hard
 * coded (tieBreakFamily): when the candidates are ONE FAMILY (one's parent brand is the other's name, or they are
 * linked by an open duplicate_company conflict) and exactly one of them is in an open deal under a complete CRM
 * read, the person is placed at that one with via 'family_deal' and the duplicate named; when no deal distinguishes
 * them, the ambiguity stands and is said.
 */
import { resolveIdentity, type IdentityContext, type IdentityVia } from '../identity/resolve';
import { emailDomain } from '../opportunity/active-opportunity';

export type PersonVia = 'persona' | 'hubspot_contact' | 'family_deal' | IdentityVia | null;

export interface PersonAccount {
  accountName: string | null;
  via: PersonVia;
  /** Two accounts claimed the sender's domain or name: the person stays unplaced until Casey names the account. */
  ambiguous: boolean;
  domain: string | null;
  /** C5: the account names that claimed the domain or the name (empty when nothing claimed it or one account resolved). */
  candidates: string[];
  /** C5: what they claimed (the domain, or the thread's name); null when not ambiguous. */
  claimed: string | null;
}

export interface PersonAccountInput {
  email: string;
  persona?: { account_name?: string | null } | null;
  /** The HubSpot company ids the CRM associates with this contact (a live read; empty when unread). */
  hubspotCompanyIds?: readonly string[];
  threadAccount?: string | null;
  identity?: IdentityContext | null;
}

const FREEMAIL = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'me.com', 'live.com', 'msn.com', 'protonmail.com']);

const placedAt = (accountName: string, via: PersonVia, domain: string | null): PersonAccount => ({ accountName, via, ambiguous: false, domain, candidates: [], claimed: null });
const ambiguousAmong = (candidates: readonly string[], claimed: string, domain: string | null): PersonAccount => ({ accountName: null, via: null, ambiguous: true, domain, candidates: [...new Set(candidates)], claimed });

export function resolvePersonAccount(input: PersonAccountInput): PersonAccount {
  const domain = emailDomain(input.email);
  if (input.persona?.account_name) return placedAt(input.persona.account_name, 'persona', domain);
  const ctx = input.identity ?? null;
  if (ctx) {
    for (const id of input.hubspotCompanyIds ?? []) {
      const r = resolveIdentity(ctx, { hubspotCompanyId: id });
      if (r.ok) return placedAt(r.accountName, 'hubspot_contact', domain);
    }
  }
  if (input.threadAccount) {
    // The thread names an account; through the identity context it may be an alias of the canonical name.
    const r = ctx ? resolveIdentity(ctx, { rawName: input.threadAccount }) : null;
    if (r?.ok && !r.conflict) return placedAt(r.accountName, r.via, domain);
    if (r && !r.ok && r.reason === 'ambiguous_identity') return ambiguousAmong(r.candidates ?? [], input.threadAccount, domain);
    if (!ctx) return placedAt(input.threadAccount, 'normalized', domain);
  }
  if (ctx && domain && !FREEMAIL.has(domain)) {
    const r = resolveIdentity(ctx, { domain });
    if (r.ok && !r.conflict) return placedAt(r.accountName, r.via, domain);
    if (r.ok && r.conflict) return ambiguousAmong([r.accountName, r.conflict.accountName], domain, domain);
    if (!r.ok && r.reason === 'ambiguous_identity') return ambiguousAmong(r.candidates ?? [], domain, domain);
  }
  return { accountName: null, via: null, ambiguous: false, domain, candidates: [], claimed: null };
}

/** ---------- C5: the family tie-break ---------- */

/** What the accounts table and the open duplicate_company conflicts say about a set of names (read by the caller, one bounded query each). */
export interface FamilyFacts {
  /** account name (as stored) -> its parent_brand, when set. */
  parentBrand: ReadonlyMap<string, string | null>;
  /** account name -> its open duplicate_company conflict: the canonical company it collides on, the names the reason lists, and when it was opened. */
  duplicates: ReadonlyMap<string, { companyId: string | null; collidesWith: readonly string[]; since: string | null }>;
}

export const EMPTY_FAMILY: FamilyFacts = { parentBrand: new Map(), duplicates: new Map() };

const same = (a: string | null | undefined, b: string | null | undefined) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const lookup = <T,>(m: ReadonlyMap<string, T>, name: string): T | undefined => m.get(name) ?? [...m.entries()].find(([k]) => same(k, name))?.[1];
const earliest = (xs: Array<string | null | undefined>) => xs.filter((x): x is string => !!x).sort()[0] ?? null;

/** Two accounts are one family when one's parent brand is the other's name, or an open duplicate_company conflict links them. */
export function sameFamily(a: string, b: string, facts: FamilyFacts): { kind: 'parent_brand' | 'duplicate'; since: string | null } | null {
  const da = lookup(facts.duplicates, a);
  const db = lookup(facts.duplicates, b);
  if (da && db && da.companyId && da.companyId === db.companyId) return { kind: 'duplicate', since: earliest([da.since, db.since]) };
  if (da?.collidesWith.some((n) => same(n, b)) || db?.collidesWith.some((n) => same(n, a))) return { kind: 'duplicate', since: earliest([da?.since, db?.since]) };
  if (same(lookup(facts.parentBrand, a), b) || same(lookup(facts.parentBrand, b), a)) return { kind: 'parent_brand', since: null };
  return null;
}

export type FamilyTieBreak = { accountName: string; others: string[]; kind: 'parent_brand' | 'duplicate'; since: string | null };

/**
 * The candidates are one family (every pair linked) and the family's open deal settles the placement. `dealAccountOf`
 * answers, under a complete CRM read only, the account name the CRM read RECORDS a candidate's open deal under (the
 * in-deals summary folds a duplicate onto its deal-holding account: "Kenco", alsoRecordedAs "Kenco Logistics
 * Services", one deal), or null when the candidate is in no deal; `true` stands for the candidate's own name. When
 * every in-deal candidate resolves to the SAME recorded name and that name is one of the candidates, the person is
 * placed there; when the in-deal candidates resolve to different recorded accounts (two deals, two accounts), or no
 * candidate is in a deal, the ambiguity stands (null).
 */
export function tieBreakFamily(candidates: readonly string[], facts: FamilyFacts, dealAccountOf: (accountName: string) => string | boolean | null): FamilyTieBreak | null {
  const names = [...new Set(candidates)];
  if (names.length < 2) return null;
  let kind: 'parent_brand' | 'duplicate' | null = null;
  let since: string | null = null;
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const f = sameFamily(names[i], names[j], facts);
      if (!f) return null;
      if (f.kind === 'duplicate' || !kind) kind = f.kind;
      since = earliest([since, f.since]);
    }
  }
  const recorded = new Set<string>();
  for (const n of names) {
    const r = dealAccountOf(n);
    const name = r === true ? n : typeof r === 'string' && r.trim() ? r.trim() : null;
    if (name) recorded.add(name.toLowerCase());
  }
  if (recorded.size !== 1 || !kind) return null;
  const [one] = [...recorded];
  const holder = names.find((n) => n.toLowerCase() === one);
  if (!holder) return null;
  return { accountName: holder, others: names.filter((n) => n !== holder), kind, since };
}
