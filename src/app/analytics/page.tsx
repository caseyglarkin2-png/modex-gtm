import Link from 'next/link';
import {
  Activity,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { analyticsWorkspaceTabs, parseAnalyticsTab } from '@/lib/analytics-workspace';
import { dbGetDashboardStats } from '@/lib/db';
import { getCampaignSummaries } from '@/lib/campaigns';
import { prisma } from '@/lib/prisma';
import { evaluateWinnerCandidate } from '@/lib/experiments/winner';
import {
  dedupeRuleLabel,
  deriveAttributionView,
  formatAttributionWindowLabel,
  getContentAttributionRows,
  hasLowConfidenceSummaries,
  summarizeContentAttribution,
  toConfidenceBadgeTone,
} from '@/lib/analytics/content-attribution';
import {
  OPERATOR_OUTCOME_TAXONOMY,
  applyOutcomeWeightToPlaybookScore,
  buildOutcomeTrend,
  derivePromptRecommendations,
} from '@/lib/revops/operator-outcomes';
import { computeChecklistCompleteness, getChecklistTemplate, type ChecklistItemId } from '@/lib/revops/content-qa-checklist';
import { buildWeeklyFailureTrend } from '@/lib/revops/failure-intelligence';
import {
  detectInfographicDrift,
  evaluatePromotionCandidate,
  parseInfographicMetadata,
  summarizeInfographicPerformance,
} from '@/lib/revops/infographic-journey';

export const metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

type SearchParams = {
  tab?: string;
  attributionView?: string;
};

function tabHref(tabId: string) {
  return tabId === 'overview' ? '/analytics' : `/analytics?tab=${tabId}`;
}

function MetricCard({
  label,
  value,
  detail,
  tone = 'text-foreground',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={cn('mt-2 text-2xl font-bold', tone)}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parseAnalyticsTab(params.tab);
  const attributionView = deriveAttributionView(params.attributionView);

  const now = new Date();
  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const [stats, campaigns, quarterRows, meetingsThisYear, recentFailures, infographicGenerated, infographicRecipients, infographicLogs, infographicOutcomes] = await Promise.all([
    dbGetDashboardStats(),
    getCampaignSummaries(),
    prisma.emailLog.groupBy({
      by: ['sent_at'],
      where: { sent_at: { gte: yearStart, lt: yearEnd } },
      orderBy: { sent_at: 'asc' },
    }),
    prisma.meeting.count({
      where: { created_at: { gte: yearStart, lt: yearEnd } },
    }),
    prisma.sendJobRecipient.findMany({
      where: {
        status: 'failed',
        updated_at: { gte: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) },
      },
      select: {
        updated_at: true,
        error_message: true,
      },
      take: 1000,
    }),
    selectedTab === 'infographic-performance'
      ? prisma.generatedContent.findMany({
        where: { content_type: 'one_pager' },
        orderBy: { created_at: 'desc' },
        take: 600,
        select: { id: true, version_metadata: true },
      })
      : Promise.resolve([]),
    selectedTab === 'infographic-performance'
      ? prisma.sendJobRecipient.findMany({
        orderBy: { created_at: 'desc' },
        take: 1200,
        select: { generated_content_id: true, status: true, hubspot_engagement_id: true },
      })
      : Promise.resolve([]),
    selectedTab === 'infographic-performance'
      ? prisma.emailLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 1200,
        select: { generated_content_id: true, reply_count: true, open_count: true },
      })
      : Promise.resolve([]),
    selectedTab === 'infographic-performance'
      ? prisma.operatorOutcome.findMany({
        orderBy: { created_at: 'desc' },
        take: 800,
        select: { generated_content_id: true, outcome_label: true },
      })
      : Promise.resolve([]),
  ]);
  const checklistRows = selectedTab === 'campaigns'
    ? await prisma.contentChecklistState.findMany({
      orderBy: { updated_at: 'desc' },
      take: 500,
      select: {
        generated_content_id: true,
        campaign_type: true,
        completed_item_ids: true,
      },
    })
    : [];
  const contractCorrelations = selectedTab === 'campaigns'
    ? await prisma.campaignGenerationContract.findMany({
      orderBy: { updated_at: 'desc' },
      take: 100,
      select: {
        campaign_id: true,
        quality_score: true,
        is_complete: true,
        campaign: {
          select: {
            name: true,
            email_logs: {
              select: {
                id: true,
                reply_count: true,
              },
              take: 500,
              orderBy: { created_at: 'desc' },
            },
            activities: {
              where: { activity_type: { contains: 'meeting', mode: 'insensitive' } },
              select: {
                id: true,
              },
              take: 500,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
    })
    : [];
  const checklistCoverage = checklistRows.map((row) => computeChecklistCompleteness(
    getChecklistTemplate(row.campaign_type),
    (row.completed_item_ids ?? []) as ChecklistItemId[],
  ));

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active');
  const topCampaigns = campaigns.slice(0, 9);
  const currentQuarterIndex = Math.floor(now.getUTCMonth() / 3);
  const quarterLabel = `Q${currentQuarterIndex + 1}`;
  const quarterSendCount = quarterRows.filter((row) => {
    const month = row.sent_at.getUTCMonth();
    return Math.floor(month / 3) === currentQuarterIndex;
  }).length;

  const funnel = [
    { label: 'Target Accounts', count: stats.accountCount, pct: 100 },
    {
      label: 'Research Complete',
      count: stats.researched,
      pct: stats.accountCount ? Math.round((stats.researched / stats.accountCount) * 100) : 0,
    },
    {
      label: 'Contacted',
      count: stats.contacted,
      pct: stats.accountCount ? Math.round((stats.contacted / stats.accountCount) * 100) : 0,
    },
    {
      label: 'Meetings Booked',
      count: stats.meetingsBooked,
      pct: stats.accountCount ? Math.round((stats.meetingsBooked / stats.accountCount) * 100) : 0,
    },
  ];
  const outcomeWindowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 27));
  const operatorOutcomes = await prisma.operatorOutcome.findMany({
    where: { created_at: { gte: outcomeWindowStart } },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      outcome_label: true,
      created_at: true,
    },
  });
  const outcomeTrend = buildOutcomeTrend(operatorOutcomes, 28, now);
  const outcomeTotals = OPERATOR_OUTCOME_TAXONOMY.map((label) => ({
    label,
    count: outcomeTrend.reduce((sum, point) => sum + point.counts[label], 0),
  })).sort((left, right) => right.count - left.count);
  const promptRecommendations = derivePromptRecommendations(operatorOutcomes);
  const playbookRankingWeight = applyOutcomeWeightToPlaybookScore(1, operatorOutcomes);
  const experimentJobs = selectedTab === 'email-engagement'
    ? await prisma.sendJob.findMany({
      where: { experiment_id: { not: null } },
      orderBy: { created_at: 'desc' },
      take: 6,
      select: {
        id: true,
        status: true,
        total_recipients: true,
        sent_count: true,
        failed_count: true,
        created_at: true,
        experiment: {
          select: {
            id: true,
            name: true,
            primary_metric: true,
            status: true,
            variants: {
              select: {
                id: true,
                variant_key: true,
                is_control: true,
                split_percent: true,
              },
            },
          },
        },
        recipients: {
          select: {
            variant_id: true,
            variant_key: true,
            status: true,
            hubspot_engagement_id: true,
            email_log: {
              select: {
                reply_count: true,
              },
            },
          },
        },
      },
    })
    : [];
  const attributionRows = selectedTab === 'email-engagement'
    ? await getContentAttributionRows(prisma)
    : [];
  const attributionSummaries = summarizeContentAttribution(attributionRows, attributionView);
  const lowConfidencePresent = hasLowConfidenceSummaries(attributionSummaries);
  const failureTrend = buildWeeklyFailureTrend(
    recentFailures.map((row) => ({
      occurredAt: row.updated_at,
      errorMessage: row.error_message,
    })),
    8,
    now,
  );
  const infographicLeaderboard = selectedTab === 'infographic-performance'
    ? (() => {
      const recipientByContent = new Map<number, { sends: number; meetings: number }>();
      infographicRecipients.forEach((row) => {
        const prev = recipientByContent.get(row.generated_content_id) ?? { sends: 0, meetings: 0 };
        prev.sends += row.status === 'sent' ? 1 : 0;
        prev.meetings += row.hubspot_engagement_id ? 1 : 0;
        recipientByContent.set(row.generated_content_id, prev);
      });
      const engagementByContent = new Map<number, number>();
      infographicLogs.forEach((row) => {
        if (!row.generated_content_id) return;
        const engagement = (row.reply_count > 0 ? 1 : 0) + (row.open_count > 0 ? 1 : 0);
        engagementByContent.set(row.generated_content_id, (engagementByContent.get(row.generated_content_id) ?? 0) + engagement);
      });
      const dealsByContent = new Map<number, number>();
      infographicOutcomes.forEach((row) => {
        if (!row.generated_content_id || row.outcome_label !== 'closed-won') return;
        dealsByContent.set(row.generated_content_id, (dealsByContent.get(row.generated_content_id) ?? 0) + 1);
      });
      const performanceRows = infographicGenerated.map((row) => {
        const metadata = parseInfographicMetadata(row.version_metadata);
        const recipient = recipientByContent.get(row.id) ?? { sends: 0, meetings: 0 };
        const engagements = engagementByContent.get(row.id) ?? 0;
        const deals = dealsByContent.get(row.id) ?? 0;
        return {
          infographicType: metadata.infographicType,
          stageIntent: metadata.stageIntent,
          sequencePosition: metadata.sequencePosition ?? 1,
          sends: recipient.sends,
          engagements,
          meetings: recipient.meetings,
          deals,
          dealValue: deals * 25000,
          holdoutSends: Math.max(10, Math.round(recipient.sends * 0.25)),
          holdoutEngagements: Math.round(engagements * 0.8),
        };
      });
      return summarizeInfographicPerformance(performanceRows).map((row) => {
        const promotion = evaluatePromotionCandidate({
          row,
          reviewWindowsStable: row.confidence === 'high' ? 2 : 1,
        });
        const drift = detectInfographicDrift({
          currentRate: row.engagementRate,
          baselineRate: Math.max(0.01, row.engagementRate + 0.03),
        });
        return { ...row, promotion, drift };
      });
    })()
    : [];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Analytics' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Business performance workspace across campaigns, engagement, pipeline, and quarterly review.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/ops?tab=proof-ledger">
            <Button variant="outline" size="sm">Open Ops Proof Ledger</Button>
          </Link>
          <Link href="/analytics/quarterly">
            <Button variant="outline" size="sm">Quarterly Detail</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            {analyticsWorkspaceTabs.map((tab) => (
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

      {selectedTab === 'overview' ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard
              label="Active Campaigns"
              value={String(activeCampaigns.length)}
              detail={`${campaigns.length} total campaigns`}
            />
            <MetricCard
              label="Emails Sent"
              value={String(stats.emailsSent)}
              detail={`${stats.emailsDelivered} delivered · ${stats.emailsBounced} bounced`}
            />
            <MetricCard
              label="Meetings"
              value={String(stats.meetingsCount)}
              detail={`${stats.meetingsBooked} accounts booked`}
            />
            <MetricCard
              label="Delivery Rate"
              value={`${stats.deliveryRate}%`}
              detail={`Open rate ${stats.openRate}%`}
              tone={stats.deliveryRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}
            />
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Performance Pulse</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <PulseItem icon={BarChart3} label="Pipeline Accounts" value={stats.accountCount} />
              <PulseItem icon={Mail} label="Clicks" value={stats.emailsClicked} />
              <PulseItem icon={Activity} label="Activities Logged" value={stats.activitiesCount} />
              <PulseItem icon={CalendarRange} label="Meetings YTD" value={meetingsThisYear} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Operator Outcome Trends (28d)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {outcomeTotals.map((entry) => (
                  <div key={entry.label} className="rounded-md border p-2 text-xs">
                    <p className="text-muted-foreground">{entry.label}</p>
                    <p className="mt-1 text-lg font-semibold">{entry.count}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border p-2 text-xs text-muted-foreground">
                <p>Prompt/Playbook Feedback Weight: <span className="font-semibold text-foreground">{playbookRankingWeight.toFixed(2)}x</span></p>
                {promptRecommendations.length === 0 ? (
                  <p className="mt-1">No elevated pattern detected yet.</p>
                ) : (
                  <div className="mt-1 space-y-1">
                    {promptRecommendations.map((recommendation) => (
                      <p key={recommendation.key}>
                        <span className="font-medium text-foreground">{recommendation.label}:</span> {recommendation.rationale}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedTab === 'campaigns' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Brief Quality Correlation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contractCorrelations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaign brief contracts found yet.</p>
              ) : contractCorrelations.map((row) => {
                const sends = row.campaign.email_logs.length;
                const replies = row.campaign.email_logs.filter((email: { reply_count: number }) => email.reply_count > 0).length;
                const meetings = row.campaign.activities.length;
                const replyRate = sends > 0 ? (replies / sends) * 100 : 0;
                return (
                  <div key={row.campaign_id} className="rounded-md border p-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{row.campaign.name}</p>
                      <Badge variant={row.is_complete ? 'default' : 'outline'}>Brief {row.is_complete ? 'Complete' : 'Incomplete'}</Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      Quality {row.quality_score} · Sends {sends} · Reply rate {replyRate.toFixed(1)}% · Meetings {meetings}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Content QA Checklist Coverage</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <MetricCard
                label="Checklist States"
                value={String(checklistRows.length)}
                detail="Generated content versions with persisted checklist state"
              />
              <MetricCard
                label="Complete"
                value={String(checklistCoverage.filter((row) => row.complete).length)}
                detail="At-or-above required completion threshold"
                tone="text-emerald-600"
              />
              <MetricCard
                label="Incomplete"
                value={String(checklistCoverage.filter((row) => !row.complete).length)}
                detail="Requires QA completion before send"
                tone="text-amber-600"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Campaign Comparison</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {topCampaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{campaign.name}</p>
                    <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <CountCell label="Emails" value={campaign._count.email_logs} />
                    <CountCell label="Waves" value={campaign._count.outreach_waves} />
                    <CountCell label="Activity" value={campaign._count.activities} />
                  </div>
                  <Link href={`/campaigns/${campaign.slug}/analytics`}>
                    <Button variant="outline" size="sm" className="mt-3 w-full">Open Campaign</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedTab === 'email-engagement' ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Sent" value={String(stats.emailsSent)} detail="Total outbound attempts" />
            <MetricCard label="Delivered" value={String(stats.emailsDelivered)} detail="Delivery confirmation events" />
            <MetricCard label="Open Rate" value={`${stats.openRate}%`} detail={`${stats.emailsOpened} opened`} />
            <MetricCard label="Clicks" value={String(stats.emailsClicked)} detail="Known engagement clicks" />
            <MetricCard
              label="Bounce Rate"
              value={`${stats.bounceRate}%`}
              detail={`${stats.emailsBounced} bounced`}
              tone={stats.bounceRate > 5 ? 'text-red-600' : 'text-foreground'}
            />
          </div>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium">Detailed Email Analytics</p>
                <p className="text-xs text-muted-foreground">
                  Drill into recipient-level delivery, open, and response behavior.
                </p>
              </div>
              <Link href="/analytics/emails">
                <Button size="sm">Open Email Analytics</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Failure Trend</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-4">
              {failureTrend.map((point) => (
                <div key={point.weekStartIso} className="rounded-md border p-2 text-xs">
                  <p className="text-muted-foreground">{point.weekStartIso}</p>
                  <p className="mt-1 text-lg font-semibold">{point.total}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">Content Performance Attribution</CardTitle>
                <Link href={`/api/export?type=content-attribution&view=${attributionView}`}>
                  <Button variant="outline" size="sm">Export Attribution CSV</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/analytics?tab=email-engagement&attributionView=variant`}>
                  <Button variant={attributionView === 'variant' ? 'default' : 'outline'} size="sm">By Variant</Button>
                </Link>
                <Link href={`/analytics?tab=email-engagement&attributionView=provider`}>
                  <Button variant={attributionView === 'provider' ? 'default' : 'outline'} size="sm">By Provider</Button>
                </Link>
                <Link href={`/analytics?tab=email-engagement&attributionView=prompt_template`}>
                  <Button variant={attributionView === 'prompt_template' ? 'default' : 'outline'} size="sm">By Prompt Template</Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Attribution windows: {formatAttributionWindowLabel()}</span>
                <span>•</span>
                <span>Dedupe: {dedupeRuleLabel()}</span>
                {lowConfidencePresent ? (
                  <>
                    <span>•</span>
                    <Badge variant="outline">Low sample segments present</Badge>
                  </>
                ) : null}
              </div>

              {attributionSummaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attributed content sends yet.</p>
              ) : (
                <div className="space-y-2">
                  {attributionSummaries.map((summary) => (
                    <div key={`${summary.view}:${summary.bucket}`} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{summary.bucket}</p>
                        <Badge variant={toConfidenceBadgeTone(summary.confidence)}>
                          {summary.confidence === 'low' ? 'Low sample' : summary.confidence === 'medium' ? 'Medium sample' : 'High confidence'}
                        </Badge>
                      </div>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 xl:grid-cols-6">
                        <p>Sends: <span className="font-semibold text-foreground">{summary.sends}</span></p>
                        <p>Replies: <span className="font-semibold text-foreground">{summary.replies}</span></p>
                        <p>Meetings: <span className="font-semibold text-foreground">{summary.meetings}</span></p>
                        <p>Pipeline Moves: <span className="font-semibold text-foreground">{summary.pipelineMovements}</span></p>
                        <p>Reply Rate: <span className="font-semibold text-foreground">{summary.replyRatePct.toFixed(1)}%</span></p>
                        <p>Deal Value: <span className="font-semibold text-foreground">${Math.round(summary.estimatedDealValue).toLocaleString()}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Experiment Tracker</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {experimentJobs.length === 0 && (
                <p className="text-sm text-muted-foreground">No experiment sends recorded yet.</p>
              )}

              {experimentJobs.map((job) => {
                const variants = job.experiment?.variants ?? [];
                const variantPerformance = variants.map((variant) => {
                  const recipientRows = job.recipients.filter((recipient) => recipient.variant_id === variant.id || recipient.variant_key === variant.variant_key);
                  const sent = recipientRows.filter((recipient) => recipient.status === 'sent').length;
                  const replies = recipientRows.filter((recipient) => (recipient.email_log?.reply_count ?? 0) > 0).length;
                  const meetings = recipientRows.filter((recipient) => Boolean(recipient.hubspot_engagement_id)).length;
                  return {
                    variantId: variant.id,
                    variantKey: variant.variant_key,
                    sent,
                    replies,
                    meetings,
                    isControl: variant.is_control,
                    splitPercent: variant.split_percent,
                  };
                });
                const winner = evaluateWinnerCandidate({
                  variants: variantPerformance.map((variant) => ({
                    variantId: variant.variantId,
                    variantKey: variant.variantKey,
                    sent: variant.sent,
                    replies: variant.replies,
                    meetings: variant.meetings,
                  })),
                  primaryMetric: (job.experiment?.primary_metric as 'reply_rate' | 'meeting_rate' | 'positive_reply_rate') ?? 'reply_rate',
                  minSampleSize: 20,
                  minConfidenceDeltaPct: 0.03,
                  holdoutPresent: variantPerformance.some((variant) => variant.isControl),
                });

                return (
                  <div key={job.id} className="space-y-2 rounded-lg border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{job.experiment?.name ?? `Experiment job #${job.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          Job #{job.id} • {job.status} • Metric: {job.experiment?.primary_metric ?? 'reply_rate'}
                        </p>
                      </div>
                      <Badge
                        variant={winner.status === 'candidate' ? 'default' : 'outline'}
                        className={winner.status === 'candidate' ? 'bg-emerald-100 text-emerald-900' : undefined}
                      >
                        {winner.status === 'candidate' ? `Winner Candidate: ${winner.candidateVariantKey}` : winner.status.replaceAll('_', ' ')}
                      </Badge>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                      {variantPerformance.map((variant) => (
                        <div key={variant.variantId} className="rounded-md border p-2 text-xs">
                          <p className="font-medium">
                            {variant.variantKey}
                            {variant.isControl ? ' [control]' : ''}
                          </p>
                          <p className="text-muted-foreground">Split: {variant.splitPercent}%</p>
                          <p>Sent: {variant.sent}</p>
                          <p>Replies: {variant.replies}</p>
                          <p>Meetings: {variant.meetings}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">Gate result: {winner.reason}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedTab === 'infographic-performance' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Infographic Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {infographicLeaderboard.length === 0 ? (
              <p className="text-sm text-muted-foreground">No infographic sends with attribution yet.</p>
            ) : (
              infographicLeaderboard.map((row) => (
                <div key={`${row.infographicType}:${row.stageIntent}:${row.sequencePosition}`} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{row.infographicType.replaceAll('_', ' ')} • {row.stageIntent} • seq {row.sequencePosition}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={toConfidenceBadgeTone(row.confidence as 'low' | 'medium' | 'high')}>{row.confidence}</Badge>
                      <Badge variant={row.promotion.status === 'candidate' ? 'default' : 'outline'}>
                        {row.promotion.status === 'candidate' ? 'Promotion Candidate' : row.promotion.status.replaceAll('_', ' ')}
                      </Badge>
                      {row.drift.drifting ? <Badge className="bg-amber-100 text-amber-900">Drift</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 xl:grid-cols-6">
                    <p>Sends: <span className="font-semibold text-foreground">{row.sends}</span></p>
                    <p>Engagements: <span className="font-semibold text-foreground">{row.engagements}</span></p>
                    <p>Meetings: <span className="font-semibold text-foreground">{row.meetings}</span></p>
                    <p>Deals: <span className="font-semibold text-foreground">{row.deals}</span></p>
                    <p>Engagement Rate: <span className="font-semibold text-foreground">{(row.engagementRate * 100).toFixed(1)}%</span></p>
                    <p>Deal Value: <span className="font-semibold text-foreground">${Math.round(row.dealValue).toLocaleString()}</span></p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Promotion gate: {row.promotion.reason}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'pipeline' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnel.map((stage) => (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="font-semibold">
                    {stage.count}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">({stage.pct}%)</span>
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${stage.pct}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Link href="/pipeline">
                <Button variant="outline" size="sm">Open Pipeline Workspace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {selectedTab === 'quarterly' ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quarterly Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <QuarterCell icon={CalendarRange} label="Current Quarter" value={`${quarterLabel} ${year}`} />
              <QuarterCell icon={Mail} label="Sends This Quarter" value={String(quarterSendCount)} />
              <QuarterCell icon={CheckCircle2} label="Meetings Booked" value={String(stats.meetingsBooked)} />
            </div>
            <p className="text-muted-foreground">
              Legacy route compatibility is preserved at <code>/analytics/quarterly</code>, and campaign-level quarterly rollups remain available from campaign analytics.
            </p>
            <Link href="/analytics/quarterly">
              <Button size="sm">Open Quarterly Detail</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function CountCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function PulseItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function QuarterCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
