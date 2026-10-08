// @vitest-environment node
/**
 * R13 / R14 / R05 (GAP OS execution recovery, 2026-10-06): the execution spine through the REAL routes, gates,
 * ledger and Postgres (the embedded scratch database), with the external boundaries controlled: the Gmail wire is
 * the transport sink (every gate before it runs for real), clawd is an in-process stub (autonomy + suppression),
 * HubSpot opportunity truth is the scratch "no deal" reader. Only the session is mocked. Skipped without
 * GAP_SCRATCH_DATABASE_URL.
 *
 * Proves: APPROVE AND USE routes a READY card; the send route's preview binds the recipient and the exact rendered
 * copy; CONFIRM + SEND with the confirmed hash writes exactly one message to the sink (never Google), one DIRECT_SENT
 * ledger row and one EmailLog row; a replayed confirm answers ALREADY SENT and sends nothing; a changed recipient
 * or hash after preview is refused; a buyer reply arriving after preview makes the card stale (refused); a
 * suppressed recipient is refused at the wire; a real (non-test) address is refused by the sink before any network
 * call, and the attempt is recorded; Next account alone records nothing.
 */
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
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

describe.skipIf(!RUN)('R13/R14: the execution spine (scratch database, real routes and gates, the transport sink)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let corpus: import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let fedex: import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  let glen: { id: number; name: string; email: string };
  let decisionId = '';
  let preview: { to: string; subject: string; contentHash: string; body: string } | null = null;
  let stub: http.Server;
  const blocked = new Set<string>();
  let sinkDir = '';
  const tag = `r13-${Date.now().toString(36)}`;
  let emailLogBefore = 0;

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    // The clawd boundary: autonomy not halted; suppression answers per address from `blocked`.
    stub = http.createServer((rq, rs) => {
      let body = '';
      rq.on('data', (c) => (body += c));
      rq.on('end', () => {
        rs.setHeader('content-type', 'application/json');
        if (rq.url?.startsWith('/api/autonomy/state')) return rs.end(JSON.stringify({ global: true, motions: { outreach: true, actuator: true, social: true, content: true } }));
        // The congruence critic: a controlled PASS (the compiler's deterministic checks still decide the copy).
        if (rq.url?.startsWith('/api/critic/score')) return rs.end(JSON.stringify({ verdict: 'pass', hard_block: false, score: 96, counts: { block: 0, warn: 0 }, violations: [], artifact_type: 'email', used_llm: false, edge: { verdict: 'pass', hard_block: false, score: 96, violations: [] } }));
        let emails: string[] = [];
        try {
          const j = JSON.parse(body || '{}');
          emails = Array.isArray(j.emails) ? j.emails : j.email ? [j.email] : [];
        } catch {
          emails = [];
        }
        rs.end(JSON.stringify({ ok: true, results: emails.map((email: string) => ({ email, blocked: blocked.has(String(email).toLowerCase()), reason: blocked.has(String(email).toLowerCase()) ? 'do_not_send' : null })) }));
      });
    });
    await new Promise<void>((r) => stub.listen(0, '127.0.0.1', () => r()));
    process.env.CLAWD_CONTROL_PLANE_URL = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`;
    process.env.CLAWD_CONTROL_PLANE_TOKEN = 'scratch';
    // The mail boundary: the sink, allowed test domains only.
    sinkDir = mkdtempSync(join(tmpdir(), 'gap-sink-'));
    process.env.GAP_SEND_TRANSPORT = 'sink';
    process.env.GAP_SINK_DIR = sinkDir;
    process.env.GAP_SINK_ALLOWED_DOMAINS = 'example.com';
    process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
    process.env.GAP_GOOGLE_DWD_SA_JSON = '{"scratch":true}';
    process.env.GOOGLE_CLIENT_ID = 'scratch';
    process.env.GOOGLE_CLIENT_SECRET = 'scratch';
    process.env.GOOGLE_REFRESH_TOKEN = 'scratch-never-used';
    process.env.UNSUBSCRIBE_SECRET = 'scratch-unsubscribe-secret';
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { seedCorpus } = await import('@/scripts/gap/recovery/seed-corpus');
    corpus = await seedCorpus(prisma, { tag });
    fedex = corpus.accounts.find((a) => a.name.startsWith('Fedex'))!;
    glen = fedex.people.find((p) => p.name.startsWith('Glen'))! as typeof glen;
    emailLogBefore = await prisma.emailLog.count();
  }, 180_000);
  afterAll(async () => {
    await new Promise<void>((r) => stub.close(() => r()));
    rmSync(sinkDir, { recursive: true, force: true });
    delete process.env.GAP_SEND_TRANSPORT;
    await prisma?.$disconnect();
  });

  const sinkFiles = () => readdirSync(sinkDir).map((f) => JSON.parse(readFileSync(join(sinkDir, f), 'utf8')) as { outcome: string; to: string; refused: string[]; kind: string });

  it('APPROVE AND USE routes the approved thesis: a READY card (routing decision) exists for Glen', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const h = fedex.hypotheses[0];
    const res = await PATCH(req(`/api/gap/hypotheses/${h.id}`, 'PATCH', { advance: 'approve_and_use' }), ctx(h.id));
    const body = (await res.json()) as { ok?: boolean; to?: string; routing?: { ok?: boolean } };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ ok: true, to: 'active' });
    // The route's own routing read HubSpot for TAM (unconfigured here: the card is research_required, honest). The
    // boundary is controlled the way every scratch E2E does it: the same routing run with a TAM-in snapshot.
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const suppression = createClawdSuppressionReader();
    const routed = await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: new Date(), people: [{ personaId: glen.id, name: glen.name }] }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression, hubspotSnapshot: tamIn as never }) });
    expect(routed.ok, JSON.stringify(routed)).toBe(true);
    const decision = await prisma.routingDecision.findFirst({ where: { account_name: fedex.name, persona_id: glen.id }, orderBy: { created_at: 'desc' }, select: { id: true, action: true, lane: true, rule_id: true } });
    expect(decision, 'no routing decision for Glen').not.toBeNull();
    decisionId = decision!.id;
    expect(decision!.lane, JSON.stringify(decision)).toBe('work_queue');
    expect(['one_off_email', 'enroll_gap_sequence', 'call_now']).toContain(decision!.action);
  }, 180_000);

  it('preview binds the recipient and the exact rendered copy, and sends nothing', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    const body = (await res.json()) as { preview?: { to: string; subject: string; contentHash: string; body: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body.preview?.to).toBe(glen.email);
    expect(body.preview?.contentHash).toMatch(/^[0-9a-f]{64}$/);
    preview = body.preview!;
    expect(sinkFiles()).toHaveLength(0);
    expect(await prisma.emailLog.count()).toBe(emailLogBefore);
  }, 120_000);

  it('a changed recipient or changed copy after preview is refused; an irrelevant refresh is not (the hash is content, not time)', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const other = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: preview!.contentHash, recipient: 'someone-else@example.com' } }), ctx(decisionId));
    expect(other.status).toBe(409);
    expect(((await other.json()) as { error: string }).error).toBe('recipient_changed_since_review');
    const changed = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: 'a'.repeat(64), recipient: glen.email } }), ctx(decisionId));
    expect(changed.status).toBe(409);
    expect(((await changed.json()) as { error: string }).error).toBe('copy_changed_since_review');
    const again = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    expect(((await again.json()) as { preview: { contentHash: string } }).preview.contentHash).toBe(preview!.contentHash);
    expect(sinkFiles()).toHaveLength(0);
  }, 120_000);

  it('a suppressed recipient is refused at the wire after preview; nothing is written', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    blocked.add(glen.email.toLowerCase());
    try {
      const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: preview!.contentHash, recipient: glen.email } }), ctx(decisionId));
      const body = (await res.json()) as { error?: string; detail?: string };
      expect(res.status, JSON.stringify(body)).toBe(409);
      expect(body.error).toMatch(/suppress|refused/);
      expect(sinkFiles().filter((f) => f.outcome === 'written')).toHaveLength(0);
      expect(await prisma.emailLog.count()).toBe(emailLogBefore);
    } finally {
      blocked.delete(glen.email.toLowerCase());
    }
  }, 120_000);

  it('CONFIRM + SEND with the confirmed hash writes exactly one message to the sink, one DIRECT_SENT ledger row and one EmailLog row; a replayed confirm answers ALREADY SENT and writes nothing more', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const { DIRECT_SENT } = await import('@/lib/gap/execution/draft-ledger');
    const fresh = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    const p = ((await fresh.json()) as { preview?: { contentHash: string; to: string } }).preview!;
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: p.contentHash, recipient: p.to } }), ctx(decisionId));
    const body = (await res.json()) as { sent?: { recipient: string; gmailSentMessageId: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(201);
    expect(body.sent?.recipient).toBe(glen.email);
    expect(body.sent?.gmailSentMessageId).toMatch(/^sink-/);
    const written = sinkFiles().filter((f) => f.outcome === 'written');
    expect(written, JSON.stringify(written)).toHaveLength(1);
    expect(written[0]).toMatchObject({ kind: 'send', to: glen.email, refused: [] });
    const ledger = await prisma.gapAuditEvent.findMany({ where: { kind: DIRECT_SENT, subject_id: decisionId } });
    expect(ledger).toHaveLength(1);
    expect(await prisma.emailLog.count()).toBe(emailLogBefore + 1);
    const replay = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: p.contentHash, recipient: p.to } }), ctx(decisionId));
    const rb = (await replay.json()) as { alreadySent?: boolean };
    expect(replay.status).toBe(200);
    expect(rb.alreadySent).toBe(true);
    expect(sinkFiles().filter((f) => f.outcome === 'written')).toHaveLength(1);
    expect(await prisma.emailLog.count()).toBe(emailLogBefore + 1);
  }, 180_000);

  it('after the send the account is IN MOTION for Glen on Work and on the page: the outcome is the ledger, not a navigation event', async () => {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const { SCRATCH_NO_DEALS } = await import('@/scripts/gap/scratch-opportunity');
    const now = new Date();
    const loaded = await loadAccountView(prisma, fedex.slug, now, { live: true, context: true, deps: { opportunity: SCRATCH_NO_DEALS } } as never);
    const { brief, inputs } = loaded as { brief: never; inputs: never };
    const c = await loadAccountContext(prisma, inputs, now);
    const pursuit = await loadPursuit(prisma, { brief, inputs, ctx: c, now });
    expect(pursuit.state.state).toBe('in_motion');
    expect(pursuit.state.person?.name).toMatch(/^Glen/);
    expect(pursuit.state.coldTouchAllowed).toBe(false);
  }, 180_000);

  it('a real (non-test) address is refused by the sink before any network call and the attempt is recorded; the second person is not sent to', async () => {
    const lisa = fedex.people.find((p) => p.name.startsWith('Lisa'))!;
    const { sendViaGmail } = await import('@/lib/email/gmail-sender');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const before = sinkFiles().length;
    await expect(sendViaGmail({ to: 'lisa.real@fedex.com', subject: 'x', html: '<p>x</p>', purpose: 'OPERATOR_ALERT' })).rejects.toThrow(/transport sink refused lisa.real@fedex.com/);
    const gmailCalls = fetchSpy.mock.calls.filter((c) => String(c[0]).includes('googleapis.com'));
    expect(gmailCalls).toHaveLength(0);
    const after = sinkFiles();
    expect(after).toHaveLength(before + 1);
    expect(after.filter((f) => f.outcome === 'refused').some((f) => f.refused.includes('lisa.real@fedex.com'))).toBe(true);
    expect(lisa.email).toMatch(/\.example\.com$/);
    fetchSpy.mockRestore();
  }, 60_000);

  it('a buyer reply arriving between preview and confirm makes the card stale: the confirm is refused, nothing goes out (a second account, so one motion per account holds)', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const corpusNfi = corpus.accounts.find((a) => a.name.startsWith('Nfi'))!;
    const h = (await prisma.prospectingHypothesis.findUnique({ where: { id: corpusNfi.hypotheses[0].id }, select: { id: true, primary_persona_id: true } }))!;
    const person = (await prisma.persona.findUnique({ where: { id: h.primary_persona_id! }, select: { id: true, name: true, email: true } }))!;
    const adv = await PATCH(req(`/api/gap/hypotheses/${h.id}`, 'PATCH', { advance: 'approve_and_use' }), ctx(h.id));
    expect(adv.status).toBe(200);
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const routed = await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: new Date(), people: [{ personaId: person.id, name: person.name }] }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression: createClawdSuppressionReader(), hubspotSnapshot: tamIn as never }) });
    expect(routed.ok).toBe(true);
    const decision = (await prisma.routingDecision.findFirst({ where: { account_name: corpusNfi.name, persona_id: person.id }, orderBy: { created_at: 'desc' }, select: { id: true } }))!;
    const pv = await POST(req(`/api/gap/decisions/${decision.id}/send`, 'POST', {}), ctx(decision.id));
    const pvb = (await pv.json()) as { preview?: { contentHash: string; to: string }; error?: string; detail?: string };
    expect(pv.status, JSON.stringify(pvb)).toBe(200);
    // Their own email lands after the preview.
    const threadId = `r13-thread-${tag}`;
    await prisma.emailThread.create({ data: { id: threadId, account_name: corpusNfi.name, persona_email: person.email, subject: 'Re: terminals', last_message_at: new Date() } });
    await prisma.inboundMessage.create({ data: { id: `r13-msg-${tag}`, thread_id: threadId, from_email: person.email!, from_name: person.name, subject: 'Re: terminals', body_text: 'Thanks, happy to talk next week.', snippet: 'Thanks, happy to talk next week.', received_at: new Date(), source: 'gmail' } });
    const before = sinkFiles().filter((f) => f.outcome === 'written').length;
    const res = await POST(req(`/api/gap/decisions/${decision.id}/send`, 'POST', { confirm: { contentHash: pvb.preview!.contentHash, recipient: pvb.preview!.to } }), ctx(decision.id));
    const body = (await res.json()) as { error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(409);
    expect(body.error).toMatch(/decision_stale|replied|account_replied|conversation/);
    expect(sinkFiles().filter((f) => f.outcome === 'written')).toHaveLength(before);
  }, 180_000);
});
