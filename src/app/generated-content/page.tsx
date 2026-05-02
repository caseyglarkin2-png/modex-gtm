import { Breadcrumb } from '@/components/breadcrumb';
import { GeneratedContentWorkspace } from '@/components/generated-content/generated-content-workspace';
import { fetchGeneratedContentWorkspaceData } from '@/lib/generated-content/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Generated Content' };

export default async function GeneratedContentPage() {
  const { cards, recipientsByAccount } = await fetchGeneratedContentWorkspaceData();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/' }, { label: 'Generated Content' }]} />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generated Content</h1>
        <p className="text-sm text-muted-foreground">
          Review generated one-pagers, filter by campaign/provider, publish drafts, and send directly.
        </p>
      </div>

      <GeneratedContentWorkspace cards={cards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
