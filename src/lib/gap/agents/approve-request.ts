/**
 * APPROVE BY EMAIL (X11, GAP OS sales execution engine, 2026-10-08; C39 binding, the commercial context and execution
 * audit). Server only; the `onApprove` effect of commands-apply.ts.
 *
 * In `review` mode an APPROVE on an assignment does these things, in order:
 *   1. it loads the ASSIGNMENT the seller answered (work.assignment_sent for this item and THIS revision) and takes
 *      its immutable snapshot: the copy hash, the prepared email's recipient, subject and body, and the mailbox the
 *      draft goes from. No assignment row, a hash the reply does not carry, or a snapshot whose text no longer hashes
 *      to its own hash refuses before anything else (revision 0 exactly as a revised copy: the audit's independent
 *      probe reproduced an APPROVE at revision 0 binding whatever copy was current, not the copy that was approved)
 *   2. at a later revision it approves exactly the proposed copy revision that email carried (by its hash)
 *   3. PREFLIGHT: it reads the copy that would be drafted now (the action pack's hash, the person's address, the GAP
 *      sender) and refuses when any of them moved from the snapshot, with the draft provider untouched
 *   4. it creates the real, editable Gmail draft through the existing gated service (execution/seller-draft.ts
 *      createSellerGmailDraft: every click-time gate), PASSING the snapshot, which the service rechecks immediately
 *      before the provider adapter; a change between preflight and creation refuses there with no side effect
 *   5. it validates the returned draft against the snapshot (hash and recipient); a draft of other copy is reported
 *      as such, naming the draft id, never as the approval's draft
 * and answers with the draft, the Gmail drafts link and the CONFIRM + SEND link. The send itself stays the
 * session-authenticated route (STABLE_BASELINE R42b, amendment 1, the HUMAN_APPROVED_1TO1 contract): nothing here
 * sends. `prepare` mode refuses in words; `execute` is refused at the settings (X03) until Casey records the amendment.
 */
import { createSellerGmailDraft, type ApprovedSnapshot, type SellerDraftResult } from '../execution/seller-draft';
import { approveCopyRevision, loadProposedCopyRevisions } from '../execution/copy-revision';
import { contentHashOf, loadActionPack } from '../execution/action-pack';
import { gapGmailSender } from '../execution/gap-sender';
import { gmailSenderAddress } from '@/lib/email/gmail-sender';
import { ASSIGNMENT_SENT, ITEM_SUBJECT_TYPE } from '../work/assignment';
import type { ApplyInput } from '../replies/commands-apply';
import type { AssignmentRef } from '../replies/commands';
import type { PlanItem } from '../work/plan';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** What would be drafted right now for a decision and step: the copy hash, the recipient and the sender identity. */
export type CurrentCopy = { contentHash: string | null; recipient: string | null; senderIdentity: string | null };

export interface ApproveDeps {
  draft?: (prisma: PrismaLike, input: { decisionId: string; actor: string; now: Date; stepIndex?: number; expected?: ApprovedSnapshot }) => Promise<SellerDraftResult>;
  /** C39 preflight: the copy that would be drafted now. Default: the action pack, the persona's address, the GAP sender. */
  currentCopy?: (prisma: PrismaLike, args: { decisionId: string; stepIndex: number }) => Promise<CurrentCopy | null>;
}

export type ApproveOutcome = { text: string; effect: string; ok: boolean; extra?: Record<string, unknown> };

/** The immutable snapshot one assignment email carried: what an APPROVE on it is bound to. */
export interface AssignmentSnapshot {
  revision: number;
  contentHash: string;
  recipient: string | null;
  subject: string;
  body: string;
  senderIdentity: string | null;
}

const draftsHref = (mailbox: string) => `https://mail.google.com/mail/?authuser=${encodeURIComponent(mailbox)}#drafts`;
const lower = (s: string | null | undefined) => (s ? s.trim().toLowerCase() : null);

/** The assignment row for this item and revision, read as a snapshot; null when none was recorded; noEmail when it carried no copy. */
export async function loadAssignmentSnapshot(prisma: PrismaLike, ref: Pick<AssignmentRef, 'itemKey' | 'revision'>): Promise<AssignmentSnapshot | null | { noEmail: true }> {
  const rows: Array<{ payload: Record<string, unknown> | null }> = await prisma.gapAuditEvent.findMany({
    where: { kind: ASSIGNMENT_SENT, subject_type: ITEM_SUBJECT_TYPE, subject_id: ref.itemKey },
    orderBy: [{ created_at: 'asc' }],
  });
  const row = [...rows].reverse().find((r) => Number((r.payload ?? {}).revision ?? 0) === ref.revision) ?? null;
  if (!row) return null;
  const p = (row.payload ?? {}) as Record<string, unknown>;
  const prepared = (p.prepared ?? null) as { kind?: string; to?: string | null; subject?: string; body?: string } | null;
  if (!prepared || prepared.kind !== 'email' || typeof prepared.subject !== 'string' || typeof prepared.body !== 'string') return { noEmail: true };
  return {
    revision: ref.revision,
    contentHash: String(p.contentHash ?? ''),
    recipient: typeof prepared.to === 'string' && prepared.to ? prepared.to : null,
    subject: prepared.subject,
    body: prepared.body,
    senderIdentity: typeof p.senderIdentity === 'string' && p.senderIdentity ? p.senderIdentity : null,
  };
}

async function defaultCurrentCopy(prisma: PrismaLike, args: { decisionId: string; stepIndex: number }): Promise<CurrentCopy | null> {
  const d = await prisma.routingDecision.findUnique({ where: { id: args.decisionId }, select: { hypothesis_id: true } });
  if (!d?.hypothesis_id) return null;
  const pack = await loadActionPack(prisma, { hypothesisId: d.hypothesis_id, decisionId: args.decisionId, stepIndex: args.stepIndex });
  if (!pack) return null;
  const gap = gapGmailSender();
  return { contentHash: pack.contentHash ?? null, recipient: pack.persona?.email ?? null, senderIdentity: gap?.userEmail ?? gmailSenderAddress() };
}

export async function approveRequest(prisma: PrismaLike, input: ApplyInput & { item: PlanItem; ref: AssignmentRef }, deps: ApproveDeps = {}): Promise<ApproveOutcome> {
  const decisionId = input.item.refs.decisionId ?? null;
  if (!decisionId) return { ok: false, text: 'This item has no email to draft (it is an obligation, a reply or deal work). Open it in GAP to do it there.', effect: 'approve_not_applicable' };
  if (input.settings.mode === 'prepare') return { ok: false, text: 'GAP is in prepare mode: it prepares work but creates no Gmail draft from an email reply. Open the item in GAP to draft it there, or switch the mode to review in Settings.', effect: 'mode_prepare' };

  const stepIndex = 0;
  const actor = input.m.fromEmail.toLowerCase();
  const openInGap = 'Reply APPROVE to the latest email for it, or open it in GAP.';

  // 1. The immutable snapshot the answered email carried, at every revision (revision 0 included).
  const snap = await loadAssignmentSnapshot(prisma, input.ref);
  if (snap === null) return { ok: false, text: `GAP has no record of sending revision ${input.ref.revision} of this item, so there is no approved copy to bind. ${openInGap}`, effect: 'assignment_not_found', extra: { revision: input.ref.revision } };
  if ('noEmail' in snap) return { ok: false, text: 'The email you answered carried no prepared copy, so there is nothing to approve from it. Open the item in GAP.', effect: 'approve_not_applicable', extra: { revision: input.ref.revision } };
  if (!snap.contentHash || snap.contentHash !== input.ref.contentHash) {
    return { ok: false, text: `The copy in the email you answered is no longer current for this item. ${openInGap}`, effect: 'revision_not_current', extra: { revision: input.ref.revision } };
  }
  if (contentHashOf({ subject: snap.subject, body: snap.body }) !== snap.contentHash) {
    return { ok: false, text: 'The recorded copy of the email you answered does not match its own hash, so GAP will not bind an approval to it. Open the item in GAP.', effect: 'snapshot_integrity', extra: { revision: input.ref.revision } };
  }
  // F15: an assignment that carried no recipient binds no approval (there is no one the copy was approved for).
  if (!snap.recipient) {
    return { ok: false, text: 'The email you answered carried no recipient for this copy, so GAP will not bind an approval to it. Open the item in GAP to choose the person and draft it there.', effect: 'assignment_no_recipient', extra: { revision: input.ref.revision } };
  }
  // The mailbox the draft goes from: the one the assignment recorded (work/assignment.ts); an older row without one
  // falls back to the GAP identity that received this reply.
  const expected: ApprovedSnapshot = { revision: input.ref.revision, contentHash: snap.contentHash, recipient: snap.recipient, senderIdentity: snap.senderIdentity ?? input.sender.userEmail };

  // 2. A later revision: approve exactly the proposed copy revision that email carried, by its hash.
  let revisionId: string | null = null;
  if (input.ref.revision > 0) {
    const proposals = await loadProposedCopyRevisions(prisma, { decisionId, stepIndex });
    const match = proposals.find((p) => p.contentHash === input.ref.contentHash) ?? null;
    if (!match) return { ok: false, text: `The copy in the email you answered is no longer current for this item. ${openInGap}`, effect: 'revision_not_current' };
    revisionId = match.revisionId;
    if (!match.approved) {
      const a = await approveCopyRevision(prisma, { decisionId, revisionId: match.revisionId, actor, via: 'email' }, input.now);
      if (!a.ok) {
        if (a.reason === 'compile_not_cleared') return { ok: false, text: 'GAP\'s checker wants a look at this revision before it can be approved (it passed no clean verdict). Open the item in GAP to review and approve it there.', effect: 'revision_not_cleared', extra: { revisionId: match.revisionId } };
        if (a.reason !== 'already_approved') return { ok: false, text: `This revision could not be approved (${a.reason}). Open the item in GAP.`, effect: 'revision_not_approved', extra: { revisionId: match.revisionId, reason: a.reason } };
      }
    }
  }

  // 3. Preflight: what would be drafted now must be the snapshot, before any provider side effect.
  const current = await (deps.currentCopy ?? defaultCurrentCopy)(prisma, { decisionId, stepIndex }).catch(() => null);
  if (!current) return { ok: false, text: 'GAP could not read the current copy for this item, so nothing was drafted. Open the item in GAP.', effect: 'current_copy_unreadable', extra: { revisionId } };
  if (current.contentHash !== expected.contentHash) {
    return { ok: false, text: `The copy for this item changed after revision ${input.ref.revision} went out, so GAP drafted nothing. ${openInGap}`, effect: 'copy_changed_since_review', extra: { revisionId, revision: input.ref.revision } };
  }
  if (lower(current.recipient) !== lower(expected.recipient)) {
    return { ok: false, text: `The recipient for this item is now ${current.recipient ?? 'unknown'}, not ${expected.recipient} as in the email you approved, so GAP drafted nothing. Open the item in GAP.`, effect: 'recipient_changed_since_review', extra: { revisionId, approved: expected.recipient, current: current.recipient } };
  }
  if (expected.senderIdentity && lower(current.senderIdentity) !== lower(expected.senderIdentity)) {
    return { ok: false, text: `The email would now go from ${current.senderIdentity ?? 'an unknown mailbox'}, not ${expected.senderIdentity} as approved, so GAP drafted nothing. Open the item in GAP.`, effect: 'sender_changed_since_review', extra: { revisionId, approved: expected.senderIdentity, current: current.senderIdentity } };
  }

  // 4. The draft, under the snapshot (rechecked by the service immediately before the provider adapter).
  const r = await (deps.draft ?? createSellerGmailDraft)(prisma, { decisionId, actor, now: input.now, stepIndex, expected });
  if (!r.ok) {
    const detail = 'detail' in r && r.detail ? ` ${r.detail}` : '';
    return { ok: false, text: `GAP could not create the draft: ${r.reason}.${detail} Nothing was drafted. Open the item in GAP to see what unlocks it.`, effect: 'draft_refused', extra: { reason: r.reason, revisionId } };
  }
  const d = r.receipt;
  // 5. The returned draft is the approved copy, or it is reported as something else (it exists; it is not this approval's).
  if (d.contentHash !== expected.contentHash || lower(d.recipient) !== lower(expected.recipient)) {
    return {
      ok: false,
      text: `The draft GAP got back (Gmail draft ${d.gmailDraftId}, to ${d.recipient}) is not the copy you approved at revision ${input.ref.revision}. It is not recorded as your approval. Open the item in GAP to review what exists before anything goes out.`,
      effect: 'draft_mismatch',
      extra: { gmailDraftId: d.gmailDraftId, draftContentHash: d.contentHash, approvedContentHash: expected.contentHash, recipient: d.recipient, revisionId },
    };
  }
  const sendHref = `${input.baseUrl.replace(/\/$/, '')}/gap/pack/${encodeURIComponent(decisionId)}`;
  const text = [
    r.alreadyDrafted ? `A Gmail draft of this email already exists for ${d.recipient}, subject "${d.subject}".` : `Done: a Gmail draft to ${d.recipient}, subject "${d.subject}", is in the ${d.senderIdentity} mailbox.`,
    `Edit or send it in Gmail: ${draftsHref(d.senderIdentity)}`,
    `Or send it from GAP with every check re-run (CONFIRM + SEND): ${sendHref}`,
    'A draft is not a send: GAP records it as sent only when Gmail shows it went. Sending from Gmail is outside GAP\'s checks: GAP records what Sent shows, as sent by hand, and an edited draft is never recorded as the approved copy. Reply NEXT for the next item.',
  ].join('\n');
  return { ok: true, text, effect: r.alreadyDrafted ? 'already_drafted' : 'gmail_drafted', extra: { gmailDraftId: d.gmailDraftId, contentHash: d.contentHash, revisionId, recipient: d.recipient, revision: input.ref.revision } };
}
