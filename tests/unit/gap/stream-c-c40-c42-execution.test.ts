/* eslint-disable @typescript-eslint/no-explicit-any */
// @vitest-environment node
/**
 * C40, C41, C42 (GAP OS commercial context and execution audit, 2026-10-08): approval, send and reconciliation stay
 * bound, with fault cases.
 *   C40  the approval creates a draft; the app send rechecks the gates at action time; a message sent from Gmail by
 *        hand is outside that gate and reconciliation says so (route gmail_by_hand, body not read, never the approved
 *        copy's hash).
 *   C41  an injected timeout AFTER Gmail accepted the send: the outcome is unknown, a retry never sends again, the
 *        preview row carries the attribution (hash, recipient, sender, subject, thread) and the eventual readback from
 *        Sent records one send with recipient, sender, thread and the Gmail id; "delivered" is never inferred from
 *        accepted. The native sequence adapter reads back after a lost answer and never turns a lost answer into a
 *        refusal a caller may retry blind.
 *   C42  a suppression set between review and confirm blocks the app send before anything is claimed (the enroll
 *        lane's own case is in enroll-service.test.ts).
 */
import { describe, expect, it, vi } from 'vitest';
import { sendSellerEmail } from '@/lib/gap/execution/seller-send';
import { DIRECT_CLAIMED, DIRECT_PREVIEWED, DIRECT_SENT, MANUAL_SENT, REPLY_COPIED, REPLY_SENT, COPY_RELEASED } from '@/lib/gap/execution/draft-ledger';
import { reconcileUnknownSends, UNKNOWN_SEND_MIN_AGE_MS, type SentMatch } from '@/lib/gap/execution/unknown-send-reconcile';
import { reconcileCopiesFromSent } from '@/lib/gap/execution/copies-reconcile';
import { hubspotSequenceAdapter, isUncertainEnrollment } from '@/lib/gap/execution/hubspot-sequence-adapter';
import { foldReplyStates } from '@/lib/gap/execution/seller-reply';
import { projectActivity } from '@/lib/gap/work/activity';
import type { ExecutionIntent, ExecutionReceipt } from '@/lib/gap/execution/contract';
import { NOW, baseDeps, db, prismaOf, type Db } from './fixtures/seller-db';
import { ledgerDb } from './fixtures/ledger-db';
import { findManyFrom } from './fixtures/where';

const YF = { serviceAccountJson: '{}', userEmail: 'casey@yardflow.ai', displayName: 'Casey Larkin' };
const ACTOR = 'casey@freightroll.com';
const JOEY = 'joey.maggard@kroger.com';

/** The seller-send harness (seller-send.test.ts): a lock that serializes, EmailLog, human_action. */
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
  const acted = new Set<string>();
  p.routingDecision.updateMany = vi.fn(async ({ where, data }: any) => {
    if (acted.has(where.id)) return { count: 0 };
    acted.add(where.id);
    d.decisions.find((x) => x.id === where.id).human_action = data.human_action;
    return { count: 1 };
  });
  p.gapAuditEvent.findMany = vi.fn(async (args: any) => findManyFrom(d.audit, args));
  return p;
}

const deps = (d: Db, direct: (intent: ExecutionIntent, wire: any) => Promise<ExecutionReceipt>, extra: Record<string, unknown> = {}) => ({
  ...baseDeps(d, 'pass'),
  gapSender: () => YF,
  signature: async () => null,
  activeOpportunity: async () => ({ status: 'CLEAR' as const }),
  directAdapter: direct as any,
  ...extra,
});

async function preview(prisma: any, d: Db, dd: ReturnType<typeof deps>) {
  const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW }, dd);
  if (!r.ok || !('preview' in r)) throw new Error(`expected a preview, got ${JSON.stringify(r)}`);
  return r.preview;
}

describe('C41: a timeout after Gmail accepted the send, then the eventual readback', () => {
  it('unknown at send, no retry double-send, the attribution survives the preview and the readback, delivered never inferred', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    // Gmail accepts and files the message in Sent, then the answer is lost on the wire.
    const sentFolder: SentMatch[] = [];
    const acceptedThenLost = vi.fn(async (intent: ExecutionIntent, wire: { to: string; subject: string }): Promise<ExecutionReceipt> => {
      sentFolder.push({ id: 'gm-accepted-1', threadId: 'thr-accepted-1', internalDate: new Date(intent.now.getTime() + 2000), to: wire.to, subject: wire.subject });
      return { engine: 'gmail_direct', status: 'refused', engineId: null, createdAt: intent.now, refusalReason: 'fetch failed: socket hang up' };
    });
    const dd = deps(d, acceptedThenLost);
    const pv = await preview(prisma, d, dd);
    const confirm = { contentHash: pv.contentHash, recipient: pv.to };
    const first = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm }, dd);
    expect(first).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(acceptedThenLost).toHaveBeenCalledTimes(1);

    // The retry never reaches Gmail: the claim stays open.
    const retry = vi.fn(async (intent: ExecutionIntent): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'gm-2', threadId: 't2', createdAt: intent.now, sentAt: intent.now }));
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: new Date(NOW.getTime() + 60_000), confirm }, deps(d, retry))).toMatchObject({ ok: false, reason: 'send_in_progress_or_unknown' });
    expect(retry).not.toHaveBeenCalled();

    // The preview row carries what a reconciler needs to attribute the send: hash, recipient, sender, subject, thread.
    const previewed = d.audit.find((a) => a.kind === DIRECT_PREVIEWED)!;
    expect(previewed.payload).toMatchObject({ contentHash: pv.contentHash, recipient: JOEY, sender: 'casey@yardflow.ai', subject: 'Doors versus spots', gmailThreadId: null, stepIndex: 0 });
    expect(d.audit.filter((a) => a.kind === DIRECT_CLAIMED)).toHaveLength(1);

    // The eventual readback from Sent records exactly one send with recipient, sender, thread and the Gmail id.
    const later = new Date(NOW.getTime() + UNKNOWN_SEND_MIN_AGE_MS + 60_000);
    const listSent = vi.fn(async () => sentFolder);
    const r = await reconcileUnknownSends(prisma, { now: later }, { listSent, mailbox: 'casey@yardflow.ai' });
    expect(r).toMatchObject({ checked: 1, reconciled: 1, stillUnknown: [] });
    const sent = d.audit.filter((a) => a.kind === DIRECT_SENT);
    expect(sent).toHaveLength(1);
    expect(sent[0].payload).toMatchObject({ status: 'sent', recipient: JOEY, senderIdentity: 'casey@yardflow.ai', gmailSentMessageId: 'gm-accepted-1', gmailThreadId: 'thr-accepted-1', subject: 'Doors versus spots', stepIndex: 0, reconciledFromSent: true });
    // C41 (the residual closed): the body hash, the sender and the reviewed subject the seller confirmed survive the readback.
    expect(sent[0].payload).toMatchObject({ contentHash: pv.contentHash, attributedFromPreview: true, reviewedSubject: 'Doors versus spots' });
    expect(typeof pv.contentHash).toBe('string');
    expect('delivered' in sent[0].payload).toBe(false);
    expect(sent[0].payload.status).not.toBe('delivered');
    // The activity projection reads it as a message sent (provider-proven), never as delivered.
    expect(projectActivity({ kind: DIRECT_SENT, subject_type: 'routing_decision', subject_id: 'dec-joey', payload: sent[0].payload, created_at: later })).toMatchObject({ kind: 'message_sent', basis: 'provider', evidence: 'gm-accepted-1' });

    // After the readback, a third press answers ALREADY SENT with the reconciled message, and Gmail is never called.
    const third = vi.fn(async (intent: ExecutionIntent): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'gm-3', threadId: 't3', createdAt: intent.now, sentAt: intent.now }));
    expect(await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: later, confirm }, deps(d, third))).toMatchObject({ ok: true, alreadySent: true, sent: { gmailSentMessageId: 'gm-accepted-1', recipient: JOEY } });
    expect(third).not.toHaveBeenCalled();
    expect(d.audit.filter((a) => a.kind === DIRECT_SENT)).toHaveLength(1);
  });
});

describe('C42: a suppression set between review and confirm blocks the app send before anything is claimed', () => {
  it('the injected reader refuses at confirm: recipient_suppressed, no claim, Gmail never called; unreadable refuses too', async () => {
    const d = db();
    const prisma = sendPrisma(d);
    const gmail = vi.fn(async (intent: ExecutionIntent): Promise<ExecutionReceipt> => ({ engine: 'gmail_direct', status: 'sent', engineId: 'gm-1', threadId: 't1', createdAt: intent.now, sentAt: intent.now }));
    let suppressed = false;
    const suppression = vi.fn(async (recipient: string) => {
      if (suppressed) throw new Error(`Cross-plane suppression refused this send: modex_do_not_contact: ${recipient} (do_not_send)`);
    });
    const dd = deps(d, gmail, { suppression });
    const pv = await preview(prisma, d, dd);
    suppressed = true; // the suppression lands between the review and the confirm
    const r = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: pv.to } }, dd);
    expect(r).toMatchObject({ ok: false, reason: 'recipient_suppressed' });
    expect((r as { detail?: string }).detail).toContain('do_not_send');
    expect(gmail).not.toHaveBeenCalled();
    expect(d.audit.filter((a) => a.kind === DIRECT_CLAIMED)).toHaveLength(0);
    expect(suppression).toHaveBeenCalledWith(JOEY);

    const unreadable = deps(d, gmail, { suppression: vi.fn(async () => { throw new Error('Cross-plane suppression refused this send: suppression authority unreachable: ECONNRESET'); }) });
    const u = await sendSellerEmail(prisma, { decisionId: 'dec-joey', actor: ACTOR, now: NOW, confirm: { contentHash: pv.contentHash, recipient: pv.to } }, unreadable);
    expect(u).toMatchObject({ ok: false, reason: 'suppression_unreadable' });
    expect(gmail).not.toHaveBeenCalled();
  });
});

describe('C40: a message sent from Gmail by hand is recorded as what Sent proves, never as the approved copy', () => {
  const COPIED_AT = new Date('2026-10-08T15:00:00Z');
  const LATER = new Date('2026-10-08T20:00:00Z');
  const FROM = 'ann@kroger-scratch-co.example.com';
  const world = () =>
    ledgerDb({
      accounts: ['Kroger Scratch Co', 'Fedex Scratch Co'],
      routingDecisions: [{ id: 'dec-1', hypothesis_id: 'hyp-1', persona_id: 3, account_name: 'Fedex Scratch Co', action: 'enroll_gap_sequence', lane: 'work_queue', created_at: new Date('2026-10-08T10:00:00Z') }],
      inbound: [{ id: 'm1', thread_id: 'th-1', from_email: FROM, from_name: 'Ann Scratch', subject: 'Re: doors', snippet: 'Send the comparison', received_at: new Date('2026-10-08T12:00:00Z'), source: 'gmail' }],
      audit: [
        { id: 'c1', kind: REPLY_COPIED, subject_type: 'inbound_message', subject_id: 'm1', actor: ACTOR, created_at: COPIED_AT, payload: { accountName: 'Kroger Scratch Co', contentHash: 'approved-reply-hash', at: COPIED_AT.toISOString() } },
        { id: 'c2', kind: COPY_RELEASED, subject_type: 'routing_decision', subject_id: 'dec-1', actor: ACTOR, created_at: COPIED_AT, payload: { recipient: 'glen@fedex-scratch-co.example.com', stepIndex: 0, contentHash: 'approved-cold-hash', at: COPIED_AT.toISOString() } },
      ],
    }, LATER);
  const sent = (id: string, to: string, when: string, subject = 'Re: doors (edited in Gmail)') => ({ id, threadId: `th-${id}`, internalDate: new Date(when), to, subject });

  it('a copied reply sent (and possibly edited) in Gmail: route gmail_by_hand, body not read, the copied hash kept apart, never the sent hash', async () => {
    const dbx = world();
    const c = dbx.client();
    const recordManual = vi.fn(async () => ({ ledgerId: 'led-1', humanAction: 'not_recorded' as const }));
    const listSent = vi.fn(async (recipient: string) => (recipient === FROM ? [sent('s1', `Ann <${FROM}>`, '2026-10-08T16:00:00Z')] : [sent('s2', 'glen@fedex-scratch-co.example.com', '2026-10-08T16:30:00Z', 'Doors versus spots')]));
    const r = await reconcileCopiesFromSent(c, { now: LATER }, { listSent, recordManual });
    expect(r.replies).toMatchObject({ checked: 1, reconciled: 1 });
    expect(r.copies).toMatchObject({ checked: 1, reconciled: 1 });
    const row = dbx.store.gapAuditEvent.find((e) => e.kind === REPLY_SENT)!;
    expect(row.payload).toMatchObject({ engine: 'gmail_manual', route: 'gmail_by_hand', bodyRead: false, contentHash: null, copiedContentHash: 'approved-reply-hash', gmailSentMessageId: 's1', reconciledFromSent: true });
    // The reply's fold never says the sent message carries the copied (approved) hash.
    const states = foldReplyStates(dbx.store.gapAuditEvent.filter((e) => e.subject_id === 'm1') as never, LATER);
    expect(states.sent?.gmailSentMessageId).toBe('s1');
    expect(states.sent?.contentHash).not.toBe('approved-reply-hash');
    expect(states.copied?.contentHash).toBe('approved-reply-hash');
    // The cold copy's manual record says the body was not read.
    expect(recordManual).toHaveBeenCalledTimes(1);
    const manualInput = (recordManual.mock.calls[0] as unknown[])[1] as { match: { matchedOn: string[]; message: { text: string } } };
    expect(manualInput.match.matchedOn).toContain('body_not_read');
    expect(manualInput.match.message.text).toBe('');
    // The activity line for a by-hand send says it went outside GAP's checks.
    const line = projectActivity({ kind: MANUAL_SENT, subject_type: 'routing_decision', subject_id: 'dec-1', payload: { recipient: 'glen@fedex-scratch-co.example.com', stepIndex: 0, gmailSentMessageId: 's2', accountName: 'Fedex Scratch Co' }, created_at: LATER })!;
    expect(line).toMatchObject({ kind: 'message_sent', basis: 'provider' });
    expect(line.line).toContain('sent from Gmail by hand; the copy as sent was not checked by GAP');
    const replyLine = projectActivity({ kind: REPLY_SENT, subject_type: 'inbound_message', subject_id: 'm1', payload: row.payload, created_at: LATER })!;
    expect(replyLine.line).toContain('found in Sent');
    expect(replyLine.line).toContain('not checked by GAP');
  });
});

describe('C41: the native sequence adapter after a lost answer', () => {
  const NOW_HS = new Date('2026-09-24T12:00:00.000Z');
  const intent = (): ExecutionIntent => ({ engine: 'hubspot_sequence', personaId: 7, hypothesisId: 'H1', sequenceVersionId: 'v1', stepIndex: 0, compileIds: [], senderIdentity: 'casey@yardflow.ai', idempotencyKey: 'idem_1', actor: ACTOR, actorKind: 'human', mode: 'live', now: NOW_HS });
  const INPUT = { sequenceId: 'seq_1', contactId: 'contact_1', senderEmail: 'casey@yardflow.ai', userId: '85093129' };
  const withFlag = async (fn: () => Promise<void>) => {
    const saved = process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
    process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = 'true';
    try {
      await fn();
    } finally {
      if (saved === undefined) delete process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED;
      else process.env.GAP_HUBSPOT_SEQUENCE_PUBLISH_ENABLED = saved;
    }
  };

  it('a timeout after HubSpot accepted, then a readback that finds the enrollment: queued with the real id, one POST, no second enrollment', () =>
    withFlag(async () => {
      const enrolled: string[] = [];
      const fetchImpl = vi.fn(async () => {
        enrolled.push('hs_enr_9'); // HubSpot acted; the answer never arrived
        throw new Error('ETIMEDOUT');
      });
      const readback = vi.fn(async () => (enrolled.length ? { enrollmentId: enrolled[0] } : null));
      const receipt = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok', readback });
      expect(receipt).toEqual({ engine: 'hubspot_sequence', status: 'queued', engineId: 'hs_enr_9', createdAt: NOW_HS });
      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(readback).toHaveBeenCalledWith(INPUT);
      expect(isUncertainEnrollment(receipt)).toBe(false);
      // Queued is HubSpot's acceptance of the enrollment: never a send, never a delivery.
      expect(receipt.status).not.toBe('sent');
    }));

  it('a lost answer with a readback that proves nothing was enrolled is a definite refusal; with no readback, or a failing one, the outcome is unknown and a caller must not retry blind', () =>
    withFlag(async () => {
      const fetchImpl = vi.fn(async () => { throw new Error('ETIMEDOUT'); });
      const none = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok', readback: async () => null });
      expect(none).toMatchObject({ status: 'refused', refusalReason: 'hubspot_enroll_network_error: ETIMEDOUT (readback: not enrolled)' });
      expect(isUncertainEnrollment(none)).toBe(false);
      const unknown = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok' });
      expect(unknown.status).toBe('refused');
      expect(unknown.refusalReason).toBe('hubspot_enroll_outcome_unknown: ETIMEDOUT (no readback available)');
      expect(isUncertainEnrollment(unknown)).toBe(true);
      const failing = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl, accessToken: 'tok', readback: async () => { throw new Error('readback 503'); } });
      expect(failing.refusalReason).toBe('hubspot_enroll_outcome_unknown: ETIMEDOUT; readback failed: readback 503');
      expect(isUncertainEnrollment(failing)).toBe(true);
      // A 5xx may have acted too: it takes the readback path; a 4xx is definite.
      const five = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl: vi.fn(async () => ({ ok: false, status: 502 }) as Response), accessToken: 'tok', readback: async () => ({ enrollmentId: 'hs_enr_5' }) });
      expect(five).toMatchObject({ status: 'queued', engineId: 'hs_enr_5' });
      const four = await hubspotSequenceAdapter(intent(), INPUT, { fetchImpl: vi.fn(async () => ({ ok: false, status: 400 }) as Response), accessToken: 'tok', readback: async () => ({ enrollmentId: 'never' }) });
      expect(four).toMatchObject({ status: 'refused', refusalReason: 'hubspot_enroll_failed:400' });
      expect(isUncertainEnrollment(four)).toBe(false);
    }));
});
