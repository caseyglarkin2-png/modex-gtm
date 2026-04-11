import type { ComponentType } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, DollarSign, Mail, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ensureDefaultCampaign } from '@/lib/campaigns';
import { derivePipelineStage, PIPELINE_STAGE_LABELS, type PipelineStage } from '@/lib/pipeline';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign Analytics' };

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default async function CampaignAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureDefaultCampaign();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      email_logs: { orderBy: { sent_at: 'desc' }, take: 100 },
      outreach_waves: { orderBy: [{ wave_order: 'asc' }] },
    },
  });

  if (!campaign) notFound();

  const accountNames = [...new Set([
    ...campaign.outreach_waves.map((wave) => wave.account_name),
    ...campaign.email_logs.map((email) => email.account_name).filter(Boolean),
  ])];

  const [accounts, meetings] = await Promise.all([
    accountNames.length > 0
      ? prisma.account.findMany({
          where: { name: { in: accountNames } },
          select: {
            name: true,
            owner: true,
            priority_score: true,
            priority_band: true,
            outreach_status: true,
            meeting_status: true,
            pipeline_stage: true,
          },
        })
      : Promise.resolve([]),
    accountNames.length > 0
      ? prisma.meeting.findMany({
          where: { account_name: { in: accountNames } },
          select: { account_name: true, meeting_status: true, created_at: true },
        })
      : Promise.resolve([]),
  ]);

  const sent = campaign.email_logs.length;
  const delivered = campaign.email_logs.filter((email) => email.status !== 'bounced').length;
  const opened = campaign.email_logs.reduce((sum, email) => sum + (email.open_count ?? 0), 0);
  const replies = campaign.email_logs.reduce((sum, email) => sum + (email.reply_count ?? 0), 0);
  const meetingsBooked = meetings.filter((meeting) => (meeting.meeting_status ?? '').toLowerCase() !== 'no meeting').length;
  const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
  const replyRate = sent > 0 ? (replies / sent) * 100 : 0;
  const estimatedPipeline = accounts
    .filter((account) => {
      const stage = derivePipelineStage(account as { pipeline_stage?: string | null; outreach_status?: string | null; meeting_status?: string | null });
      return ['meeting', 'proposal', 'closed'].includes(stage);
    })
    .reduce((sum, account) => sum + Math.max(10000, (account.priority_score ?? 0) * 1000), 0);

  const stageCounts = accounts.reduce<Record<PipelineStage, number>>((acc, account) => {
    const stage = derivePipelineStage(account as { pipeline_stage?: string | null; outreach_status?: string | null; meeting_status?: string | null });
    acc[stage] += 1;
    return acc;
  }, {
    targeted: 0,
    contacted: 0,
    engaged: 0,
    meeting: 0,
    proposal: 0,
    closed: 0,
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Campaigns', href: '/campaigns' },
        { label: campaign.name, href: `/campaigns/${campaign.slug}` },
        { label: 'Analytics' },
      ]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Analytics</h1>
          <p className="text-sm text-muted-foreground">
            {campaign.name} performance by send volume, replies, meetings, and estimated pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
          <Link href={`/campaigns/${campaign.slug}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              Campaign Detail <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Sends" value={sent} icon={Mail} sublabel={`${delivered} delivered`} />
        <MetricCard label="Open Rate" value={formatPercent(openRate)} icon={TrendingUp} sublabel={`${opened} total opens`} />
        <MetricCard label="Reply Rate" value={formatPercent(replyRate)} icon={MessageSquare} sublabel={`${replies} replies`} />
        <MetricCard label="Meetings" value={meetingsBooked} icon={Users} sublabel="booked or held" />
        <MetricCard label="Estimated Pipeline" value={formatCurrency(estimatedPipeline)} icon={DollarSign} sublabel="active deal value" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pipeline Generated</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {(Object.entries(stageCounts) as Array<[PipelineStage, number]>).map(([stage, count]) => (
              <div key={stage} className="rounded-lg border p-3 text-sm">
                <p className="text-[10px] uppercase text-muted-foreground">{PIPELINE_STAGE_LABELS[stage]}</p>
                <p className="mt-1 text-2xl font-bold">{count}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Campaign Sends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaign.email_logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No email activity has been linked to this campaign yet.</p>
            ) : (
              campaign.email_logs.slice(0, 8).map((email) => (
                <div key={email.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{email.subject}</p>
                    <Badge variant={email.status === 'bounced' ? 'destructive' : 'secondary'}>{email.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{email.to_email} · {new Date(email.sent_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Accounts in Motion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts linked yet. Connect waves or send emails from this campaign.</p>
          ) : (
            accounts.map((account) => {
              const stage = derivePipelineStage(account as { pipeline_stage?: string | null; outreach_status?: string | null; meeting_status?: string | null });
              return (
                <div key={account.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">Owner {account.owner || 'Casey'} · Score {account.priority_score ?? 0}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Band {account.priority_band ?? 'D'}</Badge>
                    <Badge>{PIPELINE_STAGE_LABELS[stage]}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
          </div>
          <div className="rounded-lg bg-[var(--accent)] p-2.5">
            <Icon className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
