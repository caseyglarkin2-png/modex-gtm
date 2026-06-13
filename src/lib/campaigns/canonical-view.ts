/**
 * Canonical campaign view adapter.
 *
 * Maps the live clawd canonical endpoint
 *   GET {clawd}/api/canonical/campaign/{tag}
 * into the component model the Allentown command-center UI expects
 * (the shape encoded in the design mockup's data.js).
 *
 * This is the single place where raw canonical values get FORMATTED for
 * presentation: revenue strings to "$164.7B", HubSpot industry enums to
 * readable labels, lowercase source names to source codes. Every leaf keeps
 * its provenance ({value, source, verified}) so the SourceChip can render.
 *
 * Pure + unit-testable: adaptCanonicalView(raw) -> CommandCenterView.
 */

/* ─── Raw endpoint shapes (what the canonical API returns) ────────── */

export interface RawFact {
  value?: string | null;
  source?: string | null;
  observed_at?: string | null;
  verified?: boolean;
}

export interface RawFunnelStage {
  stage: string;
  count: number;
}

export interface RawSource {
  code: string;
  label: string;
  kind: string;
  syncedAt: string | null;
  fresh: boolean;
}

export interface RawConflict {
  field: string;
  winner: { value: string; source: string; note?: string };
  loser: { value: string; source: string; note?: string };
  why: string;
  rule: string;
  override?: boolean;
}

export interface RawSignal {
  label: string;
  detail?: string;
  source: string;
}

export interface RawWebPage {
  path: string;
  views?: number;
  dwell?: string | null;
  when?: string | null;
  hot?: boolean;
}

export interface RawWeb {
  sessions: number;
  identified: boolean | number;
  lastSeen: string | null;
  pages: RawWebPage[];
  matchEdge?: string | null;
}

export interface RawAccount {
  id: number;
  name: string;
  domain: string;
  pulse: number;
  tam: string | null;
  facts: Record<string, RawFact>;
  conflicts: RawConflict[];
  signals: RawSignal[];
  why: string | null;
  web: RawWeb | null;
  committee: number[];
  nextAction?: { do: string; owner: string; priority: string } | null;
}

export interface RawPersonEvent {
  type: string;
  when: string | null;
  source: string;
  detail?: string | null;
  strong?: boolean;
}

export interface RawPerson {
  id: number;
  accountId: number;
  name: string;
  role: string;
  facts: {
    title?: RawFact;
    titleConflict?: RawConflict | null;
  };
  why: string | null;
  draft?: { source: string; status: string; subject: string } | null;
  events: RawPersonEvent[];
  web: RawWeb | null;
  nextStep?: string | null;
}

export interface RawCanonicalCampaign {
  campaign: {
    tag: string;
    funnel: RawFunnelStage[];
    liveSite?: { name: string; city: string } | null;
  };
  sources: RawSource[];
  accounts: RawAccount[];
  persons: RawPerson[];
  counts?: { accounts: number; persons: number };
}

/* ─── Component model (what the UI renders) ───────────────────────── */

export type SourceCode = string; // 'HS' | 'GM' | 'PH' | 'AP' | 'ICP' | compound 'ICP+HS'

export interface ViewFact {
  v: string;
  src: SourceCode;
  verified?: boolean;
  conflict?: string; // conflict key, set when sources disagree on this field
}

export interface ViewConflict {
  field: string;
  key: string;
  winner: { v: string; src: SourceCode; note: string };
  loser: { v: string; src: SourceCode; note: string };
  why: string;
  rule: string;
}

export interface ViewSignal {
  label: string;
  detail: string;
  src: SourceCode;
}

export interface ViewWebPage {
  path: string;
  views: number;
  dwell?: string;
  when?: string;
  hot?: boolean;
}

export interface ViewWeb {
  sessions: number;
  identified: number;
  lastSeen: string;
  match?: string;
  pages: ViewWebPage[];
}

export interface ViewNextStep {
  do: string;
  owner: string;
  due: string;
  priority: 'high' | 'med' | 'low' | 'normal';
}

export interface ViewEvent {
  t: string;
  when: string;
  src: SourceCode;
  detail?: string;
  strong?: boolean;
}

export interface ViewDraft {
  status: string;
  subject: string;
  body: string;
  src: SourceCode;
}

export interface ViewContact {
  id: string;
  accId: string;
  name: string;
  initials: string;
  role: string;
  engagement: string; // replied | opened | sent | draft | contacts
  title: ViewFact;
  titleConflict: ViewConflict | null;
  location?: ViewFact;
  linkedin?: ViewFact;
  pedigree?: ViewFact;
  why: string;
  draft: ViewDraft;
  events: ViewEvent[];
  web: ViewWeb | null;
  nextStep: ViewNextStep | null;
}

export interface ViewAccount {
  id: string;
  name: string;
  domain: string;
  icp: number;
  tam: string;
  stage: string;
  attention: boolean;
  attentionReason: string;
  industry: ViewFact;
  revenue: ViewFact;
  employees: ViewFact;
  hq: ViewFact;
  dcs: ViewFact;
  footprint: ViewFact;
  pa: { city: string; left: string; top: string };
  why: string;
  signals: ViewSignal[];
  committee: string[];
  conflicts: ViewConflict[];
  nextAction: ViewNextStep | null;
  web: ViewWeb | null;
}

export interface ViewSourceHealth {
  code: SourceCode;
  synced: string;
  fresh: boolean;
}

export interface ViewFunnelStage {
  stage: string;
  label: string;
  count: number;
}

export interface CommandCenterView {
  funnel: ViewFunnelStage[];
  sourceHealth: ViewSourceHealth[];
  accounts: ViewAccount[];
  contacts: ViewContact[];
  liveSite: { name: string; city: string; left: string; top: string };
  counts: { accounts: number; persons: number };
}

/* ─── Formatters ──────────────────────────────────────────────────── */

/** Map a lowercase canonical source name to its chip code. */
export function sourceCode(source: string | null | undefined): SourceCode {
  if (!source) return 'HS';
  const s = source.trim().toLowerCase();
  const map: Record<string, SourceCode> = {
    hubspot: 'HS',
    hs: 'HS',
    gmail: 'GM',
    gm: 'GM',
    email: 'GM',
    posthog: 'PH',
    ph: 'PH',
    apollo: 'AP',
    ap: 'AP',
    enrichment: 'AP',
    icp: 'ICP',
    score: 'ICP',
    modex: 'ICP+HS', // drafts authored by the modex engine, scored from ICP + HS
  };
  return map[s] ?? source.toUpperCase();
}

/** Format a raw revenue number string to compact USD ("164683000000" -> "$164.7B"). */
export function formatRevenue(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return String(value);
  if (n >= 1e12) return `$${trim(n / 1e12)}T`;
  if (n >= 1e9) return `$${trim(n / 1e9)}B`;
  if (n >= 1e6) return `$${trim(n / 1e6)}M`;
  if (n >= 1e3) return `$${trim(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

function trim(n: number): string {
  // one decimal, drop a trailing ".0"
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Format an employee count ("470000" -> "470,000"). */
export function formatCount(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString('en-US');
}

const INDUSTRY_LABELS: Record<string, string> = {
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale Distribution',
  SUPERMARKETS: 'Supermarkets & Grocery',
  FOOD_BEVERAGES: 'Food & Beverage',
  FOOD_PRODUCTION: 'Food Production',
  BUILDING_MATERIALS: 'Building Materials',
  MANUFACTURING: 'Manufacturing',
  LOGISTICS_AND_SUPPLY_CHAIN: 'Logistics & Supply Chain',
  PHARMACEUTICALS: 'Pharmaceuticals',
};

/** Map a HubSpot industry enum to a readable label. */
export function formatIndustry(value: string | null | undefined): string {
  if (!value) return '';
  const key = value.trim().toUpperCase();
  if (INDUSTRY_LABELS[key]) return INDUSTRY_LABELS[key];
  // generic enum -> Title Case
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const SEGMENT_LABELS: Record<string, string> = {
  building_materials_industrial: 'Building Materials / Industrial',
  cpg_food_beverage: 'CPG · Food & Beverage',
  agriculture_food_processing: 'Agriculture / Food Processing',
  retail_grocery: 'Retail & Grocery',
  wholesale_distribution: 'Wholesale Distribution',
};

/** Map a tam_segment slug to a readable label. */
export function formatSegment(value: string | null | undefined): string {
  if (!value) return '';
  if (SEGMENT_LABELS[value]) return SEGMENT_LABELS[value];
  return value
    .split(/[_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Initials for an avatar ("Shawn Mitchell" -> "SM"). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Human-relative timestamp ("...T13:00:00Z" -> "2h ago"), fail-soft. */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return 'no sync';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'no sync';
  const diff = Math.max(0, now - t);
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

/* ─── Stage derivation ────────────────────────────────────────────── */

const PRIORITY_BY_DRAFT_STATUS: Record<string, ViewNextStep['priority']> = {
  draft: 'normal',
  sent: 'low',
  opened: 'med',
  replied: 'high',
};

/** Derive an engagement stage for a person from their draft status + events. */
export function deriveContactStage(person: RawPerson): string {
  const order = ['replied', 'opened', 'sent', 'draft'];
  const fromEvents = new Set(
    (person.events || []).map((e) => (e.type || '').toLowerCase()),
  );
  if (fromEvents.has('replied')) return 'replied';
  if (fromEvents.has('opened')) return 'opened';
  if (fromEvents.has('sent')) return 'sent';
  const ds = (person.draft?.status || '').toLowerCase();
  if (order.includes(ds)) return ds;
  return 'draft';
}

/** Derive an account-level stage as the strongest stage across its committee. */
export function deriveAccountStage(committeeStages: string[]): string {
  const rank = ['draft', 'sent', 'opened', 'replied'];
  let best = 'draft';
  for (const s of committeeStages) {
    if (rank.indexOf(s) > rank.indexOf(best)) best = s;
  }
  return best;
}

/* ─── Conflict + fact mapping ─────────────────────────────────────── */

function adaptConflict(c: RawConflict, accountKey: string): ViewConflict {
  return {
    field: capitalize(c.field),
    key: `${accountKey}.${c.field}`,
    winner: {
      v: c.winner.value,
      src: sourceCode(c.winner.source),
      note: c.winner.note ?? 'verified',
    },
    loser: {
      v: c.loser.value,
      src: sourceCode(c.loser.source),
      note: c.loser.note ?? 'older',
    },
    why: c.why,
    rule: c.rule,
  };
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

/** A fact, formatted, with provenance preserved. Empty {} facts -> dash. */
function fact(
  raw: RawFact | undefined,
  format: (v: string | null | undefined) => string,
  conflictKey?: string,
): ViewFact {
  if (!raw || raw.value == null) {
    return { v: '—', src: 'HS' as SourceCode, verified: false };
  }
  return {
    v: format(raw.value) || '—',
    src: sourceCode(raw.source),
    verified: !!raw.verified,
    ...(conflictKey ? { conflict: conflictKey } : {}),
  };
}

const identity = (v: string | null | undefined) => (v == null ? '' : String(v));

/* ─── Web mapping ─────────────────────────────────────────────────── */

function adaptWeb(raw: RawWeb | null | undefined): ViewWeb | null {
  if (!raw || raw.sessions <= 0) return null;
  return {
    sessions: raw.sessions,
    identified:
      typeof raw.identified === 'number' ? raw.identified : raw.identified ? 1 : 0,
    lastSeen: raw.lastSeen ? relativeTime(raw.lastSeen) : 'recently',
    match: raw.matchEdge ?? undefined,
    pages: (raw.pages || []).map((p) => ({
      path: p.path,
      views: p.views ?? 1,
      dwell: p.dwell ?? undefined,
      when: p.when ? relativeTime(p.when) : undefined,
      hot: !!p.hot,
    })),
  };
}

/* ─── Per-account PA map placement ────────────────────────────────────
 * The canonical endpoint carries no geo coordinates for the prospect
 * accounts, only the live site (Breinigsville). We place prospect pins on
 * the Lehigh-Valley motif using a deterministic ring so the map reads
 * cleanly regardless of how many accounts come back. The live site is the
 * anchor; prospects radiate from it. Honest: these are illustrative
 * positions, not surveyed coordinates.
 * ──────────────────────────────────────────────────────────────────── */
function placeAccounts(count: number): Array<{ left: string; top: string }> {
  const live = { x: 86, y: 44 };
  const out: Array<{ left: string; top: string }> = [];
  const radius = 34;
  for (let i = 0; i < count; i++) {
    // spread across the western arc (away from the live site at right)
    const angle = Math.PI * (0.62 + (i / Math.max(1, count - 1 || 1)) * 0.76);
    const x = Math.max(8, Math.min(78, live.x + Math.cos(angle) * radius));
    const y = Math.max(20, Math.min(82, live.y + Math.sin(angle) * (radius * 0.9)));
    out.push({ left: `${Math.round(x)}%`, top: `${Math.round(y)}%` });
  }
  return out;
}

/* ─── Main adapter ────────────────────────────────────────────────── */

const FUNNEL_LABELS: Record<string, string> = {
  contacts: 'Contacts',
  drafts: 'Drafts',
  sent: 'Sent',
  opened: 'Opened',
  replied: 'Replied',
  booked: 'Booked',
};

export function adaptCanonicalView(raw: RawCanonicalCampaign): CommandCenterView {
  const persons = raw.persons || [];
  const accounts = raw.accounts || [];

  // person id -> stable string id for the UI
  const personKey = (id: number) => `p${id}`;
  const accountKey = (id: number) => `a${id}`;

  // committee per account, in roster order
  const personsByAccount = new Map<number, RawPerson[]>();
  for (const p of persons) {
    const list = personsByAccount.get(p.accountId) || [];
    list.push(p);
    personsByAccount.set(p.accountId, list);
  }

  const placements = placeAccounts(accounts.length);

  /* contacts */
  const contacts: ViewContact[] = persons.map((p) => {
    const engagement = deriveContactStage(p);
    const titleConflict = p.facts.titleConflict
      ? adaptConflict(p.facts.titleConflict, personKey(p.id))
      : null;
    const draftStatus = (p.draft?.status || 'draft').toLowerCase();
    const nextStep: ViewNextStep | null = p.nextStep
      ? {
          do: p.nextStep,
          owner: 'Casey',
          due: draftStatus === 'draft' ? 'Staged' : 'Open',
          priority: PRIORITY_BY_DRAFT_STATUS[draftStatus] ?? 'normal',
        }
      : null;

    return {
      id: personKey(p.id),
      accId: accountKey(p.accountId),
      name: p.name,
      initials: initialsOf(p.name),
      role: p.role,
      engagement,
      title: fact(p.facts.title, identity, titleConflict ? `${personKey(p.id)}.title` : undefined),
      titleConflict,
      why: p.why || '',
      draft: {
        status: draftStatus,
        subject: p.draft?.subject || '',
        body: '', // canonical endpoint carries no draft body yet
        src: sourceCode(p.draft?.source),
      },
      events: (p.events || []).map((e) => ({
        t: e.type,
        when: e.when ? relativeTime(e.when) : 'staged',
        src: sourceCode(e.source),
        detail: e.detail ?? undefined,
        strong: !!e.strong,
      })),
      web: adaptWeb(p.web),
      nextStep,
    };
  });

  const contactById = new Map(contacts.map((c) => [c.id, c]));

  /* accounts */
  const viewAccounts: ViewAccount[] = accounts.map((a, idx) => {
    const f = a.facts || {};
    const committeePersons = personsByAccount.get(a.id) || [];
    const committee = committeePersons.map((p) => personKey(p.id));
    const committeeStages = committee
      .map((id) => contactById.get(id)?.engagement)
      .filter((s): s is string => !!s);
    const stage = deriveAccountStage(committeeStages);

    const conflicts = (a.conflicts || []).map((c) => adaptConflict(c, accountKey(a.id)));
    const conflictByField = new Map(conflicts.map((c) => [c.field.toLowerCase(), c]));

    // an account needs attention if it has replied, opened, or has web intent
    const hasWeb = !!a.web && a.web.sessions > 0;
    const attention = stage === 'replied' || stage === 'opened' || hasWeb;
    const attentionReason =
      stage === 'replied'
        ? 'A committee member replied — awaiting a human response'
        : stage === 'opened'
          ? 'Opened, no reply yet — follow up while it is warm'
          : hasWeb
            ? 'Web intent on yardflow.ai with no identified person yet'
            : '';

    const empConflict = conflictByField.get('employees');
    const indConflict = conflictByField.get('industry');

    return {
      id: accountKey(a.id),
      name: a.name,
      domain: a.domain,
      icp: idx + 1,
      tam: a.tam || 'review',
      stage,
      attention,
      attentionReason,
      industry: fact(f.industry, formatIndustry, indConflict?.key),
      revenue: fact(f.revenue, formatRevenue),
      employees: fact(f.employees, formatCount, empConflict?.key),
      hq: fact(f.hq, identity),
      dcs: fact(f.tamSegment, formatSegment),
      footprint: fact(f.tamTier, (v) => (v ? `TAM tier ${v}` : '')),
      pa: { city: a.domain, ...placements[idx] },
      why: a.why || '',
      signals: (a.signals || []).map((s) => ({
        label: s.label,
        detail: s.detail || '',
        src: sourceCode(s.source),
      })),
      committee,
      conflicts,
      nextAction: a.nextAction
        ? {
            do: a.nextAction.do,
            owner: a.nextAction.owner === 'casey' ? 'Casey' : a.nextAction.owner,
            due: 'Open',
            priority:
              (a.nextAction.priority as ViewNextStep['priority']) ?? 'normal',
          }
        : null,
      web: adaptWeb(a.web),
    };
  });

  /* funnel — render the true counts from the endpoint */
  const funnel: ViewFunnelStage[] = (raw.campaign?.funnel || []).map((s) => ({
    stage: s.stage,
    label: FUNNEL_LABELS[s.stage] || capitalize(s.stage),
    count: s.count,
  }));

  /* source health */
  const sourceHealth: ViewSourceHealth[] = (raw.sources || []).map((s) => ({
    code: s.code,
    synced: relativeTime(s.syncedAt),
    fresh: s.fresh,
  }));

  // The live YardFlow site is Primo Brands in Breinigsville, PA (the anchor of
  // the Allentown tour). The endpoint's campaign.liveSite labels the campaign
  // region ("Allentown"), not the operating site, so we keep the true site.
  const liveSite = {
    name: 'Primo Brands',
    city: 'Breinigsville, PA',
    left: '86%',
    top: '44%',
  };

  return {
    funnel,
    sourceHealth,
    accounts: viewAccounts,
    contacts,
    liveSite,
    counts: raw.counts || { accounts: accounts.length, persons: persons.length },
  };
}
