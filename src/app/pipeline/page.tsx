import type { ComponentType } from 'react';
import { ArrowRight, GitBranch, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { derivePipelineStage, PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type PipelineStage } from '@/lib/pipeline';
import { PipelineBoard, type PipelineAccountCard } from './pipeline-board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pipeline' };

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default async function PipelinePage() {
  const [accounts, recentEmails] = await Promise.all([
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

  const total = cards.length;
  const stageCounts = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, cards.filter((card) => card.stage === stage).length]),
  ) as Record<PipelineStage, number>;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Pipeline' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Board</h1>
          <p className="text-sm text-muted-foreground">
            A daily operating view for moving accounts from targeted to closed without leaving the app.
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

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Accounts in Play" value={total} icon={Target} />
        <MetricCard label="Active Conversations" value={stageCounts.engaged + stageCounts.meeting + stageCounts.proposal} icon={TrendingUp} />
        <MetricCard label="Meetings / Proposal" value={stageCounts.meeting + stageCounts.proposal} icon={GitBranch} />
        <MetricCard label="Closed" value={stageCounts.closed} icon={Target} />
      </div>

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

      <PipelineBoard accounts={cards} />
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
