// @vitest-environment node
/**
 * X11 (GAP OS sales execution engine, 2026-10-08): APPROVE by email. In `review` mode an APPROVE on an assignment
 * approves the copy revision that email carried (bound by its content hash; a stale one is refused) and creates the
 * real, editable Gmail draft through the existing gated service (createSellerGmailDraft: every click-time gate), then
 * answers with the draft and the CONFIRM + SEND link. The send stays the session route (the review's B1). Pinned:
 * `prepare` mode refuses in words; an item with no email is refused; revision 0 drafts the pack's copy; a later
 * revision approves the matching proposal first and never a mismatched or uncleared one; a gate refusal is answered
 * in words with nothing drafted; a draft already there is said so. C39: every APPROVE is bound to the assignment row of
 * THAT revision (its snapshot seeded here) and preflights the current copy (injected) before the draft service.
 */
import { describe, expect, it, vi } from 'vitest';
import { ledgerDb } from './fixtures/ledger-db';
import { approveRequest } from '@/lib/gap/agents/approve-request';
import { contentHashOf } from '@/lib/gap/execution/action-pack';
import { ASSIGNMENT_SENT, ITEM_SUBJECT_TYPE } from '@/lib/gap/work/assignment';
import { approveCopyRevision, loadApprovedCopyRevision, proposeCopyRevision } from '@/lib/gap/execution/copy-revision';
import type { PlanItem } from '@/lib/gap/work/plan';
import type { SellerSettings } from '@/lib/gap/work/settings';
import type { SellerDraftResult } from '@/lib/gap/execution/seller-draft';

const NOW = new Date('2026-10-08T17:00:00Z');
const SELLER = 'casey@freightroll.com';
const SENDER = { userEmail: 'casey@yardflow.ai', refreshToken: 'r', displayName: 'Casey Larkin' };
const SETTINGS: SellerSettings = { briefingTo: SELLER, briefingHourNy: 7, commandSenders: [SELLER], mode: 'review', targets: {} };
const ITEM: PlanItem = { key: 'first_touch:dec-1', rank: 0, accountName: 'PepsiCo', kind: 'ready', stateKind: 'ready', title: 'Ready for a first touch', why: 'A prepared first touch', href: '/gap/pack/dec-1', person: { name: 'Karen Ortiz', title: null }, refs: { decisionId: 'dec-1' }, token: 'a'.repeat(32) };
const m = { id: 'cmd-1', threadId: 'th-1', rfcMessageId: '<c@m>', fromEmail: SELLER, fromName: 'Casey', subject: 'Re: GAP 1 of 1', snippet: '', bodyText: 'APPROVE', rawText: '', bodyHtml: '', deliveryStatus: null, labelIds: [], receivedAt: NOW, headers: {} };
const ctx = { senders: [SELLER], assignmentsByThread: new Map(), assignmentsByMessageId: new Map(), briefingsByThread: new Map() };
const TEMPLATE = { subject: 'Tulsa: the gate', body: 'Karen, the template copy.\n\nMy guess is x. Is it?' };
const HASH_TEMPLATE = contentHashOf(TEMPLATE);
/** C39: the assignment row an APPROVE is bound to (revision, hash, the prepared email it carried). */
const assignment = (revision: number, copy: { subject: string; body: string }) => ({ kind: ASSIGNMENT_SENT, actor: 'cron', subject_type: ITEM_SUBJECT_TYPE, subject_id: ITEM.key, created_at: new Date(NOW.getTime() - 60_000 * (revision + 1)), payload: { day: '2026-10-08', itemToken: ITEM.token, revision, to: SELLER, gmailThreadId: 'th-1', contentHash: contentHashOf(copy), subject: `GAP 1 of 1 [GAP#a.${revision}]`, prepared: { kind: 'email', to: 'karen@pepsico.com', subject: copy.subject, body: copy.body } } });
const currentCopy = (hash: string) => async () => ({ contentHash: hash, recipient: 'karen@pepsico.com', senderIdentity: SENDER.userEmail });

function input(over: Partial<{ revision: number; contentHash: string; settings: SellerSettings; item: PlanItem }> = {}) {
  return { m, ctx, now: NOW, settings: over.settings ?? SETTINGS, sender: SENDER, baseUrl: 'https://app.example', actionSecret: null, actor: 'cron', item: over.item ?? ITEM, ref: { itemKey: 'first_touch:dec-1', itemToken: 'a'.repeat(32), revision: over.revision ?? 0, contentHash: over.contentHash ?? HASH_TEMPLATE, day: '2026-10-08' } };
}

const drafted = (hash: string) => ({ ok: true as const, alreadyDrafted: false, receipt: { engine: 'gmail_draft' as const, status: 'drafted' as const, routingDecisionId: 'dec-1', hypothesisId: 'hyp-1', personaId: 7, accountName: 'PepsiCo', recipient: 'karen@pepsico.com', senderIdentity: 'casey@yardflow.ai', subject: 'Tulsa: the gate', contentHash: hash, bodySnapshot: 'b', sequenceVersionId: 'ver-1', stepIndex: 0, gmailDraftId: 'r-77', gmailDraftMessageId: 'gm-77', gmailThreadId: 'th-77', createdAt: NOW.toISOString() } as never });

describe('X11: approveRequest', () => {
  it('revision 0: drafts the pack copy through the gated service and answers with the draft, the Gmail link and the CONFIRM + SEND link', async () => {
    const db = ledgerDb({ audit: [assignment(0, TEMPLATE)] }, NOW);
    const draft = vi.fn(async () => drafted(HASH_TEMPLATE));
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: currentCopy(HASH_TEMPLATE) });
    expect(r).toMatchObject({ effect: 'gmail_drafted', extra: { gmailDraftId: 'r-77', contentHash: HASH_TEMPLATE, revisionId: null } });
    expect(draft).toHaveBeenCalledWith(expect.anything(), { decisionId: 'dec-1', actor: SELLER, now: NOW, stepIndex: 0, expected: { revision: 0, contentHash: HASH_TEMPLATE, recipient: 'karen@pepsico.com', senderIdentity: SENDER.userEmail } });
    expect(r.text).toContain('karen@pepsico.com');
    expect(r.text).toContain('Tulsa: the gate');
    expect(r.text).toContain('https://mail.google.com/mail/?authuser=casey%40yardflow.ai#drafts');
    expect(r.text).toContain('https://app.example/gap/pack/dec-1');
    expect(r.text).toMatch(/draft is not a send/i);
  });

  it('prepare mode refuses in words and drafts nothing; an item with no email is refused', async () => {
    const db = ledgerDb({}, NOW);
    const draft = vi.fn(async () => drafted('h'));
    const p = await approveRequest(db.client(), input({ settings: { ...SETTINGS, mode: 'prepare' } }), { draft });
    expect(p).toMatchObject({ effect: 'mode_prepare' });
    expect(p.text).toMatch(/prepare mode/i);
    const n = await approveRequest(db.client(), input({ item: { ...ITEM, key: 'commitment:c-1', refs: { commitmentId: 'c-1' } } }), { draft });
    expect(n).toMatchObject({ effect: 'approve_not_applicable' });
    expect(draft).not.toHaveBeenCalled();
  });

  it('a later revision approves the proposal that email carried (by its hash), then drafts; a mismatched hash is refused; an uncleared proposal is refused and nothing is drafted', async () => {
    const db = ledgerDb({}, NOW);
    const c = db.client();
    const p = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: { subject: 'Tulsa: the gate', body: 'Karen, a fact [[SRC:sig-1]].\n\nMy guess is x. Is it?' }, compileId: 'cmp-1', compileVerdict: 'pass', basis: { critique: 'the gate', facts: ['sig-1'] }, proposedBy: 'agent', taskId: 'at_1' }, NOW);
    // The revision-1 assignment carried the proposal's queued copy (its hash is the proposal's).
    await c.gapAuditEvent.create({ data: assignment(1, p.queued) });
    expect(contentHashOf(p.queued)).toBe(p.contentHash);
    const draft = vi.fn(async () => drafted(p.contentHash));
    const stale = await approveRequest(c, input({ revision: 1, contentHash: 'some-other-hash' }), { draft, currentCopy: currentCopy(p.contentHash) });
    expect(stale).toMatchObject({ effect: 'revision_not_current' });
    expect(draft).not.toHaveBeenCalled();
    const ok = await approveRequest(c, input({ revision: 1, contentHash: p.contentHash }), { draft, currentCopy: currentCopy(p.contentHash) });
    expect(ok).toMatchObject({ effect: 'gmail_drafted', extra: { revisionId: p.revisionId } });
    expect((await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 }))?.revisionId).toBe(p.revisionId);
    expect(draft).toHaveBeenCalledTimes(1);
    // Approving again the same (already approved) revision just drafts (idempotent through the draft service).
    const again = await approveRequest(c, input({ revision: 1, contentHash: p.contentHash }), { draft: vi.fn(async () => ({ ...drafted(p.contentHash), alreadyDrafted: true })), currentCopy: currentCopy(p.contentHash) });
    expect(again).toMatchObject({ effect: 'already_drafted' });

    const review = await proposeCopyRevision(c, { decisionId: 'dec-1', hypothesisId: 'hyp-1', versionId: 'ver-1', stepIndex: 0, marked: { subject: 's2', body: 'b2' }, compileId: 'cmp-2', compileVerdict: 'review_required', basis: { critique: 'x', facts: [] }, proposedBy: 'agent', taskId: 'at_2' }, new Date(NOW.getTime() + 1000));
    await c.gapAuditEvent.create({ data: assignment(2, review.queued) });
    const d2 = vi.fn(async () => drafted(review.contentHash));
    const r2 = await approveRequest(c, input({ revision: 2, contentHash: review.contentHash }), { draft: d2, currentCopy: currentCopy(review.contentHash) });
    expect(r2).toMatchObject({ effect: 'revision_not_cleared' });
    expect(d2).not.toHaveBeenCalled();
    expect((await loadApprovedCopyRevision(c, { decisionId: 'dec-1', stepIndex: 0 }))?.revisionId).toBe(p.revisionId);
  });

  it('a gate refusal from the draft service is answered in words with nothing drafted', async () => {
    const db = ledgerDb({ audit: [assignment(0, TEMPLATE)] }, NOW);
    const draft = vi.fn(async () => ({ ok: false as const, reason: 'account_replied', detail: 'Karen Ortiz replied on Oct 7' }) as unknown as SellerDraftResult);
    const r = await approveRequest(db.client(), input(), { draft, currentCopy: currentCopy(HASH_TEMPLATE) });
    expect(r).toMatchObject({ effect: 'draft_refused', extra: { reason: 'account_replied' } });
    expect(r.text).toContain('account_replied');
    expect(r.text).toContain('Karen Ortiz replied on Oct 7');
    expect(await loadApprovedCopyRevision(db.client(), { decisionId: 'dec-1', stepIndex: 0 })).toBeNull();
    void approveCopyRevision;
  });
});
