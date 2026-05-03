import type { ComponentType } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarRange, Goal, Mail, MessageSquare, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { prisma } from '@/lib/prisma';
import { saveQuarterlyGoals } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Quarterly Review' };

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
type QuarterKey = (typeof QUARTERS)[number];

function getQuarterRange(year: number, quarterIndex: number) {
  const startMonth = quarterIndex * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return { start, end };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function percentOf(actual: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((actual / goal) * 100));
}

export default async function QuarterlyReviewPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const currentQuarterIndex = Math.floor(now.getUTCMonth() / 3);
  const currentQuarter = QUARTERS[currentQuarterIndex];

  const [emails, meetings, campaigns, accounts, goalConfigs] = await Promise.all([
    prisma.emailLog.findMany({
      where: { sent_at: { gte: yearStart, lt: yearEnd } },
      select: { sent_at: true, reply_count: true, open_count: true, status: true },
    }),
    prisma.meeting.findMany({
      where: { created_at: { gte: yearStart, lt: yearEnd } },
      select: { created_at: true, meeting_status: true },
    }),
    prisma.campaign.findMany({
      where: { OR: [{ created_at: { gte: yearStart, lt: yearEnd } }, { start_date: { gte: yearStart, lt: yearEnd } }] },
      select: { name: true, status: true, created_at: true, start_date: true },
    }),
    prisma.account.findMany({
      select: { name: true, pipeline_stage: true, priority_score: true, updated_at: true },
    }),
    prisma.systemConfig.findMany({
      where: { key: { startsWith: `quarterly-goals:${year}-` } },
      select: { key: true, value: true },
    }),
  ]);

  const goalMap = new Map<QuarterKey, { meetingTarget: number; pipelineTarget: number }>();
  for (const config of goalConfigs) {
    const quarter = config.key.split(`${year}-`)[1] as QuarterKey | undefined;
    if (!quarter) continue;
    try {
      const parsed = JSON.parse(config.value) as { meetingTarget?: number; pipelineTarget?: number };
      goalMap.set(quarter, {
        meetingTarget: parsed.meetingTarget ?? 0,
        pipelineTarget: parsed.pipelineTarget ?? 0,
      });
    } catch {
      goalMap.set(quarter, { meetingTarget: 0, pipelineTarget: 0 });
    }
  }

  const quarterRows = QUARTERS.map((quarter, index) => {
    const { start, end } = getQuarterRange(year, index);
    const quarterEmails = emails.filter((email) => email.sent_at >= start && email.sent_at < end);
    const quarterMeetings = meetings.filter((meeting) => meeting.created_at >= start && meeting.created_at < end);
    const quarterCampaigns = campaigns.filter((campaign) => {
      const stamp = campaign.start_date ?? campaign.created_at;
      return stamp >= start && stamp < end;
    });
    const quarterAccounts = accounts.filter((account) => account.updated_at >= start && account.updated_at < end);
    const dealsClosed = quarterAccounts.filter((account) => account.pipeline_stage === 'closed').length;
    const estimatedPipeline = quarterAccounts
      .filter((account) => ['meeting', 'proposal', 'closed'].includes((account.pipeline_stage ?? '').toLowerCase()))
      .reduce((sum, account) => sum + Math.max(10000, (account.priority_score ?? 0) * 1000), 0);
    const goals = goalMap.get(quarter) ?? { meetingTarget: 0, pipelineTarget: 0 };

    return {
      quarter,
      sends: quarterEmails.length,
      replies: quarterEmails.reduce((sum, email) => sum + (email.reply_count ?? 0), 0),
      meetings: quarterMeetings.filter((meeting) => (meeting.meeting_status ?? '').toLowerCase() !== 'no meeting').length,
      dealsClosed,
      estimatedPipeline,
      campaignsRun: quarterCampaigns.length,
      goals,
      isCurrent: quarter === currentQuarter,
    };
  });

  const activeQuarter = quarterRows.find((quarter) => quarter.isCurrent) ?? quarterRows[0];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Analytics', href: '/analytics' }, { label: 'Quarterly Review' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Quarterly Review</h1>
            <Badge variant="outline">Legacy Alias</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Review {year} performance by quarter and set pipeline targets Casey can manage against.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="gap-1.5">
              Back to Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/analytics?tab=quarterly">
            <Button variant="outline" size="sm">Canonical Quarterly Tab</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {quarterRows.map((quarter) => (
          <Card key={quarter.quarter} className={quarter.isCurrent ? 'border-cyan-600 shadow-sm' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {quarter.quarter} {year}
                {quarter.isCurrent ? <span className="text-[10px] uppercase text-cyan-600">Current</span> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <MiniMetric label="Sends" value={quarter.sends} icon={Mail} />
                <MiniMetric label="Replies" value={quarter.replies} icon={MessageSquare} />
                <MiniMetric label="Meetings" value={quarter.meetings} icon={Users} />
                <MiniMetric label="Campaigns" value={quarter.campaignsRun} icon={CalendarRange} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Estimated pipeline</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(quarter.estimatedPipeline)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{quarter.dealsClosed} closed this quarter</p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Meeting target progress: {quarter.meetings}/{quarter.goals.meetingTarget || 0}</p>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${percentOf(quarter.meetings, quarter.goals.meetingTarget)}%` }} />
                </div>
                <p>Pipeline target progress: {formatCurrency(quarter.estimatedPipeline)} / {formatCurrency(quarter.goals.pipelineTarget || 0)}</p>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${percentOf(quarter.estimatedPipeline, quarter.goals.pipelineTarget)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Current Quarter Operating Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveQuarterlyGoals} className="space-y-4">
              <input type="hidden" name="quarter" value={activeQuarter.quarter} />
              <input type="hidden" name="year" value={year} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meeting_target">Meeting target</Label>
                  <Input id="meeting_target" name="meeting_target" type="number" min={0} defaultValue={activeQuarter.goals.meetingTarget || 10} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pipeline_target">Pipeline target</Label>
                  <Input id="pipeline_target" name="pipeline_target" type="number" min={0} step={5000} defaultValue={activeQuarter.goals.pipelineTarget || 250000} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="gap-1.5">
                  <Goal className="h-3.5 w-3.5" /> Save {activeQuarter.quarter} Goals
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quarter Focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Keep the board simple: more replies, more meetings, and more pipeline value moving toward proposal.
            </p>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Current quarter</p>
              <p className="mt-1 text-xl font-bold text-foreground">{activeQuarter.quarter} {year}</p>
              <p className="mt-1 text-xs">Sends {activeQuarter.sends} · Replies {activeQuarter.replies} · Meetings {activeQuarter.meetings}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase text-muted-foreground">Pipeline target</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(activeQuarter.goals.pipelineTarget || 0)}</p>
              <p className="mt-1 text-xs">Actual {formatCurrency(activeQuarter.estimatedPipeline)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] uppercase">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
