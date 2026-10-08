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
import { CUSTOM_STAGE, stageName } from '../deals/stage-label';

/** A known stage in words after a related deal's name; a custom stage whose name was not read adds nothing (never its id). */
const stageWords = (stage: string | null) => {
  const w = stageName(stage);
  return w && w !== CUSTOM_STAGE ? ` (${w})` : '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** same_company: another GAP account row for the SAME company (a duplicate record, never merged): it holds too. */
export type Relation = 'parent' | 'subsidiary' | 'sibling' | 'same_company';
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
  /** HubSpot's parent / child companies could not be read: the family may be incomplete (holds fail closed). */
  hubspotUnreadable?: boolean;
}

const squash = (s: string) => normalizeCompanyName(s).replace(/\s+/g, '');
/** Words that describe a company without naming a different one ("Kenco" and "Kenco Logistics Services"). */
const DESCRIPTOR = new Set(['logistics', 'services', 'service', 'group', 'holdings', 'holding', 'usa', 'us', 'america', 'north', 'international', 'global', 'enterprises', 'company', 'the']);
/**
 * Two names for the SAME company (identity, not family): equal ignoring spaces and legal suffixes, or the longer
 * adds only descriptor words. "Coca-Cola Bottling Co", "Nestle Purina" and "Kraft Heinz" are NOT their parents.
 */
export function sameCompany(a: string, b: string): boolean {
  // Letters only, before legal suffixes are stripped too: "Pepsi Co" is "PepsiCo" (its "Co" is part of the name).
  const letters = (v: string) => v.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (squash(a) === squash(b) || letters(a) === letters(b)) return true;
  const x = normalizeCompanyName(a).split(' ');
  const y = normalizeCompanyName(b).split(' ');
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return short.length > 0 && short.every((t, i) => long[i] === t) && long.slice(short.length).every((t) => DESCRIPTOR.has(t));
}

export interface FamilyDeps {
  /** HubSpot parent / children of a company id (read only); 'unreadable' when HubSpot answered badly (fail closed). */
  hubspot?: (companyId: string) => Promise<{ parentId: string | null; childIds: string[]; siblingIds?: string[] } | 'unreadable' | null>;
}

export async function loadCorporateFamily(prisma: PrismaLike, accountName: string, deps: FamilyDeps = {}): Promise<CorporateFamily> {
  const me: { name: string; parent_brand: string | null; hubspot_company_id: string | null } | null = await prisma.account.findUnique({ where: { name: accountName }, select: { name: true, parent_brand: true, hubspot_company_id: true } });
  if (!me?.name || typeof prisma.account.findMany !== 'function') return { accountName, parentName: null, members: [] };
  const parentName = me.parent_brand && !sameCompany(me.parent_brand, me.name) ? me.parent_brand : null;
  const members = new Map<string, FamilyMember>();
  // A HubSpot-declared relation is never name-filtered (HubSpot says they are different companies).
  const add = (m: FamilyMember) => {
    if (m.accountName !== me.name && (m.source === 'hubspot' || m.relation === 'same_company' || !sameCompany(m.accountName, me.name)) && !members.has(m.accountName)) members.set(m.accountName, m);
  };
  // Another account row for the SAME company ("Nestle" and "Nestle USA"): never merged, but a live deal there
  // is this company's live deal, so it holds a cold motion here.
  const myStem = normalizeCompanyName(me.name).split(' ')[0] ?? '';
  const namesake: Array<{ name: string }> = myStem ? await prisma.account.findMany({ where: { name: { startsWith: myStem, mode: 'insensitive' } }, select: { name: true } }) : [];
  for (const n of namesake) if (n.name !== me.name && sameCompany(n.name, me.name)) add({ accountName: n.name, relation: 'same_company', source: 'parent_brand' });
  const withParent: Array<{ name: string; parent_brand: string | null; hubspot_company_id: string | null }> = await prisma.account.findMany({ where: { parent_brand: { not: null } }, select: { name: true, parent_brand: true, hubspot_company_id: true } });
  if (parentName) {
    const pk = normalizeCompanyName(parentName);
    // The parent by normalized name ("PepsiCo, Inc." is the account "PepsiCo").
    const stem = pk.split(' ')[0] ?? '';
    const near: Array<{ name: string }> = stem ? await prisma.account.findMany({ where: { name: { startsWith: stem, mode: 'insensitive' } }, select: { name: true } }) : [];
    // Spellings of the parent are the parent ("Pepsi Co", "PepsiCo, Inc."): the identity rule, not string equality.
    for (const p of near) if (sameCompany(p.name, parentName)) add({ accountName: p.name, relation: 'parent', source: 'parent_brand' });
    for (const s of withParent) if (s.parent_brand && sameCompany(s.parent_brand, parentName) && !sameCompany(s.parent_brand, s.name)) add({ accountName: s.name, relation: 'sibling', source: 'parent_brand' });
  }
  for (const c of withParent) if (c.parent_brand && sameCompany(c.parent_brand, me.name) && !sameCompany(c.parent_brand, c.name)) add({ accountName: c.name, relation: 'subsidiary', source: 'parent_brand' });
  let hubspotUnreadable = false;
  if (me.hubspot_company_id && deps.hubspot) {
    const hs = await deps.hubspot(me.hubspot_company_id).catch(() => 'unreadable' as const);
    if (hs === 'unreadable') hubspotUnreadable = true;
    else if (hs) {
      const siblings = (hs.siblingIds ?? []).filter((id) => id !== me.hubspot_company_id);
      const ids = [...(hs.parentId ? [hs.parentId] : []), ...hs.childIds, ...siblings];
      const mapped: Array<{ name: string; hubspot_company_id: string }> = ids.length ? await prisma.account.findMany({ where: { hubspot_company_id: { in: ids } }, select: { name: true, hubspot_company_id: true } }) : [];
      for (const a of mapped) add({ accountName: a.name, relation: a.hubspot_company_id === hs.parentId ? 'parent' : hs.childIds.includes(a.hubspot_company_id) ? 'subsidiary' : 'sibling', source: 'hubspot' });
    }
  }
  return { accountName: me.name, parentName, members: [...members.values()], ...(hubspotUnreadable ? { hubspotUnreadable } : {}) };
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
  opportunity?: (prisma: PrismaLike, accountName: string) => Promise<{ status: 'ACTIVE' | 'CLEAR' | 'UNKNOWN'; deals?: Array<{ name: string | null; stage: string | null }>; noHubspotCompany?: boolean }>;
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
      return o.status === 'ACTIVE' ? { status: 'ACTIVE' as const, deals: o.deals.map((d) => ({ name: d.name, stage: d.stage })) } : { status: o.status, noHubspotCompany: o.status === 'UNKNOWN' && o.reason === 'identity_unresolved' && /^no HubSpot company/.test(o.detail ?? '') };
    });
  // Every related account's deal read at once, under one shared deadline (the click has a time limit).
  const deadline = <T,>(p: Promise<T>, fallback: T) => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([p.catch(() => fallback), new Promise<T>((r) => { t = setTimeout(() => r(fallback), 9_000); })]).finally(() => clearTimeout(t));
  };
  const opps = await Promise.all(family.members.map((m) => deadline(opportunity(prisma, m.accountName), { status: 'UNKNOWN' as const })));
  // A reply read that failed is not "no reply": that member's activity is unknown (fail closed).
  const replies = await Promise.all(family.members.map((m) => deadline(accountRepliedRecently(prisma, '', now, { accountName: m.accountName }) as Promise<unknown>, 'unreadable' as const)));
  const out: RelatedActivity[] = [];
  for (const [idx, m] of family.members.entries()) {
    const activity: string[] = [];
    const o = opps[idx] as { status: 'ACTIVE' | 'CLEAR' | 'UNKNOWN'; deals?: Array<{ name: string | null; stage: string | null }>; noHubspotCompany?: boolean };
    // A duplicate GAP record of THIS company with no HubSpot company of its own has no separate deal to read: the
    // account's own action-time HubSpot check covers the company. Its GAP activity below still holds.
    const dealUnknown = o.status === 'UNKNOWN' && !(m.relation === 'same_company' && o.noHubspotCompany);
    if (o.status === 'ACTIVE') activity.push(`active opportunity${o.deals?.length ? `: ${o.deals.map((d) => `${d.name ?? 'deal'}${stageWords(d.stage)}`).join('; ')}` : ''}`);
    const c = (conversations as Map<string, { who: string; responseClass: string; at: string }>).get(m.accountName);
    if (c) activity.push(`a buyer conversation (${c.responseClass.replace(/_/g, ' ')}, ${c.at.slice(0, 10)})`);
    const gate = computeAccountMotion({ accountName: m.accountName, readyEmailCards: [], choice: null, firstTouches: ((touches as Map<string, never[]>).get(m.accountName) ?? []) as never[], replyHold: null, conversation: null, now });
    if (gate.state === 'in_motion') activity.push(`a first touch in motion (${gate.headline.replace(/^In motion: /, '').replace(/\. One cold email motion at a time\.$/, '')})`);
    const reply = replies[idx];
    if (reply && reply !== 'unreadable') activity.push('an untriaged reply');
    if ((enrollments as Array<{ account_name: string }>).some((e) => e.account_name === m.accountName)) activity.push('a live sequence enrollment');
    out.push({ accountName: m.accountName, relation: m.relation, activity, unknown: dealUnknown || reply === 'unreadable' });
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
  /** What was live at each named account when Casey decided (only that is covered; anything new holds again). */
  snapshot?: Record<string, string[]>;
}

export const SEPARATE_MOTION = 'account.separate_motion' as const;
const DAY = 86_400_000;

/** Casey's audited decision that this account is a SEPARATE buying motion from named related accounts. Expires. */
export async function recordSeparateMotion(prisma: PrismaLike, input: { accountName: string; relatedAccounts: string[]; reason: string; actor: string; now: Date; days?: number; snapshot?: Record<string, string[]> }): Promise<{ ok: true; expiresAt: string } | { ok: false; reason: string }> {
  if (!input.reason?.trim()) return { ok: false, reason: 'reason_required' };
  if (!input.relatedAccounts.length) return { ok: false, reason: 'related_required' };
  const days = Math.min(Math.max(input.days ?? 90, 1), 180);
  const expiresAt = new Date(input.now.getTime() + days * DAY).toISOString();
  await prisma.gapAuditEvent.create({ data: { kind: SEPARATE_MOTION, actor: input.actor, subject_type: 'account', subject_id: input.accountName, payload: { relatedAccounts: input.relatedAccounts, reason: input.reason.trim(), expiresAt, snapshot: input.snapshot ?? {} } } });
  return { ok: true, expiresAt };
}

export async function loadSeparateMotion(prisma: PrismaLike, accountName: string, now: Date): Promise<SeparateMotion | null> {
  const row: { actor: string; created_at: Date; payload: Record<string, unknown> } | null = prisma.gapAuditEvent?.findFirst ? await prisma.gapAuditEvent.findFirst({ where: { kind: SEPARATE_MOTION, subject_type: 'account', subject_id: accountName }, orderBy: { created_at: 'desc' }, select: { actor: true, created_at: true, payload: true } }) : null;
  if (!row) return null;
  const expiresAt = String(row.payload?.expiresAt ?? '');
  if (!expiresAt || new Date(expiresAt).getTime() <= now.getTime()) return null;
  return { accountName, relatedAccounts: Array.isArray(row.payload.relatedAccounts) ? (row.payload.relatedAccounts as string[]) : [], reason: String(row.payload.reason ?? ''), actor: row.actor, at: new Date(row.created_at).toISOString(), expiresAt, snapshot: (row.payload.snapshot as Record<string, string[]> | undefined) ?? {} };
}

/**
 * The RELATED ACCOUNT ACTIVITY hold for a cold motion on `accountName`, or null when clear. A separate-motion
 * decision covers only the related accounts it names (a new conflict elsewhere in the family still holds).
 * A related deal state that could not be read holds too (fail closed), said as such.
 */
export function relatedHold(family: CorporateFamily, activity: RelatedActivity[], separate: SeparateMotion | null): { detail: string; accounts: string[]; unknown: boolean } | null {
  // A separate-motion decision covers only what was live at the named account when Casey decided: a new kind of
  // activity there (a deal opening above all), an unreadable account, or a duplicate record of THIS company holds.
  const covers = (a: RelatedActivity) => {
    if (a.unknown || a.relation === 'same_company' || !separate?.relatedAccounts.includes(a.accountName)) return false;
    const then = new Set((separate.snapshot?.[a.accountName] ?? []).map(activityKind));
    return a.activity.every((x) => then.has(activityKind(x)));
  };
  const live = activity.filter((a) => (a.activity.length || a.unknown) && !covers(a));
  if (!live.length) return null;
  const rel = (r: Relation) => (r === 'parent' ? 'its parent' : r === 'subsidiary' ? 'its subsidiary' : r === 'same_company' ? 'another GAP record of the same company' : 'a sibling in the same group');
  const parts = live.map((a) => `${a.accountName} (${rel(a.relation)}): ${a.activity.length ? a.activity.join(', ') : 'its activity could not be read'}`);
  return {
    detail: `Related account activity. ${family.accountName} is part of ${family.parentName ?? 'a corporate family'} in GAP. ${parts.join('; ')}. Confirm this is a separate buying motion before any cold outreach.`,
    accounts: live.map((a) => a.accountName),
    unknown: live.every((a) => !a.activity.length && a.unknown),
  };
}

/** The kind of a related-activity line ("active opportunity: X (stage)" is "active opportunity"). */
export const activityKind = (line: string) => line.split(/[:(]/)[0].trim();

/**
 * HubSpot's parent company and child companies of one company (read only, bounded). Null when HubSpot is not
 * configured or the read fails: the parent_brand family still applies.
 */
export async function hubspotFamily(companyId: string): Promise<{ parentId: string | null; childIds: string[]; siblingIds: string[] } | 'unreadable' | null> {
  const { isHubSpotConfigured, getHubSpotClient } = await import('@/lib/hubspot/client');
  if (!isHubSpotConfigured()) return null;
  const client = getHubSpotClient();
  const bounded = <T,>(p: Promise<T>) => {
    let t: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([p, new Promise<never>((_, no) => { t = setTimeout(() => no(new Error('timeout')), 5_000); })]).finally(() => clearTimeout(t));
  };
  try {
    const [me, kids] = await Promise.all([
      bounded(client.crm.companies.basicApi.getById(companyId, ['hs_parent_company_id'])),
      bounded(client.crm.companies.searchApi.doSearch({ filterGroups: [{ filters: [{ propertyName: 'hs_parent_company_id', operator: 'EQ' as never, value: companyId }] }], properties: ['name'], limit: 50, after: '0', sorts: [] })),
    ]);
    const parentId = (me.properties?.hs_parent_company_id as string | undefined) || null;
    // Siblings known only through HubSpot: the parent's other children.
    const sibs = parentId ? await bounded(client.crm.companies.searchApi.doSearch({ filterGroups: [{ filters: [{ propertyName: 'hs_parent_company_id', operator: 'EQ' as never, value: parentId }] }], properties: ['name'], limit: 50, after: '0', sorts: [] })) : null;
    return { parentId, childIds: kids.results.map((r) => r.id), siblingIds: (sibs?.results ?? []).map((r) => r.id).filter((id) => id !== companyId) };
  } catch {
    // HubSpot answered badly: the family may be incomplete, so the action-time hold fails closed.
    return 'unreadable';
  }
}

/**
 * The action-time family check every outbound gate runs (enroll/service.ts makeActiveOpportunityCheck): the
 * RELATED ACCOUNT ACTIVITY hold, or null. Reads only. Throws are the caller's UNKNOWN (fail closed).
 */
export async function familyHoldNow(prisma: PrismaLike, accountName: string, now: Date, deps: FamilyDeps & ActivityDeps = {}): Promise<{ detail: string; unknown: boolean } | null> {
  if (!prisma.account?.findUnique) return null;
  const family = await loadCorporateFamily(prisma, accountName, { hubspot: deps.hubspot ?? hubspotFamily });
  if (family.hubspotUnreadable) return { detail: `Could not read ${accountName}'s parent and child companies in HubSpot: a related account may be live. Check HubSpot before contacting.`, unknown: true };
  if (!family.members.length) return null;
  const [activity, separate] = await Promise.all([loadRelatedActivity(prisma, family, now, deps), loadSeparateMotion(prisma, family.accountName, now)]);
  const hold = relatedHold(family, activity, separate);
  return hold ? { detail: hold.detail, unknown: hold.unknown } : null;
}
