'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveGeneratedContentRendering } from '@/lib/generated-content/content-rendering';
import { ContentQaChecklistPanel } from '@/components/generated-content/content-qa-checklist-panel';
import { toast } from 'sonner';

type GeneratedContentPreviewDialogProps = {
  accountName: string;
  version: number;
  content: string;
  providerUsed?: string | null;
  generatedContentId?: number;
  campaignType?: string;
  checklistCompletedItemIds?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

function sourceLabel(source: ReturnType<typeof resolveGeneratedContentRendering>['source']) {
  if (source === 'json_one_pager') return 'JSON one-pager';
  if (source === 'html') return 'HTML';
  if (source === 'json_invalid') return 'Malformed JSON';
  if (source === 'json_unknown') return 'JSON (raw)';
  return 'Plain text';
}

export function GeneratedContentPreviewDialog({
  accountName,
  version,
  content,
  providerUsed,
  generatedContentId,
  campaignType,
  checklistCompletedItemIds,
  open,
  onOpenChange,
  trigger,
}: GeneratedContentPreviewDialogProps) {
  const [savingPlaybook, setSavingPlaybook] = useState(false);
  const rendering = resolveGeneratedContentRendering(content, accountName);
  const dialogTrigger = trigger === undefined
    ? (
      <Button variant="outline" size="sm">
        <Eye className="mr-1.5 h-3.5 w-3.5" />
        Preview
      </Button>
    )
    : trigger;

  async function saveAsPlaybookBlock() {
    if (savingPlaybook) return;
    setSavingPlaybook(true);
    try {
      const response = await fetch('/api/revops/playbook-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${accountName} v${version} winning block`,
          body: content,
          blockType: 'story',
          accountName,
          generatedContentId: generatedContentId ?? null,
          stage: campaignType ?? null,
          createdBy: 'Casey',
        }),
      });
      const payload = await response.json().catch(() => ({} as { error?: string }));
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save playbook block');
      toast.success('Saved as playbook block');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save playbook block');
    } finally {
      setSavingPlaybook(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogTrigger ? <DialogTrigger asChild>{dialogTrigger}</DialogTrigger> : null}
      <DialogContent className="max-h-screen max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{accountName} • v{version}</DialogTitle>
          <DialogDescription>Preview the selected generated one-pager version.</DialogDescription>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Provider: {providerUsed ?? 'unknown'}</span>
            <Badge variant="outline">{sourceLabel(rendering.source)}</Badge>
          </div>
        </DialogHeader>
        <div className="rounded-md border bg-slate-50 p-4">
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: rendering.html }}
          />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={saveAsPlaybookBlock} disabled={savingPlaybook}>
            {savingPlaybook ? 'Saving...' : 'Save as Playbook Block'}
          </Button>
        </div>
        {generatedContentId ? (
          <ContentQaChecklistPanel
            generatedContentId={generatedContentId}
            campaignType={campaignType}
            accountName={accountName}
            content={content}
            initialCompleted={checklistCompletedItemIds}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
