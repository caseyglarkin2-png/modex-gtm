// @vitest-environment node
/**
 * C39 (GAP OS commercial context and execution audit, 2026-10-08): the initial APPROVE is bound to the assigned
 * revision. The audit's independent probe: an assignment went out with copy A at revision 0, the pack moved to copy B,
 * APPROVE at revision 0 drafted B. Now: the approval is validated against the assignment's immutable snapshot (hash,
 * recipient, sender) BEFORE the draft provider, at revision 0 exactly as for a revised copy; the snapshot is passed
 * into the draft service, which rechecks it immediately before the Gmail adapter; and the returned draft's hash is
 * validated. Pinned here:
 *   - assigned A, current B at revision 0: refused, the draft spy at zero
 *   - unchanged A: one draft
 *   - a recipient-only change and a sender-only change: refused, nothing drafted
 *   - a change between preflight and creation: the SERVICE refuses before the Gmail adapter (no side effect)
 *   - a draft that comes back of other copy is reported as a mismatch, never as the approval's draft
 *   - no assignment row for that revision, or a snapshot that does not hash to its own hash: refused
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { NOW as SELLER_NOW, db as sellerDb, prismaOf, gmailFake, baseDeps } from './fixtures/seller-db';
import { approveRequest, loadAssignmentSnapshot } from '@/lib/gap/agents/approve-request';
import { contentHashOf } from '@/lib/gap/execution/action-pack';
import { createSellerGmailDraft, snapshotDrift } from '@/lib/gap/execution/seller-draft';
import { DRAFT_REFUSED, DRAFTED } from '@/lib/gap/execution/draft-ledger';
import { ASSIGNMENT_SENT, ITEM_SUBJECT_TYPE } from '@/lib/gap/work/assignment';
import type { PlanItem } from '@/lib/gap/work/plan';
import type { SellerSettings } from '@/lib/gap/work/settings';

const NOW = new Date('2026-10-08T17:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const ITEM: PlanItem = { key: 'first_touch:dec-1', rank: 0, accountName: 'PepsiCo', kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: { name: 'Karen Ortiz', title: null }, refs: { decisionId: 'dec-1' }, token: 'a'.repeat(32) };
const m = { id: 'cmd-1', threadId: 'th-1', rfcMessageId: '<c@m>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 1 of 1', snippet: '', bodyText: 'APPROVE', rawText: '', bodyHtml: '', deliveryStatus: null, labelIds: [], receivedAt: NOW, headers: {} };
const ctx = { senders: [SELLER], assignmentsByThread: new Map(), assignmentsByMessageId: new Map(), briefingsByThread: new Map() };

const COPY_A = { subject: 'Tulsa: the gate', body: 'Karen, the Tulsa gate queue is in the 10-K.\n\nMy guess is x. Is it?' };
const COPY_B = { subject: 'Tulsa: the gate', body: 'Karen, something else entirely.\n\nMy guess is y. Is it?' };
const HASH_A = contentHashOf(COPY_A);
const HASH_B = contentHashOf(COPY_B);
const TO = 'karen@pepsico.com';

/** The assignment row revision 0 recorded when it went out with copy A to Karen. */
const assignmentRow = (over: Partial<{ revision: number; contentHash: string; to: string | null; subject: string; body: string; senderIdentity: string }> = {}) => ({
  kind: ASSIGNMENT_SENT,
  actor: 'cron',
  subject_type: ITEM_SUBJECT_TYPE,
  subject_id: ITEM.key,
  created_at: new Date(NOW.getTime() - 3_600_000),
  payload: {
    day: '2026-10-08',
    itemToken: ITEM.token,
    revision: over.revision ?? 0,
    to: SELLER,
    gmailMessageId: 'gm-a',
    gmailThreadId: 'th-1',
    contentHash: over.contentHash ?? HASH_A,
    subject: 'GAP 1 of 1, PepsiCo: Ready for a first touch [GAP#a.0]',
    prepared: { kind: 'email', to: over.to === undefined ? TO : over.to, subject: over.subject ?? COPY_A.subject, body: over.body ?? COPY_A.body },
    ...(over.senderIdentity ? { senderIdentity: over.senderIdentity } : {}),
  },
});

function input(over: Partial<{ revision: number; contentHash: string }> = {}) {
  return { m, ctx, now: NOW, settings: SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron', item: ITEM, ref: { itemKey: ITEM.key, itemToken: ITEM.token, revision: over.revision ?? 0, contentHash: over.contentHash ?? HASH_A, day: '2026-10-08' } };
}

const drafted = (hash: string, recipient = TO) => ({ ok: true as const, alreadyDrafted: false, receipt: { engine: 'gmail_draft' as const, status: 'drafted' as const, routingDecisionId: 'dec-1', hypothesisId: 'hyp-1', personaId: 7, accountName: 'PepsiCo', recipient, senderIdentity: SENDER.userEmail, subject: COPY_A.subject, contentHash: hash, bodySnapshot: 'b', sequenceVersionId: 'ver-1', stepIndex: 0, gmailDraftId: 'r-77', gmailDraftMessageId: 'gm-77', gmailThreadId: 'th-77', createdAt: NOW.toISOString() } as never });
const current = (hash: string, recipient: string | null = TO, senderIdentity: string | null = SENDER.userEmail) => vi.fn(async () => ({ contentHash: hash, recipient, senderIdentity }));

describe('C39: the audit probe, converted', () => {
  it('assigned A, current B at revision 0: refused before the draft provider; the draft spy stays at zero', async () => {
    const db = ledgerDb({ audit: [assignmentRow()] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_B));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: current(HASH_B) });
    expect(r).toMatchObject({ ok: false, effect: 'copy_changed_since_review' });
    expect(r.text).toMatch(/changed after revision 0/);
    expect(draft).toHaveBeenCalledTimes(0);
  });

  it('unchanged A at revision 0 creates exactly one draft, under the pinned snapshot', async () => {
    const db = ledgerDb({ audit: [assignmentRow()] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_A));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: current(HASH_A) });
    expect(r).toMatchObject({ ok: true, effect: 'gmail_drafted', extra: { contentHash: HASH_A, revision: 0, recipient: TO } });
    expect(draft).toHaveBeenCalledTimes(1);
    expect(draft).toHaveBeenCalledWith(expect.anything(), { decisionId: 'dec-1', actor: SELLER, now: NOW, stepIndex: 0, expected: { revision: 0, contentHash: HASH_A, recipient: TO, senderIdentity: SENDER.userEmail } });
  });

  it('a recipient-only change refuses with nothing drafted', async () => {
    const db = ledgerDb({ audit: [assignmentRow()] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_A, 'karen.ortiz@pepsico.com'));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: current(HASH_A, 'karen.ortiz@pepsico.com') });
    expect(r).toMatchObject({ ok: false, effect: 'recipient_changed_since_review', extra: { approved: TO, current: 'karen.ortiz@pepsico.com' } });
    expect(draft).not.toHaveBeenCalled();
  });

  it('a sender-only change refuses with nothing drafted (the mailbox the assignment recorded, else the GAP identity)', async () => {
    const db = ledgerDb({ audit: [assignmentRow({ senderIdentity: 'casey@yardflow.ai' })] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_A));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: current(HASH_A, TO, 'casey@freightroll.com') });
    expect(r).toMatchObject({ ok: false, effect: 'sender_changed_since_review', extra: { approved: 'casey@yardflow.ai', current: 'casey@freightroll.com' } });
    expect(draft).not.toHaveBeenCalled();
  });

  it('a reply carrying a hash the assignment did not, a missing assignment row and a snapshot that does not hash to itself all refuse', async () => {
    const draft = vi.fn(async () => drafted(HASH_A));
    const stale = await approveRequest(ledgerDb({ audit: [assignmentRow()] }, NOW).client(), input({ contentHash: HASH_B }), { draft, currentCopy: current(HASH_B) });
    expect(stale).toMatchObject({ ok: false, effect: 'revision_not_current' });
    const missing = await approveRequest(ledgerDb({ audit: [] }, NOW).client(), input(), { draft, currentCopy: current(HASH_A) });
    expect(missing).toMatchObject({ ok: false, effect: 'assignment_not_found', extra: { revision: 0 } });
    const forged = await approveRequest(ledgerDb({ audit: [assignmentRow({ body: COPY_B.body })] }, NOW).client(), input(), { draft, currentCopy: current(HASH_A) });
    expect(forged).toMatchObject({ ok: false, effect: 'snapshot_integrity' });
    const unreadable = await approveRequest(ledgerDb({ audit: [assignmentRow()] }, NOW).client(), input(), { draft, currentCopy: vi.fn(async () => { throw new Error('pack down'); }) });
    expect(unreadable).toMatchObject({ ok: false, effect: 'current_copy_unreadable' });
    expect(draft).not.toHaveBeenCalled();
  });

  it('a draft that comes back of other copy is reported as a mismatch naming the draft id, never as the approval', async () => {
    const db = ledgerDb({ audit: [assignmentRow()] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_B));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: current(HASH_A) });
    expect(r).toMatchObject({ ok: false, effect: 'draft_mismatch', extra: { gmailDraftId: 'r-77', draftContentHash: HASH_B, approvedContentHash: HASH_A } });
    expect(r.text).toContain('r-77');
  });

  it('loadAssignmentSnapshot reads the row of THAT revision (the latest when resent) and says noEmail for an assignment without copy', async () => {
    const db = ledgerDb({ audit: [assignmentRow(), assignmentRow({ revision: 1, contentHash: HASH_B, subject: COPY_B.subject, body: COPY_B.body })] }, NOW);
    expect(await loadAssignmentSnapshot(db.client(), { itemKey: ITEM.key, revision: 0 })).toMatchObject({ revision: 0, contentHash: HASH_A, recipient: TO, subject: COPY_A.subject });
    expect(await loadAssignmentSnapshot(db.client(), { itemKey: ITEM.key, revision: 1 })).toMatchObject({ revision: 1, contentHash: HASH_B });
    expect(await loadAssignmentSnapshot(db.client(), { itemKey: ITEM.key, revision: 2 })).toBeNull();
    const noCopy = ledgerDb({ audit: [{ ...assignmentRow(), payload: { ...assignmentRow().payload, prepared: { kind: 'none' } } }] }, NOW);
    expect(await loadAssignmentSnapshot(noCopy.client(), { itemKey: ITEM.key, revision: 0 })).toEqual({ noEmail: true });
  });
});

describe('C39: the draft service rechecks the pinned snapshot immediately before the Gmail adapter', () => {
  it('a change between preflight and creation refuses inside the service: the Gmail adapter is never called, the refusal is ledgered', async () => {
    const d = sellerDb();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    // The approval was given on other copy than the pack now renders (preflight passed elsewhere; the source moved).
    const r = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 0, contentHash: 'deadbeef', recipient: 'joey.maggard@kroger.com', senderIdentity: 'casey@freightroll.com' } }, baseDeps(d, 'pass', gmail));
    expect(r).toMatchObject({ ok: false, reason: 'copy_changed_since_review' });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();
    expect(d.audit.filter((a) => a.kind === DRAFTED)).toHaveLength(0);
    expect(d.audit.filter((a) => a.kind === DRAFT_REFUSED).map((a) => a.payload.reason)).toEqual(['copy_changed_since_review']);
  });

  it('the exact snapshot drafts once; a recipient-only or sender-only drift refuses before the adapter', async () => {
    const d = sellerDb();
    const prisma = prismaOf(d);
    const gmail = gmailFake();
    const deps = baseDeps(d, 'pass', gmail);
    // Read the hash the pack renders by drafting once under no snapshot, then discard that run's state.
    const probe = await createSellerGmailDraft(prismaOf(sellerDb()), { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW }, baseDeps(sellerDb(), 'pass', gmailFake()));
    if (!probe.ok) throw new Error('probe should draft');
    const hash = probe.receipt.contentHash;

    const wrongTo = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 0, contentHash: hash, recipient: 'someone.else@kroger.com', senderIdentity: 'casey@freightroll.com' } }, deps);
    expect(wrongTo).toMatchObject({ ok: false, reason: 'recipient_changed_since_review' });
    const wrongFrom = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 0, contentHash: hash, recipient: 'joey.maggard@kroger.com', senderIdentity: 'casey@yardflow.ai' } }, deps);
    expect(wrongFrom).toMatchObject({ ok: false, reason: 'sender_changed_since_review' });
    expect(gmail.createGmailDraft).not.toHaveBeenCalled();

    const ok = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 0, contentHash: hash, recipient: 'Joey.Maggard@kroger.com', senderIdentity: 'casey@freightroll.com' } }, deps);
    expect(ok).toMatchObject({ ok: true, alreadyDrafted: false });
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
    if (!ok.ok) throw new Error('unreachable');
    expect(ok.receipt.contentHash).toBe(hash);

    // An existing draft is this approval's only when it is of the snapshot: the same snapshot says so, another refuses.
    const again = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 0, contentHash: hash, recipient: 'joey.maggard@kroger.com', senderIdentity: 'casey@freightroll.com' } }, deps);
    expect(again).toMatchObject({ ok: true, alreadyDrafted: true });
    const other = await createSellerGmailDraft(prisma, { decisionId: 'dec-joey', actor: 'casey', now: SELLER_NOW, expected: { revision: 1, contentHash: 'other', recipient: 'joey.maggard@kroger.com', senderIdentity: 'casey@freightroll.com' } }, deps);
    expect(other).toMatchObject({ ok: false, reason: 'copy_changed_since_review' });
    expect(gmail.createGmailDraft).toHaveBeenCalledTimes(1);
  });

  it('snapshotDrift is pure: hash first, then recipient, then sender; case and whitespace never count as drift', () => {
    const e = { revision: 2, contentHash: 'h', recipient: ' A@x.com ', senderIdentity: 'GAP@y.ai' };
    expect(snapshotDrift(e, { contentHash: 'h', recipient: 'a@x.com', senderIdentity: 'gap@y.ai' })).toBeNull();
    expect(snapshotDrift(e, { contentHash: 'g', recipient: 'b@x.com', senderIdentity: 'z@y.ai' })).toMatchObject({ reason: 'copy_changed_since_review' });
    expect(snapshotDrift(e, { contentHash: 'h', recipient: 'b@x.com', senderIdentity: 'z@y.ai' })).toMatchObject({ reason: 'recipient_changed_since_review' });
    expect(snapshotDrift(e, { contentHash: 'h', recipient: 'a@x.com', senderIdentity: 'z@y.ai' })).toMatchObject({ reason: 'sender_changed_since_review' });
    expect(snapshotDrift({ ...e, recipient: null, senderIdentity: null }, { contentHash: 'h', recipient: 'anyone', senderIdentity: 'anyone' })).toBeNull();
  });
});
