/**
 * /gap/preview/[hypothesisId] (GAP Prospecting OS, Sprint 3, S3-T12).
 *
 * Server page behind GAP_OS_ENABLED + GAP_MESSAGE_COMPILER_ENABLED: a flag
 * that is off means 404, the same answer the compile and enroll APIs give.
 * The session is enforced by middleware for every page; the explicit
 * auth() check is a second lock.
 *
 * What it shows, top to bottom: the hypothesis (FACT observation with its
 * cited signals, the HYPOTHESIS block, what a "no" would mean), the persona
 * and the resolved enroll target, the version under review, then one
 * CompileReport card per step built from the NEWEST GapCompile row per
 * step. When every step is cleared (pass, or review approved) the shadow
 * button posts to /api/gap/enroll. No live button this sprint.
 *
 * Version resolution: the hypothesis's own `sequence_version_id` when set;
 * else the newest draft or frozen version of its `sequence_family_id`; else
 * the newest draft or frozen version of the newest unarchived family whose
 * `problem_family` matches the hypothesis's problem family (engine
 * preferred by the resolved target). Target resolution reads the newest
 * `enroll_gap_sequence` RoutingDecision for the hypothesis, exactly as the
 * enroll service does.
 *
 * Compile rows (R3-5): the report and the enroll button read rows compiled
 * for THIS hypothesis on the resolved version (`hypothesisCompileWhere`).
 * Template-level rows (hypothesis_id null, from a `template: true` compile of
 * the version's template copy) are a second query and render under their
 * own "template compile (shadow only)" heading; they never feed `compileIds`
 * or the cleared state.
 *
 * Never rendered: `inputs_snapshot`, `critic` payloads, `last_intent_source`
 * or any other private intent field. The report component picks columns by
 * name (see compile-report.tsx) and this page passes it nothing else.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { isApproved } from '@/lib/gap/compiler/approval';
import { hypothesisCompileWhere, templateCompileWhere } from '@/lib/gap/compiler/preview-rows';
import { loadActionPack } from '@/lib/gap/execution/action-pack';
import { listDraftRecords } from '@/lib/gap/execution/draft-ledger';
import { EMAIL_ACTIONS } from '@/lib/gap/execution/seller-draft';
import { gmailSenderAddress } from '@/lib/email/gmail-sender';
import { hubspotCompanyUrl, hubspotContactUrl, mailtoHref, telHref } from '@/lib/gap/routing/seller-action';
import { firstNameOf } from '@/lib/gap/sequence/render';
import { buildCallPack, stripObservationCitations } from '@/lib/gap/sequence/call-pack';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/gap/copy-button';
import { FactBlock, HypothesisBlock } from '@/components/gap/fact-hypothesis-blocks';
import { HypothesisStatusBadge } from '@/components/gap/hypothesis-drawer';
import { asStringList } from '@/lib/gap/ui/format';
import {
  CompileReport,
  allStepsCleared,
  newestPerStep,
  toReportStep,
  type CompileReportStep,
  type CompileRowLike,
  type ReportApproval,
} from '@/components/gap/compile-report';
import { SellerDraftPanel, type DraftRow } from '@/components/gap/seller-draft-panel';
import { EnrollShadowButton } from './enroll-shadow-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preview' };

type Params = { hypothesisId: string };

type Obj = Record<string, unknown>;
function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function stepCopy(steps: Array<{ templates?: { subjectTemplate?: string | null; bodyTemplate?: string | null } | null }>, i: number) {
  const t = steps[i]?.templates ?? null;
  return { subject: t?.subjectTemplate ?? null, body: t?.bodyTemplate ?? null };
}

type Search = { personaId?: string; decisionId?: string };

export default async function PreviewPage({ params, searchParams }: { params: Promise<Params>; searchParams?: Promise<Search> }) {
  if (assertGapEnabled('GAP_MESSAGE_COMPILER_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { hypothesisId } = await params;
  const search = (await searchParams) ?? {};
  const personaIdParam = search.personaId && /^\d+$/.test(search.personaId) ? Number(search.personaId) : null;
  const decisionIdParam = search.decisionId?.trim() || null;

  // One loader for the page AND the draft service (action-pack.ts): the copy
  // shown here is byte-for-byte the copy a draft would carry, for the person
  // on the card, judged by the compile row for exactly this copy.
  const pack = await loadActionPack(prisma, { hypothesisId, personaId: personaIdParam, decisionId: decisionIdParam });
  if (!pack) notFound();
  const { hypothesis, persona, decision, target, top100, version, steps } = pack;

  const account = await prisma.account.findUnique({
    where: { name: hypothesis.account_name },
    select: { hubspot_company_id: true },
  });

  let reportSteps: CompileReportStep[] = [];
  let templateSteps: CompileReportStep[] = [];
  let compileIds: string[] = [];
  if (version && steps.length > 0) {
    const select = { id: true, step_index: true, verdict: true, checks: true, word_count: true, cta_family: true, created_at: true };
    // Rows for this hypothesis only: these are the report and the gate input.
    const rows: CompileRowLike[] = await prisma.gapCompile.findMany({
      where: hypothesisCompileWhere(version.id, hypothesis.id),
      orderBy: { created_at: 'desc' },
      select,
    });
    const newest = newestPerStep(rows, steps.length);
    reportSteps = await Promise.all(
      newest.map(async (row, i) => {
        let approval: ReportApproval | null = null;
        if (row && row.verdict === 'review_required') approval = await isApproved(prisma, row.id);
        return toReportStep(i, row, stepCopy(steps, i), approval);
      }),
    );
    compileIds = newest.filter((r): r is CompileRowLike => r !== null).map((r) => r.id);

    // Template-level rows: shown apart, never a gate input.
    const templateRows: CompileRowLike[] = await prisma.gapCompile.findMany({
      where: templateCompileWhere(version.id),
      orderBy: { created_at: 'desc' },
      select,
    });
    if (templateRows.length > 0) {
      templateSteps = newestPerStep(templateRows, steps.length).map((row, i) => toReportStep(i, row, stepCopy(steps, i), null));
    }
  }

  const cleared = allStepsCleared(reportSteps);

  // Ready to send means the compiler cleared THIS exact rendered copy (a pass,
  // or a review Casey approved), not merely that some step-0 row exists.
  const renderedEmail = pack.rendered;
  const emailReady = pack.emailReady;
  const compileNote = !pack.compile
    ? 'Not compiled yet. Check copy runs the compiler on exactly this email.'
    : pack.compile.verdict === 'review_required' && !pack.compile.approved
      ? `Compiled: needs review (approval ${pack.compile.approvalStatus ?? 'not requested'}).`
      : pack.compile.verdict === 'reject'
        ? 'Compiled: rejected. See the report below.'
        : null;

  // The draft panel is for an email card opened from the Work Queue.
  const isEmailCard = decision != null && EMAIL_ACTIONS.has(decision.action) && decision.lane !== 'blocked' && pack.personaSource === 'decision';
  const draftIneligible = !decision || pack.personaSource !== 'decision'
    ? 'Open this action pack from a Work Queue card to create a Gmail draft for that person.'
    : !isEmailCard
      ? 'This card does not recommend email, so there is no draft to create.'
      : !persona?.email
        ? 'No email address on file for this person.'
        : persona.do_not_contact
          ? 'This person carries a do-not-contact flag. Email stays blocked at send; no draft.'
          : hypothesis.status !== 'active'
            ? 'The hypothesis is not active.'
            : null;
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

  const mailto = persona?.email ? mailtoHref(persona.email) : null;
  const tel = persona?.phone ? telHref(persona.phone) : null;
  const contactUrl = persona?.hubspot_contact_id ? hubspotContactUrl(persona.hubspot_contact_id) : null;
  const companyUrl = account?.hubspot_company_id ? hubspotCompanyUrl(account.hubspot_company_id) : null;

  const signals = Array.isArray(hypothesis.signals)
    ? hypothesis.signals.map((link: { signal?: unknown }) => link.signal).filter((s: unknown): s is Obj => isObj(s))
    : [];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Hypotheses', href: '/gap/hypotheses' }, { label: 'Preview' }]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{hypothesis.account_name}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {String(hypothesis.problem_family).replace(/_/g, ' ')} for {String(hypothesis.persona).replace(/_/g, ' ')}
          </p>
        </div>
        <HypothesisStatusBadge status={hypothesis.status} />
      </div>

      {pack.personaRefused ? (
        <p role="alert" className="rounded-md border border-[var(--destructive)] p-3 text-xs">
          The person requested for this action pack does not belong to {hypothesis.account_name} ({pack.personaRefused.replace(/_/g, ' ')}). Nothing is rendered for them.
        </p>
      ) : null}
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

      <section className="grid gap-3 rounded-md border border-[var(--border)] p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Persona</p>
          {persona ? (
            <div className="mt-1">
              <p>
                {persona.name}
                {persona.title ? <span className="text-[var(--muted-foreground)]">, {persona.title}</span> : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs" data-testid="preview-contact-buttons">
                {mailto ? (
                  <a href={mailto} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
                    Email
                  </a>
                ) : (
                  <span className="italic text-[var(--muted-foreground)]">email unavailable</span>
                )}
                {tel ? (
                  <a href={tel} className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
                    Call
                  </a>
                ) : (
                  <span className="italic text-[var(--muted-foreground)]">phone unavailable</span>
                )}
                {persona.linkedin_url ? (
                  <a href={persona.linkedin_url} target="_blank" rel="noreferrer noopener" className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
                    LinkedIn
                  </a>
                ) : (
                  <span className="italic text-[var(--muted-foreground)]">LinkedIn unavailable</span>
                )}
                {contactUrl ? (
                  <a href={contactUrl} target="_blank" rel="noreferrer noopener" className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
                    HubSpot contact
                  </a>
                ) : null}
                {companyUrl ? (
                  <a href={companyUrl} target="_blank" rel="noreferrer noopener" className="rounded-md border border-[var(--border)] px-2 py-1 hover:bg-[var(--muted)]">
                    HubSpot account
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-1 italic text-[var(--muted-foreground)]">no primary persona</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Target</p>
          <p className="mt-1">
            <Badge variant="outline" data-target={target}>
              {target.replace(/_/g, ' ')}
            </Badge>
            {top100?.sequenceName ? <span className="ml-2 text-xs text-[var(--muted-foreground)]">{top100.sequenceName}</span> : null}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Version</p>
          {version ? (
            <p className="mt-1">
              {version.family?.name ?? 'GAP family'} v{version.version}
              <span className="ml-2 text-xs text-[var(--muted-foreground)]">{version.status}</span>
            </p>
          ) : (
            <p className="mt-1 italic text-[var(--muted-foreground)]">no draft or frozen version for this family</p>
          )}
        </div>
      </section>

      {renderedEmail ? (
        <section data-testid="rendered-email" className="space-y-3 rounded-md border border-[var(--border)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Email</p>
            <Badge data-testid="email-readiness" variant={emailReady ? 'success' : 'warning'}>
              {emailReady ? 'Ready to send' : 'Needs copy review'}
            </Badge>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Subject</p>
            <p className="mt-1 text-sm" data-testid="email-subject">{renderedEmail.queued.subject}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Body</p>
            <p className="mt-1 whitespace-pre-wrap text-sm" data-testid="email-body">{renderedEmail.queued.body}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={renderedEmail.queued.body} label="Copy email" />
            {persona?.email ? <CopyButton text={persona.email} label="Copy email address" /> : null}
          </div>
          {!emailReady ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              This copy has not cleared the compiler yet. It is shown for review, not for sending.{compileNote ? ` ${compileNote}` : ''}
            </p>
          ) : null}
        </section>
      ) : (
        <section data-testid="no-email-copy" className="rounded-md border border-dashed border-[var(--border)] p-4 text-xs">
          <p className="font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Missing prerequisite</p>
          <p className="mt-1">
            {!persona
              ? 'No person is attached to this action pack.'
              : !version
                ? `No GAP sequence family exists for ${String(hypothesis.problem_family).replace(/_/g, ' ')} yet, so there is no email to render.`
                : 'The sequence has no step 0 copy to render.'}
          </p>
        </section>
      )}

      {renderedEmail && decision ? (
        <SellerDraftPanel
          decisionId={decision.id}
          emailReady={emailReady}
          senderIdentity={gmailSenderAddress()}
          drafts={drafts}
          ineligibleReason={draftIneligible}
        />
      ) : null}

      {callPack ? (
        <section data-testid="call-pack" className="space-y-3 rounded-md border border-[var(--border)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Call</p>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Opener</p>
            <p className="mt-1 text-sm" data-testid="call-opener">{callPack.opener}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Diagnostic 1 (current state / root cause)</p>
            <p className="mt-1 text-sm">{callPack.diagnostic1}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Diagnostic 2 (business impact)</p>
            <p className="mt-1 text-sm">{callPack.diagnostic2}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)]">Voicemail (20-30 seconds)</p>
            <p className="mt-1 text-sm">{callPack.voicemail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={callPack.opener} label="Copy call opener" />
            {persona?.phone ? <CopyButton text={persona.phone} label="Copy phone" /> : null}
          </div>
        </section>
      ) : null}

      <CompileReport steps={reportSteps} />

      {templateSteps.length > 0 ? (
        <section className="space-y-3 rounded-md border border-dashed border-[var(--border)] p-4" data-testid="template-compile">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              template compile (shadow only)
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Compiled from the version&apos;s template copy with no hypothesis, so no evidence and no observation were
              checked. These rows never unlock the enroll row above.
            </p>
          </div>
          <CompileReport steps={templateSteps} />
        </section>
      ) : null}

      {persona && version ? (
        <EnrollShadowButton
          hypothesisId={hypothesis.id}
          personaId={persona.id}
          sequenceVersionId={version.id}
          compileIds={compileIds}
          decisionId={decision?.id ?? null}
          disabled={!cleared}
        />
      ) : null}
      {!cleared ? (
        <p className="text-xs text-[var(--muted-foreground)]">
          The enroll row is available once every step has passed or its review is approved.
        </p>
      ) : null}
    </div>
  );
}
