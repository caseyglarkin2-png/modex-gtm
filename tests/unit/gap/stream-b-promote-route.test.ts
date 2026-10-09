// @vitest-environment node
/**
 * C24 (the commercial-context audit, 2026-10-08): POST /api/gap/angles/promote accepts a prepared angle through the
 * one service. Pinned: a signed-out caller is 401, a bad body 400, an unknown task 404; a call accepts nothing to
 * draft and answers 200 with the line and the links; an email lane with no GAP sender configured is a refusal in
 * words (400), never a draft; competing work the seller has not chosen answers 409 with the line and the offers.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';
import { queueAgentTask, runAgentTasks } from '@/lib/gap/agents/tasks';

const h = vi.hoisted(() => ({ client: null as unknown, session: { user: { email: 'casey@freightroll.com' } } as { user: { email: string } } | null, competing: null as null | (() => Promise<unknown>), lastDeps: null as null | Record<string, unknown> }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.client; } }));
vi.mock('@/lib/auth', () => ({ auth: async () => h.session }));
vi.mock('@/lib/gap/agents/promote-angle', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/gap/agents/promote-angle')>();
  return { ...mod, promoteAngle: (prisma: unknown, input: Parameters<typeof mod.promoteAngle>[1], deps?: Record<string, unknown>) => { h.lastDeps = deps ?? null; return mod.promoteAngle(prisma, input, { ...(deps ?? {}), ...(h.competing ? { competing: h.competing as never } : {}) }); } };
});
import { POST } from '@/app/api/gap/angles/promote/route';

const post = (body: unknown) => new NextRequest('http://localhost/api/gap/angles/promote', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
const NOW = new Date('2026-10-08T16:00:00Z');
const DAVE = 'dave.kiesling@kencogroup.com';
const ANGLE = { whyItMatters: 'My guess is the end-of-October reconnect is the moment to ask where a standard driver journey still adds production capacity across those yards.', accounts: ['Kenco Logistics'], roles: ['VP'], people: [1], starters: ['Which sites move first?', 'Where does the gate hand off?'], proposedAction: 'email', caveat: null, key: `person:${DAVE}`, title: 'Dave wrote to us', accountName: 'Kenco Logistics', accountHint: null, sourceLine: 'the mailbox', peopleNamed: [{ personaId: 1, name: 'Dave Kiesling', title: 'VP' }], provider: 'test', calls: 1, warnings: [], contextRevision: 'rev-1', support: [] };

describe('C57 P2-1: the route wires the mailbox readers from the configured GAP sender', () => {
  it('no sender: the service gets no thread wiring; a sender configured: Sent and Drafts readers ride along (the competing read stubbed so nothing is called)', async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    h.session = { user: { email: 'casey@freightroll.com' } };
    h.client = ledgerDb({}, NOW).client();
    delete process.env.GAP_GMAIL_USER_EMAIL;
    delete process.env.GAP_GOOGLE_REFRESH_TOKEN;
    h.competing = async () => ({ timeline: [], drafts: [] });
    await POST(post({ taskId: 'at_missing' }));
    expect(h.lastDeps?.thread).toBeUndefined();
    process.env.GAP_GMAIL_USER_EMAIL = 'casey@yardflow.ai';
    process.env.GAP_GOOGLE_REFRESH_TOKEN = 'r';
    await POST(post({ taskId: 'at_missing' }));
    expect(typeof (h.lastDeps?.thread as { listDrafts?: unknown } | undefined)?.listDrafts, JSON.stringify({ keys: h.lastDeps ? Object.keys(h.lastDeps) : null, env: [process.env.GAP_GMAIL_USER_EMAIL, process.env.GAP_GOOGLE_REFRESH_TOKEN] })).toBe('function');
    delete process.env.GAP_GMAIL_USER_EMAIL;
    delete process.env.GAP_GOOGLE_REFRESH_TOKEN;
  });
});

describe('POST /api/gap/angles/promote', () => {
  let db: ReturnType<typeof ledgerDb>;
  let taskId: string;
  beforeEach(async () => {
    process.env.GAP_OS_ENABLED = 'true';
    process.env.GAP_ROUTING_ENABLED = 'true';
    delete process.env.GAP_GMAIL_SENDER_JSON;
    h.session = { user: { email: 'casey@freightroll.com' } };
    h.competing = null;
    db = ledgerDb({ accounts: ['Kenco Logistics'], personas: [{ id: 1, name: 'Dave Kiesling', title: 'VP', email: DAVE, account_name: 'Kenco Logistics', do_not_contact: false, hubspot_contact_id: '1', persona_lane: null }], inbound: [{ id: 'm-1', thread_id: 't-1', rfc_message_id: '<m1@k>', from_email: DAVE, from_name: 'Dave', subject: 'Re: yards', body_text: 'Hello', received_at: new Date('2026-09-16T14:02:00Z'), source: 'gmail', thread: { account_name: 'Kenco Logistics' } }] }, NOW);
    h.client = db.client();
    const q = await queueAgentTask(h.client as never, { kind: 'develop_angle', itemKey: `person:${DAVE}`, itemToken: '', day: '2026-10-08', revision: 0, request: 'pursue', requestedBy: 'casey@freightroll.com', requestedFrom: 'app', input: { decision: 'pursue', email: DAVE, accountName: 'Kenco Logistics', inboundMessageId: 'm-1', threadId: 't-1', lastWroteAt: '2026-09-16T14:02:00.000Z' } }, { now: NOW, actor: 'casey@freightroll.com' });
    taskId = q.id;
    await runAgentTasks(h.client as never, { now: new Date(NOW.getTime() + 1000), max: 5, claimer: 'test', handlers: { develop_angle: async () => ({ ok: true, result: ANGLE }) } });
  });

  it('a call answers 200 with the line and the links; a bad body is 400; an unknown task 404; signed out 401', async () => {
    const res = await POST(post({ taskId, personaId: 1, action: 'call' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, lane: 'call', href: '/gap/call/1', links: { taskId, contextRevision: 'rev-1' }, line: expect.stringMatching(/^Nothing drafted: the angle is a call/) });
    expect((await POST(post({ taskId, action: 'send' }))).status).toBe(400);
    expect((await POST(post({ taskId: 'at_nope', action: 'call' }))).status).toBe(404);
    expect(await (await POST(post({ taskId: 'at_nope' }))).json()).toMatchObject({ ok: false, error: 'task_not_found' });
    h.session = null;
    expect((await POST(post({ taskId, action: 'call' }))).status).toBe(401);
    expect(db.store.gapAuditEvent.filter((e) => e.kind === 'angle.promoted')).toHaveLength(1);
  });

  it('the email lane with no GAP sender configured is a refusal in words, never a draft; competing work the seller has not chosen is 409 with the line and the offers', async () => {
    const res = await POST(post({ taskId, personaId: 1 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ ok: false, error: 'gap_sender_unconfigured' });
    h.competing = async () => ({ timeline: [], drafts: [{ id: 'r-edited', provider: 'gmail', threadId: 't-1', to: [DAVE], subject: 'Phased 2027 proposal', dealId: null, purpose: 'buyer_conversation', updatedAt: '2026-10-05T11:30:00.000Z', sellerEdited: true }] });
    const conflict = await POST(post({ taskId, personaId: 1 }));
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({ ok: false, reason: 'competing_seller_edit', offers: ['revise'], competing: { found: true, items: [{ id: 'r-edited', sellerEdited: true }] }, line: expect.stringContaining('revise it, GAP will not write a second one') });
    const revise = await POST(post({ taskId, personaId: 1, choice: 'revise' }));
    expect(revise.status).toBe(200);
    expect(await revise.json()).toMatchObject({ ok: true, lane: 'existing', choice: 'revise', item: { id: 'r-edited' } });
    expect(db.store.gapAuditEvent.filter((e) => e.subject_type === 'inbound_message')).toHaveLength(0);
  });
});
