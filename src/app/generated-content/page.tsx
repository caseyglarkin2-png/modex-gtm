import { Breadcrumb } from '@/components/breadcrumb';
import { GeneratedContentWorkspace } from '@/components/generated-content/generated-content-workspace';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchGeneratedContentWorkspaceData } from '@/lib/generated-content/queries';
import { ArrowRight, Library, Send } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generated Content' };

export default async function GeneratedContentPage() {
  const { cards, recipientsByAccount } = await fetchGeneratedContentWorkspaceData();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Content Studio', href: '/studio' }, { label: 'Generated Content' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generated Content</h1>
        <p className="text-sm text-muted-foreground">
          Review generated one-pagers, filter by campaign/provider, publish drafts, and send directly.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-muted-foreground">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Library className="h-4 w-4" /> Content Studio / Library
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Send className="h-4 w-4" /> Send Readiness
            </span>
            <span>This legacy route is now the generated-content slice of Content Studio.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/studio?tab=library">
              <Button variant="outline" size="sm" className="gap-1.5">
                Studio Library <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
            <Link href="/studio?tab=send-readiness">
              <Button size="sm" className="gap-1.5">
                Send Readiness <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <GeneratedContentWorkspace cards={cards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
