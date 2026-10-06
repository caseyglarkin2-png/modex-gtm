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
    findMany: async (q: { where?: Row; orderBy?: Row | Row[]; take?: number; select?: Row } = {}) => sortBy(rows.filter((r) => matchesWhere(r, q.where)), q.orderBy).slice(0, q.take ?? undefined).map((r) => pick(r, q.select)),
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
  };
}

export interface LedgerSeed {
  accounts?: string[];
  personas?: Row[];
  audit?: Row[];
  sequenceVersions?: Row[];
  meetings?: Row[];
  inbound?: Row[];
  dispositions?: Row[];
  routingDecisions?: Row[];
  unsubscribed?: Row[];
}

/** A fresh client over shared rows; `tick` advances the ledger clock so newest-row-wins is deterministic. */
export function ledgerDb(seed: LedgerSeed = {}, start = new Date('2026-10-06T14:00:00Z')) {
  const store = {
    account: (seed.accounts ?? []).map((name) => ({ name })),
    persona: [...(seed.personas ?? [])],
    gapAuditEvent: [...(seed.audit ?? [])],
    sequenceVersion: [...(seed.sequenceVersions ?? [])],
    meeting: [...(seed.meetings ?? [])],
    inboundMessage: [...(seed.inbound ?? [])],
    conversationDisposition: [...(seed.dispositions ?? [])],
    routingDecision: [...(seed.routingDecisions ?? [])],
    unsubscribedEmail: [...(seed.unsubscribed ?? [])],
  };
  let t = start.getTime();
  const clock = () => new Date((t += 1000));
  const client = () => ({
    account: table(store.account, clock, 'acct'),
    persona: table(store.persona, clock, 'p'),
    gapAuditEvent: table(store.gapAuditEvent, clock, 'ev'),
    sequenceVersion: table(store.sequenceVersion, clock, 'sv'),
    meeting: table(store.meeting, clock, 'm'),
    inboundMessage: table(store.inboundMessage, clock, 'in'),
    conversationDisposition: table(store.conversationDisposition, clock, 'd'),
    routingDecision: table(store.routingDecision, clock, 'rd'),
    unsubscribedEmail: table(store.unsubscribedEmail, clock, 'u'),
  });
  return { store, client, setClock: (d: Date) => (t = d.getTime()) };
}
