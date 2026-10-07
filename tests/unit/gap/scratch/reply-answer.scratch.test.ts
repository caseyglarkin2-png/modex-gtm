// @vitest-environment node
/**
 * R42b (GAP OS execution recovery, 2026-10-06): the prepared answer to a buyer reply through the REAL route, services,
 * ledger and Postgres (the embedded scratch database), with the external boundaries controlled: the Gmail wire and the
 * GAP mailbox's Sent folder are the transport sink (every gate before it runs for real), clawd is an in-process stub
 * (autonomy + suppression). Only the session is mocked. Skipped without GAP_SCRATCH_DATABASE_URL.
 *
 * Proves: a real reply with asks prepares an editable answer that lists what GAP cannot answer and invents none of it;
 * copying is recorded and sends nothing; the prepared text with placeholders is refused for a send; a suppressed
 * recipient is refused at the wire after preview; CONFIRM + SEND of the filled text writes exactly one message to the
 * sink, threaded (In-Reply-To), one REPLY_SENT row and one EmailLog row; a replay answers ALREADY SENT. A second reply
 * saved as a Gmail draft is a draft (not a send), and a send while that draft exists is refused. A referral and an
 * opt-out prepare no answer, and copy, draft and send are all refused for them; nothing reaches the sink for either.
 * The person a referral NAMED is held (the referral obligation read by its JSON path on Postgres) until the seller
 * marks it done or skipped.
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

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

interface Answer { status: string; why: string | null; asks: Array<{ topic: string }>; missing: string[]; body: string; known: Array<{ trust: string }> }
interface Loaded { answer: Answer; states: { copied: unknown; drafted: unknown; sent: unknown; openClaim: unknown }; blocked: { reason: string } | null }

describe.skipIf(!RUN)('R42b: the prepared answer to a reply (scratch database, the real route and gates, the transport sink)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  type Corpus = import('@/scripts/gap/recovery/seed-corpus').Corpus;
  let corpus: Corpus;
  let stub: http.Server;
  const blocked = new Set<string>();
  let sinkDir = '';
  const tag = `r42b-${Date.now().toString(36)}`;
  const ids = { ask: `r42b-ask-${tag}`, draft: `r42b-draft-${tag}`, referral: `r42b-ref-${tag}`, optOut: '' };
  const rfc = `<glen-${tag}@fedex.example.com>`;
  let glen = { id: 0, name: '', email: '' };
  let lisa = { id: 0, name: '', email: '' };
  let doug = { id: 0, name: '', email: '' };
  let emailLogBefore = 0;
  const FILLED = 'Hi Glen,\n\nThanks for getting back to me.\n\nI will send the two-site comparison Thursday morning. On cost, it depends on the number of yards; could we cover it on a call Thursday afternoon?';

  const sinkFiles = () => readdirSync(sinkDir).map((f) => JSON.parse(readFileSync(join(sinkDir, f), 'utf8')) as { outcome: string; to: string; refused: string[]; kind: string; purpose: string | null; raw: string | null; subject: string | null });
  const get = async (id: string) => {
    const { GET } = await import('@/app/api/gap/replies/[id]/answer/route');
    const res = await GET(req(`/api/gap/replies/${id}/answer`, 'GET'), ctx(id));
    return { status: res.status, body: (await res.json()) as Loaded };
  };
  const post = async (id: string, b: unknown) => {
    const { POST } = await import('@/app/api/gap/replies/[id]/answer/route');
    const res = await POST(req(`/api/gap/replies/${id}/answer`, 'POST', b), ctx(id));
    return { status: res.status, body: (await res.json()) as Record<string, unknown> & { error?: string; preview?: { to: string; contentHash: string; body: string; subject: string } } };
  };
  const ledgerKinds = async (id: string) => (await prisma.gapAuditEvent.findMany({ where: { subject_type: 'inbound_message', subject_id: id }, orderBy: { created_at: 'asc' }, select: { kind: true } })).map((r) => r.kind);

  beforeAll(async () => {
    for (const f of ['GAP_OS_ENABLED', 'GAP_HYPOTHESIS_ENABLED', 'GAP_ROUTING_ENABLED']) process.env[f] = 'true';
    delete process.env.HUBSPOT_ACCESS_TOKEN;
    delete process.env.GAP_HUBSPOT_MIRROR_ENABLED;
    // The clawd boundary: autonomy not halted; suppression answers per address from `blocked`.
    stub = http.createServer((rq, rs) => {
      let body = '';
      rq.on('data', (c) => (body += c));
      rq.on('end', () => {
        rs.setHeader('content-type', 'application/json');
        if (rq.url?.startsWith('/api/autonomy/state')) return rs.end(JSON.stringify({ global: true, motions: { outreach: true, actuator: true, social: true, content: true } }));
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
    // The mail boundary: the sink, allowed test domains only. It is also the GAP mailbox's Sent folder.
    sinkDir = mkdtempSync(join(tmpdir(), 'gap-r42b-sink-'));
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
    const fedex = corpus.accounts.find((a) => a.name.startsWith('Fedex'))!;
    const pepsi = corpus.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    const walmart = corpus.accounts.find((a) => a.name.startsWith('Walmart'))!;
    glen = fedex.people.find((p) => p.name.startsWith('Glen'))! as typeof glen;
    lisa = fedex.people.find((p) => p.name.startsWith('Lisa'))! as typeof lisa;
    const kay = pepsi.people.find((p) => p.name.startsWith('Kay'))!;
    doug = walmart.people.find((p) => p.name.startsWith('Doug'))! as typeof doug;
    const at = new Date(Date.now() - 2 * 3_600_000);
    const message = async (id: string, thread: string, account: string, who: { name: string; email: string }, text: string, rfcId: string | null) => {
      await prisma.emailThread.create({ data: { id: thread, account_name: account, persona_email: who.email, subject: 'Re: trailer turns at your sites', last_message_at: at } });
      await prisma.inboundMessage.create({ data: { id, thread_id: thread, rfc_message_id: rfcId, from_email: who.email, from_name: who.name, subject: 'Re: trailer turns at your sites', body_text: text, snippet: text.slice(0, 80), received_at: at, source: 'gmail' } });
    };
    await message(ids.ask, `r42b-thread-glen-${tag}`, fedex.name, glen, 'Thanks Casey. Can you send the two-site comparison? What would this cost per site? Are you free Thursday for a call?', rfc);
    await message(ids.draft, `r42b-thread-lisa-${tag}`, fedex.name, lisa, 'Could you send over the case study?', `<lisa-${tag}@fedex.example.com>`);
    await message(ids.referral, `r42b-thread-kay-${tag}`, pepsi.name, kay, "I'm not the right person. You should talk to Bob Lane, our VP of Transportation.", `<kay-${tag}@pepsi.example.com>`);
    // The corpus's own opt-out: Doug wrote "stop".
    ids.optOut = (await prisma.inboundMessage.findFirst({ where: { from_email: doug.email }, select: { id: true } }))!.id;
    emailLogBefore = await prisma.emailLog.count();
  }, 180_000);
  afterAll(async () => {
    await new Promise<void>((r) => stub.close(() => r()));
    rmSync(sinkDir, { recursive: true, force: true });
    delete process.env.GAP_SEND_TRANSPORT;
    await prisma?.$disconnect();
  });

  it('a real reply with asks: what they asked, an editable answer that invents nothing, each unknown listed as missing', async () => {
    const { status, body } = await get(ids.ask);
    expect(status, JSON.stringify(body)).toBe(200);
    expect(body.blocked).toBeNull();
    expect(body.answer.status).toBe('ready');
    expect(body.answer.asks.map((a) => a.topic)).toEqual(['material', 'pricing', 'availability']);
    expect(body.answer.missing).toHaveLength(3);
    expect(body.answer.missing[1]).toMatch(/^Pricing .*GAP holds no price for them/);
    expect(body.answer.missing[2]).toMatch(/^Your availability .*GAP does not know your calendar; they named Thursday/);
    const asserted = body.answer.body.replace(/\[Fill in:[^\]]*\]/g, '');
    expect(asserted).not.toMatch(/\$|\d|attach|available|agree|guarantee/i);
    expect(body.answer.body.match(/\[Fill in:/g)).toHaveLength(3);
    expect(sinkFiles()).toEqual([]);
  }, 120_000);

  it('copying is recorded and sends nothing; the prepared text with placeholders is refused for a send and a draft', async () => {
    const prepared = (await get(ids.ask)).body.answer.body;
    expect((await post(ids.ask, { op: 'copied', body: prepared })).status).toBe(200);
    const send = await post(ids.ask, { op: 'send', body: prepared });
    expect([send.status, send.body.error]).toEqual([409, 'unfilled_placeholders']);
    const draft = await post(ids.ask, { op: 'draft', body: prepared });
    expect([draft.status, draft.body.error]).toEqual([409, 'unfilled_placeholders']);
    expect(sinkFiles()).toEqual([]);
    expect(await ledgerKinds(ids.ask)).toEqual(['execution.reply_copied']);
    expect((await get(ids.ask)).body.states).toMatchObject({ copied: { by: 'casey@freightroll.com' }, drafted: null, sent: null });
  }, 120_000);

  it('the filled text: preview binds exactly it; a suppressed recipient is refused at the wire; CONFIRM + SEND writes one threaded message; a replay sends nothing', async () => {
    const pv = await post(ids.ask, { op: 'send', body: FILLED });
    expect(pv.status, JSON.stringify(pv.body)).toBe(200);
    expect(pv.body.preview).toMatchObject({ to: glen.email, subject: 'Re: trailer turns at your sites', body: FILLED });
    const confirm = { contentHash: pv.body.preview!.contentHash, recipient: glen.email };
    blocked.add(glen.email.toLowerCase());
    try {
      const refused = await post(ids.ask, { op: 'send', body: FILLED, confirm });
      expect(refused.status, JSON.stringify(refused.body)).toBe(409);
      expect(refused.body.error).toBe('recipient_suppressed');
      expect(sinkFiles().filter((f) => f.outcome === 'written')).toEqual([]);
    } finally {
      blocked.delete(glen.email.toLowerCase());
    }
    const sent = await post(ids.ask, { op: 'send', body: FILLED, confirm });
    expect(sent.status, JSON.stringify(sent.body)).toBe(201);
    expect(sent.body).toMatchObject({ alreadySent: false, sent: { recipient: glen.email, inReplyTo: rfc } });
    const written = sinkFiles().filter((f) => f.outcome === 'written');
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ kind: 'send', to: glen.email, purpose: 'HUMAN_APPROVED_1TO1', subject: 'Re: trailer turns at your sites' });
    const mime = Buffer.from(written[0].raw ?? '', 'base64url').toString('utf8');
    expect(mime).toContain(`In-Reply-To: ${rfc}`);
    expect(mime).toContain(`References: ${rfc}`);
    expect(await prisma.emailLog.count()).toBe(emailLogBefore + 1);
    const replay = await post(ids.ask, { op: 'send', body: FILLED, confirm });
    expect([replay.status, replay.body.alreadySent]).toEqual([200, true]);
    expect(sinkFiles().filter((f) => f.outcome === 'written')).toHaveLength(1);
    expect(await prisma.emailLog.count()).toBe(emailLogBefore + 1);
    // Copied, the released claim (the suppression refusal), then the claim that sent: distinct facts.
    expect(await ledgerKinds(ids.ask)).toEqual(['execution.reply_copied', 'execution.reply_claimed', 'execution.reply_released', 'execution.reply_claimed', 'execution.reply_sent']);
    expect((await get(ids.ask)).body.states).toMatchObject({ copied: { by: 'casey@freightroll.com' }, drafted: null, sent: { recipient: glen.email }, openClaim: null });
  }, 180_000);

  it('a Gmail draft is not a send: saved in their thread, then a send while the draft exists is refused', async () => {
    const text = 'Hi Lisa,\n\nThanks for getting back to me.\n\nI will send the case study tomorrow.';
    const d = await post(ids.draft, { op: 'draft', body: text });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const drafts = sinkFiles().filter((f) => f.kind === 'draft');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ to: lisa.email, outcome: 'written' });
    expect(drafts[0].purpose).not.toBe('HUMAN_APPROVED_1TO1');
    expect(Buffer.from(drafts[0].raw ?? '', 'base64url').toString('utf8')).toContain(`In-Reply-To: <lisa-${tag}@fedex.example.com>`);
    const s = await post(ids.draft, { op: 'send', body: text });
    expect([s.status, s.body.error]).toEqual([409, 'draft_outstanding']);
    expect(sinkFiles().filter((f) => f.kind === 'send' && f.to === lisa.email)).toEqual([]);
    expect(await ledgerKinds(ids.draft)).toEqual(['execution.reply_claimed', 'execution.reply_drafted']);
    expect((await get(ids.draft)).body.states).toMatchObject({ drafted: { draftId: expect.stringMatching(/^sink-/) }, sent: null });
  }, 120_000);

  it('a referral prepares no reply: no answer, and copy, draft and send are refused', async () => {
    const { body } = await get(ids.referral);
    expect(body.answer).toMatchObject({ status: 'none', body: '', why: expect.stringMatching(/^A referral prepares no reply/) });
    expect(body.blocked?.reason).toBe('referral_prepares_no_reply');
    for (const op of ['copied', 'draft', 'send']) {
      const r = await post(ids.referral, { op, body: 'Hi Kay, thanks. I will reach out to Bob.' });
      expect([op, r.status, r.body.error]).toEqual([op, 409, 'referral_prepares_no_reply']);
    }
    expect(await ledgerKinds(ids.referral)).toEqual([]);
  }, 120_000);

  it('the person a referral NAMED is held on Postgres until the seller chose (the JSON-path read of the referral obligations)', async () => {
    const { ensureCommitment, transitionCommitment } = await import('@/lib/gap/work/commitments');
    const { referralHoldFor } = await import('@/lib/gap/replies/referral-hold');
    const pepsi = corpus.accounts.find((a) => a.name.startsWith('Pepsi'))!;
    const now = new Date();
    const made = await ensureCommitment(prisma, { accountName: pepsi.name, kind: 'referral', title: 'Kay named Bob Lane (VP Transportation): decide how to approach them', basis: 'Kay: talk to Bob Lane, our VP of Transportation.', dueAt: now, person: { personaId: null, name: 'Bob Lane', email: null }, source: { kind: 'disposition', id: `r42b-disp-${tag}` } }, { actor: 'casey@freightroll.com', now });
    expect(made.ok, JSON.stringify(made)).toBe(true);
    const id = made.ok ? made.commitment.commitmentId : '';
    // Another kind naming the same person is not a referral and holds nothing.
    await ensureCommitment(prisma, { accountName: pepsi.name, kind: 'task', title: 'Look up Bob Lane', dueAt: now, person: { personaId: null, name: 'Bob Lane', email: null }, source: { kind: 'seller', id: `r42b-task-${tag}` } }, { actor: 'casey@freightroll.com', now });
    const bob = { email: `bob@${pepsi.slug}.example.com`, name: 'Bob Lane', accountName: pepsi.name };
    expect(await referralHoldFor(prisma, bob)).toMatchObject({ commitmentId: id });
    expect(await referralHoldFor(prisma, { ...bob, name: 'Kay Scratch' })).toBeNull();
    expect((await transitionCommitment(prisma, { commitmentId: id, to: 'skipped', reason: 'Asked Kay for an introduction instead.', actor: 'casey@freightroll.com', now })).ok).toBe(true);
    expect(await referralHoldFor(prisma, bob)).toBeNull();
  }, 120_000);

  it('an opt-out stops everything: no answer, nothing copied, drafted or sent, nothing reaches the sink', async () => {
    const { body } = await get(ids.optOut);
    expect(body.answer).toMatchObject({ status: 'none', body: '', why: expect.stringMatching(/^They opted out: no reply goes back/) });
    expect(body.blocked?.reason).toBe('opted_out');
    for (const op of ['copied', 'draft', 'send']) {
      const r = await post(ids.optOut, { op, body: 'Hi Doug, understood.' });
      expect([op, r.status, r.body.error]).toEqual([op, 409, 'opted_out']);
    }
    expect(sinkFiles().filter((f) => f.to === doug.email)).toEqual([]);
    expect(await ledgerKinds(ids.optOut)).toEqual([]);
  }, 120_000);
});
