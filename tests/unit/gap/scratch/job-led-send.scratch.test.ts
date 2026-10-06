// @vitest-environment node
/**
 * R34 (GAP OS execution recovery, 2026-10-06): a job-led thesis goes from a verified job posting to a message in the
 * sink through the REAL routes, services, machine, compiler, gates, ledger and Postgres (the embedded scratch
 * database). Controlled boundaries only: the session, the clawd stub (autonomy, suppression, the critic), the
 * scratch "no deal" opportunity reader, routing's TAM-in snapshot, and the transport sink as the mailbox. Skipped
 * without GAP_SCRATCH_DATABASE_URL. The approach families must be seeded (scripts/gap/seed-families.ts --apply).
 *
 * Proves: the draft from the posting declares job_procurement_led; APPROVE AND USE activates it and routing makes a
 * card; the preview renders from the JOB family (its subject), carries the posting's exact quote and ONE question,
 * and none of the physical-change words; CONFIRM + SEND writes exactly one message to the sink whose MIME body is
 * that copy; an event-led thesis at another account still renders from its event-led family.
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
vi.mock('@/lib/gap/enroll/service', async (orig) => {
  const mod = await orig<Record<string, unknown>>();
  return { ...mod, checkActiveOpportunityNow: async () => ({ status: 'CLEAR' }) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const PHYSICAL = /\b(when a network grows|grows like that|volume moves|new or acquired sites|automation plans|doors versus spots|one question on the network|the new sites|before the robots)\b/i;

describe.skipIf(!RUN)('R34: a job-led thesis, posting to sink (scratch database, real routes and gates)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let tyson: import('@/scripts/gap/recovery/seed-corpus').CorpusAccount;
  let corpus: import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let rae: { id: number; name: string; email: string };
  let posting: { id: string; text: string; title: string };
  let hypothesisId = '';
  let decisionId = '';
  let stub: http.Server;
  let sinkDir = '';
  const tag = `r34-${Date.now().toString(36)}`;

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
    sinkDir = mkdtempSync(join(tmpdir(), 'gap-sink-r34-'));
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
    tyson = corpus.accounts.find((a) => a.name.startsWith('Tyson'))!;
    rae = tyson.people.find((p) => p.name.startsWith('Rae'))! as typeof rae;
    const row = (await prisma.prospectingSignal.findUnique({ where: { id: tyson.facts[0].id }, select: { id: true, evidence_text: true, title: true, claim_class: true } }))!;
    expect(row.claim_class).toBe('JOB_POSTING');
    posting = { id: row.id, text: row.evidence_text!, title: row.title };
    const { APPROACH_PROGRAM } = await import('@/lib/gap/sequences/families');
    const seeded = await prisma.sequenceFamily.findFirst({ where: { program: APPROACH_PROGRAM.job_procurement_led, archived_at: null }, select: { id: true } });
    expect(seeded, 'the job family is not seeded on the scratch database: run scripts/gap/seed-families.ts --apply').not.toBeNull();
  }, 180_000);
  afterAll(async () => {
    await new Promise<void>((r) => stub.close(() => r()));
    rmSync(sinkDir, { recursive: true, force: true });
    delete process.env.GAP_SEND_TRANSPORT;
    await prisma?.$disconnect();
  });

  const sinkFiles = () => readdirSync(sinkDir).map((f) => JSON.parse(readFileSync(join(sinkDir, f), 'utf8')) as { outcome: string; to: string; subject: string | null; raw: string | null; kind: string });

  it('the draft from the posting is a job-led thesis, submitted for review in one call', async () => {
    const { POST } = await import('@/app/api/gap/story/draft/route');
    const { citedQuote } = await import('@/lib/gap/research/propose');
    const res = await POST(req('/api/gap/story/draft', 'POST', {
      accountName: tyson.name,
      factId: posting.id,
      personaId: rae.id,
      persona: 'transportation',
      observation: citedQuote(posting.title, posting.text, posting.id, tyson.name),
      problemHypothesis: 'My guess is that the yards are where the day gets lost at the Amarillo distribution center.',
      falsificationQuestions: ['Is the posting still open?'],
      whatANoMeans: 'If the role is filled or about something else, there is no yard question here: the thesis closes.',
      problemFamily: 'yard_state_integrity',
    }));
    const body = (await res.json()) as { ok?: boolean; hypothesisId?: string; preparation?: string; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBeLessThan(300);
    expect(body.preparation, JSON.stringify(body)).toBe('submitted');
    hypothesisId = body.hypothesisId!;
    const h = await prisma.prospectingHypothesis.findUnique({ where: { id: hypothesisId }, select: { status: true, metadata: true } });
    expect(h?.status).toBe('review_required');
    expect((h?.metadata as { approach?: string }).approach).toBe('job_procurement_led');
  }, 120_000);

  it('APPROVE AND USE activates it and routing makes a card for Rae', async () => {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${hypothesisId}`, 'PATCH', { advance: 'approve_and_use' }), ctx(hypothesisId));
    const body = (await res.json()) as { ok?: boolean; to?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    expect(body).toMatchObject({ ok: true, to: 'active' });
    const { routeAfterUse } = await import('@/lib/gap/routing/interactive');
    const { runRouting } = await import('@/lib/gap/routing/run');
    const { createClawdSuppressionReader } = await import('@/lib/gap/routing/suppression-read');
    const { SCRATCH_NO_DEALS_TRUTH } = await import('@/scripts/gap/scratch-opportunity');
    const tamIn = async () => ({ tam: 'in' as const, tamTier: 'A', intentScore: 60, lastIntentAt: new Date(), triggerScore: null, lastTriggerAt: null, opportunity: SCRATCH_NO_DEALS_TRUTH });
    const routed = await routeAfterUse(prisma, { actor: 'casey@freightroll.com', now: new Date(), people: [{ personaId: rae.id, name: rae.name }] }, { run: (p, o, d) => runRouting(p, o, { ...d, suppression: createClawdSuppressionReader(), hubspotSnapshot: tamIn as never }) });
    expect(routed.ok, JSON.stringify(routed)).toBe(true);
    const decision = await prisma.routingDecision.findFirst({ where: { account_name: tyson.name, persona_id: rae.id }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true, hypothesis_id: true } });
    expect(decision, 'no routing decision for Rae').not.toBeNull();
    expect(decision!.hypothesis_id).toBe(hypothesisId);
    expect(decision!.lane, JSON.stringify(decision)).toBe('work_queue');
    decisionId = decision!.id;
  }, 180_000);

  it('the preview renders from the JOB family: the posting\'s exact words, ONE question, none of the physical-change words; nothing is sent', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    const body = (await res.json()) as { preview?: { to: string; subject: string; contentHash: string; body: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(200);
    const p = body.preview!;
    expect(p.to).toBe(rae.email);
    expect(p.subject).toBe('A question on the posting');
    expect(p.body).toContain(`"${posting.text.replace(/\.$/, '')}"`);
    expect(p.body).toContain(`Is the posting still open, and are the yards where the day gets lost at ${tyson.name}?`);
    // The governed copy is everything above the signature; the unsubscribe footer below it is the compliance line.
    const copy = p.body.split('\nCasey Larkin, YardFlow by FreightRoll')[0];
    expect((copy.match(/\?/g) ?? []).length).toBe(1);
    expect(p.body).toContain('Unsubscribe: https://yardflow.ai/unsubscribe/');
    expect(`${p.subject}\n${p.body}`).not.toMatch(PHYSICAL);
    expect(sinkFiles()).toHaveLength(0);
  }, 120_000);

  it('CONFIRM + SEND writes exactly one message to the sink, to Rae, with that copy in its MIME body', async () => {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const pv = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', {}), ctx(decisionId));
    const p = ((await pv.json()) as { preview: { contentHash: string; to: string } }).preview;
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', { confirm: { contentHash: p.contentHash, recipient: p.to } }), ctx(decisionId));
    const body = (await res.json()) as { sent?: { recipient: string; gmailSentMessageId: string }; error?: string; detail?: string };
    expect(res.status, JSON.stringify(body)).toBe(201);
    expect(body.sent?.gmailSentMessageId).toMatch(/^sink-/);
    const written = sinkFiles().filter((f) => f.outcome === 'written');
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ kind: 'send', to: rae.email, subject: 'A question on the posting' });
    const mime = Buffer.from(String(written[0].raw ?? ''), 'base64url').toString('utf8');
    const decoded = /Content-Transfer-Encoding: base64/i.test(mime) ? mime.split(/\r?\n\r?\n/).slice(1).map((part) => { try { return Buffer.from(part.replace(/\s+/g, ''), 'base64').toString('utf8'); } catch { return part; } }).join('\n') : mime;
    expect(decoded.replace(/=\r?\n/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'")).toContain('Is the posting still open, and are the yards where the day gets lost');
  }, 180_000);

  it('an event-led thesis at another account still renders from its event-led family (the approach decides the copy, both ways)', async () => {
    const { loadActionPack } = await import('@/lib/gap/execution/action-pack');
    const fedex = corpus.accounts.find((a) => a.name.startsWith('Fedex'))!;
    const pack = await loadActionPack(prisma, { hypothesisId: fedex.hypotheses[0].id, personaId: fedex.people[0].id });
    expect(pack?.version?.family?.program).toBe('gap-seed-2026-09');
    expect(pack?.rendered?.queued.subject).not.toBe('A question on the posting');
  }, 60_000);
});
