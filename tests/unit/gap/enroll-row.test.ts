/**
 * Enroll-row emitter (GAP Prospecting OS, Sprint 2, S2-T8).
 *
 * Pins: the exact markdown of the lane's enroll table
 * (yardflow-hubspot/top100/scripts/enroll-table.mjs), the JSON shape, that a
 * contact carrying a Top100 sequence_block lands under Skip with the block
 * reason, that non-enroll decisions are ignored, and the HTTP contract of
 * GET /api/gap/queue/enroll-rows (gate, session, empty run). Nothing here
 * enrolls anything, and no network call is made.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  buildEnrollRows,
  loadDecisions,
  renderEnrollTableJson,
  renderEnrollTableMarkdown,
  ENROLL_TABLE_HEADER,
  ENROLL_TABLE_DIVIDER,
} from '@/lib/gap/routing/enroll-row';
import type { EnrollRowItem } from '@/lib/gap/routing/enroll-row';
import type { RoutingAccountInput, RoutingDecision, RoutingPersonaInput, RoutingTop100Input } from '@/lib/gap/routing/types';

const mockedAuth = vi.fn();
const mockedFindFirst = vi.fn();
const mockedFindMany = vi.fn();
const mockedConfigFind = vi.fn();
const fakePrisma = {
  routingDecision: { findFirst: mockedFindFirst, findMany: mockedFindMany },
  systemConfig: { findUnique: mockedConfigFind },
};

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));

const { GET } = await import('@/app/api/gap/queue/enroll-rows/route');

const BASE = 'http://localhost/api/gap/queue/enroll-rows';
const SESSION = { user: { email: 'casey@freightroll.com' } };
const ENV_KEYS = ['GAP_OS_ENABLED', 'GAP_ROUTING_ENABLED'] as const;
let savedEnv: Record<string, string | undefined>;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function account(name: string, hubspotCompanyId = '111'): RoutingAccountInput {
  return {
    name,
    slug: null,
    hubspotCompanyId,
    tam: 'in',
    tamTier: 'A',
    heatTier: 2,
    heat: 70,
    intentScore: null,
    lastIntentAt: null,
    triggerScore: null,
    lastTriggerAt: null,
    outreachStatus: null,
    pipelineStage: null,
  };
}

function persona(id: number, email: string | null, top100: RoutingTop100Input | null | undefined): RoutingPersonaInput {
  return {
    id,
    personaKey: 'site_ops',
    roleGatePassed: true,
    seniorityRank: 3,
    email,
    emailValid: true,
    emailStatus: null,
    phone: null,
    phoneStatus: null,
    linkedinUrl: null,
    hubspotContactId: `c${id}`,
    qualVerdict: null,
    lastIntentSource: null,
    doNotContact: false,
    ...(top100 === undefined ? {} : { top100 }),
  };
}

function decision(action: RoutingDecision['action'], target?: RoutingDecision['target']): RoutingDecision {
  return {
    action,
    lane: 'work_queue',
    ruleId: action === 'enroll_gap_sequence' ? 'enroll' : 'default',
    priority: 88,
    blocked: false,
    ...(target ? { target, reason: `enroll:${target}` } : {}),
    explain: {
      whyAccount: 'a',
      whyPerson: 'p',
      whyProblem: 'pr',
      whyNow: 'n',
      whyAction: 'act',
      evidenceIds: [],
      signalIds: [],
      wouldProveWrong: 'w',
    },
  };
}

const NATIVE_SEQ: RoutingTop100Input = {
  eligibility: 'ELIGIBLE',
  sequenceBlock: null,
  hubspotSequenceId: '4457001',
  sequenceName: 'YF | Boston Beer | Hidden Capacity',
};

const BLOCKED_SEQ: RoutingTop100Input = {
  eligibility: 'ELIGIBLE',
  sequenceBlock: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE',
  hubspotSequenceId: '4457001',
  sequenceName: 'YF | Boston Beer | Hidden Capacity',
};

const NOT_BUILT: RoutingTop100Input = {
  eligibility: 'ELIGIBLE',
  sequenceBlock: null,
  hubspotSequenceId: null,
  sequenceName: null,
};

/** Two accounts: Boston Beer (one native, one blocked) and Ocean Spray (build_required). */
function twoAccountFixture(): EnrollRowItem[] {
  return [
    {
      decision: decision('enroll_gap_sequence', 'hubspot_native'),
      inputs: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ) },
      displayName: 'Ada Lovelace',
      preferredSender: 'casey@yardflow.ai',
      whatIKnow: 'Two new DCs opened in Q2 per the 10-K.',
    },
    {
      decision: decision('enroll_gap_sequence', 'build_required'),
      inputs: { account: account('Boston Beer Company'), persona: persona(2, 'bob@bostonbeer.com', BLOCKED_SEQ) },
      displayName: 'Bob Byrne',
      preferredSender: 'casey@yardflow.ai',
    },
    {
      decision: decision('enroll_gap_sequence', 'build_required'),
      inputs: { account: account('Ocean Spray', '222'), persona: persona(3, 'cy@oceanspray.com', NOT_BUILT) },
      displayName: 'Cy Chen',
    },
  ];
}

const EXPECTED_MD = [
  '| Account | Sequence (HubSpot id) | Send from | Enroll these contacts | Skip (reason) |',
  '|---|---|---|---|---|',
  // The lane's real sequence names all carry pipes ("YF | Top100 | <account>"); the
  // lane script prints them raw, which splits the row. Escaping keeps five cells.
  '| Boston Beer Company | YF \\| Boston Beer \\| Hidden Capacity (4457001) | casey@yardflow.ai | Ada Lovelace <ada@bostonbeer.com><br>what I know: Two new DCs opened in Q2 per the 10-K. | Bob Byrne (HUBSPOT_CROSS_ACCOUNT_BOUNCE) |',
  '| Ocean Spray | NOT BUILT | unknown (choose at enroll time) | none | Cy Chen (build_required (no rig-built sequence for this account)) |',
].join('\n');

// ---------------------------------------------------------------------------
// buildEnrollRows + markdown
// ---------------------------------------------------------------------------

describe('buildEnrollRows', () => {
  it('renders the exact lane table for the two-account fixture', () => {
    const table = buildEnrollRows(twoAccountFixture());
    expect(renderEnrollTableMarkdown(table)).toBe(EXPECTED_MD);
  });

  it('a contact with a Top100 sequence_block lands under Skip with the block reason, never under Enroll', () => {
    const table = buildEnrollRows(twoAccountFixture());
    const boston = table.rows.find((r) => r.account === 'Boston Beer Company')!;
    expect(boston.contacts.map((c) => c.email)).toEqual(['ada@bostonbeer.com']);
    expect(boston.skips).toEqual([
      { account: 'Boston Beer Company', personaId: 2, name: 'Bob Byrne', email: 'bob@bostonbeer.com', reason: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE' },
    ]);
    expect(table.skipped.find((s) => s.personaId === 2)?.reason).toBe('HUBSPOT_CROSS_ACCOUNT_BOUNCE');
  });

  it('build_required and modex_queue targets are skips with their fixed reasons', () => {
    const table = buildEnrollRows([
      {
        decision: decision('enroll_gap_sequence', 'build_required'),
        inputs: { account: account('Ocean Spray'), persona: persona(3, 'cy@oceanspray.com', NOT_BUILT) },
      },
      {
        decision: decision('enroll_gap_sequence', 'modex_queue'),
        inputs: { account: account('Ocean Spray'), persona: persona(4, 'di@oceanspray.com', null) },
      },
    ]);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped.map((s) => s.reason)).toEqual([
      'build_required (no rig-built sequence for this account)',
      'modex_queue (no native sequence; secondary lane)',
    ]);
  });

  it('a decision whose action is not enroll_gap_sequence is ignored', () => {
    const table = buildEnrollRows([
      {
        decision: decision('call_now'),
        inputs: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ) },
        displayName: 'Ada Lovelace',
      },
      {
        decision: decision('nurture'),
        inputs: { account: account('Ocean Spray'), persona: persona(3, 'cy@oceanspray.com', NATIVE_SEQ) },
      },
    ]);
    expect(table.rows).toEqual([]);
    expect(table.skipped).toEqual([]);
    expect(renderEnrollTableMarkdown(table)).toBe(`${ENROLL_TABLE_HEADER}\n${ENROLL_TABLE_DIVIDER}`);
  });

  it('falls back to the email as the display name and resolves a missing target from top100', () => {
    const table = buildEnrollRows([
      {
        decision: decision('enroll_gap_sequence'),
        inputs: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ) },
      },
    ]);
    expect(table.rows[0].contacts).toEqual([
      { account: 'Boston Beer Company', personaId: 1, hubspotContactId: 'c1', name: 'ada@bostonbeer.com', email: 'ada@bostonbeer.com', whatIKnow: null },
    ]);
  });

  it('a native target without an email is a skip (no email), mirroring the lane filter', () => {
    const table = buildEnrollRows([
      {
        decision: decision('enroll_gap_sequence', 'hubspot_native'),
        inputs: { account: account('Boston Beer Company'), persona: persona(1, null, NATIVE_SEQ) },
        displayName: 'Ada Lovelace',
      },
    ]);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped[0].reason).toBe('no email');
  });

  it('escapes a pipe inside a name so the table stays a table', () => {
    const table = buildEnrollRows([
      {
        decision: decision('enroll_gap_sequence', 'hubspot_native'),
        inputs: { account: account('Acme | Foods'), persona: persona(1, 'x@acme.com', NATIVE_SEQ) },
        displayName: 'X | Y',
      },
    ]);
    const md = renderEnrollTableMarkdown(table);
    expect(md.split('\n')[2]).toContain('| Acme \\| Foods | ');
    expect(md.split('\n')[2]).toContain('X \\| Y <x@acme.com>');
  });
});

describe('renderEnrollTableJson', () => {
  it('carries the same columns and rows as the markdown, structured', () => {
    const json = renderEnrollTableJson(buildEnrollRows(twoAccountFixture()));
    expect(json.columns).toEqual(['Account', 'Sequence (HubSpot id)', 'Send from', 'Enroll these contacts', 'Skip (reason)']);
    expect(json.rows).toEqual([
      {
        account: 'Boston Beer Company',
        hubspotCompanyId: '111',
        sequence: { hubspotSequenceId: '4457001', name: 'YF | Boston Beer | Hidden Capacity' },
        sendFrom: 'casey@yardflow.ai',
        enroll: [
          { personaId: 1, hubspotContactId: 'c1', name: 'Ada Lovelace', email: 'ada@bostonbeer.com', whatIKnow: 'Two new DCs opened in Q2 per the 10-K.' },
        ],
        skip: [{ personaId: 2, name: 'Bob Byrne', email: 'bob@bostonbeer.com', reason: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE' }],
      },
      {
        account: 'Ocean Spray',
        hubspotCompanyId: '222',
        sequence: null,
        sendFrom: 'unknown (choose at enroll time)',
        enroll: [],
        skip: [{ personaId: 3, name: 'Cy Chen', email: 'cy@oceanspray.com', reason: 'build_required (no rig-built sequence for this account)' }],
      },
    ]);
    expect(json.enrollCount).toBe(1);
    expect(json.skipCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// loadDecisions
// ---------------------------------------------------------------------------

describe('loadDecisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedConfigFind.mockResolvedValue(null);
  });

  it('returns an empty list when no run exists, without querying rows', async () => {
    mockedFindFirst.mockResolvedValue(null);
    const items = await loadDecisions(fakePrisma as never);
    expect(items).toEqual([]);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it('reads the gap_routing_last_run pointer first and never looks at the newest row while it is set (N6)', async () => {
    mockedConfigFind.mockResolvedValue({ value: 'run_completed' });
    mockedFindFirst.mockResolvedValue({ run_id: 'run_partial_newer' });
    mockedFindMany.mockResolvedValue([]);
    await loadDecisions(fakePrisma as never);
    expect(mockedConfigFind).toHaveBeenCalledWith({ where: { key: 'gap_routing_last_run' }, select: { value: true } });
    expect(mockedFindFirst).not.toHaveBeenCalled();
    expect(mockedFindMany.mock.calls[0][0].where).toEqual({ run_id: 'run_completed', action: 'enroll_gap_sequence' });
  });

  it('reads the newest run only when the pointer is missing, and only enroll_gap_sequence rows', async () => {
    mockedFindFirst.mockResolvedValue({ run_id: 'run_9' });
    mockedFindMany.mockResolvedValue([
      {
        id: 'd1',
        run_id: 'run_9',
        action: 'enroll_gap_sequence',
        lane: 'work_queue',
        rule_id: 'enroll',
        priority: 88,
        explain: decision('enroll_gap_sequence').explain,
        inputs_snapshot: {
          account: account('Boston Beer Company'),
          persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ),
          target: 'hubspot_native',
          preferredSender: 'casey@yardflow.ai',
          whatIKnow: 'fact line',
        },
        persona: { name: 'Ada Lovelace' },
      },
      { id: 'd2', run_id: 'run_9', action: 'enroll_gap_sequence', lane: 'work_queue', rule_id: 'enroll', priority: 1, explain: {}, inputs_snapshot: null, persona: null },
    ]);
    const items = await loadDecisions(fakePrisma as never);
    expect(mockedFindFirst).toHaveBeenCalledWith({ orderBy: { created_at: 'desc' }, select: { run_id: true } });
    expect(mockedFindMany.mock.calls[0][0].where).toEqual({ run_id: 'run_9', action: 'enroll_gap_sequence' });
    expect(items).toHaveLength(1);
    expect(items[0].displayName).toBe('Ada Lovelace');
    expect(items[0].preferredSender).toBe('casey@yardflow.ai');
    expect(items[0].whatIKnow).toBe('fact line');
    expect(items[0].decision.target).toBe('hubspot_native');
    expect(items[0].decision.ruleId).toBe('enroll');
  });

  it('uses the given runId without looking up the newest run', async () => {
    mockedFindMany.mockResolvedValue([]);
    await loadDecisions(fakePrisma as never, 'run_3');
    expect(mockedFindFirst).not.toHaveBeenCalled();
    expect(mockedFindMany.mock.calls[0][0].where).toEqual({ run_id: 'run_3', action: 'enroll_gap_sequence' });
  });
});

// ---------------------------------------------------------------------------
// Route: GET /api/gap/queue/enroll-rows
// ---------------------------------------------------------------------------

describe('GET /api/gap/queue/enroll-rows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    savedEnv = {};
    for (const key of ENV_KEYS) savedEnv[key] = process.env[key];
    process.env.GAP_OS_ENABLED = '1';
    process.env.GAP_ROUTING_ENABLED = '1';
    mockedAuth.mockResolvedValue(SESSION);
    mockedFindFirst.mockResolvedValue(null);
    mockedFindMany.mockResolvedValue([]);
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (savedEnv[key] === undefined) delete process.env[key];
      else process.env[key] = savedEnv[key];
    }
  });

  it('flags off -> 404 skip payload naming the flag, no auth and no query', async () => {
    delete process.env.GAP_ROUTING_ENABLED;
    const res = await GET(new NextRequest(BASE));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ skipped: true, reason: 'GAP_ROUTING_ENABLED=false' });
    expect(mockedAuth).not.toHaveBeenCalled();
    expect(mockedFindFirst).not.toHaveBeenCalled();
  });

  it('no session -> 401, no query', async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await GET(new NextRequest(BASE));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
    expect(mockedFindFirst).not.toHaveBeenCalled();
  });

  it('empty decisions -> header only, as text/markdown', async () => {
    const res = await GET(new NextRequest(BASE));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    expect(await res.text()).toBe(`${ENROLL_TABLE_HEADER}\n${ENROLL_TABLE_DIVIDER}`);
  });

  it('format=json -> the structured table for the requested run', async () => {
    mockedFindMany.mockResolvedValue([]);
    const res = await GET(new NextRequest(`${BASE}?runId=run_3&format=json`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      runId: 'run_3',
      columns: ['Account', 'Sequence (HubSpot id)', 'Send from', 'Enroll these contacts', 'Skip (reason)'],
      rows: [],
      enrollCount: 0,
      skipCount: 0,
    });
    expect(mockedFindFirst).not.toHaveBeenCalled();
  });

  it('unknown format -> 400 naming the field', async () => {
    const res = await GET(new NextRequest(`${BASE}?format=csv`));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid_query', field: 'format' });
  });
});
