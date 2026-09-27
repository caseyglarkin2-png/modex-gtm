/**
 * Red team T2: ONE SEND HISTORY PER PERSON.
 *
 * Execution history was read per routing card. Every routing run writes new
 * cards, so a newer card for a person already emailed "forgot" the send and
 * offered step 0 again (Kroger persona 1886, Joey Maggard). These pin the
 * person-level truth at every execution read: the send gate
 * (prepareSellerEmail / sendSellerEmail), next-touch (what resolveActionPack
 * renders) and the queue (attachTouches).
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/gap/routing/inputs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/gap/routing/inputs')>();
  return { ...actual, readComms: vi.fn(async () => ({ meetingBooked: false })) };
});

import { claimStep, historyFromRows, personSendHistory, personStepKey } from '@/lib/gap/execution/person-history';
import { computeNextTouch } from '@/lib/gap/execution/next-touch';
import { prepareSellerEmail } from '@/lib/gap/execution/seller-draft';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { attachTouches, type QueueItem } from '@/lib/gap/routing/queue';
import { DIRECT_CLAIMED, DIRECT_RELEASED, DIRECT_SENT, DRAFT_SENT, DRAFTED, MANUAL_SENT } from '@/lib/gap/execution/draft-ledger';
import { NOW, baseDeps, db, prismaOf, type Db } from './fixtures/seller-db';
import { findFirstFrom, findManyFrom } from './fixtures/where';

const ACTOR = 'casey@freightroll.com';
const JOEY = 'joey.maggard@kroger.com';
const SENT_AT = '2026-09-25T20:59:19.000Z';

/** Decision A (older, the card Casey sent from by hand) + decision B (newer email card, same person). */
function twoCards(): Db {
  const d = db();
  const a = d.decisions.find((x) => x.id === 'dec-joey')!;
  a.id = 'dec-joey-a';
  a.created_at = new Date(NOW.getTime() - 2 * 86_400_000);
  d.decisions.push({ ...a, id: 'dec-joey-b', created_at: NOW });
  return d;
}

function manualSent(decisionId: string, stepIndex = 0, extra: Record<string, unknown> = {}) {
  return {
    id: `man-${decisionId}-${stepIndex}`,
    kind: MANUAL_SENT,
    subject_type: 'routing_decision',
    subject_id: decisionId,
    created_at: new Date(SENT_AT),
    payload: { engine: 'manual', channel: 'gmail', status: 'sent', routingDecisionId: decisionId, hypothesisId: 'hyp-kr', personaId: 1886, accountName: 'Kroger', recipient: JOEY, senderIdentity: 'casey@yardflow.ai', subject: 'doors versus spots', sequenceVersionId: 'ver-hc', stepIndex, gmailSentMessageId: '1a0da5d97f8142c0', gmailThreadId: '1a0da5c10f51fe73', sentAt: SENT_AT, ...extra },
  };
}

/** The fixture plus the tables next-touch and the send path read. */
function fullPrisma(d: Db) {
  const p: any = prismaOf(d);
  p.unsubscribedEmail = { findFirst: vi.fn(async () => null) };
  p.conversationDisposition = { findFirst: vi.fn(async () => null) };
  p.inboundMessage = { findFirst: vi.fn(async () => null) };
  p.emailLog = { create: vi.fn(async () => ({ id: 1 })) };
  p.$executeRaw = vi.fn(async () => 1);
  p.$transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(p));
  p.gapAuditEvent.findFirst = vi.fn(async (args: any) => findFirstFrom(d.audit, args));
  return p;
}

const touchDeps = { gapSender: () => ({ serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai' }), getThread: async () => [] };
const realTouch = (prisma: any) => ({ nextTouch: (pr: any, id: string, now: Date) => computeNextTouch(pr, id, now, touchDeps) });

describe('A. step 0 is refused on a NEWER card when an OLDER card for the same person was sent', () => {
  it('manual step 0 on card A, step 0 on card B -> first_touch_already_sent (real next-touch)', async () => {
    const d = twoCards();
    d.audit.push(manualSent('dec-joey-a'));
    const prisma = fullPrisma(d);
    const r = await prepareSellerEmail(prisma, { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, { ...baseDeps(d), ...realTouch(prisma) });
    expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
  });

  it('the history gate refuses even when next-touch is stale (reports not_started)', async () => {
    const d = twoCards();
    d.audit.push(manualSent('dec-joey-a'));
    const r = await prepareSellerEmail(fullPrisma(d), { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
    expect((r as { detail?: string }).detail).toContain('dec-joey-a');
  });

  it('SEND FROM YARDFLOW on card B never calls Gmail for step 0', async () => {
    const d = twoCards();
    d.audit.push(manualSent('dec-joey-a'));
    const prisma = fullPrisma(d);
    const direct = vi.fn();
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, confirm: { contentHash: 'a'.repeat(64), recipient: JOEY } }, { ...baseDeps(d), activeOpportunity: async () => false, directAdapter: direct as any });
    expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('a DRAFT_SENT or DIRECT_SENT on another card counts the same as a manual send', async () => {
    for (const rows of [
      [
        { id: 'dr', kind: DRAFTED, subject_type: 'routing_decision', subject_id: 'dec-joey-a', created_at: new Date(SENT_AT), payload: { gmailDraftId: 'r1', stepIndex: 0, recipient: JOEY, personaId: 1886, sequenceVersionId: 'ver-hc', subject: 's', bodySnapshot: 'b', createdAt: SENT_AT } },
        { id: 'ds', kind: DRAFT_SENT, subject_type: 'routing_decision', subject_id: 'dec-joey-a', created_at: new Date(SENT_AT), payload: { gmailDraftId: 'r1', gmailSentMessageId: 'm1', gmailThreadId: 't1', sentAt: SENT_AT } },
      ],
      [{ ...manualSent('dec-joey-a'), id: 'dx', kind: DIRECT_SENT }],
    ]) {
      const d = twoCards();
      d.audit.push(...rows);
      const r = await prepareSellerEmail(fullPrisma(d), { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, baseDeps(d));
      expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
    }
  });

  it('a DUPLICATE persona row with the same address is the same person', async () => {
    const d = twoCards();
    d.personas.push({ ...d.personas[0], id: 9999 });
    d.decisions.push({ ...d.decisions[0], id: 'dec-dup', persona_id: 9999, created_at: new Date(NOW.getTime() - 86_400_000 * 3) });
    d.audit.push(manualSent('dec-dup', 0, { personaId: 9999 }));
    const r = await prepareSellerEmail(fullPrisma(d), { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'first_touch_already_sent' });
  });

  it('an unresolved send claim on another card blocks the step too (outcome unknown)', async () => {
    const d = twoCards();
    d.audit.push({ id: 'c1', kind: DIRECT_CLAIMED, subject_type: 'routing_decision', subject_id: 'dec-joey-a', created_at: new Date(SENT_AT), payload: { idempotencyKey: `gmail_direct:dec-joey-a:ver-hc:0:${JOEY}:${'b'.repeat(64)}`, claimedAt: SENT_AT } });
    const r = await prepareSellerEmail(fullPrisma(d), { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
  });

  it('nothing sent to this person anywhere: step 0 on card B is still allowed (the gate is not a blanket block)', async () => {
    const d = twoCards();
    const r = await prepareSellerEmail(fullPrisma(d), { decisionId: 'dec-joey-b', actor: ACTOR, now: NOW, stepIndex: 0 }, baseDeps(d));
    expect(r.ok).toBe(true);
  });
});

describe('B. next touch for the NEWER card is the person\'s: waiting, never step 0', () => {
  it('computeNextTouch(B) after a manual send on A -> waiting on touch 2 (Fri Sep 25 -> Thu Oct 1)', async () => {
    const d = twoCards();
    d.audit.push(manualSent('dec-joey-a'));
    const t = await computeNextTouch(fullPrisma(d), 'dec-joey-b', new Date('2026-09-28T12:00:00Z'), touchDeps);
    expect(t).toMatchObject({ state: 'waiting', stepIndex: 1, threadFrom: { gmailSentMessageId: '1a0da5d97f8142c0' } });
  });
});

describe('the queue reads the person\'s history completely (no take:500, no age window)', () => {
  const item = (id: string): QueueItem =>
    ({ id, action: 'enroll_gap_sequence', lane: 'work_queue', ruleId: 'enroll', priority: 1, blocked: false, target: null, explain: null, account: { name: 'Kroger', hubspotCompanyId: null, tam: 'in', tamTier: 'A', heatTier: 1 }, persona: { id: 1886, personaKey: null, displayName: 'joey', email: JOEY, hubspotContactId: null, title: null, phone: null, linkedinUrl: null }, hypothesis: { id: 'hyp-kr', status: 'active', family: 'hidden_capacity', confidence: 1 }, suppression: { class: 'none', hits: [] }, humanAction: null, humanActionAt: null, createdAt: NOW }) as unknown as QueueItem;

  it('a send 300 days ago, behind 600 newer ledger rows for other people, still makes card B a sequence card', async () => {
    const d = twoCards();
    d.audit.push({ ...manualSent('dec-joey-a'), created_at: new Date(NOW.getTime() - 300 * 86_400_000), payload: { ...manualSent('dec-joey-a').payload, sentAt: new Date(NOW.getTime() - 300 * 86_400_000).toISOString() } });
    for (let i = 0; i < 600; i += 1) d.audit.push({ ...manualSent(`other-${i}`), id: `o${i}`, created_at: NOW, payload: { ...manualSent(`other-${i}`).payload, personaId: 5000 + i, recipient: `p${i}@x.com` } });
    const items = [item('dec-joey-b')];
    await attachTouches(fullPrisma(d), items);
    expect(items[0].touch).toBeTruthy();
    expect(items[0].touch!.state).not.toBe('not_started');
  });

  it('a person with no history keeps a first-email card (no touch)', async () => {
    const d = twoCards();
    const items = [item('dec-joey-b')];
    await attachTouches(fullPrisma(d), items);
    expect(items[0].touch).toBeUndefined();
  });

  it('a history read that fails marks the card unknown, never a first email', async () => {
    const d = twoCards();
    const p = fullPrisma(d);
    p.routingDecision.findMany = vi.fn(async () => {
      throw new Error('db down');
    });
    const items = [item('dec-joey-b')];
    await attachTouches(p, items);
    expect(items[0].touch).toMatchObject({ state: 'unknown' });
  });
});

describe('personSendHistory', () => {
  it('orders sends by step then time, joins DRAFT_SENT to its DRAFTED row, and resolves claims', () => {
    const rows = [
      { id: 'e1', subject_id: 'A', kind: DIRECT_CLAIMED, created_at: new Date(1), payload: { idempotencyKey: 'k-open', claimedAt: '2026-09-01T00:00:00Z', stepIndex: 2 } },
      { id: 'e2', subject_id: 'A', kind: DIRECT_CLAIMED, created_at: new Date(2), payload: { idempotencyKey: 'k-released', claimedAt: '2026-09-01T00:00:00Z' } },
      { id: 'e3', subject_id: 'A', kind: DIRECT_RELEASED, created_at: new Date(3), payload: { idempotencyKey: 'k-released' } },
      { id: 'e4', subject_id: 'A', kind: DIRECT_CLAIMED, created_at: new Date(4), payload: { idempotencyKey: 'k-sent' } },
      { id: 'e5', subject_id: 'A', kind: DIRECT_SENT, created_at: new Date(5), payload: { idempotencyKey: 'k-sent', stepIndex: 1, gmailSentMessageId: 'm-direct', sentAt: '2026-09-10T00:00:00Z', recipient: JOEY } },
      { id: 'e6', subject_id: 'B', kind: DRAFTED, created_at: new Date(6), payload: { gmailDraftId: 'r', stepIndex: 0, recipient: JOEY, createdAt: '2026-09-01T00:00:00Z' } },
      { id: 'e7', subject_id: 'B', kind: DRAFT_SENT, created_at: new Date(7), payload: { gmailDraftId: 'r', gmailSentMessageId: 'm-draft', sentAt: '2026-09-02T00:00:00Z' } },
    ];
    const h = historyFromRows(rows, 1886, JOEY, ['A', 'B']);
    expect(h.sent.map((s) => [s.stepIndex, s.engine, s.decisionId])).toEqual([
      [0, 'gmail_draft', 'B'],
      [1, 'gmail_direct', 'A'],
    ]);
    expect(h.unresolvedClaims.map((c) => [c.idempotencyKey, c.stepIndex])).toEqual([['k-open', 2]]);
    expect(h.drafts[0]).toMatchObject({ fate: 'sent', decisionId: 'B' });
  });

  it('reads a legacy per-card claim key\'s step; the new key is person + recipient + step', () => {
    expect(claimStep(`gmail_direct:dec-1:ver-hc:3:${JOEY}:${'f'.repeat(64)}`, {})).toBe(3);
    expect(personStepKey(1886, ' Joey.Maggard@Kroger.com ', 0)).toBe(`gmail_direct:person:1886:${JOEY}:step:0`);
    expect(claimStep(personStepKey(1886, JOEY, 2), {})).toBe(2);
  });

  it('collects decisions by persona, by any persona sharing the address, and by ledger rows naming the address', async () => {
    const d = twoCards();
    d.personas.push({ ...d.personas[0], id: 9999 });
    d.decisions.push({ ...d.decisions[0], id: 'dec-dup', persona_id: 9999 });
    d.audit.push({ ...manualSent('dec-orphan'), id: 'orph' });
    const h = await personSendHistory(fullPrisma(d), 1886, JOEY.toUpperCase());
    expect(h.decisionIds).toEqual(['dec-dup', 'dec-joey-a', 'dec-joey-b', 'dec-orphan']);
    expect(h.sent).toHaveLength(1);
    expect(findManyFrom(d.audit, { where: { subject_id: { in: h.decisionIds } } })).toHaveLength(1);
  });
});
