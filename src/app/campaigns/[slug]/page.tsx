import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { ensureDefaultCampaign } from '@/lib/campaigns';
import { CampaignControls } from './campaign-controls';

export const dynamic = 'force-dynamic';

export default async function CampaignDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureDefaultCampaign();

  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      outreach_waves: {
        orderBy: [{ wave_order: 'asc' }],
        take: 10,
      },
      email_logs: {
        orderBy: { sent_at: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          outreach_waves: true,
          email_logs: true,
          activities: true,
          generated_content: true,
        },
      },
    },
  });

  if (!campaign) notFound();

  const campaignSettings = campaign.key_dates && typeof campaign.key_dates === 'object' && !Array.isArray(campaign.key_dates)
    ? (campaign.key_dates as Record<string, unknown>)
    : {};
  const cadence = Array.isArray(campaignSettings.suggestedIntervals)
    ? (campaignSettings.suggestedIntervals as Array<number | string>).join(', ')
    : 'Not configured';
  const automationPaused = Boolean(campaignSettings.automationPaused) || campaign.status === 'paused';

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: campaign.name }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.campaign_type.replace(/_/g, ' ')} · owner {campaign.owner}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
          <Link href={`/campaigns/${campaign.slug}/analytics`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Target Accounts" value={campaign.target_account_count} />
        <StatCard label="Waves" value={campaign._count.outreach_waves} />
        <StatCard label="Emails" value={campaign._count.email_logs} />
        <StatCard label="Activity" value={campaign._count.activities} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Messaging Angle</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{campaign.messaging_angle || 'No messaging angle set yet.'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cadence & Automation</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Template: {String(campaignSettings.templateKey ?? 'manual')}</p>
            <p>Touches: {String(campaignSettings.touchCount ?? 'Not set')}</p>
            <p>Suggested intervals: {cadence} days</p>
            <p>AI angle: {String(campaignSettings.aiPromptAngle ?? 'No AI angle configured')}</p>
            <p>Automation status: {automationPaused ? 'Paused' : 'Running'}</p>
            <CampaignControls slug={campaign.slug} status={campaign.status} paused={automationPaused} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Linked Waves</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {campaign.outreach_waves.length === 0 ? (
              <p className="text-sm text-muted-foreground">No waves linked yet.</p>
            ) : (
              campaign.outreach_waves.map((wave) => (
                <div key={wave.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{wave.wave}</p>
                    <Badge variant="outline">{wave.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{wave.account_name} · order {wave.wave_order}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Sends</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {campaign.email_logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No email logs linked yet.</p>
            ) : (
              campaign.email_logs.map((email) => (
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
      <CardContent><p className="text-3xl font-bold">{value}</p></CardContent>
    </Card>
  );
}
