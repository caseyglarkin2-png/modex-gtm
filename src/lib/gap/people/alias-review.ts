/**
 * ALIAS REVIEW: a governed alias workflow over the existing GapAccountAlias model (enterprise graph, 2026-10-05).
 *
 * A banner or subsidiary with its own name (Central Market at H-E-B, King Soopers and City Market at Kroger, SDR
 * Distribution at NFI) reads as an employment conflict until an alias exists. This module turns that conflict
 * evidence (the CRM or provider company spelling that is NOT sameEmployer with the account) into POSSIBLE ACCOUNT
 * ALIAS proposals, and gives Casey two governed answers: confirm (registerAlias, source 'manual', one
 * account.alias_confirmed audit row) or reject (one account.alias_rejected audit row, remembered so the proposal
 * does not come back). Proposals NEVER become aliases by themselves; name similarity never creates anything; an
 * alias that is itself another GAP account is identity, not an alias, and is refused. No code change for a future
 * banner: the next one is a row, not a release. Nothing here writes HubSpot, calls Apollo, or creates an account.
 */
import { registerAlias } from '../identity/service';
import { normalizeCompanyName } from '../identity/normalize';
import { sameEmployer } from './employment';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface AliasProposal {
  /** The spelling as the evidence carries it (the first seen). */
  company: string;
  /** The GAP account it would map to. */
  canonical: string;
  /** Seller-readable evidence lines. */
  evidence: string[];
  /** normalizeCompanyName(company): the key the alias table would hold. */
  key: string;
}

export interface AliasConflictEvidence {
  personName: string;
  company: string;
  /** "HubSpot", "Apollo intake", "LinkedIn profile" ... */
  source: string;
  at: string | null;
}

export interface ProposeAliasesInput {
  accountName: string;
  aliases: readonly string[];
  domains: readonly string[];
  conflicts: AliasConflictEvidence[];
  /** Normalized keys Casey already rejected (loadRejectedAliases). */
  rejected: readonly string[];
}

/** Spellings that name no company: a function word, a placeholder, or what a person types when there is none. */
const NOT_A_COMPANY = new Set([
  'logistics', 'transportation', 'transport', 'services', 'service', 'industries', 'group', 'company', 'holdings', 'distribution', 'foods', 'food', 'supply', 'supply chain', 'operations', 'warehouse', 'warehousing', 'trucking', 'freight', 'retail', 'manufacturing', 'international', 'global', 'american', 'national', 'general', 'united', 'delta', 'central', 'market', 'the',
  'self', 'self employed', 'selfemployed', 'freelance', 'freelancer', 'independent', 'consultant', 'consulting', 'contractor', 'retired', 'student', 'unemployed', 'unknown', 'none', 'n a', 'na', 'null', 'various', 'confidential', 'private', 'home', 'test', 'tbd',
]);

const letters = (s: string) => s.replace(/[^a-z0-9]/g, '');
const day = (iso: string | null) => (iso && !Number.isNaN(new Date(iso).getTime()) ? new Date(iso).toISOString().slice(0, 10) : null);
const isHubSpot = (source: string) => /hubspot|\bcrm\b/i.test(source);

/** Is this spelling even eligible to be an alias of anything? Shared by the proposal and the confirm. */
export function aliasSpellingProblem(alias: string): string | null {
  const key = normalizeCompanyName(alias);
  const l = letters(key);
  if (l.length < 3 && !/\d/.test(l)) return 'shorter than three letters';
  if (NOT_A_COMPANY.has(key)) return 'a generic word, not a company';
  return null;
}

/**
 * POSSIBLE ACCOUNT ALIAS proposals from employment-conflict evidence: one per normalized spelling, with the evidence
 * lines, most evidence first. Pure. A spelling already an alias, already the account (by the same employer rule the
 * gate reads), already rejected, generic, a person's own name, or shorter than three letters is never proposed.
 */
export function proposeAliases(input: ProposeAliasesInput): AliasProposal[] {
  const known = new Set<string>([normalizeCompanyName(input.accountName), ...input.aliases.map(normalizeCompanyName), ...input.rejected.map((r) => normalizeCompanyName(r))]);
  const groups = new Map<string, { company: string; rows: AliasConflictEvidence[] }>();
  for (const c of input.conflicts) {
    const company = String(c.company ?? '').trim();
    if (!company) continue;
    const key = normalizeCompanyName(company);
    if (known.has(key) || aliasSpellingProblem(company)) continue;
    if (normalizeCompanyName(String(c.personName ?? '')) === key) continue;
    if (sameEmployer(company, input.accountName, input.aliases, input.domains)) continue;
    const g = groups.get(key) ?? { company, rows: [] };
    g.rows.push(c);
    groups.set(key, g);
  }
  const out: AliasProposal[] = [];
  const stem = normalizeCompanyName(input.accountName).split(' ')[0] ?? '';
  for (const [key, g] of groups) {
    // One contact's CRM field is a departure or a vendor as often as a banner (review S9): propose only when two or
    // more people carry the spelling, or it shares the account's own first word ("NFI SDR Distribution").
    const sharesStem = !!stem && stem.length >= 3 && key.split(' ').includes(stem);
    if (g.rows.length < 2 && !sharesStem) continue;
    const crm = g.rows.filter((r) => isHubSpot(r.source));
    const other = g.rows.filter((r) => !isHubSpot(r.source));
    const parts: string[] = [];
    if (crm.length) parts.push(`${crm.length} HubSpot contact${crm.length === 1 ? '' : 's'}' CRM company field`);
    for (const r of other) parts.push(`${r.source}${day(r.at) ? ` ${day(r.at)}` : ''} for ${r.personName}`);
    const evidence = [`${g.company}: ${parts.join('; ')}`];
    if (crm.length) evidence.push(`HubSpot: ${crm.map((r) => r.personName).join(', ')}`);
    out.push({ company: g.company, canonical: input.accountName, evidence, key });
  }
  return out.sort((a, b) => groups.get(b.key)!.rows.length - groups.get(a.key)!.rows.length || a.key.localeCompare(b.key));
}

export type ConfirmAliasResult =
  | { ok: true; status: 'CREATED' | 'ALREADY_MATCHED'; id: string; /** null when nothing new was written (ALREADY_MATCHED). */ auditId: string | null }
  | { ok: false; reason: 'account_not_found' | 'alias_conflict' | 'alias_is_account' | 'invalid_alias'; detail?: string };

/** The GAP account whose name normalizes to this spelling, other than `accountName`, else null. */
async function accountNamed(prisma: PrismaLike, alias: string, accountName: string): Promise<string | null> {
  const key = normalizeCompanyName(alias);
  const stem = key.split(' ')[0] ?? '';
  if (!stem || typeof prisma?.account?.findMany !== 'function') return null;
  const near: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { startsWith: stem, mode: 'insensitive' } }, select: { name: true }, take: 100 }).catch(() => []);
  return near.find((a) => a.name !== accountName && normalizeCompanyName(a.name) === key)?.name ?? null;
}

/**
 * Casey confirmed a proposal: the alias is registered (source 'manual', created_by the actor) and audited once.
 * Idempotent: a second confirm answers ALREADY_MATCHED and writes nothing. Refuses a spelling that already maps to
 * another account, an alias that is itself another GAP account, an unknown account, and a junk alias.
 */
export async function confirmAlias(prisma: PrismaLike, input: { accountName: string; alias: string; actor: string; now: Date; evidence: readonly string[] }): Promise<ConfirmAliasResult> {
  const alias = String(input.alias ?? '').trim();
  const account: { name: string } | null = await prisma.account.findUnique({ where: { name: input.accountName }, select: { name: true } });
  if (!account) return { ok: false, reason: 'account_not_found' };
  const problem = aliasSpellingProblem(alias);
  if (problem) return { ok: false, reason: 'invalid_alias', detail: `"${alias}" is ${problem}` };
  const normalized = normalizeCompanyName(alias);
  if (normalized === normalizeCompanyName(account.name)) return { ok: false, reason: 'invalid_alias', detail: `"${alias}" is the account's own name` };
  const other = await accountNamed(prisma, alias, account.name);
  if (other) return { ok: false, reason: 'alias_is_account', detail: `"${alias}" is the GAP account ${other}: identity, not an alias` };
  const r = await registerAlias(prisma, { alias, accountName: account.name, source: 'manual', createdBy: input.actor });
  if (r.status === 'CONFLICT') return { ok: false, reason: 'alias_conflict', detail: `"${alias}" already maps to ${r.existingAccountName}` };
  if (r.status === 'ALREADY_MATCHED') return { ok: true, status: 'ALREADY_MATCHED', id: r.id, auditId: null };
  const audit = await prisma.gapAuditEvent.create({
    data: { kind: 'account.alias_confirmed', actor: input.actor, subject_type: 'account', subject_id: account.name, payload: { alias, normalized, evidence: [...input.evidence], actor: input.actor, at: input.now.toISOString(), hubspotWritten: false } },
    select: { id: true },
  });
  return { ok: true, status: 'CREATED', id: r.id, auditId: String(audit?.id ?? '') };
}

/** Casey said this spelling is not the account's family: one audit row, nothing else; the proposal stays away. */
export async function rejectAlias(prisma: PrismaLike, input: { accountName: string; alias: string; actor: string; now: Date; note?: string | null }): Promise<{ ok: true; auditId: string }> {
  const alias = String(input.alias ?? '').trim();
  const audit = await prisma.gapAuditEvent.create({
    data: { kind: 'account.alias_rejected', actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { alias, normalized: normalizeCompanyName(alias), note: input.note?.trim() || null, actor: input.actor, at: input.now.toISOString() } },
    select: { id: true },
  });
  return { ok: true, auditId: String(audit?.id ?? '') };
}

/** The normalized keys Casey rejected at this account (from the audit ledger). */
export async function loadRejectedAliases(prisma: PrismaLike, accountName: string): Promise<string[]> {
  if (typeof prisma?.gapAuditEvent?.findMany !== 'function') return [];
  const rows: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({ where: { kind: 'account.alias_rejected', subject_type: 'account', subject_id: accountName }, select: { payload: true } }).catch(() => []);
  const keys = new Set<string>();
  for (const r of rows) {
    const p = r.payload ?? {};
    const key = typeof p.normalized === 'string' && p.normalized ? p.normalized : typeof p.alias === 'string' && p.alias ? normalizeCompanyName(p.alias) : '';
    if (key) keys.add(key);
  }
  return [...keys];
}
