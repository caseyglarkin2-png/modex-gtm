import { describe, expect, it, vi } from 'vitest';
import { heatScore, tierNumber } from '@/lib/revops/heat/heat-score';
import { normalizeScore } from '@/lib/pounce/fit';
import { CLAWD_CONTRACT_PATH } from '@/lib/email/suppression-gate';
import {
  assembleForAccount,
  assembleRoutingInputs,
  isSkip,
  personaKeyFor,
  seniorityRankFor,
} from '@/lib/gap/routing/inputs';
import type { HubSpotAccountSnapshot } from '@/lib/gap/routing/inputs';
import {
  CONTRACT_LEG,
  createClawdSuppressionReader,
  staticSuppressionReader,
} from '@/lib/gap/routing/suppression-read';
import type { SuppressionReader } from '@/lib/gap/routing/suppression-read';
import { routePersona } from '@/lib/gap/routing/route';
import { DEFAULT_FRESHNESS } from '@/lib/gap/routing/types';
import type { RoutingInputs } from '@/lib/gap/routing/types';
import type { Top100Manifest, Top100RosterPerson } from '@/lib/gap/top100/reader';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-09-23T12:00:00.000Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY_MS);
const daysAhead = (d: number) => new Date(NOW.getTime() + d * DAY_MS);

// ---------------------------------------------------------------------------
// Fixture database and a hand-rolled prisma mock that filters it on the exact
// `where` shapes inputs.ts emits. No network, no real Prisma.
// ---------------------------------------------------------------------------

interface Db {
  accounts: any[];
  personas: any[];
  triggers: any[];
  hypotheses: any[];
  enrollments: any[];
  drafts: any[];
  emailLogs: any[];
  inbound: any[];
  dispositions: any[];
}

function emptyDb(): Db {
  return { accounts: [], personas: [], triggers: [], hypotheses: [], enrollments: [], drafts: [], emailLogs: [], inbound: [], dispositions: [] };
}

function emailMatches(filter: unknown, value: string): boolean {
  if (typeof filter === 'string') return filter === value;
  const f = filter as { equals: string; mode?: string };
  return f.mode === 'insensitive' ? f.equals.toLowerCase() === value.toLowerCase() : f.equals === value;
}

function byDesc<T>(rows: T[], field: keyof T): T[] {
  return [...rows].sort((a, b) => (b[field] as unknown as Date).getTime() - (a[field] as unknown as Date).getTime());
}

function makePrisma(db: Db) {
  const findFirst = (rows: any[]) => (rows.length > 0 ? rows[0] : null);
  return {
    account: {
      findUnique: vi.fn(async ({ where }: any) => db.accounts.find((a) => a.name === where.name) ?? null),
    },
    persona: {
      findUnique: vi.fn(async ({ where }: any) => db.personas.find((p) => p.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }: any) =>
        db.personas.filter((p) => p.account_name === where.account_name && (where.is_contact_ready === undefined || p.is_contact_ready === where.is_contact_ready)),
      ),
    },
    pounceTrigger: {
      findMany: vi.fn(async ({ where }: any) =>
        byDesc(
          db.triggers.filter(
            (t) => t.account_name === where.account_name && t.dismissed === where.dismissed && t.first_seen_at.getTime() >= where.first_seen_at.gte.getTime(),
          ),
          'first_seen_at',
        ),
      ),
    },
    prospectingHypothesis: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(
          byDesc(
            db.hypotheses.filter(
              (h) =>
                h.account_name === where.account_name &&
                h.primary_persona_id === where.primary_persona_id &&
                !where.status.notIn.includes(h.status),
            ),
            'created_at',
          ),
        ),
      ),
    },
    sequenceEnrollment: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(db.enrollments.filter((e) => e.to_email === where.to_email && where.status.in.includes(e.status))),
      ),
    },
    draftQueueItem: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(db.drafts.filter((d) => d.to_email === where.to_email && where.status.in.includes(d.status))),
      ),
    },
    emailLog: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(byDesc(db.emailLogs.filter((e) => emailMatches(where.to_email, e.to_email)), 'sent_at')),
      ),
    },
    inboundMessage: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(byDesc(db.inbound.filter((m) => emailMatches(where.from_email, m.from_email)), 'received_at')),
      ),
    },
    conversationDisposition: {
      findFirst: vi.fn(async ({ where }: any) =>
        findFirst(
          byDesc(
            db.dispositions.filter(
              (d) => d.contact_email === where.contact_email && (where.human_confirmed === undefined || d.human_confirmed === where.human_confirmed),
            ),
            'created_at',
          ),
        ),
      ),
    },
  };
}

const ACCOUNT = 'Acme Foods';
const EMAIL = 'VP.Ops@Acme.example';
const EMAIL_LOWER = 'vp.ops@acme.example';

function signal(id: string, overrides: Partial<{ evidence_url: string | null; evidence_text: string | null; freshness_expires_at: Date | null }> = {}) {
  return { signal: { id, evidence_url: null, evidence_text: null, freshness_expires_at: null, ...overrides } };
}

/** The full, healthy fixture. Routes to R17 enroll. */
function fullDb(): Db {
  const db = emptyDb();
  db.accounts.push({
    name: ACCOUNT,
    hubspot_company_id: '111',
    outreach_status: 'Not started',
    pipeline_stage: 'targeted',
  });
  db.personas.push({
    id: 42,
    account_name: ACCOUNT,
    title: 'VP Supply Chain Operations',
    seniority: 'vp',
    function: 'Operations',
    persona_lane: null,
    email: EMAIL,
    email_valid: true,
    email_status: 'valid',
    phone: '+15555550100',
    phone_status: 'valid',
    linkedin_url: 'https://www.linkedin.com/in/acme-vp',
    hubspot_contact_id: '222',
    do_not_contact: false,
    is_contact_ready: true,
  });
  db.triggers.push(
    {
      id: 9001,
      account_slug: 'acme-foods',
      account_name: ACCOUNT,
      title: 'Acme Foods opens new distribution center in Ohio',
      url: 'https://example.com/acme-ohio',
      source: 'news',
      score: 6,
      categories: ['network_capex'],
      // 8 d: outside the 7 d hot window, inside the 28 d fresh window
      first_seen_at: daysAgo(8),
      dismissed: false,
    },
    {
      id: 9002,
      account_slug: 'acme-foods',
      account_name: ACCOUNT,
      title: 'Acme Foods names new chief supply chain officer',
      url: 'https://example.com/acme-csco',
      source: 'news',
      score: 3,
      categories: ['leadership'],
      first_seen_at: daysAgo(12),
      dismissed: false,
    },
    // dismissed: never a fresh trigger
    {
      id: 9003,
      account_slug: 'acme-foods',
      account_name: ACCOUNT,
      title: 'Acme Foods dismissed story',
      url: 'https://example.com/dismissed',
      source: 'news',
      score: 12,
      categories: ['autonomy'],
      first_seen_at: daysAgo(1),
      dismissed: true,
    },
    // too old: outside hotTriggerDays * 4 = 28 d
    {
      id: 9004,
      account_slug: 'acme-foods',
      account_name: ACCOUNT,
      title: 'Acme Foods old story',
      url: 'https://example.com/old',
      source: 'news',
      score: 12,
      categories: ['autonomy'],
      first_seen_at: daysAgo(40),
      dismissed: false,
    },
  );
  db.hypotheses.push(
    {
      id: 'hyp-persona',
      account_name: ACCOUNT,
      primary_persona_id: 42,
      status: 'approved',
      problem_family: 'hidden_capacity',
      confidence: 60,
      observation: 'Acme Foods announced a third Ohio distribution center in August 2026.',
      problem_hypothesis: 'My guess is the new site inherits gate waiting from the other two, which caps turns.',
      why_now: 'Site opens in Q4.',
      falsification_questions: ['Does the new site run the same gate process as the other two?'],
      what_a_no_means: 'The new site runs a standard gate process and turns are not capped.',
      expires_at: daysAhead(30),
      metadata: { resumeAt: '2026-10-01T00:00:00.000Z' },
      created_at: daysAgo(5),
      signals: [
        signal('sig-evidenced', { evidence_url: 'https://example.com/acme-ohio', freshness_expires_at: daysAhead(20) }),
        signal('sig-bare'),
      ],
    },
    {
      id: 'hyp-account',
      account_name: ACCOUNT,
      primary_persona_id: null,
      status: 'draft',
      problem_family: 'not_a_family',
      confidence: 40,
      observation: 'Account-level observation.',
      problem_hypothesis: 'Account-level guess.',
      why_now: null,
      falsification_questions: [],
      what_a_no_means: null,
      expires_at: null,
      metadata: null,
      created_at: daysAgo(2),
      signals: [],
    },
  );
  return db;
}

const SNAPSHOT: HubSpotAccountSnapshot = {
  tam: 'in',
  tamTier: 'A',
  intentScore: 30,
  lastIntentAt: daysAgo(4),
  triggerScore: 33,
  lastTriggerAt: daysAgo(3),
  contacts: { '222': { qualVerdict: 'sql', lastIntentSource: 'for_page' } },
};

function reader(verdict: 'clear' | 'suppressed' | 'unknown' = 'clear'): SuppressionReader {
  return staticSuppressionReader(verdict);
}

async function assemble(db: Db, overrides: Partial<Parameters<typeof assembleRoutingInputs>[1]> = {}): Promise<RoutingInputs> {
  const r = await assembleRoutingInputs(makePrisma(db), {
    accountName: ACCOUNT,
    personaId: 42,
    now: NOW,
    hubspotSnapshot: SNAPSHOT,
    suppression: reader('clear'),
    ...overrides,
  });
  if (isSkip(r)) throw new Error(`unexpected skip ${r.skip}`);
  return r;
}

// ---------------------------------------------------------------------------
// Skips and read errors
// ---------------------------------------------------------------------------

describe('assembleRoutingInputs skips', () => {
  it('skips account_not_found when the account row is missing', async () => {
    const r = await assembleRoutingInputs(makePrisma(emptyDb()), { accountName: 'Nobody', personaId: 1, now: NOW, suppression: reader() });
    expect(r).toEqual({ skip: 'account_not_found' });
  });

  it('skips persona_not_found when the persona is missing or belongs to another account', async () => {
    const db = fullDb();
    expect(await assembleRoutingInputs(makePrisma(db), { accountName: ACCOUNT, personaId: 999, now: NOW, suppression: reader() })).toEqual({ skip: 'persona_not_found' });
    db.personas[0].account_name = 'Other Co';
    expect(await assembleRoutingInputs(makePrisma(db), { accountName: ACCOUNT, personaId: 42, now: NOW, suppression: reader() })).toEqual({ skip: 'persona_not_found' });
  });

  it('turns a thrown prisma read into inputs_error:<read name> instead of crashing', async () => {
    const prisma = makePrisma(fullDb());
    prisma.pounceTrigger.findMany.mockRejectedValueOnce(new Error('connection reset'));
    const r = await assembleRoutingInputs(prisma, { accountName: ACCOUNT, personaId: 42, now: NOW, suppression: reader() });
    expect(r).toEqual({ skip: 'inputs_error:pounce_triggers' });

    const prisma2 = makePrisma(fullDb());
    prisma2.emailLog.findFirst.mockRejectedValueOnce(new Error('timeout'));
    const r2 = await assembleRoutingInputs(prisma2, { accountName: ACCOUNT, personaId: 42, now: NOW, suppression: reader() });
    expect(r2).toEqual({ skip: 'inputs_error:email_log' });
  });
});

// ---------------------------------------------------------------------------
// Full assembly
// ---------------------------------------------------------------------------

describe('assembleRoutingInputs full fixture', () => {
  it('populates every RoutingInputs field with exact values', async () => {
    const i = await assemble(fullDb());

    expect(i.now).toBe(NOW);
    expect(i.freshness).toEqual(DEFAULT_FRESHNESS);

    // account: heat fed with snapshot tam/tier/intent + snapshot trigger heat
    const expectedHeat = heatScore(
      { name: ACCOUNT, slug: 'acme-foods', tam: 'in', tamTier: 'A', intentScore: 30, lastIntentAt: daysAgo(4), pounceScore: 33, lastTriggerAt: daysAgo(3) },
      NOW.getTime(),
    );
    expect(i.account).toEqual({
      name: ACCOUNT,
      slug: 'acme-foods',
      hubspotCompanyId: '111',
      tam: 'in',
      tamTier: 'A',
      heatTier: tierNumber(expectedHeat.tier),
      heat: expectedHeat.heat,
      intentScore: 30,
      lastIntentAt: daysAgo(4),
      triggerScore: 33,
      lastTriggerAt: daysAgo(3),
      outreachStatus: 'Not started',
      pipelineStage: 'targeted',
    });
    expect(i.account.heatTier).toBe(1); // fresh trigger + live intent = tier1 per classifyTier
    expect(i.account.heat).toBeGreaterThan(0);

    // signals: dismissed and >28 d rows excluded, newest first, normScore on the pounce scale
    expect(i.signals.freshTriggers).toEqual([
      {
        id: '9001',
        score: 6,
        normScore: normalizeScore(6, 'news'),
        categories: ['network_capex'],
        firstSeenAt: daysAgo(8),
        title: 'Acme Foods opens new distribution center in Ohio',
        url: 'https://example.com/acme-ohio',
      },
      {
        id: '9002',
        score: 3,
        normScore: normalizeScore(3, 'news'),
        categories: ['leadership'],
        firstSeenAt: daysAgo(12),
        title: 'Acme Foods names new chief supply chain officer',
        url: 'https://example.com/acme-csco',
      },
    ]);
    expect(i.signals.freshTriggers[0].normScore).toBe(33);
    expect(i.signals.newestAgeDays).toBe(8);

    // persona
    expect(i.persona).toEqual({
      id: 42,
      personaKey: 'supply_chain',
      roleGatePassed: true,
      seniorityRank: 4,
      email: EMAIL_LOWER,
      emailValid: true,
      emailStatus: 'valid',
      phone: '+15555550100',
      phoneStatus: 'valid',
      linkedinUrl: 'https://www.linkedin.com/in/acme-vp',
      hubspotContactId: '222',
      qualVerdict: 'sql',
      lastIntentSource: 'for_page',
      doNotContact: false,
      top100: null,
    });

    // hypothesis: the persona's own, over the null-persona one
    expect(i.hypothesis).toEqual({
      id: 'hyp-persona',
      status: 'approved',
      family: 'hidden_capacity',
      confidence: 60,
      evidenceFresh: true,
      expiresAt: daysAhead(30),
      resumeAt: new Date('2026-10-01T00:00:00.000Z'),
      version: 1,
      observation: 'Acme Foods announced a third Ohio distribution center in August 2026.',
      problemHypothesis: 'My guess is the new site inherits gate waiting from the other two, which caps turns.',
      whyNow: 'Site opens in Q4.',
      falsificationQuestions: ['Does the new site run the same gate process as the other two?'],
      whatANoMeans: 'The new site runs a standard gate process and turns are not capped.',
      evidenceIds: ['sig-evidenced'],
      signalIds: ['sig-evidenced', 'sig-bare'],
    });

    // comms: nothing on file
    expect(i.comms).toEqual({
      inFlight: false,
      lastOutboundAt: null,
      lastInboundAt: null,
      undispositionedInbound: false,
      lastDisposition: null,
      meetingBooked: false,
    });

    // suppression from the injected reader
    expect(i.suppression).toEqual({ verdict: 'clear', legs: { [CONTRACT_LEG]: 'clear' } });
  });

  it('defaults tam to unknown and tier to blank without a snapshot, and maps an unknown family to unmapped', async () => {
    const db = fullDb();
    db.hypotheses = db.hypotheses.filter((h) => h.id === 'hyp-account');
    const i = await assemble(db, { hubspotSnapshot: null });
    expect(i.account.tam).toBe('unknown');
    expect(i.account.tamTier).toBe('');
    expect(i.account.intentScore).toBeNull();
    expect(i.account.triggerScore).toBeNull();
    // with no snapshot trigger heat, lastTriggerAt falls back to the newest fresh trigger
    expect(i.account.lastTriggerAt).toEqual(daysAgo(8));
    expect(i.persona.qualVerdict).toBeNull();
    expect(i.persona.lastIntentSource).toBeNull();
    expect(i.hypothesis?.id).toBe('hyp-account');
    expect(i.hypothesis?.family).toBe('unmapped');
    expect(i.hypothesis?.evidenceFresh).toBe(false);
    expect(i.hypothesis?.evidenceIds).toEqual([]);
  });

  it('falls back to the null-persona hypothesis only when the persona has none, and skips terminal ones', async () => {
    const db = fullDb();
    db.hypotheses[0].status = 'rejected'; // persona's own is terminal
    const i = await assemble(db);
    expect(i.hypothesis?.id).toBe('hyp-account');
    expect(i.hypothesis?.status).toBe('draft');

    db.hypotheses[1].status = 'expired';
    const j = await assemble(db);
    expect(j.hypothesis).toBeNull();
  });

  it('evidenceFresh is false when the only evidenced signal is expired', async () => {
    const db = fullDb();
    db.hypotheses[0].signals = [
      signal('sig-expired', { evidence_text: 'a quote', freshness_expires_at: daysAgo(1) }),
      signal('sig-bare-fresh', { freshness_expires_at: daysAhead(10) }),
    ];
    const i = await assemble(db);
    expect(i.hypothesis?.evidenceFresh).toBe(false);
    expect(i.hypothesis?.evidenceIds).toEqual(['sig-expired']);
    expect(i.hypothesis?.signalIds).toEqual(['sig-expired', 'sig-bare-fresh']);
  });
});

// ---------------------------------------------------------------------------
// Top100
// ---------------------------------------------------------------------------

function rosterPerson(overrides: Partial<Top100RosterPerson> = {}): Top100RosterPerson {
  return {
    key: 'acme_foods',
    name: 'Pat VP',
    title: 'VP Supply Chain Operations',
    functions: ['supply_chain'],
    hubspotContactId: null,
    email: null,
    emailState: 'verified',
    emailSource: 'apollo',
    eligibility: 'ELIGIBLE',
    eligibilityKnown: true,
    sequenceBlock: null,
    suppression: null,
    suppressionDetail: null,
    lastTouch: null,
    touchLane: null,
    replyAuditVerdict: null,
    priority: 1,
    selected: true,
    crmStatus: null,
    ...overrides,
  };
}

function manifest(): Top100Manifest {
  return {
    runId: 'run-1',
    portal: '3819073',
    accounts: {
      acme_foods: {
        key: 'acme_foods',
        name: ACCOUNT,
        domain: 'acme.example',
        hubspotCompanyId: '111',
        tier: 'A',
        segment: 'food',
        rank: 1,
        score: 90,
        preferredSender: 'casey',
        selected: true,
        sequence: {
          hubspotSequenceId: 'seq-777',
          name: 'Acme Foods GAP v1',
          templateIds: {},
          delaysBusinessDays: [3, 3],
          builtAt: null,
          enrolled: 0,
          state: 'BUILT_NOT_ENROLLED',
          enrolledCheckedAt: null,
        },
        branches: {},
      },
    },
    selectedKeys: ['acme_foods'],
    reserveKeys: [],
    reserve: [],
    senders: {},
    warnings: [],
  };
}

describe('top100 match', () => {
  it('matches by lowercased email regardless of case and reads the sequence from the manifest account', async () => {
    const i = await assemble(fullDb(), {
      top100: { manifest: manifest(), roster: [rosterPerson({ email: 'vp.ops@ACME.example' })] },
    });
    expect(i.persona.top100).toEqual({
      eligibility: 'ELIGIBLE',
      sequenceBlock: null,
      hubspotSequenceId: 'seq-777',
      sequenceName: 'Acme Foods GAP v1',
    });
  });

  it('matches by hubspot contact id when emails differ, carrying the block and a missing manifest account as nulls', async () => {
    const i = await assemble(fullDb(), {
      top100: {
        manifest: null,
        roster: [rosterPerson({ key: 'unknown_key', email: 'someone.else@acme.example', hubspotContactId: '222', eligibility: 'HOLD_RECENT_TOUCH', sequenceBlock: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE' })],
      },
    });
    expect(i.persona.top100).toEqual({
      eligibility: 'HOLD_RECENT_TOUCH',
      sequenceBlock: 'HUBSPOT_CROSS_ACCOUNT_BOUNCE',
      hubspotSequenceId: null,
      sequenceName: null,
    });
  });

  it('is null when the roster has no matching person', async () => {
    const i = await assemble(fullDb(), {
      top100: { manifest: manifest(), roster: [rosterPerson({ email: 'other@acme.example', hubspotContactId: '999' })] },
    });
    expect(i.persona.top100).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Comms
// ---------------------------------------------------------------------------

describe('comms', () => {
  it('inFlight from an active enrollment, and from an approved draft, not from a stopped one', async () => {
    const db = fullDb();
    db.enrollments.push({ id: 'enr-1', to_email: EMAIL_LOWER, status: 'active' });
    expect((await assemble(db)).comms.inFlight).toBe(true);

    db.enrollments[0].status = 'stopped';
    expect((await assemble(db)).comms.inFlight).toBe(false);

    db.drafts.push({ id: 1, to_email: EMAIL_LOWER, status: 'approved' });
    expect((await assemble(db)).comms.inFlight).toBe(true);

    db.drafts[0].status = 'sent';
    expect((await assemble(db)).comms.inFlight).toBe(false);
  });

  it('lastOutboundAt and lastInboundAt are the newest rows, matched case-insensitively', async () => {
    const db = fullDb();
    db.emailLogs.push({ to_email: EMAIL, sent_at: daysAgo(20) }, { to_email: EMAIL_LOWER, sent_at: daysAgo(8) });
    db.inbound.push({ from_email: 'VP.Ops@acme.example', received_at: daysAgo(7) });
    const i = await assemble(db);
    expect(i.comms.lastOutboundAt).toEqual(daysAgo(8));
    expect(i.comms.lastInboundAt).toEqual(daysAgo(7));
  });

  it('undispositionedInbound is true when the inbound is newer than the last disposition, false otherwise, true with no disposition', async () => {
    const db = fullDb();
    db.inbound.push({ from_email: EMAIL_LOWER, received_at: daysAgo(2) });
    expect((await assemble(db)).comms.undispositionedInbound).toBe(true);

    db.dispositions.push({ contact_email: EMAIL_LOWER, response_class: 'timing', created_at: daysAgo(1), human_confirmed: false, ai_suggested: null });
    expect((await assemble(db)).comms.undispositionedInbound).toBe(false);

    db.inbound.push({ from_email: EMAIL_LOWER, received_at: daysAgo(0.5) });
    expect((await assemble(db)).comms.undispositionedInbound).toBe(true);
  });

  it('lastDisposition is the newest human_confirmed disposition only, with resumeAt and referral from its metadata', async () => {
    const db = fullDb();
    db.dispositions.push(
      { contact_email: EMAIL_LOWER, response_class: 'referral', created_at: daysAgo(12), confirmed_at: daysAgo(11), human_confirmed: true, ai_suggested: { referral: { name: 'Sam Director', title: 'Director of Yards' } } },
      { contact_email: EMAIL_LOWER, response_class: 'timing', created_at: daysAgo(6), confirmed_at: daysAgo(5), human_confirmed: true, ai_suggested: { resumeAt: daysAhead(30).toISOString() } },
      // newest but unconfirmed: never the last disposition
      { contact_email: EMAIL_LOWER, response_class: 'problem_confirmed', created_at: daysAgo(1), human_confirmed: false, ai_suggested: null },
    );
    const i = await assemble(db);
    expect(i.comms.lastDisposition).toEqual({
      responseClass: 'timing',
      at: daysAgo(5),
      resumeAt: daysAhead(30),
      referral: null,
    });

    db.dispositions.splice(1, 1);
    const j = await assemble(db);
    expect(j.comms.lastDisposition).toEqual({
      responseClass: 'referral',
      at: daysAgo(11),
      resumeAt: null,
      referral: { name: 'Sam Director', title: 'Director of Yards' },
    });
  });
});

// ---------------------------------------------------------------------------
// Suppression at the assembler seam
// ---------------------------------------------------------------------------

describe('suppression input', () => {
  it('a reader answering unknown yields verdict unknown', async () => {
    const i = await assemble(fullDb(), { suppression: reader('unknown') });
    expect(i.suppression).toEqual({ verdict: 'unknown', legs: { [CONTRACT_LEG]: 'unknown' } });
  });

  it('a reader answering suppressed yields the refusing leg as hit', async () => {
    const i = await assemble(fullDb(), { suppression: staticSuppressionReader('suppressed', { modex_do_not_contact: 'hit' }) });
    expect(i.suppression).toEqual({ verdict: 'suppressed', legs: { modex_do_not_contact: 'hit' } });
  });

  it('a persona without email is unknown with empty legs, and the reader is never asked', async () => {
    const db = fullDb();
    db.personas[0].email = null;
    const read = vi.fn(async () => ({ verdict: 'clear' as const, legs: {} }));
    const i = await assemble(db, { suppression: { read } });
    expect(i.suppression).toEqual({ verdict: 'unknown', legs: {} });
    expect(read).not.toHaveBeenCalled();
    expect(i.persona.email).toBeNull();
    expect(i.persona.emailValid).toBe(false);
    expect(i.comms.inFlight).toBe(false);
  });

  it('a reader that throws is unknown, not a crash', async () => {
    const i = await assemble(fullDb(), { suppression: { read: async () => { throw new Error('boom'); } } });
    expect(i.suppression).toEqual({ verdict: 'unknown', legs: {} });
  });
});

// ---------------------------------------------------------------------------
// createClawdSuppressionReader: the same wire shapes as suppression-gate.ts
// ---------------------------------------------------------------------------

describe('createClawdSuppressionReader', () => {
  const env = { CLAWD_CONTROL_PLANE_URL: 'https://clawd.example/', CLAWD_CONTROL_PLANE_TOKEN: 'tok' };
  const json = (body: unknown, status = 200) =>
    ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response;

  it('missing token is unknown without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const r = await createClawdSuppressionReader({ fetchImpl, env: { CLAWD_CONTROL_PLANE_URL: env.CLAWD_CONTROL_PLANE_URL } }).read({ to: EMAIL });
    expect(r).toEqual({ verdict: 'unknown', legs: { [CONTRACT_LEG]: 'unknown' } });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts the send gate body shape with automated true to the contract path', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, results: [{ email: EMAIL_LOWER, blocked: false, reason: '' }] }));
    await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://clawd.example${CLAWD_CONTRACT_PATH}`);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(JSON.parse(String(init.body))).toEqual({ emails: [EMAIL_LOWER], automated: true });
  });

  it('a network error is unknown', async () => {
    const fetchImpl = vi.fn(async () => { throw new Error('ECONNREFUSED'); });
    const r = await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(r.verdict).toBe('unknown');
    expect(r.legs).toEqual({ [CONTRACT_LEG]: 'unknown' });
  });

  it('a 500 is unknown', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: false }, 500));
    const r = await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(r.verdict).toBe('unknown');
  });

  it('malformed payloads are unknown: no ok flag, wrong count, wrong email, non-boolean blocked, bad JSON', async () => {
    const cases: unknown[] = [
      { results: [{ email: EMAIL_LOWER, blocked: false }] },
      { ok: true, results: [] },
      { ok: true, results: [{ email: 'other@acme.example', blocked: false }] },
      { ok: true, results: [{ email: EMAIL_LOWER, blocked: 'no' }] },
      { ok: true, results: [{ email: EMAIL_LOWER }] },
    ];
    for (const body of cases) {
      const r = await createClawdSuppressionReader({ fetchImpl: vi.fn(async () => json(body)), env }).read({ to: EMAIL });
      expect(r.verdict, JSON.stringify(body)).toBe('unknown');
    }
    const badJson = { ok: true, status: 200, json: async () => { throw new SyntaxError('bad'); } } as unknown as Response;
    const r = await createClawdSuppressionReader({ fetchImpl: vi.fn(async () => badJson), env }).read({ to: EMAIL });
    expect(r.verdict).toBe('unknown');
  });

  it('a refusal body is suppressed with the refusing leg marked hit', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, results: [{ email: EMAIL_LOWER, blocked: true, reason: 'modex_do_not_contact' }] }));
    const r = await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(r).toEqual({ verdict: 'suppressed', legs: { modex_do_not_contact: 'hit' } });
  });

  it('a refusal without a reason is suppressed on the generic leg', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, results: [{ email: EMAIL_LOWER, blocked: true }] }));
    const r = await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(r).toEqual({ verdict: 'suppressed', legs: { suppressed: 'hit' } });
  });

  it('a clean body is clear', async () => {
    const fetchImpl = vi.fn(async () => json({ ok: true, results: [{ email: EMAIL_LOWER, blocked: false, reason: '' }] }));
    const r = await createClawdSuppressionReader({ fetchImpl, env }).read({ to: EMAIL });
    expect(r).toEqual({ verdict: 'clear', legs: { [CONTRACT_LEG]: 'clear' } });
  });

  it('legs_read and unknown_legs populate the leg map while blocked still owns the verdict', async () => {
    const clean = { ok: true, legs_read: { modex: true, hubspot: true, clawd: false }, results: [{ email: EMAIL_LOWER, blocked: false, reason: '', keys: [], unknown_legs: ['clawd'] }] };
    const r = await createClawdSuppressionReader({ fetchImpl: vi.fn(async () => json(clean)), env }).read({ to: EMAIL });
    expect(r).toEqual({ verdict: 'clear', legs: { modex: 'clear', hubspot: 'clear', clawd: 'unknown' } });

    const refused = { ok: true, legs_read: { modex: true, hubspot: true }, results: [{ email: EMAIL_LOWER, blocked: true, reason: 'hubspot_optout', keys: [EMAIL_LOWER], unknown_legs: [] }] };
    const s = await createClawdSuppressionReader({ fetchImpl: vi.fn(async () => json(refused)), env }).read({ to: EMAIL });
    expect(s).toEqual({ verdict: 'suppressed', legs: { modex: 'clear', hubspot: 'clear', hubspot_optout: 'hit' } });
  });

  it('a hung authority times out to unknown', async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const r = await createClawdSuppressionReader({ fetchImpl: fetchImpl as unknown as typeof fetch, env, timeoutMs: 5 }).read({ to: EMAIL });
    expect(r.verdict).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// Persona key and seniority helpers
// ---------------------------------------------------------------------------

describe('personaKeyFor and seniorityRankFor', () => {
  const key = (title: string | null, lane: string | null = null, fn: string | null = null) => personaKeyFor({ title, persona_lane: lane, function: fn });

  it('maps titles by the shared rules, first match wins', () => {
    expect(key('VP Supply Chain')).toBe('supply_chain');
    expect(key('Director of Logistics')).toBe('transportation');
    expect(key('Plant Manager')).toBe('site_ops');
    expect(key('VP Manufacturing')).toBe('site_ops');
    expect(key('Head of Automation Engineering')).toBe('automation');
    expect(key('CIO')).toBe('technology');
    expect(key('Director IT')).toBe('technology');
    expect(key('Head of Fitness')).toBe('executive_ops');
    expect(key('CFO')).toBe('finance_procurement');
    expect(key('Procurement Lead')).toBe('finance_procurement');
    expect(key('GM, DC Network')).toBe('distribution');
    expect(key('Warehouse Director')).toBe('distribution');
    expect(key('Director of Security')).toBe('security');
    expect(key('Chief Executive Officer')).toBe('executive_ops');
    expect(key(null)).toBe('executive_ops');
  });

  it('a lane that is already a taxonomy key wins; otherwise lane then function fill in', () => {
    expect(key('Chief Executive Officer', 'site_ops')).toBe('site_ops');
    expect(key('Chief Executive Officer', 'Transportation leaders')).toBe('transportation');
    expect(key('Chief Executive Officer', null, 'Finance')).toBe('finance_procurement');
  });

  it('ranks seniority executive 5, vp 4, director 3, manager 2, else 1', () => {
    expect(seniorityRankFor('executive')).toBe(5);
    expect(seniorityRankFor('VP')).toBe(4);
    expect(seniorityRankFor('director')).toBe(3);
    expect(seniorityRankFor('manager')).toBe(2);
    expect(seniorityRankFor('senior')).toBe(1);
    expect(seniorityRankFor(null)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// assembleForAccount
// ---------------------------------------------------------------------------

describe('assembleForAccount', () => {
  it('returns inputs for the top contact-ready personas by seniority, skipping those with no email or phone', async () => {
    const db = fullDb();
    const base = db.personas[0];
    db.personas.push(
      { ...base, id: 43, seniority: 'executive', email: 'ceo@acme.example', hubspot_contact_id: '333' },
      { ...base, id: 44, seniority: 'director', email: 'dir@acme.example', hubspot_contact_id: '444' },
      { ...base, id: 45, seniority: 'executive', email: null, phone: null, hubspot_contact_id: '555' },
      { ...base, id: 46, seniority: 'executive', email: 'notready@acme.example', hubspot_contact_id: '666', is_contact_ready: false },
    );
    const out = await assembleForAccount(makePrisma(db), { accountName: ACCOUNT, now: NOW, hubspotSnapshot: SNAPSHOT, suppression: reader() });
    expect(out.map((r) => (isSkip(r) ? r.skip : r.persona.id))).toEqual([43, 42]);

    const three = await assembleForAccount(makePrisma(db), { accountName: ACCOUNT, now: NOW, suppression: reader() }, { maxPersonas: 3 });
    expect(three.map((r) => (isSkip(r) ? r.skip : r.persona.id))).toEqual([43, 42, 44]);
  });

  it('skips account_not_found once, and names a failed persona read', async () => {
    expect(await assembleForAccount(makePrisma(emptyDb()), { accountName: 'Nobody', now: NOW, suppression: reader() })).toEqual([{ skip: 'account_not_found' }]);
    const prisma = makePrisma(fullDb());
    prisma.persona.findMany.mockRejectedValueOnce(new Error('down'));
    expect(await assembleForAccount(prisma, { accountName: ACCOUNT, now: NOW, suppression: reader() })).toEqual([{ skip: 'inputs_error:personas' }]);
  });
});

// ---------------------------------------------------------------------------
// Integration with the committed rules
// ---------------------------------------------------------------------------

describe('routePersona over assembled inputs', () => {
  it('the full fixture routes to R17 enroll with target modex_queue', () => {
    return assemble(fullDb()).then((i) => {
      const r = routePersona(i);
      expect(r.kind).toBe('decision');
      if (r.kind !== 'decision') return;
      expect(r.decision.ruleId).toBe('enroll');
      expect(r.decision.action).toBe('enroll_gap_sequence');
      expect(r.decision.target).toBe('modex_queue');
      expect(r.decision.reason).toBe('enroll:modex_queue');
    });
  });

  it('a trigger inside the hot window drives R14 hot_call through the normalized score', async () => {
    const db = fullDb();
    db.triggers[0].first_seen_at = daysAgo(3);
    // Raw 9 on the news scale normalizes to 49.5, above the derived hot threshold of 44.
    db.triggers[0].score = 9;
    const r = routePersona(await assemble(db));
    expect(r.kind === 'decision' && r.decision.ruleId).toBe('hot_call');
    expect(r.kind === 'decision' && r.decision.reason).toBe('hot');
  });

  it('a Top100 ELIGIBLE match with a built sequence routes enroll to hubspot_native', async () => {
    const i = await assemble(fullDb(), { top100: { manifest: manifest(), roster: [rosterPerson({ email: EMAIL_LOWER })] } });
    const r = routePersona(i);
    expect(r.kind === 'decision' && r.decision.target).toBe('hubspot_native');
  });

  it('a suppressed reader blocks at R0 with the leg named; unknown blocks at R0b', async () => {
    const s = routePersona(await assemble(fullDb(), { suppression: staticSuppressionReader('suppressed', { hubspot_optout: 'hit' }) }));
    expect(s.kind === 'decision' && s.decision.ruleId).toBe('suppressed');
    expect(s.kind === 'decision' && s.decision.reason).toBe('suppressed:hubspot_optout');

    const u = routePersona(await assemble(fullDb(), { suppression: reader('unknown') }));
    expect(u.kind === 'decision' && u.decision.ruleId).toBe('suppression_unknown');
  });

  it('no snapshot routes to R9 tam_unknown; an active enrollment skips at R2', async () => {
    const t = routePersona(await assemble(fullDb(), { hubspotSnapshot: null }));
    expect(t.kind === 'decision' && t.decision.ruleId).toBe('tam_unknown');

    const db = fullDb();
    db.enrollments.push({ id: 'enr-1', to_email: EMAIL_LOWER, status: 'paused' });
    const f = routePersona(await assemble(db));
    expect(f).toEqual({ kind: 'skip', ruleId: 'in_flight', reason: 'in_flight' });
  });
});
