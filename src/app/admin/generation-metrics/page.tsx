import Link from 'next/link';
import { Activity, AlertTriangle, ExternalLink } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/prisma';
import { computeGenerationMetrics } from '@/lib/admin/generation-metrics';
import { computeSendJobMetrics } from '@/lib/admin/send-job-metrics';
import { computeStuckJobs } from '@/lib/admin/stuck-jobs';
import { requireAdminPage } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generation Metrics' };

export default async function GenerationMetricsPage() {
  await requireAdminPage();
  const [jobs, sendJobs, sendJobRecipients] = await Promise.all([
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
        take: 500,
        select: {
          id: true,
          status: true,
          provider_used: true,
          started_at: true,
        completed_at: true,
        created_at: true,
        error_message: true,
        account_name: true,
        updated_at: true,
      },
    }),
    prisma.sendJob.findMany({
      orderBy: { created_at: 'desc' },
        take: 250,
        select: {
          id: true,
          status: true,
          created_at: true,
          started_at: true,
          completed_at: true,
          total_recipients: true,
          sent_count: true,
          failed_count: true,
          skipped_count: true,
          updated_at: true,
        },
      }),
    prisma.sendJobRecipient.findMany({
      orderBy: { created_at: 'desc' },
      take: 500,
      select: {
        account_name: true,
        to_email: true,
        status: true,
        error_message: true,
        created_at: true,
      },
    }),
  ]);

  const metrics = computeGenerationMetrics(jobs);
  const sendMetrics = computeSendJobMetrics(sendJobs, sendJobRecipients);

  const recentFailures = jobs
    .filter((job) => job.status === 'failed')
    .slice(0, 8);

  const stuckJobs = computeStuckJobs({
    generationJobs: jobs,
    sendJobs,
  }).slice(0, 8);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Admin', href: '/admin/crons' }, { label: 'Generation Metrics' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Generation Metrics</h1>
          <p className="text-sm text-muted-foreground">Operational visibility for queued generation performance and failures.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ops?tab=generation-metrics" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            <Activity className="h-3.5 w-3.5" />
            Ops Generation Metrics
          </Link>
          <Link href="/admin/crons" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            <Activity className="h-3.5 w-3.5" />
            Cron Health
          </Link>
          <Link href="/queue/generations" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            <ExternalLink className="h-3.5 w-3.5" />
            Generation Queue
          </Link>
          <Link href="/generated-content" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
            <ExternalLink className="h-3.5 w-3.5" />
            Generated Content
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Total Jobs" value={metrics.total.toString()} tone="text-foreground" />
        <MetricCard label="Success Rate" value={`${metrics.successRatePct}%`} tone={metrics.successRatePct >= 90 ? 'text-emerald-600' : 'text-amber-600'} />
        <MetricCard label="Avg Duration" value={metrics.avgDurationSeconds > 0 ? `${metrics.avgDurationSeconds}s` : '—'} tone="text-foreground" />
        <MetricCard label="P95 Duration" value={metrics.p95DurationSeconds > 0 ? `${metrics.p95DurationSeconds}s` : '—'} tone="text-foreground" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Send Jobs" value={sendMetrics.totalJobs.toString()} tone="text-foreground" />
        <MetricCard label="Recipients Sent" value={sendMetrics.sentRecipients.toString()} tone="text-emerald-600" />
        <MetricCard label="Recipients Failed" value={sendMetrics.failedRecipients.toString()} tone={sendMetrics.failedRecipients > 0 ? 'text-red-600' : 'text-foreground'} />
        <MetricCard label="Avg Send Duration" value={sendMetrics.avgCompletionSeconds > 0 ? `${sendMetrics.avgCompletionSeconds}s` : '—'} tone="text-foreground" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.providerBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No provider data yet.</p>
            ) : (
              metrics.providerBreakdown.map((row) => (
                <div key={row.provider} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="capitalize">{row.provider}</span>
                  <Badge variant="outline">{row.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Queue State</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <StateCard label="Pending" value={metrics.pending} />
            <StateCard label="Processing" value={metrics.processing} />
            <StateCard label="Failed" value={metrics.failed} tone="text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Send Job State</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <StateCard label="Pending" value={sendMetrics.pendingJobs} />
            <StateCard label="Processing" value={sendMetrics.processingJobs} />
            <StateCard label="Completed" value={sendMetrics.completedJobs} tone="text-emerald-600" />
            <StateCard label="Partial" value={sendMetrics.partialJobs} tone="text-amber-600" />
            <StateCard label="Failed" value={sendMetrics.failedJobs} tone="text-red-600" />
            <StateCard label="Skipped" value={sendMetrics.skippedRecipients} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Failures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentFailures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent failed jobs.</p>
            ) : (
              recentFailures.map((job, idx) => (
                <div key={`${job.account_name}-${idx}`} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900">{job.account_name}</p>
                  <p className="mt-1 text-xs text-red-700">{(job.error_message ?? 'Unknown error').slice(0, 200)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Potentially Stuck Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stuckJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No processing jobs older than 15 minutes.</p>
            ) : (
              stuckJobs.map((job) => (
                <div key={`${job.kind}-${job.id}`} className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div>
                    <p className="font-medium text-amber-900">{job.label}</p>
                    <p className="text-xs text-amber-700">
                      {job.kind} job • {job.ageMinutes}m old • Updated {job.updatedAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>{job.recommendedAction}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Send Failures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sendMetrics.recentFailedRecipients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent failed send recipients.</p>
            ) : (
              sendMetrics.recentFailedRecipients.map((recipient, index) => (
                <div key={`${recipient.accountName}-${recipient.toEmail}-${index}`} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-900">{recipient.accountName} • {recipient.toEmail}</p>
                  <p className="mt-1 text-xs text-red-700">{recipient.error.slice(0, 220)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StateCard({ label, value, tone = 'text-foreground' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
