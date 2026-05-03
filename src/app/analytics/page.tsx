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

export const metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

type SearchParams = {
  tab?: string;
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

  const now = new Date();
  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

  const [stats, campaigns, quarterRows, meetingsThisYear] = await Promise.all([
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
  ]);

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
        </div>
      ) : null}

      {selectedTab === 'campaigns' ? (
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
        </div>
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
