/**
 * Routing run, queue paging and human-action capture (GAP Sprint 2, S2-T7).
 *
 * No network, no database: a small in-memory Prisma fake that honors
 * `where`, `orderBy` and `take` stands in for routing_decisions, so ordering
 * and cursor claims are proven against real sorting rather than a mock that
 * returns whatever it is handed. The assembler, router, suppression reader
 * and audit ledger are injected through `deps`.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { AuditInput } from '@/lib/gap/audit';
import type { AssembleAccountArgs, AssembleResult } from '@/lib/gap/routing/inputs';
import { staticSuppressionReader } from '@/lib/gap/routing/suppression-read';
import type { RouteResult, RoutingDecision, RoutingInputs } from '@/lib/gap/routing/types';

const mockedAuth = vi.fn();
const mockedGetHubSpotClient = vi.fn();
const mockedIsHubSpotConfigured = vi.fn(() => false);
// Delegates are swapped per test; the module mock hands out this one object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fakePrisma: Record<string, any> = {};

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));
vi.mock('@/lib/hubspot/client', () => ({
  getHubSpotClient: mockedGetHubSpotClient,
  isHubSpotConfigured: mockedIsHubSpotConfigured,
  withHubSpotRetry: async (fn: () => Promise<unknown>) => fn(),
}));

const {
  runRouting,
  SHADOW_MODE,
  LAST_RUN_CONFIG_KEY,
  CONTACT_BATCH_SIZE,
  SNAPSHOT_COMPANY_PROPERTIES,
  SNAPSHOT_CONTACT_PROPERTIES,
  createHubSpotSnapshotProvider,
  snapshotFromProperties,
  tamFromProperty,
} = await import('@/lib/gap/routing/run');
const { listQueue, recordHumanAction, decodeCursor, encodeCursor } = await import('@/lib/gap/routing/queue');
const { POST: runPOST } = await import('@/app/api/gap/routing/run/route');
const { GET: queueGET } = await import('@/app/api/gap/queue/route');
const { POST: actPOST } = await import('@/app/api/gap/decisions/[id]/act/route');

const NOW = new Date('2026-09-23T12:00:00.000Z');
const SESSION = { user: { email: 'casey@freightroll.com' } };

// ---------------------------------------------------------------------------
// In-memory Prisma fake for routing_decisions (+ the delegates the run touches)
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

function matches(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, cond] of Object.entries(where)) {
    if (key === 'OR') {
      if (!(cond as Record<string, unknown>[]).some((c) => matches(row, c))) return false;
      continue;
    }
    const value = row[key];
    if (cond !== null && typeof cond === 'object' && !(cond instanceof Date)) {
      const c = cond as Record<string, unknown>;
      if ('lt' in c && !((value as number | string) < (c.lt as number | string))) return false;
      if ('gt' in c && !((value as number | string) > (c.gt as number | string))) return false;
      if ('in' in c && !(c.in as unknown[]).includes(value)) return false;
      if ('notIn' in c && (c.notIn as unknown[]).includes(value)) return false;
      if ('equals' in c && value !== c.equals) return false;
      continue;
    }
    if (value !== cond) return false;
  }
  return true;
}

function sortRows(rows: Row[], orderBy: unknown): Row[] {
  const clauses = (Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []) as Record<string, 'asc' | 'desc'>[];
  return [...rows].sort((a, b) => {
    for (const clause of clauses) {
      for (const [field, dir] of Object.entries(clause)) {
        const av = a[field] as number | string | Date;
        const bv = b[field] as number | string | Date;
        const an = av instanceof Date ? av.getTime() : av;
        const bn = bv instanceof Date ? bv.getTime() : bv;
        if (an === bn) continue;
        const cmp = an < bn ? -1 : 1;
        return dir === 'desc' ? -cmp : cmp;
      }
    }
    return 0;
  });
}

function project(row: Row, select: Record<string, boolean> | undefined): Row {
  if (!select) return row;
  const out: Row = {};
  for (const k of Object.keys(select)) if (select[k]) out[k] = row[k];
  return out;
}

function makeStore() {
  const rows: Row[] = [];
  let seq = 0;
  let clock = NOW.getTime();
  const routingDecision = {
    findFirst: vi.fn(async (args: { where?: Record<string, unknown>; orderBy?: unknown; select?: Record<string, boolean> }) => {
      const hit = sortRows(rows.filter((r) => matches(r, args.where ?? {})), args.orderBy)[0];
      return hit ? project(hit, args.select) : null;
    }),
    findMany: vi.fn(async (args: { where?: Record<string, unknown>; orderBy?: unknown; take?: number; select?: Record<string, boolean> }) => {
      const sorted = sortRows(rows.filter((r) => matches(r, args.where ?? {})), args.orderBy);
      const taken = typeof args.take === 'number' ? sorted.slice(0, args.take) : sorted;
      return taken.map((r) => project(r, args.select));
    }),
    findUnique: vi.fn(async (args: { where: { id: string }; select?: Record<string, boolean> }) => {
      const hit = rows.find((r) => r.id === args.where.id);
      return hit ? project(hit, args.select) : null;
    }),
    create: vi.fn(async (args: { data: Row }) => {
      seq += 1;
      clock += 1000;
      const row: Row = {
        id: `d${String(seq).padStart(2, '0')}`,
        human_action: null,
        human_actor: null,
        human_action_at: null,
        acted_by_system_at: null,
        created_at: new Date(clock),
        ...args.data,
      };
      rows.push(row);
      return { id: row.id };
    }),
    updateMany: vi.fn(async (args: { where: Record<string, unknown>; data: Row }) => {
      let count = 0;
      for (const r of rows) {
        if (matches(r, args.where)) {
          Object.assign(r, args.data);
          count += 1;
        }
      }
      return { count };
    }),
  };
  const systemConfig = { upsert: vi.fn(async (_args: Record<string, unknown>) => ({})) };
  const account = {
    findMany: vi.fn(async (_args: Record<string, unknown>): Promise<Row[]> => []),
    findUnique: vi.fn(async (_args: Record<string, unknown>): Promise<Row | null> => null),
  };
  const persona = { findMany: vi.fn(async (_args: Record<string, unknown>): Promise<Row[]> => []) };
  return { rows, routingDecision, systemConfig, account, persona };
}

type Store = ReturnType<typeof makeStore>;

function installStore(store: Store) {
  for (const key of Object.keys(fakePrisma)) delete fakePrisma[key];
  Object.assign(fakePrisma, {
    routingDecision: store.routingDecision,
    systemConfig: store.systemConfig,
    account: store.account,
    persona: store.persona,
  });
}

/** Seed a decision row directly (what run.ts would have written). */
async function seed(store: Store, data: Partial<Row> & { priority: number }): Promise<string> {
  const created = await store.routingDecision.create({
    data: {
      run_id: 'run-A',
      mode: 'shadow',
      account_name: 'Acme Foods',
      persona_id: 1,
      hypothesis_id: null,
      action: 'enroll_gap_sequence',
      lane: 'work_queue',
      rule_id: 'R12',
      explain: { whyAccount: 'x' },
      inputs_snapshot: {
        account: { name: 'Acme Foods', hubspotCompanyId: '111', tam: 'in', tamTier: 'A', heatTier: 2 },
        persona: { id: 1, personaKey: 'site_ops', email: 'a@acme.example', hubspotContactId: '9' },
        hypothesis: null,
        target: 'hubspot_native',
        displayName: 'Ann Acme',
      },
      ...data,
    },
  });
  return String(created.id);
}

// ---------------------------------------------------------------------------
// Routing fixtures
// ---------------------------------------------------------------------------

function inputsFor(accountName: string, personaId: number, extra: Partial<RoutingInputs> = {}): RoutingInputs {
  return {
    now: NOW,
    account: {
      name: accountName,
      slug: null,
      hubspotCompanyId: `hs-${accountName}`,
      tam: 'in',
      tamTier: 'A',
      heatTier: 2,
      heat: 55,
      intentScore: null,
      lastIntentAt: null,
      triggerScore: null,
      lastTriggerAt: null,
      outreachStatus: null,
      pipelineStage: 'targeted',
    },
    signals: { freshTriggers: [], newestAgeDays: null },
    persona: {
      id: personaId,
      personaKey: 'site_ops',
      roleGatePassed: true,
      seniorityRank: 3,
      email: `p${personaId}@${accountName.toLowerCase().replace(/\s+/g, '')}.example`,
      emailValid: true,
      emailStatus: 'valid',
      phone: null,
      phoneStatus: null,
      linkedinUrl: null,
      hubspotContactId: `c-${personaId}`,
      qualVerdict: null,
      lastIntentSource: null,
      doNotContact: false,
      top100: null,
    },
    hypothesis: {
      id: `hyp-${personaId}`,
      status: 'approved',
      family: 'hidden_capacity',
      confidence: 70,
      evidenceFresh: true,
      expiresAt: null,
      resumeAt: null,
      version: 1,
      observation: 'o',
      problemHypothesis: 'p',
      whyNow: null,
      falsificationQuestions: [],
      whatANoMeans: null,
      evidenceIds: [],
      signalIds: [],
    },
    comms: {
      inFlight: false,
      lastOutboundAt: null,
      lastInboundAt: null,
      undispositionedInbound: false,
      lastDisposition: null,
      meetingBooked: false,
    },
    suppression: { verdict: 'clear', legs: { clawd_contract: 'clear' } },
    freshness: { evidenceMaxAgeDays: 45, hypothesisTtlDays: 45, hotTriggerDays: 7, cooldownDays: 14 },
    ...extra,
  };
}

function decisionFor(inputs: RoutingInputs, overrides: Partial<RoutingDecision> = {}): RouteResult {
  const decision: RoutingDecision = {
    action: 'enroll_gap_sequence',
    lane: 'work_queue',
    ruleId: 'R12',
    priority: 80 + inputs.persona.id,
    blocked: false,
    target: 'hubspot_native',
    explain: {
      whyAccount: `account ${inputs.account.name}`,
      whyPerson: 'person',
      whyProblem: 'problem',
      whyNow: 'now',
      whyAction: 'action',
      evidenceIds: [],
      signalIds: [],
      wouldProveWrong: 'x',
    },
    ...overrides,
  };
  return { kind: 'decision', decision };
}

/** Two personas per account, keyed by account name -> persona ids. */
function assembler(plan: Record<string, AssembleResult[]>) {
  return vi.fn(async (_prisma: unknown, args: AssembleAccountArgs) => plan[args.accountName] ?? [{ skip: 'account_not_found' }]);
}

// ---------------------------------------------------------------------------
// runRouting
// ---------------------------------------------------------------------------

describe('runRouting', () => {
  let store: Store;
  const suppression = staticSuppressionReader('clear');

  beforeEach(() => {
    store = makeStore();
    store.account.findMany.mockResolvedValue([
      { name: 'Acme Foods', hubspot_company_id: '111' },
      { name: 'Beta Dairy', hubspot_company_id: null },
    ]);
    store.persona.findMany.mockResolvedValue([
      { id: 1, name: 'Ann Acme' },
      { id: 2, name: 'Al Acme' },
      { id: 3, name: 'Bea Beta' },
      { id: 4, name: '' },
    ]);
  });

  const twoByTwo = () => ({
    'Acme Foods': [inputsFor('Acme Foods', 1), inputsFor('Acme Foods', 2)],
    'Beta Dairy': [inputsFor('Beta Dairy', 3), inputsFor('Beta Dairy', 4)],
  });

  it('two accounts x two personas -> four shadow rows carrying run_id, account, persona and target', async () => {
    const audit = vi.fn(async (_prisma: unknown, _input: AuditInput) => ({ stored: true, reviewQueued: false }));
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const report = await runRouting(
      store,
      { now: NOW, runId: 'run-T', actor: 'test' },
      { suppression, assemble: assembler(twoByTwo()), route, audit },
    );

    expect(report).toMatchObject({
      runId: 'run-T',
      mode: 'shadow',
      accountsScanned: 2,
      pairs: 4,
      decisions: 4,
      dryRun: false,
      skips: {},
      byRule: { R12: 4 },
      byAction: { enroll_gap_sequence: 4 },
    });
    expect(store.routingDecision.create).toHaveBeenCalledTimes(4);
    const datas = store.routingDecision.create.mock.calls.map((c) => c[0].data);
    for (const d of datas) {
      expect(d.mode).toBe('shadow');
      expect(d.run_id).toBe('run-T');
      expect(d.lane).toBe('work_queue');
      expect(d.rule_id).toBe('R12');
      const snap = d.inputs_snapshot as Record<string, unknown>;
      expect((snap.account as Record<string, unknown>).name).toBe(d.account_name);
      expect((snap.persona as Record<string, unknown>).id).toBe(d.persona_id);
      expect(snap.target).toBe('hubspot_native');
      expect(snap.comms).toBeDefined();
      expect(snap.suppression).toEqual({ verdict: 'clear', legs: { clawd_contract: 'clear' } });
      expect(snap.whatIKnow).toBeNull();
    }
    expect(datas.map((d) => [d.account_name, d.persona_id, d.hypothesis_id])).toEqual([
      ['Acme Foods', 1, 'hyp-1'],
      ['Acme Foods', 2, 'hyp-2'],
      ['Beta Dairy', 3, 'hyp-3'],
      ['Beta Dairy', 4, 'hyp-4'],
    ]);
    // Display name comes off the Persona row; a blank name stays null for the emitter's fallback.
    expect(datas.map((d) => (d.inputs_snapshot as Record<string, unknown>).displayName)).toEqual(['Ann Acme', 'Al Acme', 'Bea Beta', null]);

    expect(store.systemConfig.upsert).toHaveBeenCalledWith({
      where: { key: LAST_RUN_CONFIG_KEY },
      update: { value: 'run-T' },
      create: { key: LAST_RUN_CONFIG_KEY, value: 'run-T' },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][1]).toMatchObject({ kind: 'routing.run', actor: 'test', subjectType: 'routing_run', subjectId: 'run-T' });
    expect(audit.mock.calls[0][1].payload).toMatchObject({ runId: 'run-T', decisions: 4 });
  });

  it('skips from the assembler and the router are counted by reason and never stored', async () => {
    const plan = {
      'Acme Foods': [inputsFor('Acme Foods', 1), { skip: 'persona_not_found' }],
      'Beta Dairy': [{ skip: 'inputs_error:pounce_triggers' }, inputsFor('Beta Dairy', 4)],
    };
    const route = vi.fn((inputs: RoutingInputs): RouteResult =>
      inputs.persona.id === 4 ? { kind: 'skip', ruleId: 'R2', reason: 'contact_invalid' } : decisionFor(inputs),
    );
    const report = await runRouting(store, { now: NOW, runId: 'run-S', actor: 'test' }, { suppression, assemble: assembler(plan), route, audit: vi.fn() });

    expect(report.skips).toEqual({ persona_not_found: 1, 'inputs_error:pounce_triggers': 1, contact_invalid: 1 });
    expect(report.pairs).toBe(2);
    expect(report.decisions).toBe(1);
    expect(report.byRule).toEqual({ R12: 1 });
    expect(report.byAction).toEqual({ enroll_gap_sequence: 1 });
    expect(store.routingDecision.create).toHaveBeenCalledTimes(1);
    expect(store.routingDecision.create.mock.calls[0][0].data.persona_id).toBe(1);
  });

  it('byRule and byAction total across mixed decisions', async () => {
    const route = vi.fn((inputs: RoutingInputs) =>
      inputs.persona.id % 2 === 0
        ? decisionFor(inputs, { action: 'call_now', ruleId: 'R7', target: undefined })
        : decisionFor(inputs),
    );
    const report = await runRouting(store, { now: NOW, runId: 'run-M', actor: 'test' }, { suppression, assemble: assembler(twoByTwo()), route, audit: vi.fn() });
    expect(report.byRule).toEqual({ R12: 2, R7: 2 });
    expect(report.byAction).toEqual({ enroll_gap_sequence: 2, call_now: 2 });
    const callRows = store.routingDecision.create.mock.calls.map((c) => c[0].data).filter((d) => d.action === 'call_now');
    expect(callRows.map((d) => (d.inputs_snapshot as Record<string, unknown>).target)).toEqual([null, null]);
  });

  it('dryRun counts everything and creates nothing, including the SystemConfig pointer', async () => {
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const report = await runRouting(store, { now: NOW, runId: 'run-D', actor: 'test', dryRun: true }, { suppression, assemble: assembler(twoByTwo()), route, audit: vi.fn() });
    expect(report).toMatchObject({ dryRun: true, pairs: 4, decisions: 4, byRule: { R12: 4 } });
    expect(store.routingDecision.create).not.toHaveBeenCalled();
    expect(store.systemConfig.upsert).not.toHaveBeenCalled();
    expect(store.persona.findMany).not.toHaveBeenCalled();
  });

  it('maxPairs caps the pairs routed, mid-account', async () => {
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const report = await runRouting(store, { now: NOW, runId: 'run-C', actor: 'test', maxPairs: 3 }, { suppression, assemble: assembler(twoByTwo()), route, audit: vi.fn() });
    expect(report.pairs).toBe(3);
    expect(report.decisions).toBe(3);
    expect(route).toHaveBeenCalledTimes(3);
    expect(store.routingDecision.create).toHaveBeenCalledTimes(3);
    expect(store.account.findMany.mock.calls[0][0]).toMatchObject({ take: 3 });
  });

  it('default selection drops TAM-out accounts per the snapshot provider; an explicit name goes to the rules', async () => {
    const assemble = assembler(twoByTwo());
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const hubspotSnapshot = vi.fn(async (name: string) => (name === 'Acme Foods' ? { tam: 'out' as const, tamTier: '' as const } : null));

    const byDefault = await runRouting(store, { now: NOW, runId: 'run-O', actor: 'test' }, { suppression, assemble, route, audit: vi.fn(), hubspotSnapshot });
    expect(byDefault.skips).toEqual({ tam_out: 1 });
    expect(byDefault.accountsScanned).toBe(2);
    expect(byDefault.pairs).toBe(2);
    expect(assemble.mock.calls.map((c) => c[1].accountName)).toEqual(['Beta Dairy']);
    expect(hubspotSnapshot).toHaveBeenCalledWith('Acme Foods', '111');
    expect(assemble.mock.calls[0][1].hubspotSnapshot).toBeNull();

    assemble.mockClear();
    store.account.findMany.mockResolvedValue([{ name: 'Acme Foods', hubspot_company_id: '111' }]);
    const explicit = await runRouting(store, { now: NOW, runId: 'run-E', actor: 'test', accountNames: ['Acme Foods'] }, { suppression, assemble, route, audit: vi.fn(), hubspotSnapshot });
    expect(explicit.skips).toEqual({});
    expect(assemble.mock.calls.map((c) => c[1].accountName)).toEqual(['Acme Foods']);
    expect(assemble.mock.calls[0][1].hubspotSnapshot).toEqual({ tam: 'out', tamTier: '' });
    expect(store.account.findMany).toHaveBeenLastCalledWith({ where: { name: { in: ['Acme Foods'] } }, select: { name: true, hubspot_company_id: true } });
  });

  it('a throwing snapshot provider degrades to a null snapshot, not a failed run', async () => {
    const assemble = assembler(twoByTwo());
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const hubspotSnapshot = vi.fn(async () => {
      throw new Error('hubspot down');
    });
    const report = await runRouting(store, { now: NOW, runId: 'run-X', actor: 'test' }, { suppression, assemble, route, audit: vi.fn(), hubspotSnapshot });
    expect(report.pairs).toBe(4);
    expect(assemble.mock.calls.every((c) => c[1].hubspotSnapshot === null)).toBe(true);
  });

  it('preferredSender comes off the Top100 manifest when the account is known there', async () => {
    const route = vi.fn((inputs: RoutingInputs) => decisionFor(inputs));
    const manifest = {
      runId: 'm', portal: 'p', selectedKeys: [], reserveKeys: [], reserve: [], senders: {}, warnings: [],
      accounts: {
        acme: { key: 'acme', name: 'Acme Foods', domain: null, hubspotCompanyId: '111', tier: null, segment: null, rank: null, score: null, preferredSender: 'jake@yardflow.ai', selected: true, sequence: null, branches: {} },
      },
    };
    await runRouting(store, { now: NOW, runId: 'run-P', actor: 'test' }, { suppression, assemble: assembler(twoByTwo()), route, audit: vi.fn(), top100: { manifest, rosterByKey: {} } });
    const senders = store.routingDecision.create.mock.calls.map((c) => [c[0].data.account_name, (c[0].data.inputs_snapshot as Record<string, unknown>).preferredSender]);
    expect(senders).toEqual([
      ['Acme Foods', 'jake@yardflow.ai'],
      ['Acme Foods', 'jake@yardflow.ai'],
      ['Beta Dairy', null],
      ['Beta Dairy', null],
    ]);
  });

  it('defaults runId to run-<now ISO>', async () => {
    store.account.findMany.mockResolvedValue([]);
    const report = await runRouting(store, { now: NOW, actor: 'test' }, { suppression, assemble: assembler({}), route: vi.fn(), audit: vi.fn() });
    expect(report.runId).toBe('run-2026-09-23T12:00:00.000Z');
    expect(report.accountsScanned).toBe(0);
  });

  it('snapshotFromProperties maps the six company fields and the per-contact verdict and intent source', () => {
    expect(snapshotFromProperties(null)).toBeNull();
    expect(snapshotFromProperties(null, [])).toBeNull();
    expect(snapshotFromProperties({ yardflow_tam: 'in' })).toEqual({
      tam: 'in', tamTier: '', intentScore: null, lastIntentAt: null, triggerScore: null, lastTriggerAt: null,
    });
    expect(snapshotFromProperties({ yardflow_tam: 'OUT', tam_tier: 'b', intent_score: '42', last_intent_at: '2026-09-20T10:00:00Z', trigger_score: '7', last_trigger_at: '1758400000000' })).toEqual({
      tam: 'out', tamTier: 'B', intentScore: 42, lastIntentAt: new Date('2026-09-20T10:00:00Z'), triggerScore: 7, lastTriggerAt: new Date(1758400000000),
    });
    expect(snapshotFromProperties({ yardflow_tam: '', tam_tier: 'Z', intent_score: 'abc', last_intent_at: 'not a date' })).toMatchObject({ tam: 'unknown', tamTier: '', intentScore: null, lastIntentAt: null });
    expect(tamFromProperty('maybe')).toBe('unknown');

    const withContacts = snapshotFromProperties(null, [
      { id: '9', properties: { yardflow_qual_verdict: 'sql', last_intent_source: 'reply' } },
      { id: '10', properties: { yardflow_qual_verdict: '', last_intent_source: null } },
      { id: '', properties: { yardflow_qual_verdict: 'sql' } },
    ]);
    expect(withContacts).toMatchObject({ tam: 'unknown' });
    expect(withContacts?.contacts).toEqual({
      '9': { qualVerdict: 'sql', lastIntentSource: 'reply' },
      '10': { qualVerdict: null, lastIntentSource: null },
    });
  });

  describe('createHubSpotSnapshotProvider', () => {
    function fakeReads(companyProps: Record<string, string | null> | null = { yardflow_tam: 'in', tam_tier: 'A' }) {
      return {
        readCompany: vi.fn(async (_id: string, _props: readonly string[]) => (companyProps ? { properties: companyProps } : null)),
        readContacts: vi.fn(async (ids: string[], _props: readonly string[]) =>
          ids.map((id) => ({ id, properties: { yardflow_qual_verdict: id === '9' ? 'sql' : 'none', last_intent_source: id === '9' ? 'reply' : null } })),
        ),
      };
    }

    it('unconfigured HubSpot -> null for every account, no reads at all', async () => {
      const reads = fakeReads();
      const provider = createHubSpotSnapshotProvider(store, reads, { configured: () => false });
      await expect(provider('Acme Foods', '111')).resolves.toBeNull();
      expect(reads.readCompany).not.toHaveBeenCalled();
      expect(reads.readContacts).not.toHaveBeenCalled();
      expect(store.persona.findMany).not.toHaveBeenCalled();
    });

    it('reads the company with the six properties and the contact-ready personas with the two contact properties', async () => {
      const reads = fakeReads();
      store.persona.findMany.mockResolvedValue([{ hubspot_contact_id: '9' }, { hubspot_contact_id: '10' }, { hubspot_contact_id: '9' }, { hubspot_contact_id: null }]);
      const provider = createHubSpotSnapshotProvider(store, reads);
      const snap = await provider('Acme Foods', '111');
      expect(reads.readCompany).toHaveBeenCalledWith('111', SNAPSHOT_COMPANY_PROPERTIES);
      expect(SNAPSHOT_COMPANY_PROPERTIES).toEqual(['yardflow_tam', 'tam_tier', 'intent_score', 'last_intent_at', 'trigger_score', 'last_trigger_at']);
      expect(store.persona.findMany).toHaveBeenCalledWith({
        where: { account_name: 'Acme Foods', is_contact_ready: true, hubspot_contact_id: { not: null } },
        select: { hubspot_contact_id: true },
      });
      expect(reads.readContacts).toHaveBeenCalledTimes(1);
      expect(reads.readContacts).toHaveBeenCalledWith(['9', '10'], SNAPSHOT_CONTACT_PROPERTIES);
      expect(SNAPSHOT_CONTACT_PROPERTIES).toEqual(['yardflow_qual_verdict', 'last_intent_source']);
      expect(snap).toEqual({
        tam: 'in', tamTier: 'A', intentScore: null, lastIntentAt: null, triggerScore: null, lastTriggerAt: null,
        contacts: { '9': { qualVerdict: 'sql', lastIntentSource: 'reply' }, '10': { qualVerdict: 'none', lastIntentSource: null } },
      });
    });

    it('no company id -> no company read, contacts still carried with tam unknown', async () => {
      const reads = fakeReads();
      store.persona.findMany.mockResolvedValue([{ hubspot_contact_id: '9' }]);
      const provider = createHubSpotSnapshotProvider(store, reads);
      const snap = await provider('Beta Dairy', null);
      expect(reads.readCompany).not.toHaveBeenCalled();
      expect(snap).toMatchObject({ tam: 'unknown', contacts: { '9': { qualVerdict: 'sql', lastIntentSource: 'reply' } } });
    });

    it('no company id and no contacts -> null; no contact ids -> no batch call', async () => {
      const reads = fakeReads();
      store.persona.findMany.mockResolvedValue([]);
      const provider = createHubSpotSnapshotProvider(store, reads);
      await expect(provider('Beta Dairy', null)).resolves.toBeNull();
      expect(reads.readContacts).not.toHaveBeenCalled();
      await expect(provider('Acme Foods', '111')).resolves.toMatchObject({ tam: 'in' });
      expect(reads.readContacts).not.toHaveBeenCalled();
    });

    it('batches contact reads at 100 ids', async () => {
      const reads = fakeReads();
      const ids = Array.from({ length: 250 }, (_, i) => ({ hubspot_contact_id: String(1000 + i) }));
      store.persona.findMany.mockResolvedValue(ids);
      const snap = await createHubSpotSnapshotProvider(store, reads)('Acme Foods', '111');
      expect(CONTACT_BATCH_SIZE).toBe(100);
      expect(reads.readContacts.mock.calls.map((c) => c[0].length)).toEqual([100, 100, 50]);
      expect(Object.keys(snap?.contacts ?? {})).toHaveLength(250);
    });

    it('a failed company read or a failed batch degrades that part to unknown, never the run', async () => {
      const reads = fakeReads();
      reads.readCompany.mockRejectedValue(new Error('429 forever'));
      reads.readContacts.mockRejectedValueOnce(new Error('batch down'));
      const ids = Array.from({ length: 120 }, (_, i) => ({ hubspot_contact_id: String(i + 1) }));
      store.persona.findMany.mockResolvedValue(ids);
      const snap = await createHubSpotSnapshotProvider(store, reads)('Acme Foods', '111');
      expect(snap?.tam).toBe('unknown');
      expect(Object.keys(snap?.contacts ?? {})).toHaveLength(20);
      store.persona.findMany.mockRejectedValue(new Error('db down'));
      await expect(createHubSpotSnapshotProvider(store, reads)('Acme Foods', '111')).resolves.toBeNull();
    });
  });

  it('structural: run.ts never writes any mode but shadow', () => {
    const src = readFileSync(path.join(process.cwd(), 'src', 'lib', 'gap', 'routing', 'run.ts'), 'utf8');
    expect(SHADOW_MODE).toBe('shadow');
    expect(src).toMatch(/mode:\s*SHADOW_MODE/);
    expect(src).not.toMatch(/['"`]live['"`]/);
    expect(src).not.toMatch(/mode\s*[:=]\s*['"`]/);
  });
});

// ---------------------------------------------------------------------------
// listQueue
// ---------------------------------------------------------------------------

describe('listQueue', () => {
  let store: Store;

  beforeEach(() => {
    store = makeStore();
  });

  it('empty table -> runId null, no items, no cursor', async () => {
    await expect(listQueue(store)).resolves.toEqual({ runId: null, items: [], nextCursor: null });
  });

  it('orders by priority desc then id desc, regardless of insertion time', async () => {
    // Insertion (= created_at) order deliberately disagrees with priority order.
    for (const priority of [70, 90, 80, 90, 70]) await seed(store, { priority });
    const { items } = await listQueue(store, { runId: 'run-A' });
    expect(items.map((i) => i.priority)).toEqual([90, 90, 80, 70, 70]);
    for (let i = 1; i < items.length; i += 1) {
      const prev = items[i - 1];
      const cur = items[i];
      expect(prev.priority >= cur.priority).toBe(true);
      if (prev.priority === cur.priority) expect(prev.id > cur.id).toBe(true);
    }
    expect(items.map((i) => i.id)).toEqual(['d04', 'd02', 'd03', 'd05', 'd01']);
  });

  it('cursor pages are stable: no overlap, no gap, base64 of priority:id', async () => {
    for (const priority of [70, 90, 80, 90, 70]) await seed(store, { priority });
    const all = (await listQueue(store, { runId: 'run-A', limit: 100 })).items.map((i) => i.id);

    const p1 = await listQueue(store, { runId: 'run-A', limit: 2 });
    expect(p1.items.map((i) => i.id)).toEqual(['d04', 'd02']);
    expect(p1.nextCursor).toBe(encodeCursor(90, 'd02'));
    expect(decodeCursor(p1.nextCursor as string)).toEqual({ priority: 90, id: 'd02' });
    expect(Buffer.from(p1.nextCursor as string, 'base64').toString('utf8')).toBe('90:d02');

    const p2 = await listQueue(store, { runId: 'run-A', limit: 2, cursor: p1.nextCursor as string });
    expect(p2.items.map((i) => i.id)).toEqual(['d03', 'd05']);
    expect(p2.nextCursor).not.toBeNull();

    // A row landing between pages at a higher priority must not disturb page 3.
    await seed(store, { priority: 95 });

    const p3 = await listQueue(store, { runId: 'run-A', limit: 2, cursor: p2.nextCursor as string });
    expect(p3.items.map((i) => i.id)).toEqual(['d01']);
    expect(p3.nextCursor).toBeNull();

    expect([...p1.items, ...p2.items, ...p3.items].map((i) => i.id)).toEqual(all);
  });

  it('filters by action, lane and ruleId', async () => {
    await seed(store, { priority: 50, action: 'call_now', lane: 'work_queue', rule_id: 'R7' });
    await seed(store, { priority: 40, action: 'do_not_contact', lane: 'blocked', rule_id: 'R0' });
    await seed(store, { priority: 30, action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'R12' });

    expect((await listQueue(store, { runId: 'run-A', action: 'call_now' })).items.map((i) => i.id)).toEqual(['d01']);
    const blocked = (await listQueue(store, { runId: 'run-A', lane: 'blocked' })).items;
    expect(blocked.map((i) => i.id)).toEqual(['d02']);
    expect(blocked[0].blocked).toBe(true);
    expect((await listQueue(store, { runId: 'run-A', ruleId: 'R12' })).items.map((i) => i.id)).toEqual(['d03']);
    expect((await listQueue(store, { runId: 'run-A', action: 'call_now', lane: 'blocked' })).items).toEqual([]);
  });

  it('defaults to the latest run by created_at and scopes items to it', async () => {
    await seed(store, { priority: 99, run_id: 'run-A' });
    await seed(store, { priority: 10, run_id: 'run-B' });
    await seed(store, { priority: 20, run_id: 'run-B' });
    const result = await listQueue(store);
    expect(result.runId).toBe('run-B');
    expect(result.items.map((i) => [i.id, i.priority])).toEqual([
      ['d03', 20],
      ['d02', 10],
    ]);
    expect(store.routingDecision.findFirst).toHaveBeenCalledWith({ orderBy: { created_at: 'desc' }, select: { run_id: true } });
  });

  it('clamps limit to 1..100 and projects the item shape off the row and snapshot', async () => {
    await seed(store, { priority: 5, hypothesis_id: 'hyp-9', inputs_snapshot: {
      account: { name: 'Acme Foods', hubspotCompanyId: '111', tam: 'in', tamTier: 'A', heatTier: 2 },
      persona: { id: 1, personaKey: 'site_ops', email: 'a@acme.example', hubspotContactId: '9' },
      hypothesis: { id: 'hyp-9', status: 'approved', family: 'hidden_capacity', confidence: 70 },
      target: 'modex_queue',
      displayName: 'Ann Acme',
    } });
    const { items } = await listQueue(store, { runId: 'run-A', limit: 500 });
    expect(store.routingDecision.findMany.mock.calls[0][0].take).toBe(101);
    expect(items[0]).toEqual({
      id: 'd01',
      action: 'enroll_gap_sequence',
      lane: 'work_queue',
      ruleId: 'R12',
      priority: 5,
      blocked: false,
      target: 'modex_queue',
      explain: { whyAccount: 'x' },
      account: { name: 'Acme Foods', hubspotCompanyId: '111', tam: 'in', tamTier: 'A', heatTier: 2 },
      persona: { id: 1, personaKey: 'site_ops', displayName: 'Ann Acme', email: 'a@acme.example', hubspotContactId: '9' },
      hypothesis: { id: 'hyp-9', status: 'approved', family: 'hidden_capacity', confidence: 70 },
      humanAction: null,
      humanActionAt: null,
      createdAt: expect.any(Date),
    });
    await listQueue(store, { runId: 'run-A', limit: 0 });
    expect(store.routingDecision.findMany.mock.calls[1][0].take).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// recordHumanAction
// ---------------------------------------------------------------------------

describe('recordHumanAction', () => {
  let store: Store;
  const audit = vi.fn(async (_prisma: unknown, _input: AuditInput) => ({ stored: true, reviewQueued: false }));

  beforeEach(() => {
    store = makeStore();
    audit.mockClear();
  });

  it('first call stamps action, actor, time and audits; second call is already_acted', async () => {
    const id = await seed(store, { priority: 1 });
    const at = new Date('2026-09-23T13:00:00.000Z');
    await expect(recordHumanAction(store, id, 'enrolled_by_hand', 'casey@freightroll.com', { audit, now: () => at })).resolves.toEqual({ ok: true });
    expect(store.rows[0]).toMatchObject({ human_action: 'enrolled_by_hand', human_actor: 'casey@freightroll.com', human_action_at: at });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(audit.mock.calls[0][1]).toEqual({
      kind: 'decision.human_action',
      actor: 'casey@freightroll.com',
      subjectType: 'routing_decision',
      subjectId: id,
      payload: { action: 'enrolled_by_hand', at: at.toISOString() },
    });

    await expect(recordHumanAction(store, id, 'dismissed', 'jake@freightroll.com', { audit })).resolves.toEqual({ ok: false, reason: 'already_acted' });
    expect(store.rows[0]).toMatchObject({ human_action: 'enrolled_by_hand', human_actor: 'casey@freightroll.com' });
    expect(audit).toHaveBeenCalledTimes(1);
  });

  it('unknown id -> not_found, no audit', async () => {
    await expect(recordHumanAction(store, 'nope', 'dismissed', 'casey@freightroll.com', { audit })).resolves.toEqual({ ok: false, reason: 'not_found' });
    expect(audit).not.toHaveBeenCalled();
  });

  it('the write is conditional on human_action being null', async () => {
    const id = await seed(store, { priority: 1 });
    await recordHumanAction(store, id, 'called', 'casey@freightroll.com', { audit });
    expect(store.routingDecision.updateMany.mock.calls[0][0].where).toEqual({ id, human_action: null });
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

describe('routes', () => {
  const ENV_KEYS = ['GAP_OS_ENABLED', 'GAP_ROUTING_ENABLED', 'CRON_SECRET', 'QUEUE_AGENT_SECRET', 'CLAWD_CONTROL_PLANE_URL', 'CLAWD_CONTROL_PLANE_TOKEN'] as const;
  let savedEnv: Record<string, string | undefined>;
  let store: Store;
  const savedFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.GAP_OS_ENABLED = '1';
    process.env.GAP_ROUTING_ENABLED = '1';
    delete process.env.CRON_SECRET;
    delete process.env.QUEUE_AGENT_SECRET;
    delete process.env.CLAWD_CONTROL_PLANE_URL;
    delete process.env.CLAWD_CONTROL_PLANE_TOKEN;
    mockedAuth.mockResolvedValue(SESSION);
    mockedIsHubSpotConfigured.mockReturnValue(false);
    mockedGetHubSpotClient.mockReset();
    store = makeStore();
    installStore(store);
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network is off in this test');
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
    globalThis.fetch = savedFetch;
  });

  const RUN = 'http://localhost/api/gap/routing/run';
  const QUEUE = 'http://localhost/api/gap/queue';
  const ACT = (id: string) => `http://localhost/api/gap/decisions/${id}/act`;

  function post(url: string, body?: unknown, headers: Record<string, string> = {}) {
    return new NextRequest(url, {
      method: 'POST',
      ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  function idParams(id: string) {
    return { params: Promise.resolve({ id }) };
  }

  describe('flag gate', () => {
    it('run: GAP_ROUTING_ENABLED off -> 404 skip payload, nothing read', async () => {
      delete process.env.GAP_ROUTING_ENABLED;
      const res = await runPOST(post(RUN, {}));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_ENABLED=false' });
      expect(mockedAuth).not.toHaveBeenCalled();
      expect(store.account.findMany).not.toHaveBeenCalled();
    });

    it('queue: GAP_OS_ENABLED off -> 404 naming the master flag', async () => {
      process.env.GAP_OS_ENABLED = 'false';
      const res = await queueGET(new NextRequest(QUEUE));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_OS_ENABLED=false' });
      expect(store.routingDecision.findFirst).not.toHaveBeenCalled();
    });

    it('act: flag off -> 404 skip payload, row untouched', async () => {
      delete process.env.GAP_ROUTING_ENABLED;
      const res = await actPOST(post(ACT('d01'), { action: 'dismissed' }), idParams('d01'));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_ENABLED=false' });
      expect(store.routingDecision.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('auth', () => {
    it('run: no session, no token -> 401', async () => {
      mockedAuth.mockResolvedValue(null);
      const res = await runPOST(post(RUN, {}));
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: 'unauthenticated' });
      expect(store.account.findMany).not.toHaveBeenCalled();
    });

    it('run: x-gap-token = CRON_SECRET is accepted without a session', async () => {
      mockedAuth.mockResolvedValue(null);
      process.env.CRON_SECRET = 'cron-secret';
      const res = await runPOST(post(RUN, {}, { 'x-gap-token': 'cron-secret' }));
      expect(res.status).toBe(200);
      expect(await res.json()).toMatchObject({ mode: 'shadow', dryRun: true });
    });

    it('queue: cron token is not a session -> 401', async () => {
      mockedAuth.mockResolvedValue(null);
      process.env.CRON_SECRET = 'cron-secret';
      const res = await queueGET(new NextRequest(QUEUE, { headers: { authorization: 'Bearer cron-secret' } }));
      expect(res.status).toBe(401);
    });

    it('act: no session -> 401', async () => {
      mockedAuth.mockResolvedValue(null);
      const res = await actPOST(post(ACT('d01'), { action: 'dismissed' }), idParams('d01'));
      expect(res.status).toBe(401);
      expect(store.routingDecision.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/gap/routing/run', () => {
    it('manual session call defaults to dryRun: no rows, no SystemConfig pointer', async () => {
      const res = await runPOST(post(RUN, {}));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ mode: 'shadow', dryRun: true, accountsScanned: 0, pairs: 0, decisions: 0 });
      expect(body.runId).toMatch(/^run-\d{4}-\d{2}-\d{2}T/);
      expect(store.systemConfig.upsert).not.toHaveBeenCalled();
      expect(store.routingDecision.create).not.toHaveBeenCalled();
      expect(mockedGetHubSpotClient).not.toHaveBeenCalled();
    });

    it('?mode=apply writes the run pointer; ?dryRun=1 wins over apply', async () => {
      const applied = await runPOST(post(`${RUN}?mode=apply`, {}));
      expect(applied.status).toBe(200);
      expect((await applied.json()).dryRun).toBe(false);
      expect(store.systemConfig.upsert).toHaveBeenCalledTimes(1);
      expect(store.systemConfig.upsert.mock.calls[0][0]).toMatchObject({ where: { key: LAST_RUN_CONFIG_KEY } });

      const forced = await runPOST(post(`${RUN}?mode=apply&dryRun=1`, {}));
      expect((await forced.json()).dryRun).toBe(true);
      expect(store.systemConfig.upsert).toHaveBeenCalledTimes(1);
    });

    it('body accountNames and maxPairs reach the run; an empty body is fine', async () => {
      const noBody = await runPOST(new NextRequest(RUN, { method: 'POST' }));
      expect(noBody.status).toBe(200);

      const res = await runPOST(post(RUN, { accountNames: ['Acme Foods'], maxPairs: 7 }));
      expect(res.status).toBe(200);
      expect(store.account.findMany).toHaveBeenLastCalledWith({ where: { name: { in: ['Acme Foods'] } }, select: { name: true, hubspot_company_id: true } });
    });

    it('with HubSpot configured and one account, the route reads the company and contacts through the SDK and never writes', async () => {
      mockedIsHubSpotConfigured.mockReturnValue(true);
      const getById = vi.fn(async () => ({ id: '111', properties: { yardflow_tam: 'in', tam_tier: 'A', intent_score: '5' } }));
      const batchRead = vi.fn(async () => ({ results: [{ id: '9', properties: { yardflow_qual_verdict: 'sql', last_intent_source: 'reply' } }] }));
      const client = { crm: { companies: { basicApi: { getById, update: vi.fn() } }, contacts: { batchApi: { read: batchRead, update: vi.fn() } } } };
      mockedGetHubSpotClient.mockReturnValue(client);
      store.account.findMany.mockResolvedValue([{ name: 'Acme Foods', hubspot_company_id: '111' }]);
      store.persona.findMany.mockResolvedValue([{ hubspot_contact_id: '9' }]);

      const res = await runPOST(post(RUN, { accountNames: ['Acme Foods'] }));
      expect(res.status).toBe(200);
      expect(getById).toHaveBeenCalledWith('111', ['yardflow_tam', 'tam_tier', 'intent_score', 'last_intent_at', 'trigger_score', 'last_trigger_at']);
      expect(batchRead).toHaveBeenCalledWith({ inputs: [{ id: '9' }], properties: ['yardflow_qual_verdict', 'last_intent_source'], propertiesWithHistory: [] });
      expect(client.crm.companies.basicApi.update).not.toHaveBeenCalled();
      expect(client.crm.contacts.batchApi.update).not.toHaveBeenCalled();
      // The real assembler then reads the Account row through the fake and reports it missing; the snapshot reads happened first.
      expect((await res.json()).skips).toEqual({ account_not_found: 1 });
    });

    it('bad body -> 400 naming the field', async () => {
      const res = await runPOST(post(RUN, { maxPairs: 0 }));
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: 'invalid_body', field: 'maxPairs' });
      const notJson = await runPOST(post(RUN, '{nope'));
      expect(notJson.status).toBe(400);
      expect(store.account.findMany).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/gap/queue', () => {
    it('bad limit -> 400 invalid_query field limit', async () => {
      for (const limit of ['0', '101', 'abc']) {
        const res = await queueGET(new NextRequest(`${QUEUE}?limit=${limit}`));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'invalid_query', field: 'limit' });
      }
      expect(store.routingDecision.findMany).not.toHaveBeenCalled();
    });

    it('unknown action or lane -> 400', async () => {
      const a = await queueGET(new NextRequest(`${QUEUE}?action=send_everything`));
      expect(await a.json()).toEqual({ error: 'invalid_query', field: 'action' });
      const l = await queueGET(new NextRequest(`${QUEUE}?lane=fast`));
      expect(await l.json()).toEqual({ error: 'invalid_query', field: 'lane' });
    });

    it('happy path pages the latest run and honors rule=', async () => {
      await seed(store, { priority: 30, rule_id: 'R7' });
      await seed(store, { priority: 60, rule_id: 'R12' });
      await seed(store, { priority: 50, rule_id: 'R12' });
      const res = await queueGET(new NextRequest(`${QUEUE}?limit=1&rule=R12`));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.runId).toBe('run-A');
      expect(body.items.map((i: { id: string }) => i.id)).toEqual(['d02']);
      expect(body.nextCursor).toBe(encodeCursor(60, 'd02'));
      const next = await queueGET(new NextRequest(`${QUEUE}?limit=1&rule=R12&cursor=${encodeURIComponent(body.nextCursor)}`));
      const page2 = await next.json();
      expect(page2.items.map((i: { id: string }) => i.id)).toEqual(['d03']);
      expect(page2.nextCursor).toBeNull();
    });
  });

  describe('POST /api/gap/decisions/[id]/act', () => {
    it('200 once, 409 already_acted after', async () => {
      const id = await seed(store, { priority: 1 });
      const first = await actPOST(post(ACT(id), { action: 'enrolled_by_hand' }), idParams(id));
      expect(first.status).toBe(200);
      expect(await first.json()).toEqual({ ok: true });
      expect(store.rows[0]).toMatchObject({ human_action: 'enrolled_by_hand', human_actor: 'casey@freightroll.com' });

      const second = await actPOST(post(ACT(id), { action: 'dismissed' }), idParams(id));
      expect(second.status).toBe(409);
      expect(await second.json()).toEqual({ error: 'already_acted' });
    });

    it('unknown id -> 404 not_found', async () => {
      const res = await actPOST(post(ACT('ghost'), { action: 'dismissed' }), idParams('ghost'));
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: 'not_found' });
    });

    it('missing or blank action -> 400 invalid_body', async () => {
      const id = await seed(store, { priority: 1 });
      const blank = await actPOST(post(ACT(id), { action: '   ' }), idParams(id));
      expect(blank.status).toBe(400);
      expect(await blank.json()).toEqual({ error: 'invalid_body', field: 'action' });
      const notJson = await actPOST(post(ACT(id), '{'), idParams(id));
      expect(await notJson.json()).toEqual({ error: 'invalid_body', field: 'body' });
      expect(store.routingDecision.updateMany).not.toHaveBeenCalled();
    });
  });
});
