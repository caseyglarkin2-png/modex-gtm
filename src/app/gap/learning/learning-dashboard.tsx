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
import { defaultGapApiClient, type GapApiClient } from '@/lib/gap/ui/gap-api-client';
import { isLowSample, type Rate } from '@/lib/gap/learning/metrics';
import type { LearningReport } from '@/lib/gap/learning/query';

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

/** One rate as a tile: the percentage, its fraction, and a low-sample flag that never hides the number. */
function RateTile({ label, r, help }: { label: string; r: { value: number | null; n: number; numerator: number; denominator: number }; help?: string }) {
  const insufficient = r.denominator === 0;
  return (
    <Card>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">{label}</CardTitle>
        {help ? <CardDescription>{help}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums" aria-label={`${label}: ${formatPercent(r.value)}`}>
          {formatPercent(r.value)}
        </span>
        <span className="text-sm text-[var(--muted-foreground)] tabular-nums">
          {r.numerator}/{r.denominator}
        </span>
        {insufficient ? (
          <Badge variant="outline">insufficient data</Badge>
        ) : isLowSample(r) ? (
          <Badge variant="warning">low sample, n={r.n}</Badge>
        ) : null}
      </CardContent>
    </Card>
  );
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
              return (
                <TableRow key={row.key}>
                  <TableCell>{row.key}</TableCell>
                  <TableCell className="tabular-nums">{formatPercent(r.value)}</TableCell>
                  <TableCell className="tabular-nums">
                    {r.n}
                    {isLowSample(r) ? (
                      <Badge variant="warning" className="ml-2">
                        low sample
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

export function LearningDashboard({ client = defaultGapApiClient }: { client?: GapApiClient }) {
  const [report, setReport] = useState<LearningReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await client.getLearningReport();
    if (result.ok) {
      setReport(result.data);
    } else {
      setError(result.error);
      setReport(null);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>;
  if (error) return <p className="text-sm text-[var(--destructive)]" role="alert">Could not load the learning report: {error}</p>;
  if (!report) return null;

  const f = report.funnel;

  return (
    <div className="space-y-8">
      <section aria-labelledby="hypothesis-funnel-heading" className="space-y-3">
        <h2 id="hypothesis-funnel-heading" className="text-lg font-semibold">
          Hypothesis funnel
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
          <RateTile label="Root cause confirmed" r={f.rootCauseConfirmationRate} help="/ problem-confirming conversations" />
          <RateTile label="Impact acknowledged" r={f.impactAcknowledgmentRate} help="/ problem-confirming conversations" />
          <RateTile label="Impact quantified" r={f.impactQuantificationRate} help="/ problem-confirming conversations" />
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
                      <TableCell className="tabular-nums">{formatPercent(row.rate.value)}</TableCell>
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
    </div>
  );
}
