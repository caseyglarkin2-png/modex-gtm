/**
 * R62 ADVERSARIAL MATRIX: corpus shapes and the controlled boundaries (GAP OS execution recovery, mandate section 7).
 * SCRATCH DATABASE ONLY: the matrix's own embedded Postgres, 127.0.0.1:55433/gap_matrix, never the writer's.
 *
 * Two parts, both used by tests/unit/gap/scratch/matrix-*.scratch.test.ts:
 *
 *   createMatrixSeeder(prisma, tag)   the shapes seed-corpus.ts does not have, built the same way (through the real
 *                                     intake and hypothesis authorities: registerSignal, proposeHypothesis, the
 *                                     transition machine, recordMotionChoice, recordEmploymentCorrection), each name
 *                                     carrying the file's own tag so files never collide.
 *   startMatrixHarness(...)           spawns scripts/gap/recovery/stubs.mjs on a loopback port and points every external
 *                                     boundary at it (HubSpot through the SDK base path, clawd's suppression, autonomy
 *                                     and critic, the AI gateway), the Gmail wire at the transport sink, and installs a
 *                                     fetch guard that refuses any address that is not 127.0.0.1 (nothing reaches the
 *                                     network; a Google call fails loudly instead of leaving).
 *
 * The opportunity guard is NEVER mocked here: the real resolver reads the stub's deals file, so an open deal is
 * written to that file, exactly as HubSpot would report it.
 *
 *   DATABASE_URL=postgresql://postgres:scratch@127.0.0.1:55433/gap_matrix npx tsx scripts/gap/recovery/seed-matrix.ts --tag m1
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { registerSignal } from '../../../src/lib/gap/signals/registry';
import { VERIFIED_EXCERPT } from '../../../src/lib/gap/research/evidence-gate';
import { citedQuote } from '../../../src/lib/gap/research/propose';
import { proposeHypothesis, transitionHypothesis } from '../../../src/lib/gap/hypothesis/service';
import { recordMotionChoice } from '../../../src/lib/gap/motion/load';
import { recordEmploymentCorrection } from '../../../src/lib/gap/people/employment-store';
import { stubCompanyId, taggedId, type StubDeal } from './seed-corpus';

/** The ONLY database the matrix runs against. */
export const MATRIX_SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
export const MATRIX_ACTOR = 'casey@freightroll.com';

const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface MatrixAccount {
  name: string;
  slug: string;
  people: Array<{ id: number; name: string; title: string | null; email: string }>;
  facts: Array<{ id: string; label: string; title: string; text: string }>;
  hypotheses: Array<{ id: string; status: string }>;
}

export interface FactOptions {
  title?: string;
  /** null: an undated fact (observed_at null is refused by the schema, so the page date is what goes missing). */
  observedAt?: string;
  type?: string;
  host?: string;
  sourceType?: 'public_primary' | 'public_secondary' | 'first_party_intent' | 'first_party' | 'crm' | 'manual';
  sourceKind?: string;
  externalOk?: boolean;
  verified?: boolean;
  claimClass?: string;
  claimAttributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/** The narrative a seeded thesis carries (the corpus's own words), overridable per case. */
const NARRATIVE = {
  persona: 'transportation',
  problemFamily: 'hidden_capacity',
  problemHypothesis: 'My guess is that the network change above moves load onto the physical handoffs that remain, and that is where production capacity is won or lost.',
  rootCauseHypotheses: ['Manual gate check-in'],
  impactHypotheses: ['Detention at the remaining sites'],
  whyNow: null,
  falsificationQuestions: ['Did the change above add trailer volume or dwell at the sites that remain?'],
  whatANoMeans: 'If trailers do not wait longer at the sites that remain, the change moved no load onto the yard: this thesis is closed for this account.',
  confidence: 40,
  createdBy: MATRIX_ACTOR,
};

export function createMatrixSeeder(prisma: PrismaClient, tag: string, now: Date = new Date()) {
  let rank = 9600 + Math.floor(Math.random() * 300);
  let accession = 0;
  const companies: string[] = [];
  const deals: Record<string, StubDeal[]> = {};
  const nameOf = (base: string) => `${base} ${tag}`;

  async function account(base: string, over: { vertical?: string; tier?: string; band?: string; noCompany?: boolean } = {}): Promise<MatrixAccount> {
    const name = nameOf(base);
    const company = over.noCompany ? null : stubCompanyId(name);
    await prisma.account.upsert({ where: { name }, update: { hubspot_company_id: company }, create: { rank: (rank += 1), name, vertical: over.vertical ?? 'cpg', tier: over.tier ?? 'Tier 1', priority_band: over.band ?? 'A', hubspot_company_id: company } });
    if (company) companies.push(name);
    return { name, slug: slugOf(name), people: [], facts: [], hypotheses: [] };
  }

  async function person(a: MatrixAccount, first: string, title: string, over: { last?: string; hubspotContactId?: string; email?: string; doNotContact?: boolean } = {}) {
    const last = over.last ?? 'Matrix';
    const email = over.email ?? `${first.toLowerCase()}@${a.slug}.example.com`;
    const key = `matrix:${a.slug}:${first.toLowerCase()}`;
    const row = await prisma.persona.upsert({
      where: { persona_id: key },
      update: {},
      create: { persona_id: key, account_name: a.name, priority: 'P1', name: `${first} ${last}`, first_name: first, last_name: last, title, seniority: 'director', email, email_valid: true, email_status: 'valid', is_contact_ready: true, do_not_contact: over.doNotContact ?? false, company_domain: `${a.slug}.example.com`, ...(over.hubspotContactId ? { hubspot_contact_id: over.hubspotContactId } : {}) },
      select: { id: true, name: true, title: true, email: true },
    });
    const p = { id: row.id, name: row.name, title: row.title, email: row.email ?? email };
    a.people.push(p);
    return p;
  }

  /** A verified, dated, quoted, external-ok fact on a publisher page (what the evidence gate admits), unless told otherwise. */
  async function fact(a: MatrixAccount, key: string, text: string, over: FactOptions = {}) {
    const title = over.title ?? `${a.name} news (${key})`;
    const r = await registerSignal(prisma, {
      accountName: a.name,
      sourceKind: (over.sourceKind ?? 'evidence_record') as never,
      sourceId: `matrix:${a.slug}:${key}`,
      type: (over.type ?? 'site_expansion') as never,
      title,
      sourceType: (over.sourceType ?? 'public_secondary') as never,
      evidenceUrl: `https://${over.host ?? 'news.example.com'}/${a.slug}/${key}-${(accession += 1)}`,
      evidenceText: text,
      externalOk: over.externalOk ?? true,
      observedAt: new Date(over.observedAt ?? '2026-09-16T00:00:00Z'),
      confidence: 80,
      ...(over.claimClass ? { claimClass: over.claimClass } : {}),
      metadata: { ...(over.verified === false ? {} : { verified: VERIFIED_EXCERPT }), ...(over.claimClass ? { claimType: over.claimClass.toLowerCase(), claimAttributes: over.claimAttributes ?? {} } : {}), ...(over.metadata ?? {}) },
      registeredBy: MATRIX_ACTOR,
    } as never);
    const f = { id: (r as { id: string }).id, label: key, title, text };
    a.facts.push(f);
    return f;
  }

  async function thesis(a: MatrixAccount, personaId: number, f: { id: string; title: string; text: string }, to: 'draft' | 'review_required' | 'approved' | 'active', over: Partial<typeof NARRATIVE> & { metadata?: Record<string, unknown> } = {}) {
    const r = await proposeHypothesis(prisma, { ...NARRATIVE, ...over, accountName: a.name, primaryPersonaId: personaId, observation: citedQuote(f.title, f.text, f.id, a.name), signalIds: [f.id], primarySignalId: f.id, sourceRef: `matrix:${a.slug}:${f.id}:p${personaId}` } as never);
    const id = r.ok ? r.id : r.reason === 'duplicate_source_ref' && r.existingId ? r.existingId : null;
    if (!id) throw new Error(`propose at ${a.name}: ${JSON.stringify(r)}`);
    const ctx = { now, actor: MATRIX_ACTOR, reason: 'matrix seed' };
    const order = ['draft', 'review_required', 'approved', 'active'] as const;
    const current = (await prisma.prospectingHypothesis.findUnique({ where: { id }, select: { status: true } }))?.status ?? 'draft';
    const steps: Array<'submit' | 'approve' | 'activate'> = (['submit', 'approve', 'activate'] as const).slice(Math.max(0, order.indexOf(current as never)), order.indexOf(to));
    for (const action of steps) {
      const t = await transitionHypothesis(prisma, id, action, ctx);
      if (!t.ok) throw new Error(`${action} at ${a.name}: ${t.reason}`);
    }
    a.hypotheses.push({ id, status: to });
    return id;
  }

  async function choose(a: MatrixAccount, personaId: number) {
    const r = await recordMotionChoice(prisma, { accountName: a.name, primaryPersonaId: personaId, nextPersonaId: null, actor: MATRIX_ACTOR });
    if (!r.ok) throw new Error(`choose at ${a.name}: ${r.reason}`);
  }

  async function left(personaId: number) {
    const r = await recordEmploymentCorrection(prisma, { personaId, actor: MATRIX_ACTOR, now, status: 'left', newCompany: null, note: 'matrix: left the account' } as never);
    if (!r.ok) throw new Error(`employment: ${r.reason}`);
  }

  /** An inbound message in its own thread (the mailbox ingest's rows): a reply, a referral, an out-of-office, a bounce. */
  async function inbound(a: MatrixAccount, p: { email: string; name: string }, text: string, over: { key: string; at?: Date; subject?: string; fromEmail?: string; fromName?: string | null; source?: 'gmail' | 'hubspot' }) {
    const threadId = `matrix-thread-${a.slug}-${over.key}`;
    const at = over.at ?? new Date();
    const subject = over.subject ?? 'Re: trailer turns at your sites';
    await prisma.emailThread.upsert({ where: { id: threadId }, update: { last_message_at: at }, create: { id: threadId, account_name: a.name, persona_email: p.email, subject, last_message_at: at } });
    const id = `matrix-msg-${a.slug}-${over.key}`;
    await prisma.inboundMessage.upsert({ where: { id }, update: {}, create: { id, thread_id: threadId, from_email: over.fromEmail ?? p.email, from_name: over.fromName === undefined ? p.name : over.fromName, subject, body_text: text, snippet: text.replace(/\s+/g, ' ').slice(0, 200), received_at: at, source: over.source ?? 'gmail' } });
    return { id, threadId };
  }

  async function meeting(a: MatrixAccount, key: string, m: { date: Date; time: string | null; status: string; objective: string; attendees: string; dealId: string | null }) {
    const idStr = `matrix:${a.slug}:${key}`;
    const have = await prisma.meeting.findFirst({ where: { meeting_id_str: idStr }, select: { id: true } });
    if (have) return have.id;
    return (await prisma.meeting.create({ data: { meeting_id_str: idStr, account_name: a.name, meeting_status: m.status, meeting_date: m.date, meeting_time: m.time, objective: m.objective, persona: m.attendees, hubspot_deal_id: m.dealId }, select: { id: true } })).id;
  }

  /** A first-touch-ready account: one person chosen, one verified physical-network fact, an APPROVED thesis on it. */
  async function readyAccount(base: string, opts: { first?: string; title?: string; factText?: string; vertical?: string } = {}) {
    const a = await account(base, { vertical: opts.vertical });
    const p = await person(a, opts.first ?? 'Glen', opts.title ?? 'Managing Director, Surface Transportation');
    const f = await fact(a, 'terminals', opts.factText ?? `${a.name} will close two freight terminals in Ohio and consolidate their linehaul operations into its Columbus hub in 2027.`, { title: `${a.name} consolidates Ohio terminals`, observedAt: '2026-10-01T00:00:00Z' });
    const h = await thesis(a, p.id, f, 'approved');
    await choose(a, p.id);
    return { a, p, f, h };
  }

  function openDeal(a: MatrixAccount, n: number, over: Partial<StubDeal> = {}): StubDeal {
    const d: StubDeal = { id: taggedId(tag, n), dealname: `YardFlow - ${a.name}`, dealstage: 'appointmentscheduled', hs_is_closed: false, ...over };
    (deals[a.name] ??= []).push(d);
    return d;
  }

  return { account, person, fact, thesis, choose, left, inbound, meeting, readyAccount, openDeal, companies, deals, tag };
}

export type MatrixSeeder = ReturnType<typeof createMatrixSeeder>;

// ---------------------------------------------------------------------------------------------------------------------
// The controlled boundaries
// ---------------------------------------------------------------------------------------------------------------------

export interface SinkFile {
  kind: string;
  outcome: string;
  to: string;
  subject: string | null;
  raw: string | null;
  refused: string[];
  at: string;
  id: string;
}

export interface MatrixHarness {
  base: string;
  dir: string;
  sinkDir: string;
  /** Rewrite the stub's deals file (HubSpot's deals as the real resolver reads them). */
  setDeals(deals: Record<string, StubDeal[]>): void;
  /** clawd suppression: addresses the contract answers blocked (do_not_send). */
  setBlocked(emails: string[]): void;
  /** The matrix controls on the stub (POST /__stub/matrix). */
  control(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  stubGet(path: string): Promise<unknown>;
  stubPost(path: string, body: unknown): Promise<unknown>;
  requests(): Array<{ method: string; path: string; body: unknown }>;
  sinkFiles(): SinkFile[];
  writtenTo(to: string): number;
  /** Every fetch the code under test made to anything but the stub (must stay empty). */
  refusedFetches: string[];
  stop(): Promise<void>;
}

/**
 * Start the boundaries for one test file. Call BEFORE the first import of the HubSpot client or the AI client (both
 * read their configuration once): the test file's beforeAll does this before importing any route.
 */
export async function startMatrixHarness(opts: { companies: string[]; deals?: Record<string, StubDeal[]>; critic?: 'pass' | 'block'; flags?: string[] }): Promise<MatrixHarness> {
  const dir = mkdtempSync(join(tmpdir(), 'gap-matrix-'));
  const dealsFile = join(dir, 'deals.json');
  const blockedFile = join(dir, 'blocked.json');
  const log = join(dir, 'requests.jsonl');
  writeFileSync(dealsFile, JSON.stringify(opts.deals ?? {}));
  writeFileSync(blockedFile, '[]');
  const port = 4900 + Math.floor(Math.random() * 900);
  const base = `http://127.0.0.1:${port}`;
  const child: ChildProcess = spawn(process.execPath, ['scripts/gap/recovery/stubs.mjs', String(port)], {
    env: { ...process.env, STUB_DEALS_FILE: dealsFile, STUB_BLOCKED_FILE: blockedFile, STUB_COMPANIES: opts.companies.join('|'), STUB_WRITES_FILE: join(dir, 'writes.jsonl'), STUB_LOG: log, ...(opts.critic === 'block' ? { STUB_CRITIC: 'block' } : {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('the matrix stub did not start')), 20_000);
    child.stdout!.on('data', (b: Buffer) => {
      if (/stubs listening/.test(b.toString())) {
        clearTimeout(t);
        resolve();
      }
    });
    child.on('exit', (code) => reject(new Error(`the matrix stub exited (${code})`)));
  });

  for (const f of opts.flags ?? ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED']) process.env[f] = 'true';
  delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
  delete process.env.GAP_SINK_FAULT;
  // HubSpot: the REAL SDK and the REAL resolver, against the stub only (loopback asserted).
  process.env.HUBSPOT_API_BASE_PATH = base;
  process.env.HUBSPOT_ACCESS_TOKEN = 'matrix-stub-token';
  // clawd: suppression, autonomy and the critic, from the same stub.
  process.env.CLAWD_CONTROL_PLANE_URL = base;
  process.env.CLAWD_CONTROL_PLANE_TOKEN = 'matrix';
  // The AI gateway (OpenAI-compatible) answers from the stub's provider control; no other provider key is set.
  process.env.AI_GATEWAY_BASE_URL = `${base}/v1`;
  process.env.AI_GATEWAY_API_KEY = 'matrix-provider-key';
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  // The mail boundary: the sink, the reserved test domain only.
  const sinkDir = join(dir, 'sink');
  process.env.GAP_SEND_TRANSPORT = 'sink';
  process.env.GAP_SINK_DIR = sinkDir;
  process.env.GAP_SINK_ALLOWED_DOMAINS = 'example.com';
  process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
  process.env.GAP_GOOGLE_DWD_SA_JSON = '{"scratch":true}';
  process.env.GOOGLE_CLIENT_ID = 'scratch';
  process.env.GOOGLE_CLIENT_SECRET = 'scratch';
  process.env.GOOGLE_REFRESH_TOKEN = 'scratch-never-used';
  process.env.UNSUBSCRIBE_SECRET = 'scratch-unsubscribe-secret';
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.HUBSPOT_API_BASE_PATH ?? '')) throw new Error('refusing: HubSpot base path is not loopback');

  // The network guard: anything not the stub is refused before it leaves (and recorded, so a test can assert none).
  const refusedFetches: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!/^http:\/\/127\.0\.0\.1:\d+\//.test(url)) {
      refusedFetches.push(url);
      throw new Error(`matrix network guard: refused ${url}`);
    }
    return realFetch(input as never, init);
  }) as typeof fetch;

  const sinkFiles = (): SinkFile[] => {
    try {
      return readdirSync(sinkDir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(sinkDir, f), 'utf8')) as SinkFile);
    } catch {
      return [];
    }
  };
  const post = async (path: string, body: unknown) => (await realFetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json();
  return {
    base,
    dir,
    sinkDir,
    setDeals: (deals) => writeFileSync(dealsFile, JSON.stringify(deals)),
    setBlocked: (emails) => writeFileSync(blockedFile, JSON.stringify(emails.map((e) => e.toLowerCase()))),
    control: (body) => post('/__stub/matrix', body) as Promise<Record<string, unknown>>,
    stubGet: async (path) => (await realFetch(`${base}${path}`)).json(),
    stubPost: post,
    requests: () => {
      try {
        return readFileSync(log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
      } catch {
        return [];
      }
    },
    sinkFiles,
    writtenTo: (to) => sinkFiles().filter((f) => f.outcome === 'written' && f.kind === 'send' && f.to === to).length,
    refusedFetches,
    stop: async () => {
      globalThis.fetch = realFetch;
      child.kill();
      for (const k of ['HUBSPOT_API_BASE_PATH', 'HUBSPOT_ACCESS_TOKEN', 'CLAWD_CONTROL_PLANE_URL', 'AI_GATEWAY_BASE_URL', 'AI_GATEWAY_API_KEY', 'GAP_SEND_TRANSPORT', 'GAP_SINK_DIR', 'GAP_SINK_FAULT']) delete process.env[k];
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

async function main() {
  const url = process.env.DATABASE_URL ?? '';
  if (!MATRIX_SCRATCH_URL.test(url)) throw new Error('refusing: DATABASE_URL is not the matrix scratch database (127.0.0.1:55433/gap_matrix)');
  if (process.env.HUBSPOT_ACCESS_TOKEN) throw new Error('refusing: HUBSPOT_ACCESS_TOKEN is set; the matrix corpus never touches HubSpot');
  const tagIdx = process.argv.indexOf('--tag');
  const tag = tagIdx > 0 ? process.argv[tagIdx + 1] : `m${Date.now().toString(36)}`;
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const s = createMatrixSeeder(prisma, tag);
    const ready = await s.readyAccount('Matrix Ready Co');
    console.log(JSON.stringify({ tag, ready: { account: ready.a.name, person: ready.p.name, thesis: ready.h }, companies: s.companies }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && /seed-matrix\.ts$/.test(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
