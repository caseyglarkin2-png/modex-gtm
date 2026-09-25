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
import { gmailSenderAddress } from '@/lib/email/gmail-sender';
import { generateToken } from '@/lib/email/unsubscribe-token';
import { requestApproval } from '../compiler/approval';
import { compile as defaultCompile } from '../compiler/compile';
import { evidenceRefsFromSignals } from '../compiler/evidence-from-signals';
import { makeCriticClient } from '../critic-client';
import type { CriticClient } from '../critic-client';
import { compileCleared, findCompileForCopy, loadActionPack } from './action-pack';
import { appendLedger, DRAFT_REFUSED, DRAFTED, listDraftRecords, type DraftedPayload } from './draft-ledger';
import { gmailDraftAdapter, type GmailAdapterDeps } from './gmail-adapter';
import { gapGmailSender } from './gap-sender';
import type { GmailSender } from '@/lib/email/gmail-sender';
import type { ExecutionIntent } from './contract';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

/** Routing actions whose seller instruction is "Email {name}". */
export const EMAIL_ACTIONS: ReadonlySet<string> = new Set(['enroll_gap_sequence', 'one_off_email']);

export type SellerDraftRefusal =
  | 'decision_not_found'
  | 'decision_blocked'
  | 'not_an_email_action'
  | 'no_hypothesis'
  | 'hypothesis_not_found'
  | 'hypothesis_not_active'
  | 'persona_not_found'
  | 'no_email'
  | 'email_invalid'
  | 'persona_do_not_contact'
  | 'no_version'
  | 'no_step0_copy'
  | 'unrendered_placeholder'
  | 'copy_rejected'
  | 'copy_review_required'
  | 'unsubscribe_link_unavailable'
  | 'gmail_refused';

export type SellerDraftResult =
  | {
      ok: true;
      /** checkOnly: the exact copy is compiler-cleared; nothing was drafted. */
      checked: true;
      compileId: string;
    }
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
  unsubscribeUrl?: (email: string) => string;
}

function defaultUnsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://modex-gtm.vercel.app';
  return `${base}/unsubscribe?email=${encodeURIComponent(email)}&token=${generateToken(email)}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Plain paragraphs, no tracking pixel, no branded wrapper: this is Casey's own 1:1 email. */
export function draftHtml(body: string, unsubscribeUrl: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0;">${escapeHtml(p).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a1a1a;">\n${paragraphs}\n<p style="margin:18px 0 0 0;font-size:11px;color:#9ca3af;">Not relevant? <a href="${escapeHtml(unsubscribeUrl)}" style="color:#9ca3af;">Unsubscribe</a>.</p>\n</div>`;
}

export function draftText(body: string, unsubscribeUrl: string): string {
  return `${body}\n\nNot relevant? Unsubscribe: ${unsubscribeUrl}`;
}

async function refuse(
  prisma: PrismaLike,
  actor: string,
  decisionId: string,
  r: Extract<SellerDraftResult, { ok: false }>,
): Promise<SellerDraftResult> {
  try {
    await appendLedger(prisma, DRAFT_REFUSED, actor, decisionId, { ...r });
  } catch {
    // The refusal is the answer; a lost refusal row loses nothing but the audit line.
  }
  return r;
}

export async function createSellerGmailDraft(
  prisma: PrismaLike,
  input: { decisionId: string; actor: string; now: Date; checkOnly?: boolean },
  deps: SellerDraftDeps = {},
): Promise<SellerDraftResult> {
  const { decisionId, actor, now } = input;

  const decision = await prisma.routingDecision.findUnique({
    where: { id: decisionId },
    select: { id: true, lane: true, action: true, hypothesis_id: true, persona_id: true, account_name: true },
  });
  if (!decision) return { ok: false, reason: 'decision_not_found' };
  if (decision.lane === 'blocked' || decision.action === 'do_not_contact') return refuse(prisma, actor, decisionId, { ok: false, reason: 'decision_blocked' });
  if (!EMAIL_ACTIONS.has(decision.action)) return refuse(prisma, actor, decisionId, { ok: false, reason: 'not_an_email_action', detail: decision.action });
  if (!decision.hypothesis_id) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_hypothesis' });

  const pack = await loadActionPack(prisma, { hypothesisId: decision.hypothesis_id, decisionId });
  if (!pack) return refuse(prisma, actor, decisionId, { ok: false, reason: 'hypothesis_not_found' });
  if (pack.hypothesis.status !== 'active') return refuse(prisma, actor, decisionId, { ok: false, reason: 'hypothesis_not_active', detail: pack.hypothesis.status });
  const persona = pack.persona;
  if (!persona || pack.personaSource !== 'decision') return refuse(prisma, actor, decisionId, { ok: false, reason: 'persona_not_found', detail: pack.personaRefused ?? undefined });
  const email = (persona.email ?? '').trim().toLowerCase();
  if (!email) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_email' });
  if (!persona.email_valid || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return refuse(prisma, actor, decisionId, { ok: false, reason: 'email_invalid' });
  if (persona.do_not_contact) return refuse(prisma, actor, decisionId, { ok: false, reason: 'persona_do_not_contact' });
  if (!pack.version) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_version' });
  const step0 = pack.steps[0];
  if (!pack.rendered || !step0) return refuse(prisma, actor, decisionId, { ok: false, reason: 'no_step0_copy' });
  if (pack.rendered.unrendered) return refuse(prisma, actor, decisionId, { ok: false, reason: 'unrendered_placeholder', detail: pack.rendered.unrendered });
  const contentHash = pack.contentHash!;

  // Idempotency: this exact copy already drafted for this card and still a draft.
  const existing = (await listDraftRecords(prisma, decisionId)).find((d) => d.fate === 'drafted' && d.drafted.contentHash === contentHash);
  if (existing && !input.checkOnly) return { ok: true, alreadyDrafted: true, receipt: existing.drafted };

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
        stepIndex: 0,
        subject: pack.rendered.marked.subject,
        body: pack.rendered.marked.body,
        priorBodies: [],
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
    compileRow = await findCompileForCopy(prisma, { hypothesisId: pack.hypothesis.id, versionId: pack.version.id, marked: pack.rendered.marked });
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

  // "Check copy": every guard above ran, the copy is cleared, and nothing is drafted.
  if (input.checkOnly) return { ok: true, checked: true, compileId: compileRow!.id };

  let unsubscribeUrl: string;
  try {
    unsubscribeUrl = (deps.unsubscribeUrl ?? defaultUnsubscribeUrl)(email);
  } catch (err) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'unsubscribe_link_unavailable', detail: err instanceof Error ? err.message : String(err) });
  }

  // The GAP mailbox (casey@yardflow.ai) when configured: it sets the token, the
  // Gmail API mailbox and the MIME From together. Else the env identity.
  const gapSender = (deps.gapSender ?? gapGmailSender)();
  const senderIdentity = gapSender?.userEmail ?? (deps.senderAddress ?? gmailSenderAddress)();
  const intent: ExecutionIntent = {
    engine: 'gmail_draft',
    personaId: persona.id,
    hypothesisId: pack.hypothesis.id,
    sequenceVersionId: pack.version.id,
    stepIndex: 0,
    compileIds: [compileRow!.id],
    senderIdentity,
    idempotencyKey: `gmail_draft:${decisionId}:${contentHash}`,
    actor,
    actorKind: 'human',
    mode: 'live',
    now,
  };
  const receipt = await gmailDraftAdapter(
    intent,
    {
      to: email,
      subject: pack.rendered.queued.subject,
      html: draftHtml(pack.rendered.queued.body, unsubscribeUrl),
      text: draftText(pack.rendered.queued.body, unsubscribeUrl),
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      ...(gapSender ? { sender: gapSender } : {}),
    },
    deps.gmail ?? {},
  );
  if (receipt.status !== 'drafted' || !receipt.engineId) {
    return refuse(prisma, actor, decisionId, { ok: false, reason: 'gmail_refused', detail: receipt.refusalReason ?? 'no draft id' });
  }

  const payload: DraftedPayload = {
    engine: 'gmail_draft',
    status: 'drafted',
    routingDecisionId: decisionId,
    hypothesisId: pack.hypothesis.id,
    personaId: persona.id,
    accountName: pack.hypothesis.account_name,
    recipient: email,
    senderIdentity,
    subject: pack.rendered.queued.subject,
    contentHash,
    bodySnapshot: pack.rendered.queued.body,
    sequenceVersionId: pack.version.id,
    compileId: compileRow!.id,
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
