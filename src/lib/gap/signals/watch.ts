/**
 * ACCOUNT WATCH PROFILES (GAP Signal Intelligence C).
 *
 * For every priority account GAP knows what to look for, generated
 * MECHANICALLY from data that already exists; Casey configures nothing:
 *
 *   universe   Account rows in priority band A-C or Tier 1-2, every account
 *              with a GAP thesis, every audited /for + demo-pack account (the
 *              Pounce watchlist), and every account where GAP holds a buying
 *              committee (5+ people). E2E fixtures, "Unknown" and
 *              domain-named placeholder rows (gmail.com) are excluded.
 *   aliases    registered GapAccountAlias rows; Casey may add or remove one
 *              (`signal.watch` audit row, newest wins). The PARENT brand is
 *              never an alias (review C P1: a parent's story is not the
 *              subsidiary's).
 *   domains    the account's canonical company domains (resolved links).
 *   ticker     from the Pounce ticker map.
 *   themes     what to ask about, ordered by the account's open thesis
 *              problem families first, then the physical-network default set.
 *
 * A watch profile is SEARCH CONTEXT. It is never buyer truth and never evidence.
 */
import { buildWatchlist } from '@/lib/pounce/scan';
import { TICKER_TO_SLUG } from '@/lib/pounce/ticker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export const WATCH_AUDIT = 'signal.watch' as const;

/** Physical-network questions worth asking about any account (bounded; rotated by discovery). */
export const DEFAULT_THEMES = [
  'distribution center OR warehouse OR fulfillment center',
  'plant expansion OR new plant OR new production line',
  'warehouse automation OR robotics OR autonomous trucks',
  'logistics network OR supply chain transformation OR network redesign',
  'closure OR consolidation OR relocation facility',
  'yard OR dock OR trailer OR fleet OR carrier',
  'investment OR capex OR acquisition facility',
  'supply chain OR logistics executive appoints',
] as const;

/** A thesis problem family puts its closest themes first. */
const FAMILY_THEMES: Record<string, string[]> = {
  hidden_capacity: ['distribution center OR warehouse OR fulfillment center', 'plant expansion OR new plant OR new production line'],
  yard_state_integrity: ['yard OR dock OR trailer OR fleet OR carrier', 'warehouse automation OR robotics OR autonomous trucks'],
  network_change: ['closure OR consolidation OR relocation facility', 'logistics network OR supply chain transformation OR network redesign'],
};

export interface WatchProfile {
  accountName: string;
  aliases: string[];
  domains: string[];
  ticker: string | null;
  themes: string[];
  tier: string | null;
  band: string | null;
  reasons: string[];
}

export const COMMITTEE_MIN_PEOPLE = 5;
const isFixture = (name: string) => /^(the )?e2e /i.test(name) || /^unknown$/i.test(name.trim()) || /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(name.trim());

const profileCache = new WeakMap<object, { at: number; profiles: WatchProfile[] }>();

/** Cached per process for 5 minutes (review C P3: the Signals page renders it on every load). */
export async function loadWatchProfilesCached(prisma: PrismaLike): Promise<WatchProfile[]> {
  const hit = prisma && typeof prisma === 'object' ? profileCache.get(prisma) : undefined;
  if (hit && Date.now() - hit.at < 300_000) return hit.profiles;
  const profiles = await loadWatchProfiles(prisma);
  if (prisma && typeof prisma === 'object') profileCache.set(prisma, { at: Date.now(), profiles });
  return profiles;
}

export async function loadWatchProfiles(prisma: PrismaLike, deps: { watchlist?: () => Promise<Array<{ slug: string; name: string }>> } = {}): Promise<WatchProfile[]> {
  const [prio, hyps, watch, committees] = await Promise.all([
    prisma.account.findMany({
      where: { OR: [{ priority_band: { in: ['A', 'B', 'C'] } }, { tier: { in: ['Tier 1', 'Tier 2'] } }] },
      select: { name: true, tier: true, priority_band: true, parent_brand: true },
    }),
    prisma.prospectingHypothesis.findMany({ select: { account_name: true, problem_family: true, status: true }, take: 2_000 }),
    (deps.watchlist ?? buildWatchlist)().catch(() => [] as Array<{ slug: string; name: string }>),
    prisma.persona.groupBy
      ? prisma.persona.groupBy({ by: ['account_name'], _count: { _all: true }, having: { account_name: { _count: { gte: COMMITTEE_MIN_PEOPLE } } } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const reasons = new Map<string, Set<string>>();
  const add = (name: string, why: string) => {
    if (!name || isFixture(name)) return;
    (reasons.get(name) ?? reasons.set(name, new Set()).get(name)!).add(why);
  };
  for (const a of prio as Array<{ name: string }>) add(a.name, 'priority');
  for (const h of hyps as Array<{ account_name: string }>) add(h.account_name, 'gap_thesis');
  for (const c of committees as Array<{ account_name: string }>) add(c.account_name, 'buying_committee');
  // Registry / pack names are matched to Account rows case-insensitively; a name with no Account row is not watched.
  const watchNames = (watch as Array<{ name: string }>).map((w) => w.name);
  const matched: Array<{ name: string }> = watchNames.length
    ? await prisma.account.findMany({ where: { OR: watchNames.map((n) => ({ name: { equals: n, mode: 'insensitive' } })) }, select: { name: true } })
    : [];
  for (const m of matched) add(m.name, 'audited_for_page');

  const names = [...reasons.keys()].sort();
  if (!names.length) return [];
  const [rows, aliasRows, links, corrections] = await Promise.all([
    prisma.account.findMany({ where: { name: { in: names } }, select: { name: true, tier: true, priority_band: true, parent_brand: true } }),
    prisma.gapAccountAlias.findMany({ where: { account_name: { in: names } }, select: { alias: true, account_name: true } }),
    prisma.canonicalAccountLink.findMany({ where: { account_name: { in: names }, status: 'resolved' }, select: { account_name: true, canonical_company_id: true } }),
    prisma.gapAuditEvent.findMany({ where: { kind: WATCH_AUDIT, subject_type: 'account', subject_id: { in: names } }, orderBy: { created_at: 'desc' }, select: { subject_id: true, payload: true } }),
  ]);
  const byName = new Map((rows as Array<{ name: string; tier: string | null; priority_band: string | null; parent_brand: string | null }>).map((r) => [r.name, r]));
  const correction = new Map<string, { add: string[]; remove: string[] }>();
  for (const c of corrections as Array<{ subject_id: string; payload: Record<string, unknown> }>) {
    if (correction.has(c.subject_id)) continue;
    correction.set(c.subject_id, { add: Array.isArray(c.payload?.addAliases) ? (c.payload.addAliases as string[]) : [], remove: Array.isArray(c.payload?.removeAliases) ? (c.payload.removeAliases as string[]) : [] });
  }
  const families = new Map<string, string[]>();
  for (const h of hyps as Array<{ account_name: string; problem_family: string; status: string }>) {
    if (!['draft', 'review_required', 'approved', 'active'].includes(h.status)) continue;
    families.set(h.account_name, [...new Set([...(families.get(h.account_name) ?? []), h.problem_family])]);
  }
  const tickerOf = new Map(Object.entries(TICKER_TO_SLUG).map(([t, slug]) => [slug, t]));
  const slugOf = (n: string) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return names.map((name) => {
    const r = byName.get(name);
    const fix = correction.get(name) ?? { add: [], remove: [] };
    const removed = new Set(fix.remove.map((x) => x.toLowerCase()));
    const aliases = [
      ...new Set(
        [
          ...(aliasRows as Array<{ alias: string; account_name: string }>).filter((a) => a.account_name === name).map((a) => a.alias),
          ...fix.add,
        ].map((x) => x.trim()),
      ),
    ].filter((x) => x && !removed.has(x.toLowerCase()) && x.toLowerCase() !== name.toLowerCase());
    const fam = families.get(name) ?? [];
    const themes = [...new Set([...fam.flatMap((f) => FAMILY_THEMES[f] ?? []), ...DEFAULT_THEMES])];
    return {
      accountName: name,
      aliases,
      domains: [...new Set((links as Array<{ account_name: string; canonical_company_id: string }>).filter((l) => l.account_name === name && l.canonical_company_id.startsWith('domain:')).map((l) => l.canonical_company_id.slice(7)))],
      ticker: tickerOf.get(slugOf(name)) ?? null,
      themes,
      tier: r?.tier ?? null,
      band: r?.priority_band ?? null,
      reasons: [...(reasons.get(name) ?? [])].sort(),
    };
  });
}

export type WatchRefusal = 'account_not_found' | 'empty';

/** Casey's small correction: add or remove an alias for one account (append-only; the newest row holds the full lists). */
export async function correctWatch(prisma: PrismaLike, input: { accountName: string; addAliases?: string[]; removeAliases?: string[]; actor: string }): Promise<{ ok: true } | { ok: false; reason: WatchRefusal }> {
  const acct: { name: string } | null = await prisma.account.findFirst({ where: { name: { equals: input.accountName.trim(), mode: 'insensitive' } }, select: { name: true } });
  if (!acct) return { ok: false, reason: 'account_not_found' };
  const clean = (xs?: string[]) => [...new Set((xs ?? []).map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x.length >= 2 && x.length <= 80))];
  const add = clean(input.addAliases);
  const remove = clean(input.removeAliases);
  if (!add.length && !remove.length) return { ok: false, reason: 'empty' };
  const prev: { payload: Record<string, unknown> } | null = await prisma.gapAuditEvent.findFirst({ where: { kind: WATCH_AUDIT, subject_type: 'account', subject_id: acct.name }, orderBy: { created_at: 'desc' }, select: { payload: true } });
  const prevAdd = Array.isArray(prev?.payload?.addAliases) ? (prev!.payload.addAliases as string[]) : [];
  const prevRemove = Array.isArray(prev?.payload?.removeAliases) ? (prev!.payload.removeAliases as string[]) : [];
  const lower = (xs: string[]) => new Set(xs.map((x) => x.toLowerCase()));
  const nextAdd = [...prevAdd.filter((x) => !lower(remove).has(x.toLowerCase())), ...add];
  const nextRemove = [...prevRemove.filter((x) => !lower(add).has(x.toLowerCase())), ...remove];
  await prisma.gapAuditEvent.create({ data: { kind: WATCH_AUDIT, actor: input.actor, subject_type: 'account', subject_id: acct.name, payload: { addAliases: [...new Set(nextAdd)], removeAliases: [...new Set(nextRemove)] } } });
  if (prisma && typeof prisma === 'object') profileCache.delete(prisma);
  return { ok: true };
}
