// @vitest-environment node
/**
 * Sprint 5 review, SHOULD 3 (R55): closure dropped a live promise. "Send Ben the Columbus detention numbers" (due
 * Oct 10) was skipped when the Columbus deal closed won and stayed hidden when it reopened (the reopen step carried no
 * detail). Now the reopen step lists what the closure skipped, with the due dates, and each one is restorable: a NEW
 * open obligation with the same words, person, deal and due date (the skipped record stays terminal), once per skip,
 * refused while the deal is closed and for anything the closure did not skip.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { ledgerDb } from './fixtures/ledger-db';

const h = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return h.client;
  },
}));
vi.mock('@/lib/auth', () => ({ auth: async () => ({ user: { email: 'casey@freightroll.com' } }) }));

import { POST } from '@/app/api/gap/commitments/route';
import { restoreSkippedObligation, skippedAtClosureOn, syncDealStates } from '@/lib/gap/deals/closure';
import { ensureCommitment, loadCommitment, loadCommitments, transitionCommitment } from '@/lib/gap/work/commitments';
import { restoredIdFor, skippedAtClosureOf } from '@/lib/gap/work/commitment-model';

const ACCOUNT = 'Kroger Scratch Co';
const ACTOR = 'casey@freightroll.com';
const NOW = new Date('2026-10-07T13:00:00Z');
const PILOT = { id: '392057001', name: 'YardFlow - Kroger Scratch Co' };
const COLUMBUS = { id: '392057002', name: 'Kroger Scratch Co Columbus DC' };
const WON = { ...COLUMBUS, stage: 'closedwon', won: true, closedAt: '2026-10-07T12:00:00.000Z' };
const DETENTION = 'capture:detention';
const post = (body: unknown) => new NextRequest('http://localhost/api/gap/commitments', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

let db: ReturnType<typeof ledgerDb>;
beforeEach(async () => {
  process.env.GAP_OS_ENABLED = 'true';
  process.env.GAP_ROUTING_ENABLED = 'true';
  db = ledgerDb({ accounts: [ACCOUNT] });
  h.client = db.client();
  const p = h.client;
  await ensureCommitment(p, { accountName: ACCOUNT, kind: 'deliverable', title: 'Send Ben the Columbus detention numbers', basis: 'Ben: can you send the detention numbers by Friday?', dueAt: '2026-10-10T13:00:00.000Z', person: { personaId: 2, name: 'Ben Scratch', email: 'ben@kroger.example.com' }, dealId: COLUMBUS.id, source: { kind: 'capture', id: 'detention' } }, { actor: ACTOR, now: NOW });
  await ensureCommitment(p, { accountName: ACCOUNT, kind: 'buyer_promise', title: 'Ben sends the gate volumes', dueAt: '2026-10-09T13:00:00.000Z', dealId: COLUMBUS.id, status: 'waiting', dependency: 'their delivery', source: { kind: 'capture', id: 'volumes' } }, { actor: ACTOR, now: NOW });
  await ensureCommitment(p, { accountName: ACCOUNT, kind: 'task', title: 'Old Columbus note the seller dropped', dealId: COLUMBUS.id, source: { kind: 'seller', id: 'dropped' } }, { actor: ACTOR, now: NOW });
  await transitionCommitment(p, { commitmentId: 'seller:dropped', to: 'skipped', reason: 'not needed', actor: ACTOR, now: NOW });
  await syncDealStates(p, { accountName: ACCOUNT, open: [PILOT, COLUMBUS], closed: [], now: NOW });
});

const close = () => syncDealStates(h.client, { accountName: ACCOUNT, open: [PILOT], closed: [WON], now: NOW });
const reopen = () => syncDealStates(h.client, { accountName: ACCOUNT, open: [PILOT, COLUMBUS], closed: [], now: new Date('2026-10-08T14:00:00Z') });
const reopenStep = async () => (await loadCommitments(h.client, { accountNames: [ACCOUNT] })).find((c) => c.source.id.startsWith(`reopen:${COLUMBUS.id}:`))!;

describe('Sprint 5 review: the reopen step lists what the closure skipped, each restorable', () => {
  it('the reopen step lists the closure skips with their due dates, earliest first; a skip by the seller is not listed', async () => {
    expect((await close()).skipped).toBe(2);
    expect((await loadCommitment(h.client, DETENTION))?.status).toBe('skipped');
    await reopen();
    const step = await reopenStep();
    expect(step.title).toBe('Reopened: decide the next step on "Kroger Scratch Co Columbus DC"');
    expect(step.detail?.skippedAtClosure).toEqual([
      { commitmentId: 'capture:volumes', title: 'Ben sends the gate volumes', kind: 'buyer_promise', dueAt: '2026-10-09T13:00:00.000Z', person: null },
      { commitmentId: DETENTION, title: 'Send Ben the Columbus detention numbers', kind: 'deliverable', dueAt: '2026-10-10T13:00:00.000Z', person: 'Ben Scratch' },
    ]);
  });

  it('restore is refused while the deal is closed, for a skip by the seller, and for an unknown obligation', async () => {
    await close();
    expect(await restoreSkippedObligation(h.client, { commitmentId: DETENTION, actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'deal_closed' });
    await reopen();
    expect(await restoreSkippedObligation(h.client, { commitmentId: 'seller:dropped', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'not_skipped_at_closure' });
    expect(await restoreSkippedObligation(h.client, { commitmentId: 'capture:nothing', actor: ACTOR, now: NOW })).toEqual({ ok: false, reason: 'not_found' });
  });

  it('a restore is a new open obligation with the same words, person, deal and due date; the skipped record stays; twice restores once', async () => {
    await close();
    await reopen();
    const r = await restoreSkippedObligation(h.client, { commitmentId: DETENTION, actor: ACTOR, now: new Date('2026-10-08T15:00:00Z') });
    expect(r.ok && r.created).toBe(true);
    const restored = await loadCommitment(h.client, restoredIdFor(DETENTION));
    expect(restored).toMatchObject({ status: 'open', kind: 'deliverable', title: 'Send Ben the Columbus detention numbers', basis: 'Ben: can you send the detention numbers by Friday?', dueAt: '2026-10-10T13:00:00.000Z', dealId: COLUMBUS.id, person: { name: 'Ben Scratch' }, detail: { restoredFrom: DETENTION } });
    expect((await loadCommitment(h.client, DETENTION))?.status).toBe('skipped');
    const again = await restoreSkippedObligation(h.client, { commitmentId: DETENTION, actor: ACTOR, now: new Date('2026-10-08T15:01:00Z') });
    expect(again.ok && again.created).toBe(false);
    // A buyer promise comes back waiting on their delivery.
    await restoreSkippedObligation(h.client, { commitmentId: 'capture:volumes', actor: ACTOR, now: NOW });
    expect(await loadCommitment(h.client, restoredIdFor('capture:volumes'))).toMatchObject({ status: 'waiting', dependency: 'their delivery' });
    // The step now reads both as restored; a later reopening lists neither again.
    const all = await loadCommitments(h.client, { accountNames: [ACCOUNT] });
    expect(skippedAtClosureOf(await reopenStep(), all).map((s) => s.restored)).toEqual([true, true]);
    expect(skippedAtClosureOn(all, COLUMBUS)).toEqual([]);
  });

  it('POST op restore: 201 then 200 for the same skip; 409 while the deal is closed, with the reason', async () => {
    await close();
    const closed = await POST(post({ op: 'restore', commitmentId: DETENTION }));
    expect([closed.status, await closed.json()]).toEqual([409, { error: 'deal_closed' }]);
    await reopen();
    const first = await POST(post({ op: 'restore', commitmentId: DETENTION }));
    expect(first.status).toBe(201);
    const second = await POST(post({ op: 'restore', commitmentId: DETENTION }));
    expect(second.status).toBe(200);
    expect((await loadCommitments(h.client, { accountNames: [ACCOUNT] })).filter((c) => c.commitmentId === restoredIdFor(DETENTION))).toHaveLength(1);
  });
});
