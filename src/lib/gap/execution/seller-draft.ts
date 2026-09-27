/**
 * Seller Action Center: CREATE GMAIL DRAFT (final pass, 2026-09-25).
 *
 * One human click on one routing card puts one draft in Casey's Gmail Drafts
 * folder. It never sends: the only Gmail write is `gmailDraftAdapter` ->
 * `createGmailDraft` -> `drafts.create`. `messages.send` and `drafts.send`
 * are not reachable from this module (tests/unit/gap/seller-draft.test.ts
 * pins the import surface).
 *
 * Everything is re-read at click time, never trusted from the page:
 *   the decision       exists, not blocked, an email action, carries a hypothesis
 *   the hypothesis     still `active`
 *   the persona        the decision's own person, same account, a valid email,
 *                      not do_not_contact
 *   the copy           re-rendered by the SAME loader the page uses
 *                      (action-pack.ts), so the draft is the copy Casey read
 *   the compiler       the compile row for exactly this marked copy must be a
 *                      pass or an approved review; with no row yet, the copy is
 *                      compiled now (persisted) and a review opens an approval
 *                      request instead of drafting
 *   suppression        `createGmailDraft` runs the cross-plane wire gate
 *                      (`assertSuppressionPermitsSend`, fail closed) itself
 *
 * Idempotent per (decision, content hash): a second click while the first
 * draft is still a draft returns that draft rather than filling the mailbox.
 *
 * The receipt is the ledger (draft-ledger.ts). Creating a draft never writes
 * `human_action`.
 */

import { validateClaimsUsed } from '@/lib/gap/claims/validate-claims';
import { sendableEvidence } from '../research/evidence-gate';
import { seedCopyOutdated } from '../sequences/seed-drift';
import { accountRepliedRecently } from '../replies/account-reply';
import { getGmailSignature, gmailSenderAddress } from '@/lib/email/gmail-sender';
import { COMPANY_POSTAL_ADDRESS, oneClickUnsubscribeUrl, unsubscribePageUrl } from '@/lib/email/compliance';
import { personMovedSince } from './stale-card';
import { isHardBounceStatus } from '@/lib/email/bounce';
import { requestApproval } from '../compiler/approval';
import { compile as defaultCompile } from '../compiler/compile';
import { evidenceRefsFromSignals } from '../compiler/evidence-from-signals';
import { makeCriticClient } from '../critic-client';
import type { CriticClient } from '../critic-client';
import { compileCleared, findCompileForCopy, loadActionPack } from './action-pack';
import { appendLedger, DIRECT_REFUSED, DIRECT_RELEASED, DRAFT_REFUSED, DRAFTED, isDefinitelyNotSent, type DraftedPayload } from './draft-ledger';
import { hasActiveOpportunity } from '../routing/rules';
import { loadActiveOpportunityInputs } from '../enroll/service';
import { gmailDraftAdapter, type GmailAdapterDeps } from './gmail-adapter';
import { gapGmailSender } from './gap-sender';
import { computeNextTouch, type NextTouch } from './next-touch';
import { claimSendKey, personSendHistoryForDecision, personStepKey } from './person-history';
import { getGmailMessageHeaders } from '@/lib/email/gmail-inbox';
import type { GmailSender } from '@/lib/email/gmail-sender';
import type { ExecutionIntent } from './contract';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Routing actions whose seller instruction is "Email {name}". */
export const EMAIL_ACTIONS: ReadonlySet<string> = new Set(['enroll_gap_sequence', 'one_off_email']);

export type SellerDraftRefusal =
  | 'decision_not_found'
  | 'decision_blocked'
  | 'decision_superseded'
  | 'first_touch_already_sent'
  | 'step_already_sent'
  | 'send_in_progress_or_unknown'
  | 'draft_outstanding'
  | 'recipient_unsubscribed'
  | 'account_replied'
  | 'decision_stale'
  | 'email_bounced'
  | 'touch_not_due'
  | 'sequence_stopped'
  | 'reply_truth_unavailable'
  | 'template_citations_unresolved'
  | 'no_step_copy'
  | 'not_an_email_action'
  | 'no_hypothesis'
  | 'hypothesis_not_found'
  | 'hypothesis_not_active'
  | 'evidence_insufficient'
  | 'persona_not_found'
  | 'no_email'
  | 'email_invalid'
  | 'persona_do_not_contact'
  | 'no_version'
  | 'copy_version_outdated'
  | 'no_step0_copy'
  | 'unrendered_placeholder'
  | 'copy_rejected'
  | 'copy_review_required'
  | 'unsubscribe_link_unavailable'
  | 'gmail_refused'
  | 'active_opportunity';

export type SellerDraftResult =
  | {
      ok: true;
      alreadyDrafted: boolean;
      receipt: DraftedPayload;
      /** Set when Gmail created the draft but the ledger write failed: the draft exists, the receipt did not land. */
      ledgerError?: string;
    }
  | {
      ok: false;
      reason: SellerDraftRefusal;
      detail?: string;
      compileId?: string;
      approvalRequestId?: string;
      failedChecks?: string[];
    };

export interface SellerDraftDeps {
  critic?: CriticClient;
  compile?: typeof defaultCompile;
  gmail?: GmailAdapterDeps;
  senderAddress?: () => string;
  /** The GAP Gmail identity (gap-sender.ts); null means the env identity. */
  gapSender?: () => GmailSender | null;
  /** Next-touch truth (next-touch.ts); injectable for tests. */
  nextTouch?: (prisma: PrismaLike, decisionId: string, now: Date) => Promise<NextTouch>;
  /** RFC Message-ID + Subject of the prior sent message, for threading. */
  getMessageHeaders?: (messageId: string, sender?: GmailSender) => Promise<{ messageIdHeader: string | null; subject: string | null } | null>;
  /** The sender's real Gmail signature (null when unreadable: the template sign-off stays). */
  signature?: (sender: GmailSender | undefined) => Promise<string | null>;
  unsubscribeUrl?: (email: string) => string;
  /** True when someone is already in conversation (send only). */
  activeOpportunity?: (prisma: PrismaLike, accountName: string, email: string, now: Date) => Promise<boolean>;
}

async function defaultActiveOpportunity(prisma: PrismaLike, accountName: string, email: string, now: Date): Promise<boolean> {
  return hasActiveOpportunity(await loadActiveOpportunityInputs(prisma, accountName, email, now));
}

function defaultUnsubscribeUrl(email: string): string {
  return unsubscribePageUrl(email);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The plain sign-off line the seed templates end with (sequences/families.ts SIGNATURE). */
export const TEMPLATE_SIGNOFF = 'Casey Larkin, YardFlow by FreightRoll';

/** Drop the template's plain sign-off when the real Gmail signature replaces it. */
function withoutTemplateSignoff(body: string): string {
  const trimmed = body.replace(/\s+$/, '');
  return trimmed.endsWith(TEMPLATE_SIGNOFF) ? trimmed.slice(0, -TEMPLATE_SIGNOFF.length).replace(/\s+$/, '') : trimmed;
}

/** The signature as plain text for the text/plain part. */
export function signatureText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&middot;|&#183;/g, '·')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/**
 * Plain paragraphs, no tracking pixel, no branded wrapper: this is Casey's own
 * 1:1 email. With `signatureHtml` (the sender's real Gmail signature, which
 * Gmail does not add to API-created drafts), it replaces the template's plain
 * sign-off line; without it the body is exactly the rendered copy.
 */
export function draftHtml(body: string, unsubscribeUrl: string, signatureHtml: string | null = null): string {
  const text = signatureHtml ? withoutTemplateSignoff(body) : body;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
  const signature = signatureHtml ? `\n<div class="gmail_signature">${signatureHtml}</div>` : '';
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">\n${paragraphs}${signature}\n<p style="margin:18px 0 0 0;font-size:11px;color:#9ca3af;">Not relevant? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9ca3af;">Unsubscribe</a>.<br />${escapeHtml(COMPANY_POSTAL_ADDRESS)}</p>\n</div>`;
}

export function draftText(body: string, unsubscribeUrl: string, signatureHtml: string | null = null): string {
  const text = signatureHtml ? `${withoutTemplateSignoff(body)}\n\n${signatureText(signatureHtml)}` : body;
  return `${text}\n\nNot relevant? Unsubscribe: ${unsubscribeUrl}\n${COMPANY_POSTAL_ADDRESS}`;
}

type Refusal = Extract<SellerDraftResult, { ok: false }>;

async function refuseAs(
  kind: typeof DRAFT_REFUSED | typeof DIRECT_REFUSED,
  prisma: PrismaLike,
  actor: string,
  decisionId: string,
  r: Refusal,
): Promise<Refusal> {
  try {
    await appendLedger(prisma, kind, actor, decisionId, { ...r });
  } catch {
    // The refusal is the answer; a lost refusal row loses nothing but the audit line.
  }
  return r;
}

/** Everything a draft or a direct send needs, after every click-time gate passed. */
export interface PreparedSellerEmail {
  decisionId: string;
  stepIndex: number;
  hypothesisId: string;
  accountName: string;
  personaId: number;
  personaName: string | null;
  /** The person's HubSpot contact id, when known (CRM logging needs a known contact). */
  hubspotContactId: string | null;
  recipient: string;
  senderIdentity: string;
  gapSender: GmailSender | null;
  subject: string;
  bodySnapshot: string;
  contentHash: string;
  sequenceVersionId: string;
  compileId: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  threadContext: ExecutionIntent['threadContext'];
  inReplyToGmailMessageId: string | null;
}

export type PrepareResult =
  | Refusal
  | { ok: true; existingDraft: DraftedPayload }
  | { ok: true; prepared: PreparedSellerEmail };

/**
 * The click-time gates shared by CREATE GMAIL DRAFT and SEND FROM YARDFLOW:
 * one implementation, so the two can never disagree about what is sendable.
 * `mode: 'send'` also re-reads the active-opportunity predicate (the one
 * enroll and routing R3b use) and ledgers refusals as direct-send refusals.
 */
export async function prepareSellerEmail(
  prisma: PrismaLike,
  input: { decisionId: string; actor: string; now: Date; stepIndex?: number; mode?: 'draft' | 'send' },
  deps: SellerDraftDeps = {},
): Promise<PrepareResult> {
  const { decisionId, actor, now } = input;
  const mode = input.mode ?? 'draft';
  const refuse = (pr: PrismaLike, a: string, d: string, r: Refusal) => refuseAs(mode === 'send' ? DIRECT_REFUSED : DRAFT_REFUSED, pr, a, d, r);

  const decision = await prisma.routingDecision.findUnique({
    where: { id: decisionId },
    select: { id: true, lane: true, action: true, hypothesis_id: true, persona_id: true, account_name: true, created_at: true },
  });
  if (!decision) return { ok: false, reason: 'decision_not_found' };
  // Routing moves on: an older "email" card for this person must not draft
  // once a newer run said something else (research, block, hold).
  const newer = decision.persona_id != null
    ? await prisma.routingDecision.findFirst({
        where: { persona_id: decision.persona_id, account_name: decision.account_name, created_at: { gt: decision.created_at } },
        orderBy: { created_at: 'desc' },
        select: { id: true, action: true, rule_id: true },
      })
    : null;
  if (newer && !EMAIL_ACTIONS.has(newer.action)) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'decision_superseded', detail: `newer decision ${newer.id} is ${newer.action} (${newer.rule_id})` });
  }
  if (decision.lane === 'blocked' || decision.action === 'do_not_contact') return refuse(prisma, actor, decisionId, { ok: false, reason: 'decision_blocked' });
  if (!EMAIL_ACTIONS.has(decision.action)) return refuse(prisma, actor, decisionId, { ok: false, reason: 'not_an_email_action', detail: decision.action });
  if (!decision.hypothesis_id) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_hypothesis' });

  // Which touch. Step 0 only before anything was sent; a later step only when
  // next-touch says it is due and no stop rule fired (reply, DNC, unsubscribe,
  // invalid address, meeting booked). Unreadable reply truth prepares nothing.
  const stepIndex = Math.max(0, input.stepIndex ?? 0);
  const touch = await (deps.nextTouch ?? computeNextTouch)(prisma, decisionId, now);
  // The person's execution truth across EVERY routing card (red team T2): a
  // newer card for the same person never forgets a send, a draft or an
  // unresolved claim made from an older one.
  const history = await personSendHistoryForDecision(prisma, decisionId);
  const priorAtStep = history.sent.find((s) => s.stepIndex === stepIndex);
  if (stepIndex === 0 && (touch.state !== 'not_started' || priorAtStep)) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'first_touch_already_sent', detail: priorAtStep ? `sent ${priorAtStep.sentAt} (${priorAtStep.engine}, card ${priorAtStep.decisionId})` : touch.state });
  }
  if (priorAtStep) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'step_already_sent', detail: `touch ${stepIndex + 1} sent ${priorAtStep.sentAt} (${priorAtStep.engine}, card ${priorAtStep.decisionId})` });
  }
  const openClaim = history.unresolvedClaims.find((c) => c.stepIndex === null || c.stepIndex === stepIndex);
  if (openClaim) {
    return refuse(prisma, actor, decisionId, {
      ok: false,
      reason: 'send_in_progress_or_unknown',
      detail: `A send of touch ${stepIndex + 1} to this person was started ${openClaim.claimedAt} and its outcome is not recorded. Check Gmail Sent in casey@yardflow.ai. GAP will not send it twice.`,
    });
  }
  if (stepIndex > 0) {
    if (touch.state === 'stopped') return refuse(prisma, actor, decisionId, { ok: false, reason: 'sequence_stopped', detail: touch.detail });
    if (touch.state === 'unknown') return refuse(prisma, actor, decisionId, { ok: false, reason: 'reply_truth_unavailable', detail: touch.detail });
    if (touch.state !== 'due' || touch.stepIndex !== stepIndex) {
      const when = touch.state === 'waiting' ? ` (touch ${touch.stepIndex + 1} due ${touch.dueAt})` : ` (${touch.state})`;
      return refuse(prisma, actor, decisionId, { ok: false, reason: 'touch_not_due', detail: `step ${stepIndex} is not due${when}` });
    }
  }

  const pack = await loadActionPack(prisma, { hypothesisId: decision.hypothesis_id, decisionId, stepIndex });
  if (!pack) return refuse(prisma, actor, decisionId, { ok: false, reason: 'hypothesis_not_found' });
  if (pack.hypothesis.status !== 'active') return refuse(prisma, actor, decisionId, { ok: false, reason: 'hypothesis_not_active', detail: pack.hypothesis.status });
  // Red team T6: nothing is sent on a hypothesis GAP itself rates INSUFFICIENT.
  // One live outreach fact (verified, dated, quoted, this account, a network
  // change) or no email; a keyword hit can only send this card to research.
  const linked = Array.isArray(pack.hypothesis.signals) ? pack.hypothesis.signals.map((l: { signal?: unknown }) => l.signal).filter(Boolean) : [];
  const live = linked.filter((sig: { freshness_expires_at?: Date | string | null }) => !sig.freshness_expires_at || new Date(sig.freshness_expires_at).getTime() > now.getTime());
  if (sendableEvidence(pack.hypothesis.observation, live, pack.hypothesis.account_name).tier !== 'VERIFIED_FACT') {
    return refuse(prisma, actor, decisionId, {
      ok: false,
      reason: 'evidence_insufficient',
      detail: 'The observation does not rest only on verified, dated, quoted facts about a physical-network change at this account. Research it before any email.',
    });
  }
  const persona = pack.persona;
  if (!persona || pack.personaSource !== 'decision') return refuse(prisma, actor, decisionId, { ok: false, reason: 'persona_not_found', detail: pack.personaRefused ?? undefined });
  const email = (persona.email ?? '').trim().toLowerCase();
  if (!email) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_email' });
  if (!persona.email_valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return refuse(prisma, actor, decisionId, { ok: false, reason: 'email_invalid' });
  if (persona.do_not_contact) return refuse(prisma, actor, decisionId, { ok: false, reason: 'persona_do_not_contact' });
  // Ops closeout 14: the one bounce vocabulary (a historical `bounced` is a bounce too).
  if (isHardBounceStatus(persona.email_status)) return refuse(prisma, actor, decisionId, { ok: false, reason: 'email_bounced', detail: `email_status ${persona.email_status}` });
  // The unsubscribe table is the recipient's own decision; do_not_contact is
  // only its mirror and can lag it (Release B review #5). Read it directly.
  const unsubscribed = await prisma.unsubscribedEmail.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
  if (unsubscribed) return refuse(prisma, actor, decisionId, { ok: false, reason: 'recipient_unsubscribed' });
  // Release C review S5: someone at this account wrote in recently (a reply to
  // a colleague's GAP email, an assistant, a forward). A cold first touch to
  // another person there waits until a human has read it. A shared consumer
  // domain says nothing about the account.
  if (stepIndex === 0) {
    const replied = await accountRepliedRecently(prisma, email, now);
    if (replied) {
      return refuse(prisma, actor, decisionId, { ok: false, reason: 'account_replied', detail: `${replied.from_email} at this account wrote in on ${new Date(replied.received_at).toISOString().slice(0, 10)}. Read it before a first touch to anyone else there.` });
    }
    // Final red team: the card is a snapshot; a cold first touch never ignores what moved since it was minted.
    const moved = await personMovedSince(prisma, { email, personaId: persona.id ?? null, since: new Date(decision.created_at) });
    if (moved) {
      return refuse(prisma, actor, decisionId, { ok: false, reason: 'decision_stale', detail: `${moved} Wait for the next routing run before a first touch.` });
    }
  }
  if (mode === 'send') {
    const opportunity = await (deps.activeOpportunity ?? defaultActiveOpportunity)(prisma, pack.hypothesis.account_name, email, now);
    if (opportunity) {
      return refuse(prisma, actor, decisionId, { ok: false, reason: 'active_opportunity', detail: 'An open deal, a booked meeting or a recent positive reply: someone is already in conversation here.' });
    }
  }
  if (!pack.version) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_version' });
  // Release C review B2: a seed version still carrying the old fixture copy never sends.
  if (seedCopyOutdated(pack.version)) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'copy_version_outdated', detail: 'This sequence version still carries the retired seed copy. Run the seed rewrite before any email.' });
  }
  const step0 = pack.steps[stepIndex];
  if (!pack.rendered || !step0) return refuse(prisma, actor, decisionId, { ok: false, reason: stepIndex === 0 ? 'no_step0_copy' : 'no_step_copy' });
  if (pack.rendered.unrendered) return refuse(prisma, actor, decisionId, { ok: false, reason: 'unrendered_placeholder', detail: pack.rendered.unrendered });
  if (pack.unresolvedCitations.length > 0) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'template_citations_unresolved', detail: `the copy cites evidence that is not this hypothesis's: ${pack.unresolvedCitations.join(', ')}` });
  }
  const sentBodies =
    touch.state === 'waiting' || touch.state === 'due'
      ? history.sent.filter((s) => s.stepIndex < stepIndex && s.bodySnapshot).map((s) => s.bodySnapshot as string)
      : [];
  const contentHash = pack.contentHash!;

  // An unresolved Gmail draft for this person + step (red team T4, on any
  // card): Casey may still press Send in Gmail, so neither a direct send nor
  // a second draft of other copy may exist beside it. The same copy on the
  // same card is the idempotent case and returns that draft.
  const outstanding = history.drafts.filter((d) => d.fate === 'drafted' && (d.drafted.stepIndex ?? 0) === stepIndex);
  if (outstanding.length > 0) {
    const same = outstanding.find((d) => d.decisionId === decisionId && d.drafted.contentHash === contentHash);
    if (mode === 'draft' && same) return { ok: true, existingDraft: same.drafted };
    const d0 = outstanding[0];
    return refuse(prisma, actor, decisionId, {
      ok: false,
      reason: 'draft_outstanding',
      detail: `A Gmail draft of touch ${stepIndex + 1} to this person already exists (card ${d0.decisionId}, created ${d0.drafted.createdAt}). Send or delete it in Gmail, then reconcile, before anything else goes out.`,
    });
  }

  // Compiler clearance for exactly this marked copy.
  let compileRow = pack.compile;
  if (!compileRow) {
    const signals = Array.isArray(pack.hypothesis.signals)
      ? pack.hypothesis.signals.map((l: { signal?: unknown }) => l.signal).filter(Boolean)
      : [];
    const compiled = await (deps.compile ?? defaultCompile)(
      {
        hypothesisId: pack.hypothesis.id,
        sequenceVersionId: pack.version.id,
        stepIndex,
        subject: pack.rendered.marked.subject,
        body: pack.rendered.marked.body,
        priorBodies: sentBodies,
        contract: {
          hypothesis: {
            observation: pack.hypothesis.observation ?? '',
            problemHypothesis: pack.hypothesis.problem_hypothesis ?? '',
            problemFamily: pack.hypothesis.problem_family ?? 'unmapped',
          },
          evidence: evidenceRefsFromSignals(signals, now),
          stepCount: pack.steps.length,
          claimsUsed: step0.claimsUsed ?? [],
        },
        createdBy: actor,
      },
      { critic: deps.critic ?? makeCriticClient(), validateClaims: validateClaimsUsed, now: () => now, prisma },
    );
    if (compiled.verdict === 'reject') {
      return refuse(prisma, actor, decisionId, {
        ok: false,
        reason: 'copy_rejected',
        compileId: compiled.id,
        failedChecks: compiled.checks.filter((c) => !c.passed).map((c) => `${c.code}: ${c.detail}`),
      });
    }
    if (compiled.verdict === 'review_required' && compiled.id) {
      const reviewCodes = compiled.checks.filter((c) => !c.passed && c.severity === 'review').map((c) => c.code);
      const reasons = [...reviewCodes];
      if (!compiled.critic.ok) reasons.push(compiled.critic.reason);
      else if (compiled.critic.verdict === 'review') reasons.push('critic_review');
      const approval = await requestApproval(prisma, {
        compileId: compiled.id,
        hypothesisId: pack.hypothesis.id,
        accountName: pack.hypothesis.account_name,
        reason: `review_required: ${reasons.join(', ')} (Seller Action Center draft for ${persona.name ?? email})`,
        reviewCodes,
        requestedBy: actor,
        now,
      });
      return refuse(prisma, actor, decisionId, {
        ok: false,
        reason: 'copy_review_required',
        compileId: compiled.id,
        approvalRequestId: approval.ok ? approval.id : undefined,
        failedChecks: compiled.checks.filter((c) => !c.passed).map((c) => `${c.code}: ${c.detail}`),
        detail: reasons.join(', '),
      });
    }
    compileRow = await findCompileForCopy(prisma, { hypothesisId: pack.hypothesis.id, versionId: pack.version.id, marked: pack.rendered.marked, stepIndex });
    if (!compileRow && compiled.verdict === 'pass' && compiled.id) {
      compileRow = { id: compiled.id, verdict: 'pass', created_at: now, approved: false, approvalRequestId: null, approvalStatus: null };
    }
  }
  if (!compileCleared(compileRow)) {
    return refuse(prisma, actor, decisionId, {
      ok: false,
      reason: compileRow?.verdict === 'reject' ? 'copy_rejected' : 'copy_review_required',
      compileId: compileRow?.id,
      approvalRequestId: compileRow?.approvalRequestId ?? undefined,
      detail: compileRow ? `${compileRow.verdict}${compileRow.approvalStatus ? ` (approval ${compileRow.approvalStatus})` : ''}` : 'not compiled',
    });
  }

  let unsubscribeUrl: string;
  let oneClickUrl: string;
  try {
    unsubscribeUrl = (deps.unsubscribeUrl ?? defaultUnsubscribeUrl)(email);
    // RFC 8058 (red team T5): the header targets the API route that honors the
    // one-click POST; the visible link is the human page.
    oneClickUrl = oneClickUnsubscribeUrl(email);
  } catch (err) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'unsubscribe_link_unavailable', detail: err instanceof Error ? err.message : String(err) });
  }

  // The GAP mailbox (casey@yardflow.ai) when configured: it sets the token, the
  // Gmail API mailbox and the MIME From together. Else the env identity.
  const gapSender = (deps.gapSender ?? gapGmailSender)();
  const senderIdentity = gapSender?.userEmail ?? (deps.senderAddress ?? gmailSenderAddress)();
  const signatureHtml = await (deps.signature ?? getGmailSignature)(gapSender ?? undefined);

  // Threading: only from reconciled truth. The prior touch's Gmail thread id
  // and message id come from the SENT ledger row; the RFC Message-ID is read
  // from Gmail. No thread id on record means a fresh message, never a guess.
  let threadContext: ExecutionIntent['threadContext'] = null;
  let subject = pack.rendered.queued.subject;
  let inReplyToGmailMessageId: string | null = null;
  if (stepIndex > 0 && (touch.state === 'due' || touch.state === 'waiting') && touch.threadFrom.gmailThreadId) {
    subject = `Re: ${touch.sent[0].subject.replace(/^\s*(re:\s*)+/i, '')}`;
    const hdr = await (deps.getMessageHeaders ?? getGmailMessageHeaders)(touch.threadFrom.gmailSentMessageId, gapSender ?? undefined);
    threadContext = {
      threadId: touch.threadFrom.gmailThreadId,
      subject,
      ...(hdr?.messageIdHeader ? { inReplyTo: hdr.messageIdHeader, references: [hdr.messageIdHeader] } : {}),
    };
    inReplyToGmailMessageId = touch.threadFrom.gmailSentMessageId;
  }

  return {
    ok: true,
    prepared: {
      decisionId,
      stepIndex,
      hypothesisId: pack.hypothesis.id,
      accountName: pack.hypothesis.account_name,
      personaId: persona.id,
      personaName: persona.name ?? null,
      hubspotContactId: persona.hubspot_contact_id ?? null,
      recipient: email,
      senderIdentity,
      gapSender: gapSender ?? null,
      subject,
      bodySnapshot: pack.rendered.queued.body,
      contentHash,
      sequenceVersionId: pack.version.id,
      compileId: compileRow!.id,
      html: draftHtml(pack.rendered.queued.body, unsubscribeUrl, signatureHtml),
      text: draftText(pack.rendered.queued.body, unsubscribeUrl, signatureHtml),
      headers: { 'List-Unsubscribe': `<${oneClickUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      threadContext,
      inReplyToGmailMessageId,
    },
  };
}

export async function createSellerGmailDraft(
  prisma: PrismaLike,
  input: { decisionId: string; actor: string; now: Date; stepIndex?: number },
  deps: SellerDraftDeps = {},
): Promise<SellerDraftResult> {
  const { decisionId, actor, now } = input;
  const prep = await prepareSellerEmail(prisma, { ...input, mode: 'draft' }, deps);
  if (!prep.ok) return prep;
  if ('existingDraft' in prep) return { ok: true, alreadyDrafted: true, receipt: prep.existingDraft };
  const p = prep.prepared;
  const refuse = (pr: PrismaLike, a: string, d: string, r: Refusal) => refuseAs(DRAFT_REFUSED, pr, a, d, r);
  const { stepIndex, contentHash, senderIdentity, threadContext, subject, inReplyToGmailMessageId } = p;
  const email = p.recipient;
  const gapSender = p.gapSender;

  const intent: ExecutionIntent = {
    engine: 'gmail_draft',
    personaId: p.personaId,
    hypothesisId: p.hypothesisId,
    sequenceVersionId: p.sequenceVersionId,
    stepIndex,
    compileIds: [p.compileId],
    senderIdentity,
    idempotencyKey: `gmail_draft:${decisionId}:${stepIndex}:${contentHash}`,
    threadContext,
    actor,
    actorKind: 'human',
    mode: 'live',
    now,
  };
  // Claim this person + step under the person lock BEFORE Gmail (red team
  // Release B review): a double click, a draft on another card or a racing
  // direct send meets it inside the lock; a lost answer leaves the claim open.
  const claimKey = `${personStepKey(p.personaId, email, stepIndex)}:draft:${now.toISOString()}`;
  const claim = await claimSendKey(prisma, { key: claimKey, decisionId, personaId: p.personaId, recipient: email, stepIndex, actor, now, kind: 'draft' });
  if (!claim.claimed) {
    const reason: SellerDraftRefusal =
      claim.state === 'sent' ? (stepIndex === 0 ? 'first_touch_already_sent' : 'step_already_sent') : claim.state === 'drafted' ? 'draft_outstanding' : 'send_in_progress_or_unknown';
    return refuse(prisma, actor, decisionId, { ok: false, reason, detail: `touch ${stepIndex + 1} to this person is ${claim.state}` });
  }
  const receipt = await gmailDraftAdapter(
    intent,
    {
      to: email,
      subject,
      html: p.html,
      text: p.text,
      headers: { ...p.headers },
      ...(gapSender ? { sender: gapSender } : {}),
    },
    deps.gmail ?? {},
  );
  if (receipt.status !== 'drafted' || !receipt.engineId) {
    const why = receipt.refusalReason ?? 'no draft id';
    // Release only when Gmail provably created nothing; otherwise the claim stays open (an orphan draft is never invisible).
    if (isDefinitelyNotSent(why)) {
      await appendLedger(prisma, DIRECT_RELEASED, actor, decisionId, { idempotencyKey: claimKey, reason: why, at: now.toISOString() }).catch(() => undefined);
    }
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'gmail_refused', detail: why });
  }

  const payload: DraftedPayload = {
    engine: 'gmail_draft',
    status: 'drafted',
    routingDecisionId: decisionId,
    hypothesisId: p.hypothesisId,
    personaId: p.personaId,
    accountName: p.accountName,
    recipient: email,
    senderIdentity,
    subject,
    contentHash,
    bodySnapshot: p.bodySnapshot,
    sequenceVersionId: p.sequenceVersionId,
    stepIndex,
    inReplyToGmailMessageId,
    compileId: p.compileId,
    // prepareSellerEmail refuses anything below a verified outreach fact (T6).
    evidenceTier: 'VERIFIED_FACT',
    claimKey,
    gmailDraftId: receipt.engineId,
    gmailDraftMessageId: receipt.draftMessageId ?? null,
    gmailThreadId: receipt.threadId ?? null,
    createdAt: now.toISOString(),
  };
  try {
    await appendLedger(prisma, DRAFTED, actor, decisionId, payload as unknown as Record<string, unknown>);
  } catch (err) {
    return { ok: true, alreadyDrafted: false, receipt: payload, ledgerError: err instanceof Error ? err.message : String(err) };
  }
  return { ok: true, alreadyDrafted: false, receipt: payload };
}
