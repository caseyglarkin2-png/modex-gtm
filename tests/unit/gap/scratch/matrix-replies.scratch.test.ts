// @vitest-environment node
/**
 * R62 MATRIX, REPLIES (mandate section 7, "Replies and capture"): every reply kind arrives as an inbound row in the
 * mailbox tables after a REAL first touch (approve_and_use, the routed card, POST /api/gap/decisions/[id]/send to the
 * sink), then is read the way Work and the reply panel read it (GET /api/gap/replies, the Work day loaders and
 * workDay, classifyReply / prepareReply) and recorded through POST /api/gap/dispositions. HubSpot, clawd and the AI
 * gateway are the stub; the Gmail wire is the sink. Real reply, referral, objection, an opt-out inside a longer
 * message, an out-of-office with a return day, a bounce, and a Gmail plus HubSpot twin each behave distinctly. A reply
 * logged through Capture (POST /api/gap/captures on the reply, then the one review, with the real disposition and BID
 * services) is recorded once and leaves Work; Work's reply card and the account page offer Capture as the only way.
 * Skipped without GAP_SCRATCH_DATABASE_URL pointing at the matrix database (127.0.0.1:55433/gap_matrix).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { readFileSync } from 'node:fs';

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

describe.skipIf(!RUN)('R62 matrix: replies (inbound rows after a real first touch, the real routes and Work loaders)', () => {
  let prisma: import('@prisma/client').PrismaClient;
  let h: import('@/scripts/gap/recovery/seed-matrix').MatrixHarness;
  let s: import('@/scripts/gap/recovery/seed-matrix').MatrixSeeder;
  const tag = `mr${Date.now().toString(36)}`;
  type Sent = { a: import('@/scripts/gap/recovery/seed-matrix').MatrixAccount; p: { id: number; name: string; email: string; title: string | null }; h: string; decisionId: string };
  const sent: Record<string, Sent> = {};
  const CASES = ['Reply', 'Referral', 'Objection', 'OptOut', 'Away', 'AwayWeekday', 'Delayed', 'Bounce', 'Twin', 'Capture', 'Offer'];
  const names = () => new Set(Object.values(sent).map((x) => x.a.name));

  beforeAll(async () => {
    prisma = (await import('@/lib/prisma')).prisma as never;
    const { createMatrixSeeder, startMatrixHarness } = await import('@/scripts/gap/recovery/seed-matrix');
    s = createMatrixSeeder(prisma, tag);
    const seeded: Record<string, Awaited<ReturnType<typeof s.readyAccount>>> = {};
    for (const c of CASES) seeded[c] = await s.readyAccount(`Reply ${c} Co`);
    h = await startMatrixHarness({ companies: s.companies });
    await h.control({ companyProps: { intent_score: '60', last_intent_at: new Date().toISOString() } });
    // A REAL first touch to each person: approve and use (routes the card), preview, confirm, one message in the sink.
    const { PATCH } = await import('@/app/api/gap/hypotheses/[id]/route');
    const { POST } = await import('@/app/api/gap/decisions/[id]/send/route');
    for (const c of CASES) {
      const r = seeded[c];
      const used = await PATCH(req(`/api/gap/hypotheses/${r.h}`, 'PATCH', { advance: 'approve_and_use' }), ctx(r.h));
      if (used.status !== 200) throw new Error(`use ${c}: ${JSON.stringify(await used.json())}`);
      const d = (await prisma.routingDecision.findFirst({ where: { account_name: r.a.name, persona_id: r.p.id }, orderBy: { created_at: 'desc' }, select: { id: true } }))!;
      const pv = (await (await POST(req(`/api/gap/decisions/${d.id}/send`, 'POST', {}), ctx(d.id))).json()) as { preview: { to: string; contentHash: string } };
      const cf = await POST(req(`/api/gap/decisions/${d.id}/send`, 'POST', { confirm: { contentHash: pv.preview.contentHash, recipient: pv.preview.to } }), ctx(d.id));
      if (cf.status !== 201) throw new Error(`send ${c}: ${JSON.stringify(await cf.json())}`);
      sent[c] = { a: r.a, p: r.p, h: r.h, decisionId: d.id };
    }
  }, 600_000);
  afterAll(async () => {
    await h?.stop();
    await prisma?.$disconnect();
  });

  /** The reply list as the route answers it. */
  async function replies() {
    const { GET } = await import('@/app/api/gap/replies/route');
    const res = await GET(req('/api/gap/replies?state=undispositioned&limit=200', 'GET'));
    const body = (await res.json()) as { items: Array<import('@/lib/gap/replies/list').ReplyItem> };
    expect(res.status).toBe(200);
    return body.items.filter((r) => names().has(r.accountName));
  }
  /** Work as the page composes it (the same loaders the R45 scratch read uses). */
  async function readDay(now: Date) {
    const { workDay } = await import('@/lib/gap/work/list');
    const { loadWorkCommitments, loadUpcomingMeetings, resetWorkSweep } = await import('@/lib/gap/work/day-load');
    const { loadWorkOutcomes } = await import('@/lib/gap/work/outcome');
    const { loadRecentFirstTouchAccounts } = await import('@/lib/gap/motion/load');
    resetWorkSweep();
    const items = await replies();
    const commitments = (await loadWorkCommitments(prisma, now, { replies: items.map((r) => ({ accountName: r.accountName, contactEmail: r.contactEmail, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt })) })).filter((c) => names().has(c.accountName));
    const meetings = (await loadUpcomingMeetings(prisma, now)).filter((m) => names().has(m.accountName));
    const outcomes = await loadWorkOutcomes(prisma, [...names()], now);
    const touches = await loadRecentFirstTouchAccounts(prisma, now);
    const inMotion = new Map([...touches].filter(([n]) => names().has(n)).map(([n, t]) => [n, { state: t.state, at: t.at, person: null }]));
    const day = workDay({ now, candidates: [], motions: [], inDeals: { status: 'unavailable', accounts: [] }, held: new Map(), replies: items.map((r) => ({ accountName: r.accountName, contactEmail: r.contactEmail, subject: r.subject, snippet: r.snippet, receivedAt: r.receivedAt, id: r.id })), commitments, meetings, outcomes, inMotion } as never);
    return { day, commitments, items };
  }
  const followUp = (commitments: Array<{ kind: string; accountName: string; person: { email: string | null } | null; status: string; dueAt: string | null }>, x: Sent) => commitments.find((c) => c.kind === 'follow_up' && c.accountName === x.a.name && c.person?.email === x.p.email.toLowerCase());
  async function dispose(x: Sent, msgId: string, responseClass: string, extra: Record<string, unknown> = {}) {
    const { POST } = await import('@/app/api/gap/dispositions/route');
    const res = await POST(req('/api/gap/dispositions', 'POST', { hypothesisId: x.h, personaId: x.p.id, contactEmail: x.p.email, channel: 'email', responseClass, source: { kind: 'inbound_message', id: msgId }, ...extra }));
    return { status: res.status, body: (await res.json()) as { dispositionId?: string; effects?: { stopped?: number; unsubscribed?: boolean }; error?: string } };
  }

  it('every first touch went out once and left one waiting follow-up for its person', async () => {
    const { commitments } = await readDay(new Date());
    for (const x of Object.values(sent)) {
      expect(h.writtenTo(x.p.email)).toBe(1);
      expect(followUp(commitments, x)?.status, x.a.name).toBe('waiting');
    }
  }, 240_000);

  it('a real reply: a reply card with what they asked, the cold follow-up blocked; request_information records the answer owed and closes the follow-up', async () => {
    const x = sent.Reply;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const { prepareReply } = await import('@/lib/gap/replies/prepare');
    const msg = await s.inbound(x.a, x.p, 'Thanks, this is timely. Can you send the two-site comparison? Thursday works for a call.', { key: 'reply' });
    const { day, commitments, items } = await readDay(new Date());
    const item = items.find((r) => r.id === msg.id)!;
    expect(classifyReply({ snippet: item.snippet, subject: item.subject, from: item.contactEmail })).toMatchObject({ kind: 'human', human: 'reply', pausesAccount: true });
    const prep = prepareReply({ ...item } as never, { now: new Date(), mailbox: 'casey@yardflow.ai' });
    expect(JSON.stringify(prep)).toMatch(/two-site comparison/);
    const card = day.cards.find((c) => c.accountName === x.a.name)!;
    expect([card.stateKind, card.tier]).toEqual(['replied', 'reply']);
    // The phase Work derives (with the buyer moves it reads from the same replies): blocked by the answer, never offered.
    const { commitmentPhase, buyerMoves } = await import('@/lib/gap/work/commitment-model');
    const phase = commitmentPhase(followUp(commitments, x) as never, new Date(), buyerMoves(items));
    expect([phase.phase, phase.line]).toEqual(['blocked', expect.stringMatching(/Answer that, not a follow-up\.$/)]);
    const d = await dispose(x, msg.id, 'request_information', { nextBestAction: 'Send the two-site comparison' });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const after = await readDay(new Date());
    expect(after.items.some((r) => r.id === msg.id)).toBe(false);
    expect(after.commitments.filter((c) => c.accountName === x.a.name && c.kind === 'answer_request').map((c) => c.title)).toEqual([`Answer ${x.p.name.split(' ')[0]}'s request: Send the two-site comparison`]);
    expect(followUp(after.commitments, x)?.status).toBe('done');
  }, 240_000);

  it('a referral: the panel reads who they named; the recorded referral is an obligation about the NAMED person, never the referrer, with no cold action', async () => {
    const x = sent.Referral;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const { prepareReply } = await import('@/lib/gap/replies/prepare');
    const msg = await s.inbound(x.a, x.p, 'I am not the right person for this. You should talk to Dana Ruiz, our VP Transportation.', { key: 'referral' });
    const item = (await replies()).find((r) => r.id === msg.id)!;
    expect(classifyReply({ snippet: item.snippet, subject: item.subject, from: item.contactEmail })).toMatchObject({ kind: 'human', human: 'referral' });
    expect(JSON.stringify(prepareReply({ ...item } as never, { now: new Date(), mailbox: 'casey@yardflow.ai' }))).toMatch(/Dana Ruiz/);
    const d = await dispose(x, msg.id, 'referral', { referral: { name: 'Dana Ruiz', title: 'VP Transportation' } });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const { commitments } = await readDay(new Date());
    const ref = commitments.filter((c) => c.accountName === x.a.name && c.kind === 'referral');
    expect(ref).toHaveLength(1);
    expect(ref[0].person).toMatchObject({ personaId: null, name: 'Dana Ruiz' });
    expect(ref[0].title).toMatch(/named Dana Ruiz \(VP Transportation\): decide how to approach them/);
    expect(ref[0].person?.email ?? null).not.toBe(x.p.email);
  }, 240_000);

  it('an objection: quoted in their words, it pauses the account like any human reply; existing_solution records it and stops the cold follow-up', async () => {
    const x = sent.Objection;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const words = 'We already run a YMS across our DCs and we are happy with it.';
    const msg = await s.inbound(x.a, x.p, words, { key: 'objection' });
    const { day, items } = await readDay(new Date());
    const item = items.find((r) => r.id === msg.id)!;
    expect(classifyReply({ snippet: item.snippet, subject: item.subject, from: item.contactEmail })).toMatchObject({ kind: 'human', human: 'objection', pausesAccount: true });
    expect(day.cards.find((c) => c.accountName === x.a.name)?.stateKind).toBe('replied');
    const d = await dispose(x, msg.id, 'existing_solution', { objection: words });
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const after = await readDay(new Date());
    expect(followUp(after.commitments, x)?.status).toBe('done');
  }, 240_000);

  it('an opt-out inside a longer message is an opt-out, not a conversation: an admin card; do_not_contact unsubscribes and marks the person', async () => {
    const x = sent.OptOut;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const msg = await s.inbound(x.a, x.p, 'Appreciate the note. We are consolidating vendors this year, so please remove me from your list. Best of luck.', { key: 'optout' });
    const { day, items } = await readDay(new Date());
    const item = items.find((r) => r.id === msg.id)!;
    expect(classifyReply({ snippet: item.snippet, subject: item.subject, from: item.contactEmail }).kind).toBe('opt_out');
    const card = day.cards.find((c) => c.accountName === x.a.name)!;
    expect([card.stateKind, card.tier]).toEqual(['opted_out', 'admin']);
    const d = await dispose(x, msg.id, 'do_not_contact');
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    const persona = await prisma.persona.findUnique({ where: { id: x.p.id }, select: { do_not_contact: true } });
    expect(persona!.do_not_contact).toBe(true);
    expect(await prisma.unsubscribedEmail.count({ where: { email: x.p.email.toLowerCase() } })).toBe(1);
  }, 240_000);

  it('an out-of-office with a return day: no card; the waiting follow-up moves to that day (9 am New York) and a re-read changes nothing', async () => {
    const x = sent.Away;
    const { nyDay, addDays, nyDayAt } = await import('@/lib/gap/work/dates');
    const back = addDays(nyDay(new Date()), 12);
    const label = new Date(`${back}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
    const msg = await s.inbound(x.a, x.p, `I am out of the office until ${label} with limited access to email.`, { key: 'away', subject: 'Automatic reply: trailer turns' });
    const first = await readDay(new Date());
    expect(first.day.cards.some((c) => c.accountName === x.a.name && c.stateKind === 'replied')).toBe(false);
    expect(followUp(first.commitments, x)?.dueAt).toBe(nyDayAt(back).toISOString());
    const again = await readDay(new Date());
    expect(followUp(again.commitments, x)?.dueAt).toBe(nyDayAt(back).toISOString());
    expect(again.commitments.filter((c) => c.accountName === x.a.name && c.kind === 'reminder')).toHaveLength(0);
    expect(msg.id).toBeTruthy();
  }, 240_000);

  // Was DEFECT src/lib/gap/work/commitments.ts:528: the return day was parsed at read time.
  // Fixed by the writer at 7f46b334 (item 8): it is parsed from the message's receivedAt.
  it('an out-of-office "back Monday" read a week later moves nothing: the follow-up keeps the Monday the notice meant', async () => {
    const x = sent.AwayWeekday;
    await s.inbound(x.a, x.p, 'I am traveling this week and will be back Monday.', { key: 'away-weekday', subject: 'Automatic reply: trailer turns' });
    const now = new Date();
    const first = followUp((await readDay(now)).commitments, x)?.dueAt;
    expect(first).toBeTruthy();
    const later = followUp((await readDay(new Date(now.getTime() + 8 * 86_400_000))).commitments, x)?.dueAt;
    expect(later).toBe(first);
  }, 240_000);

  // Was DEFECT src/lib/gap/replies/classify.ts:66: "Sorry for the delayed response" was filed as an out-of-office notice.
  // Fixed by the writer at 5059345d (R42b): a person who mentions their week stays a human reply with a Work card.
  it('a human reply that apologizes for a delayed response is a reply card, not an automatic notice', async () => {
    const x = sent.Delayed;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const msg = await s.inbound(x.a, x.p, 'Sorry for the delayed response, I was on vacation. Can you send pricing for two sites?', { key: 'delayed' });
    const { day, items } = await readDay(new Date());
    const item = items.find((r) => r.id === msg.id)!;
    expect(classifyReply({ snippet: item.snippet, subject: item.subject, from: item.contactEmail }).kind).toBe('human');
    expect(day.cards.find((c) => c.accountName === x.a.name)?.stateKind).toBe('replied');
  }, 240_000);

  it('a bounce: classified a bounce (never a reply), it does not pause the account as a conversation; the bounce disposition records it', async () => {
    const x = sent.Bounce;
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    const text = `Address not found. Your message wasn't delivered to ${x.p.email} because the address couldn't be found. 550 5.1.1 The email account that you tried to reach does not exist.`;
    const msg = await s.inbound(x.a, x.p, text, { key: 'bounce', subject: 'Delivery Status Notification (Failure)', fromEmail: 'mailer-daemon@googlemail.com', fromName: 'Mail Delivery Subsystem' });
    expect(classifyReply({ snippet: text, subject: 'Delivery Status Notification (Failure)', from: 'mailer-daemon@googlemail.com' })).toMatchObject({ kind: 'bounce', pausesAccount: false });
    const { day } = await readDay(new Date());
    expect(day.cards.find((c) => c.accountName === x.a.name)?.stateKind ?? null).not.toBe('replied');
    expect(msg.id).toBeTruthy();
  }, 240_000);

  it('a Gmail copy and a HubSpot copy of one reply are ONE reply; a human disposition on the HubSpot copy settles it', async () => {
    const x = sent.Twin;
    const at = new Date();
    const text = 'Yes, let us talk next week about the Columbus yard.';
    const gmail = await s.inbound(x.a, x.p, text, { key: 'twin-gmail', at, subject: 'Re: yard turns' });
    const hub = await s.inbound(x.a, x.p, text, { key: 'twin-hubspot', at: new Date(at.getTime() + 60_000), subject: 'Re: yard turns', source: 'hubspot' });
    const items = (await replies()).filter((r) => r.accountName === x.a.name);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(gmail.id);
    expect(items[0].twinIds).toEqual([hub.id]);
    const d = await dispose(x, hub.id, 'meeting_accepted');
    expect(d.status, JSON.stringify(d.body)).toBe(201);
    expect((await replies()).filter((r) => r.accountName === x.a.name)).toHaveLength(0);
    const { commitments } = await readDay(new Date());
    expect(commitments.filter((c) => c.accountName === x.a.name && c.kind === 'prepare_meeting')).toHaveLength(1);
  }, 240_000);

  /** The account page's own pursuit read (loadAccountView live, the context, loadPursuit): what NOW and its reply list read. */
  async function pursuitOf(a: Sent['a']) {
    const { loadAccountView } = await import('@/lib/gap/account-intel/load');
    const { loadAccountContext } = await import('@/lib/gap/context/load');
    const { loadPursuit } = await import('@/lib/gap/pursuit/load');
    const now = new Date();
    const loaded = (await loadAccountView(prisma, a.slug, now, { live: true, context: true } as never)) as unknown as { brief: never; inputs: never } | null;
    if (!loaded) throw new Error(`account not loaded: ${a.name}`);
    const c = await loadAccountContext(prisma, loaded.inputs, now);
    return loadPursuit(prisma, { brief: loaded.brief, inputs: loaded.inputs, ctx: c, now });
  }

  // R62 case added at 4e936a90 (R60 decision 1, capture once on a reply): Capture with the REAL disposition and BID
  // services (POST /api/gap/captures on the reply, then the one review POST /api/gap/captures/[id] op batch).
  it('a reply logged through Capture: one disposition sourced to the message, the kept statements confirmed and linked to it, the card gone from Work on the next load', async () => {
    const x = sent.Capture;
    const PROBLEM = 'We lose about 3 hours per shift hunting for trailers at the Columbus gate.';
    const COST = 'The detention charges from carriers are killing us.';
    const text = `${PROBLEM} ${COST} Can you send the case study by Friday?`;
    const msg = await s.inbound(x.a, x.p, text, { key: 'capture' });
    // Work as the cached cockpit holds it before the capture: the reply card.
    const before = await readDay(new Date());
    const card = before.day.cards.find((c) => c.accountName === x.a.name);
    expect([card?.stateKind, card?.tier]).toEqual(['replied', 'reply']);
    // Capture opened on the reply: it carries the message as its source, the thesis and the person; nothing decided yet.
    const { POST: openCapture } = await import('@/app/api/gap/captures/route');
    const opened = await openCapture(req('/api/gap/captures', 'POST', { accountName: x.a.name, personaId: x.p.id, source: { kind: 'reply', id: msg.id }, context: 'email', rawText: text }));
    const cap = (await opened.json()) as { id: string; reply: Record<string, unknown> | null; candidates: Array<{ id: string; quote: string }> };
    expect(opened.status, JSON.stringify(cap)).toBe(201);
    expect(cap.reply).toMatchObject({ id: msg.id, sourceKind: 'inbound_message', hypothesisId: x.h, personaId: x.p.id, contactEmail: x.p.email, decision: null });
    const kept = cap.candidates.filter((c) => c.quote === PROBLEM || c.quote === COST);
    expect(kept.map((c) => c.quote)).toEqual([PROBLEM, COST]);
    // ONE review: what the reply means, and the statements kept from it.
    const { POST: review } = await import('@/app/api/gap/captures/[id]/route');
    const items = [{ candidateId: 'reply', decision: 'confirm', responseClass: 'problem_confirmed' }, ...kept.map((c) => ({ candidateId: c.id, decision: 'confirm' }))];
    type Batch = { results: Array<{ candidateId: string; ok: boolean; reason?: string; dispositionId?: string | null }> };
    const first = await review(req(`/api/gap/captures/${cap.id}`, 'POST', { op: 'batch', items }), ctx(cap.id));
    const b1 = (await first.json()) as Batch;
    expect(first.status, JSON.stringify(b1)).toBe(200);
    expect(b1.results.map((r) => [r.candidateId, r.ok, r.reason ?? null])).toEqual(items.map((i) => [i.candidateId, true, null]));
    // Exactly one disposition, sourced to the message, with the seller's class; the kept statements are linked to it.
    const disp = await prisma.conversationDisposition.findMany({ where: { source_id: msg.id }, select: { id: true, source_kind: true, hypothesis_id: true, response_class: true, human_confirmed: true } });
    expect(disp).toEqual([{ id: expect.any(String), source_kind: 'inbound_message', hypothesis_id: x.h, response_class: 'problem_confirmed', human_confirmed: true }]);
    expect(b1.results[0].dispositionId).toBe(disp[0].id);
    const linked = await prisma.buyerInputData.findMany({ where: { disposition_id: disp[0].id }, select: { raw_buyer_language: true, human_confirmed: true, contact_email: true, metadata: true } });
    expect(linked.map((b) => [b.raw_buyer_language, b.human_confirmed, b.contact_email, (b.metadata as { replyId?: unknown } | null)?.replyId ?? null]).sort()).toEqual([PROBLEM, COST].map((q) => [q, true, x.p.email, msg.id]).sort());
    // A second press records nothing: each item answers already_decided.
    const second = await review(req(`/api/gap/captures/${cap.id}`, 'POST', { op: 'batch', items }), ctx(cap.id));
    const b2 = (await second.json()) as Batch;
    expect(b2.results.map((r) => [r.candidateId, r.ok, r.reason ?? null])).toEqual(items.map((i) => [i.candidateId, false, 'already_decided']));
    expect([await prisma.conversationDisposition.count({ where: { source_id: msg.id } }), await prisma.buyerInputData.count({ where: { disposition_id: disp[0].id } })]).toEqual([1, 2]);
    // The next Work load: the cached cockpit still lists the reply; the page's recorded-reply read drops it, and the
    // reply card is gone (the live reply list agrees).
    const { loadRecordedReplyIds, withoutRecordedReplies } = await import('@/lib/gap/work/recorded-replies');
    const cached = before.items.map((r) => ({ accountName: r.accountName, id: r.id }));
    const recorded = await loadRecordedReplyIds(prisma, cached.map((r) => r.id));
    expect([...recorded].filter((id) => id === msg.id)).toEqual([msg.id]);
    expect(withoutRecordedReplies(cached, undefined, recorded).replies.filter((r) => r.id === msg.id)).toEqual([]);
    const after = await readDay(new Date());
    expect(after.items.filter((r) => r.id === msg.id)).toEqual([]);
    expect(after.day.cards.filter((c) => c.accountName === x.a.name && c.tier === 'reply').map((c) => c.stateKind)).toEqual([]);
  }, 240_000);

  // R62 case added at 4e936a90 (R60 decision 1): one way to record a reply, Capture, from Work and from the account.
  it('a reply card and the account page offer only Capture: one link into Capture on the message, no second record link, no reply form on the account', async () => {
    const x = sent.Offer;
    const msg = await s.inbound(x.a, x.p, 'Interesting. What would a pilot at one site involve?', { key: 'offer' });
    // Work: the reply card's next move is Capture on this message; no separate capture link and no record control.
    const { day } = await readDay(new Date());
    const card = day.cards.find((c) => c.accountName === x.a.name) as unknown as { stateKind: string; tier: string; next: { label: string; href: string } | null; capture?: unknown; reply?: { record?: unknown; messageId?: string } | null } | undefined;
    expect([card?.stateKind, card?.tier, card?.next?.label, card?.capture ?? null, card?.reply?.record ?? null]).toEqual(['replied', 'reply', 'Log what they said', null, null]);
    const [path, query] = (card?.next?.href ?? '').split('?');
    const q = new URLSearchParams(query ?? '');
    expect([path, q.get('account'), q.get('context'), q.get('from')]).toEqual(['/gap/capture', x.a.name, 'email', `reply:${msg.id}`]);
    // The account page: its pursuit read holds the waiting reply, which the page lists with AccountReplies.
    const pursuit = await pursuitOf(x.a);
    const waiting = pursuit.replyItems.filter((r) => !r.dispositionId);
    expect(waiting.map((r) => [r.id, r.personaId])).toEqual([[msg.id, x.p.id]]);
    const { replyCaptureHref } = await import('@/lib/gap/account-intel/href');
    const { classifyReply } = await import('@/lib/gap/replies/classify');
    // The page's own mapping (page.tsx waitingReplies, opened outside Work so no Work context is added).
    const listed = waiting.map((r) => ({ id: r.id, from: r.fromName?.trim() || r.contactEmail, receivedAt: r.receivedAt, snippet: r.snippet, href: replyCaptureHref({ accountName: x.a.name, replyId: r.id, personaId: r.personaId, deal: null }), label: classifyReply({ snippet: r.snippet, subject: r.subject, from: r.contactEmail }).kind === 'opt_out' ? 'Record the opt-out' : 'Log what they said' }));
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { createElement } = await import('react');
    const { AccountReplies } = await import('@/components/gap/account-replies');
    const html = renderToStaticMarkup(createElement(AccountReplies, { items: listed, accountName: x.a.name }));
    const links = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map((m) => [m[1].replace(/&amp;/g, '&'), m[2]]);
    expect(links).toEqual([[replyCaptureHref({ accountName: x.a.name, replyId: msg.id, personaId: x.p.id, deal: null }), 'Log what they said']]);
    expect(html.match(/<(?:form|input|select|textarea|button)\b/g) ?? []).toEqual([]);
    // The page source: the waiting replies render through that list, never a reply form of its own.
    const page = readFileSync('src/app/gap/accounts/[slug]/page.tsx', 'utf8');
    expect(page.match(/RepliesTriage|DispositionForm/g) ?? []).toEqual([]);
    expect(page).toContain('<AccountReplies items={waitingReplies}');
  }, 240_000);

  it('no case reached the network', () => {
    expect(h.refusedFetches).toEqual([]);
  });
});
