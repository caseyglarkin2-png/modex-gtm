/**
 * GOVERNED COPY (execution acceptance, 2026-10-01).
 *
 * COPY EMAIL sat beside CREATE GMAIL DRAFT and offered the same email while the draft was refusing on an
 * unreadable suppression authority: a manual route around the control GAP had just enforced. Copying the email
 * of a cold card is sending it by another route, so the text is released ONLY after the same click-time gates
 * as a draft and a direct send (prepareSellerEmail, one implementation) AND the wire's cross-plane suppression
 * contract, which fails closed. There is no separate "copy address" path.
 *
 * Releasing copy is not execution truth: it is never recorded as drafted or sent (Gmail Sent stays the truth).
 * It is recorded once as COPY RELEASED, for the audit trail.
 */
import { assertSuppressionPermitsSend, suppressionRefusalKind } from '@/lib/email/suppression-gate';
import { appendLedger, COPY_REFUSED, COPY_RELEASED } from './draft-ledger';
import { prepareSellerEmail, type SellerDraftDeps } from './seller-draft';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export { COPY_RELEASED };

export type GovernedCopyResult =
  | { ok: true; recipient: string; subject: string; text: string }
  | { ok: false; reason: string; detail?: string };

export async function releaseGovernedCopy(
  prisma: PrismaLike,
  input: { decisionId: string; actor: string; now: Date; stepIndex?: number },
  deps: SellerDraftDeps = {},
): Promise<GovernedCopyResult> {
  const prep = await prepareSellerEmail(prisma, { ...input, mode: 'copy' }, deps);
  if (!prep.ok) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ok: _ok, ...rest } = prep;
    return { ok: false, ...rest };
  }
  // 'copy' mode never returns an existing draft (it refuses draft_outstanding); this is belt and braces.
  if (!('prepared' in prep)) return { ok: false, reason: 'draft_outstanding' };
  const p = prep.prepared;
  try {
    await (deps.suppression ?? ((to: string) => assertSuppressionPermitsSend({ to })))(p.recipient);
  } catch (e) {
    const why = e instanceof Error ? e.message : String(e);
    const kind = suppressionRefusalKind(why) ?? 'unreadable';
    const reason = kind === 'suppressed' ? 'recipient_suppressed' : 'suppression_unreadable';
    await appendLedger(prisma, COPY_REFUSED, input.actor, input.decisionId, { ok: false, reason, detail: why }).catch(() => undefined);
    return { ok: false, reason, detail: why };
  }
  await appendLedger(prisma, COPY_RELEASED, input.actor, input.decisionId, { recipient: p.recipient, stepIndex: p.stepIndex, contentHash: p.contentHash, at: input.now.toISOString() }).catch(() => undefined);
  return { ok: true, recipient: p.recipient, subject: p.subject, text: p.text };
}
