// @vitest-environment node
/**
 * Batch item 6, R34 (2026-10-07): no advertised action the system cannot complete. Through the REAL routes, services,
 * routing, queue and Postgres (the embedded scratch database); the session is mocked, clawd is an in-process stub,
 * HubSpot TAM and opportunity are the scratch "no deal" answers. Skipped without GAP_SCRATCH_DATABASE_URL.
 *
 * Proves: (1) a thesis whose family has no installed copy is refused at approval, the family named; (2) a thesis
 * approved while its copy existed, whose copy family is then gone (production before the seed), is never READY: Work's
 * card is a missing prerequisite naming the family, the page says which copy family to seed, and the send route refuses
 * with its own reason. The archived families are restored at the end.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const SCRATCH_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:(?:5433\/gap_dev|55432\/gap_finish_e2e)(?:\?.*)?$/;
const URL_ = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
const RUN = SCRATCH_URL.test(URL_);

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});
vi.mock('@/lib/gap/enroll/service', async (orig) => {
  const mod = await orig<Record<string, unknown>>();
  return { ...mod, checkActiveOpportunityNow: async () => ({ status: 'CLEAR' }) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe.skipIf(!RUN)('R34: copy readiness end to end (scratch database, the real routes, queue and pursuit)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let pepsi: import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  let stub: http.Server;
  const tag = `r34c-${Date.now().toString(36)}`;
  let archived: string[] = [];

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    pepsi = (await seedCorpus(prisma, { tag })).accounts.find((a) => a.name.startsWith('Pepsi'))!;
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
  }, 180_000);
  afterAll(async () => {
    // Restore the seeded copy this file archived (other scratch files share the database).
    if (archived.length) await prisma.sequenceFamily.updateMany({ where: { id: { in: archived } }, data: { archived_at: null } });
    await new Promise<void>((r) => (stub ? stub.close(() => r()) : r()));
    await prisma?.$disconnect();
  });

  async function draft(personaId: number, title: string | null, problemFamily: string | null) {
    const { storyDraftPayload } = await import('@/lib/gap/story/draft-defaults');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const fact = pepsi.facts.find((f) => f.label === 'tulsa')!;
    const sig = await prisma.prospectingSignal.findUnique({ where: { id: fact.id }, select: { title: true, evidence_text: true } });
    const res = await POST(req('/api/gap/story/draft', 'POST', storyDraftPayload({ accountName: pepsi.name, factId: fact.id, claimClass: null, proposedObservation: citedQuote(sig!.title, sig!.evidence_text!, fact.id, pepsi.name), person: { personaId, title }, problemFamily, factText: sig!.evidence_text })));
    return (await res.json()) as { hypothesisId?: string; preparation?: string; error?: string };
  }
  const advance = async (id: string) => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${id}`, 'PATCH', { advance: 'approve_and_use' }), ctx(id));
    return { status: res.status, body: (await res.json()) as { ok?: boolean; reason?: string; detail?: string; to?: string } };
  };

  it('a thesis on a family with no installed copy is refused at approval, the family named; nothing moves', async () => {
    const kay = pepsi.people.find((p) => p.name.startsWith('Kay'))!;
    const d = await draft(kay.id, kay.title, 'yard_state_integrity');
    expect(d.preparation, JSON.stringify(d)).toBe('submitted');
    const r = await advance(d.hypothesisId!);
    expect(r.status, JSON.stringify(r.body)).toBe(409);
    expect(r.body).toMatchObject({ ok: false, reason: 'copy_not_installed', detail: 'approve refused: copy_not_installed: No first-touch copy is installed for yard state integrity (no copy family written): seed that copy family before this thesis can open an email. Nothing goes out.' });
    expect((await prisma.prospectingHypothesis.findUnique({ where: { id: d.hypothesisId! }, select: { status: true } }))?.status).toBe('review_required');
  }, 180_000);

  it('a thesis approved while its copy existed, whose copy family is then gone: never READY on Work or the page, the send route refuses', async () => {
    const tom = pepsi.people.find((p) => p.name.startsWith('Tom'))!;
    const d = await draft(tom.id, tom.title, null);
    const r = await advance(d.hypothesisId!);
    expect([r.status, r.body.to], JSON.stringify(r.body)).toEqual([200, 'active']);
    // Production before the seed: the Hidden Capacity copy family is not installed.
    archived = (await prisma.sequenceFamily.findMany({ where: { problem_family: 'hidden_capacity', archived_at: null }, select: { id: true } })).map((f) => f.id);
    expect(archived.length).toBeGreaterThan(0);
    await prisma.sequenceFamily.updateMany({ where: { id: { in: archived } }, data: { archived_at: new Date() } });
    // Routing makes the card as it would in production (TAM in, no deal).
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const suppression = createClawdSuppressionReader();
    await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: new Date(), people: [{ personaId: tom.id, name: tom.name }] }, { run: (p, o, dd) => runRouting(p, o, { ...dd, suppression, hubspotSnapshot: tamIn as never }) });
    const decision = await prisma.routingDecision.findFirst({ where: { account_name: pepsi.name, persona_id: tom.id }, orderBy: { created_at: 'desc' }, select: { id: true, action: true } });
    expect(['one_off_email', 'enroll_gap_sequence'], JSON.stringify(decision)).toContain(decision!.action);
    // WORK: the card carries the copy read and is a missing prerequisite naming the family, never the ready lane.
    const { listAllCurrent } = await import('@/lib/gap/routing/queue');
    const { cardReadiness, sellerLaneOf } = await import('@/lib/gap/routing/card-readiness');
    const item = (await listAllCurrent(prisma)).items.find((i) => i.id === decision!.id)!;
    expect(item.copy).toEqual({ installed: false, detail: 'No first-touch copy is installed for Hidden Capacity: seed that copy family before this thesis can open an email. Nothing goes out.' });
    const readiness = cardReadiness({ ...item, action: String(item.action), touch: item.touch ?? null });
    expect(readiness).toMatchObject({ state: 'missing_prerequisite', missing: expect.stringMatching(/^No first-touch copy is installed for Hidden Capacity/) });
    expect(sellerLaneOf({ ...item, action: String(item.action), touch: item.touch ?? null })).not.toBe('ready');
    // THE PAGE: the pursuit read says which copy family to seed.
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const { SCRATCH_NO_DEALS } = await import('@/scripts/gap/scratch-opportunity');
    const now = new Date();
    const loaded = (await loadAccountView(prisma, pepsi.slug, now, { live: true, context: true, deps: { opportunity: SCRATCH_NO_DEALS } } as never)) as { brief: never; inputs: never };
    const pctx = await loadAccountContext(prisma, loaded.inputs, now);
    const pursuit = await loadPursuit(prisma, { brief: loaded.brief, inputs: loaded.inputs, ctx: pctx, now });
    expect(pursuit.state.state).toBe('research');
    expect(pursuit.state.stateLine).toBe('Research: no first-touch copy is installed for Hidden Capacity');
    expect(pursuit.usableTheses).toEqual([]);
    // THE SEND ROUTE: refused for its own reason, nothing sent.
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decision!.id}/send`, 'POST', {}), ctx(decision!.id));
    const body = (await res.json()) as { error?: string };
    expect([res.status, body.error]).toEqual([409, 'no_version']);
  }, 300_000);

  // Batch item 7: a failed loadSendableTheses read kept the account READY. An unread send gate opens nothing.
  it('the send gate cannot be read: the page that was READY is research, saying why; nothing is called usable', async () => {
    if (archived.length) await prisma.sequenceFamily.updateMany({ where: { id: { in: archived } }, data: { archived_at: null } });
    archived = [];
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const { SCRATCH_NO_DEALS } = await import('@/scripts/gap/scratch-opportunity');
    const now = new Date();
    const loaded = (await loadAccountView(prisma, pepsi.slug, now, { live: true, context: true, deps: { opportunity: SCRATCH_NO_DEALS } } as never)) as { brief: never; inputs: never };
    const pctx = await loadAccountContext(prisma, loaded.inputs, now);
    const readable = await loadPursuit(prisma, { brief: loaded.brief, inputs: loaded.inputs, ctx: pctx, now });
    expect(['ready', 'choose_person'], readable.state.stateLine).toContain(readable.state.state);
    expect(readable.usableTheses.length).toBeGreaterThan(0);
    // Only the send-gate read fails (the open theses with their linked signals); every other read answers.
    const hyp = prisma.prospectingHypothesis;
    const failingHyp = new Proxy(hyp, {
      get(m, k) {
        if (k === 'findMany') {
          return async (args: { where?: { superseded_by?: unknown }; select?: { signals?: unknown } }) => {
            if (args?.where?.superseded_by && args?.select?.signals) throw new Error('read timed out');
            return hyp.findMany(args as never);
          };
        }
        const v = Reflect.get(m, k);
        return typeof v === 'function' ? v.bind(m) : v;
      },
    });
    const failing = new Proxy(prisma, {
      get(t, k) {
        if (k === 'prospectingHypothesis') return failingHyp;
        const v = Reflect.get(t, k);
        return typeof v === 'function' ? v.bind(t) : v;
      },
    });
    const unread = await loadPursuit(failing as never, { brief: loaded.brief, inputs: loaded.inputs, ctx: pctx, now });
    expect(unread.sendableTheses).toBeNull();
    expect(unread.state).toMatchObject({ state: 'research', stateLine: 'Research: whether a thesis can open an email could not be read just now', coldTouchAllowed: false });
    expect(unread.state.blocker).toBe(`The send gate could not be read for ${pepsi.name} just now. Nothing goes out until it can be; reload in a moment.`);
    expect(unread.usableTheses).toEqual([]);
    expect(unread.hypothesisId).toBeNull();
    expect(unread.ready).toBeNull();
  }, 300_000);
});
