import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCampaignSummaries } from '@/lib/campaigns';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Outreach Waves (Legacy Alias)' };

export default async function WavesAliasPage() {
  const campaigns = await getCampaignSummaries();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'Outreach Waves (Legacy)' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Waves (Legacy Alias)</h1>
          <p className="text-sm text-muted-foreground">
            Waves now live inside Campaigns. This legacy route remains reachable for compatibility.
          </p>
        </div>
        <Link href="/campaigns?legacy=waves">
          <Button size="sm">Open Canonical Campaigns</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          {campaigns.slice(0, 8).map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.slug}?legacy=waves`}
              className="rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              {campaign.name}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
