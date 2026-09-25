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
import { getHypothesis } from '@/lib/gap/hypothesis/service';
import { resolveEnrollTarget } from '@/lib/gap/routing/rules';
import type { EnrollTarget, RoutingInputs, RoutingTop100Input } from '@/lib/gap/routing/types';
import { hubspotCompanyUrl, hubspotContactUrl, mailtoHref, telHref } from '@/lib/gap/routing/seller-action';
import { parseSteps } from '@/lib/gap/sequence/steps';
import { firstNameOf, renderStepCopy } from '@/lib/gap/sequence/render';
import { buildCallPack, stripObservationCitations } from '@/lib/gap/sequence/call-pack';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/gap/copy-button';
import { FactBlock, HypothesisBlock } from '@/components/gap/fact-hypothesis-blocks';
import { HypothesisStatusBadge, asStringList } from '@/components/gap/hypothesis-drawer';
import {
  CompileReport,
  allStepsCleared,
  newestPerStep,
  toReportStep,
  type CompileReportStep,
  type CompileRowLike,
  type ReportApproval,
} from '@/components/gap/compile-report';
import { EnrollShadowButton } from './enroll-shadow-button';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preview' };

type Params = { hypothesisId: string };

type Obj = Record<string, unknown>;
function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function optStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

const TARGETS: ReadonlySet<string> = new Set<EnrollTarget>(['hubspot_native', 'modex_queue', 'build_required']);
const ENGINE_FOR_TARGET: Record<EnrollTarget, string | null> = {
  hubspot_native: 'hubspot_native',
  modex_queue: 'modex_draft_queue',
  build_required: null,
};

interface DecisionLite {
  id: string;
  rule_id: string;
  inputs_snapshot: unknown;
}

function top100Of(decision: DecisionLite | null): RoutingTop100Input | null {
  const snap = decision?.inputs_snapshot;
  if (!isObj(snap) || !isObj(snap.persona) || !isObj(snap.persona.top100)) return null;
  const t = snap.persona.top100;
  return {
    eligibility: optStr(t.eligibility) ?? '',
    sequenceBlock: optStr(t.sequenceBlock),
    hubspotSequenceId: optStr(t.hubspotSequenceId),
    sequenceName: optStr(t.sequenceName),
  };
}

function targetOf(decision: DecisionLite | null): EnrollTarget {
  const snap = decision?.inputs_snapshot;
  const stored = isObj(snap) ? optStr(snap.target) : null;
  if (stored && TARGETS.has(stored)) return stored as EnrollTarget;
  return resolveEnrollTarget({ persona: { top100: top100Of(decision) } } as unknown as RoutingInputs);
}

interface VersionRow {
  id: string;
  family_id: string;
  version: number;
  status: string;
  steps: unknown;
  family?: { id: string; name: string | null; engine: string } | null;
}

const VERSION_SELECT = {
  id: true,
  family_id: true,
  version: true,
  status: true,
  steps: true,
  family: { select: { id: true, name: true, engine: true } },
} as const;

async function newestVersionOfFamily(familyId: string): Promise<VersionRow | null> {
  return prisma.sequenceVersion.findFirst({
    where: { family_id: familyId, status: { in: ['draft', 'frozen'] } },
    orderBy: { version: 'desc' },
    select: VERSION_SELECT,
  });
}

async function resolveVersion(
  hypothesis: { sequence_version_id: string | null; sequence_family_id: string | null; problem_family: string },
  target: EnrollTarget,
): Promise<VersionRow | null> {
  if (hypothesis.sequence_version_id) {
    const own = await prisma.sequenceVersion.findUnique({ where: { id: hypothesis.sequence_version_id }, select: VERSION_SELECT });
    if (own) return own;
  }
  if (hypothesis.sequence_family_id) {
    const v = await newestVersionOfFamily(hypothesis.sequence_family_id);
    if (v) return v;
  }
  const engine = ENGINE_FOR_TARGET[target];
  const families: Array<{ id: string }> = await prisma.sequenceFamily.findMany({
    where: { problem_family: hypothesis.problem_family, archived_at: null, ...(engine ? { engine } : {}) },
    orderBy: { created_at: 'desc' },
    select: { id: true },
    take: 5,
  });
  for (const f of families) {
    const v = await newestVersionOfFamily(f.id);
    if (v) return v;
  }
  return null;
}

function stepCopy(steps: Array<{ templates?: { subjectTemplate?: string | null; bodyTemplate?: string | null } | null }>, i: number) {
  const t = steps[i]?.templates ?? null;
  return { subject: t?.subjectTemplate ?? null, body: t?.bodyTemplate ?? null };
}

export default async function PreviewPage({ params }: { params: Promise<Params> }) {
  if (assertGapEnabled('GAP_MESSAGE_COMPILER_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { hypothesisId } = await params;
  const hypothesis = await getHypothesis(prisma, hypothesisId);
  if (!hypothesis) notFound();

  const persona = hypothesis.primary_persona_id
    ? await prisma.persona.findUnique({
        where: { id: hypothesis.primary_persona_id },
        select: { id: true, name: true, title: true, email: true, phone: true, linkedin_url: true, hubspot_contact_id: true },
      })
    : null;

  const account = await prisma.account.findUnique({
    where: { name: hypothesis.account_name },
    select: { hubspot_company_id: true },
  });

  const decision: DecisionLite | null = await prisma.routingDecision.findFirst({
    where: { hypothesis_id: hypothesis.id, action: 'enroll_gap_sequence' },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: { id: true, rule_id: true, inputs_snapshot: true },
  });
  const target = targetOf(decision);
  const top100 = top100Of(decision);

  const version = await resolveVersion(hypothesis, target);
  const parsed = version ? parseSteps(version.steps) : null;
  const steps = parsed && parsed.ok ? parsed.steps.steps : [];

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

  // The fully rendered, placeholder-free step-0 copy (Seller Action Center,
  // dogfood fix 2026-09-25). `renderStepCopy`'s QUEUED copy is exactly "ready
  // to send" text: markers and {{tokens}} resolved, nothing left to fill in.
  // Gated by the SAME compiler verdict (reportSteps[0]) the enroll button
  // already uses, so this never claims "ready to send" when the compiler
  // has not cleared it.
  const step0 = steps[0] as { templates?: { subjectTemplate?: string | null; bodyTemplate?: string | null } | null } | undefined;
  const renderedEmail =
    persona && step0?.templates
      ? renderStepCopy(
          { subject: step0.templates.subjectTemplate ?? '', body: step0.templates.bodyTemplate ?? '' },
          { firstName: firstNameOf(persona.name), account: hypothesis.account_name, observation: hypothesis.observation },
        )
      : null;
  const step0Verdict = reportSteps[0]?.verdict ?? 'missing';
  const emailReady = renderedEmail !== null && renderedEmail.unrendered === null && step0Verdict === 'pass';

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
              This copy has not cleared the compiler yet (see the report below for the exact failing checks). It is shown for review, not for sending.
            </p>
          ) : null}
        </section>
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
