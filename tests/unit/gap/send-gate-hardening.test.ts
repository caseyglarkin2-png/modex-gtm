/**
 * Red team T4: HARDEN THE SEND GATE.
 *
 *  - an unresolved Gmail draft for the person + step refuses a direct send
 *    and a second, different draft (`draft_outstanding`)
 *  - an unresolved claim for the person + step blocks ANY content: editing
 *    the copy cannot escape a stuck claim
 *  - only a definitive Gmail 4xx releases a claim; 5xx, a timeout or a lost
 *    answer leaves it unresolved, and a retry never sends a second time
 */
import { describe, expect, it, vi } from 'vitest';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { createSellerGmailDraft } from '@/lib/gap/execution/seller-draft';
import { DIRECT_CLAIMED, DIRECT_RELEASED, DRAFTED } from '@/lib/gap/execution/draft-ledger';
import type { ExecutionReceipt } from '@/lib/gap/execution/contract';
import { NOW, baseDeps, db, prismaOf, type Db } from './fixtures/seller-db';
import { findFirstFrom } from './fixtures/where';

const ACTOR = 'casey@freightroll.com';
const JOEY = 'joey.maggard@kroger.com';

function sendPrisma(d: Db) {
  const p: any = prismaOf(d);
  let lock: Promise<unknown> = Promise.resolve();
  p.$executeRaw = vi.fn(async () => 1);
  p.$transaction = vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
    const run = lock.then(() => fn(p));
    lock = run.catch(() => undefined);
    return run;
  });
  p.emailLog = { ...p.emailLog, create: vi.fn(async () => ({ id: 1 })) };
  p.gapAuditEvent.findFirst = vi.fn(async (args: any) => findFirstFrom(d.audit, args));
  return p;
}

const refusedWith = (reason: string) =>
  vi.fn(async (intent: any): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: reason }));
const sends = () =>
  vi.fn(async (intent: any): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'msg-1', threadId: 'thr-1', createdAt: intent.now, sentAt: intent.now }));

const deps = (d: Db, direct: any, extra: Record<string, unknown> = {}) => ({ ...baseDeps(d), activeOpportunity: async () => ({ status: 'CLEAR' as const }), directAdapter: direct, ...extra });

async function previewHash(prisma: any, d: Db, extra: Record<string, unknown> = {}) {
  const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, deps(d, sends(), extra));
  if (!r.ok || !('preview' in r)) throw new Error(`no preview: ${JSON.stringify(r)}`);
  return r.preview.contentHash;
}

const send = (prisma: any, d: Db, contentHash: string, direct: any, extra: Record<string, unknown> = {}) =>
  sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash, recipient: JOEY } }, deps(d, direct, extra));

function drafted(decisionId: string, contentHash: string, stepIndex = 0) {
  return { id: `dr-${decisionId}`, kind: DRAFTED, subject_type: 'routing_decision', subject_id: decisionId, created_at: new Date(NOW.getTime() - 60_000), payload: { gmailDraftId: `r-${decisionId}`, stepIndex, recipient: JOEY, personaId: 1886, sequenceVersionId: 'ver-hc', subject: 's', bodySnapshot: 'b', contentHash, createdAt: new Date(NOW.getTime() - 60_000).toISOString() } };
}

describe('draft_outstanding', () => {
  it('an unresolved GAP draft for the person + step refuses a direct send; Gmail is never called', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    d.audit.push(drafted('dec-joey', hash));
    const direct = sends();
    const r = await send(prisma, d, hash, direct);
    expect(r).toMatchObject({ ok: false, reason: 'draft_outstanding' });
    expect(direct).not.toHaveBeenCalled();
  });

  it('a draft on ANOTHER card for the same person refuses the send too', async () => {
    const d = db();
    d.decisions.push({ ...d.decisions[0], id: 'dec-joey-old', created_at: new Date(NOW.getTime() - 86_400_000) });
    d.audit.push(drafted('dec-joey-old', 'c'.repeat(64)));
    const prisma = sendPrisma(d);
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, deps(d, sends()));
    expect(r).toMatchObject({ ok: false, reason: 'draft_outstanding' });
  });

  it('a second draft of DIFFERENT copy for the same step is refused; the same copy on the same card returns the existing draft', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    d.audit.push(drafted('dec-joey', 'd'.repeat(64)));
    const other = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, baseDeps(d));
    expect(other).toMatchObject({ ok: false, reason: 'draft_outstanding' });

    const d2 = db();
    const prisma2 = sendPrisma(d2);
    const hash2 = await previewHash(prisma2, d2);
    d2.audit.push(drafted('dec-joey', hash2));
    const same = await createSellerGmailDraft(prisma2, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, baseDeps(d2));
    expect(same).toMatchObject({ ok: true, alreadyDrafted: true });
    expect(hash).toBe(hash2);
  });

  it('a discarded draft does not block', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    d.audit.push(drafted('dec-joey', hash), { id: 'disc', kind: 'execution.gmail_draft_discarded', subject_type: 'routing_decision', subject_id: 'dec-joey', created_at: NOW, payload: { gmailDraftId: 'r-dec-joey', status: 'discarded' } });
    const direct = sends();
    expect(await send(prisma, d, hash, direct)).toMatchObject({ ok: true, alreadySent: false });
    expect(direct).toHaveBeenCalledTimes(1);
  });
});

describe('an unresolved claim blocks the person + step for ANY content', () => {
  it('claim H1 lost its answer; changed copy H2 is still refused; Gmail called once in total', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const h1 = await previewHash(prisma, d);
    const lost = refusedWith('socket hang up');
    expect(await send(prisma, d, h1, lost)).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(lost).toHaveBeenCalledTimes(1);

    // The copy changes (a new template version renders different text).
    d.hypotheses[0].problem_hypothesis = 'My guess is that the gate, not the dock, caps production capacity at Kroger.';
    const h2 = await previewHash(prisma, d).catch(() => 'e'.repeat(64));
    const direct = sends();
    const r = await send(prisma, d, h2, direct);
    expect(r).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(direct).not.toHaveBeenCalled();
  });
});

describe('only a definitive 4xx releases a claim', () => {
  it('Gmail 503 leaves the claim unresolved; the retry does not call Gmail again', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    const unavailable = refusedWith('Gmail send failed (503): backend error');
    expect(await send(prisma, d, hash, unavailable)).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(d.audit.filter((a) => a.kind === DIRECT_RELEASED)).toHaveLength(0);
    const retry = sends();
    expect(await send(prisma, d, hash, retry)).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(retry).not.toHaveBeenCalled();
  });

  it('a timeout is an unknown outcome: claim unresolved, no second send', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    const timeout = refusedWith('Gmail send outcome unknown: no answer within 25000ms');
    expect(await send(prisma, d, hash, timeout)).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    const retry = sends();
    expect(await send(prisma, d, hash, retry)).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(retry).not.toHaveBeenCalled();
    expect(d.audit.filter((a) => a.kind === DIRECT_CLAIMED)).toHaveLength(1);
  });

  it('Gmail 400 is definitive: the claim is released and a later retry may send once', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const hash = await previewHash(prisma, d);
    expect(await send(prisma, d, hash, refusedWith('Gmail send failed (400): invalid to header'))).toMatchObject({ ok: false, reason: 'send_refused' });
    expect(d.audit.filter((a) => a.kind === DIRECT_RELEASED)).toHaveLength(1);
    const retry = sends();
    expect(await send(prisma, d, hash, retry)).toMatchObject({ ok: true, alreadySent: false });
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
