// @vitest-environment node
/**
 * R03 / R11 / R12 (GAP OS execution recovery, 2026-10-06): the Pepsi draft-and-review transaction, through the REAL
 * routes, service, state machine and Postgres (the embedded scratch database), with only the session mocked. Runs
 * only when GAP_SCRATCH_DATABASE_URL names the scratch database; skipped everywhere else.
 *
 *   GAP_SCRATCH_DATABASE_URL=postgresql://postgres:...@127.0.0.1:55432/gap_finish_e2e npx vitest run tests/unit/gap/scratch
 *
 * The recording (49.6 s, 2026-10-06): Tom chosen, two checked facts, no usable thesis; Casey selects the Tulsa
 * warehouse story and presses Submit for review; the UI answers "Drafted (unmapped_family); submit it from the
 * REVIEW lane"; the fact count drops to one while outreach stays unavailable. Before the fix (receipt in
 * docs/GAP_PROSPECTING_OS.md, R03) the submit route answered 409 unmapped_family and the fact vanished. After it:
 * one call prepares a valid proposal under review, a retry returns the same id, the fact stays visible as the
 * proposal, APPROVE AND USE makes the account Ready for Tom on that story, and the account page agrees.
 *
 * Item 2a (2026-10-07, one freshness authority): the corpus Tulsa fact is dated 2026-07-23, 75 days and more before
 * the run, as in the recording. The page offers it with "Current until ..." (a site change keeps its own window), the
 * routed card for Tom PREVIEWS through the real send route (the compiler reads the same clock: no "cites stale
 * evidence" dead end), and a 75-day-old news fact is never offered as draftable: the page lists it as too old.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const URL_ = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
const RUN = SCRATCH_URL.test(URL_);

const session = vi.hoisted(() => ({ value: { user: { email: 'casey@freightroll.com' } } as { user: { email: string } } | null }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

// HubSpot opportunity truth at the click: the scratch "no deal" reader (production reads HubSpot; the resolver is unchanged).
vi.mock('@/lib/gap/enroll/service', async (orig) => {
  const mod = await orig<Record<string, unknown>>();
  return { ...mod, checkActiveOpportunityNow: async () => ({ status: 'CLEAR' }) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!RUN)('R03: the Pepsi draft, review and use transaction (scratch database, real routes)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let corpus: import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let pepsi: import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  const tag = `r03-${Date.now().toString(36)}`;
  let hypothesisId = '';
  let stub: http.Server;
  let staleNewsId = '';
  let sinkDir = '';
  // Counts below are scoped to THIS run (an earlier run of this file on the same database previewed an email).
  const runStart = new Date();

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    corpus = await seedCorpus(prisma, { tag });
    pepsi = corpus.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    // Item 2a: a checked, citable fact registered as plain NEWS 75 days back: past its window, never draftable.
    const { registerSignal } = await import('@/lib/gap/signals/registry');
    const { VERIFIED_EXCERPT } = await import('@/lib/gap/research/evidence-gate');
    const news = await registerSignal(prisma, { accountName: pepsi.name, sourceKind: 'evidence_record', sourceId: `corpus:${pepsi.slug}:denver-news`, type: 'news' as never, title: `${pepsi.name} to expand Denver distribution center`, sourceType: 'public_secondary', evidenceUrl: `https://news.example.com/${pepsi.slug}/denver-news`, evidenceText: `${pepsi.name} will expand its Denver, Colorado distribution center with 12 new dock doors.`, externalOk: true, observedAt: new Date(Date.now() - 75 * 86_400_000), confidence: 80, metadata: { verified: VERIFIED_EXCERPT }, registeredBy: 'casey@freightroll.com' });
    staleNewsId = news.id;
    // The clawd boundary for the preview step: autonomy not halted, the congruence critic a controlled PASS, nobody suppressed.
    stub = http.createServer((rq, rs) => {
      let body = '';
      rq.on('data', (c) => (body += c));
      rq.on('end', () => {
        rs.setHeader('content-type', 'application/json');
        if (rq.url?.startsWith('/api/autonomy/state')) return rs.end(JSON.stringify({ global: true, motions: { outreach: true, actuator: true, social: true, content: true } }));
        if (rq.url?.startsWith('/api/critic/score')) return rs.end(JSON.stringify({ verdict: 'pass', hard_block: false, score: 96, counts: { block: 0, warn: 0 }, violations: [], artifact_type: 'email', used_llm: false, edge: { verdict: 'pass', hard_block: false, score: 96, violations: [] } }));
        let emails: string[] = [];
        try {
          const j = JSON.parse(body || '{}');
          emails = Array.isArray(j.emails) ? j.emails : j.email ? [j.email] : [];
        } catch {
          emails = [];
        }
        rs.end(JSON.stringify({ ok: true, results: emails.map((email: string) => ({ email, blocked: false, reason: null })) }));
      });
    });
    await new Promise<void>((r) => stub.listen(0, '127.0.0.1', () => r()));
    process.env.CLAWD_CONTROL_PLANE_URL = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
    process.env.CLAWD_CONTROL_PLANE_TOKEN = 'scratch';
    process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
    process.env.GAP_GOOGLE_DWD_SA_JSON = '{"scratch":true}';
    process.env.UNSUBSCRIBE_SECRET = 'scratch-unsubscribe-secret';
    // The mail boundary: the transport sink is the GAP mailbox (its Sent folder is read at preview); nothing is sent here.
    sinkDir = mkdtempSync(join(tmpdir(), 'gap-r03-sink-'));
    process.env.GAP_SEND_TRANSPORT = 'sink';
    process.env.GAP_SINK_DIR = sinkDir;
    process.env.GAP_SINK_ALLOWED_DOMAINS = 'example.com';
  }, 120_000);
  afterAll(async () => {
    await new Promise<void>((r) => (stub ? stub.close(() => r()) : r()));
    if (sinkDir) rmSync(sinkDir, { recursive: true, force: true });
    delete process.env.GAP_SEND_TRANSPORT;
    await prisma?.$disconnect();
  });

  /** The page's own read of the account: the real loaders and projections, HubSpot answered "no deal" at the boundary. */
  async function pageRead(now = new Date()) {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const { projectNow } = await import('@/lib/gap/context/now');
    const { projectStory } = await import('@/lib/gap/story/story');
    const { projectAnchor } = await import('@/lib/gap/story/anchor');
    const { SCRATCH_NO_DEALS } = await import('@/scripts/gap/scratch-opportunity');
    const loaded = await loadAccountView(prisma, pepsi.slug, now, { live: true, context: true, deps: { opportunity: SCRATCH_NO_DEALS } } as never);
    if (!loaded) throw new Error('account not loaded');
    const { brief, inputs } = loaded as { brief: never; inputs: never };
    const ctx = await loadAccountContext(prisma, inputs, now);
    const pursuit = await loadPursuit(prisma, { brief, inputs, ctx, now });
    const v = projectNow(brief, ctx, inputs, now);
    const story = projectStory({ accountName: pepsi.name, now, state: pursuit.state, brief, inputs, whyNow: v.whyNow, know: v.know, touches: [], clawdRead: 'ok', vaultNote: null, excluded: [] } as never);
    const person = pursuit.state.person ? { personaId: pursuit.state.person.personaId, name: pursuit.state.person.name, title: pursuit.state.person.title } : null;
    const people = [...(pursuit.stack?.rows ?? []), ...(pursuit.stack?.more ?? [])].map((r) => ({ personaId: r.personaId, name: r.name, title: r.title }));
    const anchor = projectAnchor({ accountName: pepsi.name, person, people, brief, inputs, story, anchorChoice: pursuit.anchorChoice, privateLine: v.private, sendable: pursuit.sendableTheses, now });
    return { pursuit, anchor };
  }

  const draftBody = (factId: string, personaId: number, observation: string) => ({
    accountName: pepsi.name,
    factId,
    personaId,
    persona: 'transportation',
    observation,
    problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run, and that is where site capacity is won or lost.',
    falsificationQuestions: ['How do trailers get checked in and found at the sites this change touches today?'],
    whatANoMeans: 'If trailers do not wait longer at those sites since the change, it moved no load onto the yard: this thesis is closed for them.',
    problemFamily: null,
  });

  it('starts as the recording did: Tom chosen, Research, no usable thesis, the warehouse closure draftable', async () => {
    const { pursuit, anchor } = await pageRead();
    expect(pursuit.state.state).toBe('research');
    expect(pursuit.state.person?.name).toMatch(/^Tom/);
    expect(pursuit.usableTheses).toEqual([]);
    expect(anchor.primary).toBeNull();
    expect(anchor.pending).toEqual([]);
    expect(anchor.draftable.map((d) => d.story)).toEqual(expect.arrayContaining([expect.stringMatching(/Tulsa/)]));
    // Item 2a: the 75-day-old Tulsa site change is offered with its end date; the 75-day-old news item is not offered
    // and the page says why.
    expect(anchor.draftable.find((d) => /Tulsa/.test(d.story))?.currentLine).toMatch(/^Current until [A-Z][a-z]{2} \d{1,2}, 2026\.$/);
    expect(anchor.draftable.map((d) => d.factId)).not.toContain(staleNewsId);
    expect(anchor.tooOld).toEqual([expect.objectContaining({ factId: staleNewsId, line: expect.stringMatching(/^This story is too old for a first touch: it was current until /) })]);
  }, 120_000);

  it('Submit for review from the visible control prepares a valid proposal under review, with a derived family and a basis; the fact stays visible as the proposal', async () => {
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { anchor: before } = await pageRead();
    const d = before.draftable.find((x) => /Tulsa/.test(x.story))!;
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const res = await POST(req('/api/gap/story/draft', 'POST', draftBody(d.factId, tom.id, d.proposedObservation)));
    const body = (await res.json()) as { hypothesisId?: string; status?: string; preparation?: string; family?: string; familyBasis?: string | null; existing?: boolean; error?: string; submitRefusal?: string | null };
    expect(res.status, JSON.stringify(body)).toBe(201);
    expect(body.preparation, `submit refused: ${body.submitRefusal}`).toBe('submitted');
    expect(body.status).toBe('review_required');
    expect(body.family).toBe('hidden_capacity');
    expect(body.familyBasis).toMatch(/closure or consolidation/);
    hypothesisId = body.hypothesisId!;
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesisId }, select: { status: true, problem_family: true, source_ref: true, metadata: true, primary_persona_id: true } });
    expect(row).toMatchObject({ status: 'review_required', problem_family: 'hidden_capacity', source_ref: `anchor:${d.factId}:p${tom.id}`, primary_persona_id: tom.id });
    expect((row?.metadata as { proposedFrom?: string })?.proposedFrom).toBe('outreach_anchor');
    const events = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: hypothesisId }, select: { action: true, to_status: true }, orderBy: { created_at: 'asc' } });
    expect(events.map((e) => `${e.action}:${e.to_status}`)).toEqual(['propose:draft', 'submit:review_required']);

    const { anchor: after, pursuit } = await pageRead();
    expect(after.pending.map((p) => ({ story: p.story, status: p.status, familyKnown: p.familyKnown, personName: p.personName }))).toEqual([{ story: expect.stringMatching(/Tulsa/), status: 'review_required', familyKnown: true, personName: expect.stringMatching(/^Tom/) }]);
    expect(after.draftable.map((x) => x.story)).not.toEqual(expect.arrayContaining([expect.stringMatching(/Tulsa/)]));
    expect(after.draftable.map((x) => x.story)).toEqual(expect.arrayContaining([expect.stringMatching(/Gatik/)]));
    expect(pursuit.state.state).toBe('research');
    expect(pursuit.state.stateLine).toMatch(/a proposal is under review for Tom/);
    expect(pursuit.state.person?.name).toMatch(/^Tom/);
    expect(pursuit.state.coldTouchAllowed).toBe(false);
  }, 180_000);

  it('a second click, a refresh or a retry returns the same proposal: no second draft', async () => {
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const fact = pepsi.facts.find((f) => f.label === 'tulsa')!;
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: fact.id }, select: { title: true, evidence_text: true } });
    const res = await POST(req('/api/gap/story/draft', 'POST', draftBody(fact.id, tom.id, citedQuote(sig!.title, sig!.evidence_text!, fact.id, pepsi.name))));
    const body = (await res.json()) as { hypothesisId?: string; existing?: boolean; preparation?: string };
    expect(res.status).toBe(200);
    expect(body).toMatchObject({ hypothesisId, existing: true, preparation: 'submitted' });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
  }, 120_000);

  it('APPROVE AND USE from the proposal runs the audited transitions: approved, active, and the account is Ready for Tom on that story', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${hypothesisId}`, 'PATCH', { advance: 'approve_and_use' }), ctx(hypothesisId));
    const body = (await res.json()) as { ok?: boolean; to?: string; detail?: string; reason?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ ok: true, to: 'active' });
    const events = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: hypothesisId }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(events.map((e) => e.action)).toEqual(['propose', 'submit', 'approve', 'activate']);
    const { anchor, pursuit } = await pageRead();
    expect(pursuit.state.state).toBe('ready');
    expect(pursuit.state.person?.name).toMatch(/^Tom/);
    expect(pursuit.usableTheses).toEqual([hypothesisId]);
    expect(anchor.primary?.hypothesisId).toBe(hypothesisId);
    expect(anchor.primary?.observation).toMatch(/Tulsa/);
    expect(anchor.pending).toEqual([]);
    // No email was drafted or sent by any of this.
    expect(await prisma.emailLog.count({ where: { created_at: { gte: runStart } } })).toBe(0);
    expect(await prisma.gapAuditEvent.count({ where: { created_at: { gte: runStart }, OR: [{ kind: { contains: 'draft' } }, { kind: { contains: 'send' } }] } })).toBe(0);
  }, 180_000);

  it('item 2a: the routed card for Tom on the 75-day-old Tulsa story PREVIEWS through the real send route (the compiler reads the gate\'s clock)', async () => {
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const suppression = createClawdSuppressionReader();
    const routed = await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: new Date(), people: [{ personaId: tom.id, name: tom.name }] }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression, hubspotSnapshot: tamIn as never }) });
    expect(routed.ok, JSON.stringify(routed)).toBe(true);
    const decision = await prisma.routingDecision.findFirst({ where: { account_name: pepsi.name, persona_id: tom.id }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true, rule_id: true } });
    expect(decision, 'no routing decision for Tom').not.toBeNull();
    expect([decision!.lane, decision!.rule_id], JSON.stringify(decision)).not.toContain('evidence_thin');
    expect(['one_off_email', 'enroll_gap_sequence', 'call_now'], JSON.stringify(decision)).toContain(decision!.action);
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decision!.id}/send`, 'POST', {}), ctx(decision!.id));
    const body = (await res.json()) as { preview?: { to: string; body: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body.preview?.to).toBe(tom.email);
    expect(body.preview?.body).toMatch(/Tulsa/);
  }, 240_000);

  it('a stranded draft from the older path (no source_ref, unmapped family) is ADOPTED by the service, never twinned: the production repair shape', async () => {
    const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const kay = pepsi.people.find((p) => p.name.startsWith('Kay'))!;
    const fact = pepsi.facts.find((f) => f.label === 'gatik')!;
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: fact.id }, select: { title: true, evidence_text: true } });
    const observation = citedQuote(sig!.title, sig!.evidence_text!, fact.id, pepsi.name);
    // Exactly the production stranded shape (the recording): unmapped, no source_ref, the fact linked as supporting.
    const legacy = await proposeHypothesis(prisma, { accountName: pepsi.name, primaryPersonaId: kay.id, persona: 'transportation', problemFamily: 'unmapped', observation, problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.', rootCauseHypotheses: [], impactHypotheses: [], falsificationQuestions: ['How do trailers get checked in today?'], whatANoMeans: null, confidence: 40, signalIds: [fact.id], createdBy: 'casey@yardflow.ai' });
    if (!legacy.ok) throw new Error(JSON.stringify(legacy));
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    // The page shows it as a proposal missing one answer; answering adopts the same row and submits it.
    const { anchor } = await pageRead();
    const item = anchor.pending.find((x) => x.hypothesisId === legacy.id);
    expect(item).toMatchObject({ status: 'draft', familyKnown: false, personName: expect.stringMatching(/^Kay/) });
    const res = await POST(req('/api/gap/story/draft', 'POST', { ...draftBody(fact.id, kay.id, item!.observationRaw), problemFamily: 'automation_readiness' }));
    const body = (await res.json()) as { hypothesisId?: string; existing?: boolean; preparation?: string; family?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ hypothesisId: legacy.id, existing: true, preparation: 'submitted', family: 'automation_readiness' });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: legacy.id }, select: { status: true, problem_family: true, source_ref: true } });
    expect(row).toEqual({ status: 'review_required', problem_family: 'automation_readiness', source_ref: `anchor:${fact.id}:p${kay.id}` });
    const events = await prisma.hypothesisEvent.findMany({ where: { hypothesis_id: legacy.id }, select: { action: true }, orderBy: { created_at: 'asc' } });
    expect(events.map((e) => e.action)).toEqual(['propose', 'edit', 'submit']);
  }, 180_000);

  it('item 3: the stranded production shape (no source_ref, unmapped) posted with the page control payload (problemFamily null) is ADOPTED and its family DERIVED, then submitted', async () => {
    const { proposeHypothesis } = await import('@/lib/gap/hypothesis/service');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const kay = pepsi.people.find((p) => p.name.startsWith('Kay'))!;
    const fact = pepsi.facts.find((f) => f.label === 'tulsa')!;
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: fact.id }, select: { title: true, evidence_text: true } });
    const observation = citedQuote(sig!.title, sig!.evidence_text!, fact.id, pepsi.name);
    const legacy = await proposeHypothesis(prisma, { accountName: pepsi.name, primaryPersonaId: kay.id, persona: 'transportation', problemFamily: 'unmapped', observation, problemHypothesis: 'My guess is that this change moves load onto the gates, yards and docks they run.', rootCauseHypotheses: [], impactHypotheses: [], falsificationQuestions: ['How do trailers get checked in today?'], whatANoMeans: null, confidence: 40, signalIds: [fact.id], createdBy: 'casey@yardflow.ai' });
    if (!legacy.ok) throw new Error(JSON.stringify(legacy));
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    const res = await POST(req('/api/gap/story/draft', 'POST', draftBody(fact.id, kay.id, observation)));
    const body = (await res.json()) as { hypothesisId?: string; existing?: boolean; preparation?: string; family?: string; familyBasis?: string | null };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ hypothesisId: legacy.id, existing: true, preparation: 'submitted', family: 'hidden_capacity', familyBasis: expect.stringMatching(/closure or consolidation/) });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
    const row = await prisma.prospectingHypothesis.findUnique({ where: { id: legacy.id }, select: { status: true, problem_family: true, source_ref: true } });
    expect(row).toEqual({ status: 'review_required', problem_family: 'hidden_capacity', source_ref: `anchor:${fact.id}:p${kay.id}` });
  }, 180_000);

  it('a fact the send gate would refuse is never drafted (the layoff story is sensitive and not for outreach)', async () => {
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const fact = pepsi.facts.find((f) => f.label === 'maryland')!;
    const { anchor } = await pageRead();
    // The page never offers it as a draft (DO NOT USE), and the service refuses it if posted anyway.
    expect(anchor.draftable.map((x) => x.story)).not.toEqual(expect.arrayContaining([expect.stringMatching(/Maryland/)]));
    expect(anchor.doNotUse.map((x) => x.text)).toEqual(expect.arrayContaining([expect.stringMatching(/Maryland/)]));
    const before = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: fact.id }, select: { title: true, evidence_text: true } });
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const res = await POST(req('/api/gap/story/draft', 'POST', draftBody(fact.id, tom.id, citedQuote(sig!.title, sig!.evidence_text!, fact.id, pepsi.name))));
    // The gate admits the Maryland closure as a physical fact; the DO NOT USE rule is sensitivity, applied by the page.
    // Either answer is honest: refused by the gate, or drafted but never offered. What may not happen is a silent twin
    // of an existing proposal or an unmapped submit.
    const body = (await res.json()) as { preparation?: string; family?: string; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(409);
    expect(body).toEqual({ error: 'fact_not_outreach_evidence', detail: expect.stringMatching(/^sensitive:/) });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(before);
  }, 120_000);
  it('item 2: NOT THIS STORY sets the story aside for good: the next read does not offer it, and drafting it again is refused with the reason, never reported under review', async () => {
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const { registerSignal } = await import('@/lib/gap/signals/registry');
    const { VERIFIED_EXCERPT } = await import('@/lib/gap/research/evidence-gate');
    // Tom: his Tulsa thesis is in use (not under review), so the Columbus draft is a new proposal, never his open work.
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const columbus = await registerSignal(prisma, { accountName: pepsi.name, sourceKind: 'evidence_record', sourceId: `corpus:${pepsi.slug}:columbus`, type: 'site_expansion' as never, title: `${pepsi.name} to open Columbus distribution center`, sourceType: 'public_secondary', evidenceUrl: `https://news.example.com/${pepsi.slug}/columbus`, evidenceText: `${pepsi.name} is opening a new distribution center in Columbus, Ohio in 2027.`, externalOk: true, observedAt: new Date(Date.now() - 3 * 86_400_000), confidence: 80, metadata: { verified: VERIFIED_EXCERPT }, registeredBy: 'casey@freightroll.com' });
    const { anchor: before } = await pageRead();
    const d = before.draftable.find((x) => x.factId === columbus.id);
    expect(d, JSON.stringify(before.draftable.map((x) => x.story))).toBeDefined();
    const first = await POST(req('/api/gap/story/draft', 'POST', draftBody(columbus.id, tom.id, d!.proposedObservation)));
    const drafted = (await first.json()) as { hypothesisId?: string; preparation?: string; error?: string };
    expect(first.status, JSON.stringify(drafted)).toBe(201);
    const res = await PATCH(req(`/api/gap/hypotheses/${drafted.hypothesisId}`, 'PATCH', { action: 'withdraw', reason: 'not this story: a Columbus opening is not a yard question for Tom' }), ctx(drafted.hypothesisId!));
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    expect((await prisma.prospectingHypothesis.findUnique({ where: { id: drafted.hypothesisId! }, select: { status: true } }))?.status).toBe('rejected');
    const { anchor: after } = await pageRead();
    expect(after.draftable.map((x) => x.factId)).not.toContain(columbus.id);
    expect(after.tooOld.map((x) => x.factId)).not.toContain(columbus.id);
    expect(after.pending.map((x) => x.factId)).not.toContain(columbus.id);
    const countBefore = await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } });
    const again = await POST(req('/api/gap/story/draft', 'POST', draftBody(columbus.id, tom.id, d!.proposedObservation)));
    const body = (await again.json()) as { preparation?: string; error?: string; detail?: string };
    expect(again.status, JSON.stringify(body)).toBe(409);
    expect(body).toEqual({ error: 'story_set_aside', detail: 'You set this story aside (Not this story): GAP will not draft it again. A newer fact about it is a new story.' });
    expect(await prisma.prospectingHypothesis.count({ where: { account_name: pepsi.name } })).toBe(countBefore);
  }, 180_000);
});
