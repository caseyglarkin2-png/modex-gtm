/**
 * /gap/preview/[hypothesisId] (Sprint 3 S3-T12; demoted 2026-09-26).
 *
 * The shareable DEEP LINK and DIAGNOSTIC view of one action pack. Normal
 * selling never needs it: READY and FOLLOW UP cards open the same
 * <ActionPackView> inline on /gap. This page adds only what a diagnosis
 * needs: target, version, the per-step compile report, the template compile
 * rows (shown apart, never a gate input) and the shadow enroll row.
 *
 * Gate: GAP_MESSAGE_COMPILER_ENABLED (off means 404); auth() is a second lock.
 *
 * Compile rows (R3-5): the report and the enroll button read rows compiled
 * for THIS hypothesis on the resolved version (`hypothesisCompileWhere`).
 * Template-level rows are a second query under their own "template compile
 * (shadow only)" heading; they never feed `compileIds` or the cleared state.
 *
 * Never rendered: `inputs_snapshot`, `critic` payloads, `last_intent_source`
 * or any other private intent field.
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertGapEnabled } from '@/lib/gap/flags';
import { isApproved } from '@/lib/gap/compiler/approval';
import { hypothesisCompileWhere, templateCompileWhere } from '@/lib/gap/compiler/preview-rows';
import { hubspotCompanyUrl, hubspotContactUrl, mailtoHref, telHref } from '@/lib/gap/routing/seller-action';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { ActionPackView, resolveActionPack } from '@/components/gap/action-pack-view';
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
export const metadata = { title: 'Action pack' };

type Params = { hypothesisId: string };
type Search = { personaId?: string; decisionId?: string };

function stepCopy(steps: Array<{ templates?: { subjectTemplate?: string | null; bodyTemplate?: string | null } | null }>, i: number) {
  const t = steps[i]?.templates ?? null;
  return { subject: t?.subjectTemplate ?? null, body: t?.bodyTemplate ?? null };
}

const RECOMMENDS: Record<string, string> = {
  enroll_gap_sequence: 'EMAIL',
  one_off_email: 'EMAIL',
  call_now: 'CALL',
  linkedin_manual_task: 'LINKEDIN',
  research_required: 'RESEARCH',
  approve_hypothesis: 'REVIEW',
  nurture: 'WAIT',
  do_not_contact: 'DO NOT CONTACT',
};

export default async function PreviewPage({ params, searchParams }: { params: Promise<Params>; searchParams?: Promise<Search> }) {
  if (assertGapEnabled('GAP_MESSAGE_COMPILER_ENABLED')) notFound();

  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { hypothesisId } = await params;
  const search = (await searchParams) ?? {};
  const target = {
    hypothesisId,
    personaId: search.personaId && /^\d+$/.test(search.personaId) ? Number(search.personaId) : null,
    decisionId: search.decisionId?.trim() || null,
  };
  const { pack } = await resolveActionPack(target);
  if (!pack) notFound();
  const { hypothesis, persona, decision, target: enrollTarget, top100, version, steps } = pack;

  const account = await prisma.account.findUnique({ where: { name: hypothesis.account_name }, select: { hubspot_company_id: true } });

  let reportSteps: CompileReportStep[] = [];
  let templateSteps: CompileReportStep[] = [];
  let compileIds: string[] = [];
  if (version && steps.length > 0) {
    const select = { id: true, step_index: true, verdict: true, checks: true, word_count: true, cta_family: true, created_at: true };
    const rows: CompileRowLike[] = await prisma.gapCompile.findMany({ where: hypothesisCompileWhere(version.id, hypothesis.id), orderBy: { created_at: 'desc' }, select });
    const newest = newestPerStep(rows, steps.length);
    reportSteps = await Promise.all(
      newest.map(async (row, i) => {
        let approval: ReportApproval | null = null;
        if (row && row.verdict === 'review_required') approval = await isApproved(prisma, row.id);
        return toReportStep(i, row, stepCopy(steps, i), approval);
      }),
    );
    compileIds = newest.filter((r): r is CompileRowLike => r !== null).map((r) => r.id);
    const templateRows: CompileRowLike[] = await prisma.gapCompile.findMany({ where: templateCompileWhere(version.id), orderBy: { created_at: 'desc' }, select });
    if (templateRows.length > 0) {
      templateSteps = newestPerStep(templateRows, steps.length).map((row, i) => toReportStep(i, row, stepCopy(steps, i), null));
    }
  }
  const cleared = allStepsCleared(reportSteps);
  const recommends = decision ? RECOMMENDS[decision.action] ?? null : null;
  const mailto = persona?.email ? mailtoHref(persona.email) : null;
  const tel = persona?.phone ? telHref(persona.phone) : null;
  const contactUrl = persona?.hubspot_contact_id ? hubspotContactUrl(persona.hubspot_contact_id) : null;
  const companyUrl = account?.hubspot_company_id ? hubspotCompanyUrl(account.hubspot_company_id) : null;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'GAP', href: '/gap' }, { label: hypothesis.account_name }]} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{hypothesis.account_name}</h1>
          <p className="mt-1 text-sm" data-testid="pack-person">
            {persona ? (
              <>
                <span className="font-medium">{persona.name}</span>
                {persona.title ? <span className="text-[var(--muted-foreground)]">, {persona.title}</span> : null}
              </>
            ) : (
              <span className="italic text-[var(--muted-foreground)]">no person on this card</span>
            )}
          </p>
        </div>
        {recommends ? (
          <Badge data-testid="gap-recommends" variant="outline" className="text-xs">GAP recommends: {recommends}</Badge>
        ) : null}
      </div>

      <ActionPackView target={target} />

      <details className="rounded-md border border-[var(--border)] p-3" data-testid="system-details">
        <summary className="cursor-pointer text-sm font-medium">System details</summary>
        <div className="mt-3 space-y-4 text-sm">
          {persona ? (
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
          ) : null}
          <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Target</p>
          <p className="mt-1">
            <Badge variant="outline" data-target={enrollTarget}>
              {enrollTarget.replace(/_/g, ' ')}
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
      </details>
    </div>
  );
}
