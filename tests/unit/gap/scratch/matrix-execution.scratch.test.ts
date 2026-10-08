// @vitest-environment node
/**
 * R62 MATRIX, EXECUTION (GAP OS execution recovery, mandate section 7, "Execution"). Every case runs through the REAL
 * routes (PATCH /api/gap/hypotheses/[id] approve_and_use, which routes the person; POST /api/gap/decisions/[id]/send
 * preview and confirm; POST /api/gap/decisions/[id]/gmail-draft), the real gates, ledger and Postgres (the matrix's
 * own scratch database, 127.0.0.1:55433/gap_matrix), with every external boundary controlled by
 * scripts/gap/recovery/stubs.mjs: HubSpot through the SDK base path (the REAL opportunity resolver, never mocked:
 * an open deal is a row in the stub's deals file), clawd suppression, autonomy and the critic; the Gmail wire is the
 * transport sink. Only the session is mocked (and, for the shell render, next/navigation's client hooks). A fetch
 * guard refuses any address that is not the stub. Every refusal asserts its ONE specific reason. The legacy send
 * path (POST /api/email/send) is held to an unrecorded opt-out reply too, and the global compose control stays off
 * GAP pages (the shell rendered on the server for a path). Skipped without GAP_SCRATCH_DATABASE_URL pointing at the
 * matrix database.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const MATRIX_URL = /^postgres(?:ql)?:\/\/[^@/]+@127\.0\.0\.1:55433\/gap_matrix(?:\?.*)?$/;
const RUN = MATRIX_URL.test(process.env.GAP_SCRATCH_DATABASE_URL ?? '');

vi.mock('@/lib/auth', () => ({ auth: vi.fn(async () => ({ user: { email: 'casey@freightroll.com' } })) }));
vi.mock('@/lib/prisma', async () => {
  const { PrismaClient } = await import('@prisma/client');
  const url = process.env.GAP_SCRATCH_DATABASE_URL ?? '';
  return { prisma: /^postgres/.test(url) ? new PrismaClient({ datasourceUrl: url }) : ({} as never) };
});
// The shell's client hooks for a server render at a chosen path (case 12); every other export is the real module.
const nav = vi.hoisted(() => ({ path: '/' }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => nav.path,
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined, back: () => undefined, forward: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const req = (url: string, method: string, body?: unknown) => new NextRequest(`http://localhost${url}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
type Res = { status: number; body: { error?: string; detail?: string; alreadySent?: boolean; preview?: { to: string; contentHash: string; from?: string }; sent?: { recipient: string; gmailSentMessageId: string } } };

describe.skipIf(!RUN)('R62 matrix: execution (real routes, real opportunity resolver against the stub, the sink)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  const tag = `mx${Date.now().toString(36)}`;
  type Ready = Awaited<ReturnType<import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder['readyAccount']>>;
  const ready: Record<string, Ready> = {};
  const CASES = ['Double', 'Tabs', 'TabsReason1', 'TabsReason2', 'TabsReason3', 'TabsReason4', 'Recipient', 'Sender', 'Copy', 'Evidence', 'OptOutReply', 'OptOutList', 'Suppressed', 'Deal', 'Role', 'Draft', 'Timeout', 'Outside', 'LegacyStop', 'LegacyHuman'];

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    s = createMatrixSeeder(prisma, tag);
    for (const c of CASES) {
      // The evidence case opens on a site-specific closure, so a later opposite fact about that site contradicts it.
      ready[c] = await s.readyAccount(`Exec ${c} Co`, c === 'Evidence' ? { factText: `Exec ${c} Co ${tag} is closing the Dallas distribution center and moving volume to Houston.` } : {});
    }
    h = await startMatrixHarness({ companies: s.companies });
    // Routing reads the company's intent from HubSpot (the stub): a priority account, as a routed card needs.
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
  }, 300_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  /** APPROVE AND USE through the real route (which routes the person through the real snapshot provider and the stub). */
  async function use(r: Ready): Promise<string> {
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const res = await PATCH(req(`/api/gap/hypotheses/${r.h}`, 'PATCH', { advance: 'approve_and_use' }), ctx(r.h));
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(200);
    const d = await prisma.routingDecision.findFirst({ where: { account_name: r.a.name, persona_id: r.p.id }, orderBy: { created_at: 'desc' }, select: { id: true, lane: true, action: true, rule_id: true } });
    expect(d, `no routing decision for ${r.a.name}: ${JSON.stringify(body)}`).not.toBeNull();
    expect([d!.lane, d!.action], JSON.stringify(d)).toEqual(['work_queue', 'one_off_email']);
    return d!.id;
  }
  async function send(decisionId: string, confirm?: { contentHash: string; recipient: string }): Promise<Res> {
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    const res = await POST(req(`/api/gap/decisions/${decisionId}/send`, 'POST', confirm ? { confirm } : {}), ctx(decisionId));
    return { status: res.status, body: (await res.json()) as Res['body'] };
  }
  async function preview(decisionId: string) {
    const r = await send(decisionId);
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    return r.body.preview!;
  }

  const DIRECT_SENT_KIND = async () => (await import('@/lib/gap/execution/draft-ledger')).DIRECT_SENT;
  async function sentRows(decisionId: string) {
    return prisma.gapAuditEvent.count({ where: { kind: await DIRECT_SENT_KIND(), subject_id: decisionId } });
  }

  it('double click: the second confirm answers ALREADY SENT; one message, one ledger row, one EmailLog row', async () => {
    const r = ready.Double;
    const d = await use(r);
    const p = await preview(d);
    expect(p.to).toBe(r.p.email);
    const first = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect(first.status, JSON.stringify(first.body)).toBe(201);
    const second = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([second.status, second.body.alreadySent], JSON.stringify(second.body)).toEqual([200, true]);
    expect(h.writtenTo(r.p.email)).toBe(1);
    expect(await sentRows(d)).toBe(1);
    expect(await prisma.emailLog.count({ where: { to_email: r.p.email } })).toBe(1);
    expect(h.refusedFetches).toEqual([]);
  }, 180_000);

  it('duplicate tabs: three confirms at once send exactly one message, one ledger row, one EmailLog row; no loser is sent', async () => {
    const r = ready.Tabs;
    const d = await use(r);
    const p = await preview(d);
    const all = await Promise.all([0, 1, 2].map(() => send(d, { contentHash: p.contentHash, recipient: p.to })));
    expect(all.filter((x) => x.status === 201), JSON.stringify(all)).toHaveLength(1);
    expect(all.filter((x) => x.status !== 201).every((x) => x.status === 200 ? x.body.alreadySent === true : x.status === 409), JSON.stringify(all)).toBe(true);
    const late = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([late.status, late.body.alreadySent], JSON.stringify(late.body)).toEqual([200, true]);
    expect(h.writtenTo(r.p.email)).toBe(1);
    expect(await sentRows(d)).toBe(1);
    expect(await prisma.emailLog.count({ where: { to_email: r.p.email } })).toBe(1);
  }, 180_000);

  // Was DEFECT src/lib/gap/execution/seller-send.ts:172 with seller-draft.ts:415-431: a losing tab was refused
  // emailed_outside_gap or decision_stale for GAP's own send. Fixed by the writer at 1b6416a9 (item 7): the loser re-reads
  // the ledger and answers ALREADY SENT, or send_in_progress_or_unknown while the winner's claim is open.
  it('duplicate tabs: every losing tab answers ALREADY SENT or send_in_progress_or_unknown, never emailed_outside_gap or decision_stale (four races)', async () => {
    const seen: string[] = [];
    for (const k of ['TabsReason1', 'TabsReason2', 'TabsReason3', 'TabsReason4']) {
      const r = ready[k];
      const d = await use(r);
      const p = await preview(d);
      const all = await Promise.all([0, 1, 2].map(() => send(d, { contentHash: p.contentHash, recipient: p.to })));
      expect(all.filter((x) => x.status === 201)).toHaveLength(1);
      for (const x of all.filter((y) => y.status !== 201)) seen.push(x.body.alreadySent === true ? 'ALREADY SENT' : String(x.body.error));
      expect(h.writtenTo(r.p.email)).toBe(1);
    }
    expect(seen.filter((x) => x !== 'ALREADY SENT' && x !== 'send_in_progress_or_unknown'), JSON.stringify(seen)).toEqual([]);
  }, 300_000);

  it('recipient changed after approval: recipient_changed_since_review, nothing sent', async () => {
    const r = ready.Recipient;
    const d = await use(r);
    const p = await preview(d);
    const res = await send(d, { contentHash: p.contentHash, recipient: `someone-else@${r.a.slug}.example.com` });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'recipient_changed_since_review']);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  // Was DEFECT src/lib/gap/execution/seller-send.ts:164-168: the confirm did not bind the sender. Fixed by the writer at
  // 1b6416a9 (item 7): sender_changed_since_review.
  it('sender changed after approval: refused (the confirm binds the sender the seller saw), nothing sent', async () => {
    const r = ready.Sender;
    const d = await use(r);
    const p = await preview(d);
    process.env.GAP_GMAIL_USER_EMAIL = 'someone-else@yardflow.ai';
    let res: Res;
    try {
      res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    } finally {
      process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
    }
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'sender_changed_since_review']);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('copied, then edited and sent by hand from the GAP mailbox: the GAP send is refused emailed_outside_gap; GAP never sends a second', async () => {
    const r = ready.Copy;
    const d = await use(r);
    const p = await preview(d);
    const { POST } = await import('@/app/api/gap/decisions/[id]/copy-email/route');
    const copied = await POST(req(`/api/gap/decisions/${d}/copy-email`, 'POST', {}), ctx(d));
    const cb = (await copied.json()) as { ok?: boolean; recipient?: string; text?: string; error?: string };
    expect([copied.status, cb.ok, cb.recipient], JSON.stringify(cb)).toEqual([200, true, r.p.email]);
    // The seller pastes it into Gmail, edits it, and sends it from casey@yardflow.ai: the mailbox's Sent holds it.
    const { sinkAttempt, sinkConfig } = await import('@/lib/email/transport-sink');
    sinkAttempt(sinkConfig()!, 'send', { to: r.p.email, subject: 'Edited by hand', purpose: 'manual' }, new Date());
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'emailed_outside_gap']);
    expect(h.writtenTo(r.p.email)).toBe(1);
    expect(await sentRows(d)).toBe(0);
  }, 180_000);

  it('evidence invalidated after preview: an opposite verified fact about the same site refuses the send fact_contradicted', async () => {
    const r = ready.Evidence;
    const d = await use(r);
    const p = await preview(d);
    await s.fact(r.a, 'dallas-open', `${r.a.name} will open its Dallas distribution center in March 2027 to serve Texas stores.`, { title: `${r.a.name} Dallas DC`, observedAt: new Date().toISOString() });
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'fact_contradicted']);
    expect(res.body.detail).toMatch(/Dallas/);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('opt-out written in a reply after preview: the confirm is refused account_replied, nothing sent', async () => {
    const r = ready.OptOutReply;
    const d = await use(r);
    const p = await preview(d);
    await s.inbound(r.a, r.p, 'Thanks for reaching out. We are not looking at this right now, please remove me from your list and do not email me again.', { key: 'optout' });
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'account_replied']);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('opt-out through the unsubscribe link after preview: the unsubscribe mirrors to the person, so persona_do_not_contact; nothing sent', async () => {
    const r = ready.OptOutList;
    const d = await use(r);
    const p = await preview(d);
    const { recordUnsubscribe } = await import('@/lib/email/unsubscribe');
    const u = await recordUnsubscribe(prisma, { email: r.p.email, emailLogId: null, reason: 'unsubscribe link' } as never);
    expect(u.ok).toBe(true);
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'persona_do_not_contact']);
    expect(await prisma.unsubscribedEmail.count({ where: { email: r.p.email.toLowerCase() } })).toBe(1);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('suppressed in clawd after preview: refused at the wire with the suppression reason, nothing written', async () => {
    const r = ready.Suppressed;
    const d = await use(r);
    const p = await preview(d);
    h.setBlocked([r.p.email]);
    try {
      const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
      expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'recipient_suppressed']);
      expect(res.body.detail).toBe('Cross-plane suppression refused this send: do_not_send');
    } finally {
      h.setBlocked([]);
    }
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('a deal opens in HubSpot after preview: the REAL resolver reads it from the stub and the confirm is refused active_opportunity', async () => {
    const r = ready.Deal;
    const d = await use(r);
    const p = await preview(d);
    h.setDeals({ [r.a.name]: [s.openDeal(r.a, 9101)] });
    try {
      const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
      expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'active_opportunity']);
      expect(res.body.detail).toMatch(/YardFlow - Exec Deal Co/);
    } finally {
      h.setDeals({});
    }
    expect(h.requests().some((q) => q.path === '/crm/v3/objects/deals/batch/read')).toBe(true);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('stale role: the person left the account after preview; the confirm is refused, nothing sent', async () => {
    const r = ready.Role;
    const d = await use(r);
    const p = await preview(d);
    await s.left(r.p.id);
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'persona_left_account']);
    expect(res.body.detail).toMatch(/no longer at Exec Role Co/);
    expect(h.writtenTo(r.p.email)).toBe(0);
  }, 180_000);

  it('draft saved in Gmail, not sent: the direct send is refused draft_outstanding; the draft is never counted as sent', async () => {
    const r = ready.Draft;
    const d = await use(r);
    const { POST } = await import('@/app/api/gap/decisions/[id]/gmail-draft/route');
    const dr = await POST(req(`/api/gap/decisions/${d}/gmail-draft`, 'POST', {}), ctx(d));
    const db = await dr.json();
    expect(dr.status, JSON.stringify(db)).toBe(201);
    expect(h.sinkFiles().filter((f) => f.kind === 'draft' && f.to === r.p.email && f.outcome === 'written')).toHaveLength(1);
    const p = await send(d);
    const res = p.status === 200 && p.body.preview ? await send(d, { contentHash: p.body.preview.contentHash, recipient: p.body.preview.to }) : p;
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'draft_outstanding']);
    expect(h.writtenTo(r.p.email)).toBe(0);
    expect(await sentRows(d)).toBe(0);
  }, 180_000);

  it('provider accepted the send, the answer was lost: the claim stays open, the retry is refused send_in_progress_or_unknown, the Sent read reconciles it to ALREADY SENT; one message', async () => {
    const r = ready.Timeout;
    const d = await use(r);
    const p = await preview(d);
    process.env.GAP_SINK_FAULT = 'timeout_after_write';
    let lost: Res;
    try {
      lost = await send(d, { contentHash: p.contentHash, recipient: p.to });
    } finally {
      delete process.env.GAP_SINK_FAULT;
    }
    expect([lost.status, lost.body.error], JSON.stringify(lost.body)).toEqual([409, 'send_in_progress_or_unknown']);
    expect(h.writtenTo(r.p.email)).toBe(1);
    const retry = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([retry.status, retry.body.error], JSON.stringify(retry.body)).toEqual([409, 'send_in_progress_or_unknown']);
    expect(h.writtenTo(r.p.email)).toBe(1);
    const { reconcileUnknownSends } = await import('@/lib/gap/execution/unknown-send-reconcile');
    const { sinkConfig, sinkSentTo } = await import('@/lib/email/transport-sink');
    const report = await reconcileUnknownSends(prisma, { now: new Date(Date.now() + 11 * 60_000) }, { listSent: async (to, a, b) => sinkSentTo(sinkConfig()!, to, a, b), mailbox: 'casey@yardflow.ai' });
    expect(report.reconciled, JSON.stringify(report)).toBeGreaterThanOrEqual(1);
    const after = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([after.status, after.body.alreadySent], JSON.stringify(after.body)).toEqual([200, true]);
    expect(h.writtenTo(r.p.email)).toBe(1);
    expect(await sentRows(d)).toBe(1);
  }, 240_000);

  it('sent outside GAP before the first touch: the GAP send is refused emailed_outside_gap and nothing second goes out', async () => {
    const r = ready.Outside;
    const d = await use(r);
    const p = await preview(d);
    const { sinkAttempt, sinkConfig } = await import('@/lib/email/transport-sink');
    sinkAttempt(sinkConfig()!, 'send', { to: r.p.email, subject: 'Quick question', purpose: 'manual' }, new Date());
    const res = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([res.status, res.body.error], JSON.stringify(res.body)).toEqual([409, 'emailed_outside_gap']);
    expect(h.writtenTo(r.p.email)).toBe(1);
  }, 180_000);

  // R62 case 12 (R63 BLOCKER found by reviewer B): an opt-out written in a reply ("stop", classified opt_out) that
  // nobody has recorded yet (personas.do_not_contact still false) must also refuse the LEGACY send path,
  // POST /api/email/send, by personaId and by address, for a reason that names the reply (perform-send.ts, beside
  // the unsubscribed blocker). A human reply from the same kind of person does not block that path; the GAP gate's
  // own refusal on the card is unchanged. The global compose control is not rendered on GAP pages.
  // Pinned to the landed fix 8f7c20d5: 409 RECIPIENT_OPTED_OUT_BY_REPLY, details.reason recipient_opted_out_by_reply,
  // and the words '<name> replied "stop" on <day>. Nobody emails them from here. Record it as do not contact from
  // their reply.' (gap/replies/opt-out.ts); a cc that opted out blocks too; an ordinary or automatic reply does not.
  // The compose control is gone under /gap and /gap/ and below (3fe2c39e); /gapfoo is not GAP.
  it('an unrecorded "stop" reply refuses the legacy send path by person and by address, naming the reply; a human reply does not; the GAP card still answers account_replied; no compose control on GAP pages', async () => {
    const r = ready.LegacyStop;
    const d = await use(r);
    const p = await preview(d);
    await s.inbound(r.a, r.p, 'stop', { key: 'legacy-stop' });
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    expect(classifyReply({ snippet: 'stop', subject: 'Re: trailer turns at your sites', from: r.p.email }).kind).toBe('opt_out');
    expect((await prisma.persona.findUnique({ where: { id: r.p.id }, select: { do_not_contact: true } }))?.do_not_contact).toBe(false);
    const { POST: legacySend } = await import('@/app/api/email/send/route');
    type Blocked = { error?: string; code?: string; message?: string; details?: unknown };
    // The reason names the person, their words and the day the reply arrived (New York).
    const at = (await prisma.inboundMessage.findFirst({ where: { from_email: r.p.email, body_text: 'stop' }, orderBy: { received_at: 'desc' }, select: { received_at: true } }))!.received_at;
    const day = new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
    const REASON = `${r.p.name} replied "stop" on ${day}. Nobody emails them from here. Record it as do not contact from their reply.`;
    const legacy = async (body: Record<string, unknown>) => {
      const res = await legacySend(req('/api/email/send', 'POST', { subject: 'Following up on the yard', bodyHtml: '<p>Following up on trailer turns at your sites.</p>', ...body }));
      return { status: res.status, body: (await res.json()) as Blocked };
    };
    // By person (the route resolves the address from the persona) and by address alone: refused, naming the reply.
    for (const attempt of [{ to: r.p.email, personaId: r.p.id }, { to: r.p.email, accountName: r.a.name, personaName: r.p.name }]) {
      const res = await legacy(attempt);
      expect([res.status, res.body.code, res.body.error, res.body.message, res.body.details], JSON.stringify(res.body)).toEqual([409, 'RECIPIENT_OPTED_OUT_BY_REPLY', REASON, REASON, { reason: 'recipient_opted_out_by_reply' }]);
    }
    // The guard phase itself says the same, before any transport.
    const { evaluateSendGuards } = await import('@/lib/email/perform-send');
    const guardOf = (x: Ready) => evaluateSendGuards(prisma as never, { to: x.p.email, subject: 'Following up on the yard', bodyHtml: '<p>Following up.</p>', accountName: x.a.name, personaName: x.p.name, personaId: x.p.id });
    const stopped = await guardOf(r);
    expect(stopped.ok ? 'clear' : [stopped.block.code, stopped.block.status, stopped.block.message]).toEqual(['RECIPIENT_OPTED_OUT_BY_REPLY', 409, REASON]);
    // A colleague at the same account with the opted-out person on cc: refused for the cc's reply, named from the reply.
    const colleague = await s.person(r.a, 'Kim', 'Director, Transportation');
    const cc = await evaluateSendGuards(prisma as never, { to: colleague.email, cc: [r.p.email], subject: 'Following up on the yard', bodyHtml: '<p>Following up.</p>', accountName: r.a.name, personaName: colleague.name, personaId: colleague.id });
    expect(cc.ok ? 'clear' : [cc.block.code, cc.block.message]).toEqual(['RECIPIENT_OPTED_OUT_BY_REPLY', REASON]);
    // A human reply from the same kind of person: the legacy guards stay clear (no reply-based block).
    const human = ready.LegacyHuman;
    await s.inbound(human.a, human.p, 'Thanks, this is timely. Can you send the two-site comparison before Thursday?', { key: 'legacy-human' });
    expect(classifyReply({ snippet: 'Thanks, this is timely. Can you send the two-site comparison before Thursday?', subject: 'Re: trailer turns', from: human.p.email }).kind).toBe('human');
    const clear = await guardOf(human);
    expect(clear.ok ? 'clear' : JSON.stringify(clear.block)).toBe('clear');
    // An automatic out-of-office notice does not block either.
    const away = await s.person(human.a, 'Ola', 'Director, Distribution');
    await s.inbound(human.a, away, 'I am out of the office until Monday, October 12 with limited access to email. For urgent matters contact the front desk.', { key: 'legacy-away', subject: 'Automatic reply: trailer turns' });
    const awayGuard = await evaluateSendGuards(prisma as never, { to: away.email, subject: 'Following up on the yard', bodyHtml: '<p>Following up.</p>', accountName: human.a.name, personaName: away.name, personaId: away.id });
    expect(awayGuard.ok ? 'clear' : JSON.stringify(awayGuard.block)).toBe('clear');
    // The GAP gate on the card prepared before the reply: its own refusal, unchanged. Nothing reached the sink.
    const gap = await send(d, { contentHash: p.contentHash, recipient: p.to });
    expect([gap.status, gap.body.error], JSON.stringify(gap.body)).toEqual([409, 'account_replied']);
    expect(h.writtenTo(r.p.email)).toBe(0);
    expect(h.sinkFiles().filter((f) => f.to === r.p.email)).toEqual([]);

    // The global compose control: the shell rendered on the server for GAP paths carries no "Compose email"; a
    // non-GAP internal page still does.
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { AppShell } = await import('@/components/app-shell');
    const composeOn = (path: string) => {
      nav.path = path;
      return renderToStaticMarkup(createElement(AppShell, null, createElement('div', null, 'page'))).includes('aria-label="Compose email"');
    };
    const gapPaths = ['/gap', '/gap/', '/gap/accounts/acme-co', '/gap/replies', '/gap/capture', '/gap/coverage'];
    const otherPaths = ['/accounts/acme-co', '/discovery', '/gapfoo'];
    expect([...gapPaths, ...otherPaths].map((x) => [x, composeOn(x)])).toEqual([...gapPaths.map((x) => [x, false]), ...otherPaths.map((x) => [x, true])]);
  }, 240_000);

  it('no case reached the network: every external call went to the stub or the sink', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
