import Link from 'next/link';
import { ArrowRight, CalendarRange, Mail, Target } from 'lucide-react';
import { Breadcrumb } from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCampaignSummaries } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaigns' };

function formatDateRange(start?: Date | null, end?: Date | null) {
  if (!start && !end) return 'Dates not set';
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const left = start ? formatter.format(start) : 'TBD';
  const right = end ? formatter.format(end) : 'TBD';
  return `${left} - ${right}`;
}

export default async function CampaignsPage() {
  const campaigns = await getCampaignSummaries();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Campaigns' }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Track active outreach motions as first-class campaigns instead of one-off waves.
          </p>
        </div>
        <Badge className="bg-cyan-600 text-white">Year-round GTM mode</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Campaign Count</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{campaigns.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Active</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-emerald-600">{campaigns.filter((campaign) => campaign.status === 'active').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Target Accounts</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{campaigns.reduce((sum, campaign) => sum + campaign.target_account_count, 0)}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{campaign.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{campaign.campaign_type.replace(/_/g, ' ')} · {formatDateRange(campaign.start_date, campaign.end_date)}</p>
                </div>
                <Badge variant={campaign.status === 'active' ? 'default' : 'outline'}>{campaign.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{campaign.messaging_angle || 'No messaging angle set yet.'}</p>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Waves</p>
                  <p className="mt-1 text-xl font-bold">{campaign._count.outreach_waves}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Emails</p>
                  <p className="mt-1 text-xl font-bold">{campaign._count.email_logs}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-[10px] uppercase text-muted-foreground">Activity</p>
                  <p className="mt-1 text-xl font-bold">{campaign._count.activities}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Target className="h-3.5 w-3.5" /> {campaign.target_account_count} targets</span>
                <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {campaign.owner}</span>
                <span className="inline-flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" /> updated {new Date(campaign.updated_at).toLocaleDateString()}</span>
              </div>
              <Link href={`/campaigns/${campaign.slug}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Open Campaign <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
