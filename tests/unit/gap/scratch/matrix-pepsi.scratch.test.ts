// @vitest-environment node
/**
 * R62 MATRIX, PEPSI REGRESSION (mandate section 7, "Pepsi regression"): the recorded Pepsi shape (Tom chosen, two
 * checked facts, a sensitive third, no thesis) driven from the page's own read and the page's own control payload
 * through the REAL routes: POST /api/gap/story/draft, PATCH /api/gap/hypotheses/[id] (approve_and_use, which routes
 * Tom through the real snapshot provider), POST /api/gap/decisions/[id]/send (preview, confirm). HubSpot, clawd and
 * the AI gateway are the stub (the real opportunity resolver reads it); the Gmail wire is the sink. Proves the same
 * recipient in the recommendation, the preview and the sink receipt, and the Gatik contrast. Skipped without
 * GAP_SCRATCH_DATABASE_URL pointing at the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const mime = (raw: string | null) => Buffer.from(raw ?? '', 'base64url').toString('utf8').replace(/=\r?\n/g, '');

describe.skipIf(!RUN)('R62 matrix: the Pepsi regression (the page read, the page payload, the real routes)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  type Corpus = import('@/scripts/gap/recovery/seed-corpus').Corpus;
  type Acct = import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  let first: Corpus;
  let second: Corpus;
  let pepsi: Acct;
  let pepsiB: Acct;
  /** Pepsi-shaped accounts with FRESH dates (the shape, not the calendar): A drafts Tulsa first, B drafts Gatik first. */
  let freshA: Acct;
  let freshB: Acct;
  /** The PRODUCTION shape of the Tulsa row and its stranded draft (the lead read the row read-only on 2026-10-07). */
  let prod: Acct;
  let prodLegacyId = '';
  const PROD_EXPIRES = '2026-11-20T10:17:19Z';
  const tag = `mp${Date.now().toString(36)}`;
  const state: { tulsaId?: string; tulsaPreview?: { to: string; subject: string; body: string; contentHash: string }; gatikId?: string; withdrawnId?: string } = {};

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    first = await seedCorpus(prisma, { tag });
    second = await seedCorpus(prisma, { tag: `${tag}b` });
    pepsi = first.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    pepsiB = second.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    const { startMatrixHarness, createMatrixSeeder } = await import('@/scripts/gap/recovery/seed-matrix');
    const m = createMatrixSeeder(prisma, tag);
    const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    const pepsiShape = async (base: string) => {
      const a = await m.account(base);
      const tom = await m.person(a, 'Tom', 'Senior Director - Logistics, Distribution & Transportation');
      await m.person(a, 'Kay', 'Senior Director - Transportation');
      await m.fact(a, 'tulsa', `${a.name} will close its warehouse operations at its Tulsa, Oklahoma, production facility and shift duties to a new site in the area.`, { title: `${a.name} to cease warehouse operations at Oklahoma production site`, observedAt: daysAgo(12) });
      await m.fact(a, 'gatik', `${a.name} and Gatik announced a multi-year agreement to deploy autonomous freight across its North America distribution network.`, { title: `${a.name} and Gatik announce multi-year agreement`, observedAt: daysAgo(9), type: 'technology_signal' });
      await m.fact(a, 'maryland', `${a.name} is ceasing manufacturing and warehouse operations at a bottling plant in Maryland, which will result in 143 layoffs, according to a WARN notice.`, { title: `${a.name} ending manufacturing and warehouse operations in Maryland`, observedAt: daysAgo(5) });
      await m.choose(a, tom.id);
      return a as unknown as Acct;
    };
    freshA = await pepsiShape('Pepsi Fresh A');
    freshB = await pepsiShape('Pepsi Fresh B');
    // The production row, field for field: type site_expansion, source_type public_secondary, claim_class null,
    // external_ok, observed_at 2026-07-23T10:17:19Z, freshness_expires_at 2026-11-20T10:17:19Z, confidence 60, a Supply
    // Chain Dive URL and its sentence (the account's name in place of PepsiCo), metadata keys change, provider, verified,
    // retrievedAt, researchRunId and no continuity key. Then the stranded draft R00 found on it: unmapped family, no
    // source_ref, the fact linked, persona Tom, one propose event (made by the old anchor before R11).
    {
      const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
      const { citedQuote } = await import('@/lib/gap/research/propose');
      const a = await m.account('Pepsiprod');
      const tom = await m.person(a, 'Tom', 'Senior Director - Logistics, Distribution & Transportation');
      await m.person(a, 'Kay', 'Senior Director - Transportation');
      const f = await m.fact(a, 'tulsa', `${a.name} will close its warehouse operations at its Pepsi Beverages' Tulsa, Oklahoma, production facility and shift duties to a new site in the Tulsa area, a spokesperson told Supply Chain Dive.`, {
        title: `${a.name} to cease warehouse operations at Oklahoma production site`,
        type: 'site_expansion',
        sourceType: 'public_secondary',
        externalOk: true,
        observedAt: '2026-07-23T10:17:19Z',
        freshnessExpiresAt: PROD_EXPIRES,
        confidence: 60,
        url: `https://www.supplychaindive.com/news/${a.slug}-to-cease-warehouse-operations-at-oklahoma-production-site/825833/`,
        metadata: { change: 'closure', provider: 'web', retrievedAt: '2026-10-06T18:31:51Z', researchRunId: `matrix-${tag}` },
      });
      await m.choose(a, tom.id);
      const legacy = await proposeHypothesis(prisma, { accountName: a.name, primaryPersonaId: tom.id, persona: 'transportation', problemFamily: 'unmapped', observation: citedQuote(f.title, f.text, f.id, a.name), problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.', rootCauseHypotheses: [], impactHypotheses: [], falsificationQuestions: ['How do trailers get checked in today?'], whatANoMeans: null, confidence: 40, signalIds: [f.id], createdBy: 'casey@freightroll.com' } as never);
      if (!legacy.ok) throw new Error(JSON.stringify(legacy));
      prod = a as unknown as Acct;
      prodLegacyId = legacy.id;
    }
    h = await startMatrixHarness({ companies: [...first.stub.companies, ...second.stub.companies, ...m.companies] });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
  }, 300_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  /** The account page's own read: the real loaders and projections, HubSpot read through the real resolver (the stub). */
  async function pageRead(a: Acct, now = new Date()) {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const { projectNow } = await import('@/lib/gap/context/now');
    const { projectStory } = await import('@/lib/gap/story/story');
    const { projectAnchor } = await import('@/lib/gap/story/anchor');
    const loaded = await loadAccountView(prisma, a.slug, now, { live: true, context: true } as never);
    if (!loaded) throw new Error('account not loaded');
    const { brief, inputs } = loaded as { brief: never; inputs: never };
    const c = await loadAccountContext(prisma, inputs, now);
    const pursuit = await loadPursuit(prisma, { brief, inputs, ctx: c, now });
    const v = projectNow(brief, c, inputs, now);
    const story = projectStory({ accountName: a.name, now, state: pursuit.state, brief, inputs, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] } as never);
    const person = pursuit.state.person ? { personaId: pursuit.state.person.personaId, name: pursuit.state.person.name, title: pursuit.state.person.title } : null;
    const people = [...(pursuit.stack?.rows ?? []), ...(pursuit.stack?.more ?? [])].map((r) => ({ personaId: r.personaId, name: r.name, title: r.title }));
    const anchor = projectAnchor({ accountName: a.name, person, people, brief, inputs, story, anchorChoice: pursuit.anchorChoice, privateLine: v.private, sendable: pursuit.sendableTheses, now });
    return { pursuit, anchor, person };
  }

  /** DRAFT A THESIS exactly as the page's control posts it (story/draft-defaults.ts, the payload the button sends). */
  async function draftFromPage(a: Acct, story: RegExp) {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { anchor, person } = await pageRead(a);
    const d = anchor.draftable.find((x) => story.test(x.story));
    expect(d, `not draftable: ${JSON.stringify(anchor.draftable.map((x) => x.story))}`).toBeDefined();
    const payload = storyDraftPayload({ accountName: a.name, factId: d!.factId, claimClass: (d as { claimClass?: string }).claimClass, proposedObservation: d!.proposedObservation, person: person ? { personaId: person.personaId ?? null, title: person.title ?? null } : null });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    return { status: res.status, body: (await res.json()) as { hypothesisId?: string; status?: string; preparation?: string; family?: string; missing?: string[]; error?: string; submitRefusal?: string | null }, factId: d!.factId };
  }
  async function useAndCard(a: Acct, hypothesisId: string, personaId: number) {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${hypothesisId}`, 'PATCH', { advance: 'approve_and_use' }), ctx(hypothesisId));
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    const d = await prisma.routingDecision.findFirst({ where: { account_name: a.name, persona_id: personaId }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true } });
    expect([d?.lane, d?.action], JSON.stringify(d)).toEqual(['work_queue', 'one_off_email']);
    return d!.id;
  }
  async function send(decisionId: string, confirm?: { contentHash: string; recipient: string }) {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', confirm ? { confirm } : {}), ctx(decisionId));
    return { status: res.status, body: (await res.json()) as { error?: string; detail?: string; alreadySent?: boolean; preview?: { to: string; subject: string; body: string; contentHash: string }; sent?: { recipient: string } } };
  }

  it('Tom end to end: the Tulsa story from the page control is a complete proposal (no family question), Approve and use makes a card for Tom, the preview and the sink receipt name Tom', async () => {
    const pepsi = freshA;
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const before = await pageRead(pepsi);
    expect([before.pursuit.state.state, before.pursuit.state.person?.name]).toEqual(['research', tom.name]);
    const dr = await draftFromPage(pepsi, /Tulsa/);
    expect(dr.status, JSON.stringify(dr.body)).toBe(201);
    expect([dr.body.preparation, dr.body.status, dr.body.family, dr.body.missing ?? []]).toEqual(['submitted', 'review_required', 'hidden_capacity', []]);
    state.tulsaId = dr.body.hypothesisId!;
    const decisionId = await useAndCard(pepsi, state.tulsaId, tom.id);
    // The recommendation: the page's own pursuit read names Tom as the person and allows the first touch.
    const after = await pageRead(pepsi);
    expect([after.pursuit.state.state, after.pursuit.state.person?.personaId, after.pursuit.state.coldTouchAllowed]).toEqual(['ready', tom.id, true]);
    const pv = await send(decisionId);
    expect(pv.status, JSON.stringify(pv.body)).toBe(200);
    state.tulsaPreview = pv.body.preview!;
    expect(pv.body.preview!.to).toBe(tom.email);
    expect(pv.body.preview!.body).toMatch(/Tulsa, Oklahoma/);
    const sent = await send(decisionId, { contentHash: pv.body.preview!.contentHash, recipient: pv.body.preview!.to });
    expect([sent.status, sent.body.sent?.recipient], JSON.stringify(sent.body)).toEqual([201, tom.email]);
    const sink = h.sinkFiles().filter((f) => f.kind === 'send' && f.outcome === 'written');
    expect(sink.map((f) => f.to)).toEqual([tom.email]);
    expect(mime(sink[0].raw)).toMatch(/Tulsa, Oklahoma/);
    const motion = await pageRead(pepsi);
    expect([motion.pursuit.state.state, motion.pursuit.state.person?.personaId]).toEqual(['in_motion', tom.id]);
    expect(h.refusedFetches).toEqual([]);
  }, 300_000);

  it('the Gatik contrast: a Gatik-first account prepares a materially different opening (another family, another question, the Gatik quote and none of the Tulsa words)', async () => {
    const pepsiB = freshB;
    const tom = pepsiB.people.find((p) => p.name.startsWith('Tom'))!;
    const dr = await draftFromPage(pepsiB, /Gatik/);
    expect(dr.status, JSON.stringify(dr.body)).toBe(201);
    expect([dr.body.preparation, dr.body.family]).toEqual(['submitted', 'automation_readiness']);
    state.gatikId = dr.body.hypothesisId!;
    const decisionId = await useAndCard(pepsiB, state.gatikId, tom.id);
    const pv = await send(decisionId);
    expect(pv.status, JSON.stringify(pv.body)).toBe(200);
    const gatik = pv.body.preview!;
    const question = (b: string) => b.split('\n').filter((l) => /\?\s*$/.test(l.trim())).join(' | ');
    expect(gatik.to).toBe(tom.email);
    expect(gatik.body).toMatch(/Gatik/);
    expect(gatik.body).not.toMatch(/Tulsa|warehouse operations/);
    expect(gatik.subject).not.toBe(state.tulsaPreview!.subject);
    expect(question(gatik.body)).not.toBe(question(state.tulsaPreview!.body));
    expect(question(gatik.body)).not.toBe('');
  }, 300_000);

  // Was DEFECT src/lib/gap/story/draft-defaults.ts:20 (R31): one generic guess on every event-led draft.
  // Fixed by the writer at 4cf3fdb1 (R31): the guess names its own fact (the Gatik program, the Tulsa site).
  it('the Gatik proposal does not carry the generic yard-load guess the Tulsa proposal carries', async () => {
    const rows = await prisma.prospectingHypothesis.findMany({ where: { id: { in: [state.tulsaId!, state.gatikId!] } }, select: { id: true, problem_hypothesis: true } });
    const tulsa = rows.find((r) => r.id === state.tulsaId)!.problem_hypothesis;
    const gatik = rows.find((r) => r.id === state.gatikId)!.problem_hypothesis;
    expect(gatik).not.toBe(tulsa);
    expect(gatik).not.toMatch(/moves load onto the gates, yards and docks/);
  }, 60_000);

  // Was DEFECT src/lib/gap/research/claim-types.ts:86, research/facts.ts:230: the Gatik partnership read as a physical change.
  // Fixed by the writer at 4cf3fdb1 (item 4): a partnership is its own claim and drafts fit-led, never event-led.
  it('a partnership announcement never opens an event-led first touch', async () => {
    const { classifyClaim } = await import('@/lib/gap/research/claim-types');
    const gatikFact = freshB.facts.find((f) => f.label === 'gatik')!;
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: gatikFact.id }, select: { evidence_text: true } });
    expect(classifyClaim(String(sig!.evidence_text)).type).not.toBe('physical_change');
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: state.gatikId! }, select: { metadata: true } });
    expect((row!.metadata as { approach?: string } | null)?.approach ?? 'event_led').not.toBe('event_led');
  }, 60_000);

  // R62 case from the HANDOFF at c00b94ca (R65 for the R64 repair): the stranded-draft dry run, the very command the release runs
  // against production (scripts/gap/recovery/repair-stranded-drafts.ts), here against the matrix database on the
  // production-shaped Pepsiprod row. It names Tom's Tulsa draft ADOPT with the key the R11 service stamps, reads only,
  // and refuses to run without --dry-run. The next case adopts that same id through the page's draft route and checks
  // the key the plan named.
  it('the stranded-draft dry run (the script itself, read only) says ADOPT for Tom\'s Tulsa draft on the Pepsiprod row, with the key the R11 service stamps; without --dry-run it refuses', async () => {
    const tom = prod.people.find((p) => p.name.startsWith('Tom'))!;
    const tulsa = prod.facts.find((f) => f.label === 'tulsa')!;
    const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
    const script = (args: string[]) =>
      new Promise<{ code: number | null; out: string; err: string }>((resolve, reject) => {
        const child = spawn(process.execPath, [join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/gap/recovery/repair-stranded-drafts.ts', ...args], { env: { ...process.env, DATABASE_URL: url }, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        let err = '';
        child.stdout!.on('data', (b: Buffer) => (out += b.toString()));
        child.stderr!.on('data', (b: Buffer) => (err += b.toString()));
        const t = setTimeout(() => {
          child.kill();
          reject(new Error('the dry run did not finish'));
        }, 240_000);
        child.on('error', reject);
        child.on('exit', (code) => {
          clearTimeout(t);
          resolve({ code, out, err });
        });
      });
    // Without --dry-run: refused before reading anything (exit 2), in words.
    const refused = await script([]);
    expect([refused.code, refused.err], refused.out).toEqual([2, expect.stringMatching(/Refused: this script only reads \(--dry-run\)\.[\s\S]*Nothing was read or written\./)]);
    // The dry run, as JSON: the database it read (host and name only, never the credentials) and the plan.
    const run = await script(['--dry-run', '--json']);
    expect(run.code, run.err).toBe(0);
    const plan = JSON.parse(run.out.slice(run.out.indexOf('{'), run.out.lastIndexOf('}') + 1)) as { database: string; truncated: boolean; items: Array<Record<string, unknown>> };
    const u = new URL(url);
    expect([plan.database, run.out.includes(`${u.username}:${u.password}@`), plan.truncated]).toEqual(['127.0.0.1:55433/gap_matrix', false, false]);
    const key = `anchor:${tulsa.id}:p${tom.id}`;
    const mine = plan.items.filter((i) => i.accountName === prod.name);
    if (Date.now() >= new Date(PROD_EXPIRES).getTime()) {
      // After the row's recorded expiry the honest plan is that the service would refuse the fact now.
      expect(mine).toEqual([expect.objectContaining({ hypothesisId: prodLegacyId, verdict: 'not_adopted', why: expect.stringMatching(/fails the service's checks now/) })]);
      return;
    }
    expect(mine).toEqual([{ hypothesisId: prodLegacyId, accountName: prod.name, personaId: tom.id, person: tom.name, family: 'unmapped', createdAt: expect.any(String), ageDays: 0, verdict: 'adopt', factId: tulsa.id, factRole: 'supporting', key, why: `Drafting from its supporting fact for ${tom.name} adopts it as ${key} and continues the draft (the family question, then review).` }]);
    // Read only: the draft is still stranded, exactly as it was.
    expect(await prisma.prospectingHypothesis.findUnique({ where: { id: prodLegacyId }, select: { status: true, source_ref: true, problem_family: true } })).toEqual({ status: 'draft', source_ref: null, problem_family: 'unmapped' });
  }, 300_000);

  // Was DEFECT src/lib/gap/compiler/evidence-from-signals.ts:19 (a flat 45-day evidence age) against
  // research/evidence-gate.ts:263 and story/anchor.ts: the approved Tulsa story dead-ended at the preview with
  // copy_rejected "C01 ... cites stale evidence". Fixed by the writer at daa61ff3 (one freshness clock,
  // research/currentness.ts). This case carries the PRODUCTION row's own fields and the stranded draft R00 found, so the
  // green proves the real repair path: the page's own payload adopts the draft, APPROVE AND USE routes Tom's card, and the
  // email previews. After the row's recorded expiry (2026-11-20) the honest answer is that the story is no longer offered.
  it('the production Pepsi repair: the stranded draft is adopted from the page payload, approved and used, and the email previews for Tom', async () => {
    const tom = prod.people.find((p) => p.name.startsWith('Tom'))!;
    // Types only: the production row's facts are the matrix seed's (they carry the title and the text).
    const tulsa = prod.facts.find((f) => f.label === 'tulsa')! as import('@/scripts/gap/recovery/seed-matrix').MatrixAccount['facts'][number];
    if (Date.now() >= new Date(PROD_EXPIRES).getTime()) {
      const { anchor } = await pageRead(prod);
      expect(anchor.draftable.map((d) => d.factId)).not.toContain(tulsa.id);
      return;
    }
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const payload = storyDraftPayload({ accountName: prod.name, factId: tulsa.id, claimClass: null, proposedObservation: citedQuote(tulsa.title, tulsa.text, tulsa.id, prod.name), person: { personaId: tom.id, title: tom.title } });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    const body = (await res.json()) as { hypothesisId?: string; existing?: boolean; preparation?: string; family?: string };
    expect([res.status, body.hypothesisId, body.existing, body.preparation, body.family], JSON.stringify(body)).toEqual([200, prodLegacyId, true, 'submitted', 'hidden_capacity']);
    const decisionId = await useAndCard(prod, prodLegacyId, tom.id);
    const pv = await send(decisionId);
    expect(pv.status, JSON.stringify(pv.body)).toBe(200);
    expect(pv.body.preview!.to).toBe(tom.email);
    expect(pv.body.preview!.body).toMatch(/Tulsa, Oklahoma/);
    const ev = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: prodLegacyId }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(ev.map((e) => e.action)).toEqual(['propose', 'edit', 'submit', 'approve', 'activate']);
    expect(h.writtenTo(tom.email)).toBe(0);
    // The dry run's prediction holds: the R11 service stamped the key the plan named on that same id, and the draft
    // is no longer stranded (the plan, read only, lists nothing here now).
    expect((await prisma.prospectingHypothesis.findUnique({ where: { id: prodLegacyId }, select: { source_ref: true } }))?.source_ref).toBe(`anchor:${tulsa.id}:p${tom.id}`);
    const { planStrandedRepair } = await import('@/lib/gap/recovery/stranded-drafts');
    const { readOnlyPrisma } = await import('@/lib/gap/recovery/read-only');
    expect((await planStrandedRepair(readOnlyPrisma(prisma), new Date())).items.filter((i) => i.accountName === prod.name)).toEqual([]);
  }, 300_000);

  it('the production shape reaches a READY card for Tom on the Tulsa story (draft, approve, use, route) without a family question', async () => {
    const tom = pepsiB.people.find((p) => p.name.startsWith('Tom'))!;
    const dr = await draftFromPage(pepsiB, /Tulsa/);
    expect(dr.status, JSON.stringify(dr.body)).toBe(201);
    expect([dr.body.preparation, dr.body.family, dr.body.missing ?? []]).toEqual(['submitted', 'hidden_capacity', []]);
    await useAndCard(pepsiB, dr.body.hypothesisId!, tom.id);
    const after = await pageRead(pepsiB);
    expect([after.pursuit.state.state, after.pursuit.state.person?.personaId]).toEqual(['ready', tom.id]);
  }, 300_000);

  it('NOT THIS STORY on a second story records the withdrawal: the thesis is rejected with its reason, audited', async () => {
    const dr = await draftFromPage(pepsi, /Gatik/);
    expect(dr.status, JSON.stringify(dr.body)).toBe(201);
    expect(dr.body.status).toBe('review_required');
    state.withdrawnId = dr.body.hypothesisId!;
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${state.withdrawnId}`, 'PATCH', { action: 'withdraw', reason: 'not this story: the autonomous freight deal is not a yard question for Tom' }), ctx(state.withdrawnId));
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: state.withdrawnId }, select: { status: true } });
    expect(row!.status).toBe('rejected');
    const ev = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: state.withdrawnId }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(ev.map((e) => e.action)).toEqual(['propose', 'submit', 'withdraw']);
  }, 180_000);

  // Was DEFECT src/lib/gap/story/anchor.ts:144, :296: a story set aside with NOT THIS STORY was offered again.
  // Fixed by the writer at 5f5e76cf (item 2): a rejected thesis's fact never returns as draftable.
  it('a story set aside with NOT THIS STORY is not offered again on the next read', async () => {
    const { anchor } = await pageRead(pepsi);
    expect(anchor.draftable.map((d) => d.story)).not.toEqual(expect.arrayContaining([expect.stringMatching(/Gatik/)]));
  }, 120_000);

  // Was DEFECT src/lib/gap/story/draft-from-fact.ts:97, :181-182: redrafting a rejected story answered "submitted".
  // Fixed by the writer at 5f5e76cf (item 2): drafting it again answers 409 story_set_aside, no preparation field.
  it('drafting a set-aside story again is refused with its reason, never reported submitted', async () => {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const gatikFact = pepsi.facts.find((f) => f.label === 'gatik')!;
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: gatikFact.id }, select: { title: true, evidence_text: true } });
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const payload = storyDraftPayload({ accountName: pepsi.name, factId: gatikFact.id, claimClass: null, proposedObservation: citedQuote(sig!.title, sig!.evidence_text!, gatikFact.id, pepsi.name), person: { personaId: tom.id, title: tom.title } });
    const res = await POST(req('/api/gap/story/draft', 'POST', payload));
    const body = (await res.json()) as { preparation?: string; error?: string };
    expect([res.status, body.error], JSON.stringify(body)).toEqual([409, 'story_set_aside']);
    expect(body.preparation).toBeUndefined();
  }, 120_000);
});
