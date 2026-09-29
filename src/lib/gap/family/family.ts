/**
 * CORPORATE FAMILY (2026-09-29): PARENT, SUBSIDIARY and SIBLING accounts, derived (never a merge).
 *
 * Corporate relationship is NOT identity equality: PepsiCo and Frito-Lay stay separate accounts with separate
 * intelligence and separate buyer truth. What the family changes is OUTBOUND SAFETY: before a new cold motion on
 * one account, GAP looks at the related accounts for a live deal, a buyer conversation, a first touch still in
 * motion, an untriaged reply, or a live sequence enrollment. Any of those is RELATED ACCOUNT ACTIVITY and holds
 * cold motion, until Casey records an audited SEPARATE BUYING MOTION (actor, reason, time, the related accounts,
 * an expiry). Person-level do-not-contact is never propagated across companies.
 *
 * Sources, a union (it can only over-protect):
 *   - accounts.parent_brand when it names a DIFFERENT GAP account (a spelling of the same company is identity,
 *     not family: "Kenco Logistics Services" -> "Kenco", "JM Smucker" -> "The J.M. Smucker Company")
 *   - HubSpot's parent company (hs_parent_company_id) mapped to GAP accounts, when it can be read
 */
import { normalizeCompanyName } from '../identity/normalize';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export type Relation = 'parent' | 'subsidiary' | 'sibling';
export interface FamilyMember {
  accountName: string;
  relation: Relation;
  source: 'parent_brand' | 'hubspot';
}
export interface CorporateFamily {
  accountName: string;
  /** The parent's name as recorded, even when the parent is not a GAP account. */
  parentName: string | null;
  members: FamilyMember[];
}

const squash = (s: string) => normalizeCompanyName(s).replace(/\s+/g, '');
/** Two names for the SAME company (identity, not family): equal ignoring spaces, or one's words start the other's. */
export function sameCompany(a: string, b: string): boolean {
  if (squash(a) === squash(b)) return true;
  const x = normalizeCompanyName(a).split(' ');
  const y = normalizeCompanyName(b).split(' ');
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length > 0 && short.every((t, i) => long[i] === t);
}

export interface FamilyDeps {
  /** HubSpot parent / children of a company id (read only); null when it cannot be read. */
  hubspot?: (companyId: string) => Promise<{ parentId: string | null; childIds: string[] } | null>;
}

export async function loadCorporateFamily(prisma: PrismaLike, accountName: string, deps: FamilyDeps = {}): Promise<CorporateFamily> {
  const me: { name: string; parent_brand: string | null; hubspot_company_id: string | null } | null = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true, parent_brand: true, hubspot_company_id: true } });
  if (!me?.name || typeof prisma.account.findMany !== 'function') return { accountName, parentName: null, members: [] };
  const parentName = me.parent_brand && !sameCompany(me.parent_brand, me.name) ? me.parent_brand : null;
  const members = new Map<string, FamilyMember>();
  const add = (m: FamilyMember) => {
    if (m.accountName !== me.name && !sameCompany(m.accountName, me.name) && !members.has(m.accountName)) members.set(m.accountName, m);
  };
  const withParent: Array<{ name: string; parent_brand: string | null; hubspot_company_id: string | null }> = await prisma.account.findMany({ where: { parent_brand: { not: null } }, select: { name: true, parent_brand: true, hubspot_company_id: true } });
  if (parentName) {
    const pk = normalizeCompanyName(parentName);
    const parents: Array<{ name: string }> = await prisma.account.findMany({ where: { name: { equals: parentName, mode: 'insensitive' } }, select: { name: true } });
    for (const p of parents) add({ accountName: p.name, relation: 'parent', source: 'parent_brand' });
    for (const s of withParent) if (s.parent_brand && normalizeCompanyName(s.parent_brand) === pk && !sameCompany(s.parent_brand, s.name)) add({ accountName: s.name, relation: 'sibling', source: 'parent_brand' });
  }
  const mk = normalizeCompanyName(me.name);
  for (const c of withParent) if (c.parent_brand && normalizeCompanyName(c.parent_brand) === mk && !sameCompany(c.parent_brand, c.name)) add({ accountName: c.name, relation: 'subsidiary', source: 'parent_brand' });
  if (me.hubspot_company_id && deps.hubspot) {
    const hs = await deps.hubspot(me.hubspot_company_id).catch(() => null);
    if (hs) {
      const ids = [...(hs.parentId ? [hs.parentId] : []), ...hs.childIds];
      const mapped: Array<{ name: string; hubspot_company_id: string }> = ids.length ? await prisma.account.findMany({ where: { hubspot_company_id: { in: ids } }, select: { name: true, hubspot_company_id: true } }) : [];
      for (const a of mapped) add({ accountName: a.name, relation: a.hubspot_company_id === hs.parentId ? 'parent' : 'subsidiary', source: 'hubspot' });
    }
  }
  return { accountName: me.name, parentName, members: [...members.values()] };
}

export interface RelatedActivity {
  accountName: string;
  relation: Relation;
  /** What is live there, in words ("active opportunity: YardFlow - PepsiCo (discovery)"). */
  activity: string[];
  /** The deal state could not be read there (fail closed at action time). */
  unknown: boolean;
}

export interface ActivityDeps {
  opportunity?: (prisma: PrismaLike, accountName: string) => Promise<{ status: 'ACTIVE' | 'CLEAR' | 'UNKNOWN'; deals?: Array<{ name: string | null; stage: string | null }> }>;
}

/** What is live at each related account (reads only). */
export async function loadRelatedActivity(prisma: PrismaLike, family: CorporateFamily, now: Date, deps: ActivityDeps = {}): Promise<RelatedActivity[]> {
  if (!family.members.length) return [];
  const names = family.members.map((m) => m.accountName);
  const [{ loadAccountConversations, loadAccountFirstTouches }, { computeAccountMotion }, { accountRepliedRecently }] = await Promise.all([import('../motion/load'), import('../motion/account-motion'), import('../replies/account-reply')]);
  const [conversations, touches, enrollments] = await Promise.all([
    loadAccountConversations(prisma, names, now),
    loadAccountFirstTouches(prisma, names, now),
    prisma.sequenceEnrollment?.findMany ? prisma.sequenceEnrollment.findMany({ where: { account_name: { in: names }, status: { in: ['active', 'paused', 'stop_pending'] } }, select: { account_name: true } }) : [],
  ]);
  const opportunity =
    deps.opportunity ??
    (async (p: PrismaLike, a: string) => {
      const { resolveAccountOpportunity } = await import('../opportunity/active-opportunity');
      const o = await resolveAccountOpportunity(p, a, {}, { timeoutMs: 8_000 });
      return o.status === 'ACTIVE' ? { status: 'ACTIVE' as const, deals: o.deals.map((d) => ({ name: d.name, stage: d.stage })) } : { status: o.status };
    });
  const out: RelatedActivity[] = [];
  for (const m of family.members) {
    const activity: string[] = [];
    const o = await opportunity(prisma, m.accountName).catch(() => ({ status: 'UNKNOWN' as const }));
    if (o.status === 'ACTIVE') activity.push(`active opportunity${o.deals?.length ? `: ${o.deals.map((d) => `${d.name ?? 'deal'}${d.stage ? ` (${d.stage})` : ''}`).join('; ')}` : ''}`);
    const c = (conversations as Map<string, { who: string; responseClass: string; at: string }>).get(m.accountName);
    if (c) activity.push(`a buyer conversation (${c.responseClass.replace(/_/g, ' ')}, ${c.at.slice(0, 10)})`);
    const gate = computeAccountMotion({ accountName: m.accountName, readyEmailCards: [], choice: null, firstTouches: ((touches as Map<string, never[]>).get(m.accountName) ?? []) as never[], replyHold: null, conversation: null, now });
    if (gate.state === 'in_motion') activity.push(`a first touch in motion (${gate.headline.replace(/^In motion: /, '').replace(/\. One cold email motion at a time\.$/, '')})`);
    const reply = await accountRepliedRecently(prisma, '', now, { accountName: m.accountName }).catch(() => null);
    if (reply) activity.push(`an untriaged reply from ${reply.from_email}`);
    if ((enrollments as Array<{ account_name: string }>).some((e) => e.account_name === m.accountName)) activity.push('a live sequence enrollment');
    out.push({ accountName: m.accountName, relation: m.relation, activity, unknown: o.status === 'UNKNOWN' });
  }
  return out;
}

export interface SeparateMotion {
  accountName: string;
  relatedAccounts: string[];
  reason: string;
  actor: string;
  at: string;
  expiresAt: string;
}

export const SEPARATE_MOTION = 'account.separate_motion' as const;
const DAY = 86_400_000;

/** Casey's audited decision that this account is a SEPARATE buying motion from named related accounts. Expires. */
export async function recordSeparateMotion(prisma: PrismaLike, input: { accountName: string; relatedAccounts: string[]; reason: string; actor: string; now: Date; days?: number }): Promise<{ ok: true; expiresAt: string } | { ok: false; reason: string }> {
  if (!input.reason?.trim()) return { ok: false, reason: 'reason_required' };
  if (!input.relatedAccounts.length) return { ok: false, reason: 'related_required' };
  const days = Math.min(Math.max(input.days ?? 90, 1), 180);
  const expiresAt = new Date(input.now.getTime() + days * DAY).toISOString();
  await prisma.gapAuditEvent.create({ data: { kind: SEPARATE_MOTION, actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { relatedAccounts: input.relatedAccounts, reason: input.reason.trim(), expiresAt } } });
  return { ok: true, expiresAt };
}

export async function loadSeparateMotion(prisma: PrismaLike, accountName: string, now: Date): Promise<SeparateMotion | null> {
  const row: { actor: string; created_at: Date; payload: Record<string, unknown> } | null = prisma.gapAuditEvent?.findFirst ? await prisma.gapAuditEvent.findFirst({ where: { kind: SEPARATE_MOTION, subject_type: 'account', subject_id: accountName }, orderBy: { created_at: 'desc' }, select: { actor: true, created_at: true, payload: true } }) : null;
  if (!row) return null;
  const expiresAt = String(row.payload?.expiresAt ?? '');
  if (!expiresAt || new Date(expiresAt).getTime() <= now.getTime()) return null;
  return { accountName, relatedAccounts: Array.isArray(row.payload.relatedAccounts) ? (row.payload.relatedAccounts as string[]) : [], reason: String(row.payload.reason ?? ''), actor: row.actor, at: new Date(row.created_at).toISOString(), expiresAt };
}

/**
 * The RELATED ACCOUNT ACTIVITY hold for a cold motion on `accountName`, or null when clear. A separate-motion
 * decision covers only the related accounts it names (a new conflict elsewhere in the family still holds).
 * A related deal state that could not be read holds too (fail closed), said as such.
 */
export function relatedHold(family: CorporateFamily, activity: RelatedActivity[], separate: SeparateMotion | null): { detail: string; accounts: string[]; unknown: boolean } | null {
  const covered = new Set(separate?.relatedAccounts ?? []);
  const live = activity.filter((a) => (a.activity.length || a.unknown) && !covered.has(a.accountName));
  if (!live.length) return null;
  const rel = (r: Relation) => (r === 'parent' ? 'its parent' : r === 'subsidiary' ? 'its subsidiary' : 'a sibling in the same group');
  const parts = live.map((a) => `${a.accountName} (${rel(a.relation)}): ${a.activity.length ? a.activity.join(', ') : 'the deal state could not be read'}`);
  return {
    detail: `Related account activity. ${family.accountName} is part of ${family.parentName ?? 'a corporate family'} in GAP. ${parts.join('; ')}. Confirm this is a separate buying motion before any cold outreach.`,
    accounts: live.map((a) => a.accountName),
    unknown: live.every((a) => !a.activity.length && a.unknown),
  };
}

/**
 * HubSpot's parent company and child companies of one company (read only, bounded). Null when HubSpot is not
 * configured or the read fails: the parent_brand family still applies.
 */
export async function hubspotFamily(companyId: string): Promise<{ parentId: string | null; childIds: string[] } | null> {
  const { isHubSpotConfigured, getHubSpotClient } = await import('@/lib/hubspot/client');
  if (!isHubSpotConfigured()) return null;
  const client = getHubSpotClient();
  const bounded = <T,>(p: Promise<T>) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), 5_000))]);
  try {
    const me = await bounded(client.crm.companies.basicApi.getById(companyId, ['hs_parent_company_id']));
    const kids = await bounded(
      client.crm.companies.searchApi.doSearch({ filterGroups: [{ filters: [{ propertyName: 'hs_parent_company_id', operator: 'EQ' as never, value: companyId }] }], properties: ['name'], limit: 50, after: '0', sorts: [] }),
    );
    return { parentId: (me.properties?.hs_parent_company_id as string | undefined) || null, childIds: kids.results.map((r) => r.id) };
  } catch {
    return null;
  }
}

/**
 * The action-time family check every outbound gate runs (enroll/service.ts makeActiveOpportunityCheck): the
 * RELATED ACCOUNT ACTIVITY hold, or null. Reads only. Throws are the caller's UNKNOWN (fail closed).
 */
export async function familyHoldNow(prisma: PrismaLike, accountName: string, now: Date, deps: FamilyDeps & ActivityDeps = {}): Promise<{ detail: string; unknown: boolean } | null> {
  if (!prisma.account?.findUnique) return null;
  const family = await loadCorporateFamily(prisma, accountName, { hubspot: deps.hubspot ?? hubspotFamily });
  if (!family.members.length) return null;
  const [activity, separate] = await Promise.all([loadRelatedActivity(prisma, family, now, deps), loadSeparateMotion(prisma, family.accountName, now)]);
  const hold = relatedHold(family, activity, separate);
  return hold ? { detail: hold.detail, unknown: hold.unknown } : null;
}
