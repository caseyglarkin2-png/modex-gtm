import { GeneratedContentWorkspace } from '@/components/generated-content/generated-content-workspace';
import type { fetchGeneratedContentWorkspaceData } from '@/lib/generated-content/queries';

type WorkspaceData = Awaited<ReturnType<typeof fetchGeneratedContentWorkspaceData>>;

type GeneratedContentTabProps = {
  cards: WorkspaceData['cards'];
  recipientsByAccount: WorkspaceData['recipientsByAccount'];
};

export function GeneratedContentTab({ cards, recipientsByAccount }: GeneratedContentTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Generated Content</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Review generated one-pagers, filter by campaign/provider, publish drafts, and send directly.
        </p>
      </div>
      <GeneratedContentWorkspace cards={cards} recipientsByAccount={recipientsByAccount} />
    </div>
  );
}
