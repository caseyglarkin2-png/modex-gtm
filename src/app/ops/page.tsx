import Link from 'next/link';
import { Activity, BarChart3, ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/metric-card';
import { cn } from '@/lib/utils';
import { opsWorkspaceTabs, parseOpsTab, type OpsTabId } from '@/lib/ops-workspace';
import { getLatestProofSummaryFromLedger } from '@/lib/proof-ledger';
import { DRIP_SEQUENCE_ENABLED, HUBSPOT_LOGGING_ENABLED, HUBSPOT_SYNC_ENABLED, INBOX_POLLING_ENABLED } from '@/lib/feature-flags';
import { prisma } from '@/lib/prisma';
import { computeGenerationMetrics } from '@/lib/admin/generation-metrics';
import { computeSendJobMetrics } from '@/lib/admin/send-job-metrics';
import { getConnectorRuntimeStatuses } from '@/lib/revops/connector-health';
import { computeCoverageRatios, evaluateCoverageGate } from '@/lib/revops/coverage-gate';
import { COVERAGE_GATE_THRESHOLDS_V1 } from '@/lib/revops/sprint11-contracts';
import { computeMappingContractChecksum, getMappingContracts } from '@/lib/enrichment/mapping-contracts';
import { CONTENT_QUALITY_SEND_BLOCK_THRESHOLD, evaluateContentQuality } from '@/lib/content-quality';
import { buildFailureClusters, buildRetryRecommendations } from '@/lib/revops/failure-intelligence';
import { detectInfographicDrift, parseInfographicMetadata } from '@/lib/revops/infographic-journey';
import { fetchAccountIdentityReport } from '@/lib/revops/account-identity-report';
import { runCanonicalBackfillAction } from '@/app/ops/actions';
import { requireAdminPage } from '@/lib/require-admin';

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
  'connector-health': 'Connector Health',
  coverage: 'Coverage Command Center',
  'account-identity': 'Account Identity Command Center',
};

function tabHref(tabId: string) {
  return tabId === 'proof-ledger' ? '/ops' : `/ops?tab=${tabId}`;
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireAdminPage();
  const params = (await searchParams) ?? {};
  const selectedTab = parseOpsTab(params.tab);

  const connectorStatuses = getConnectorRuntimeStatuses();
  const connectorMappings = getMappingContracts().map((contract) => ({
    system: contract.system,
    version: contract.version,
    checksum: computeMappingContractChecksum(contract),
  }));

  const [cronRows, generationJobs, sendJobs, sendJobRecipients, approvalRequests, proofSummary, importedCompanies, linkedContacts, enrichedContacts, sendReadyContacts, attributableContacts, staleContacts, latestGeneratedRows, accountIdentityReport, canonicalBackfillAudit] = await Promise.all([
    prisma.systemConfig.findMany({
      where: {
        OR: [
          { key: { startsWith: 'cron:' } },
          { key: { startsWith: 'coverage_' } },
          { key: { startsWith: 'event_qa_' } },
        ],
      },
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
    prisma.sendApprovalRequest.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'desc' },
      take: 200,
      select: {
        id: true,
        created_at: true,
        sla_due_at: true,
        risk_score: true,
      },
    }),
    getLatestProofSummaryFromLedger(),
    prisma.account.count({
      where: {
        OR: [{ source: 'hubspot_import' }, { hubspot_company_id: { not: null } }],
      },
    }),
    prisma.persona.count({
      where: { hubspot_contact_id: { not: null } },
    }),
    prisma.persona.count({
      where: {
        enrichment: {
          OR: [{ apollo_person_id: { not: null } }, { enrichment_confidence: { not: null } }],
        },
      },
    }),
    prisma.persona.count({
      where: {
        is_contact_ready: true,
        do_not_contact: false,
      },
    }),
    prisma.persona.count({
      where: {
        email: { not: null },
      },
    }),
    prisma.persona.count({
      where: {
        OR: [
          { last_enriched_at: null },
          { last_enriched_at: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
    }),
    prisma.generatedContent.findMany({
      where: { content_type: 'one_pager' },
      orderBy: [{ account_name: 'asc' }, { version: 'desc' }],
      take: 300,
      select: {
        id: true,
        account_name: true,
        version: true,
        content: true,
        version_metadata: true,
      },
    }),
    fetchAccountIdentityReport(),
    prisma.systemConfig.findUnique({
      where: { key: 'runbook:canonical-backfill:last' },
      select: { value: true },
    }),
  ]);

  const generationMetrics = computeGenerationMetrics(generationJobs);
  const sendMetrics = computeSendJobMetrics(sendJobs, sendJobRecipients);
  const cronHealthy = cronRows.filter((row) => row.value.includes('"status":"ok"')).length;
  const cronErrors = cronRows.filter((row) => row.value.includes('"status":"error"') || row.value.includes('"status":"skipped"')).length;
  const configMap = new Map(cronRows.map((row) => [row.key, row.value]));
  const tamCompanies = Number(process.env.TAM_COMPANY_TARGET || 1000);
  const tamContacts = Number(process.env.TAM_CONTACT_TARGET || 13000);
  const unresolvedConflicts = Number(configMap.get('coverage_unresolved_conflicts') || 0);
  const coverageGate = evaluateCoverageGate(
    {
      tamCompanies,
      tamContacts,
      importedCompanies,
      linkedContacts,
      enrichedContacts,
      sendReadyContacts,
      attributableContacts,
      unresolvedConflicts,
      staleContacts,
    },
    COVERAGE_GATE_THRESHOLDS_V1,
  );
  const coverageRatios = computeCoverageRatios({
    tamCompanies,
    tamContacts,
    importedCompanies,
    linkedContacts,
    enrichedContacts,
    sendReadyContacts,
    attributableContacts,
    unresolvedConflicts,
    staleContacts,
  });

  const eventVolume = sendJobRecipients.length;
  const nullKeyRows = sendJobRecipients.filter((row) => !row.to_email || !row.account_name).length;
  const lateRows = sendJobRecipients.filter((row) => Date.now() - row.created_at.getTime() > 72 * 60 * 60 * 1000).length;
  const eventQa = {
    volume: eventVolume,
    nullKeyRate: eventVolume > 0 ? nullKeyRows / eventVolume : 0,
    schemaDrift: Number(configMap.get('event_qa_schema_drift_count') || 0),
    lateEventRate: eventVolume > 0 ? lateRows / eventVolume : 0,
  };

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
  const latestByAccount = new Map<string, { id: number; account_name: string; version: number; content: string; version_metadata: unknown }>();
  for (const row of latestGeneratedRows) {
    if (!latestByAccount.has(row.account_name)) {
      latestByAccount.set(row.account_name, row);
    }
  }
  const lowScoreAssets = Array.from(latestByAccount.values())
    .map((row) => ({
      id: row.id,
      accountName: row.account_name,
      version: row.version,
      quality: evaluateContentQuality(row.content, row.account_name),
    }))
    .filter((row) => row.quality.score < CONTENT_QUALITY_SEND_BLOCK_THRESHOLD)
    .sort((left, right) => left.quality.score - right.quality.score);
  const infographicDriftAlerts = Array.from(latestByAccount.values())
    .map((row) => {
      const metadata = parseInfographicMetadata(row.version_metadata);
      const quality = evaluateContentQuality(row.content, row.account_name).score / 100;
      const baseline = Math.max(0.01, quality + 0.15);
      const drift = detectInfographicDrift({ currentRate: quality, baselineRate: baseline });
      return {
        accountName: row.account_name,
        stageIntent: metadata.stageIntent,
        infographicType: metadata.infographicType,
        deltaPct: drift.deltaPct,
        drifting: drift.drifting,
      };
    })
    .filter((row) => row.drifting)
    .sort((left, right) => right.deltaPct - left.deltaPct)
    .slice(0, 6);
  const failedRecipientSignals = sendJobRecipients
    .filter((row) => row.status === 'failed')
    .map((row) => ({
      id: `${row.account_name}:${row.to_email}:${row.created_at.toISOString()}`,
      accountName: row.account_name ?? 'unknown',
      occurredAt: row.created_at,
      errorMessage: row.error_message,
    }));
  const failureClusters = buildFailureClusters(failedRecipientSignals);
  const retryRecommendations = buildRetryRecommendations(failedRecipientSignals);
  const nowTs = Date.now();
  const overdueApprovals = approvalRequests.filter((row) => row.sla_due_at && row.sla_due_at.getTime() < nowTs).length;
  const approvalSlaHours = approvalRequests.length > 0
    ? Math.round(
      approvalRequests
        .map((row) => Math.max(0, nowTs - row.created_at.getTime()) / (1000 * 60 * 60))
        .reduce((sum, hours) => sum + hours, 0) / approvalRequests.length,
    )
    : 0;
  const lastCanonicalBackfill = canonicalBackfillAudit?.value
    ? JSON.parse(canonicalBackfillAudit.value) as {
      at?: string;
      accountCount?: number;
      clusterCount?: number;
      impactedAccountCount?: number;
      mismatchedCanonicalClusterCount?: number;
      missingCanonicalLinkCount?: number;
    }
    : null;

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
            <div className="grid gap-3 md:grid-cols-3">
              <MiniMetric label="Approval Queue" value={approvalRequests.length} tone={approvalRequests.length > 0 ? 'text-amber-600' : 'text-foreground'} />
              <MiniMetric label="Approval SLA (hrs)" value={approvalSlaHours} />
              <MiniMetric label="Approval Overdue" value={overdueApprovals} tone={overdueApprovals > 0 ? 'text-red-600' : 'text-foreground'} />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Low-Score Assets Awaiting Review</p>
              <p className="mt-1 text-sm font-semibold">{lowScoreAssets.length}</p>
              {lowScoreAssets.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {lowScoreAssets.slice(0, 5).map((asset) => (
                    <p key={asset.id}>
                      {asset.accountName} v{asset.version} - quality {asset.quality.score}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">No low-score one-pagers in the sampled latest versions.</p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Failure Intelligence</p>
              {failureClusters.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No clustered failures in sampled recipients.</p>
              ) : (
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {failureClusters.map((cluster) => (
                    <div key={cluster.className} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{cluster.className}</p>
                      <p className="text-muted-foreground">{cluster.count} affected recipients</p>
                    </div>
                  ))}
                </div>
              )}
              {retryRecommendations.length > 0 ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {retryRecommendations.map((recommendation) => (
                    <p key={recommendation.className}>
                      {recommendation.className}: {recommendation.recommended}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Infographic Drift Monitor</p>
              {infographicDriftAlerts.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No drift alerts in sampled infographic leaderboard rows.</p>
              ) : (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {infographicDriftAlerts.map((alert) => (
                    <p key={`${alert.accountName}:${alert.stageIntent}:${alert.infographicType}`}>
                      {alert.accountName}: {alert.infographicType} ({alert.stageIntent}) decayed {(alert.deltaPct * 100).toFixed(1)}%
                    </p>
                  ))}
                </div>
              )}
            </div>
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

      {selectedTab === 'connector-health' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Connector Runtime + Ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {connectorStatuses.map((status) => {
              const cron = cronRows.find((row) => row.key === 'cron:sync-hubspot');
              const lastRun = cron?.value.match(/"lastRunAt":"([^"]+)"/)?.[1] ?? null;
              const mapping = connectorMappings.find((entry) => entry.system === status.key);
              return (
                <div key={status.key} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">{status.key}</p>
                    <div className="flex gap-2">
                      <Badge variant={status.configured ? 'default' : 'secondary'}>
                        {status.configured ? 'Configured' : 'Missing config'}
                      </Badge>
                      <Badge variant={status.enabled ? 'default' : 'secondary'}>
                        {status.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <p>Owner: {status.owner}</p>
                    <p>Escalation: {status.escalationChannel}</p>
                    <p>Runbook: {status.runbookLink}</p>
                    <p>Last rotation: {status.lastRotationDate}</p>
                    <p>Last sync run: {lastRun ? new Date(lastRun).toLocaleString() : 'No telemetry yet'}</p>
                    <p>Mapping: {mapping ? `${mapping.version} (${mapping.checksum.slice(0, 10)}…)` : 'n/a'}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'coverage' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">TAM/ICP Coverage + Gate 0</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <MiniMetric label="Companies Imported" value={`${importedCompanies}/${tamCompanies}`} />
              <MiniMetric label="Contacts Linked" value={`${linkedContacts}/${tamContacts}`} />
              <MiniMetric label="Contacts Enriched" value={`${enrichedContacts}/${tamContacts}`} />
              <MiniMetric label="Send-Ready" value={`${sendReadyContacts}/${tamContacts}`} />
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <MiniMetric label="Companies %" value={`${Math.round(coverageRatios.companiesImportedPct * 100)}%`} />
              <MiniMetric label="Linked %" value={`${Math.round(coverageRatios.contactsLinkedPct * 100)}%`} />
              <MiniMetric label="Enriched %" value={`${Math.round(coverageRatios.contactsEnrichedPct * 100)}%`} />
              <MiniMetric label="Attributable %" value={`${Math.round(coverageRatios.attributablePct * 100)}%`} />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs uppercase text-muted-foreground">Gate 0 status</p>
              <p className={cn('mt-1 font-medium', coverageGate.pass ? 'text-emerald-600' : 'text-amber-600')}>
                {coverageGate.pass ? 'PASS' : 'FAIL-CLOSE'}
              </p>
              {!coverageGate.pass ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Failed rules: {coverageGate.failedRules.join(', ')}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <MiniMetric label="Event Volume" value={eventQa.volume} />
              <MiniMetric label="Null Key Rate" value={`${Math.round(eventQa.nullKeyRate * 100)}%`} />
              <MiniMetric label="Schema Drift" value={eventQa.schemaDrift} />
              <MiniMetric label="Late Event Rate" value={`${Math.round(eventQa.lateEventRate * 100)}%`} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'account-identity' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Duplicate Account Remediation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <MiniMetric label="Duplicate Clusters" value={accountIdentityReport.summary.clusterCount} />
              <MiniMetric label="Impacted Accounts" value={accountIdentityReport.summary.impactedAccountCount} />
              <MiniMetric
                label="Mismatched Canonical IDs"
                value={accountIdentityReport.summary.mismatchedCanonicalClusterCount}
                tone={accountIdentityReport.summary.mismatchedCanonicalClusterCount > 0 ? 'text-amber-600' : 'text-foreground'}
              />
              <MiniMetric
                label="Missing Canonical Links"
                value={accountIdentityReport.summary.missingCanonicalLinkCount}
                tone={accountIdentityReport.summary.missingCanonicalLinkCount > 0 ? 'text-amber-600' : 'text-foreground'}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Canonical backfill</p>
                <p className="mt-1 font-medium">
                  {lastCanonicalBackfill?.at
                    ? `Last run ${new Date(lastCanonicalBackfill.at).toLocaleString()}`
                    : 'No canonical backfill recorded yet.'}
                </p>
                {lastCanonicalBackfill ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lastCanonicalBackfill.accountCount ?? 0} accounts across {lastCanonicalBackfill.clusterCount ?? 0} duplicate clusters.
                    {' '}Impacted accounts: {lastCanonicalBackfill.impactedAccountCount ?? 0}.
                    {' '}Mismatched clusters: {lastCanonicalBackfill.mismatchedCanonicalClusterCount ?? 0}.
                    {' '}Missing links: {lastCanonicalBackfill.missingCanonicalLinkCount ?? 0}.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Runs canonical sync across currently detected duplicate-account clusters and refreshes Ops diagnostics.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/api/revops/account-identity-report?format=json" target="_blank">
                  <Button size="sm" variant="outline">Export JSON</Button>
                </Link>
                <Link href="/api/revops/account-identity-report?format=csv" target="_blank">
                  <Button size="sm" variant="outline">Export CSV</Button>
                </Link>
                <form action={runCanonicalBackfillAction}>
                  <Button size="sm">Run Canonical Backfill</Button>
                </form>
              </div>
            </div>
            {accountIdentityReport.clusters.length === 0 ? (
              <div className="rounded-lg border p-3 text-muted-foreground">
                No duplicate-account clusters are currently detected.
              </div>
            ) : (
              <div className="space-y-3">
                {accountIdentityReport.clusters.map((cluster) => (
                  <div key={cluster.key} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{cluster.suggestedPrimaryAccount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Reasons: {cluster.reasons.map((reason) => reason.replaceAll('_', ' ')).join(', ')}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Canonical ids: {cluster.canonicalCompanyIds.length > 0 ? cluster.canonicalCompanyIds.join(', ') : 'none'}
                        </p>
                        {cluster.normalizedKeys.length > 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Alias keys: {cluster.normalizedKeys.join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cluster.mismatchedCanonicalIds ? <Badge variant="secondary">Canonical mismatch</Badge> : null}
                        {cluster.missingCanonicalLinks.length > 0 ? <Badge variant="outline">Missing links</Badge> : null}
                        {cluster.hubspotBackedAccounts.length > 0 ? <Badge variant="outline">HubSpot-backed</Badge> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cluster.accountNames.map((accountName) => (
                        <Link key={accountName} href={`/accounts/${accountName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}>
                          <Badge variant="outline">{accountName}</Badge>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-5">
                      <MiniMetric label="Contacts" value={cluster.contactCount} />
                      <MiniMetric label="Sendable" value={cluster.sendableContactCount} />
                      <MiniMetric label="Assets" value={cluster.generatedContentCount} />
                      <MiniMetric label="Email Logs" value={cluster.emailLogCount} />
                      <MiniMetric label="Open Conflicts" value={cluster.unresolvedConflicts} tone={cluster.unresolvedConflicts > 0 ? 'text-amber-600' : 'text-foreground'} />
                    </div>
                    {cluster.missingCanonicalLinks.length > 0 ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Missing canonical links: {cluster.missingCanonicalLinks.join(', ')}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}


function MiniMetric({
  label,
  value,
  tone = 'text-foreground',
}: {
  label: string;
  value: number | string;
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
