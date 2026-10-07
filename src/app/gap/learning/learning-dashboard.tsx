'use client';

/**
 * Learning dashboard client (GAP Prospecting OS, Sprint 5).
 *
 * Fetches GET /api/gap/learning through the GAP API client and renders the
 * hypothesis funnel, problem resonance, signal yield, problem family and
 * persona performance, sequence-version comparison, and the objection
 * distribution. Opens and clicks are not shown here by design (spec:
 * "scanner-contaminated" secondary diagnostics); this page answers one
 * question only, "where is the prospecting hypothesis working or failing."
 */

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { defaultGapApiClient, type GapApiClient, type LearningReportParams, type LearningReportResponse } from '@/lib/gap/ui/gap-api-client';
import type { CrmLine, OperationsReport, OpsLine } from '@/lib/gap/health/operations';
import { type Rate } from '@/lib/gap/learning/metrics';
import { describeRate, honestRate, RELIABLE_N, type HonestRate } from '@/lib/gap/learning/stats';
import type { ExecutionBreakdownRow, ExecutionLearning, ExecutionMetrics } from '@/lib/gap/learning/execution';
import type { AgreementReport } from '@/lib/gap/routing/agreement';

/** A table cell for a legacy Rate: the percentage only at n >= RELIABLE_N, otherwise k/n marked early. */
function honestCell(r: { numerator: number; denominator: number }): string {
  const h = honestRate(r.numerator, r.denominator);
  if (h.status === 'no_data') return 'no data';
  return h.status === 'reliable' ? formatPercent(h.value) : `${h.numerator}/${h.denominator} early`;
}

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

/**
 * Red team T10: one rate as a tile. Below n = RELIABLE_N the percentage is
 * never shown (4/5 is not "80%"): the raw k/n is labeled an early
 * observation. At or above it the percentage carries its 95% Wilson interval.
 */
function HonestTile({ label, h, help }: { label: string; h: HonestRate; help?: string }) {
  const shown = h.status === 'reliable' ? formatPercent(h.value) : '—';
  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">{label}</CardTitle>
        {help ? <CardDescription>{help}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums" aria-label={`${label}: ${shown}`}>
            {shown}
          </span>
          <span className="text-sm text-[var(--muted-foreground)] tabular-nums">
            {h.numerator}/{h.denominator}
          </span>
          {h.status === 'no_data' ? (
            <Badge variant="outline">no data yet</Badge>
          ) : h.status === 'insufficient' ? (
            <Badge variant="warning">early observation, n &lt; {RELIABLE_N}</Badge>
          ) : null}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] tabular-nums">{describeRate(h)}</p>
      </CardContent>
    </Card>
  );
}

/** A legacy funnel Rate, rendered by the same honest rules. */
function RateTile({ label, r, help }: { label: string; r: { numerator: number; denominator: number }; help?: string }) {
  return <HonestTile label={label} h={honestRate(r.numerator, r.denominator)} help={help} />;
}

function BreakdownTable<K extends string, F>({
  title,
  rows,
  rateOf,
}: {
  title: string;
  rows: Array<{ key: K; funnel: F }>;
  rateOf: (funnel: F) => Rate;
}) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted-foreground)]">No data yet.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label={title}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Group</TableHead>
              <TableHead scope="col">Rate</TableHead>
              <TableHead scope="col">n</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const r = rateOf(row.funnel);
              const h = honestRate(r.numerator, r.denominator);
              return (
                <TableRow key={row.key}>
                  <TableCell>{row.key}</TableCell>
                  <TableCell className="tabular-nums">{h.status === 'reliable' ? formatPercent(h.value) : '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {h.numerator}/{h.denominator}
                    {h.status === 'insufficient' ? (
                      <Badge variant="warning" className="ml-2">
                        early, n &lt; {RELIABLE_N}
                      </Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * R-A (owner-confirmed finish requirement, 2026-09-24): campaign/program and
 * date-range filters. Answers "how did <program> perform" and "what
 * happened in this window", not a BI platform: one select, two date
 * inputs, applied on change (no separate Apply step to keep this small).
 */
function FilterBar({
  programs,
  value,
  onChange,
}: {
  programs: string[];
  value: LearningReportParams;
  onChange: (next: LearningReportParams) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4" aria-label="Learning report filters">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted-foreground)]">Campaign</span>
        <select
          aria-label="Campaign"
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
          value={value.program ?? ''}
          onChange={(e) => onChange({ ...value, program: e.target.value || null })}
        >
          <option value="">All campaigns</option>
          {programs.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted-foreground)]">From</span>
        <input
          aria-label="From date"
          type="date"
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || null })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted-foreground)]">To</span>
        <input
          aria-label="To date"
          type="date"
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-sm"
          value={value.to ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || null })}
        />
      </label>
      {value.program || value.from || value.to ? (
        <button
          type="button"
          className="text-sm text-[var(--muted-foreground)] underline"
          onClick={() => onChange({ program: null, from: null, to: null })}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

/** R-B / red team T10: agreement as an honest tile, with what it is NOT counted from. */
function AgreementRateTile({ label, rate }: { label: string; rate: { agreements: number; n: number; unverified: number; unacted: number } }) {
  return (
    <div className="space-y-1">
      <HonestTile label={label} h={honestRate(rate.agreements, rate.n)} help="Seller conformity with the router, not sales quality" />
      <p className="text-xs text-[var(--muted-foreground)]">
        Counted against agreement: {rate.unverified} &quot;emailed&quot; with no send on record, {rate.unacted} cards expired or superseded with no action.
      </p>
    </div>
  );
}

const EXECUTION_TILES: Array<{ key: 'replyPerSend' | 'meetingPerSend' | 'truthYield' | 'problemAckPerSend' | 'rootCausePerSend'; label: string; help: string }> = [
  { key: 'replyPerSend', label: 'Reply / send', help: 'People who replied after their first send / people sent to' },
  { key: 'meetingPerSend', label: 'Meeting / send', help: 'People with a confirmed meeting / people sent to' },
  { key: 'truthYield', label: 'Truth yield', help: 'People whose hypothesis reached a human verdict / people sent to' },
  { key: 'problemAckPerSend', label: 'Problem acknowledged / send', help: 'Confirmed or partly confirmed problem / people sent to' },
  { key: 'rootCausePerSend', label: 'Root cause / send', help: 'Confirmed root cause on the sent hypothesis / people sent to' },
];

function AttributionTable({ title, rows }: { title: string; rows: ExecutionBreakdownRow[] }) {
  return (
    <BreakdownTable
      title={title}
      rows={rows.map((r) => ({ key: r.key, funnel: r.metrics }))}
      rateOf={(m) => ({ value: m.replyPerSend.value, n: m.replyPerSend.n, numerator: m.replyPerSend.numerator, denominator: m.replyPerSend.denominator })}
    />
  );
}

/**
 * Red team T10: the primary metrics. The denominator is people actually sent
 * to (the send ledger); each person is attributed to their first send.
 */
function ExecutionSection({ execution }: { execution: ExecutionLearning }) {
  const o = execution.overall;
  return (
    <section aria-labelledby="execution-heading" className="space-y-3">
      <h2 id="execution-heading" className="text-lg font-semibold">
        What happened after we sent
      </h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        {o.peopleContacted} {o.peopleContacted === 1 ? 'person' : 'people'} sent to ({o.sends} {o.sends === 1 ? 'send' : 'sends'}); {o.peopleMatured} past the{' '}
        {execution.windowDays}-day outcome window. Every rate below is per person sent to whose window has closed, counting only what they did within
        it, tied to our own send; below n = {RELIABLE_N} a number is an early observation, not a rate.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {EXECUTION_TILES.map((t) => (
          <HonestTile key={t.key} label={t.label} h={o[t.key]} help={t.help} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AttributionTable title="Reply / send by sequence version (first send)" rows={execution.bySequenceVersion} />
        <AttributionTable title="Reply / send by copy version (first send)" rows={execution.byCopyVersion} />
        <AttributionTable title="Reply / send by sender" rows={execution.bySender} />
        <AttributionTable title="Reply / send by engine" rows={execution.byEngine} />
        <AttributionTable title="Reply / send by evidence tier at send" rows={execution.byEvidenceTier} />
      </div>
    </section>
  );
}

/**
 * R-B (owner-confirmed finish requirement, 2026-09-24): routing
 * recommendation vs actual human action, the gate G1 evaluator's data
 * source before any routing rule earns canary eligibility. Loads
 * independently of the learning report (a different table, a different
 * question) so a slow or failed agreement fetch never blocks the funnel.
 */
function RoutingAgreementSection({ client }: { client: GapApiClient }) {
  const [report, setReport] = useState<AgreementReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await client.getRoutingAgreement();
      if (cancelled) return;
      if (result.ok) setReport(result.data);
      else setError(result.error);
    })();
    return () => {
      cancelled = true;
    };
  }, [client]);

  return (
    <section aria-labelledby="agreement-heading" className="space-y-3">
      <h2 id="agreement-heading" className="text-lg font-semibold">
        Routing vs what was actually done (conformity, not sales quality)
      </h2>
      {error ? (
        <p className="text-sm text-[var(--destructive)]" role="alert">
          Could not load the agreement report: {error}
        </p>
      ) : !report ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AgreementRateTile label="Overall agreement" rate={report.overall} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BreakdownTable
              title="By rule"
              rows={report.byRuleId.map((r) => ({ key: r.key, funnel: r.rate }))}
              rateOf={(rate) => ({ value: rate.rate, n: rate.n, numerator: rate.agreements, denominator: rate.n })}
            />
            <BreakdownTable
              title="By recommended action"
              rows={report.byAction.map((r) => ({ key: r.key, funnel: r.rate }))}
              rateOf={(rate) => ({ value: rate.rate, n: rate.n, numerator: rate.agreements, denominator: rate.n })}
            />
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {report.totalDecisions} routing decisions total; {report.overall.n} counted; {report.pending} still open with no action. An email counts as done only
            when the send is on record. Agreement alone never unlocks automation.
          </p>
        </>
      )}
    </section>
  );
}

const CRM_KIND_WORDS: Record<string, string> = { note: 'a note', task: 'a task', task_complete: 'a task completion', deal_property: 'the next step' };
const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' });

function OpsLines({ lines, testid }: { lines: readonly OpsLine[]; testid: string }) {
  return (
    <ul className="space-y-1 text-sm">
      {lines.map((l) => (
        <li key={l.key} data-testid={testid} data-key={l.key}>
          {l.href ? <a className="underline" href={l.href}>{l.label}</a> : l.label}
        </li>
      ))}
    </ul>
  );
}

function CrmList({ title, lines, testid }: { title: string; lines: readonly CrmLine[]; testid: string }) {
  if (!lines.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{title}</p>
      <ul className="space-y-1 text-sm">
        {lines.map((c) => (
          <li key={c.proposalId} data-testid={testid}>
            {c.accountName}: {CRM_KIND_WORDS[c.kind] ?? 'a change'} on {c.dealName ?? 'a deal with no name in HubSpot'}, {c.owner}, since {dayOf(c.since)}.{' '}
            <a className="underline" href={c.href}>{c.action}</a>
            {c.detail ? <span className="block text-xs text-[var(--muted-foreground)]">{c.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * R65: Casey sees decisions. What waits on him (theses to review, HubSpot changes to approve or retry, overdue
 * obligations), what happened over the week, his own corrections, and research freshness and cost. The operator's
 * failures (broken handoffs, the dead letter, the queue) are in the health check, not here.
 */
function OperationsSection({ ops }: { ops: OperationsReport }) {
  return (
    <section aria-labelledby="decisions-heading" className="space-y-3" data-testid="ops-decisions-section">
      <h2 id="decisions-heading" className="text-lg font-semibold">
        Your decisions and what happened
      </h2>
      <Card>
        <CardContent className="space-y-4 pt-4">
          <OpsLines lines={ops.decisions} testid="ops-decision" />
          <CrmList title="HubSpot changes waiting for your approval" lines={ops.crm.pendingApproval} testid="ops-crm-pending" />
          <CrmList title="Approved, not written" lines={ops.crm.approvedNotWritten} testid="ops-crm-off" />
          <CrmList title="Failed or in conflict" lines={ops.crm.failed} testid="ops-crm-failed" />
          <OpsLines lines={ops.outcomes} testid="ops-outcome" />
          <OpsLines lines={ops.research} testid="ops-research" />
        </CardContent>
      </Card>
    </section>
  );
}

export function LearningDashboard({ client = defaultGapApiClient }: { client?: GapApiClient }) {
  const [report, setReport] = useState<LearningReportResponse | null>(null);
  const [programs, setPrograms] = useState<string[]>([]);
  const [filters, setFilters] = useState<LearningReportParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (params: LearningReportParams) => {
    setLoading(true);
    setError(null);
    const result = await client.getLearningReport(params);
    if (result.ok) {
      setReport(result.data);
      setPrograms(result.data.programs ?? []);
    } else {
      setError(result.error);
      setReport(null);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void load(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, filters.program, filters.from, filters.to]);

  if (loading && !report) return <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>;
  if (error) return <p className="text-sm text-[var(--destructive)]" role="alert">Could not load the learning report: {error}</p>;
  if (!report) return null;

  const f = report.funnel;

  return (
    <div className="space-y-8">
      <FilterBar programs={programs} value={filters} onChange={setFilters} />
      {report.operations ? <OperationsSection ops={report.operations} /> : null}
      {report.execution ? (
        <ExecutionSection execution={report.execution} />
      ) : report.executionError ? (
        <p className="text-sm text-[var(--destructive)]" role="alert">
          Could not load what happened after we sent: {report.executionError}
        </p>
      ) : null}
      <section aria-labelledby="hypothesis-funnel-heading" className="space-y-3">
        <h2 id="hypothesis-funnel-heading" className="text-lg font-semibold">
          Thesis funnel
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RateTile label="Resolution rate" r={f.resolutionRate} help="Resolved / hypotheses with substantive buyer interaction" />
          <RateTile label="Precision" r={f.precision} help="Confirmed + partial / resolved" />
          <RateTile label="Precision, confirmed" r={f.precisionConfirmed} help="Confirmed only / resolved" />
          <RateTile label="Precision, partial" r={f.precisionPartial} help="Partially confirmed only / resolved" />
        </div>
      </section>

      <section aria-labelledby="problem-resonance-heading" className="space-y-3">
        <h2 id="problem-resonance-heading" className="text-lg font-semibold">
          Problem resonance
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RateTile label="Problem resonance" r={f.problemResonanceRate} help="Problem confirmed or partial / substantive conversations" />
          <RateTile label="Root cause confirmed" r={f.rootCauseConfirmationRate} help="Confirmed anywhere on the hypothesis / problem-confirming conversations" />
          <RateTile label="Impact acknowledged" r={f.impactAcknowledgmentRate} help="Confirmed anywhere on the hypothesis / problem-confirming conversations" />
          <RateTile label="Impact quantified" r={f.impactQuantificationRate} help="Confirmed anywhere on the hypothesis / problem-confirming conversations" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RateTile label="Problem to meeting" r={f.problemToMeetingRate} help="Meetings accepted / problem-confirming hypotheses" />
          <RateTile label="Meeting to qualified problem" r={f.meetingToQualifiedProblemRate} help="/ meetings held" />
        </div>
      </section>

      <section aria-labelledby="signal-yield-heading" className="space-y-3">
        <h2 id="signal-yield-heading" className="text-lg font-semibold">
          Signal yield
        </h2>
        <Card>
          <CardContent className="pt-6">
            {report.signalYield.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No signals registered yet.</p>
            ) : (
              <Table aria-label="Signal yield by type">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Signal type</TableHead>
                    <TableHead scope="col">Signals</TableHead>
                    <TableHead scope="col">Became a hypothesis</TableHead>
                    <TableHead scope="col">Yield</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.signalYield.map((row) => (
                    <TableRow key={row.signalType}>
                      <TableCell>{row.signalType}</TableCell>
                      <TableCell className="tabular-nums">{row.signalCount}</TableCell>
                      <TableCell className="tabular-nums">{row.hypothesisCount}</TableCell>
                      <TableCell className="tabular-nums">{honestCell(row.rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="performance-heading" className="space-y-3">
        <h2 id="performance-heading" className="text-lg font-semibold">
          Problem family and persona performance
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownTable title="By problem family" rows={report.byProblemFamily} rateOf={(fn) => fn.resolutionRate} />
          <BreakdownTable title="By persona" rows={report.byPersona} rateOf={(fn) => fn.resolutionRate} />
        </div>
      </section>

      <section aria-labelledby="sequence-heading" className="space-y-3">
        <h2 id="sequence-heading" className="text-lg font-semibold">
          Sequence-version comparison
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownTable title="By sequence version" rows={report.bySequenceVersion} rateOf={(fn) => fn.problemResonanceRate} />
          <BreakdownTable title="By sequence family" rows={report.bySequenceFamily} rateOf={(fn) => fn.problemResonanceRate} />
        </div>
      </section>

      <section aria-labelledby="objection-heading" className="space-y-3">
        <h2 id="objection-heading" className="text-lg font-semibold">
          Objection and disposition distribution
        </h2>
        <Card>
          <CardContent className="pt-6">
            {report.dispositionDistribution.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No confirmed conversations yet.</p>
            ) : (
              <Table aria-label="Disposition distribution">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Response class</TableHead>
                    <TableHead scope="col">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.dispositionDistribution.map((row) => (
                    <TableRow key={row.responseClass}>
                      <TableCell>{row.responseClass}</TableCell>
                      <TableCell className="tabular-nums">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="secondary-heading" className="space-y-3">
        <h2 id="secondary-heading" className="text-lg font-semibold">
          Secondary diagnostics
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BreakdownTable title="By TAM tier" rows={report.byTamTier} rateOf={(fn) => fn.resolutionRate} />
          <BreakdownTable title="By channel" rows={report.byChannel} rateOf={(fn) => fn.problemResonanceRate} />
          <BreakdownTable title="By sender" rows={report.bySender} rateOf={(fn) => fn.problemResonanceRate} />
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          {report.counts.hypotheses} hypotheses, {report.counts.conversations} confirmed conversations in this report.
        </p>
      </section>

      <RoutingAgreementSection client={client} />
    </div>
  );
}
