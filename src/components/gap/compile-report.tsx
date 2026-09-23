/**
 * Compile report (GAP Prospecting OS, Sprint 3, S3-T12). Spec section 8.
 *
 * One card per sequence step: the copy the compiler judged (subject, body,
 * word count, CTA family), a per-check table (code, pass / review / reject,
 * detail) and the step's verdict chip. The overall chip at the top is the
 * strictest step: any reject rejects, any unapproved review needs review,
 * a missing compile is "not compiled", else pass.
 *
 * What this file will NOT render: `inputs_snapshot`, `critic` raw payloads,
 * or any private intent field. `toReportStep` picks the row fields by name
 * so a raw GapCompile row (which carries the snapshot) can never leak into
 * the DOM through a spread. The test pins that.
 *
 * Server-safe: no hooks, no client directive, so the preview page can
 * render it on the server and the shadow button stays its own island.
 */

import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type ReportVerdict = 'pass' | 'review_required' | 'reject' | 'missing';

export interface ReportCheck {
  code: string;
  passed: boolean;
  severity: 'reject' | 'review';
  detail: string;
}

export interface ReportApproval {
  approved: boolean;
  status: string | null;
  requestId: string | null;
}

export interface CompileReportStep {
  stepIndex: number;
  compileId: string | null;
  verdict: ReportVerdict;
  subject: string | null;
  body: string | null;
  wordCount: number | null;
  ctaFamily: string | null;
  checks: ReportCheck[];
  /** Present when the verdict is review_required: what the approval queue says. */
  approval: ReportApproval | null;
  compiledAt: string | null;
}

/** The GapCompile columns this report reads. Nothing else is looked at. */
export interface CompileRowLike {
  id: string;
  step_index: number | null;
  verdict: string;
  checks: unknown;
  word_count: number | null;
  cta_family: string | null;
  created_at: Date | string;
}

// ---------------------------------------------------------------------------
// Pure mapping
// ---------------------------------------------------------------------------

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function readChecks(raw: unknown): ReportCheck[] {
  if (!Array.isArray(raw)) return [];
  const out: ReportCheck[] = [];
  for (const item of raw) {
    if (!isObj(item) || typeof item.code !== 'string') continue;
    out.push({
      code: item.code,
      passed: item.passed === true,
      severity: item.severity === 'review' ? 'review' : 'reject',
      detail: typeof item.detail === 'string' ? item.detail : '',
    });
  }
  return out;
}

function verdictOf(raw: string): ReportVerdict {
  return raw === 'pass' || raw === 'review_required' || raw === 'reject' ? raw : 'missing';
}

/**
 * One step of the report from its newest compile row (or none), the step's
 * copy from the version, and the approval state when the row needs review.
 * Field-by-field on purpose: never spread a row into the result.
 */
export function toReportStep(
  stepIndex: number,
  row: CompileRowLike | null,
  copy: { subject: string | null; body: string | null } | null,
  approval: ReportApproval | null,
): CompileReportStep {
  if (!row) {
    return {
      stepIndex,
      compileId: null,
      verdict: 'missing',
      subject: copy?.subject ?? null,
      body: copy?.body ?? null,
      wordCount: null,
      ctaFamily: null,
      checks: [],
      approval: null,
      compiledAt: null,
    };
  }
  const created = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  return {
    stepIndex,
    compileId: row.id,
    verdict: verdictOf(row.verdict),
    subject: copy?.subject ?? null,
    body: copy?.body ?? null,
    wordCount: typeof row.word_count === 'number' ? row.word_count : null,
    ctaFamily: row.cta_family ?? null,
    checks: readChecks(row.checks),
    approval: row.verdict === 'review_required' ? approval : null,
    compiledAt: Number.isNaN(created.getTime()) ? null : created.toISOString(),
  };
}

/** Newest row per step index among `rows`, for steps 0..stepCount-1. */
export function newestPerStep(rows: readonly CompileRowLike[], stepCount: number): Array<CompileRowLike | null> {
  const out: Array<CompileRowLike | null> = [];
  for (let i = 0; i < stepCount; i += 1) {
    const forStep = rows
      .filter((r) => r.step_index === i)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    out.push(forStep[0] ?? null);
  }
  return out;
}

/** A step counts as cleared when it passed, or needs review and the queue approved it. */
export function stepCleared(step: CompileReportStep): boolean {
  if (step.verdict === 'pass') return true;
  return step.verdict === 'review_required' && step.approval?.approved === true;
}

export function overallVerdict(steps: readonly CompileReportStep[]): ReportVerdict {
  if (steps.length === 0) return 'missing';
  if (steps.some((s) => s.verdict === 'reject')) return 'reject';
  if (steps.some((s) => s.verdict === 'missing')) return 'missing';
  if (steps.some((s) => s.verdict === 'review_required' && !stepCleared(s))) return 'review_required';
  return 'pass';
}

export function allStepsCleared(steps: readonly CompileReportStep[]): boolean {
  return steps.length > 0 && steps.every(stepCleared);
}

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

const VERDICT_LABEL: Record<ReportVerdict, string> = {
  pass: 'pass',
  review_required: 'review required',
  reject: 'reject',
  missing: 'not compiled',
};

const VERDICT_VARIANT: Record<ReportVerdict, NonNullable<BadgeProps['variant']>> = {
  pass: 'success',
  review_required: 'warning',
  reject: 'destructive',
  missing: 'outline',
};

export function VerdictChip({ verdict, label }: { verdict: ReportVerdict; label?: string }) {
  return (
    <Badge variant={VERDICT_VARIANT[verdict]} data-verdict={verdict}>
      {label ?? VERDICT_LABEL[verdict]}
    </Badge>
  );
}

function checkOutcome(check: ReportCheck): { label: string; variant: NonNullable<BadgeProps['variant']> } {
  if (check.passed) return { label: 'pass', variant: 'success' };
  return check.severity === 'review' ? { label: 'review', variant: 'warning' } : { label: 'reject', variant: 'destructive' };
}

function ApprovalLine({ approval }: { approval: ReportApproval | null }) {
  if (!approval) return null;
  const status = approval.status ?? 'not requested';
  return (
    <p className="mt-2 text-xs text-[var(--muted-foreground)]" data-testid="approval-state">
      Approval: <span className="font-medium text-[var(--foreground)]">{approval.approved ? 'approved' : status}</span>
      {approval.requestId ? <span> ({approval.requestId})</span> : null}
    </p>
  );
}

function StepCard({ step }: { step: CompileReportStep }) {
  return (
    <section
      className="rounded-md border border-[var(--border)] p-4"
      data-testid={`compile-step-${step.stepIndex}`}
      data-verdict={step.verdict}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Step {step.stepIndex}</h3>
        <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {step.wordCount !== null ? <span>{step.wordCount} words</span> : null}
          {step.ctaFamily ? <span>CTA: {step.ctaFamily}</span> : null}
          <VerdictChip verdict={step.verdict} />
        </div>
      </header>

      <div className="mt-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Subject</p>
        <p className="mt-1">{step.subject ?? <span className="italic text-[var(--muted-foreground)]">no subject</span>}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">Body</p>
        <pre className="mt-1 whitespace-pre-wrap font-sans text-sm">
          {step.body ?? <span className="italic text-[var(--muted-foreground)]">no body</span>}
        </pre>
      </div>

      <ApprovalLine approval={step.approval} />

      {step.checks.length > 0 ? (
        <Table className="mt-3">
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Check</TableHead>
              <TableHead className="w-24">Outcome</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {step.checks.map((check) => {
              const outcome = checkOutcome(check);
              return (
                <TableRow key={check.code} data-check={check.code}>
                  <TableCell className="font-mono text-xs">{check.code}</TableCell>
                  <TableCell>
                    <Badge variant={outcome.variant}>{outcome.label}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[var(--muted-foreground)]">{check.detail}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="mt-3 text-xs italic text-[var(--muted-foreground)]">
          {step.verdict === 'missing' ? 'This step has not been compiled.' : 'No check results recorded.'}
        </p>
      )}
    </section>
  );
}

export interface CompileReportProps {
  steps: readonly CompileReportStep[];
}

export function CompileReport({ steps }: CompileReportProps) {
  const overall = overallVerdict(steps);
  return (
    <div className="space-y-4" data-testid="compile-report">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Overall</span>
        <VerdictChip verdict={overall} />
      </div>
      {steps.length === 0 ? (
        <p className="text-sm italic text-[var(--muted-foreground)]">No steps to report.</p>
      ) : (
        steps.map((step) => <StepCard key={step.stepIndex} step={step} />)
      )}
    </div>
  );
}
