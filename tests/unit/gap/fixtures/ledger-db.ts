/**
 * An in-memory Prisma stand-in for the append-only GAP ledger and the few tables the Sprint 4 services read
 * (R40-R45): every query goes through the shared `where` evaluator (unknown operators throw), every create gets a
 * monotonic id and timestamp, and `client()` returns a FRESH client over the same rows (a restart, another instance).
 * It is an external-boundary stand-in for unit tests only; the scratch tests run the real Postgres.
 */
import { matchesWhere, sortBy } from './where';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function pick(row: Row, select: Row | undefined): Row {
  if (!select) return { ...row };
  const out: Row = {};
  for (const [k, v] of Object.entries(select)) if (v) out[k] = row[k];
  return out;
}

function table(rows: Row[], clock: () => Date, idPrefix: string) {
  let n = 0;
  return {
    rows,
    findMany: async (q: { where?: Row; orderBy?: Row | Row[]; take?: number; skip?: number; select?: Row } = {}) => sortBy(rows.filter((r) => matchesWhere(r, q.where)), q.orderBy).slice(q.skip ?? 0, (q.skip ?? 0) + (q.take ?? Number.MAX_SAFE_INTEGER)).map((r) => pick(r, q.select)),
    findFirst: async (q: { where?: Row; orderBy?: Row | Row[]; select?: Row } = {}) => {
      const r = sortBy(rows.filter((x) => matchesWhere(x, q.where)), q.orderBy)[0];
      return r ? pick(r, q.select) : null;
    },
    findUnique: async (q: { where: Row; select?: Row }) => {
      const r = rows.find((x) => matchesWhere(x, q.where));
      return r ? pick(r, q.select) : null;
    },
    count: async (q: { where?: Row } = {}) => rows.filter((r) => matchesWhere(r, q.where)).length,
    create: async (q: { data: Row; select?: Row }) => {
      n += 1;
      const row = { id: `${idPrefix}${String(rows.length + n).padStart(5, '0')}`, created_at: clock(), ...q.data };
      rows.push(row);
      return pick(row, q.select);
    },
    /** Sprint 5: the mirror ledger's idempotency row (one per key). */
    update: async (q: { where: Row; data: Row; select?: Row }) => {
      const r = rows.find((x) => matchesWhere(x, q.where));
      if (!r) throw Object.assign(new Error('Record to update not found.'), { code: 'P2025' });
      Object.assign(r, q.data, { updated_at: clock() });
      return pick(r, q.select);
    },
    upsert: async (q: { where: Row; create: Row; update: Row }) => {
      const r = rows.find((x) => matchesWhere(x, q.where));
      if (r) {
        Object.assign(r, q.update);
        return { ...r };
      }
      n += 1;
      const row = { id: `${idPrefix}${String(rows.length + n).padStart(5, '0')}`, created_at: clock(), ...q.create };
      rows.push(row);
      return { ...row };
    },
  };
}

export interface LedgerSeed {
  /** A name, or an account row (C5: parent_brand, hubspot_company_id). */
  accounts?: Array<string | Row>;
  /** C5: canonical_conflicts rows (code, status, account_name, canonical_company_id, reason, created_at). */
  conflicts?: Row[];
  /** C5 fix: the identity tables loadIdentityContext reads (canonical_companies, canonical_account_links, gap_account_aliases). */
  companies?: Row[];
  links?: Row[];
  aliases?: Row[];
  personas?: Row[];
  audit?: Row[];
  sequenceVersions?: Row[];
  meetings?: Row[];
  inbound?: Row[];
  dispositions?: Row[];
  routingDecisions?: Row[];
  unsubscribed?: Row[];
  hypotheses?: Row[];
  /** Sprint 5: confirmed buyer words (R51 / R53) and the HubSpot mirror's idempotency rows (R54). */
  bids?: Row[];
  mirror?: Row[];
  /** X03 (sales execution engine): SystemConfig rows (the seller settings, the briefing claims). */
  config?: Row[];
  /** X10: compile rows (the copy a revision was judged on). */
  compiles?: Row[];
  /** I01: the intelligence tables. */
  signals?: Row[];
  triggers?: Row[];
  threads?: Row[];
  /** Stream A (2026-10-09): gap_knowledge_notes rows (the synced vault). */
  knowledgeNotes?: Row[];
}

/** X05b: SystemConfig's `key` is its primary key: a second create for the same key is Prisma's P2002 (the daily claims rely on it); delete removes by key. */
function uniqueKeyTable(rows: Row[], clock: () => Date, idPrefix: string) {
  const base = table(rows, clock, idPrefix);
  return {
    ...base,
    create: async (q: { data: Row; select?: Row }) => {
      if (rows.some((r) => r.key === q.data.key)) throw Object.assign(new Error('Unique constraint failed on the fields: (`key`)'), { code: 'P2002' });
      return base.create(q);
    },
    delete: async (q: { where: Row }) => {
      const i = rows.findIndex((r) => matchesWhere(r, q.where));
      if (i < 0) throw Object.assign(new Error('Record to delete does not exist.'), { code: 'P2025' });
      const [gone] = rows.splice(i, 1);
      return { ...gone };
    },
  };
}

/** A fresh client over shared rows; `tick` advances the ledger clock so newest-row-wins is deterministic. */
export function ledgerDb(seed: LedgerSeed = {}, start = new Date('2026-10-06T14:00:00Z')) {
  const store = {
    account: (seed.accounts ?? []).map((a) => (typeof a === 'string' ? { name: a } : { ...a })),
    canonicalConflict: [...(seed.conflicts ?? [])],
    canonicalCompany: [...(seed.companies ?? [])],
    canonicalAccountLink: [...(seed.links ?? [])],
    gapAccountAlias: [...(seed.aliases ?? [])],
    persona: [...(seed.personas ?? [])],
    gapAuditEvent: [...(seed.audit ?? [])],
    sequenceVersion: [...(seed.sequenceVersions ?? [])],
    meeting: [...(seed.meetings ?? [])],
    inboundMessage: [...(seed.inbound ?? [])],
    conversationDisposition: [...(seed.dispositions ?? [])],
    routingDecision: [...(seed.routingDecisions ?? [])],
    unsubscribedEmail: [...(seed.unsubscribed ?? [])],
    prospectingHypothesis: [...(seed.hypotheses ?? [])],
    buyerInputData: [...(seed.bids ?? [])],
    gapHubSpotMirror: [...(seed.mirror ?? [])],
    systemConfig: [...(seed.config ?? [])],
    gapCompile: [...(seed.compiles ?? [])],
    gapSignal: [...(seed.signals ?? [])],
    pounceTrigger: [...(seed.triggers ?? [])],
    emailThread: [...(seed.threads ?? [])],
    gapKnowledgeNote: [...(seed.knowledgeNotes ?? [])],
  };
  let t = start.getTime();
  const clock = () => new Date((t += 1000));
  const client = () => ({
    account: table(store.account, clock, 'acct'),
    canonicalConflict: table(store.canonicalConflict, clock, 'cc'),
    // The identity tables are present only when seeded: a client without them never loads an identity context (as before).
    ...(seed.companies || seed.links || seed.aliases ? { canonicalCompany: table(store.canonicalCompany, clock, 'cco'), canonicalAccountLink: table(store.canonicalAccountLink, clock, 'cal'), gapAccountAlias: table(store.gapAccountAlias, clock, 'al') } : {}),
    persona: table(store.persona, clock, 'p'),
    gapAuditEvent: table(store.gapAuditEvent, clock, 'ev'),
    sequenceVersion: table(store.sequenceVersion, clock, 'sv'),
    meeting: table(store.meeting, clock, 'm'),
    inboundMessage: table(store.inboundMessage, clock, 'in'),
    conversationDisposition: table(store.conversationDisposition, clock, 'd'),
    routingDecision: table(store.routingDecision, clock, 'rd'),
    unsubscribedEmail: table(store.unsubscribedEmail, clock, 'u'),
    prospectingHypothesis: table(store.prospectingHypothesis, clock, 'h'),
    buyerInputData: table(store.buyerInputData, clock, 'b'),
    gapHubSpotMirror: table(store.gapHubSpotMirror, clock, 'mir'),
    systemConfig: uniqueKeyTable(store.systemConfig, clock, 'cfg'),
    gapCompile: table(store.gapCompile, clock, 'cmp'),
    gapSignal: table(store.gapSignal, clock, 'sig'),
    pounceTrigger: table(store.pounceTrigger, clock, 'trg'),
    emailThread: table(store.emailThread, clock, 'th'),
    gapKnowledgeNote: table(store.gapKnowledgeNote, clock, 'kn'),
  });
  return { store, client, setClock: (d: Date) => (t = d.getTime()) };
}
