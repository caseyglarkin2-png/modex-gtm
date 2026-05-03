import Link from 'next/link';
import { Breadcrumb } from '@/components/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Campaign HQ (Legacy Alias)' };

export default function CampaignHqAliasPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Campaigns', href: '/campaigns' }, { label: 'Campaign HQ (Legacy)' }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign HQ (Legacy Alias)</h1>
          <p className="text-sm text-muted-foreground">
            Campaign HQ was consolidated into canonical Campaign workspaces. Use Campaigns as the primary destination.
          </p>
        </div>
        <Link href="/campaigns?legacy=campaign-hq">
          <Button size="sm">Open Canonical Campaigns</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
          <p>
            Legacy deep-links still resolve, but campaign operations now live under the canonical Campaigns module.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/campaigns">
              <Button size="sm" variant="outline">Campaign List</Button>
            </Link>
            <Link href="/campaigns/new">
              <Button size="sm" variant="outline">New Campaign</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
