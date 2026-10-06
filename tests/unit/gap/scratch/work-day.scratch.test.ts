// @vitest-environment node
/**
 * SPRINT 4 (GAP OS execution recovery, R40-R45): execute a day and remember what happened, through the REAL routes,
 * services, ledger and Postgres (the embedded scratch database), with the external boundaries controlled: the Gmail
 * wire is the transport sink (every gate before it runs for real), clawd is an in-process stub (autonomy,
 * suppression, the critic), HubSpot opportunity truth is a controlled reader (CLEAR, or an open deal when a case
 * says so). Only the session is mocked. Skipped without GAP_SCRATCH_DATABASE_URL. Counts are per account and
 * recipient (never global), so the file runs beside the other scratch files.
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
/** HubSpot opportunity truth at the click: CLEAR unless a case opens a deal for an account. */
const deals = vi.hoisted(() => ({ open: new Set<string>() }));
vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => session.value) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});
vi.mock('@/lib/gap/enroll/service', async (orig) => {
  const mod = await orig<Record<string, unknown>>();
  return { ...mod, checkActiveOpportunityNow: async (_p: unknown, accountName: string) => (deals.open.has(accountName) ? { status: 'ACTIVE', detail: `An open HubSpot deal at ${accountName} (scratch reader).` } : { status: 'CLEAR' }) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const ACTOR = 'casey@freightroll.com';

describe.skipIf(!RUN)('Sprint 4: execute a day and remember what happened (scratch database, real routes and gates, the transport sink)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  type Corpus = import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let corpus: Corpus;
  let second: Corpus;
  let stub: http.Server;
  let sinkDir = '';
  const tag = `s4-${Date.now().toString(36)}`;
  const account = (c: Corpus, base: string) => c.accounts.find((a) => a.name.startsWith(base))!;

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED', 'GAP_MESSAGE_COMPILER_ENABLED', 'GAP_REPLY_CLASSIFICATION_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
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
    sinkDir = mkdtempSync(join(tmpdir(), 'gap-sink-s4-'));
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
    second = await seedCorpus(prisma, { tag: `${tag}b` });
  }, 240_000);
  afterAll(async () => {
    delete process.env.GAP_SINK_FAULT;
    await new Promise<void>((r) => stub.close(() => r()));
    rmSync(sinkDir, { recursive: true, force: true });
    delete process.env.GAP_SEND_TRANSPORT;
    await prisma?.$disconnect();
  });

  const sinkFiles = () => readdirSync(sinkDir).map((f) => JSON.parse(readFileSync(join(sinkDir, f), 'utf8')) as { outcome: string; to: string; kind: string; at: string });
  const writtenTo = (to: string) => sinkFiles().filter((f) => f.outcome === 'written' && f.to === to).length;

  /** APPROVE AND USE through the real route, then the same routing run with a TAM-in snapshot (the controlled boundary). */
  async function useAndRoute(a: { name: string; hypotheses: Array<{ id: string }> }, personaId: number, personName: string): Promise<string> {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const h = a.hypotheses[0];
    const res = await PATCH(req(`/api/gap/hypotheses/${h.id}`, 'PATCH', { advance: 'approve_and_use' }), ctx(h.id));
    expect(res.status, JSON.stringify(await res.clone().json())).toBe(200);
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const routed = await routeAfterUse(prisma, { actor: ACTOR, now: new Date(), people: [{ personaId, name: personName }] }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression: createClawdSuppressionReader(), hubspotSnapshot: tamIn as never }) });
    expect(routed.ok, JSON.stringify(routed)).toBe(true);
    const decision = await prisma.routingDecision.findFirst({ where: { account_name: a.name, persona_id: personaId }, orderBy: { created_at: 'desc' }, select: { id: true } });
    expect(decision, `no routing decision at ${a.name}`).not.toBeNull();
    return decision!.id;
  }
  async function previewOf(decisionId: string) {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    const body = (await res.json()) as { preview?: { to: string; contentHash: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    return body.preview!;
  }
  async function confirm(decisionId: string, p: { to: string; contentHash: string }) {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: p.contentHash, recipient: p.to } }), ctx(decisionId));
    return { status: res.status, body: (await res.json()) as { error?: string; detail?: string; alreadySent?: boolean; sent?: { gmailSentMessageId: string } } };
  }

  describe('R43: follow-up execution and recovery', () => {
    it('two browsers confirm the same email at the same moment: exactly one message leaves, one ledger row, one EmailLog row', async () => {
      const fedex = account(corpus, 'Fedex');
      const glen = fedex.people.find((p) => p.name.startsWith('Glen'))!;
      const decisionId = await useAndRoute(fedex, glen.id, glen.name);
      const p = await previewOf(decisionId);
      // Three tabs press CONFIRM + SEND together. Whatever the interleaving, exactly one is sent and every other one is
      // refused by whichever gate first sees the winner (the person lock's open claim, the ledger, the stale-card read
      // of the EmailLog, the mailbox Sent read) or answered ALREADY SENT; none reaches the wire.
      const all = await Promise.all([confirm(decisionId, p), confirm(decisionId, p), confirm(decisionId, p)]);
      expect(all.filter((r) => r.status === 201), JSON.stringify(all)).toHaveLength(1);
      for (const other of all.filter((r) => r.status !== 201)) {
        expect(other.body.alreadySent === true || ['send_in_progress_or_unknown', 'decision_stale', 'first_touch_already_sent', 'account_motion_active', 'emailed_outside_gap'].includes(other.body.error ?? ''), JSON.stringify(other)).toBe(true);
      }
      expect(writtenTo(glen.email)).toBe(1);
      const { DIRECT_SENT } = await import('@/lib/gap/execution/draft-ledger');
      expect(await prisma.gapAuditEvent.count({ where: { kind: DIRECT_SENT, subject_id: decisionId } })).toBe(1);
      expect(await prisma.emailLog.count({ where: { to_email: glen.email } })).toBe(1);
    }, 240_000);

    it('the provider accepted the send and the answer was lost: the claim stays open, the retry is refused (never resent), and the Sent read reconciles it to ALREADY SENT', async () => {
      const nfi = account(corpus, 'Nfi');
      const h = (await prisma.prospectingHypothesis.findUnique({ where: { id: nfi.hypotheses[0].id }, select: { primary_persona_id: true } }))!;
      const person = nfi.people.find((x) => x.id === h.primary_persona_id)!;
      const decisionId = await useAndRoute(nfi, person.id, person.name);
      const p = await previewOf(decisionId);
      process.env.GAP_SINK_FAULT = 'timeout_after_write';
      let lost: Awaited<ReturnType<typeof confirm>>;
      try {
        lost = await confirm(decisionId, p);
      } finally {
        delete process.env.GAP_SINK_FAULT;
      }
      expect(lost.status, JSON.stringify(lost)).toBe(409);
      expect(lost.body.error).toBe('send_in_progress_or_unknown');
      expect(writtenTo(person.email)).toBe(1);
      const retry = await confirm(decisionId, p);
      expect(retry.body.error, JSON.stringify(retry)).toBe('send_in_progress_or_unknown');
      expect(writtenTo(person.email)).toBe(1);
      const { reconcileUnknownSends } = await import('@/lib/gap/execution/unknown-send-reconcile');
      const { sinkConfig, sinkSentTo } = await import('@/lib/email/transport-sink');
      const later = new Date(Date.now() + 11 * 60_000);
      const report = await reconcileUnknownSends(prisma, { now: later }, { listSent: async (r, x, y) => sinkSentTo(sinkConfig()!, r, x, y), mailbox: 'casey@yardflow.ai' });
      expect(report.reconciled, JSON.stringify(report)).toBeGreaterThanOrEqual(1);
      const after = await confirm(decisionId, p);
      expect(after.status, JSON.stringify(after)).toBe(200);
      expect(after.body.alreadySent).toBe(true);
      expect(writtenTo(person.email)).toBe(1);
    }, 240_000);

    it('a deal opens between preview and send: the confirm is refused for the deal and nothing leaves', async () => {
      const fedex = account(second, 'Fedex');
      const glen = fedex.people.find((p) => p.name.startsWith('Glen'))!;
      const decisionId = await useAndRoute(fedex, glen.id, glen.name);
      const p = await previewOf(decisionId);
      deals.open.add(fedex.name);
      try {
        const r = await confirm(decisionId, p);
        expect(r.status, JSON.stringify(r)).toBe(409);
        expect(r.body.error).toBe('active_opportunity');
      } finally {
        deals.open.delete(fedex.name);
      }
      expect(writtenTo(glen.email)).toBe(0);
    }, 240_000);

    it('every proven send leaves one waiting follow-up for that person on the next Work read, and re-reading never makes a second', async () => {
      const { syncFollowUpsFromLedger, loadCommitments } = await import('@/lib/gap/work/commitments');
      const fedex = account(corpus, 'Fedex');
      await syncFollowUpsFromLedger(prisma, new Date());
      await syncFollowUpsFromLedger(prisma, new Date());
      const fus = (await loadCommitments(prisma, { accountNames: [fedex.name] })).filter((c) => c.kind === 'follow_up');
      expect(fus).toHaveLength(1);
      expect(fus[0]).toMatchObject({ status: 'waiting', person: { email: fedex.people.find((p) => p.name.startsWith('Glen'))!.email }, detail: { stepIndex: 1, noFollowUpCopy: true } });
    }, 120_000);
  });
});
