import Link from 'next/link';
import { Activity, BarChart3, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { opsWorkspaceTabs, parseOpsTab, type OpsTabId } from '@/lib/ops-workspace';
import { getLatestProofSummaryFromLedger } from '@/lib/proof-ledger';
import { DRIP_SEQUENCE_ENABLED, HUBSPOT_LOGGING_ENABLED, HUBSPOT_SYNC_ENABLED, INBOX_POLLING_ENABLED } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';
import { computeGenerationMetrics } from '@/lib/admin/generation-metrics';
import { computeSendJobMetrics } from '@/lib/admin/send-job-metrics';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ops' };

type SearchParams = {
  tab?: string;
};

const tabHeading: Record<OpsTabId, string> = {
  'proof-ledger': 'Proof Ledger',
  'cron-health': 'Cron Health',
  'generation-metrics': 'Generation Metrics',
  'provider-health': 'Provider Health',
  'feature-flags': 'Feature Flags',
};

function tabHref(tabId: string) {
  return tabId === 'proof-ledger' ? '/ops' : `/ops?tab=${tabId}`;
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parseOpsTab(params.tab);

  const [cronRows, generationJobs, sendJobs, sendJobRecipients, proofSummary] = await Promise.all([
    prisma.systemConfig.findMany({
      where: { key: { startsWith: 'cron:' } },
      select: { key: true, value: true },
    }),
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
    getLatestProofSummaryFromLedger(),
  ]);

  const generationMetrics = computeGenerationMetrics(generationJobs);
  const sendMetrics = computeSendJobMetrics(sendJobs, sendJobRecipients);
  const cronHealthy = cronRows.filter((row) => row.value.includes('"status":"ok"')).length;
  const cronErrors = cronRows.filter((row) => row.value.includes('"status":"error"') || row.value.includes('"status":"skipped"')).length;

  const providerSummary = Object.entries(
    generationJobs.reduce<Record<string, { total: number; failed: number }>>((acc, job) => {
      const key = (job.provider_used || 'unknown').toLowerCase();
      if (!acc[key]) acc[key] = { total: 0, failed: 0 };
      acc[key].total += 1;
      if (job.status === 'failed') acc[key].failed += 1;
      return acc;
    }, {}),
  )
    .map(([provider, counts]) => ({
      provider,
      total: counts.total,
      failed: counts.failed,
      failurePct: counts.total > 0 ? Math.round((counts.failed / counts.total) * 100) : 0,
    }))
    .sort((left, right) => right.total - left.total);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Ops' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tabHeading[selectedTab]}</h1>
          <p className="text-sm text-muted-foreground">
            System reliability, evidence, provider operations, and admin-control workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/crons">
            <Button variant="outline" size="sm">Legacy /admin/crons</Button>
          </Link>
          <Link href="/admin/generation-metrics">
            <Button variant="outline" size="sm">Legacy /admin/generation-metrics</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            {opsWorkspaceTabs.map((tab) => (
              <Link
                key={tab.id}
                href={tabHref(tab.id)}
                className={cn(
                  'inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors',
                  selectedTab === tab.id
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Cron States" value={String(cronRows.length)} detail={`${cronHealthy} healthy`} icon={Activity} />
        <MetricCard
          label="Generation Success"
          value={`${generationMetrics.successRatePct}%`}
          detail={`${generationMetrics.total} sampled jobs`}
          icon={BarChart3}
        />
        <MetricCard
          label="Send Failures"
          value={String(sendMetrics.failedRecipients)}
          detail={`${sendMetrics.totalJobs} sampled send jobs`}
          icon={TriangleAlert}
          tone={sendMetrics.failedRecipients > 0 ? 'text-red-600' : 'text-foreground'}
        />
        <MetricCard
          label="Feature Flags"
          value={String([HUBSPOT_LOGGING_ENABLED, HUBSPOT_SYNC_ENABLED, INBOX_POLLING_ENABLED, DRIP_SEQUENCE_ENABLED].filter(Boolean).length)}
          detail="Enabled runtime controls"
          icon={ShieldCheck}
        />
      </div>

      {selectedTab === 'proof-ledger' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Latest Sprint Proof</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Latest ledger entry</p>
              <p className="mt-1 font-medium">{proofSummary?.sprintHeading ?? 'No sprint entry found yet'}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Deployment ID: {proofSummary?.deploymentId ?? 'Unavailable'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {proofSummary?.deploymentUrl ? (
                  <Link href={proofSummary.deploymentUrl} target="_blank">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Deployment URL
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : null}
                <Link href="/queue">
                  <Button size="sm" variant="outline">Work Queue</Button>
                </Link>
                <Link href="/pipeline">
                  <Button size="sm" variant="outline">Pipeline</Button>
                </Link>
                <Link href="/analytics">
                  <Button size="sm" variant="outline">Analytics</Button>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest tested routes</p>
              {proofSummary?.testedRoutes?.length ? (
                <div className="flex flex-wrap gap-2">
                  {proofSummary.testedRoutes.slice(0, 10).map((route) => (
                    <Link key={route} href={route}>
                      <Badge variant="outline">{route}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No parsed route list available from the current ledger entry.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'cron-health' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cron Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric label="Healthy Jobs" value={cronHealthy} tone="text-emerald-600" />
              <MiniMetric label="Attention Needed" value={cronErrors} tone={cronErrors > 0 ? 'text-amber-600' : 'text-foreground'} />
              <MiniMetric label="Total Tracked" value={cronRows.length} />
            </div>
            <Link href="/admin/crons">
              <Button size="sm" variant="outline">Open Detailed Cron Health</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'generation-metrics' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Generation Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <MiniMetric label="Total Jobs" value={generationMetrics.total} />
              <MiniMetric label="Success %" value={generationMetrics.successRatePct} tone={generationMetrics.successRatePct >= 90 ? 'text-emerald-600' : 'text-amber-600'} />
              <MiniMetric label="Send Failures" value={sendMetrics.failedRecipients} tone={sendMetrics.failedRecipients > 0 ? 'text-red-600' : 'text-foreground'} />
              <MiniMetric label="Avg Send (s)" value={sendMetrics.avgCompletionSeconds || 0} />
            </div>
            <Link href="/admin/generation-metrics">
              <Button size="sm" variant="outline">Open Detailed Generation Metrics</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'provider-health' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Provider Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {providerSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">No provider activity available in sampled jobs.</p>
            ) : (
              providerSummary.map((provider) => (
                <div key={provider.provider} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="capitalize">{provider.provider}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">jobs {provider.total}</span>
                    <span className={cn(provider.failurePct > 20 ? 'text-red-600' : 'text-foreground')}>
                      fail {provider.failurePct}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'feature-flags' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <FlagRow label="HubSpot logging" enabled={HUBSPOT_LOGGING_ENABLED} />
            <FlagRow label="HubSpot sync" enabled={HUBSPOT_SYNC_ENABLED} />
            <FlagRow label="Inbox polling" enabled={INBOX_POLLING_ENABLED} />
            <FlagRow label="Campaign drip" enabled={DRIP_SEQUENCE_ENABLED} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'text-foreground',
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={cn('mt-2 text-2xl font-bold', tone)}>{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-lg bg-muted p-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', tone)}>{value}</p>
    </div>
  );
}

function FlagRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span>{label}</span>
      <Badge variant={enabled ? 'default' : 'outline'}>
        {enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    </div>
  );
}
