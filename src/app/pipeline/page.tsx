import type { ComponentType } from 'react';
import { Activity, ArrowRight, CalendarCheck, Filter, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { derivePipelineStage, PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type PipelineStage } from '@/lib/pipeline';
import {
  buildPipelineStageHistory,
  parsePipelineFilters,
  parsePipelineTab,
  pipelineWorkspaceTabs,
  stageLabel,
} from '@/lib/pipeline-workspace';
import { PipelineBoard, type PipelineAccountCard } from './pipeline-board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pipeline' };

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

type SearchParams = {
  tab?: string;
  account?: string;
  campaign?: string;
};

export default async function PipelinePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const selectedTab = parsePipelineTab(params.tab);
  const filters = parsePipelineFilters(params);

  const [accounts, recentEmails, meetings, activities, campaigns, waves, pipelineActivities] = await Promise.all([
    prisma.account.findMany({
      orderBy: [{ priority_score: 'desc' }, { rank: 'asc' }],
      include: {
        activities: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        meetings: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.emailLog.findMany({
      select: { account_name: true, sent_at: true },
      orderBy: { sent_at: 'desc' },
      take: 500,
    }),
    prisma.meeting.findMany({
      orderBy: [{ meeting_date: 'desc' }, { created_at: 'desc' }],
      take: 400,
      select: {
        id: true,
        account_name: true,
        persona: true,
        meeting_status: true,
        objective: true,
        notes: true,
        meeting_date: true,
        created_at: true,
      },
    }),
    prisma.activity.findMany({
      orderBy: { created_at: 'desc' },
      take: 500,
      select: {
        id: true,
        account_name: true,
        campaign_id: true,
        campaign: {
          select: {
            name: true,
            slug: true,
          },
        },
        persona: true,
        activity_type: true,
        owner: true,
        outcome: true,
        next_step: true,
        next_step_due: true,
        created_at: true,
        activity_date: true,
      },
    }),
    prisma.campaign.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.outreachWave.findMany({
      where: { campaign_id: { not: null } },
      select: {
        account_name: true,
        campaign: {
          select: {
            slug: true,
          },
        },
      },
    }),
    prisma.activity.findMany({
      where: { activity_type: 'Pipeline' },
      orderBy: { created_at: 'desc' },
      take: 300,
      select: {
        id: true,
        account_name: true,
        outcome: true,
        notes: true,
        owner: true,
        activity_date: true,
        created_at: true,
      },
    }),
  ]);

  const lastEmailByAccount = new Map<string, string>();
  for (const email of recentEmails) {
    if (!email.account_name || lastEmailByAccount.has(email.account_name)) continue;
    lastEmailByAccount.set(email.account_name, email.sent_at.toISOString());
  }

  const cards: PipelineAccountCard[] = accounts.map((account) => ({
    name: account.name,
    slug: slugify(account.name),
    stage: derivePipelineStage({
      pipeline_stage: account.pipeline_stage,
      outreach_status: account.outreach_status,
      meeting_status: account.meeting_status,
    }),
    priorityBand: account.priority_band ?? 'D',
    priorityScore: account.priority_score ?? 0,
    outreachStatus: account.outreach_status ?? 'Not started',
    meetingStatus: account.meeting_status ?? 'No meeting',
    owner: account.owner ?? 'Casey',
    lastActivity: account.activities[0]?.created_at?.toISOString() ?? null,
    lastEmailAt: lastEmailByAccount.get(account.name) ?? null,
    hubspotDealId: account.meetings[0]?.hubspot_deal_id ?? null,
  }));

  const accountCampaignSlugs = new Map<string, Set<string>>();
  for (const wave of waves) {
    const campaignSlug = wave.campaign?.slug;
    if (!campaignSlug) continue;
    if (!accountCampaignSlugs.has(wave.account_name)) {
      accountCampaignSlugs.set(wave.account_name, new Set<string>());
    }
    accountCampaignSlugs.get(wave.account_name)?.add(campaignSlug);
  }

  for (const activity of activities) {
    const campaignSlug = activity.campaign?.slug;
    if (!campaignSlug) continue;
    if (!accountCampaignSlugs.has(activity.account_name)) {
      accountCampaignSlugs.set(activity.account_name, new Set<string>());
    }
    accountCampaignSlugs.get(activity.account_name)?.add(campaignSlug);
  }

  const filteredCards = cards.filter((card) => {
    const accountMatch = filters.account === 'all' || card.slug === filters.account;
    if (!accountMatch) return false;
    if (filters.campaign === 'all') return true;
    return accountCampaignSlugs.get(card.name)?.has(filters.campaign) ?? false;
  });

  const filteredMeetings = meetings.filter((meeting) => {
    const meetingSlug = slugify(meeting.account_name);
    const accountMatch = filters.account === 'all' || meetingSlug === filters.account;
    if (!accountMatch) return false;
    if (filters.campaign === 'all') return true;
    return accountCampaignSlugs.get(meeting.account_name)?.has(filters.campaign) ?? false;
  });

  const filteredActivities = activities.filter((activity) => {
    const activitySlug = slugify(activity.account_name);
    const accountMatch = filters.account === 'all' || activitySlug === filters.account;
    if (!accountMatch) return false;
    if (filters.campaign === 'all') return true;
    if (activity.campaign?.slug === filters.campaign) return true;
    return accountCampaignSlugs.get(activity.account_name)?.has(filters.campaign) ?? false;
  });

  const stageHistory = buildPipelineStageHistory(
    pipelineActivities.filter((item) => {
      const accountMatch = filters.account === 'all' || slugify(item.account_name) === filters.account;
      if (!accountMatch) return false;
      if (filters.campaign === 'all') return true;
      return accountCampaignSlugs.get(item.account_name)?.has(filters.campaign) ?? false;
    }),
  );

  const total = filteredCards.length;
  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, filteredCards.filter((card) => card.stage === stage).length]),
  ) as Record<PipelineStage, number>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Pipeline' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Revenue-motion board with meetings, activities timeline, and stage history in one workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="gap-1.5">
              Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tab" value={selectedTab} />
            <div className="space-y-1">
              <label htmlFor="pipeline-account" className="text-xs font-medium text-muted-foreground">
                Account
              </label>
              <select
                id="pipeline-account"
                name="account"
                defaultValue={filters.account}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="all">All Accounts</option>
                {cards
                  .map((card) => ({ slug: card.slug, name: card.name }))
                  .sort((left, right) => left.name.localeCompare(right.name))
                  .map((account) => (
                    <option key={account.slug} value={account.slug}>{account.name}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="pipeline-campaign" className="text-xs font-medium text-muted-foreground">
                Campaign
              </label>
              <select
                id="pipeline-campaign"
                name="campaign"
                defaultValue={filters.campaign}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.slug} value={campaign.slug}>{campaign.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Apply
            </Button>
            <Link href={`/pipeline?tab=${selectedTab}`}>
              <Button type="button" variant="outline" size="sm">Clear</Button>
            </Link>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Accounts in Play" value={total} icon={Target} />
        <MetricCard label="Active Conversations" value={stageCounts.engaged + stageCounts.meeting + stageCounts.proposal} icon={TrendingUp} />
        <MetricCard label="Meetings" value={filteredMeetings.length} icon={CalendarCheck} />
        <MetricCard label="Activities" value={filteredActivities.length} icon={Activity} />
      </div>

      <Tabs defaultValue={selectedTab} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {pipelineWorkspaceTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Stage Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage} className="rounded-lg border p-3 text-center">
                    <p className="text-xs uppercase text-muted-foreground">{PIPELINE_STAGE_LABELS[stage]}</p>
                    <p className="mt-2 text-2xl font-bold">{stageCounts[stage]}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <PipelineBoard accounts={filteredCards} />
        </TabsContent>

        <TabsContent value="meetings" className="space-y-3">
          {filteredMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">No meetings found for current filters.</CardContent>
            </Card>
          ) : (
            filteredMeetings.slice(0, 30).map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/accounts/${slugify(meeting.account_name)}`} className="truncate text-sm font-medium text-primary hover:underline">
                        {meeting.account_name}
                      </Link>
                      <Badge variant="outline">{meeting.meeting_status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {meeting.persona || 'TBD'} · {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleString() : 'Date TBD'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{meeting.objective ?? meeting.notes ?? 'No meeting notes yet.'}</p>
                  </div>
                  <Link href={`/accounts/${slugify(meeting.account_name)}`}>
                    <Button size="sm">Open Account</Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-3">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">No activities found for current filters.</CardContent>
            </Card>
          ) : (
            filteredActivities.slice(0, 40).map((activity) => (
              <Card key={activity.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/accounts/${slugify(activity.account_name)}`} className="font-medium text-primary hover:underline">
                        {activity.account_name}
                      </Link>
                      <Badge variant="secondary">{activity.activity_type}</Badge>
                      {activity.campaign ? <Badge variant="outline">{activity.campaign.name}</Badge> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(activity.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.next_step ?? activity.outcome ?? 'No additional details.'}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Owner: {activity.owner ?? 'Unassigned'}</span>
                    {activity.persona ? <span>Contact: {activity.persona}</span> : null}
                    {activity.next_step_due ? <span>Due: {new Date(activity.next_step_due).toLocaleDateString()}</span> : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="stage-history" className="space-y-3">
          {stageHistory.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">No stage changes recorded for current filters.</CardContent>
            </Card>
          ) : (
            stageHistory.slice(0, 40).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/accounts/${slugify(entry.accountName)}`} className="font-medium text-primary hover:underline">
                        {entry.accountName}
                      </Link>
                      {entry.fromStage ? <Badge variant="outline">From {stageLabel(entry.fromStage)}</Badge> : null}
                      {entry.toStage ? <Badge>To {stageLabel(entry.toStage)}</Badge> : null}
                    </div>
                    <span className="text-xs text-muted-foreground">{entry.occurredAt.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.outcome}</p>
                  <p className="text-xs text-muted-foreground">Owner: {entry.owner}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </div>
          <div className="rounded-lg bg-[var(--accent)] p-2.5">
            <Icon className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
