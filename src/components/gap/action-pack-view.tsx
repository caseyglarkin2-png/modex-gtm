/**
 * The action pack, one server component (weekend reduction pass, 2026-09-26).
 *
 * Rendered in two places from the same code: inline under an opened READY or
 * FOLLOW UP card on /gap (`embedded`), and on the /gap/preview deep link.
 * Top to bottom: why now, the sequence state, the EMAIL (subject, body, SEND
 * EMAIL), the Gmail draft alternative, the CALL (opener, diagnostics,
 * voicemail), and why GAP thinks this.
 *
 * Copy checking is machine work. SEND EMAIL shows whenever the page-level
 * checks pass, compiled or not: the send route compiles exactly this copy on
 * the first click, a PASS goes straight to the final confirmation, a REVIEW
 * shows the concern inline with Approve, a REJECT explains why sending is
 * blocked. Every server gate re-runs at the click; nothing here decides.
 *
 * `resolveActionPack` is the one loader both surfaces use (the touch this card
 * is on, then loadActionPack for that step), so the copy shown is the copy a
 * send or draft would carry.
 */

import { prisma } from '@/lib/prisma';
import { loadActionPack } from '@/lib/gap/execution/action-pack';
import { listDraftRecords } from '@/lib/gap/execution/draft-ledger';
import { EMAIL_ACTIONS } from '@/lib/gap/execution/seller-draft';
import { gmailSenderAddress } from '@/lib/email/gmail-sender';
import { gapGmailSender } from '@/lib/gap/execution/gap-sender';
import { computeNextTouch, type NextTouch } from '@/lib/gap/execution/next-touch';
import { telHref } from '@/lib/gap/routing/seller-action';
import { firstNameOf } from '@/lib/gap/sequence/render';
import { buildCallPack, stripObservationCitations } from '@/lib/gap/sequence/call-pack';
import { asStringList } from '@/lib/gap/ui/format';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from './copy-button';
import { FactBlock, HypothesisBlock } from './fact-hypothesis-blocks';
import { SellerDraftPanel, type DraftRow } from './seller-draft-panel';
import { SendFromYardflow } from './send-from-yardflow';

type Obj = Record<string, unknown>;
function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export interface ActionPackTarget {
  hypothesisId: string;
  personaId: number | null;
  decisionId: string | null;
}

/** The touch this card is on (a DUE follow-up renders that step; otherwise step 0), then the pack for it. */
export async function resolveActionPack(t: ActionPackTarget) {
  let touch: NextTouch | null = null;
  if (t.decisionId) {
    try {
      touch = await computeNextTouch(prisma, t.decisionId, new Date());
    } catch {
      touch = { state: 'unknown', detail: 'Could not evaluate the sequence.', sent: [] };
    }
  }
  const touchStep = touch?.state === 'due' ? touch.stepIndex : 0;
  const pack = await loadActionPack(prisma, { hypothesisId: t.hypothesisId, personaId: t.personaId, decisionId: t.decisionId, stepIndex: touchStep });
  return { touch, touchStep, pack };
}

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });

export async function ActionPackView({ target, embedded = false }: { target: ActionPackTarget; embedded?: boolean }) {
  const { touch, touchStep, pack } = await resolveActionPack(target);
  if (!pack) {
    return <p className="text-sm text-[var(--destructive)]">This card&apos;s hypothesis no longer exists, so there is nothing to prepare.</p>;
  }
  const { hypothesis, persona, decision } = pack;
  const renderedEmail = pack.rendered;
  const emailReady = pack.emailReady;

  // The draft and send paths are for an email card opened from its routing card.
  const isEmailCard = decision != null && EMAIL_ACTIONS.has(decision.action) && decision.lane !== 'blocked' && pack.personaSource === 'decision';
  const draftIneligible = !decision || pack.personaSource !== 'decision'
    ? 'Open this from a card on /gap to email that person.'
    : !isEmailCard
      ? 'This card does not recommend email.'
      : !persona?.email
        ? 'No email address on file for this person.'
        : persona.do_not_contact
          ? 'This person carries a do-not-contact flag. Email stays blocked at send.'
          : hypothesis.status !== 'active'
            ? 'The hypothesis is not in use.'
            : null;
  // A newer routing decision for this person that is not an email supersedes this card (the service refuses too).
  const newerDecision = decision && decision.persona_id != null
    ? await prisma.routingDecision.findFirst({
        where: { persona_id: decision.persona_id, account_name: decision.account_name, created_at: { gt: decision.created_at } },
        orderBy: { created_at: 'desc' },
        select: { id: true, action: true, rule_id: true },
      })
    : null;
  const superseded = newerDecision && !EMAIL_ACTIONS.has(newerDecision.action)
    ? `A newer routing run changed this card to ${newerDecision.action.replace(/_/g, ' ')} (${newerDecision.rule_id.replace(/_/g, ' ')}).`
    : null;
  const pendingApproval =
    pack.compile && pack.compile.verdict === 'review_required' && !pack.compile.approved && pack.compile.approvalRequestId && pack.compile.approvalStatus === 'pending'
      ? {
          id: pack.compile.approvalRequestId,
          reason:
            ((await prisma.sendApprovalRequest.findUnique({ where: { id: pack.compile.approvalRequestId }, select: { comment: true } })) as { comment: string | null } | null)?.comment ?? '',
        }
      : null;
  const touchIneligible = !touch || touch.state === 'not_started' || touch.state === 'due'
    ? null
    : touch.state === 'waiting'
      ? `Touch ${touch.stepIndex + 1} is due ${fmtDay(touch.dueAt)}. Nothing to send yet.`
      : touch.state === 'stopped'
        ? `Sequence stopped: ${touch.detail}`
        : touch.state === 'complete'
          ? 'Every touch in this sequence has been sent.'
          : touch.state === 'unknown'
            ? `Sequence status unknown: ${touch.detail} Nothing is prepared until it can be read.`
            : null;
  const citationIneligible = pack.unresolvedCitations.length > 0
    ? `This step's template cites evidence that is not this account's (${pack.unresolvedCitations.join(', ')}). It must be rewritten with this account's facts before it can be sent.`
    : null;
  const rejected = pack.compile?.verdict === 'reject';
  const blockedReason = superseded ?? touchIneligible ?? citationIneligible ?? draftIneligible;
  // SEND EMAIL does not wait for a separate copy check: the send route compiles on the first click.
  const sendable = Boolean(renderedEmail && decision && !rejected && !blockedReason);
  const drafts: DraftRow[] = decision
    ? (await listDraftRecords(prisma, decision.id)).map((d) => ({
        gmailDraftId: d.drafted.gmailDraftId,
        recipient: d.drafted.recipient,
        subject: d.drafted.subject,
        createdAt: d.drafted.createdAt,
        fate: d.fate,
        sentAt: d.sent?.sentAt ?? null,
        gmailSentMessageId: d.sent?.gmailSentMessageId ?? null,
      }))
    : [];

  const callPack =
    persona && renderedEmail
      ? buildCallPack({
          firstName: firstNameOf(persona.name),
          senderFirstName: 'Casey',
          accountName: hypothesis.account_name,
          observationPlain: stripObservationCitations(hypothesis.observation ?? ''),
          problemHypothesis: hypothesis.problem_hypothesis ?? '',
          diagnosticQuestion: asStringList(hypothesis.falsification_questions)[0] ?? null,
        })
      : null;

  const whyNow = (hypothesis.why_now as string | null)?.trim() || stripObservationCitations(hypothesis.observation ?? '').trim() || null;
  const tel = persona?.phone ? telHref(persona.phone) : null;
  const mailbox = gapGmailSender()?.userEmail ?? gmailSenderAddress();
  const signals = Array.isArray(hypothesis.signals)
    ? hypothesis.signals.map((link: { signal?: unknown }) => link.signal).filter((s: unknown): s is Obj => isObj(s))
    : [];

  return (
    <div className="space-y-4" data-testid="action-pack" data-embedded={embedded ? 'true' : undefined}>
      {pack.personaRefused ? (
        <p role="alert" className="rounded-md border border-[var(--destructive)] p-3 text-xs">
          The person requested for this action pack does not belong to {hypothesis.account_name} ({pack.personaRefused.replace(/_/g, ' ')}). Nothing is rendered for them.
        </p>
      ) : null}
      {whyNow ? (
        <section data-testid="why-now" className="rounded-md border border-[var(--border)] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Why now</p>
          <p className="mt-1">{whyNow}</p>
        </section>
      ) : null}

      {touch && touch.state !== 'not_started' ? (
        <section data-testid="sequence-status" className="space-y-1 rounded-md border border-[var(--border)] p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Sequence</p>
          {'sent' in touch
            ? touch.sent.map((t) => (
                <p key={t.gmailSentMessageId}>
                  Touch {t.stepIndex + 1} sent {fmtDay(t.sentAt)}
                </p>
              ))
            : null}
          {touch.state === 'waiting' ? <p className="font-medium">Waiting: touch {touch.stepIndex + 1} due {fmtDay(touch.dueAt)}</p> : null}
          {touch.state === 'due' ? <p className="font-medium">Follow up: touch {touch.stepIndex + 1} is due now (below)</p> : null}
          {touch.state === 'stopped' ? <p className="font-medium text-[var(--destructive)]">Sequence stopped: {touch.detail}</p> : null}
          {touch.state === 'complete' ? <p className="font-medium">Sequence complete</p> : null}
          {touch.state === 'unknown' ? <p className="font-medium">Sequence status unknown: {touch.detail}</p> : null}
        </section>
      ) : null}

      {pack.unresolvedCitations.length > 0 ? (
        <p role="alert" data-testid="unresolved-citations" className="rounded-md border border-[var(--destructive)] p-3 text-xs">
          This step&apos;s template states facts from placeholder evidence ({pack.unresolvedCitations.join(', ')}), not from {hypothesis.account_name}&apos;s own signals. Do not send it as written.
        </p>
      ) : null}

      {renderedEmail ? (
        <section data-testid="rendered-email" className="space-y-3 rounded-md border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Email{touchStep > 0 ? ` (touch ${touchStep + 1})` : ''}</p>
            {rejected ? <Badge data-testid="email-readiness" variant="destructive">Blocked by the copy check</Badge> : emailReady ? <Badge data-testid="email-readiness" variant="success">Copy checked</Badge> : null}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Subject</p>
            <p className="mt-1 break-words text-sm" data-testid="email-subject">{renderedEmail.queued.subject}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Body</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm" data-testid="email-body">{renderedEmail.queued.body}</p>
          </div>
          {sendable && decision ? <SendFromYardflow decisionId={decision.id} stepIndex={touchStep} mailbox={mailbox} pendingApproval={pendingApproval} /> : null}
          {rejected ? (
            <p data-testid="send-blocked" className="text-xs text-[var(--destructive)]">
              Sending is blocked: the copy check rejected this exact email. The reasons are in System details on the full action pack. Nothing can be sent until the copy is rewritten.
            </p>
          ) : !sendable && blockedReason ? (
            <p data-testid="send-unavailable" className="text-xs text-[var(--muted-foreground)]">{blockedReason}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {pack.unresolvedCitations.length === 0 ? <CopyButton text={renderedEmail.queued.body} label="Copy email" /> : null}
            {persona?.email ? <CopyButton text={persona.email} label="Copy email address" /> : null}
          </div>
        </section>
      ) : (
        <section data-testid="no-email-copy" className="rounded-md border border-dashed border-[var(--border)] p-4 text-xs">
          <p className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Missing prerequisite</p>
          <p className="mt-1">
            {!persona
              ? 'No person is attached to this action pack.'
              : !pack.version
                ? `No GAP sequence family exists for ${String(hypothesis.problem_family).replace(/_/g, ' ')} yet, so there is no email to render.`
                : 'The sequence has no copy for this step.'}
          </p>
        </section>
      )}

      {renderedEmail && decision && !blockedReason && !rejected ? (
        <details className="rounded-md border border-[var(--border)] p-3 text-sm" data-testid="save-draft-details">
          <summary className="cursor-pointer font-medium">Save draft instead (edit and send from Gmail)</summary>
          <div className="mt-3">
            <SellerDraftPanel
              decisionId={decision.id}
              emailReady={emailReady}
              senderIdentity={mailbox}
              drafts={drafts}
              ineligibleReason={null}
              pendingApproval={pendingApproval}
              stepIndex={touchStep}
            />
          </div>
        </details>
      ) : null}

      {callPack ? (
        <section data-testid="call-pack" className="space-y-3 rounded-md border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Call</p>
            {tel ? (
              <a href={tel} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs hover:bg-[var(--muted)]">
                Call {persona?.phone}
              </a>
            ) : (
              <span className="text-xs italic text-[var(--muted-foreground)]">no phone on file</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Opener</p>
            <p className="mt-1 text-sm" data-testid="call-opener">{callPack.opener}</p>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-xs font-semibold text-[var(--muted-foreground)]">Diagnostics and voicemail</summary>
            <div className="mt-2 space-y-2">
              <p><span className="text-xs font-semibold text-[var(--muted-foreground)]">Current state: </span>{callPack.diagnostic1}</p>
              <p><span className="text-xs font-semibold text-[var(--muted-foreground)]">Business impact: </span>{callPack.diagnostic2}</p>
              <p><span className="text-xs font-semibold text-[var(--muted-foreground)]">Voicemail (20-30 seconds): </span>{callPack.voicemail}</p>
            </div>
          </details>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={callPack.opener} label="Copy call opener" />
            {persona?.phone ? <CopyButton text={persona.phone} label="Copy phone" /> : null}
          </div>
        </section>
      ) : null}

      <details className="rounded-md border border-[var(--border)] p-3" data-testid="why-gap">
        <summary className="cursor-pointer text-sm font-medium">Why GAP thinks this (evidence, and what would prove us wrong)</summary>
        <div className="mt-3 space-y-4">
          <FactBlock observation={hypothesis.observation} signals={signals as never} />
          <HypothesisBlock
            problemHypothesis={hypothesis.problem_hypothesis}
            rootCauseHypotheses={asStringList(hypothesis.root_cause_hypotheses)}
            impactHypotheses={asStringList(hypothesis.impact_hypotheses)}
            whyNow={hypothesis.why_now}
            falsificationQuestions={asStringList(hypothesis.falsification_questions)}
            whatANoMeans={hypothesis.what_a_no_means}
            confidence={hypothesis.confidence}
          />
        </div>
      </details>
    </div>
  );
}
