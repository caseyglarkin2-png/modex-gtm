/**
 * APPROVE BY EMAIL (X11, GAP OS sales execution engine, 2026-10-08). Server only; the `onApprove` effect of
 * commands-apply.ts.
 *
 * In `review` mode an APPROVE on an assignment does two things, in order: it approves the copy revision THAT email
 * carried (bound by the content hash the assignment was sent with; an older or unknown hash is refused so a stale
 * approval never binds other copy: the review's stale-approval finding), then it creates the real, editable Gmail
 * draft through the existing gated service (execution/seller-draft.ts createSellerGmailDraft: every click-time gate,
 * the same copy-revision binding through loadActionPack), and answers with the draft, the Gmail drafts link and the
 * CONFIRM + SEND link. The send itself stays the session-authenticated route (STABLE_BASELINE R42b, amendment 1, the
 * HUMAN_APPROVED_1TO1 contract): nothing here sends. `prepare` mode refuses in words; `execute` is refused at the
 * settings (X03) until Casey records the amendment.
 */
import { createSellerGmailDraft, type SellerDraftResult } from '../execution/seller-draft';
import { approveCopyRevision, loadProposedCopyRevisions } from '../execution/copy-revision';
import type { ApplyInput } from '../replies/commands-apply';
import type { AssignmentRef } from '../replies/commands';
import type { PlanItem } from '../work/plan';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface ApproveDeps {
  draft?: (prisma: PrismaLike, input: { decisionId: string; actor: string; now: Date; stepIndex?: number }) => Promise<SellerDraftResult>;
}

export type ApproveOutcome = { text: string; effect: string; extra?: Record<string, unknown> };

const draftsHref = (mailbox: string) => `https://mail.google.com/mail/?authuser=${encodeURIComponent(mailbox)}#drafts`;

export async function approveRequest(prisma: PrismaLike, input: ApplyInput & { item: PlanItem; ref: AssignmentRef }, deps: ApproveDeps = {}): Promise<ApproveOutcome> {
  const decisionId = input.item.refs.decisionId ?? null;
  if (!decisionId) return { text: 'This item has no email to draft (it is an obligation, a reply or deal work). Open it in GAP to do it there.', effect: 'approve_not_applicable' };
  if (input.settings.mode === 'prepare') return { text: 'GAP is in prepare mode: it prepares work but creates no Gmail draft from an email reply. Open the item in GAP to draft it there, or switch the mode to review in Settings.', effect: 'mode_prepare' };

  const stepIndex = 0;
  const actor = input.m.fromEmail.toLowerCase();
  let revisionId: string | null = null;
  if (input.ref.revision > 0) {
    // The email the seller approved carried a proposed revision: approve exactly that one, by its hash.
    const proposals = await loadProposedCopyRevisions(prisma, { decisionId, stepIndex });
    const match = proposals.find((p) => p.contentHash === input.ref.contentHash) ?? null;
    if (!match) return { text: 'The copy in the email you answered is no longer current for this item. Reply APPROVE to the latest email for it, or open it in GAP.', effect: 'revision_not_current' };
    revisionId = match.revisionId;
    if (!match.approved) {
      const a = await approveCopyRevision(prisma, { decisionId, revisionId: match.revisionId, actor, via: 'email' }, input.now);
      if (!a.ok) {
        if (a.reason === 'compile_not_cleared') return { text: 'GAP\'s checker wants a look at this revision before it can be approved (it passed no clean verdict). Open the item in GAP to review and approve it there.', effect: 'revision_not_cleared', extra: { revisionId: match.revisionId } };
        if (a.reason !== 'already_approved') return { text: `This revision could not be approved (${a.reason}). Open the item in GAP.`, effect: 'revision_not_approved', extra: { revisionId: match.revisionId, reason: a.reason } };
      }
    }
  }

  const r = await (deps.draft ?? createSellerGmailDraft)(prisma, { decisionId, actor, now: input.now, stepIndex });
  if (!r.ok) {
    const detail = 'detail' in r && r.detail ? ` ${r.detail}` : '';
    return { text: `GAP could not create the draft: ${r.reason}.${detail} Nothing was drafted. Open the item in GAP to see what unlocks it.`, effect: 'draft_refused', extra: { reason: r.reason, revisionId } };
  }
  const d = r.receipt;
  const sendHref = `${input.baseUrl.replace(/\/$/, '')}/gap/pack/${encodeURIComponent(decisionId)}`;
  const text = [
    r.alreadyDrafted ? `A Gmail draft of this email already exists for ${d.recipient}, subject "${d.subject}".` : `Done: a Gmail draft to ${d.recipient}, subject "${d.subject}", is in the ${d.senderIdentity} mailbox.`,
    `Edit or send it in Gmail: ${draftsHref(d.senderIdentity)}`,
    `Or send it from GAP with every check re-run (CONFIRM + SEND): ${sendHref}`,
    'A draft is not a send: GAP records it as sent only when Gmail shows it went. Reply NEXT for the next item.',
  ].join('\n');
  return { text, effect: r.alreadyDrafted ? 'already_drafted' : 'gmail_drafted', extra: { gmailDraftId: d.gmailDraftId, contentHash: d.contentHash, revisionId, recipient: d.recipient } };
}
