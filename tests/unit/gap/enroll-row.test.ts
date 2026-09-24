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
  loadCompileGate,
  loadDecisions,
  renderEnrollTableJson,
  renderEnrollTableMarkdown,
  COMPILE_MISSING,
  ENROLL_TABLE_HEADER,
  ENROLL_TABLE_DIVIDER,
} from '@/lib/gap/routing/enroll-row';
import type { EnrollRowItem } from '@/lib/gap/routing/enroll-row';
import type { RoutingAccountInput, RoutingDecision, RoutingPersonaInput, RoutingTop100Input } from '@/lib/gap/routing/types';

const mockedAuth = vi.fn();
const mockedFindFirst = vi.fn();
const mockedFindMany = vi.fn();
const mockedConfigFind = vi.fn();
const mockedCompileFindMany = vi.fn();
const mockedApprovalFindFirst = vi.fn();
const mockedUnsubscribedFind = vi.fn();
const mockedPersonaFind = vi.fn();
const fakePrisma = {
  routingDecision: { findFirst: mockedFindFirst, findMany: mockedFindMany },
  systemConfig: { findUnique: mockedConfigFind },
  gapCompile: { findMany: mockedCompileFindMany },
  sendApprovalRequest: { findFirst: mockedApprovalFindFirst },
  unsubscribedEmail: { findUnique: mockedUnsubscribedFind },
  persona: { findUnique: mockedPersonaFind },
};

vi.mock('@/lib/auth', () => ({ auth: mockedAuth }));
vi.mock('@/lib/prisma', () => ({ prisma: fakePrisma }));

const { GET } = await import('@/app/api/gap/queue/enroll-rows/route');
const { staticSuppressionReader } = await import('@/lib/gap/routing/suppression-read');

/**
 * SHOULD FIX (Opus adversarial review, 2026-09-24): loadSuppressionLeg now
 * runs the full cross-plane checkSuppression, not just the snapshot's
 * doNotContact/emailStatus, so every loadDecisions call here injects a
 * clear reader (this file only proves LOCAL suppression paths; the
 * cross-plane leg itself is proven in enroll-row-suppression.test.ts).
 */
const CLEAR_SUPPRESSION = { suppression: staticSuppressionReader('clear') };

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
      compile: { ok: true, compileIds: ['c0', 'c1', 'c2', 'c3'] },
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
        compile: { ok: true, compileIds: [] },
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
        compile: { ok: true, compileIds: [] },
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

// ---------------------------------------------------------------------------
// Compile gate (S3-T10 phase 2)
// ---------------------------------------------------------------------------

describe('buildEnrollRows compile gate', () => {
  function nativeItem(compile: EnrollRowItem['compile']): EnrollRowItem {
    return {
      decision: decision('enroll_gap_sequence', 'hubspot_native'),
      inputs: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ) },
      displayName: 'Ada Lovelace',
      preferredSender: 'casey@yardflow.ai',
      ...(compile === undefined ? {} : { compile }),
    };
  }

  it('a contact whose four steps passed the compiler is rendered under Enroll', () => {
    const table = buildEnrollRows([nativeItem({ ok: true, compileIds: ['c0', 'c1', 'c2', 'c3'] })]);
    expect(table.rows[0].contacts.map((c) => c.email)).toEqual(['ada@bostonbeer.com']);
    expect(table.skipped).toEqual([]);
  });

  it('one failing step lands the contact under Skip with compile_not_passed:<stepIndex>', () => {
    const table = buildEnrollRows([nativeItem({ ok: false, reason: 'compile_not_passed:1', stepIndex: 1 })]);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped).toEqual([
      { account: 'Boston Beer Company', personaId: 1, name: 'Ada Lovelace', email: 'ada@bostonbeer.com', reason: 'compile_not_passed:1' },
    ]);
    expect(renderEnrollTableMarkdown(table).split('\n')[2]).toContain('| none | Ada Lovelace (compile_not_passed:1) |');
  });

  it('a missing compile lands the contact under Skip with compile_missing', () => {
    const table = buildEnrollRows([nativeItem({ ok: false, reason: COMPILE_MISSING, stepIndex: 0 })]);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped[0].reason).toBe('compile_missing');
  });

  it('the gate runs after the lane filters: a sequence_block or a missing email still names its own reason', () => {
    const blocked: EnrollRowItem = {
      decision: decision('enroll_gap_sequence', 'hubspot_native'),
      inputs: { account: account('Boston Beer Company'), persona: persona(2, 'bob@bostonbeer.com', BLOCKED_SEQ) },
      displayName: 'Bob Byrne',
      compile: { ok: false, reason: COMPILE_MISSING, stepIndex: 0 },
    };
    const noEmail: EnrollRowItem = {
      decision: decision('enroll_gap_sequence', 'hubspot_native'),
      inputs: { account: account('Boston Beer Company'), persona: persona(3, null, NATIVE_SEQ) },
      displayName: 'Cy Chen',
      compile: { ok: false, reason: COMPILE_MISSING, stepIndex: 0 },
    };
    const table = buildEnrollRows([blocked, noEmail]);
    expect(table.skipped.map((s) => s.reason)).toEqual(['HUBSPOT_CROSS_ACCOUNT_BOUNCE', 'no email']);
  });

  it('fails closed: a native item without the compile field is skipped as compile_missing', () => {
    const table = buildEnrollRows([nativeItem(undefined)]);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped).toEqual([
      { account: 'Boston Beer Company', personaId: 1, name: 'Ada Lovelace', email: 'ada@bostonbeer.com', reason: 'compile_missing' },
    ]);
  });

  it('R3-2: a suppressed contact lands under Skip as suppressed:<leg> before every other filter, never under Enroll', () => {
    const table = buildEnrollRows([{ ...nativeItem({ ok: true, compileIds: ['c0', 'c1', 'c2', 'c3'] }), suppressed: 'unsubscribed' }]);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped).toEqual([
      { account: 'Boston Beer Company', personaId: 1, name: 'Ada Lovelace', email: 'ada@bostonbeer.com', reason: 'suppressed:unsubscribed' },
    ]);
    // Suppression wins over a sequence_block and over a missing email: the leg is the reason.
    const blocked: EnrollRowItem = {
      decision: decision('enroll_gap_sequence', 'hubspot_native'),
      inputs: { account: account('Boston Beer Company'), persona: persona(2, 'bob@bostonbeer.com', BLOCKED_SEQ) },
      displayName: 'Bob Byrne',
      compile: { ok: true, compileIds: ['c0', 'c1', 'c2', 'c3'] },
      suppressed: 'modex_do_not_contact',
    };
    expect(buildEnrollRows([blocked]).skipped.map((s) => s.reason)).toEqual(['suppressed:modex_do_not_contact']);
    // An explicit null or empty leg is "not suppressed".
    expect(buildEnrollRows([{ ...nativeItem({ ok: true, compileIds: ['c0', 'c1', 'c2', 'c3'] }), suppressed: null }]).skipped).toEqual([]);
  });

  it('non-native items keep their own reasons whether or not a compile field is present', () => {
    const table = buildEnrollRows([
      {
        decision: decision('enroll_gap_sequence', 'build_required'),
        inputs: { account: account('Ocean Spray'), persona: persona(3, 'cy@oceanspray.com', NOT_BUILT) },
      },
      {
        decision: decision('enroll_gap_sequence', 'modex_queue'),
        inputs: { account: account('Ocean Spray'), persona: persona(4, 'di@oceanspray.com', null) },
        compile: { ok: false, reason: COMPILE_MISSING, stepIndex: 0 },
      },
    ]);
    expect(table.skipped.map((s) => s.reason)).toEqual([
      'build_required (no rig-built sequence for this account)',
      'modex_queue (no native sequence; secondary lane)',
    ]);
  });
});

describe('loadCompileGate', () => {
  const CONTACT = 'c1';
  const path = ['contract', 'top100Compile', 'hubspotContactId'];

  function compileRows(verdicts: Array<[number, string, string?]>) {
    return verdicts.map(([step, verdict, id]) => ({ id: id ?? `cmp_${step}_${verdict}`, step_index: step, verdict, created_by: 'compile-top100' }));
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockedApprovalFindFirst.mockResolvedValue(null);
  });

  it('queries the compile rows by the top100Compile contact key, newest first', async () => {
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'pass'], [2, 'pass'], [3, 'pass']]));
    const gate = await loadCompileGate(fakePrisma as never, CONTACT);
    expect(mockedCompileFindMany).toHaveBeenCalledWith({
      where: { inputs_snapshot: { path, equals: CONTACT } },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      select: { id: true, step_index: true, verdict: true, created_by: true },
    });
    expect(gate).toEqual({ ok: true, compileIds: ['cmp_0_pass', 'cmp_1_pass', 'cmp_2_pass', 'cmp_3_pass'] });
    expect(mockedApprovalFindFirst).not.toHaveBeenCalled();
  });

  it('no rows at all -> compile_missing at step 0, without touching approvals', async () => {
    mockedCompileFindMany.mockResolvedValue([]);
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_missing', stepIndex: 0 });
    expect(mockedApprovalFindFirst).not.toHaveBeenCalled();
  });

  it('a missing later step -> compile_missing naming that step', async () => {
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'pass'], [3, 'pass']]));
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_missing', stepIndex: 2 });
  });

  it('a rejected step -> compile_not_passed:<stepIndex>, the first problem in step order', async () => {
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'reject'], [2, 'reject'], [3, 'pass']]));
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_not_passed:1', stepIndex: 1 });
  });

  it('the newest row per step wins: an older pass under a newer reject is not a pass', async () => {
    mockedCompileFindMany.mockResolvedValue([
      { id: 'newer_reject', step_index: 2, verdict: 'reject', created_by: 'compile-top100' },
      { id: 'older_pass', step_index: 2, verdict: 'pass', created_by: 'compile-top100' },
      ...compileRows([[0, 'pass'], [1, 'pass'], [3, 'pass']]),
    ]);
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_not_passed:2', stepIndex: 2 });
  });

  it('review_required with an approved SendApprovalRequest counts as a pass', async () => {
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'review_required', 'cmp_rev'], [2, 'pass'], [3, 'pass']]));
    mockedApprovalFindFirst.mockResolvedValue({ id: 'apr_1', status: 'approved' });
    const gate = await loadCompileGate(fakePrisma as never, CONTACT);
    expect(mockedApprovalFindFirst).toHaveBeenCalledWith({
      where: { risk_reasons: { has: 'gap_compile:cmp_rev' } },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true },
    });
    expect(gate).toEqual({ ok: true, compileIds: ['cmp_0_pass', 'cmp_rev', 'cmp_2_pass', 'cmp_3_pass'] });
  });

  it('review_required with a pending or missing request -> compile_not_passed:<stepIndex>', async () => {
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'pass'], [2, 'pass'], [3, 'review_required', 'cmp_rev']]));
    mockedApprovalFindFirst.mockResolvedValue({ id: 'apr_1', status: 'pending' });
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_not_passed:3', stepIndex: 3 });
    mockedApprovalFindFirst.mockResolvedValue(null);
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_not_passed:3', stepIndex: 3 });
  });

  it('R3-3: only rows written by the compile-top100 script (created_by prefix) honour the contact key; anyone else\'s row is ignored', async () => {
    mockedCompileFindMany.mockResolvedValue([
      // Newest first: a pass keyed to the contact but written by someone else must not count.
      { id: 'foreign_pass', step_index: 1, verdict: 'pass', created_by: 'e2e3' },
      { id: 'script_reject', step_index: 1, verdict: 'reject', created_by: 'compile-top100' },
      ...compileRows([[0, 'pass'], [2, 'pass'], [3, 'pass']]),
    ]);
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_not_passed:1', stepIndex: 1 });
    // A run-tagged created_by still starts with the prefix.
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'pass'], [2, 'pass'], [3, 'pass']]).map((r) => ({ ...r, created_by: 'compile-top100:e2e3' })));
    expect((await loadCompileGate(fakePrisma as never, CONTACT)).ok).toBe(true);
    // Rows with no created_by at all never count.
    mockedCompileFindMany.mockResolvedValue(compileRows([[0, 'pass'], [1, 'pass'], [2, 'pass'], [3, 'pass']]).map((r) => ({ ...r, created_by: null })));
    expect(await loadCompileGate(fakePrisma as never, CONTACT)).toEqual({ ok: false, reason: 'compile_missing', stepIndex: 0 });
  });

  it('a contact without a HubSpot id is compile_missing without a query', async () => {
    expect(await loadCompileGate(fakePrisma as never, null)).toEqual({ ok: false, reason: 'compile_missing', stepIndex: null });
    expect(mockedCompileFindMany).not.toHaveBeenCalled();
  });
});

describe('loadDecisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedConfigFind.mockResolvedValue(null);
    mockedCompileFindMany.mockResolvedValue([]);
    mockedApprovalFindFirst.mockResolvedValue(null);
    mockedUnsubscribedFind.mockResolvedValue(null);
    mockedPersonaFind.mockResolvedValue(null);
  });

  it('R3-2: fills suppressed from a FRESH persona read (do_not_contact, bounced email_status), never the routing snapshot, plus the unsubscribed table on the lowercased email', async () => {
    mockedFindFirst.mockResolvedValue({ run_id: 'run_9' });
    const row = (id: string, p: RoutingPersonaInput) => ({
      id,
      run_id: 'run_9',
      action: 'enroll_gap_sequence',
      lane: 'work_queue',
      rule_id: 'enroll',
      priority: 88,
      explain: decision('enroll_gap_sequence').explain,
      inputs_snapshot: { account: account('Boston Beer Company'), persona: p, target: 'hubspot_native' },
      persona: { name: `Person ${id}` },
    });
    mockedFindMany.mockResolvedValue([
      // The snapshot itself says doNotContact: false / emailValid for every
      // one of these; only the fresh persona.findUnique read below decides.
      row('d1', persona(1, 'Ada@BostonBeer.com', NATIVE_SEQ)),
      row('d2', persona(2, 'bob@bostonbeer.com', NATIVE_SEQ)),
      row('d3', persona(3, 'cy@bostonbeer.com', NATIVE_SEQ)),
      row('d4', persona(4, 'di@bostonbeer.com', NATIVE_SEQ)),
    ]);
    mockedPersonaFind.mockImplementation(async ({ where }: { where: { id: number } }) => {
      if (where.id === 1) return { do_not_contact: true, email_status: null };
      if (where.id === 2) return { do_not_contact: false, email_status: 'hard_bounced' };
      return null;
    });
    mockedUnsubscribedFind.mockImplementation(async ({ where }: { where: { email: string } }) => (where.email === 'cy@bostonbeer.com' ? { id: 'u' } : null));
    mockedCompileFindMany.mockResolvedValue([0, 1, 2, 3].map((i) => ({ id: `a${i}`, step_index: i, verdict: 'pass', created_by: 'compile-top100' })));

    const items = await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION);
    expect(items.map((i) => i.suppressed)).toEqual(['modex_do_not_contact', 'bounced', 'unsubscribed', null]);
    expect(mockedUnsubscribedFind.mock.calls.map((c) => c[0].where.email)).toEqual(['ada@bostonbeer.com', 'bob@bostonbeer.com', 'cy@bostonbeer.com', 'di@bostonbeer.com']);
    const table = buildEnrollRows(items);
    expect(table.rows[0].contacts.map((c) => c.personaId)).toEqual([4]);
    expect(table.skipped.map((s) => [s.personaId, s.reason])).toEqual([
      [1, 'suppressed:modex_do_not_contact'],
      [2, 'suppressed:bounced'],
      [3, 'suppressed:unsubscribed'],
    ]);
  });

  /**
   * SHOULD FIX (Opus adversarial review, 2026-09-24). Before this fix the
   * hand-enroll table only checked the local legs; a contact clear of every
   * local leg but suppressed on the cross-plane clawd contract still
   * rendered under Enroll here, even though a real enroll()/
   * recordExternalEnrollment call for the SAME contact would refuse
   * `suppressed`. For hubspot_native this table is the only gate: a human
   * copies it and enrolls in HubSpot by hand. Mutate loadSuppressionLeg back
   * to the local-only check and this goes RED.
   */
  it('SHOULD FIX: a contact clear of every local leg is still skipped when the cross-plane clawd contract says suppressed', async () => {
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
        inputs_snapshot: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ), target: 'hubspot_native' },
        persona: { name: 'Ada Lovelace' },
      },
    ]);
    mockedCompileFindMany.mockResolvedValue([0, 1, 2, 3].map((i) => ({ id: `a${i}`, step_index: i, verdict: 'pass', created_by: 'compile-top100' })));

    const items = await loadDecisions(fakePrisma as never, undefined, { suppression: staticSuppressionReader('suppressed', { hs_email_optout: 'hit' }) });
    expect(items[0].suppressed).toBe('clawd:hs_email_optout');
    expect(buildEnrollRows(items).skipped).toEqual([
      { account: 'Boston Beer Company', personaId: 1, name: 'Ada Lovelace', email: 'ada@bostonbeer.com', reason: 'suppressed:clawd:hs_email_optout' },
    ]);
  });

  it('attaches the compile gate to native items only and skips non-native targets without a compile query', async () => {
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
        inputs_snapshot: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ), target: 'hubspot_native' },
        persona: { name: 'Ada Lovelace' },
      },
      {
        id: 'd2',
        run_id: 'run_9',
        action: 'enroll_gap_sequence',
        lane: 'work_queue',
        rule_id: 'enroll',
        priority: 50,
        explain: decision('enroll_gap_sequence').explain,
        inputs_snapshot: { account: account('Ocean Spray', '222'), persona: persona(3, 'cy@oceanspray.com', NOT_BUILT), target: 'build_required' },
        persona: { name: 'Cy Chen' },
      },
    ]);
    mockedCompileFindMany.mockResolvedValue([
      { id: 'a0', step_index: 0, verdict: 'pass', created_by: 'compile-top100' },
      { id: 'a1', step_index: 1, verdict: 'reject', created_by: 'compile-top100' },
      { id: 'a2', step_index: 2, verdict: 'pass', created_by: 'compile-top100' },
      { id: 'a3', step_index: 3, verdict: 'pass', created_by: 'compile-top100' },
    ]);
    const items = await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION);
    expect(items).toHaveLength(2);
    expect(items[0].compile).toEqual({ ok: false, reason: 'compile_not_passed:1', stepIndex: 1 });
    expect(items[1].compile).toBeUndefined();
    expect(mockedCompileFindMany).toHaveBeenCalledTimes(1);
    expect(mockedCompileFindMany.mock.calls[0][0].where.inputs_snapshot.equals).toBe('c1');
    const table = buildEnrollRows(items);
    expect(table.rows[0].contacts).toEqual([]);
    expect(table.skipped.map((s) => [s.name, s.reason])).toEqual([
      ['Ada Lovelace', 'compile_not_passed:1'],
      ['Cy Chen', 'build_required (no rig-built sequence for this account)'],
    ]);
  });

  it('a native item with no compile rows renders as compile_missing end to end', async () => {
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
        inputs_snapshot: { account: account('Boston Beer Company'), persona: persona(1, 'ada@bostonbeer.com', NATIVE_SEQ), target: 'hubspot_native' },
        persona: { name: 'Ada Lovelace' },
      },
    ]);
    const table = buildEnrollRows(await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION));
    expect(renderEnrollTableMarkdown(table).split('\n')[2]).toContain('| none | Ada Lovelace (compile_missing) |');
  });

  it('returns an empty list when no run exists, without querying rows', async () => {
    mockedFindFirst.mockResolvedValue(null);
    const items = await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION);
    expect(items).toEqual([]);
    expect(mockedFindMany).not.toHaveBeenCalled();
  });

  it('reads the gap_routing_last_run pointer first and never looks at the newest row while it is set (N6)', async () => {
    mockedConfigFind.mockResolvedValue({ value: 'run_completed' });
    mockedFindFirst.mockResolvedValue({ run_id: 'run_partial_newer' });
    mockedFindMany.mockResolvedValue([]);
    await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION);
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
    const items = await loadDecisions(fakePrisma as never, undefined, CLEAR_SUPPRESSION);
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
    await loadDecisions(fakePrisma as never, 'run_3', CLEAR_SUPPRESSION);
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
    mockedCompileFindMany.mockResolvedValue([]);
    mockedApprovalFindFirst.mockResolvedValue(null);
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
