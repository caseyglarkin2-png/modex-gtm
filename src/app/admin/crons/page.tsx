import { Activity, AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { DRIP_SEQUENCE_ENABLED, HUBSPOT_LOGGING_ENABLED, HUBSPOT_SYNC_ENABLED, INBOX_POLLING_ENABLED } from '@/lib/feature-flags';
import { KNOWN_CRONS, type CronStateValue } from '@/lib/cron-monitor';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cron Health' };

function parseCronValue(value?: string): Partial<CronStateValue> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Partial<CronStateValue>;
  } catch {
    return {};
  }
}

function parseJsonValue<T>(value?: string): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function statusBadge(status?: string) {
  switch (status) {
    case 'ok':
      return <Badge className="bg-emerald-600 text-white">Healthy</Badge>;
    case 'running':
      return <Badge className="bg-blue-600 text-white">Running</Badge>;
    case 'skipped':
      return <Badge variant="secondary">Skipped</Badge>;
    case 'error':
      return <Badge variant="destructive">Failing</Badge>;
    default:
      return <Badge variant="outline">No data</Badge>;
  }
}

function formatTime(value?: string) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

export default async function CronHealthPage() {
  const [configs, generationJobs] = await Promise.all([
    prisma.systemConfig.findMany({
      where: { key: { startsWith: 'cron:' } },
    }),
    prisma.generationJob.findMany({
      orderBy: { created_at: 'desc' },
      take: 250,
      select: {
        status: true,
        started_at: true,
        completed_at: true,
        created_at: true,
      },
    }),
  ]);

  const configMap = new Map(configs.map((entry) => [entry.key, entry.value]));
  const hubspotIngestionAudit = parseJsonValue<{
    at: string;
    pages: number;
    pulled: number;
    errors: number;
    cursorBefore: string | null;
    cursorAfter: string | null;
  }>(configMap.get('enrichment_hubspot_ingestion_audit'));

  const rows = KNOWN_CRONS.map((cron) => ({
    ...cron,
    state: parseCronValue(configMap.get(`cron:${cron.name}`)),
  }));

  const totalGenJobs = generationJobs.length;
  const completedGenJobs = generationJobs.filter((job) => job.status === 'completed').length;
  const failedGenJobs = generationJobs.filter((job) => job.status === 'failed').length;
  const inFlightGenJobs = generationJobs.filter((job) => job.status === 'pending' || job.status === 'processing').length;
  const recentCompletedDurations = generationJobs
    .filter((job) => job.status === 'completed' && job.started_at && job.completed_at)
    .map((job) => job.completed_at!.getTime() - job.started_at!.getTime())
    .filter((duration) => duration >= 0);
  const avgCompletionMs = recentCompletedDurations.length > 0
    ? Math.round(recentCompletedDurations.reduce((sum, duration) => sum + duration, 0) / recentCompletedDurations.length)
    : 0;
  const successRate = totalGenJobs > 0 ? Math.round((completedGenJobs / totalGenJobs) * 100) : 0;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Cron Health' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Health</h1>
          <p className="text-sm text-muted-foreground">
            Monitor the Vercel cron jobs that keep inbox polling, HubSpot sync, and digest delivery alive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/generation-metrics"
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <Activity className="h-3.5 w-3.5" />
            Generation Metrics
          </Link>
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Live status from `system_config`
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Feature Flags</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span>HubSpot logging</span><FlagBadge enabled={HUBSPOT_LOGGING_ENABLED} /></div>
            <div className="flex items-center justify-between"><span>HubSpot sync</span><FlagBadge enabled={HUBSPOT_SYNC_ENABLED} /></div>
            <div className="flex items-center justify-between"><span>Inbox polling</span><FlagBadge enabled={INBOX_POLLING_ENABLED} /></div>
            <div className="flex items-center justify-between"><span>Campaign drip</span><FlagBadge enabled={DRIP_SEQUENCE_ENABLED} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Healthy Jobs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rows.filter((row) => row.state.status === 'ok').length}</p>
            <p className="text-xs text-muted-foreground">of {rows.length} cron jobs last reported healthy</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Attention Needed</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{rows.filter((row) => row.state.status === 'error' || row.state.status === 'skipped').length}</p>
            <p className="text-xs text-muted-foreground">failing or skipped jobs</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Generation Success</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{successRate}%</p>
            <p className="text-xs text-muted-foreground">{completedGenJobs} completed of {totalGenJobs} sampled jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Average Completion</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgCompletionMs > 0 ? `${Math.round(avgCompletionMs / 1000)}s` : '—'}</p>
            <p className="text-xs text-muted-foreground">from jobs with start and completion timestamps</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Generation Failures</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{failedGenJobs}</p>
            <p className="text-xs text-muted-foreground">failed one-pager generation jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">In Flight</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{inFlightGenJobs}</p>
            <p className="text-xs text-muted-foreground">pending or processing generation jobs</p>
          </CardContent>
        </Card>
      </div>

      {hubspotIngestionAudit && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">HubSpot Ingestion Audit</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Last run</p>
              <p className="mt-1 font-medium">{new Date(hubspotIngestionAudit.at).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Pages / Pulled / Errors</p>
              <p className="mt-1 font-medium">
                {hubspotIngestionAudit.pages} / {hubspotIngestionAudit.pulled} / {hubspotIngestionAudit.errors}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Cursor</p>
              <p className="mt-1 font-medium">{hubspotIngestionAudit.cursorBefore ?? 'start'} → {hubspotIngestionAudit.cursorAfter ?? 'end'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{row.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{row.path} · {row.schedule}</p>
                </div>
                {statusBadge(row.state.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Last run</p>
                  <p className="mt-1 font-medium">{formatTime(row.state.lastRunAt)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Duration</p>
                  <p className="mt-1 font-medium">{row.state.lastDurationMs ? `${row.state.lastDurationMs} ms` : '—'}</p>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Last message</p>
                <p className="mt-1 text-sm">{row.state.lastMessage ?? 'No telemetry recorded yet.'}</p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <CheckCircle2 className="h-3 w-3" /> runs: {row.state.runCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <AlertTriangle className="h-3 w-3" /> consecutive failures: {row.state.consecutiveFailures ?? 0}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                  <Clock3 className="h-3 w-3" /> last success: {row.state.lastSuccessAt ? new Date(row.state.lastSuccessAt).toLocaleDateString() : '—'}
                </span>
              </div>

              {row.state.lastStats ? (
                <pre className="overflow-auto rounded-lg bg-muted/40 p-3 text-xs">{JSON.stringify(row.state.lastStats, null, 2)}</pre>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FlagBadge({ enabled }: { enabled: boolean }) {
  return enabled ? <Badge className="bg-emerald-600 text-white">On</Badge> : <Badge variant="secondary">Off</Badge>;
}
